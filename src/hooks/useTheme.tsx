import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { DARK, LIGHT } from '../constants'
import type { Theme } from '../types'

interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DARK,
  isDark: true,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('dce_dark')
      return stored !== null ? (JSON.parse(stored) as boolean) : true
    } catch {
      return true
    }
  })

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      try {
        localStorage.setItem('dce_dark', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const theme = isDark ? DARK : LIGHT

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
