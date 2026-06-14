import { create } from 'zustand';
import type { GamePhase, Car, ItemType, GameMode, SplitScreenLayout, WeatherType, TimeOfDay, ReplayData, ReplayViewMode, CarCustomization, StripePattern } from '../engine/types';
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
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  replayData: ReplayData | null;
  replayPlaying: boolean;
  replaySpeed: number;
  replayViewMode: ReplayViewMode;
  replayFrameIndex: number;
  customizationP1: CarCustomization;
  customizationP2: CarCustomization;
  customizeTarget: 1 | 2;
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
  setWeather: (w: WeatherType) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  startReplay: (data: ReplayData) => void;
  exitReplay: () => void;
  setReplayPlaying: (p: boolean) => void;
  setReplaySpeed: (s: number) => void;
  setReplayViewMode: (m: ReplayViewMode) => void;
  setReplayFrameIndex: (i: number) => void;
  openCustomizer: (target: 1 | 2) => void;
  closeCustomizer: () => void;
  setCustomizeTarget: (target: 1 | 2) => void;
  updateCustomizationP1: (patch: Partial<CarCustomization>) => void;
  updateCustomizationP2: (patch: Partial<CarCustomization>) => void;
  resetCustomization: (target: 1 | 2) => void;
  applyTemplateToCustomization: (target: 1 | 2, templateId: number) => void;
}

export const TOTAL_LAPS = 3;

const createDefaultCustomization = (template: typeof CAR_TEMPLATES[0]): CarCustomization => ({
  bodyColor: template.color,
  stripeColor: '#ffffff',
  stripePattern: 'single',
  stripeEnabled: false,
  numberColor: '#ffffff',
  number: '01',
  numberEnabled: true,
  wheelColor: '#111111',
});

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
  weather: 'clear',
  timeOfDay: 'day',
  replayData: null,
  replayPlaying: true,
  replaySpeed: 1,
  replayViewMode: 'follow_p1',
  replayFrameIndex: 0,
  customizationP1: createDefaultCustomization(CAR_TEMPLATES[0]),
  customizationP2: createDefaultCustomization(CAR_TEMPLATES[1]),
  customizeTarget: 1,

  setPhase: (p) => set({ phase: p }),
  selectCarP1: (id) => set({ selectedCarIdP1: id, customizationP1: createDefaultCustomization(CAR_TEMPLATES[id]) }),
  selectCarP2: (id) => set({ selectedCarIdP2: id, customizationP2: createDefaultCustomization(CAR_TEMPLATES[id]) }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setPlayerCount: (count) => set({ playerCount: count }),
  setSplitLayout: (layout) => set({ splitLayout: layout }),
  setCountdown: (n) => set({ countdown: n }),
  updateCars: (cars) => set({ cars }),
  updateRaceTime: (t) => set({ raceTime: t }),
  setWeather: (w) => set({ weather: w }),
  setTimeOfDay: (t) => set({ timeOfDay: t }),

  finishRace: (winnerId, rankings) => set({
    phase: 'finished',
    winnerId,
    rankings,
  }),

  startReplay: (data) => set({
    phase: 'replay',
    replayData: data,
    replayPlaying: true,
    replaySpeed: 1,
    replayViewMode: 'follow_p1',
    replayFrameIndex: 0,
  }),
  exitReplay: () => set({
    phase: 'menu',
    replayData: null,
    replayPlaying: true,
    replaySpeed: 1,
    replayFrameIndex: 0,
  }),
  setReplayPlaying: (p) => set({ replayPlaying: p }),
  setReplaySpeed: (s) => set({ replaySpeed: s }),
  setReplayViewMode: (m) => set({ replayViewMode: m }),
  setReplayFrameIndex: (i) => set({ replayFrameIndex: i }),

  resetForCountdown: () => {
    const { selectedCarIdP1, selectedCarIdP2, gameMode, playerCount, customizationP1, customizationP2 } = get();
    
    let carIds: number[] = [];
    let isPlayerFlags: boolean[] = [];
    let playerIndices: (0 | 1 | -1)[] = [];
    let customizations: (CarCustomization | null)[] = [];
    
    if (gameMode === 'timeattack' || gameMode === 'drift') {
      if (playerCount === 2) {
        carIds = [selectedCarIdP1, selectedCarIdP2];
        isPlayerFlags = [true, true];
        playerIndices = [0, 1];
        customizations = [{ ...customizationP1 }, { ...customizationP2 }];
      } else {
        carIds = [selectedCarIdP1];
        isPlayerFlags = [true];
        playerIndices = [0];
        customizations = [{ ...customizationP1 }];
      }
    } else if (playerCount === 2) {
      carIds = [selectedCarIdP1, selectedCarIdP2];
      isPlayerFlags = [true, true];
      playerIndices = [0, 1];
      customizations = [{ ...customizationP1 }, { ...customizationP2 }];
    } else {
      const aiIds = CAR_TEMPLATES.map((c) => c.id).filter((id) => id !== selectedCarIdP1).slice(0, 3);
      carIds = [selectedCarIdP1, ...aiIds];
      isPlayerFlags = carIds.map((_, i) => i === 0);
      playerIndices = carIds.map((_, i) => (i === 0 ? 0 : -1)) as (0 | 1 | -1)[];
      customizations = carIds.map((tplId, i) => {
        if (i === 0) return { ...customizationP1 };
        const tpl = CAR_TEMPLATES[tplId];
        return createDefaultCustomization(tpl);
      });
    }

    set({
      phase: 'countdown',
      countdown: 3,
      winnerId: null,
      rankings: [],
      raceTime: 0,
      replayData: null,
      replayFrameIndex: 0,
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
        driftScore: 0,
        driftCombo: 0,
        currentDriftPoints: 0,
        maxDriftCombo: 0,
        driftComboTimer: 0,
        aiTargetIdx: 0,
        aiSkill: isPlayerFlags[i] ? 0 : [0.8, 0.65, 0.75][i - 1] ?? 0.7,
        itemCooldown: 0,
        customization: customizations[i],
      })),
    });
  },

  backToMenu: () => set({
    phase: 'menu',
    cars: [],
    winnerId: null,
    rankings: [],
    raceTime: 0,
    replayData: null,
    replayFrameIndex: 0,
  }),

  openCustomizer: (target) => set({
    phase: 'customize',
    customizeTarget: target,
  }),

  closeCustomizer: () => set({
    phase: 'menu',
  }),

  setCustomizeTarget: (target) => set({
    customizeTarget: target,
  }),

  updateCustomizationP1: (patch) => set((state) => ({
    customizationP1: { ...state.customizationP1, ...patch },
  })),

  updateCustomizationP2: (patch) => set((state) => ({
    customizationP2: { ...state.customizationP2, ...patch },
  })),

  resetCustomization: (target) => {
    const { selectedCarIdP1, selectedCarIdP2 } = get();
    const tplId = target === 1 ? selectedCarIdP1 : selectedCarIdP2;
    const tpl = CAR_TEMPLATES[tplId];
    const def = createDefaultCustomization(tpl);
    if (target === 1) {
      set({ customizationP1: def });
    } else {
      set({ customizationP2: def });
    }
  },

  applyTemplateToCustomization: (target, templateId) => {
    const tpl = CAR_TEMPLATES[templateId % CAR_TEMPLATES.length];
    const { selectedCarIdP1, selectedCarIdP2 } = get();
    const currentTplId = target === 1 ? selectedCarIdP1 : selectedCarIdP2;
    const currentTpl = CAR_TEMPLATES[currentTplId];
    if (target === 1) {
      set((state) => ({
        customizationP1: {
          ...state.customizationP1,
          bodyColor: tpl.color,
          stripeColor: tpl.colorDark,
        },
      }));
    } else {
      set((state) => ({
        customizationP2: {
          ...state.customizationP2,
          bodyColor: tpl.color,
          stripeColor: tpl.colorDark,
        },
      }));
    }
    void currentTpl;
  },
}));
