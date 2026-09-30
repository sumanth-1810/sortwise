import { useState } from 'react'
import { Home } from './components/Home'
import { PlayRound } from './components/PlayRound'
import { Results } from './components/Results'
import { Scan } from './components/Scan'
import type { RoundResult, Screen } from './types'
import './App.css'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [result, setResult] = useState<RoundResult | null>(null)
  const [playKey, setPlayKey] = useState(0)

  function startRound() {
    setResult(null)
    setPlayKey((k) => k + 1)
    setScreen('play')
  }

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <Home onStart={startRound} onScan={() => setScreen('scan')} />
      )}
      {screen === 'scan' && <Scan onBack={() => setScreen('home')} />}
      {screen === 'play' && (
        <PlayRound
          key={playKey}
          onFinish={(roundResult) => {
            setResult(roundResult)
            setScreen('results')
          }}
          onRestart={startRound}
          onQuit={() => {
            setResult(null)
            setScreen('home')
          }}
        />
      )}
      {screen === 'results' && result && (
        <Results result={result} onReplay={startRound} onHome={() => setScreen('home')} />
      )}
    </div>
  )
}

export default App
