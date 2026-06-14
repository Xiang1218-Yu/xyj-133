import { useGameStore } from '../store/gameStore';
import { CAR_TEMPLATES } from '../engine/cars';
import { ChevronLeft, ChevronRight, Play, Gamepad2, Info } from 'lucide-react';

export default function MainMenu() {
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  const selectCar = useGameStore((s) => s.selectCar);
  const resetForCountdown = useGameStore((s) => s.resetForCountdown);
  const car = CAR_TEMPLATES[selectedCarId];

  const prev = () => selectCar((selectedCarId - 1 + CAR_TEMPLATES.length) % CAR_TEMPLATES.length);
  const next = () => selectCar((selectedCarId + 1) % CAR_TEMPLATES.length);

  const bar = (val: number, max: number) => {
    const pct = Math.min(100, (val / max) * 100);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-[#1a1a3a] border-2 border-[#2a2a5a] relative overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${pct}%`, background: '#00ff88' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
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

      <div className="relative z-10 text-center mb-8 px-4">
        <h1
          className="text-4xl md:text-6xl lg:text-7xl mb-3 tracking-wider"
          style={{
            color: '#00ff88',
            textShadow: '4px 4px 0 #005533, 0 0 40px #00ff8855',
            lineHeight: 1.2,
          }}
        >
          PIXEL
        </h1>
        <h1
          className="text-4xl md:text-6xl lg:text-7xl tracking-widest"
          style={{
            color: '#ff3366',
            textShadow: '4px 4px 0 #550011, 0 0 40px #ff336655',
            lineHeight: 1.2,
          }}
        >
          KART
        </h1>
        <div className="mt-4 text-xs md:text-sm" style={{ color: '#8888aa' }}>
          像 素 赛 车 · 极 速 漂 移
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-4xl px-4">
        <div className="flex items-center gap-4 md:gap-6 w-full justify-center">
          <button
            onClick={prev}
            className="p-3 md:p-4 bg-[#1a1a3a] border-4 border-[#333366] text-white hover:bg-[#2a2a5a] hover:border-[#00ff88] active:translate-y-1 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <div
            className="flex-1 max-w-md p-5 md:p-8 text-center border-4 transition-all"
            style={{
              background: '#12122a',
              borderColor: car.color,
              boxShadow: `0 0 30px ${car.color}55, 6px 6px 0 #000000`,
            }}
          >
            <div
              className="text-xl md:text-3xl mb-4 tracking-widest"
              style={{ color: car.color, textShadow: `3px 3px 0 ${car.colorDark}` }}
            >
              {car.name}
            </div>
            <div className="flex justify-center mb-6">
              <div
                className="w-28 h-20 md:w-36 md:h-24 relative"
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

            <div className="space-y-3 text-left text-[10px] md:text-xs">
              <div className="flex items-center gap-3">
                <span className="w-16 md:w-20 text-[#aaaaee]">SPEED</span>
                {bar(car.maxSpeed, 6)}
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 md:w-20 text-[#aaaaee]">ACCEL</span>
                {bar(car.acceleration, 0.25)}
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 md:w-20 text-[#aaaaee]">HANDLE</span>
                {bar(car.handling, 0.08)}
              </div>
            </div>
          </div>

          <button
            onClick={next}
            className="p-3 md:p-4 bg-[#1a1a3a] border-4 border-[#333366] text-white hover:bg-[#2a2a5a] hover:border-[#00ff88] active:translate-y-1 transition-all"
            style={{ boxShadow: '4px 4px 0 #000000' }}
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        <div className="flex gap-2 text-[10px] md:text-xs">
          {CAR_TEMPLATES.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCar(c.id)}
              className="w-5 h-5 md:w-6 md:h-6 border-4 transition-all"
              style={{
                background: c.color,
                borderColor: selectedCarId === c.id ? '#ffffff' : '#000000',
                transform: selectedCarId === c.id ? 'translateY(-2px)' : 'none',
              }}
            />
          ))}
        </div>

        <button
          onClick={resetForCountdown}
          className="mt-2 px-10 md:px-16 py-4 md:py-5 text-base md:text-xl flex items-center gap-3 hover:-translate-y-1 active:translate-y-1 transition-all"
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
          className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl p-4 md:p-6 mt-2 border-4"
          style={{ background: '#12122a', borderColor: '#333366', boxShadow: '4px 4px 0 #000000' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-3 text-[10px] md:text-xs" style={{ color: '#33ccff' }}>
              <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" /> CONTROLS
            </div>
            <div className="space-y-2 text-[10px] md:text-xs" style={{ color: '#ccccdd' }}>
              <div className="flex justify-between"><span>W / ↑</span><span style={{ color: '#00ff88' }}>ACCELERATE</span></div>
              <div className="flex justify-between"><span>S / ↓</span><span style={{ color: '#ff6688' }}>BRAKE</span></div>
              <div className="flex justify-between"><span>A / ←</span><span style={{ color: '#ffdd00' }}>LEFT</span></div>
              <div className="flex justify-between"><span>D / →</span><span style={{ color: '#ffdd00' }}>RIGHT</span></div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3 text-[10px] md:text-xs" style={{ color: '#33ccff' }}>
              <Info className="w-4 h-4 md:w-5 md:h-5" /> ACTIONS
            </div>
            <div className="space-y-2 text-[10px] md:text-xs" style={{ color: '#ccccdd' }}>
              <div className="flex justify-between"><span>SHIFT</span><span style={{ color: '#ff88cc' }}>DRIFT</span></div>
              <div className="flex justify-between"><span>SPACE</span><span style={{ color: '#ffaa22' }}>USE ITEM</span></div>
              <div className="flex justify-between"><span>⭐ BOX</span><span style={{ color: '#aaff88' }}>GET ITEM</span></div>
              <div className="flex justify-between"><span>3 LAPS</span><span style={{ color: '#33ccff' }}>TO WIN!</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
