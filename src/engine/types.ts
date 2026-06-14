export type GamePhase = 'menu' | 'countdown' | 'racing' | 'finished';

export type ItemType = 'boost' | 'shield' | 'banana' | 'missile';

export interface Car {
  id: number;
  name: string;
  color: string;
  colorDark: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  friction: number;
  isPlayer: boolean;
  lap: number;
  checkpoint: number;
  bestLapTime: number;
  currentLapStartTime: number;
  totalTime: number;
  finished: boolean;
  finishTime: number;
  hasShield: boolean;
  shieldTime: number;
  boostTime: number;
  spinTime: number;
  currentItem: ItemType | null;
  drifting: boolean;
  driftAngle: number;
  tireMarkTimer: number;
  aiTargetIdx: number;
  aiSkill: number;
  itemCooldown: number;
}

export interface CarTemplate {
  id: number;
  name: string;
  color: string;
  colorDark: string;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  friction: number;
}

export interface TrackPoint {
  x: number;
  y: number;
}

export interface Track {
  name: string;
  points: TrackPoint[];
  width: number;
  checkpoints: number[];
  boostZones: number[];
  itemBoxes: number[];
}

export interface TireMark {
  x: number;
  y: number;
  angle: number;
  alpha: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ItemBoxInstance {
  idx: number;
  x: number;
  y: number;
  collected: boolean;
  respawnTimer: number;
}

export interface BananaInstance {
  x: number;
  y: number;
  angle: number;
  active: boolean;
  ownerId: number;
}

export interface MissileInstance {
  x: number;
  y: number;
  angle: number;
  speed: number;
  targetId: number;
  active: boolean;
  ownerId: number;
  life: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  shift: boolean;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  shake: number;
}
