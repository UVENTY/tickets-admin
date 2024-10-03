import { createContext, useCallback, useContext, useState } from 'react'

const initialAppState = {
  isLoading: false,
  config: null,
  state: null,
}

const AppStateContext = createContext([
  initialAppState,
  () => {}
])

export function AppStateProvider({ children }) {
  const [appState, setState] = useState(initialAppState)
  
  const setAppState = useCallback((key, value) => {
    if (value !== undefined) {
      setState(prevState => ({ ...prevState, [key]: value }))
      return
    }

    switch (typeof key) {
      case 'object':
        setState(prevState => ({ ...prevState, ...key }))
        break
    
      case 'function':
        setState(key)
        break

      default:
        console.warn(`Invalid key type, ${typeof key} passed instead object or function`)
        break
    }
  }, [])

  return (
    <AppStateContext.Provider value={[ appState, setAppState ]}>{children}</AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within LoadingProvider')
  }
  return context
}