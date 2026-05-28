import { createContext, useContext, useEffect, useState } from 'react'

export type ColorTheme = 'retro' | 'minimal' | 'warm' | 'ocean' | 'sunset'
export type DarkMode = 'dark' | 'light'

interface ThemeContextType {
  colorTheme: ColorTheme
  darkMode: DarkMode
  setColorTheme: (theme: ColorTheme) => void
  toggleDarkMode: () => void
  theme: DarkMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  colorTheme: 'retro',
  darkMode: 'dark',
  setColorTheme: () => {},
  toggleDarkMode: () => {},
  theme: 'dark',
  toggleTheme: () => {},
})

export const themeConfig: Record<ColorTheme, {
  label: string
  emoji: string
  dark: Record<string, string>
  light: Record<string, string>
}> = {
  retro: {
    label: 'Retro/Techy',
    emoji: '⌨️',
    dark: {
      '--bg-primary': '#0a0a0a',
      '--bg-secondary': '#111111',
      '--bg-tertiary': '#1a1a1a',
      '--border': '#222222',
      '--text-primary': '#e2e8f0',
      '--text-secondary': '#94a3b8',
      '--accent': '#39ff14',
      '--accent-hover': '#2dd10f',
      '--accent-text': '#0a0a0a',
      '--btn-text': '#0a0a0a',
    },
    light: {
      '--bg-primary': '#f8fafc',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#f1f5f9',
      '--border': '#e2e8f0',
      '--text-primary': '#1e293b',
      '--text-secondary': '#64748b',
      '--accent': '#16a34a',
      '--accent-hover': '#15803d',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
    },
  },
  minimal: {
    label: 'Minimal',
    emoji: '◻️',
    dark: {
      '--bg-primary': '#18181b',
      '--bg-secondary': '#27272a',
      '--bg-tertiary': '#3f3f46',
      '--border': '#3f3f46',
      '--text-primary': '#fafafa',
      '--text-secondary': '#a1a1aa',
      '--accent': '#ffffff',
      '--accent-hover': '#e4e4e7',
      '--accent-text': '#18181b',
      '--btn-text': '#18181b',
    },
    light: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#fafafa',
      '--bg-tertiary': '#f4f4f5',
      '--border': '#e4e4e7',
      '--text-primary': '#09090b',
      '--text-secondary': '#71717a',
      '--accent': '#09090b',
      '--accent-hover': '#27272a',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
    },
  },
  warm: {
    label: 'Warm/Cozy',
    emoji: '☕',
    dark: {
      '--bg-primary': '#1c1410',
      '--bg-secondary': '#2a1f16',
      '--bg-tertiary': '#3d2d1f',
      '--border': '#4a3728',
      '--text-primary': '#f5e6d3',
      '--text-secondary': '#c4a882',
      '--accent': '#f59e0b',
      '--accent-hover': '#d97706',
      '--accent-text': '#1c1410',
      '--btn-text': '#1c1410',
    },
    light: {
      '--bg-primary': '#fdf8f0',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#fef3c7',
      '--border': '#e5d4b8',
      '--text-primary': '#3d2b1a',
      '--text-secondary': '#92674a',
      '--accent': '#d97706',
      '--accent-hover': '#b45309',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
    },
  },
  ocean: {
    label: 'Ocean',
    emoji: '🌊',
    dark: {
      '--bg-primary': '#0a0f1e',
      '--bg-secondary': '#0f172a',
      '--bg-tertiary': '#1e293b',
      '--border': '#1e3a5f',
      '--text-primary': '#e0f2fe',
      '--text-secondary': '#7dd3fc',
      '--accent': '#38bdf8',
      '--accent-hover': '#0ea5e9',
      '--accent-text': '#0a0f1e',
      '--btn-text': '#0a0f1e',
    },
    light: {
      '--bg-primary': '#f0f9ff',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e0f2fe',
      '--border': '#bae6fd',
      '--text-primary': '#0c4a6e',
      '--text-secondary': '#0369a1',
      '--accent': '#0284c7',
      '--accent-hover': '#0369a1',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
    },
  },
  sunset: {
    label: 'Sunset',
    emoji: '🌅',
    dark: {
      '--bg-primary': '#0f0a1e',
      '--bg-secondary': '#1a0f2e',
      '--bg-tertiary': '#2d1b4e',
      '--border': '#3d2060',
      '--text-primary': '#fde8d8',
      '--text-secondary': '#f0a070',
      '--accent': '#f97316',
      '--accent-hover': '#ea580c',
      '--accent-text': '#0f0a1e',
      '--btn-text': '#0f0a1e',
    },
    light: {
      '--bg-primary': '#fff7ed',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#ffedd5',
      '--border': '#fed7aa',
      '--text-primary': '#431407',
      '--text-secondary': '#9a3412',
      '--accent': '#ea580c',
      '--accent-hover': '#c2410c',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
    },
  },
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    return (localStorage.getItem('colorTheme') as ColorTheme) || 'retro'
  })

  const [darkMode, setDarkMode] = useState<DarkMode>(() => {
    const stored = localStorage.getItem('darkMode') as DarkMode
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const theme = darkMode
  const toggleTheme = () => setDarkMode(prev => prev === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    const config = themeConfig[colorTheme][darkMode]
    const root = document.documentElement

    Object.entries(config).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    if (darkMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('colorTheme', colorTheme)
    localStorage.setItem('darkMode', darkMode)
  }, [colorTheme, darkMode])

  const setColorTheme = (theme: ColorTheme) => setColorThemeState(theme)
  const toggleDarkMode = () => setDarkMode(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ colorTheme, darkMode, setColorTheme, toggleDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)