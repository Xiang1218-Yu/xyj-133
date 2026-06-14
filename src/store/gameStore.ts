import { create } from 'zustand';
import type { GamePhase, Car, ItemType } from '../engine/types';
import { CAR_TEMPLATES } from '../engine/cars';

interface GameState {
  phase: GamePhase;
  selectedCarId: number;
  countdown: number;
  cars: Car[];
  totalLaps: number;
  winnerId: number | null;
  rankings: number[];
  raceTime: number;
  setPhase: (p: GamePhase) => void;
  selectCar: (id: number) => void;
  setCountdown: (n: number) => void;
  updateCars: (cars: Car[]) => void;
  updateRaceTime: (t: number) => void;
  finishRace: (winnerId: number, rankings: number[]) => void;
  resetForCountdown: () => void;
  backToMenu: () => void;
}

export const TOTAL_LAPS = 3;

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  selectedCarId: 0,
  countdown: 3,
  cars: [],
  totalLaps: TOTAL_LAPS,
  winnerId: null,
  rankings: [],
  raceTime: 0,

  setPhase: (p) => set({ phase: p }),
  selectCar: (id) => set({ selectedCarId: id }),
  setCountdown: (n) => set({ countdown: n }),
  updateCars: (cars) => set({ cars }),
  updateRaceTime: (t) => set({ raceTime: t }),

  finishRace: (winnerId, rankings) => set({
    phase: 'finished',
    winnerId,
    rankings,
  }),

  resetForCountdown: () => {
    const { selectedCarId } = get();
    const aiIds = CAR_TEMPLATES.map((c) => c.id).filter((id) => id !== selectedCarId).slice(0, 3);
    const allIds = [selectedCarId, ...aiIds];
    set({
      phase: 'countdown',
      countdown: 3,
      winnerId: null,
      rankings: [],
      raceTime: 0,
      cars: allIds.map((_, i) => ({
        id: i,
        name: '',
        color: '#000',
        colorDark: '#000',
        x: 0, y: 0, angle: 0, speed: 0,
        maxSpeed: 0, acceleration: 0, handling: 0, friction: 0,
        isPlayer: i === 0,
        lap: 0,
        checkpoint: 0,
        bestLapTime: Infinity,
        currentLapStartTime: 0,
        totalTime: 0,
        finished: false,
        finishTime: 0,
        hasShield: false,
        shieldTime: 0,
        boostTime: 0,
        spinTime: 0,
        currentItem: null as ItemType | null,
        drifting: false,
        driftAngle: 0,
        tireMarkTimer: 0,
        aiTargetIdx: 0,
        aiSkill: i === 0 ? 0 : [0.8, 0.65, 0.75][i - 1] ?? 0.7,
        itemCooldown: 0,
      })),
    });
  },

  backToMenu: () => set({
    phase: 'menu',
    cars: [],
    winnerId: null,
    rankings: [],
    raceTime: 0,
  }),
}));
