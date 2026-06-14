import type { Car, InputState, Track } from './types';
import { clamp, pointToSegmentDist } from '../utils/math';

export const updateCarPhysics = (
  car: Car,
  input: InputState,
  dt: number,
  track: Track
) => {
  if (car.finished) return;

  if (car.spinTime > 0) {
    car.spinTime -= dt;
    car.angle += 0.15;
    car.speed *= 0.95;
  } else {
    let maxSpeed = car.maxSpeed;
    let accel = car.acceleration;

    if (car.boostTime > 0) {
      car.boostTime -= dt;
      maxSpeed *= 1.5;
      accel *= 1.8;
    }
    if (car.shieldTime > 0) {
      car.shieldTime -= dt;
      if (car.shieldTime <= 0) car.hasShield = false;
    }

    if (input.up) {
      car.speed = clamp(car.speed + accel, -maxSpeed * 0.3, maxSpeed);
    }
    if (input.down) {
      car.speed = clamp(car.speed - accel * 0.6, -maxSpeed * 0.4, maxSpeed);
    }

    car.speed *= car.friction;

    const absSpeed = Math.abs(car.speed);
    const turnFactor = clamp(absSpeed / (maxSpeed * 0.5), 0.2, 1);
    let steerSpeed = car.handling * turnFactor * Math.sign(car.speed || 1);

    const isDrifting = input.shift && absSpeed > maxSpeed * 0.4 && (input.left || input.right);
    car.drifting = isDrifting;

    if (isDrifting) {
      steerSpeed *= 1.6;
      car.driftAngle = clamp(car.driftAngle + (input.left ? -0.02 : 0.02), -0.5, 0.5);
    } else {
      car.driftAngle *= 0.9;
    }

    if (input.left) car.angle -= steerSpeed;
    if (input.right) car.angle += steerSpeed;
  }

  const moveAngle = car.angle + car.driftAngle;
  const newX = car.x + Math.cos(moveAngle) * car.speed;
  const newY = car.y + Math.sin(moveAngle) * car.speed;

  const { dist: trackDist } = nearestTrackDist(newX, newY, track);
  const halfWidth = track.width / 2;

  if (trackDist < halfWidth - 2) {
    car.x = newX;
    car.y = newY;
    if (isInBoostZone(newX, newY, track) && car.spinTime <= 0) {
      car.speed = clamp(car.speed + 0.08, 0, car.maxSpeed * 1.5);
    }
  } else {
    car.speed *= 0.94;
    const pushBack = 0.5;
    car.x += (newX - car.x) * 0.3;
    car.y += (newY - car.y) * 0.3;
    void pushBack;
  }

  if (car.drifting) {
    car.tireMarkTimer += dt;
  }
};

export const nearestTrackDist = (x: number, y: number, track: Track): { dist: number; nearestIdx: number } => {
  let minDist = Infinity;
  let nearestIdx = 0;
  const pts = track.points;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const { dist } = pointToSegmentDist(x, y, p1.x, p1.y, p2.x, p2.y);
    if (dist < minDist) {
      minDist = dist;
      nearestIdx = i;
    }
  }
  return { dist: minDist, nearestIdx };
};

export const isInBoostZone = (x: number, y: number, track: Track): boolean => {
  const { nearestIdx } = nearestTrackDist(x, y, track);
  return track.boostZones.some((z) => {
    const diff = Math.abs(z - nearestIdx);
    return diff <= 1 || diff >= track.points.length - 1;
  });
};

export const nearestTrackIdx = (x: number, y: number, track: Track): number => {
  return nearestTrackDist(x, y, track).nearestIdx;
};

export const checkCarCollision = (car: Car, other: Car): boolean => {
  const dx = car.x - other.x;
  const dy = car.y - other.y;
  const r = 18;
  return dx * dx + dy * dy < (r + r) * (r + r);
};

export const resolveCarCollision = (car: Car, other: Car) => {
  const dx = car.x - other.x;
  const dy = car.y - other.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const overlap = 36 - dist;
  if (overlap > 0) {
    const nx = dx / dist;
    const ny = dy / dist;
    car.x += nx * overlap * 0.5;
    car.y += ny * overlap * 0.5;
    other.x -= nx * overlap * 0.5;
    other.y -= ny * overlap * 0.5;
    const relSpeed = (car.speed - other.speed) * 0.3;
    car.speed -= relSpeed * 0.5;
    other.speed += relSpeed * 0.5;
  }
};
