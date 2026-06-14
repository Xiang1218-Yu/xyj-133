import { useEffect, useRef } from 'react';
import { useGameStore, TOTAL_LAPS } from '../store/gameStore';
import { Renderer } from '../engine/renderer';
import type {
  Car, TireMark, Particle, ItemBoxInstance, BananaInstance, MissileInstance, Camera, InputState,
} from '../engine/types';
import { InputManager } from '../engine/input';
import { MAIN_TRACK, getStartPositions, getItemBoxPositions } from '../engine/track';
import { CAR_TEMPLATES, getCarTemplate } from '../engine/cars';
import {
  updateCarPhysics, nearestTrackIdx, checkCarCollision, resolveCarCollision, isInBoostZone,
} from '../engine/physics';
import { updateAI } from '../engine/ai';
import {
  createItemBoxes, updateItemBoxes, tryCollectItemBox, useItem,
  updateBananas, updateMissiles, updateParticles,
} from '../engine/items';
import { lerp, clamp } from '../utils/math';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGameStore((s) => s.phase);
  const countdown = useGameStore((s) => s.countdown);
  const setCountdown = useGameStore((s) => s.setCountdown);
  const setPhase = useGameStore((s) => s.setPhase);
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  const finishRace = useGameStore((s) => s.finishRace);
  const updateRaceTime = useGameStore((s) => s.updateRaceTime);

  const stateRef = useRef<{
    cars: Car[];
    tireMarks: TireMark[];
    particles: Particle[];
    itemBoxes: ItemBoxInstance[];
    bananas: BananaInstance[];
    missiles: MissileInstance[];
    camera: Camera;
    renderer: Renderer | null;
    input: InputManager | null;
    lastTime: number;
    raceStartTime: number;
    countdownTimer: number;
    countdownValue: number;
    initialized: boolean;
    raceFinished: boolean;
    rankings: number[];
    lastFrameTs: number;
    globalTime: number;
  } | null>(null);

  if (!stateRef.current) {
    stateRef.current = {
      cars: [],
      tireMarks: [],
      particles: [],
      itemBoxes: [],
      bananas: [],
      missiles: [],
      camera: { x: 1000, y: 800, zoom: 1, shake: 0 },
      renderer: null,
      input: null,
      lastTime: 0,
      raceStartTime: 0,
      countdownTimer: 0,
      countdownValue: 3,
      initialized: false,
      raceFinished: false,
      rankings: [],
      lastFrameTs: 0,
      globalTime: 0,
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const st = stateRef.current!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (st.renderer) st.renderer.resize(w, h);
      else st.renderer = new Renderer(ctx, w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const input = new InputManager();
    st.input = input;

    const initializeCars = () => {
      const aiIds = CAR_TEMPLATES.map((c) => c.id).filter((id) => id !== selectedCarId).slice(0, 3);
      const allCarIds = [selectedCarId, ...aiIds];
      const starts = getStartPositions(MAIN_TRACK, allCarIds.length);
      const aiSkills = [0, 0.82, 0.68, 0.76];

      st.cars = allCarIds.map((tplId, i) => {
        const tpl = getCarTemplate(tplId);
        const pos = starts[i];
        return {
          id: i,
          name: tpl.name,
          color: tpl.color,
          colorDark: tpl.colorDark,
          x: pos.x,
          y: pos.y,
          angle: pos.angle,
          speed: 0,
          maxSpeed: tpl.maxSpeed,
          acceleration: tpl.acceleration,
          handling: tpl.handling,
          friction: tpl.friction,
          isPlayer: i === 0,
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
          currentItem: null,
          drifting: false,
          driftAngle: 0,
          tireMarkTimer: 0,
          aiTargetIdx: 0,
          aiSkill: i === 0 ? 0 : aiSkills[i] ?? 0.7,
          itemCooldown: 0,
        };
      });

      st.tireMarks = [];
      st.particles = [];
      st.itemBoxes = createItemBoxes(MAIN_TRACK);
      getItemBoxPositions(MAIN_TRACK).forEach((p, i) => {
        if (st.itemBoxes[i]) {
          st.itemBoxes[i].x = p.x;
          st.itemBoxes[i].y = p.y;
        }
      });
      st.bananas = [];
      st.missiles = [];
      st.raceFinished = false;
      st.rankings = [];
      st.camera.shake = 0;
    };

    initializeCars();
    st.countdownValue = 3;
    st.countdownTimer = 0;
    st.initialized = true;
    setCountdown(3);

    input.onSpacePress = () => {
      if (phase !== 'racing') return;
      const player = st.cars.find((c) => c.isPlayer);
      if (!player || player.finished) return;
      const used = useItem(player, st.cars, st.bananas, st.missiles, st.particles);
      if (used === 'boost') {
        st.camera.shake = 8;
      }
    };

    let rafId = 0;
    const loop = (ts: number) => {
      const dt = Math.min(40, ts - (st.lastFrameTs || ts));
      st.lastFrameTs = ts;
      st.globalTime = ts;
      if (!st.renderer) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      const currentPhase = useGameStore.getState().phase;

      if (currentPhase === 'countdown') {
        st.countdownTimer += dt;
        if (st.countdownTimer >= 1000) {
          st.countdownTimer = 0;
          st.countdownValue -= 1;
          if (st.countdownValue <= 0) {
            setPhase('racing');
            st.raceStartTime = ts;
            st.cars.forEach((c) => { c.currentLapStartTime = ts; });
          }
          setCountdown(st.countdownValue);
          st.camera.shake = 6;
        }
      }

      if (currentPhase === 'racing') {
        const elapsed = ts - st.raceStartTime;
        updateRaceTime(elapsed);

        for (let i = 0; i < st.cars.length; i++) {
          const car = st.cars[i];
          const inp: InputState = car.isPlayer
            ? input.state
            : updateAI(car, MAIN_TRACK, dt);

          if (car.isPlayer && inp.space && car.currentItem && !car.finished) {
            // handled via onSpacePress edge-trigger for player
          }
          if (!car.isPlayer && inp.space) {
            useItem(car, st.cars, st.bananas, st.missiles, st.particles);
          }

          if (car.itemCooldown > 0) car.itemCooldown -= dt;

          updateCarPhysics(car, inp, dt, MAIN_TRACK);

          if (car.drifting && car.tireMarkTimer > 40) {
            car.tireMarkTimer = 0;
            const back = car.angle + Math.PI;
            for (const side of [-1, 1]) {
              const px = car.x + Math.cos(back) * 12 + Math.cos(back + Math.PI / 2) * side * 7;
              const py = car.y + Math.sin(back) * 12 + Math.sin(back + Math.PI / 2) * side * 7;
              st.tireMarks.push({ x: px, y: py, angle: car.angle, alpha: 0.5 });
            }
            if (Math.random() < 0.4) {
              st.particles.push({
                x: car.x + (Math.random() - 0.5) * 10,
                y: car.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                life: 500, maxLife: 500,
                color: '#aaaaaa', size: 3,
              });
            }
          }

          if (isInBoostZone(car.x, car.y, MAIN_TRACK)) {
            if (Math.random() < 0.3) {
              st.particles.push({
                x: car.x + (Math.random() - 0.5) * 16,
                y: car.y + (Math.random() - 0.5) * 16,
                vx: -Math.cos(car.angle) * 0.6 + (Math.random() - 0.5) * 0.4,
                vy: -Math.sin(car.angle) * 0.6 + (Math.random() - 0.5) * 0.4,
                life: 300, maxLife: 300,
                color: '#ffee66', size: 3,
              });
            }
          }

          if (car.boostTime > 0 && Math.random() < 0.6) {
            const back = car.angle + Math.PI;
            st.particles.push({
              x: car.x + Math.cos(back) * 14 + (Math.random() - 0.5) * 4,
              y: car.y + Math.sin(back) * 14 + (Math.random() - 0.5) * 4,
              vx: Math.cos(back) * 1.2 + (Math.random() - 0.5) * 0.5,
              vy: Math.sin(back) * 1.2 + (Math.random() - 0.5) * 0.5,
              life: 350, maxLife: 350,
              color: Math.random() < 0.5 ? '#ffaa00' : '#ff6600',
              size: 3,
            });
          }

          if (car.spinTime > 100 && Math.random() < 0.5) {
            st.particles.push({
              x: car.x + (Math.random() - 0.5) * 20,
              y: car.y + (Math.random() - 0.5) * 20,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 400, maxLife: 400,
              color: '#ff8800', size: 3,
            });
          }
        }

        for (let i = 0; i < st.cars.length; i++) {
          for (let j = i + 1; j < st.cars.length; j++) {
            if (checkCarCollision(st.cars[i], st.cars[j])) {
              resolveCarCollision(st.cars[i], st.cars[j]);
            }
          }
        }

        const checkpoints = MAIN_TRACK.checkpoints;
        for (const car of st.cars) {
          if (car.finished) continue;
          const idx = nearestTrackIdx(car.x, car.y, MAIN_TRACK);
          const nextCheckpoint = checkpoints[(car.checkpoint + 1) % checkpoints.length];
          if (idx === nextCheckpoint || Math.abs(idx - nextCheckpoint) <= 2) {
            if (car.checkpoint !== nextCheckpoint) {
              car.checkpoint = nextCheckpoint;
              if (nextCheckpoint === 0 && car.checkpoint === 0) {
                if (car.lap > 0 || idx < checkpoints[checkpoints.length - 1] + 5) {
                  const lapTime = ts - car.currentLapStartTime;
                  if (lapTime < car.bestLapTime && lapTime > 5000) {
                    car.bestLapTime = lapTime;
                  }
                  car.lap += 1;
                  car.currentLapStartTime = ts;
                  if (car.lap >= TOTAL_LAPS) {
                    car.finished = true;
                    car.finishTime = ts - st.raceStartTime;
                    st.rankings.push(car.id);
                    if (car.isPlayer) {
                      st.camera.shake = 12;
                    }
                    if (st.rankings.length >= st.cars.length || (st.rankings.includes(0) && st.rankings.length >= 3)) {
                      st.raceFinished = true;
                      setTimeout(() => {
                        const finalRank = [...st.rankings];
                        for (const c of st.cars) {
                          if (!finalRank.includes(c.id)) finalRank.push(c.id);
                        }
                        const winner = finalRank[0];
                        finishRace(winner, finalRank);
                      }, 1500);
                    }
                  }
                }
              }
            }
          }
        }

        for (const car of st.cars) {
          if (!car.finished) tryCollectItemBox(car, st.itemBoxes);
        }

        updateItemBoxes(st.itemBoxes, dt);
        updateBananas(st.bananas, st.cars, st.particles, dt);
        updateMissiles(st.missiles, st.cars, st.particles, dt);
        updateParticles(st.particles, dt);

        for (let i = st.tireMarks.length - 1; i >= 0; i--) {
          st.tireMarks[i].alpha -= 0.0015 * dt / 16;
          if (st.tireMarks[i].alpha <= 0) st.tireMarks.splice(i, 1);
        }
      }

      const playerCar = st.cars.find((c) => c.isPlayer);
      if (playerCar) {
        const targetZoom = 1 - clamp(Math.abs(playerCar.speed) / (playerCar.maxSpeed * 2), 0, 0.12);
        st.camera.zoom = lerp(st.camera.zoom, targetZoom, 0.05);
        const speedFactor = Math.abs(playerCar.speed) / playerCar.maxSpeed;
        const lookAhead = 80 * speedFactor;
        const tx = playerCar.x + Math.cos(playerCar.angle) * lookAhead;
        const ty = playerCar.y + Math.sin(playerCar.angle) * lookAhead;
        st.camera.x = lerp(st.camera.x, tx, 0.1);
        st.camera.y = lerp(st.camera.y, ty, 0.1);
        st.camera.shake = Math.max(0, st.camera.shake - 0.5);
      }

      const renderer = st.renderer;
      renderer.clear();
      renderer.beginCamera(st.camera);
      renderer.drawGrassTexture(MAIN_TRACK);
      renderer.drawTrack(MAIN_TRACK, ts);
      renderer.drawTireMarks(st.tireMarks);
      renderer.drawItemBoxes(st.itemBoxes, ts);
      renderer.drawBananas(st.bananas);
      renderer.drawMissiles(st.missiles);

      const sortedForDraw = [...st.cars].sort((a, b) => a.y - b.y);
      for (const car of sortedForDraw) {
        renderer.drawCar(car, ts);
      }
      renderer.drawParticles(st.particles);
      renderer.endCamera();
      renderer.drawVignette();
      renderer.drawScanlines(ts);

      if (currentPhase === 'countdown') {
        renderer.drawCountdown(st.countdownValue, ts);
      }

      if (phase !== 'finished') {
        useGameStore.setState({ cars: [...st.cars] });
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      input.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCarId]);

  useEffect(() => {
    if (phase === 'countdown' && stateRef.current?.initialized) {
      const st = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (st.renderer) st.renderer.resize(w, h);
      else st.renderer = new Renderer(ctx, w, h);

      const initializeCars = () => {
        const aiIds = CAR_TEMPLATES.map((c) => c.id).filter((id) => id !== selectedCarId).slice(0, 3);
        const allCarIds = [selectedCarId, ...aiIds];
        const starts = getStartPositions(MAIN_TRACK, allCarIds.length);
        const aiSkills = [0, 0.82, 0.68, 0.76];

        st.cars = allCarIds.map((tplId, i) => {
          const tpl = getCarTemplate(tplId);
          const pos = starts[i];
          return {
            id: i,
            name: tpl.name,
            color: tpl.color,
            colorDark: tpl.colorDark,
            x: pos.x,
            y: pos.y,
            angle: pos.angle,
            speed: 0,
            maxSpeed: tpl.maxSpeed,
            acceleration: tpl.acceleration,
            handling: tpl.handling,
            friction: tpl.friction,
            isPlayer: i === 0,
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
            currentItem: null,
            drifting: false,
            driftAngle: 0,
            tireMarkTimer: 0,
            aiTargetIdx: 0,
            aiSkill: i === 0 ? 0 : aiSkills[i] ?? 0.7,
            itemCooldown: 0,
          };
        });

        st.tireMarks = [];
        st.particles = [];
        st.itemBoxes = createItemBoxes(MAIN_TRACK);
        getItemBoxPositions(MAIN_TRACK).forEach((p, i) => {
          if (st.itemBoxes[i]) {
            st.itemBoxes[i].x = p.x;
            st.itemBoxes[i].y = p.y;
          }
        });
        st.bananas = [];
        st.missiles = [];
        st.raceFinished = false;
        st.rankings = [];
        st.camera.shake = 0;
      };
      initializeCars();
      st.countdownValue = 3;
      st.countdownTimer = 0;
      setCountdown(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'countdown' ? 'countdown-start' : '']);

  void countdown;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
