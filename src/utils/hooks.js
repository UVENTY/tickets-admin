
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { debounce, requestTimeout } from './utils'
import { EMPTY_FUNC, SEAT_CLASS } from '../consts'

export const useCancelableScheduledWork = () => {
  const cancelCallback = useRef(EMPTY_FUNC)
  const registerCancel = fn => (cancelCallback.current = fn)
  const cancelScheduledWork = () => cancelCallback.current()

  // Cancels the current sheduled work before the 'unmount'
  useEffect(() => cancelScheduledWork, [])

  return [registerCancel, cancelScheduledWork]
}

export const useClickPrevention = ({ onClick, onDoubleClick, delay = 300 }) => {
  const [registerCancel, cancelScheduledRaf] = useCancelableScheduledWork()
  const handleClick = (e) => {
    cancelScheduledRaf()
    requestTimeout(onClick, [e], delay, registerCancel)
  }
  const handleDoubleClick = (e) => {
    cancelScheduledRaf()
    onDoubleClick(e)
  }
  return [handleClick, handleDoubleClick]
}

export function useLocalStorage(key, defaultValue) {
  const serialize = () => {
    let currentValue
    try {
      currentValue = JSON.parse(
        localStorage.getItem(key) || String(defaultValue)
      )
    } catch (error) {
      currentValue = defaultValue
    }
    return currentValue
  }
  const [value, setValue] = useState(serialize)
  const handleChange = () => setValue(serialize)

  useEffect(() => {
    window.addEventListener('storage', handleChange)
    return () => window.removeEventListener('storage', handleChange)
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [value, key])

  return [value, setValue]
}

export function useWindowSize() {
  const [size, setSize] = useState({
    width: null,
    height: null,
  })

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return size
}

export function useDimensions(liveMeasure = true, delay = 250, initialDimensions = {}, effectDeps = []) {
  const [dimensions, setDimensions] = useState(initialDimensions)
  const [node, setNode] = useState(null)

  const ref = useCallback((newNode) => {
    setNode(newNode)
  }, [])

  useLayoutEffect(() => {
    if (!node) return

    const measure = () => {
      window.requestAnimationFrame(() => {
        const newDimensions = node.getBoundingClientRect()
        setDimensions(newDimensions)
      })
    }
    measure()

    if (liveMeasure) {
      const debounceMeasure = debounce(measure, delay)
      if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(debounceMeasure)
        resizeObserver.observe(node)
        window.addEventListener('scroll', debounceMeasure)
        return () => {
          resizeObserver.disconnect()
          window.removeEventListener('scroll', debounceMeasure)
        }
      }
      window.addEventListener('resize', debounceMeasure)
      window.addEventListener('scroll', debounceMeasure)

      return () => {
        window.removeEventListener('resize', debounceMeasure)
        window.removeEventListener('scroll', debounceMeasure)
      }
    }
  }, [node, liveMeasure, ...effectDeps])

  return [ref, dimensions, node]
}

export const useCountdown = (timeToCount = 60 * 1000, interval = 1000) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const timer = useRef({})

  const run = (ts) => {
    if (!timer.current.started) {
      timer.current.started = ts
      timer.current.lastInterval = ts
    }

    const localInterval = Math.min(interval, (timer.current.timeLeft || Infinity))
    if ((ts - timer.current.lastInterval) >= localInterval) {
      timer.current.lastInterval += localInterval
      setTimeLeft((timeLeft) => {
        timer.current.timeLeft = timeLeft - localInterval
        return timer.current.timeLeft
      })
    }

    if (ts - timer.current.started < timer.current.timeToCount) {
      timer.current.requestId = window.requestAnimationFrame(run)
    } else {
      timer.current = {}
      setTimeLeft(0)
    }
  }

  const start = useCallback(
    (ttc) => {
      window.cancelAnimationFrame(timer.current.requestId)

      const newTimeToCount = ttc !== undefined ? ttc : timeToCount
      timer.current.started = null
      timer.current.lastInterval = null
      timer.current.timeToCount = newTimeToCount
      timer.current.requestId = window.requestAnimationFrame(run)

      setTimeLeft(newTimeToCount)
    },
    [],
  )

  const pause = useCallback(
    () => {
      window.cancelAnimationFrame(timer.current.requestId)
      timer.current.started = null
      timer.current.lastInterval = null
      timer.current.timeToCount = timer.current.timeLeft
    },
    [],
  )

  const resume = useCallback(
    () => {
      if (!timer.current.started && timer.current.timeLeft > 0) {
        window.cancelAnimationFrame(timer.current.requestId)
        timer.current.requestId = window.requestAnimationFrame(run)
      }
    },
    [],
  )

  const reset = useCallback(
    () => {
      if (timer.current.timeLeft) {
        window.cancelAnimationFrame(timer.current.requestId)
        timer.current = {}
        setTimeLeft(0)
      }
    },
    [],
  )

  const actions = useMemo(
    () => ({ start, pause, resume, reset }),
    [],
  )

  useEffect(() => {
    return () => window.cancelAnimationFrame(timer.current.requestId)
  }, [])

  return [timeLeft, actions]
}

export const useClickOutside = (callback) => {
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (event) => {
      ref.current && !ref.current.contains(event.target) && callback(event)
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [callback, ref])

  return ref
}
/* 
export function useQueryCache() {
  const queryClient = useQueryClient()
  const cache = queryClient.getQueryData(query.queryKey)
  if (!cache) {
    
  }
  return  ?? (await )
} */