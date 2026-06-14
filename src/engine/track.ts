import type { Track, TrackPoint } from './types';

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
