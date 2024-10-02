import { createContext, useContext, useState } from 'react'

const AppStateContext = createContext({
  state: {},
  setState: () => {},
})

export function AppStateProvider({ children }) {
  const [state, setState] = useState(false)
  
  const customSetState = (key, value) => {
    if (value !== undefined) {
      setState(prevState => ({ ...prevState, [key]: value }))
      return
    }

    switch (typeof key) {
      case 'object':
        setState(prevState => ({ ...prevState, ...key }))
        break
    
      case 'function':
        setState(prevState => key(prevState))
        break

      default:
        console.warn(`Invalid key type, ${typeof key} passed instead object or function`)
        break
    }
  }

  return (
    <AppStateContext.Provider value={{ state, setState: customSetState }}>{children}</AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within LoadingProvider')
  }
  return context
}