import type {
  Car, Track, TireMark, Particle, ItemBoxInstance,
  BananaInstance, MissileInstance, Camera, ItemType,
  WeatherType, TimeOfDay, EnvConfig,
} from './types';
import { lerp } from '../utils/math';

const GRASS_COLOR = '#1a4a2a';
const GRASS_DARK = '#144022';
const ROAD_COLOR = '#3a3a4a';
const ROAD_DARK = '#2e2e3e';
const ROAD_LIGHT = '#4a4a5a';
const CURB_RED = '#cc3344';
const CURB_WHITE = '#eeeeee';
const BOOST_COLOR = '#ffcc00';
const BOOST_GLOW = '#ffee55';

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: 'rain' | 'snow';
  life: number;
  maxLife: number;
}

const TIME_LIGHTING: Record<TimeOfDay, {
  skyTint: string;
  colorMul: [number, number, number];
  ambientAlpha: number;
  contrast: number;
  headlightAlpha: number;
  vignetteMul: number;
  scanlineMul: number;
}> = {
  day: {
    skyTint: 'rgba(135,206,235,0.0)',
    colorMul: [1, 1, 1],
    ambientAlpha: 0,
    contrast: 1,
    headlightAlpha: 0,
    vignetteMul: 1,
    scanlineMul: 1,
  },
  dawn: {
    skyTint: 'rgba(255,180,120,0.15)',
    colorMul: [1.1, 0.95, 0.85],
    ambientAlpha: 0.08,
    contrast: 0.95,
    headlightAlpha: 0.15,
    vignetteMul: 1.1,
    scanlineMul: 1,
  },
  sunset: {
    skyTint: 'rgba(255,120,60,0.2)',
    colorMul: [1.15, 0.85, 0.7],
    ambientAlpha: 0.12,
    contrast: 0.9,
    headlightAlpha: 0.3,
    vignetteMul: 1.2,
    scanlineMul: 1.1,
  },
  night: {
    skyTint: 'rgba(20,20,60,0.45)',
    colorMul: [0.6, 0.65, 0.85],
    ambientAlpha: 0.35,
    contrast: 0.8,
    headlightAlpha: 1,
    vignetteMul: 1.6,
    scanlineMul: 1.5,
  },
};

const WEATHER_VISUAL: Record<WeatherType, {
  roadWetAlpha: number;
  grassDarken: number;
  fogAlpha: number;
  particlesPerFrame: number;
  windX: number;
}> = {
  clear: {
    roadWetAlpha: 0,
    grassDarken: 0,
    fogAlpha: 0,
    particlesPerFrame: 0,
    windX: 0,
  },
  rain: {
    roadWetAlpha: 0.3,
    grassDarken: 0.15,
    fogAlpha: 0.08,
    particlesPerFrame: 3,
    windX: 0.3,
  },
  snow: {
    roadWetAlpha: 0.5,
    grassDarken: -0.4,
    fogAlpha: 0.12,
    particlesPerFrame: 2,
    windX: 0.1,
  },
  fog: {
    roadWetAlpha: 0.05,
    grassDarken: 0.05,
    fogAlpha: 0.35,
    particlesPerFrame: 0,
    windX: 0,
  },
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private w: number;
  private h: number;
  private viewportW: number;
  private viewportH: number;
  private weatherParticles: WeatherParticle[] = [];
  private env: EnvConfig = { weather: 'clear', timeOfDay: 'day' };

  constructor(ctx: CanvasRenderingContext2D, w: number, h: number) {
    this.ctx = ctx;
    this.w = w;
    this.h = h;
    this.viewportW = w;
    this.viewportH = h;
  }

  setEnv(env: EnvConfig) {
    this.env = { ...env };
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.viewportW = w;
    this.viewportH = h;
  }

  setViewport(vp: { x: number; y: number; width: number; height: number }) {
    this.viewportW = vp.width;
    this.viewportH = vp.height;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(vp.x, vp.y, vp.width, vp.height);
    this.ctx.clip();
    this.ctx.translate(vp.x, vp.y);
  }

  restoreViewport() {
    this.ctx.restore();
    this.viewportW = this.w;
    this.viewportH = this.h;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
  }

  private applyColorMul(hex: string, mul: [number, number, number]): string {
    const [r, g, b] = this.hexToRgb(hex);
    return this.rgbToHex(r * mul[0], g * mul[1], b * mul[2]);
  }

  private darkenColor(hex: string, amount: number = 0.35): string {
    const [r, g, b] = this.hexToRgb(hex);
    const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
    return `#${d(r).toString(16).padStart(2, '0')}${d(g).toString(16).padStart(2, '0')}${d(b).toString(16).padStart(2, '0')}`;
  }

  updateWeather(dt: number, camera: Camera) {
    const wv = WEATHER_VISUAL[this.env.weather];
    const tl = TIME_LIGHTING[this.env.timeOfDay];
    if (wv.particlesPerFrame > 0) {
      for (let i = 0; i < wv.particlesPerFrame; i++) {
        const viewRangeX = this.viewportW / camera.zoom + 200;
        const viewRangeY = this.viewportH / camera.zoom + 200;
        const type: 'rain' | 'snow' = this.env.weather === 'snow' ? 'snow' : 'rain';
        this.weatherParticles.push({
          x: camera.x + (Math.random() - 0.5) * viewRangeX,
          y: camera.y + (Math.random() - 0.5) * viewRangeY - viewRangeY * 0.5,
          vx: wv.windX * (type === 'rain' ? 8 : 2),
          vy: type === 'rain' ? 18 + Math.random() * 10 : 1 + Math.random() * 1.5,
          size: type === 'rain' ? 8 + Math.random() * 6 : 2 + Math.random() * 3,
          type,
          life: 0,
          maxLife: type === 'rain' ? 600 : 2000,
        });
      }
    }
    void tl;
    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      const p = this.weatherParticles[i];
      p.life += dt;
      p.x += p.vx * dt / 16;
      p.y += p.vy * dt / 16;
      if (p.life > p.maxLife) this.weatherParticles.splice(i, 1);
    }
    if (this.weatherParticles.length > 800) {
      this.weatherParticles.splice(0, this.weatherParticles.length - 800);
    }
  }

  clear() {
    const ctx = this.ctx;
    const timeLight = TIME_LIGHTING[this.env.timeOfDay];
    const weatherVis = WEATHER_VISUAL[this.env.weather];
    const [r, g, b] = this.hexToRgb(GRASS_COLOR);
    const darken = weatherVis.grassDarken * 255;
    const baseColor = this.rgbToHex(
      (r + darken) * timeLight.colorMul[0],
      (g + darken) * timeLight.colorMul[1],
      (b + darken) * timeLight.colorMul[2],
    );
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  clearViewport() {
    const ctx = this.ctx;
    const timeLight = TIME_LIGHTING[this.env.timeOfDay];
    const weatherVis = WEATHER_VISUAL[this.env.weather];
    const [r, g, b] = this.hexToRgb(GRASS_COLOR);
    const darken = weatherVis.grassDarken * 255;
    const baseColor = this.rgbToHex(
      (r + darken) * timeLight.colorMul[0],
      (g + darken) * timeLight.colorMul[1],
      (b + darken) * timeLight.colorMul[2],
    );
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, this.viewportW, this.viewportH);
  }

  drawSplitDivider(layout: 'horizontal' | 'vertical') {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#000000';
    if (layout === 'horizontal') {
      ctx.fillRect(0, this.h / 2 - 2, this.w, 4);
    } else {
      ctx.fillRect(this.w / 2 - 2, 0, 4, this.h);
    }
    ctx.restore();
  }

  drawPlayerIndicator(x: number, y: number, playerIdx: 0 | 1) {
    const ctx = this.ctx;
    ctx.save();
    const color = playerIdx === 0 ? '#00ff88' : '#ff3366';
    const label = `P${playerIdx + 1}`;
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, 60, 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 60, 24);
    ctx.fillStyle = color;
    ctx.font = 'bold 12px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 30, y + 12);
    ctx.restore();
  }

  beginCamera(cam: Camera) {
    const ctx = this.ctx;
    ctx.save();
    const shakeX = cam.shake > 0 ? (Math.random() - 0.5) * cam.shake : 0;
    const shakeY = cam.shake > 0 ? (Math.random() - 0.5) * cam.shake : 0;
    ctx.translate(this.viewportW / 2 + shakeX, this.viewportH / 2 + shakeY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
  }

  endCamera() {
    this.ctx.restore();
  }

  drawGrassTexture(track: Track) {
    const ctx = this.ctx;
    const spacing = 64;
    const minX = -500, maxX = 2500, minY = -500, maxY = 2100;
    for (let x = minX; x < maxX; x += spacing) {
      for (let y = minY; y < maxY; y += spacing) {
        const c = (Math.floor(x / spacing) + Math.floor(y / spacing)) % 2 === 0
          ? GRASS_COLOR : GRASS_DARK;
        ctx.fillStyle = c;
        ctx.fillRect(x, y, spacing, spacing);
      }
    }
    for (let i = 0; i < 80; i++) {
      const seed = i * 9301 + 49297;
      const tx = minX + ((seed * 233) % (maxX - minX));
      const ty = minY + ((seed * 337) % (maxY - minY));
      const pts = track.points;
      let tooClose = false;
      for (let j = 0; j < pts.length; j += 5) {
        const dx = pts[j].x - tx, dy = pts[j].y - ty;
        if (dx * dx + dy * dy < (track.width / 2 + 80) ** 2) { tooClose = true; break; }
      }
      if (tooClose) continue;
      this.drawPixelTree(tx, ty);
    }
  }

  private drawPixelTree(x: number, y: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(x - 2, y, 4, 10);
    ctx.fillStyle = '#0a5a20';
    ctx.fillRect(x - 8, y - 14, 16, 14);
    ctx.fillStyle = '#0a7028';
    ctx.fillRect(x - 6, y - 18, 12, 6);
    ctx.fillStyle = '#1a8038';
    ctx.fillRect(x - 4, y - 12, 3, 4);
  }

  drawTrack(track: Track, time: number) {
    const ctx = this.ctx;
    const pts = track.points;
    const hw = track.width / 2;

    ctx.beginPath();
    for (let i = 0; i <= pts.length; i++) {
      const p = pts[i % pts.length];
      const dx = pts[(i + 1) % pts.length].x - pts[i % pts.length].x;
      const dy = pts[(i + 1) % pts.length].y - pts[i % pts.length].y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * hw;
      const ny = dx / len * hw;
      if (i === 0) ctx.moveTo(p.x + nx, p.y + ny);
      else ctx.lineTo(p.x + nx, p.y + ny);
    }
    for (let i = pts.length; i >= 0; i--) {
      const p = pts[i % pts.length];
      const dx = pts[(i + 1) % pts.length].x - pts[i % pts.length].x;
      const dy = pts[(i + 1) % pts.length].y - pts[i % pts.length].y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * hw;
      const ny = dx / len * hw;
      ctx.lineTo(p.x - nx, p.y - ny);
    }
    ctx.closePath();
    ctx.fillStyle = ROAD_COLOR;
    ctx.fill();

    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * hw;
      const ny = dx / len * hw;
      const isBoost = track.boostZones.includes(i);
      const isCurb = i % 3 < 2;

      const segColor = i % 2 === 0 ? ROAD_COLOR : ROAD_DARK;
      ctx.fillStyle = segColor;
      ctx.beginPath();
      ctx.moveTo(p1.x + nx * 0.92, p1.y + ny * 0.92);
      ctx.lineTo(p2.x + nx * 0.92, p2.y + ny * 0.92);
      ctx.lineTo(p2.x - nx * 0.92, p2.y - ny * 0.92);
      ctx.lineTo(p1.x - nx * 0.92, p1.y - ny * 0.92);
      ctx.closePath();
      ctx.fill();

      if (isBoost) {
        const flicker = 0.7 + 0.3 * Math.sin(time * 0.01 + i);
        ctx.fillStyle = BOOST_COLOR;
        ctx.globalAlpha = flicker;
        ctx.beginPath();
        ctx.moveTo(p1.x + nx * 0.9, p1.y + ny * 0.9);
        ctx.lineTo(p2.x + nx * 0.9, p2.y + ny * 0.9);
        ctx.lineTo(p2.x - nx * 0.9, p2.y - ny * 0.9);
        ctx.lineTo(p1.x - nx * 0.9, p1.y - ny * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = BOOST_GLOW;
        ctx.fillRect((p1.x + p2.x) / 2 - 4, (p1.y + p2.y) / 2 - 4, 8, 8);
      }

      if (isCurb) {
        const curbColor = i % 6 < 3 ? CURB_RED : CURB_WHITE;
        ctx.strokeStyle = curbColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p1.x + nx, p1.y + ny);
        ctx.lineTo(p2.x + nx, p2.y + ny);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p1.x - nx, p1.y - ny);
        ctx.lineTo(p2.x - nx, p2.y - ny);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = ROAD_LIGHT;
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.lineDashOffset = -time * 0.01;
    ctx.beginPath();
    for (let i = 0; i <= pts.length; i++) {
      const p = pts[i % pts.length];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const start = pts[0];
    const next = pts[1];
    const sdx = next.x - start.x;
    const sdy = next.y - start.y;
    const slen = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
    const snx = -sdy / slen * hw;
    const sny = sdx / slen * hw;
    const checkerCount = 10;
    for (let c = 0; c < checkerCount; c++) {
      const t = c / checkerCount;
      const t2 = (c + 1) / checkerCount;
      ctx.fillStyle = c % 2 === 0 ? '#ffffff' : '#111111';
      ctx.beginPath();
      ctx.moveTo(start.x + lerp(snx, -snx, t), start.y + lerp(sny, -sny, t));
      ctx.lineTo(start.x + lerp(snx, -snx, t2), start.y + lerp(sny, -sny, t2));
      ctx.lineTo(start.x - sdx * 0.05 + lerp(snx, -snx, t2), start.y - sdy * 0.05 + lerp(sny, -sny, t2));
      ctx.lineTo(start.x - sdx * 0.05 + lerp(snx, -snx, t), start.y - sdy * 0.05 + lerp(sny, -sny, t));
      ctx.closePath();
      ctx.fill();
    }
  }

  drawTireMarks(marks: TireMark[]) {
    const ctx = this.ctx;
    for (const m of marks) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.fillStyle = `rgba(20,20,20,${m.alpha})`;
      ctx.fillRect(-6, -2, 12, 4);
      ctx.restore();
    }
  }

  drawItemBoxes(boxes: ItemBoxInstance[], time: number) {
    const ctx = this.ctx;
    for (const b of boxes) {
      if (b.collected) continue;
      const bob = Math.sin(time * 0.005 + b.idx) * 3;
      ctx.save();
      ctx.translate(b.x, b.y + bob);
      ctx.rotate(Math.sin(time * 0.003 + b.idx) * 0.15);
      const grad = ctx.createLinearGradient(-14, -14, 14, 14);
      grad.addColorStop(0, '#ff88ff');
      grad.addColorStop(0.5, '#88ffff');
      grad.addColorStop(1, '#ffff88');
      ctx.fillStyle = grad;
      ctx.fillRect(-14, -14, 28, 28);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -14, 28, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Press Start 2P", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 1);
      ctx.restore();
    }
  }

  drawBananas(bananas: BananaInstance[]) {
    const ctx = this.ctx;
    for (const b of bananas) {
      if (!b.active) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = '#ffdd22';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ccaa11';
      ctx.fillRect(-10, -1, 20, 2);
      ctx.fillStyle = '#664400';
      ctx.fillRect(12, -3, 3, 6);
      ctx.restore();
    }
  }

  drawMissiles(missiles: MissileInstance[]) {
    const ctx = this.ctx;
    for (const m of missiles) {
      if (!m.active) continue;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.fillStyle = '#cc2233';
      ctx.fillRect(-10, -5, 18, 10);
      ctx.fillStyle = '#881122';
      ctx.beginPath();
      ctx.moveTo(8, -5);
      ctx.lineTo(14, 0);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(-4, -2, 4, 4);
      ctx.fillStyle = '#222222';
      ctx.fillRect(-10, -7, 4, 4);
      ctx.fillRect(-10, 3, 4, 4);
      ctx.restore();
    }
  }

  drawCar(car: Car, time: number) {
    const ctx = this.ctx;
    const timeLight = TIME_LIGHTING[this.env.timeOfDay];

    const cust = car.customization;
    const bodyColor = cust ? cust.bodyColor : car.color;
    const bodyDark = cust ? this.darkenColor(cust.bodyColor, 0.3) : car.colorDark;
    const wheelColor = cust ? cust.wheelColor : '#111111';

    if (timeLight.headlightAlpha > 0.05 && !car.finished) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      const hlAlpha = timeLight.headlightAlpha * 0.6;
      const grad = ctx.createRadialGradient(20, 0, 8, 20, 0, 180);
      grad.addColorStop(0, `rgba(255,240,180,${hlAlpha})`);
      grad.addColorStop(0.4, `rgba(255,230,150,${hlAlpha * 0.5})`);
      grad.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(12, -18);
      ctx.lineTo(220, -70);
      ctx.lineTo(220, 70);
      ctx.lineTo(12, 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    if (car.hasShield) {
      const pulse = 0.7 + 0.3 * Math.sin(time * 0.01);
      ctx.strokeStyle = `rgba(80,220,255,${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (car.boostTime > 0) {
      const f = 0.5 + 0.5 * Math.sin(time * 0.04);
      ctx.fillStyle = `rgba(255,200,0,${f})`;
      ctx.beginPath();
      ctx.moveTo(-14, -5);
      ctx.lineTo(-22 - f * 6, 0);
      ctx.lineTo(-14, 5);
      ctx.closePath();
      ctx.fill();
    }

    const wheelOffset = car.drifting ? 0.12 * Math.sign(car.driftAngle || 1) : 0;
    ctx.fillStyle = wheelColor;
    ctx.fillRect(-12, -13, 8, 5);
    ctx.fillRect(-12, 8, 8, 5);
    ctx.save();
    ctx.translate(10, -13);
    ctx.rotate(wheelOffset);
    ctx.fillRect(-4, 0, 8, 5);
    ctx.restore();
    ctx.save();
    ctx.translate(10, 8);
    ctx.rotate(wheelOffset);
    ctx.fillRect(-4, -5, 8, 5);
    ctx.restore();

    ctx.fillStyle = bodyColor;
    ctx.fillRect(-14, -10, 26, 20);
    ctx.fillStyle = bodyDark;
    ctx.fillRect(-14, -10, 26, 3);
    ctx.fillRect(-14, 7, 26, 3);
    ctx.fillStyle = bodyDark;
    ctx.fillRect(-14, -10, 5, 20);

    if (cust && cust.stripeEnabled && cust.stripePattern !== 'none') {
      ctx.fillStyle = cust.stripeColor;
      if (cust.stripePattern === 'single') {
        ctx.fillRect(-14, -1, 26, 2);
      } else if (cust.stripePattern === 'double') {
        ctx.fillRect(-14, -5, 26, 2);
        ctx.fillRect(-14, 3, 26, 2);
      } else if (cust.stripePattern === 'checker') {
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 13; col++) {
            if ((row + col) % 2 === 0) {
              ctx.fillRect(-13 + col * 2, -6 + row * 2, 2, 2);
            }
          }
        }
      } else if (cust.stripePattern === 'flame') {
        const sc = cust.stripeColor;
        ctx.fillStyle = sc;
        ctx.beginPath();
        ctx.moveTo(-14, -1);
        ctx.lineTo(-10, -2);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-4, -2);
        ctx.lineTo(0, -6);
        ctx.lineTo(4, -1);
        ctx.lineTo(8, -5);
        ctx.lineTo(12, 0);
        ctx.lineTo(12, 2);
        ctx.lineTo(-14, 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = this.darkenColor(sc, 0.25);
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-10, -1);
        ctx.lineTo(-8, -5);
        ctx.lineTo(-4, -1);
        ctx.lineTo(0, -3.5);
        ctx.lineTo(4, 0);
        ctx.lineTo(8, -2);
        ctx.lineTo(12, 0.5);
        ctx.lineTo(12, 1);
        ctx.lineTo(-14, 1);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.fillStyle = '#223344';
    ctx.fillRect(-2, -7, 10, 14);
    ctx.fillStyle = '#44aadd';
    ctx.fillRect(0, -5, 6, 10);

    ctx.fillStyle = '#ffcc33';
    ctx.fillRect(10, -6, 3, 3);
    ctx.fillRect(10, 3, 3, 3);

    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-14, -6, 3, 3);
    ctx.fillRect(-14, 3, 3, 3);

    if (cust && cust.numberEnabled && cust.number) {
      ctx.fillStyle = cust.numberColor;
      ctx.font = 'bold 8px "Press Start 2P", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cust.number.slice(0, 2), -6, 0);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -2, 2, 4);
    }

    ctx.restore();

    if (car.isPlayer && !car.finished) {
      ctx.save();
      ctx.translate(car.x, car.y - 32);
      const t = Math.sin(time * 0.01) * 2;
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.moveTo(-8, -8 + t);
      ctx.lineTo(0, 0);
      ctx.lineTo(8, -8 + t);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawVignette() {
    const ctx = this.ctx;
    const w = this.viewportW;
    const h = this.viewportH;
    const timeLight = TIME_LIGHTING[this.env.timeOfDay];
    const baseAlpha = 0.55 * timeLight.vignetteMul;
    const grad = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.3,
      w / 2, h / 2, Math.max(w, h) * 0.8
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${baseAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawScanlines(time: number) {
    const ctx = this.ctx;
    const w = this.viewportW;
    const h = this.viewportH;
    const timeLight = TIME_LIGHTING[this.env.timeOfDay];
    const mul = timeLight.scanlineMul;
    ctx.save();
    ctx.globalAlpha = 0.08 * mul;
    ctx.fillStyle = '#000000';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }
    ctx.globalAlpha = 0.04 * mul;
    const barY = (time * 0.2) % h;
    ctx.fillRect(0, barY, w, 60);
    ctx.restore();
  }

  drawWeatherParticles() {
    const ctx = this.ctx;
    for (const p of this.weatherParticles) {
      if (p.type === 'rain') {
        ctx.strokeStyle = 'rgba(180,200,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.3, p.y + p.size);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        const s = p.size;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }
  }

  drawFog() {
    const ctx = this.ctx;
    const w = this.viewportW;
    const h = this.viewportH;
    const weatherVis = WEATHER_VISUAL[this.env.weather];
    const timeLight = TIME_LIGHTING[this.env.timeOfDay];
    const fogAlpha = Math.max(weatherVis.fogAlpha, timeLight.ambientAlpha);
    if (fogAlpha <= 0) return;

    let fogColor = 'rgba(200,200,210,';
    if (this.env.timeOfDay === 'night') fogColor = 'rgba(30,30,60,';
    else if (this.env.timeOfDay === 'sunset') fogColor = 'rgba(255,180,150,';
    else if (this.env.timeOfDay === 'dawn') fogColor = 'rgba(255,220,200,';

    const grad = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.1,
      w / 2, h / 2, Math.max(w, h) * 0.8
    );
    grad.addColorStop(0, fogColor + '0)');
    grad.addColorStop(0.5, fogColor + (fogAlpha * 0.5) + ')');
    grad.addColorStop(1, fogColor + fogAlpha + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawTimeTint() {
    const ctx = this.ctx;
    const w = this.viewportW;
    const h = this.viewportH;
    const timeLight = TIME_LIGHTING[this.env.timeOfDay];
    if (timeLight.skyTint && timeLight.ambientAlpha > 0) {
      ctx.fillStyle = timeLight.skyTint;
      ctx.fillRect(0, 0, w, h);
    }

    if (timeLight.ambientAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${timeLight.ambientAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawRoadWet(track: Track) {
    const ctx = this.ctx;
    const weatherVis = WEATHER_VISUAL[this.env.weather];
    if (weatherVis.roadWetAlpha <= 0) return;
    const pts = track.points;
    const hw = track.width / 2 * 0.9;
    const alpha = weatherVis.roadWetAlpha;
    const color = this.env.weather === 'snow'
      ? `rgba(240,240,255,${alpha})`
      : `rgba(150,180,220,${alpha})`;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i <= pts.length; i++) {
      const p = pts[i % pts.length];
      const dx = pts[(i + 1) % pts.length].x - pts[i % pts.length].x;
      const dy = pts[(i + 1) % pts.length].y - pts[i % pts.length].y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * hw;
      const ny = dx / len * hw;
      if (i === 0) ctx.moveTo(p.x + nx, p.y + ny);
      else ctx.lineTo(p.x + nx, p.y + ny);
    }
    for (let i = pts.length; i >= 0; i--) {
      const p = pts[i % pts.length];
      const dx = pts[(i + 1) % pts.length].x - pts[i % pts.length].x;
      const dy = pts[(i + 1) % pts.length].y - pts[i % pts.length].y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * hw;
      const ny = dx / len * hw;
      ctx.lineTo(p.x - nx, p.y - ny);
    }
    ctx.closePath();
    ctx.fill();
  }

  drawCountdown(num: number, time: number) {
    const ctx = this.ctx;
    const w = this.viewportW;
    const h = this.viewportH;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);
    const scale = 1 + 0.15 * Math.sin(time * 0.03);
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (num > 0) {
      ctx.font = 'bold 120px "Press Start 2P", "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 8;
      ctx.strokeText(String(num), 0, 0);
      ctx.fillText(String(num), 0, 0);
    } else {
      ctx.font = 'bold 80px "Press Start 2P", "Courier New", monospace';
      ctx.fillStyle = '#00ff88';
      ctx.strokeStyle = '#008844';
      ctx.lineWidth = 8;
      ctx.strokeText('GO!', 0, 0);
      ctx.fillText('GO!', 0, 0);
    }
    ctx.restore();
  }
}

export const ITEM_ICON: Record<ItemType, string> = {
  boost: '⚡',
  shield: '🛡',
  banana: '🍌',
  missile: '🚀',
};

export const ITEM_COLOR: Record<ItemType, string> = {
  boost: '#ffdd00',
  shield: '#33ccff',
  banana: '#ffaa22',
  missile: '#ff4466',
};
