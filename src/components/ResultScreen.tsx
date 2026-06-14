import { useGameStore } from '../store/gameStore';
import { formatTime } from '../utils/math';
import { CAR_TEMPLATES } from '../engine/cars';
import { RotateCcw, Home } from 'lucide-react';

export default function ResultScreen() {
  const cars = useGameStore((s) => s.cars);
  const rankings = useGameStore((s) => s.rankings);
  const resetForCountdown = useGameStore((s) => s.resetForCountdown);
  const backToMenu = useGameStore((s) => s.backToMenu);

  const player = cars.find((c) => c.isPlayer);
  const sortedIds = rankings.length > 0 ? rankings : [...cars]
    .sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.lap - a.lap || b.checkpoint - a.checkpoint;
    })
    .map((c) => c.id);

  const playerRank = sortedIds.findIndex((id) => cars.find((c) => c.id === id)?.isPlayer) + 1;
  const won = playerRank === 1;

  const medals = ['🥇', '🥈', '🥉', '🏁'];
  const rankColors = ['#ffdd00', '#cccccc', '#cc8844', '#88aaff'];
  const rankShadows = ['#665500', '#444444', '#442200', '#334466'];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 overflow-auto" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="max-w-2xl w-full p-6 md:p-10 border-4 relative"
        style={{
          background: '#0f0f28',
          borderColor: won ? '#ffdd00' : '#ff3366',
          boxShadow: won ? '0 0 60px #ffdd0055, 8px 8px 0 #000' : '0 0 40px #ff336655, 8px 8px 0 #000',
        }}
      >
        <div className="text-center mb-8">
          <div
            className="text-3xl md:text-5xl mb-4 tracking-widest"
            style={{
              color: won ? '#ffdd00' : '#ff3366',
              textShadow: won ? '4px 4px 0 #665500, 0 0 40px #ffdd0088' : '4px 4px 0 #550011, 0 0 40px #ff336688',
            }}
          >
            {won ? '🏆 VICTORY! 🏆' : 'RACE FINISHED'}
          </div>
          <div style={{ color: '#8888aa' }} className="text-xs md:text-sm tracking-wider">
            {won ? 'YOU ARE THE CHAMPION!' : `You reached rank #${playerRank}`}
          </div>
        </div>

        <div className="space-y-2 md:space-y-3 mb-8">
          {sortedIds.map((id, idx) => {
            const car = cars.find((c) => c.id === id);
            if (!car) return null;
            const tpl = CAR_TEMPLATES[(car.isPlayer ? useGameStore.getState().selectedCarId : (id === 0 ? 0 : id)) % CAR_TEMPLATES.length];
            const isPlayer = car.isPlayer;
            const displayColor = isPlayer
              ? CAR_TEMPLATES[useGameStore.getState().selectedCarId].color
              : CAR_TEMPLATES[(id + 1) % CAR_TEMPLATES.length].color;
            void tpl;

            return (
              <div
                key={id}
                className="flex items-center gap-3 md:gap-5 p-3 md:p-4 border-4 transition-all"
                style={{
                  background: isPlayer ? '#1a1a4a' : '#15152e',
                  borderColor: isPlayer ? displayColor : '#2a2a55',
                  boxShadow: isPlayer ? `0 0 20px ${displayColor}55, 3px 3px 0 #000` : '3px 3px 0 #000',
                  transform: isPlayer ? 'scale(1.02)' : 'none',
                }}
              >
                <div
                  className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-2xl md:text-3xl border-4"
                  style={{
                    background: rankColors[idx],
                    borderColor: rankShadows[idx],
                    color: rankShadows[idx],
                  }}
                >
                  {medals[idx] || idx + 1}
                </div>

                <div
                  className="w-14 h-10 md:w-20 md:h-14 flex items-center justify-center border-4 shrink-0"
                  style={{ background: displayColor + '22', borderColor: displayColor }}
                >
                  <svg viewBox="0 0 40 28" className="w-full h-full px-2">
                    <rect x="4" y="6" width="32" height="18" fill={displayColor} />
                    <rect x="4" y="6" width="5" height="18" fill="#00000044" />
                    <rect x="18" y="8" width="12" height="14" fill="#223344" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs md:text-sm mb-1 md:mb-2 tracking-wider"
                    style={{ color: isPlayer ? displayColor : '#aaaaee' }}
                  >
                    {isPlayer ? '★ YOU ★' : `CPU #${id}`}
                  </div>
                  <div className="text-[10px] md:text-xs" style={{ color: '#666' }}>
                    {car.bestLapTime < Infinity ? `BEST: ${formatTime(car.bestLapTime)}` : '—'}
                  </div>
                </div>

                <div
                  className="text-right text-sm md:text-lg md:text-2xl tracking-widest shrink-0"
                  style={{
                    color: rankColors[idx],
                    textShadow: `2px 2px 0 ${rankShadows[idx]}`,
                  }}
                >
                  {car.finished ? formatTime(car.finishTime) : 'DNF'}
                </div>
              </div>
            );
          })}
        </div>

        {player && player.bestLapTime < Infinity && (
          <div className="flex justify-center gap-4 md:gap-8 mb-8 text-[10px] md:text-xs flex-wrap">
            <div className="text-center px-4 py-3 border-2" style={{ borderColor: '#333366', background: '#15152e' }}>
              <div style={{ color: '#8888aa' }} className="mb-1">YOUR RANK</div>
              <div style={{ color: '#ffdd00', fontSize: '1.5em' }}>#{playerRank}</div>
            </div>
            <div className="text-center px-4 py-3 border-2" style={{ borderColor: '#333366', background: '#15152e' }}>
              <div style={{ color: '#8888aa' }} className="mb-1">TOTAL TIME</div>
              <div style={{ color: '#00ff88', fontSize: '1.5em' }}>{player.finished ? formatTime(player.finishTime) : '—'}</div>
            </div>
            <div className="text-center px-4 py-3 border-2" style={{ borderColor: '#333366', background: '#15152e' }}>
              <div style={{ color: '#8888aa' }} className="mb-1">BEST LAP</div>
              <div style={{ color: '#33ccff', fontSize: '1.5em' }}>{formatTime(player.bestLapTime)}</div>
            </div>
          </div>
        )}

        <div className="flex gap-3 md:gap-5 justify-center flex-wrap">
          <button
            onClick={resetForCountdown}
            className="px-6 md:px-10 py-3 md:py-4 flex items-center gap-2 md:gap-3 text-xs md:text-sm hover:-translate-y-1 active:translate-y-1 transition-all"
            style={{
              background: '#00ff88',
              color: '#003322',
              border: '4px solid #00aa55',
              boxShadow: '5px 5px 0 #000000',
            }}
          >
            <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
            RACE AGAIN
          </button>
          <button
            onClick={backToMenu}
            className="px-6 md:px-10 py-3 md:py-4 flex items-center gap-2 md:gap-3 text-xs md:text-sm hover:-translate-y-1 active:translate-y-1 transition-all"
            style={{
              background: '#333355',
              color: '#ccccdd',
              border: '4px solid #555588',
              boxShadow: '5px 5px 0 #000000',
            }}
          >
            <Home className="w-5 h-5 md:w-6 md:h-6" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
