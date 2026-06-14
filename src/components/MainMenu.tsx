import { useGameStore } from '../store/gameStore';
import { CAR_TEMPLATES } from '../engine/cars';
import type { GameMode, WeatherType, TimeOfDay } from '../engine/types';
import { ChevronLeft, ChevronRight, Play, Gamepad2, Users, Timer, Trophy, Monitor, Sun, Cloud, CloudSnow, CloudRain, Moon, Sunset, Sunrise, CloudFog } from 'lucide-react';

export default function MainMenu() {
  const selectedCarIdP1 = useGameStore((s) => s.selectedCarIdP1);
  const selectedCarIdP2 = useGameStore((s) => s.selectedCarIdP2);
  const gameMode = useGameStore((s) => s.gameMode);
  const playerCount = useGameStore((s) => s.playerCount);
  const splitLayout = useGameStore((s) => s.splitLayout);
  const weather = useGameStore((s) => s.weather);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const selectCarP1 = useGameStore((s) => s.selectCarP1);
  const selectCarP2 = useGameStore((s) => s.selectCarP2);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const setPlayerCount = useGameStore((s) => s.setPlayerCount);
  const setSplitLayout = useGameStore((s) => s.setSplitLayout);
  const setWeather = useGameStore((s) => s.setWeather);
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay);
  const resetForCountdown = useGameStore((s) => s.resetForCountdown);

  const weatherOptions: { id: WeatherType; label: string; desc: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; effect: string }[] = [
    { id: 'clear', label: '晴天', desc: '晴朗干燥', icon: Sun, color: '#ffdd00', effect: '标准手感' },
    { id: 'rain', label: '雨天', desc: '路面湿滑', icon: CloudRain, color: '#33ccff', effect: '抓地力-30% · 易漂移' },
    { id: 'snow', label: '雪天', desc: '积雪覆盖', icon: CloudSnow, color: '#aaddff', effect: '抓地力-50% · 极易漂移' },
    { id: 'fog', label: '雾天', desc: '雾气弥漫', icon: CloudFog, color: '#bbbbcc', effect: '视野受限 · 抓地力-10%' },
  ];

  const timeOptions: { id: TimeOfDay; label: string; desc: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; effect: string }[] = [
    { id: 'day', label: '白天', desc: '阳光充足', icon: Sun, color: '#ffee88', effect: '标准光照' },
    { id: 'dawn', label: '黎明', desc: '晨光熹微', icon: Sunrise, color: '#ffbb88', effect: '抓地力-4%' },
    { id: 'sunset', label: '黄昏', desc: '夕阳西下', icon: Sunset, color: '#ff8844', effect: '抓地力-6%' },
    { id: 'night', label: '夜晚', desc: '车灯照亮', icon: Moon, color: '#8888cc', effect: '抓地力-12% · 车头灯开启' },
  ];

  const bar = (val: number, max: number, color = '#00ff88') => {
    const pct = Math.min(100, (val / max) * 100);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-[#1a1a3a] border-2 border-[#2a2a5a] relative overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    );
  };

  const CarSelector = ({ selectedId, onSelect, label, color }: {
    selectedId: number;
    onSelect: (id: number) => void;
    label: string;
    color: string;
  }) => {
    const car = CAR_TEMPLATES[selectedId];
    const prev = () => onSelect((selectedId - 1 + CAR_TEMPLATES.length) % CAR_TEMPLATES.length);
    const next = () => onSelect((selectedId + 1) % CAR_TEMPLATES.length);

    return (
      <div className="flex-1 max-w-md">
        <div className="text-center mb-3" style={{ color }}>
          <span className="text-sm md:text-base tracking-widest">{label}</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full justify-center">
          <button
            onClick={prev}
            className="p-2 md:p-3 bg-[#1a1a3a] border-4 border-[#333366] text-white hover:bg-[#2a2a5a] hover:border-[#00ff88] active:translate-y-1 transition-all"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <div
            className="flex-1 p-3 md:p-5 text-center border-4 transition-all"
            style={{
              background: '#12122a',
              borderColor: car.color,
              boxShadow: `0 0 20px ${car.color}55, 4px 4px 0 #000000`,
            }}
          >
            <div
              className="text-lg md:text-2xl mb-2 tracking-widest"
              style={{ color: car.color, textShadow: `2px 2px 0 ${car.colorDark}` }}
            >
              {car.name}
            </div>
            <div className="flex justify-center mb-3">
              <div
                className="w-20 h-14 md:w-28 md:h-20 relative"
                style={{ imageRendering: 'pixelated' }}
              >
                <svg viewBox="0 0 40 28" className="w-full h-full">
                  <rect x="2" y="8" width="4" height="3" fill="#111" />
                  <rect x="2" y="17" width="4" height="3" fill="#111" />
                  <rect x="34" y="8" width="4" height="3" fill="#111" />
                  <rect x="34" y="17" width="4" height="3" fill="#111" />
                  <rect x="4" y="6" width="32" height="18" fill={car.color} />
                  <rect x="4" y="6" width="32" height="3" fill={car.colorDark} />
                  <rect x="4" y="21" width="32" height="3" fill={car.colorDark} />
                  <rect x="4" y="6" width="5" height="18" fill={car.colorDark} />
                  <rect x="18" y="8" width="12" height="14" fill="#223344" />
                  <rect x="20" y="10" width="8" height="10" fill="#44aadd" />
                  <rect x="32" y="10" width="3" height="3" fill="#ffcc33" />
                  <rect x="32" y="15" width="3" height="3" fill="#ffcc33" />
                  <rect x="5" y="10" width="3" height="3" fill="#ff4444" />
                  <rect x="5" y="15" width="3" height="3" fill="#ff4444" />
                </svg>
              </div>
            </div>
            <div className="space-y-2 text-left text-[9px] md:text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-12 text-[#aaaaee]">SPD</span>
                {bar(car.maxSpeed, 6, color)}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-[#aaaaee]">ACC</span>
                {bar(car.acceleration, 0.25, color)}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-[#aaaaee]">HND</span>
                {bar(car.handling, 0.08, color)}
              </div>
            </div>
          </div>

          <button
            onClick={next}
            className="p-2 md:p-3 bg-[#1a1a3a] border-4 border-[#333366] text-white hover:bg-[#2a2a5a] hover:border-[#00ff88] active:translate-y-1 transition-all"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
        <div className="flex gap-2 mt-3 justify-center">
          {CAR_TEMPLATES.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="w-5 h-5 md:w-6 md:h-6 border-4 transition-all"
              style={{
                background: c.color,
                borderColor: selectedId === c.id ? '#ffffff' : '#000000',
                transform: selectedId === c.id ? 'translateY(-2px)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const ModeButton = ({ mode, icon: Icon, label, desc }: {
    mode: GameMode;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string;
    desc: string;
  }) => {
    const active = gameMode === mode;
    return (
      <button
        onClick={() => setGameMode(mode)}
        className={`flex-1 p-3 md:p-4 border-4 transition-all ${active ? 'translate-y-[-2px]' : ''}`}
        style={{
          background: active ? '#1a1a3a' : '#12122a',
          borderColor: active ? '#00ff88' : '#333366',
          boxShadow: active ? '0 0 20px #00ff8844, 4px 4px 0 #000000' : '4px 4px 0 #000000',
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <Icon className="w-6 h-6 md:w-8 md:h-8" style={{ color: active ? '#00ff88' : '#8888aa' }} />
          <div className="text-xs md:text-sm tracking-wider" style={{ color: active ? '#00ff88' : '#ccccdd' }}>
            {label}
          </div>
          <div className="text-[8px] md:text-[10px]" style={{ color: '#8888aa' }}>
            {desc}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden overflow-y-auto py-4">
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: 8, height: 8,
              background: ['#ff3366', '#ffdd00', '#33ccff', '#00ff88'][i % 4],
              animation: `pulse-glow ${2 + (i % 3)}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center mb-4 md:mb-6 px-4">
        <h1
          className="text-3xl md:text-5xl lg:text-6xl mb-2 tracking-wider"
          style={{
            color: '#00ff88',
            textShadow: '4px 4px 0 #005533, 0 0 40px #00ff8855',
            lineHeight: 1.2,
          }}
        >
          PIXEL
        </h1>
        <h1
          className="text-3xl md:text-5xl lg:text-6xl tracking-widest"
          style={{
            color: '#ff3366',
            textShadow: '4px 4px 0 #550011, 0 0 40px #ff336655',
            lineHeight: 1.2,
          }}
        >
          KART
        </h1>
        <div className="mt-2 text-[10px] md:text-sm" style={{ color: '#8888aa' }}>
          像 素 赛 车 · 极 速 漂 移
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 md:gap-5 w-full max-w-5xl px-3 md:px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-2 md:mb-3" style={{ color: '#33ccff' }}>
            <span className="text-[10px] md:text-xs tracking-widest">GAME MODE</span>
          </div>
          <div className="flex gap-3 md:gap-4">
            <ModeButton
              mode="grandprix"
              icon={Trophy}
              label="GRAND PRIX"
              desc="3 AI对手 · 道具对战"
            />
            <ModeButton
              mode="timeattack"
              icon={Timer}
              label="TIME ATTACK"
              desc="无对手 · 无道具 · 刷圈速"
            />
          </div>
        </div>

        <div className="w-full max-w-2xl">
            <div className="text-center mb-2 md:mb-3" style={{ color: '#ffdd00' }}>
              <span className="text-[10px] md:text-xs tracking-widest">PLAYERS</span>
            </div>
            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setPlayerCount(1)}
                className={`flex-1 p-3 md:p-4 border-4 transition-all ${playerCount === 1 ? 'translate-y-[-2px]' : ''}`}
                style={{
                  background: playerCount === 1 ? '#1a1a3a' : '#12122a',
                  borderColor: playerCount === 1 ? '#ffdd00' : '#333366',
                  boxShadow: playerCount === 1 ? '0 0 20px #ffdd0044, 4px 4px 0 #000000' : '4px 4px 0 #000000',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-6 h-6 md:w-8 md:h-8" style={{ color: playerCount === 1 ? '#ffdd00' : '#8888aa' }} />
                  <div className="text-xs md:text-sm tracking-wider" style={{ color: playerCount === 1 ? '#ffdd00' : '#ccccdd' }}>
                    1 PLAYER
                  </div>
                  <div className="text-[8px] md:text-[10px]" style={{ color: '#8888aa' }}>
                    {gameMode === 'timeattack' ? '单人刷圈速' : '单人对战AI'}
                  </div>
                </div>
              </button>
              <button
                onClick={() => setPlayerCount(2)}
                className={`flex-1 p-3 md:p-4 border-4 transition-all ${playerCount === 2 ? 'translate-y-[-2px]' : ''}`}
                style={{
                  background: playerCount === 2 ? '#1a1a3a' : '#12122a',
                  borderColor: playerCount === 2 ? '#ff3366' : '#333366',
                  boxShadow: playerCount === 2 ? '0 0 20px #ff336644, 4px 4px 0 #000000' : '4px 4px 0 #000000',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-6 h-6 md:w-8 md:h-8" style={{ color: playerCount === 2 ? '#ff3366' : '#8888aa' }} />
                  <div className="text-xs md:text-sm tracking-wider" style={{ color: playerCount === 2 ? '#ff3366' : '#ccccdd' }}>
                    2 PLAYERS
                  </div>
                  <div className="text-[8px] md:text-[10px]" style={{ color: '#8888aa' }}>
                    本地双人分屏
                  </div>
                </div>
              </button>
            </div>
          </div>

        {playerCount === 2 && (
          <div className="w-full max-w-2xl">
            <div className="text-center mb-2 md:mb-3" style={{ color: '#33ccff' }}>
              <span className="text-[10px] md:text-xs tracking-widest">SPLIT SCREEN</span>
            </div>
            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => setSplitLayout('horizontal')}
                className={`flex-1 p-3 md:p-4 border-4 transition-all ${splitLayout === 'horizontal' ? 'translate-y-[-2px]' : ''}`}
                style={{
                  background: splitLayout === 'horizontal' ? '#1a1a3a' : '#12122a',
                  borderColor: splitLayout === 'horizontal' ? '#33ccff' : '#333366',
                  boxShadow: splitLayout === 'horizontal' ? '0 0 20px #33ccff44, 4px 4px 0 #000000' : '4px 4px 0 #000000',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Monitor className="w-6 h-6 md:w-8 md:h-8" style={{ color: splitLayout === 'horizontal' ? '#33ccff' : '#8888aa' }} />
                  <div className="text-xs md:text-sm tracking-wider" style={{ color: splitLayout === 'horizontal' ? '#33ccff' : '#ccccdd' }}>
                    上下分屏
                  </div>
                  <div className="text-[8px] md:text-[10px]" style={{ color: '#8888aa' }}>
                    HORIZONTAL
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSplitLayout('vertical')}
                className={`flex-1 p-3 md:p-4 border-4 transition-all ${splitLayout === 'vertical' ? 'translate-y-[-2px]' : ''}`}
                style={{
                  background: splitLayout === 'vertical' ? '#1a1a3a' : '#12122a',
                  borderColor: splitLayout === 'vertical' ? '#33ccff' : '#333366',
                  boxShadow: splitLayout === 'vertical' ? '0 0 20px #33ccff44, 4px 4px 0 #000000' : '4px 4px 0 #000000',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Monitor className="w-6 h-6 md:w-8 md:h-8" style={{ color: splitLayout === 'vertical' ? '#33ccff' : '#8888aa' }} />
                  <div className="text-xs md:text-sm tracking-wider" style={{ color: splitLayout === 'vertical' ? '#33ccff' : '#ccccdd' }}>
                    左右分屏
                  </div>
                  <div className="text-[8px] md:text-[10px]" style={{ color: '#8888aa' }}>
                    VERTICAL
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 md:gap-6 w-full justify-center">
          <CarSelector
            selectedId={selectedCarIdP1}
            onSelect={selectCarP1}
            label="PLAYER 1"
            color="#00ff88"
          />
          {playerCount === 2 && (
            <CarSelector
              selectedId={selectedCarIdP2}
              onSelect={selectCarP2}
              label="PLAYER 2"
              color="#ff3366"
            />
          )}
        </div>

        <div className="w-full max-w-2xl">
          <div className="text-center mb-2 md:mb-3" style={{ color: '#aaffcc' }}>
            <span className="text-[10px] md:text-xs tracking-widest">WEATHER 天气</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {weatherOptions.map((w) => {
              const active = weather === w.id;
              const Icon = w.icon;
              return (
                <button
                  key={w.id}
                  onClick={() => setWeather(w.id)}
                  className={`p-2 md:p-3 border-4 transition-all ${active ? 'translate-y-[-2px]' : ''}`}
                  style={{
                    background: active ? '#1a1a3a' : '#12122a',
                    borderColor: active ? w.color : '#333366',
                    boxShadow: active ? `0 0 20px ${w.color}44, 4px 4px 0 #000000` : '4px 4px 0 #000000',
                  }}
                >
                  <div className="flex flex-col items-center gap-1 md:gap-2">
                    <Icon className="w-5 h-5 md:w-7 md:h-7" style={{ color: active ? w.color : '#8888aa' }} />
                    <div className="text-[10px] md:text-[11px] tracking-wider" style={{ color: active ? w.color : '#ccccdd' }}>
                      {w.label}
                    </div>
                    <div className="text-[7px] md:text-[8px]" style={{ color: '#8888aa' }}>
                      {w.effect}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-2xl">
          <div className="text-center mb-2 md:mb-3" style={{ color: '#ffcc88' }}>
            <span className="text-[10px] md:text-xs tracking-widest">TIME OF DAY 时间段</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {timeOptions.map((t) => {
              const active = timeOfDay === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTimeOfDay(t.id)}
                  className={`p-2 md:p-3 border-4 transition-all ${active ? 'translate-y-[-2px]' : ''}`}
                  style={{
                    background: active ? '#1a1a3a' : '#12122a',
                    borderColor: active ? t.color : '#333366',
                    boxShadow: active ? `0 0 20px ${t.color}44, 4px 4px 0 #000000` : '4px 4px 0 #000000',
                  }}
                >
                  <div className="flex flex-col items-center gap-1 md:gap-2">
                    <Icon className="w-5 h-5 md:w-7 md:h-7" style={{ color: active ? t.color : '#8888aa' }} />
                    <div className="text-[10px] md:text-[11px] tracking-wider" style={{ color: active ? t.color : '#ccccdd' }}>
                      {t.label}
                    </div>
                    <div className="text-[7px] md:text-[8px]" style={{ color: '#8888aa' }}>
                      {t.effect}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={resetForCountdown}
          className="mt-1 px-8 md:px-12 py-3 md:py-4 text-base md:text-xl flex items-center gap-3 hover:-translate-y-1 active:translate-y-1 transition-all"
          style={{
            background: '#00ff88',
            color: '#003322',
            border: '4px solid #00aa55',
            boxShadow: '6px 6px 0 #000000',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />
          START GAME
        </button>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 w-full max-w-2xl p-3 md:p-5 mt-1 border-4"
          style={{ background: '#12122a', borderColor: '#333366', boxShadow: '4px 4px 0 #000000' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2 text-[10px] md:text-xs" style={{ color: '#33ccff' }}>
              <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" /> P1 CONTROLS
            </div>
            <div className="space-y-1 text-[9px] md:text-[10px]" style={{ color: '#ccccdd' }}>
              <div className="flex justify-between"><span>W / ↑</span><span style={{ color: '#00ff88' }}>ACCELERATE</span></div>
              <div className="flex justify-between"><span>S / ↓</span><span style={{ color: '#ff6688' }}>BRAKE</span></div>
              <div className="flex justify-between"><span>A / ←</span><span style={{ color: '#ffdd00' }}>LEFT</span></div>
              <div className="flex justify-between"><span>D / →</span><span style={{ color: '#ffdd00' }}>RIGHT</span></div>
              <div className="flex justify-between"><span>LSHIFT</span><span style={{ color: '#ff88cc' }}>DRIFT</span></div>
              <div className="flex justify-between"><span>SPACE</span><span style={{ color: '#ffaa22' }}>ITEM</span></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 text-[10px] md:text-xs" style={{ color: '#ff3366' }}>
              <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" /> {playerCount === 2 ? 'P2 CONTROLS' : 'INFO'}
            </div>
            {playerCount === 2 ? (
              <div className="space-y-1 text-[9px] md:text-[10px]" style={{ color: '#ccccdd' }}>
                <div className="flex justify-between"><span>I</span><span style={{ color: '#00ff88' }}>ACCELERATE</span></div>
                <div className="flex justify-between"><span>K</span><span style={{ color: '#ff6688' }}>BRAKE</span></div>
                <div className="flex justify-between"><span>J</span><span style={{ color: '#ffdd00' }}>LEFT</span></div>
                <div className="flex justify-between"><span>L</span><span style={{ color: '#ffdd00' }}>RIGHT</span></div>
                <div className="flex justify-between"><span>RSHIFT</span><span style={{ color: '#ff88cc' }}>DRIFT</span></div>
                <div className="flex justify-between"><span>ENTER</span><span style={{ color: '#ffaa22' }}>ITEM</span></div>
              </div>
            ) : (
              <div className="space-y-1 text-[9px] md:text-[10px]" style={{ color: '#ccccdd' }}>
                <div className="flex justify-between">
                  <span>3 LAPS</span>
                  <span style={{ color: gameMode === 'timeattack' ? '#ffdd00' : '#33ccff' }}>
                    {gameMode === 'timeattack' ? '刷最佳圈速' : 'TO WIN'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>⭐ BOX</span>
                  <span style={{ color: '#aaff88' }}>
                    {gameMode === 'timeattack' ? '无道具' : 'GET ITEM'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>💨 DRIFT</span>
                  <span style={{ color: '#ff88cc' }}>攒加速</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
