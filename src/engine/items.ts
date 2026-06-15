import type {
  Car, ItemBoxInstance, BananaInstance, MissileInstance, ItemType, Particle, Track,
  MineInstance, LightningInstance,
} from './types';
import { pickRandom, dist, angleDiff, randRange } from '../utils/math';
import { nearestTrackDistSameZ } from './physics';

const ITEM_TYPES: ItemType[] = ['boost', 'shield', 'banana', 'missile', 'mine', 'shrink', 'giant', 'lightning', 'ghost', 'magnet', 'hyperboost'];

export const randomItem = (): ItemType => pickRandom(ITEM_TYPES);

export const tryCollectItemBox = (
  car: Car,
  boxes: ItemBoxInstance[],
  track: Track,
): boolean => {
  if (car.currentItem) return false;
  const carZ = Math.round(car.z);
  for (const box of boxes) {
    if (box.collected) continue;
    const boxNearest = nearestTrackDistSameZ(box.x, box.y, track, carZ);
    if (boxNearest.dist >= track.width) continue;
    const collectRadius = car.hasMagnet ? 120 : 55;
    if (dist(car.x, car.y, box.x, box.y) < collectRadius) {
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
  particles: Particle[],
  mines: MineInstance[] = [],
  lightnings: LightningInstance[] = []
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
    case 'hyperboost':
      car.hyperBoostTime = 5000;
      car.boostTime = 5000;
      for (let i = 0; i < 16; i++) {
        particles.push({
          x: car.x, y: car.y,
          vx: randRange(-3, 3), vy: randRange(-3, 3),
          life: 600, maxLife: 600,
          color: i % 2 === 0 ? '#ff00ff' : '#00ffff', size: 4,
        });
      }
      break;
    case 'shield':
      car.hasShield = true;
      car.shieldTime = 8000;
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        particles.push({
          x: car.x + Math.cos(angle) * 20,
          y: car.y + Math.sin(angle) * 20,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          life: 400, maxLife: 400, color: '#33ccff', size: 3,
        });
      }
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
    case 'mine':
      backAngle = car.angle + Math.PI;
      mines.push({
        x: car.x + Math.cos(backAngle) * 30,
        y: car.y + Math.sin(backAngle) * 30,
        angle: car.angle,
        active: true,
        ownerId: car.id,
        armed: false,
        armTimer: 1500,
      });
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: car.x + Math.cos(backAngle) * 30,
          y: car.y + Math.sin(backAngle) * 30,
          vx: randRange(-1, 1), vy: randRange(-1, 1),
          life: 300, maxLife: 300, color: '#ff4444', size: 3,
        });
      }
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
    case 'shrink':
      car.scale = 0.5;
      car.scaleTime = 8000;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
          x: car.x, y: car.y,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          life: 400, maxLife: 400, color: '#88ff88', size: 3,
        });
      }
      break;
    case 'giant':
      car.scale = 1.8;
      car.scaleTime = 8000;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        particles.push({
          x: car.x, y: car.y,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          life: 500, maxLife: 500, color: '#ff8844', size: 4,
        });
      }
      break;
    case 'lightning':
      target = findLeaderCar(car, allCars);
      if (target && target.id !== car.id) {
        lightnings.push({
          targetId: target.id,
          active: true,
          ownerId: car.id,
          life: 1500,
          strikeProgress: 0,
        });
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: car.x + randRange(-20, 20),
            y: car.y - 50 - randRange(0, 100),
            vx: randRange(-1, 1), vy: randRange(-2, 0),
            life: 600, maxLife: 600,
            color: i % 2 === 0 ? '#ffff00' : '#ffffff', size: 3,
          });
        }
      }
      break;
    case 'ghost':
      car.isGhost = true;
      car.ghostTime = 6000;
      for (let i = 0; i < 12; i++) {
        particles.push({
          x: car.x, y: car.y,
          vx: randRange(-2, 2), vy: randRange(-2, 2),
          life: 500, maxLife: 500, color: '#aa88ff', size: 3,
        });
      }
      break;
    case 'magnet':
      car.hasMagnet = true;
      car.magnetTime = 10000;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
          x: car.x + Math.cos(angle) * 15,
          y: car.y + Math.sin(angle) * 15,
          vx: Math.cos(angle) * 1.5,
          vy: Math.sin(angle) * 1.5,
          life: 400, maxLife: 400, color: '#ff4488', size: 3,
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

const findLeaderCar = (car: Car, allCars: Car[]): Car | null => {
  let best: Car | null = null;
  let bestProgress = -1;
  for (const other of allCars) {
    if (other.finished) continue;
    const progress = other.lap * 10000 + other.checkpoint;
    if (progress > bestProgress) {
      bestProgress = progress;
      best = other;
    }
  }
  return best;
};

export const updateBananas = (
  bananas: BananaInstance[],
  cars: Car[],
  particles: Particle[],
  track: Track,
  dt: number
) => {
  for (const b of bananas) {
    if (!b.active) continue;
    const bNearest = nearestTrackDistSameZ(b.x, b.y, track, 0);
    const bZ = Math.round(track.points[bNearest.nearestIdx].z ?? 0);
    for (const car of cars) {
      if (car.id === b.ownerId) continue;
      if (car.isGhost) continue;
      if (Math.round(car.z) !== bZ) continue;
      const hitRadius = 22 * car.scale;
      if (dist(car.x, car.y, b.x, b.y) < hitRadius) {
        if (car.hasShield) {
          car.hasShield = false;
          car.shieldTime = 0;
          for (let i = 0; i < 6; i++) {
            particles.push({
              x: car.x, y: car.y, z: car.z,
              vx: randRange(-2, 2), vy: randRange(-2, 2),
              life: 300, maxLife: 300, color: '#33ccff', size: 3,
            });
          }
        } else {
          car.spinTime = 800;
          car.speed *= 0.4;
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: car.x, y: car.y, z: car.z,
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

export const updateMines = (
  mines: MineInstance[],
  cars: Car[],
  particles: Particle[],
  track: Track,
  dt: number
) => {
  for (const m of mines) {
    if (!m.active) continue;

    if (!m.armed) {
      m.armTimer -= dt;
      if (m.armTimer <= 0) {
        m.armed = true;
      }
      continue;
    }

    const mNearest = nearestTrackDistSameZ(m.x, m.y, track, 0);
    const mZ = Math.round(track.points[mNearest.nearestIdx].z ?? 0);

    for (const car of cars) {
      if (car.id === m.ownerId) continue;
      if (car.isGhost) continue;
      if (Math.round(car.z) !== mZ) continue;
      const hitRadius = 28 * car.scale;
      if (dist(car.x, car.y, m.x, m.y) < hitRadius) {
        if (car.hasShield) {
          car.hasShield = false;
          car.shieldTime = 0;
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: car.x, y: car.y, z: car.z,
              vx: randRange(-3, 3), vy: randRange(-3, 3),
              life: 400, maxLife: 400, color: '#33ccff', size: 3,
            });
          }
        } else {
          car.spinTime = 1500;
          car.speed *= 0.2;
          const angle = Math.atan2(car.y - m.y, car.x - m.x);
          car.x += Math.cos(angle) * 20;
          car.y += Math.sin(angle) * 20;
          for (let i = 0; i < 24; i++) {
            const pAngle = (i / 24) * Math.PI * 2;
            particles.push({
              x: m.x, y: m.y, z: car.z,
              vx: Math.cos(pAngle) * randRange(2, 6),
              vy: Math.sin(pAngle) * randRange(2, 6),
              life: 600, maxLife: 600,
              color: i % 3 === 0 ? '#ff4400' : i % 3 === 1 ? '#ffaa00' : '#ffff00',
              size: 5,
            });
          }
        }
        m.active = false;
        break;
      }
    }
  }
};

export const updateLightnings = (
  lightnings: LightningInstance[],
  cars: Car[],
  particles: Particle[],
  dt: number
) => {
  for (const l of lightnings) {
    if (!l.active) continue;
    l.life -= dt;
    l.strikeProgress = Math.min(1, l.strikeProgress + dt / 300);

    if (l.strikeProgress >= 0.3 && l.strikeProgress < 0.3 + dt / 300) {
      const target = cars.find((c) => c.id === l.targetId);
      if (target && !target.finished) {
        if (target.hasShield) {
          target.hasShield = false;
          target.shieldTime = 0;
          for (let i = 0; i < 12; i++) {
            particles.push({
              x: target.x, y: target.y,
              vx: randRange(-3, 3), vy: randRange(-3, 3),
              life: 400, maxLife: 400, color: '#33ccff', size: 3,
            });
          }
        } else {
          target.spinTime = 1200;
          target.speed *= 0.25;
          for (let i = 0; i < 30; i++) {
            particles.push({
              x: target.x + randRange(-30, 30),
              y: target.y + randRange(-30, 30),
              vx: randRange(-4, 4), vy: randRange(-4, 4),
              life: 500, maxLife: 500,
              color: i % 2 === 0 ? '#ffff00' : '#ffffff', size: 4,
            });
          }
        }
      }
    }

    if (l.life <= 0) {
      l.active = false;
    }
  }
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
      if (car.isGhost) continue;
      const hitRadius = 22 * car.scale;
      if (dist(car.x, car.y, m.x, m.y) < hitRadius) {
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

export const updateCarItemEffects = (car: Car, particles: Particle[], dt: number) => {
  if (car.scaleTime > 0) {
    car.scaleTime -= dt;
    if (car.scaleTime <= 0) {
      car.scale = 1;
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: car.x, y: car.y,
          vx: randRange(-2, 2), vy: randRange(-2, 2),
          life: 300, maxLife: 300, color: '#ffffff', size: 3,
        });
      }
    }
  }

  if (car.ghostTime > 0) {
    car.ghostTime -= dt;
    if (car.ghostTime <= 0) {
      car.isGhost = false;
    }
  }

  if (car.magnetTime > 0) {
    car.magnetTime -= dt;
    if (car.magnetTime <= 0) {
      car.hasMagnet = false;
    }
  }

  if (car.hyperBoostTime > 0) {
    car.hyperBoostTime -= dt;
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
