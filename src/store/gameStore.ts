import { create } from 'zustand';
import type { GamePhase, Car, ItemType, GameMode, SplitScreenLayout } from '../engine/types';
import { CAR_TEMPLATES } from '../engine/cars';

interface GameState {
  phase: GamePhase;
  selectedCarIdP1: number;
  selectedCarIdP2: number;
  gameMode: GameMode;
  playerCount: 1 | 2;
  splitLayout: SplitScreenLayout;
  countdown: number;
  cars: Car[];
  totalLaps: number;
  winnerId: number | null;
  rankings: number[];
  raceTime: number;
  setPhase: (p: GamePhase) => void;
  selectCarP1: (id: number) => void;
  selectCarP2: (id: number) => void;
  setGameMode: (mode: GameMode) => void;
  setPlayerCount: (count: 1 | 2) => void;
  setSplitLayout: (layout: SplitScreenLayout) => void;
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
  selectedCarIdP1: 0,
  selectedCarIdP2: 1,
  gameMode: 'grandprix',
  playerCount: 1,
  splitLayout: 'horizontal',
  countdown: 3,
  cars: [],
  totalLaps: TOTAL_LAPS,
  winnerId: null,
  rankings: [],
  raceTime: 0,

  setPhase: (p) => set({ phase: p }),
  selectCarP1: (id) => set({ selectedCarIdP1: id }),
  selectCarP2: (id) => set({ selectedCarIdP2: id }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setPlayerCount: (count) => set({ playerCount: count }),
  setSplitLayout: (layout) => set({ splitLayout: layout }),
  setCountdown: (n) => set({ countdown: n }),
  updateCars: (cars) => set({ cars }),
  updateRaceTime: (t) => set({ raceTime: t }),

  finishRace: (winnerId, rankings) => set({
    phase: 'finished',
    winnerId,
    rankings,
  }),

  resetForCountdown: () => {
    const { selectedCarIdP1, selectedCarIdP2, gameMode, playerCount } = get();
    
    let carIds: number[] = [];
    let isPlayerFlags: boolean[] = [];
    let playerIndices: (0 | 1 | -1)[] = [];
    
    if (gameMode === 'timeattack') {
      if (playerCount === 2) {
        carIds = [selectedCarIdP1, selectedCarIdP2];
        isPlayerFlags = [true, true];
        playerIndices = [0, 1];
      } else {
        carIds = [selectedCarIdP1];
        isPlayerFlags = [true];
        playerIndices = [0];
      }
    } else if (playerCount === 2) {
      carIds = [selectedCarIdP1, selectedCarIdP2];
      isPlayerFlags = [true, true];
      playerIndices = [0, 1];
    } else {
      const aiIds = CAR_TEMPLATES.map((c) => c.id).filter((id) => id !== selectedCarIdP1).slice(0, 3);
      carIds = [selectedCarIdP1, ...aiIds];
      isPlayerFlags = carIds.map((_, i) => i === 0);
      playerIndices = carIds.map((_, i) => (i === 0 ? 0 : -1)) as (0 | 1 | -1)[];
    }

    set({
      phase: 'countdown',
      countdown: 3,
      winnerId: null,
      rankings: [],
      raceTime: 0,
      cars: carIds.map((tplId, i) => ({
        id: i,
        name: '',
        color: '#000',
        colorDark: '#000',
        x: 0, y: 0, angle: 0, speed: 0,
        maxSpeed: 0, acceleration: 0, handling: 0, friction: 0,
        isPlayer: isPlayerFlags[i],
        playerIndex: playerIndices[i],
        lap: 0,
        checkpoint: -1,
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
        aiSkill: isPlayerFlags[i] ? 0 : [0.8, 0.65, 0.75][i - 1] ?? 0.7,
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
