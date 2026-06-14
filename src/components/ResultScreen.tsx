import type { Car, ReplayData } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { formatTime } from '../utils/math';
import { CAR_TEMPLATES } from '../engine/cars';
import { RotateCcw, Home, Timer, Trophy, Users, Play } from 'lucide-react';

export default function ResultScreen() {
  const cars = useGameStore((s) => s.cars);
  const rankings = useGameStore((s) => s.rankings);
  const gameMode = useGameStore((s) => s.gameMode);
  const playerCount = useGameStore((s) => s.playerCount);
  const selectedCarIdP1 = useGameStore((s) => s.selectedCarIdP1);
  const selectedCarIdP2 = useGameStore((s) => s.selectedCarIdP2);
  const weather = useGameStore((s) => s.weather);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const resetForCountdown = useGameStore((s) => s.resetForCountdown);
  const backToMenu = useGameStore((s) => s.backToMenu);
  const startReplay = useGameStore((s) => s.startReplay);

  const isTimeAttack = gameMode === 'timeattack';
  const isTwoPlayer = playerCount === 2;
  const playerCars = cars.filter((c) => c.isPlayer);

  const sortedIds = rankings.length > 0 ? rankings : [...cars]
    .sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.lap - a.lap || b.checkpoint - a.checkpoint;
    })
    .map((c) => c.id);

  const getPlayerRank = (playerIdx: number) => {
    return sortedIds.findIndex((id) => {
      const car = cars.find((c) => c.id === id);
      return car?.isPlayer && car?.playerIndex === playerIdx;
    }) + 1;
  };

  const p1Rank = getPlayerRank(0);
  const p2Rank = isTwoPlayer ? getPlayerRank(1) : -1;
  const p1Won = p1Rank === 1;
  const p2Won = p2Rank === 1;
  const anyPlayerWon = p1Won || p2Won;
  const isDraw = isTwoPlayer && p1Rank === p2Rank;

  const medals = ['🥇', '🥈', '🥉', '🏁'];
  const rankColors = ['#ffdd00', '#cccccc', '#cc8844', '#88aaff'];
  const rankShadows = ['#665500', '#444444', '#442200', '#334466'];

  const getCarColor = (car: Car) => {
    if (!car.isPlayer) {
      return car.color;
    }
    if (car.playerIndex === 0) {
      return CAR_TEMPLATES[selectedCarIdP1].color;
    }
    return CAR_TEMPLATES[selectedCarIdP2].color;
  };

  const getCarName = (car: Car) => {
    if (!car.isPlayer) return `CPU #${car.id}`;
    if (car.playerIndex === 0) return '★ P1 ★';
    return '★ P2 ★';
  };

  const getTitle = () => {
    if (isTimeAttack) {
      if (isTwoPlayer) {
        if (isDraw) return '🤝 DRAW! 🤝';
        return p1Won ? '🏆 P1 WINS! 🏆' : '🏆 P2 WINS! 🏆';
      }
      return '⏱️ TIME ATTACK ⏱️';
    }
    if (isDraw) return '🤝 DRAW! 🤝';
    if (isTwoPlayer) {
      return p1Won ? '🏆 P1 WINS! 🏆' : '🏆 P2 WINS! 🏆';
    }
    return p1Won ? '🏆 VICTORY! 🏆' : 'RACE FINISHED';
  };

  const getSubtitle = () => {
    if (isTimeAttack) {
      if (isTwoPlayer) {
        return `P1: ${playerCars[0]?.bestLapTime < Infinity ? formatTime(playerCars[0].bestLapTime) : '—'} | P2: ${playerCars[1]?.bestLapTime < Infinity ? formatTime(playerCars[1].bestLapTime) : '—'}`;
      }
      const p1 = playerCars[0];
      if (p1?.bestLapTime < Infinity) {
        return `Best Lap: ${formatTime(p1.bestLapTime)}`;
      }
      return 'Challenge yourself to beat your best!';
    }
    if (isDraw) return 'Both players tied!';
    if (isTwoPlayer) {
      return `P1: #${p1Rank} | P2: #${p2Rank}`;
    }
    return p1Won ? 'YOU ARE THE CHAMPION!' : `You reached rank #${p1Rank}`;
  };

  const getBorderColor = () => {
    if (isTimeAttack) {
      if (isTwoPlayer) {
        if (isDraw) return '#ffdd00';
        return p1Won ? '#00ff88' : '#ff3366';
      }
      return '#33ccff';
    }
    if (isDraw) return '#ffdd00';
    if (isTwoPlayer) return p1Won ? '#00ff88' : '#ff3366';
    return anyPlayerWon ? '#ffdd00' : '#ff3366';
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 md:p-4 overflow-auto" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div
        className="max-w-2xl w-full p-4 md:p-6 border-4 relative my-auto"
        style={{
          background: '#0f0f28',
          borderColor: getBorderColor(),
          boxShadow: `0 0 60px ${getBorderColor()}55, 8px 8px 0 #000`,
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="text-center mb-3 md:mb-4 shrink-0">
          <div className="flex justify-center gap-2 mb-2">
            {isTimeAttack && !isTwoPlayer ? (
              <Timer className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#33ccff' }} />
            ) : isTwoPlayer ? (
              <Users className="w-5 h-5 md:w-6 md:h-6" style={{ color: getBorderColor() }} />
            ) : (
              <Trophy className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#ffdd00' }} />
            )}
          </div>
          <div
            className="text-xl md:text-3xl mb-2 tracking-widest"
            style={{
              color: getBorderColor(),
              textShadow: `4px 4px 0 #000, 0 0 40px ${getBorderColor()}88`,
            }}
          >
            {getTitle()}
          </div>
          <div style={{ color: '#8888aa' }} className="text-[10px] md:text-sm tracking-wider">
            {getSubtitle()}
          </div>
          <div style={{ color: '#666688' }} className="text-[9px] md:text-[10px] mt-1 tracking-wider">
            {isTimeAttack ? (isTwoPlayer ? 'TIME ATTACK · 2P' : 'TIME ATTACK MODE') : isTwoPlayer ? 'GRAND PRIX · 2P' : 'GRAND PRIX MODE'}
          </div>
        </div>

        {playerCars.length > 0 && (
          <div className="flex justify-center gap-2 md:gap-4 mb-3 md:mb-4 text-[9px] md:text-xs flex-wrap shrink-0">
            {playerCars.map((car) => {
              const isP1 = car.playerIndex === 0;
              const rank = isP1 ? p1Rank : p2Rank;
              const playerColor = isP1 ? '#00ff88' : '#ff3366';
              return (
                <div key={car.id} className="text-center px-3 py-2 md:px-4 md:py-3 border-2" 
                  style={{ 
                    borderColor: playerColor, 
                    background: '#15152e',
                    boxShadow: `0 0 15px ${playerColor}33`
                  }}
                >
                  <div style={{ color: playerColor }} className="mb-0.5 md:mb-1 text-[10px]">
                    P{car.playerIndex + 1}
                  </div>
                  {!isTimeAttack && (
                    <div style={{ color: '#ffdd00', fontSize: '1.1em' }} className="mb-0.5 md:mb-1">
                      #{rank}
                    </div>
                  )}
                  <div style={{ color: '#00ff88', fontSize: '1.1em' }} className="mb-0.5 md:mb-1">
                    {car.finished ? formatTime(car.finishTime) : '—'}
                  </div>
                  {car.bestLapTime < Infinity && (
                    <div style={{ color: '#33ccff', fontSize: '0.9em' }}>
                      BEST: {formatTime(car.bestLapTime)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isTimeAttack && (
          <div className="space-y-2 mb-3 md:mb-4 overflow-y-auto flex-1 min-h-0">
            {sortedIds.map((id, idx) => {
              const car = cars.find((c) => c.id === id);
              if (!car) return null;
              const displayColor = getCarColor(car);
              const name = getCarName(car);

              return (
                <div
                  key={id}
                  className="flex items-center gap-2 md:gap-4 p-2 md:p-3 border-4 transition-all"
                  style={{
                    background: car.isPlayer ? '#1a1a4a' : '#15152e',
                    borderColor: car.isPlayer ? displayColor : '#2a2a55',
                    boxShadow: car.isPlayer ? `0 0 20px ${displayColor}55, 3px 3px 0 #000` : '3px 3px 0 #000',
                    transform: car.isPlayer ? 'scale(1.01)' : 'none',
                  }}
                >
                  <div
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg md:text-2xl border-4 shrink-0"
                    style={{
                      background: rankColors[idx],
                      borderColor: rankShadows[idx],
                      color: rankShadows[idx],
                    }}
                  >
                    {medals[idx] || idx + 1}
                  </div>

                  <div
                    className="w-12 h-8 md:w-16 md:h-10 flex items-center justify-center border-4 shrink-0"
                    style={{ background: displayColor + '22', borderColor: displayColor }}
                  >
                    <svg viewBox="0 0 40 28" className="w-full h-full px-1">
                      <rect x="4" y="6" width="32" height="18" fill={displayColor} />
                      <rect x="4" y="6" width="5" height="18" fill="#00000044" />
                      <rect x="18" y="8" width="12" height="14" fill="#223344" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[10px] md:text-xs mb-0.5 md:mb-1 tracking-wider"
                      style={{ color: car.isPlayer ? displayColor : '#aaaaee' }}
                    >
                      {name}
                    </div>
                    <div className="text-[9px] md:text-[10px]" style={{ color: '#666' }}>
                      {car.bestLapTime < Infinity ? `BEST: ${formatTime(car.bestLapTime)}` : '—'}
                    </div>
                  </div>

                  <div
                    className="text-right text-xs md:text-lg tracking-widest shrink-0"
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
        )}

        {isTimeAttack && (
          <div className="flex justify-center items-center mb-3 md:mb-4 flex-1 min-h-0 gap-2 md:gap-4 flex-wrap">
            {isTwoPlayer ? (
              <>
                <div 
                  className="text-center px-4 py-3 md:px-6 md:py-5 border-4" 
                  style={{ 
                    borderColor: p1Won ? '#00ff88' : '#333366', 
                    background: '#15152e',
                    boxShadow: p1Won ? '0 0 30px #00ff8844' : 'none'
                  }}
                >
                  <div style={{ color: '#00ff88' }} className="mb-2 text-[10px] md:text-sm tracking-wider">
                    {p1Won ? '🏆 P1 🏆' : 'P1'}
                  </div>
                  <div style={{ color: '#8888aa' }} className="mb-1 text-[9px] md:text-[10px]">BEST LAP</div>
                  <div style={{ color: '#33ccff', fontSize: '1.5em', textShadow: '2px 2px 0 #000' }} className="tracking-wider mb-2">
                    {playerCars[0]?.bestLapTime < Infinity ? formatTime(playerCars[0].bestLapTime) : '—'}
                  </div>
                  <div style={{ color: '#8888aa' }} className="text-[9px] md:text-[10px]">
                    TOTAL: {playerCars[0]?.finished ? formatTime(playerCars[0].finishTime) : '—'}
                  </div>
                </div>
                <div 
                  className="text-center px-4 py-3 md:px-6 md:py-5 border-4" 
                  style={{ 
                    borderColor: p2Won ? '#ff3366' : '#333366', 
                    background: '#15152e',
                    boxShadow: p2Won ? '0 0 30px #ff336644' : 'none'
                  }}
                >
                  <div style={{ color: '#ff3366' }} className="mb-2 text-[10px] md:text-sm tracking-wider">
                    {p2Won ? '🏆 P2 🏆' : 'P2'}
                  </div>
                  <div style={{ color: '#8888aa' }} className="mb-1 text-[9px] md:text-[10px]">BEST LAP</div>
                  <div style={{ color: '#33ccff', fontSize: '1.5em', textShadow: '2px 2px 0 #000' }} className="tracking-wider mb-2">
                    {playerCars[1]?.bestLapTime < Infinity ? formatTime(playerCars[1].bestLapTime) : '—'}
                  </div>
                  <div style={{ color: '#8888aa' }} className="text-[9px] md:text-[10px]">
                    TOTAL: {playerCars[1]?.finished ? formatTime(playerCars[1].finishTime) : '—'}
                  </div>
                </div>
              </>
            ) : (
              playerCars[0]?.bestLapTime < Infinity && (
                <div 
                  className="text-center px-6 py-4 md:px-8 md:py-6 border-4" 
                  style={{ 
                    borderColor: '#33ccff', 
                    background: '#15152e',
                    boxShadow: '0 0 30px #33ccff44'
                  }}
                >
                  <div style={{ color: '#8888aa' }} className="mb-2 text-[10px] md:text-sm tracking-wider">
                    🏆 BEST LAP TIME 🏆
                  </div>
                  <div style={{ color: '#33ccff', fontSize: '2em', textShadow: '2px 2px 0 #000' }} className="tracking-wider">
                    {formatTime(playerCars[0].bestLapTime)}
                  </div>
                  <div style={{ color: '#8888aa' }} className="mt-2 text-[9px] md:text-xs">
                    Total: {playerCars[0].finished ? formatTime(playerCars[0].finishTime) : '—'}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <div className="flex justify-center mb-2 gap-2 md:gap-3 text-[9px] md:text-[10px] tracking-wider shrink-0 flex-wrap">
          <div className="px-3 py-1.5 border-2" style={{ background: '#15152e', borderColor: '#aaddff', color: '#aaddff' }}>
            🌤 {weather === 'clear' ? '晴天' : weather === 'rain' ? '雨天' : weather === 'snow' ? '雪天' : '雾天'}
          </div>
          <div className="px-3 py-1.5 border-2" style={{ background: '#15152e', borderColor: '#ffcc88', color: '#ffcc88' }}>
            {timeOfDay === 'day' ? '☀ 白天' : timeOfDay === 'dawn' ? '🌅 黎明' : timeOfDay === 'sunset' ? '🌇 黄昏' : '🌙 夜晚'}
          </div>
        </div>

        <div className="flex gap-2 md:gap-4 justify-center flex-wrap shrink-0">
          <button
            onClick={() => {
              const lastReplay = (window as unknown as { __lastReplay?: ReplayData }).__lastReplay;
              if (lastReplay) startReplay(lastReplay);
            }}
            className="px-5 md:px-8 py-2.5 md:py-3.5 flex items-center gap-2 text-[10px] md:text-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
            style={{
              background: '#33ccff',
              color: '#002244',
              border: '4px solid #1188bb',
              boxShadow: '4px 4px 0 #000000',
            }}
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            WATCH REPLAY
          </button>
          <button
            onClick={resetForCountdown}
            className="px-5 md:px-8 py-2.5 md:py-3.5 flex items-center gap-2 text-[10px] md:text-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
            style={{
              background: '#00ff88',
              color: '#003322',
              border: '4px solid #00aa55',
              boxShadow: '4px 4px 0 #000000',
            }}
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
            RACE AGAIN
          </button>
          <button
            onClick={backToMenu}
            className="px-5 md:px-8 py-2.5 md:py-3.5 flex items-center gap-2 text-[10px] md:text-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
            style={{
              background: '#333355',
              color: '#ccccdd',
              border: '4px solid #555588',
              boxShadow: '4px 4px 0 #000000',
            }}
          >
            <Home className="w-4 h-4 md:w-5 md:h-5" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
