import type { Track, TrackPoint, CustomTrack } from './types';

const generateOvalTrack = (cx: number, cy: number, rx: number, ry: number, segments: number): TrackPoint[] => {
  const pts: TrackPoint[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const wobble = Math.sin(t * 3) * 30;
    pts.push({
      x: cx + Math.cos(t) * (rx + wobble),
      y: cy + Math.sin(t) * (ry + wobble * 0.6),
    });
  }
  return pts;
};

const TRACK_WIDTH = 120;
const CENTER_X = 1000;
const CENTER_Y = 800;

export const MAIN_TRACK: Track = {
  name: 'Pixel Circuit',
  width: TRACK_WIDTH,
  points: generateOvalTrack(CENTER_X, CENTER_Y, 600, 400, 80),
  checkpoints: [0, 20, 40, 60],
  boostZones: [8, 9, 10, 11, 28, 29, 30, 31, 48, 49, 50, 51, 68, 69, 70, 71],
  itemBoxes: [4, 14, 24, 34, 44, 54, 64, 74],
};

const catmullRom = (p0: TrackPoint, p1: TrackPoint, p2: TrackPoint, p3: TrackPoint, t: number): TrackPoint => {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
};

export const interpolateTrackPoints = (
  controlPoints: TrackPoint[],
  segmentsPerSpan: number,
  closed: boolean
): TrackPoint[] => {
  if (controlPoints.length < 2) return [...controlPoints];

  const result: TrackPoint[] = [];
  const n = controlPoints.length;
  const getPoint = (i: number): TrackPoint => {
    if (closed) {
      return controlPoints[((i % n) + n) % n];
    }
    if (i < 0) return controlPoints[0];
    if (i >= n) return controlPoints[n - 1];
    return controlPoints[i];
  };

  const limit = closed ? n : n - 1;
  for (let i = 0; i < limit; i++) {
    const p0 = getPoint(i - 1);
    const p1 = getPoint(i);
    const p2 = getPoint(i + 1);
    const p3 = getPoint(i + 2);
    for (let j = 0; j < segmentsPerSpan; j++) {
      const t = j / segmentsPerSpan;
      result.push(catmullRom(p0, p1, p2, p3, t));
    }
  }
  if (closed) {
    result.push(catmullRom(getPoint(limit - 1), getPoint(limit), getPoint(0), getPoint(1), 0));
  } else {
    result.push({ ...controlPoints[n - 1] });
  }
  return result;
};

const mapEditorIndexToInterpolated = (
  editorIdx: number,
  segmentsPerSpan: number,
  controlCount: number,
  closed: boolean
): number => {
  if (closed) {
    return (editorIdx * segmentsPerSpan) % (controlCount * segmentsPerSpan);
  }
  return Math.min(editorIdx * segmentsPerSpan, controlCount * segmentsPerSpan);
};

export const buildTrackFromCustom = (custom: CustomTrack): Track => {
  const SEGMENTS = 12;
  const controlPts = custom.points.length >= 3 ? custom.points : [
    { x: 800, y: 600 }, { x: 1000, y: 500 }, { x: 1200, y: 600 }, { x: 1200, y: 800 }, { x: 1000, y: 900 }, { x: 800, y: 800 },
  ];
  const points = interpolateTrackPoints(controlPts, SEGMENTS, custom.closed);
  const controlCount = controlPts.length;

  const hasStartCheckpoint = custom.checkpoints.includes(0);
  const checkpoints = custom.checkpoints.length > 0
    ? custom.checkpoints.map((i) => mapEditorIndexToInterpolated(i, SEGMENTS, controlCount, custom.closed))
    : [0];
  if (!hasStartCheckpoint && !checkpoints.includes(0)) {
    checkpoints.unshift(0);
  }
  checkpoints.sort((a, b) => a - b);

  const expandRange = (indices: number[], range: number): number[] => {
    const result: Set<number> = new Set();
    indices.forEach((idx) => {
      const mapped = mapEditorIndexToInterpolated(idx, SEGMENTS, controlCount, custom.closed);
      for (let r = -range; r <= range; r++) {
        let val = mapped + r;
        if (custom.closed) {
          val = ((val % points.length) + points.length) % points.length;
        } else {
          val = Math.max(0, Math.min(points.length - 1, val));
        }
        result.add(val);
      }
    });
    return Array.from(result).sort((a, b) => a - b);
  };

  return {
    name: custom.name || 'Custom Track',
    width: custom.width,
    points,
    checkpoints,
    boostZones: expandRange(custom.boostZones, 2),
    itemBoxes: custom.itemBoxes.map((i) => mapEditorIndexToInterpolated(i, SEGMENTS, controlCount, custom.closed)),
  };
};

export const getStartPositions = (track: Track, count: number) => {
  const startIdx = 0;
  const nextIdx = 1;
  const p1 = track.points[startIdx];
  const p2 = track.points[nextIdx];
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  const positions: { x: number; y: number; angle: number }[] = [];
  const half = Math.ceil(count / 2);
  for (let i = 0; i < count; i++) {
    const row = i % half;
    const col = Math.floor(i / half);
    const offsetX = -col * 60 - 30;
    const offsetY = (row - (half - 1) / 2) * 45;
    positions.push({
      x: p1.x + Math.cos(angle) * offsetX + perpX * offsetY,
      y: p1.y + Math.sin(angle) * offsetX + perpY * offsetY,
      angle,
    });
  }
  return positions;
};

export const getItemBoxPositions = (track: Track): { x: number; y: number }[] => {
  return track.itemBoxes.map((idx) => track.points[idx]);
};
