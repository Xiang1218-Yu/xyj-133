import { useGameStore } from './store/gameStore'
import MainMenu from './components/MainMenu'
import GameCanvas from './components/GameCanvas'
import HUD from './components/HUD'
import ResultScreen from './components/ResultScreen'

export default function App() {
  const phase = useGameStore(s => s.phase)

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a1a]">
      {phase === 'menu' && <MainMenu />}
      {(phase === 'countdown' || phase === 'racing') && (
        <>
          <GameCanvas />
          <HUD />
        </>
      )}
      {phase === 'finished' && (
        <>
          <GameCanvas />
          <ResultScreen />
        </>
      )}
    </div>
  )
}
