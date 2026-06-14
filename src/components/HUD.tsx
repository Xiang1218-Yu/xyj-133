import { useGameStore } from '../store/gameStore';
import { formatTime } from '../utils/math';
import { ITEM_ICON, ITEM_COLOR } from '../engine/renderer';

export default function HUD() {
  const cars = useGameStore((s) => s.cars);
  const totalLaps = useGameStore((s) => s.totalLaps);
  const raceTime = useGameStore((s) => s.raceTime);

  const player = cars.find((c) => c.isPlayer);
  if (!player) return null;

  const sorted = [...cars].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    const lapDiff = b.lap - a.lap;
    if (lapDiff !== 0) return lapDiff;
    return b.checkpoint - a.checkpoint;
  });
  const rank = sorted.findIndex((c) => c.isPlayer) + 1;

  const speedPct = Math.min(100, (Math.abs(player.speed) / player.maxSpeed) * 100);
  const speedKmh = Math.round(Math.abs(player.speed) * 32);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 text-[10px] md:text-xs">
      <div
        className="absolute top-3 left-3 md:top-6 md:left-6 p-3 md:p-5 border-4"
        style={{ background: 'rgba(10,10,30,0.85)', borderColor: '#333366', boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
      >
        <div style={{ color: '#8888aa' }} className="mb-2 tracking-wider">LAP</div>
        <div style={{ color: '#00ff88', fontSize: '1.5em', textShadow: '2px 2px 0 #005533' }}>
          {Math.min(player.lap + 1, totalLaps)} <span style={{ color: '#666', fontSize: '0.6em' }}>/ {totalLaps}</span>
        </div>
        <div style={{ color: '#8888aa' }} className="mt-3 mb-2 tracking-wider">TIME</div>
        <div style={{ color: '#ffdd00', fontSize: '1.2em', letterSpacing: 2 }}>
          {formatTime(raceTime)}
        </div>
        {player.bestLapTime < Infinity && (
          <>
            <div style={{ color: '#8888aa' }} className="mt-3 mb-2 tracking-wider">BEST</div>
            <div style={{ color: '#33ccff', letterSpacing: 2 }}>
              {formatTime(player.bestLapTime)}
            </div>
          </>
        )}
      </div>

      <div
        className="absolute top-3 right-3 md:top-6 md:right-6 p-3 md:p-5 border-4 w-40 md:w-56"
        style={{ background: 'rgba(10,10,30,0.85)', borderColor: '#333366', boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
      >
        <div style={{ color: '#8888aa' }} className="mb-3 tracking-wider">SPEED</div>
        <div
          className="h-4 md:h-5 mb-2 border-2 overflow-hidden relative"
          style={{ borderColor: '#2a2a5a', background: '#1a1a3a' }}
        >
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${speedPct}%`,
              background: `linear-gradient(90deg, #00ff88, #ffdd00, #ff3366)`,
            }}
          />
        </div>
        <div className="text-right" style={{ color: '#ffffff', fontSize: '1.5em', textShadow: '2px 2px 0 #000' }}>
          {speedKmh}<span style={{ color: '#888', fontSize: '0.5em' }}> KM/H</span>
        </div>
      </div>

      <div
        className="absolute bottom-3 left-3 md:bottom-6 md:left-6 p-3 md:p-4 border-4"
        style={{ background: 'rgba(10,10,30,0.85)', borderColor: '#333366', boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
      >
        <div style={{ color: '#8888aa' }} className="mb-3 tracking-wider">POSITION</div>
        <div
          style={{
            color: rank === 1 ? '#ffdd00' : rank === 2 ? '#cccccc' : rank === 3 ? '#cc8844' : '#ffffff',
            fontSize: '2.5em',
            textShadow: '3px 3px 0 #000',
          }}
        >
          {rank}<span style={{ fontSize: '0.4em', color: '#666' }}> / {cars.length}</span>
        </div>
      </div>

      <div
        className="absolute bottom-3 right-3 md:bottom-6 md:right-6 p-3 md:p-4 border-4 flex items-center gap-3 md:gap-5"
        style={{ background: 'rgba(10,10,30,0.85)', borderColor: '#333366', boxShadow: '4px 4px 0 rgba(0,0,0,0.6)' }}
      >
        <div style={{ color: '#8888aa' }} className="tracking-wider text-[10px] md:text-xs">ITEM</div>
        <div
          className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center text-3xl md:text-5xl border-4"
          style={{
            background: player.currentItem ? `${ITEM_COLOR[player.currentItem]}33` : '#1a1a3a',
            borderColor: player.currentItem ? ITEM_COLOR[player.currentItem] : '#2a2a5a',
            boxShadow: player.currentItem ? `0 0 20px ${ITEM_COLOR[player.currentItem]}66` : 'none',
          }}
        >
          {player.currentItem ? ITEM_ICON[player.currentItem] : (
            <span style={{ color: '#444466', fontSize: '0.5em' }}>—</span>
          )}
        </div>
        <div className="text-[9px] md:text-[10px]" style={{ color: '#8888aa' }}>
          [SPACE]
        </div>
      </div>

      {(player.boostTime > 0 || player.hasShield) && (
        <div
          className="absolute top-1/2 left-3 md:left-6 -translate-y-1/2 flex flex-col gap-2 md:gap-3"
        >
          {player.boostTime > 0 && (
            <div
              className="px-3 py-2 md:px-4 md:py-3 border-4"
              style={{ background: 'rgba(255,200,0,0.2)', borderColor: '#ffdd00', color: '#ffdd00', boxShadow: '0 0 20px #ffdd0066' }}
            >
              ⚡ BOOST {Math.ceil(player.boostTime / 1000)}s
            </div>
          )}
          {player.hasShield && (
            <div
              className="px-3 py-2 md:px-4 md:py-3 border-4"
              style={{ background: 'rgba(80,200,255,0.2)', borderColor: '#33ccff', color: '#33ccff', boxShadow: '0 0 20px #33ccff66' }}
            >
              🛡 SHIELD {Math.ceil(player.shieldTime / 1000)}s
            </div>
          )}
        </div>
      )}
    </div>
  );
}
