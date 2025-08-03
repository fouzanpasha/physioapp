import { useState } from 'react'
import { AppState, AppScreen } from './types'
import WelcomePage from './pages/WelcomePage'
import CameraSetupPage from './pages/CameraSetupPage'
import ExerciseSelectionPage from './pages/ExerciseSelectionPage'
import InstructionsPage from './pages/InstructionsPage'
import GameplayPage from './pages/GameplayPage'
import ResultsPage from './pages/ResultsPage'
import GardenPage from './pages/GardenPage'

const initialState: AppState = {
  currentScreen: 'welcome',
  cameraEnabled: false,
  selectedExercise: null,
  currentSession: null,
  userProgress: {
    xp: 0,
    level: 1,
    lastSessionTimestamp: null,
    totalSessions: 0,
    exerciseProgress: {},
    dailyStreak: 0
  }
}

function App() {
  const [appState, setAppState] = useState<AppState>(initialState)

  const navigateToScreen = (screen: AppScreen) => {
    setAppState(prev => ({ ...prev, currentScreen: screen }))
  }

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }))
  }

  const renderCurrentScreen = () => {
    switch (appState.currentScreen) {
      case 'welcome':
        return <WelcomePage onStart={() => navigateToScreen('camera-setup')} />
      
      case 'camera-setup':
        return (
          <CameraSetupPage 
            onCameraEnabled={() => {
              updateAppState({ cameraEnabled: true })
              navigateToScreen('exercise-selection')
            }}
          />
        )
      
      case 'exercise-selection':
        return (
          <ExerciseSelectionPage 
            onExerciseSelected={(exercise) => {
              updateAppState({ selectedExercise: exercise })
              navigateToScreen('instructions')
            }}
          />
        )
      
      case 'instructions':
        return (
          <InstructionsPage 
            exercise={appState.selectedExercise!}
            onStartGame={() => navigateToScreen('gameplay')}
          />
        )
      
      case 'gameplay':
        return (
          <GameplayPage 
            exercise={appState.selectedExercise!}
            onGameComplete={(session) => {
              updateAppState({ currentSession: session })
              navigateToScreen('results')
            }}
          />
        )
      
      case 'results':
        return (
          <ResultsPage 
            session={appState.currentSession!}
            onContinue={() => navigateToScreen('exercise-selection')}
            onViewGarden={() => navigateToScreen('garden')}
          />
        )
      
      case 'garden':
        return (
          <GardenPage 
            userProgress={appState.userProgress}
            onBack={() => navigateToScreen('exercise-selection')}
          />
        )
      
      default:
        return <WelcomePage onStart={() => navigateToScreen('camera-setup')} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {renderCurrentScreen()}
    </div>
  )
}

export default App