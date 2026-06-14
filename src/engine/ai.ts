import type { Car, InputState, Track } from './types';
import { normalizeAngle, angleDiff } from '../utils/math';
import { nearestTrackIdx } from './physics';

export const updateAI = (car: Car, track: Track, dt: number): InputState => {
  const input: InputState = {
    up: false, down: false, left: false, right: false, space: false, shift: false,
  };
  if (car.finished) return input;

  const currentIdx = nearestTrackIdx(car.x, car.y, track);
  const lookAhead = Math.floor(8 + car.aiSkill * 5);
  const targetIdx = (currentIdx + lookAhead) % track.points.length;
  const target = track.points[targetIdx];

  const desiredAngle = Math.atan2(target.y - car.y, target.x - car.x);
  const diff = angleDiff(desiredAngle, car.angle);

  const absDiff = Math.abs(diff);
  input.up = true;

  const turnThreshold = 0.08;
  if (absDiff > turnThreshold) {
    if (diff < 0) input.left = true;
    else input.right = true;
  }

  if (absDiff > 0.8) {
    input.up = car.speed < car.maxSpeed * 0.35;
  } else if (absDiff > 0.4) {
    input.up = car.speed < car.maxSpeed * 0.7;
  }

  if (absDiff > 0.25 && car.speed > car.maxSpeed * 0.5 && car.aiSkill > 0.5) {
    input.shift = true;
  }

  car.aiTargetIdx = targetIdx;

  if (car.itemCooldown > 0) {
    car.itemCooldown -= dt;
  } else if (car.currentItem && Math.random() < 0.01 * car.aiSkill) {
    input.space = true;
    car.itemCooldown = 2000;
  }
  void normalizeAngle;

  return input;
};
