import type {
  Car, ItemBoxInstance, BananaInstance, MissileInstance, ItemType, Particle, Track,
} from './types';
import { pickRandom, dist, angleDiff, randRange } from '../utils/math';

const ITEM_TYPES: ItemType[] = ['boost', 'shield', 'banana', 'missile'];

export const randomItem = (): ItemType => pickRandom(ITEM_TYPES);

export const tryCollectItemBox = (
  car: Car,
  boxes: ItemBoxInstance[]
): boolean => {
  if (car.currentItem) return false;
  for (const box of boxes) {
    if (box.collected) continue;
    if (dist(car.x, car.y, box.x, box.y) < 55) {
      box.collected = true;
      box.respawnTimer = 5000;
      car.currentItem = randomItem();
      return true;
    }
  }
  return false;
};

export const updateItemBoxes = (boxes: ItemBoxInstance[], dt: number) => {
  for (const box of boxes) {
    if (box.collected) {
      box.respawnTimer -= dt;
      if (box.respawnTimer <= 0) {
        box.collected = false;
      }
    }
  }
};

export const activateItem = (
  car: Car,
  allCars: Car[],
  bananas: BananaInstance[],
  missiles: MissileInstance[],
  particles: Particle[]
): ItemType | null => {
  const item = car.currentItem;
  if (!item) return null;
  car.currentItem = null;

  let backAngle: number;
  let target: Car | null;

  switch (item) {
    case 'boost':
      car.boostTime = 3000;
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: car.x, y: car.y,
          vx: randRange(-1, 1), vy: randRange(-1, 1),
          life: 400, maxLife: 400, color: '#ffdd00', size: 3,
        });
      }
      break;
    case 'shield':
      car.hasShield = true;
      car.shieldTime = 8000;
      break;
    case 'banana':
      backAngle = car.angle + Math.PI;
      bananas.push({
        x: car.x + Math.cos(backAngle) * 25,
        y: car.y + Math.sin(backAngle) * 25,
        angle: car.angle,
        active: true,
        ownerId: car.id,
      });
      break;
    case 'missile':
      target = findCarAhead(car, allCars);
      if (target) {
        missiles.push({
          x: car.x, y: car.y,
          angle: car.angle,
          speed: 8,
          targetId: target.id,
          active: true,
          ownerId: car.id,
          life: 4000,
        });
      }
      break;
  }
  return item;
};

const findCarAhead = (car: Car, allCars: Car[]): Car | null => {
  let best: Car | null = null;
  let bestScore = Infinity;
  for (const other of allCars) {
    if (other.id === car.id || other.finished) continue;
    const dx = other.x - car.x;
    const dy = other.y - car.y;
    const forward = Math.cos(car.angle) * dx + Math.sin(car.angle) * dy;
    if (forward > 0 && forward < 400) {
      const perp = Math.abs(-Math.sin(car.angle) * dx + Math.cos(car.angle) * dy);
      const score = forward + perp * 0.5;
      if (score < bestScore) {
        bestScore = score;
        best = other;
      }
    }
  }
  return best;
};

export const updateBananas = (
  bananas: BananaInstance[],
  cars: Car[],
  particles: Particle[],
  dt: number
) => {
  for (const b of bananas) {
    if (!b.active) continue;
    for (const car of cars) {
      if (car.id === b.ownerId) continue;
      if (dist(car.x, car.y, b.x, b.y) < 22) {
        if (car.hasShield) {
          car.hasShield = false;
          car.shieldTime = 0;
          for (let i = 0; i < 6; i++) {
            particles.push({
              x: car.x, y: car.y,
              vx: randRange(-2, 2), vy: randRange(-2, 2),
              life: 300, maxLife: 300, color: '#33ccff', size: 3,
            });
          }
        } else {
          car.spinTime = 800;
          car.speed *= 0.4;
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: car.x, y: car.y,
              vx: randRange(-3, 3), vy: randRange(-3, 3),
              life: 500, maxLife: 500, color: '#ffee33', size: 3,
            });
          }
        }
        b.active = false;
        break;
      }
    }
  }
  void dt;
};

export const updateMissiles = (
  missiles: MissileInstance[],
  cars: Car[],
  particles: Particle[],
  dt: number
) => {
  for (const m of missiles) {
    if (!m.active) continue;
    m.life -= dt;
    if (m.life <= 0) { m.active = false; continue; }

    const target = cars.find((c) => c.id === m.targetId && !c.finished);
    if (target) {
      const desired = Math.atan2(target.y - m.y, target.x - m.x);
      const diff = angleDiff(desired, m.angle);
      m.angle += Math.max(-0.1, Math.min(0.1, diff));
    }

    m.x += Math.cos(m.angle) * m.speed;
    m.y += Math.sin(m.angle) * m.speed;

    particles.push({
      x: m.x - Math.cos(m.angle) * 6,
      y: m.y - Math.sin(m.angle) * 6,
      vx: randRange(-0.3, 0.3), vy: randRange(-0.3, 0.3),
      life: 200, maxLife: 200, color: '#ff6600', size: 2,
    });

    for (const car of cars) {
      if (car.id === m.ownerId) continue;
      if (dist(car.x, car.y, m.x, m.y) < 22) {
        if (car.hasShield) {
          car.hasShield = false;
          car.shieldTime = 0;
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: car.x, y: car.y,
              vx: randRange(-2, 2), vy: randRange(-2, 2),
              life: 400, maxLife: 400, color: '#33ccff', size: 3,
            });
          }
        } else {
          car.spinTime = 1200;
          car.speed *= 0.3;
          for (let i = 0; i < 16; i++) {
            particles.push({
              x: car.x, y: car.y,
              vx: randRange(-4, 4), vy: randRange(-4, 4),
              life: 600, maxLife: 600, color: '#ff4400', size: 4,
            });
          }
        }
        m.active = false;
        break;
      }
    }
  }
};

export const updateParticles = (particles: Particle[], dt: number) => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
  }
};

export const createItemBoxes = (track: Track): ItemBoxInstance[] => {
  return track.itemBoxes.map((idx, i) => ({
    idx: i,
    x: track.points[idx].x,
    y: track.points[idx].y,
    collected: false,
    respawnTimer: 0,
  }));
};
