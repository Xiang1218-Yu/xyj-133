import type { Car } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { formatTime } from '../utils/math';
import { ITEM_ICON, ITEM_COLOR } from '../engine/renderer';

interface PlayerHUDProps {
  playerCar: Car;
  allCars: Car[];
  totalLaps: number;
  raceTime: number;
  gameMode: string;
  splitLayout: 'horizontal' | 'vertical';
  viewportIdx: number;
  playerCount: number;
  wackyMode: boolean;
}

const PlayerHUD = ({ playerCar, allCars, totalLaps, raceTime, gameMode, splitLayout, viewportIdx, playerCount, wackyMode }: PlayerHUDProps) => {
  const isTimeAttack = gameMode === 'timeattack';
  const isDrift = gameMode === 'drift';
  const isSplit = playerCount === 2;
  const playerColor = playerCar.playerIndex === 0 ? '#00ff88' : '#ff3366';

  const sorted = [...allCars].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    const lapDiff = b.lap - a.lap;
    if (lapDiff !== 0) return lapDiff;
    return b.checkpoint - a.checkpoint;
  });
  const rank = sorted.findIndex((c) => c.id === playerCar.id) + 1;

  const speedPct = Math.min(100, (Math.abs(playerCar.speed) / playerCar.maxSpeed) * 100);
  const speedKmh = Math.round(Math.abs(playerCar.speed) * 32);

  const containerStyle = isSplit ? {
    position: 'absolute' as const,
    top: splitLayout === 'horizontal' ? (viewportIdx === 0 ? '0' : '50%') : '0',
    bottom: splitLayout === 'horizontal' ? (viewportIdx === 0 ? '50%' : '0') : '0',
    left: splitLayout === 'vertical' ? (viewportIdx === 0 ? '0' : '50%') : '0',
    right: splitLayout === 'vertical' ? (viewportIdx === 0 ? '50%' : '0') : '0',
  } : { position: 'absolute' as const, inset: '0' };

  const itemKey = playerCar.playerIndex === 0 ? 'SPACE' : 'ENTER';

  return (
    <div style={containerStyle} className="pointer-events-none z-20 text-[9px] md:text-[10px]">
      <div
        className={`absolute top-1 left-1 md:top-3 md:left-6 p-2 md:p-3 border-4`}
        style={{ background: 'rgba(10,10,30,0.85)', borderColor: playerColor, boxShadow: '3px 3px 0 rgba(0,0,0,0.6)' }}
      >
        <div style={{ color: playerColor, fontSize: '0.8em' }} className="mb-1 tracking-wider">
          P{playerCar.playerIndex + 1}
        </div>
        {isDrift ? (
          <>
            <div style={{ color: '#8888aa' }} className="mb-1 tracking-wider">DRIFT SCORE</div>
            <div style={{ color: '#ff88cc', fontSize: '1.4em', textShadow: '1px 1px 0 #552244' }}>
              {Math.floor(playerCar.driftScore)}
            </div>
            {playerCar.maxDriftCombo > 0 && (
              <>
                <div style={{ color: '#8888aa' }} className="mt-2 mb-1 tracking-wider">MAX COMBO</div>
                <div style={{ color: '#ffdd00', fontSize: '1em', letterSpacing: 1 }}>
                  x{playerCar.maxDriftCombo}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ color: '#8888aa' }} className="mb-1 tracking-wider">LAP</div>
            <div style={{ color: '#00ff88', fontSize: '1.2em', textShadow: '1px 1px 0 #005533' }}>
              {Math.min(playerCar.lap + 1, totalLaps)} <span style={{ color: '#666', fontSize: '0.6em' }}>/ {totalLaps}</span>
            </div>
            <div style={{ color: '#8888aa' }} className="mt-2 mb-1 tracking-wider">TIME</div>
            <div style={{ color: '#ffdd00', fontSize: '1em', letterSpacing: 1 }}>
              {formatTime(raceTime)}
            </div>
            {playerCar.bestLapTime < Infinity && (
              <>
                <div style={{ color: '#8888aa' }} className="mt-2 mb-1 tracking-wider">BEST</div>
                <div style={{ color: '#33ccff', letterSpacing: 1, fontSize: isTimeAttack ? '1.2em' : '1em' }}>
                  {formatTime(playerCar.bestLapTime)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div
        className={`absolute top-1 right-1 md:top-3 md:right-6 p-2 md:p-3 border-4 w-28 md:w-40`}
        style={{ background: 'rgba(10,10,30,0.85)', borderColor: '#333366', boxShadow: '3px 3px 0 rgba(0,0,0,0.6)' }}
      >
        <div style={{ color: '#8888aa' }} className="mb-2 tracking-wider">{isDrift ? 'DRIFT' : 'SPEED'}</div>
        {isDrift ? (
          <>
            {playerCar.driftCombo > 0 && (
              <div
                className="text-center mb-2"
                style={{
                  color: playerCar.driftCombo >= 5 ? '#ff3366' : playerCar.driftCombo >= 3 ? '#ffdd00' : '#ff88cc',
                  fontSize: '1.5em',
                  textShadow: '2px 2px 0 #000',
                  animation: playerCar.drifting ? 'pulse-glow 0.5s ease-in-out infinite' : 'none',
                }}
              >
                COMBO x{playerCar.driftCombo}
              </div>
            )}
            <div
              className="h-3 md:h-4 mb-1 border-2 overflow-hidden relative"
              style={{ borderColor: '#2a2a5a', background: '#1a1a3a' }}
            >
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${Math.min(100, (playerCar.currentDriftPoints / 500) * 100)}%`,
                  background: `linear-gradient(90deg, #ff88cc, #ff3366, #ffdd00)`,
                }}
              />
            </div>
            <div className="text-right" style={{ color: '#ff88cc', fontSize: '1em', textShadow: '1px 1px 0 #000' }}>
              +{Math.floor(playerCar.currentDriftPoints)}
            </div>
          </>
        ) : (
          <>
            <div
              className="h-3 md:h-4 mb-1 border-2 overflow-hidden relative"
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
            <div className="text-right" style={{ color: '#ffffff', fontSize: '1.2em', textShadow: '1px 1px 0 #000' }}>
              {speedKmh}<span style={{ color: '#888', fontSize: '0.5em' }}> KM/H</span>
            </div>
          </>
        )}
      </div>

      {!isTimeAttack && !isDrift && (
        <>
          <div
            className={`absolute bottom-1 left-1 md:bottom-3 md:left-6 p-2 md:p-3 border-4`}
            style={{ background: 'rgba(10,10,30,0.85)', borderColor: '#333366', boxShadow: '3px 3px 0 rgba(0,0,0,0.6)' }}
          >
            <div style={{ color: '#8888aa' }} className="mb-2 tracking-wider">POSITION</div>
            <div
              style={{
                color: rank === 1 ? '#ffdd00' : rank === 2 ? '#cccccc' : rank === 3 ? '#cc8844' : '#ffffff',
                fontSize: '2em',
                textShadow: '2px 2px 0 #000',
              }}
            >
              {rank}<span style={{ fontSize: '0.4em', color: '#666' }}> / {allCars.length}</span>
            </div>
          </div>

          <div
            className={`absolute bottom-1 right-1 md:bottom-3 md:right-6 p-2 md:p-3 border-4 flex items-center gap-2 md:gap-3`}
            style={{ background: 'rgba(10,10,30,0.85)', borderColor: '#333366', boxShadow: '3px 3px 0 rgba(0,0,0,0.6)' }}
          >
            <div style={{ color: '#8888aa' }} className="tracking-wider text-[8px] md:text-[10px]">ITEM</div>
            <div
              className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-2xl md:text-4xl border-4"
              style={{
                background: playerCar.currentItem ? `${ITEM_COLOR[playerCar.currentItem]}33` : '#1a1a3a',
                borderColor: playerCar.currentItem ? ITEM_COLOR[playerCar.currentItem] : '#2a2a5a',
                boxShadow: playerCar.currentItem ? `0 0 15px ${ITEM_COLOR[playerCar.currentItem]}66` : 'none',
              }}
            >
              {playerCar.currentItem ? ITEM_ICON[playerCar.currentItem] : (
                <span style={{ color: '#444466', fontSize: '0.5em' }}>—</span>
              )}
            </div>
            <div className="text-[8px] md:text-[9px]" style={{ color: '#8888aa' }}>
              [{itemKey}]
            </div>
          </div>
        </>
      )}

      {(playerCar.boostTime > 0 || playerCar.hasShield || playerCar.scale !== 1 || playerCar.isGhost || playerCar.hasMagnet || playerCar.hyperBoostTime > 0) && (
        <div
          className={`absolute top-1/2 left-1 md:left-6 -translate-y-1/2 flex flex-col gap-1 md:gap-2`}
        >
          {playerCar.hyperBoostTime > 0 && (
            <div
              className="px-2 py-1 md:px-3 md:py-2 border-4 text-[8px] md:text-[10px]"
              style={{ background: 'rgba(255,0,255,0.2)', borderColor: '#ff00ff', color: '#ff00ff', boxShadow: '0 0 15px #ff00ff66' }}
            >
              🌟 超级加速 {Math.ceil(playerCar.hyperBoostTime / 1000)}s
            </div>
          )}
          {playerCar.boostTime > 0 && playerCar.hyperBoostTime <= 0 && (
            <div
              className="px-2 py-1 md:px-3 md:py-2 border-4 text-[8px] md:text-[10px]"
              style={{ background: 'rgba(255,200,0,0.2)', borderColor: '#ffdd00', color: '#ffdd00', boxShadow: '0 0 15px #ffdd0066' }}
            >
              ⚡ 加速 {Math.ceil(playerCar.boostTime / 1000)}s
            </div>
          )}
          {playerCar.hasShield && (
            <div
              className="px-2 py-1 md:px-3 md:py-2 border-4 text-[8px] md:text-[10px]"
              style={{ background: 'rgba(80,200,255,0.2)', borderColor: '#33ccff', color: '#33ccff', boxShadow: '0 0 15px #33ccff66' }}
            >
              🛡 护盾 {Math.ceil(playerCar.shieldTime / 1000)}s
            </div>
          )}
          {playerCar.scale < 1 && (
            <div
              className="px-2 py-1 md:px-3 md:py-2 border-4 text-[8px] md:text-[10px]"
              style={{ background: 'rgba(136,255,136,0.2)', borderColor: '#88ff88', color: '#88ff88', boxShadow: '0 0 15px #88ff8866' }}
            >
              🔽 缩小 {Math.ceil(playerCar.scaleTime / 1000)}s
            </div>
          )}
          {playerCar.scale > 1 && (
            <div
              className="px-2 py-1 md:px-3 md:py-2 border-4 text-[8px] md:text-[10px]"
              style={{ background: 'rgba(255,136,68,0.2)', borderColor: '#ff8844', color: '#ff8844', boxShadow: '0 0 15px #ff884466' }}
            >
              🔼 巨型 {Math.ceil(playerCar.scaleTime / 1000)}s
            </div>
          )}
          {playerCar.isGhost && (
            <div
              className="px-2 py-1 md:px-3 md:py-2 border-4 text-[8px] md:text-[10px]"
              style={{ background: 'rgba(170,136,255,0.2)', borderColor: '#aa88ff', color: '#aa88ff', boxShadow: '0 0 15px #aa88ff66' }}
            >
              👻 幽灵 {Math.ceil(playerCar.ghostTime / 1000)}s
            </div>
          )}
          {playerCar.hasMagnet && (
            <div
              className="px-2 py-1 md:px-3 md:py-2 border-4 text-[8px] md:text-[10px]"
              style={{ background: 'rgba(255,68,136,0.2)', borderColor: '#ff4488', color: '#ff4488', boxShadow: '0 0 15px #ff448866' }}
            >
              🧲 磁铁 {Math.ceil(playerCar.magnetTime / 1000)}s
            </div>
          )}
        </div>
      )}

      {wackyMode && (
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 md:bottom-3"
        >
          <div
            className="px-3 py-1 md:px-4 md:py-2 border-4 flex items-center gap-2"
            style={{
              background: playerCar.gravityFlipped ? 'rgba(255,0,255,0.2)' : 'rgba(0,255,136,0.15)',
              borderColor: playerCar.gravityFlipped ? '#ff00ff' : '#00ff88',
              boxShadow: playerCar.gravityFlipped ? '0 0 15px #ff00ff66' : '0 0 10px #00ff8844',
            }}
          >
            <span style={{ color: playerCar.gravityFlipped ? '#ff00ff' : '#00ff88', fontSize: '1.2em' }}>
              {playerCar.gravityFlipped ? '▲' : '▼'}
            </span>
            <span
              className="text-[8px] md:text-[10px] tracking-wider"
              style={{ color: playerCar.gravityFlipped ? '#ff00ff' : '#00ff88' }}
            >
              {playerCar.gravityFlipped ? 'CEILING' : 'FLOOR'}
            </span>
            {playerCar.gravityFlipped && (
              <span
                className="text-[7px] md:text-[8px]"
                style={{ color: '#ff8888' }}
              >
                操控反转!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function HUD() {
  const cars = useGameStore((s) => s.cars);
  const totalLaps = useGameStore((s) => s.totalLaps);
  const raceTime = useGameStore((s) => s.raceTime);
  const gameMode = useGameStore((s) => s.gameMode);
  const playerCount = useGameStore((s) => s.playerCount);
  const splitLayout = useGameStore((s) => s.splitLayout);
  const wackyMode = useGameStore((s) => s.wackyMode);

  const playerCars = cars.filter((c) => c.isPlayer);
  if (playerCars.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {playerCars.map((car, idx) => (
        <PlayerHUD
          key={car.id}
          playerCar={car}
          allCars={cars}
          totalLaps={totalLaps}
          raceTime={raceTime}
          gameMode={gameMode}
          splitLayout={splitLayout}
          viewportIdx={idx}
          playerCount={playerCount}
          wackyMode={wackyMode}
        />
      ))}
    </div>
  );
}
