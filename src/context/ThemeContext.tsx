import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Cybernetic HUD palettes. Every palette ships a dark (default) and a light
 * variant; text/accent pairs are checked against WCAG AA (4.5:1) for small text.
 *
 * Variables:
 *   --accent / --accent-2   primary neon and secondary signal colour
 *   --accent-rgb / --accent-2-rgb   the same as "r, g, b" for rgba() glows
 *   --danger                destructive actions and errors
 */
export type ColorTheme = 'neon' | 'acid' | 'ultraviolet' | 'ghost'
export type DarkMode = 'dark' | 'light'

interface ThemeContextType {
  colorTheme: ColorTheme
  darkMode: DarkMode
  setColorTheme: (theme: ColorTheme) => void
  toggleDarkMode: () => void
  theme: DarkMode
  toggleTheme: () => void
}

export const DEFAULT_THEME: ColorTheme = 'neon'

const ThemeContext = createContext<ThemeContextType>({
  colorTheme: DEFAULT_THEME,
  darkMode: 'dark',
  setColorTheme: () => {},
  toggleDarkMode: () => {},
  theme: 'dark',
  toggleTheme: () => {},
})

export const themeConfig: Record<ColorTheme, {
  label: string
  swatch: string
  dark: Record<string, string>
  light: Record<string, string>
}> = {
  neon: {
    label: 'Neon Grid',
    swatch: '#00e5ff',
    dark: {
      '--bg-primary': '#05070d',
      '--bg-secondary': '#0a0f1a',
      '--bg-tertiary': '#111a2b',
      '--border': '#1f3150',
      '--text-primary': '#e6f1ff',
      '--text-secondary': '#93a8c6',
      '--accent': '#00e5ff',
      '--accent-hover': '#6cf3ff',
      '--accent-text': '#021016',
      '--btn-text': '#021016',
      '--accent-2': '#ff3dd8',
      '--danger': '#ff5c7a',
      '--accent-rgb': '0, 229, 255',
      '--accent-2-rgb': '255, 61, 216',
    },
    light: {
      '--bg-primary': '#eaf0f7',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e2eaf4',
      '--border': '#b9c8da',
      '--text-primary': '#0a1424',
      '--text-secondary': '#46576f',
      '--accent': '#00677c',
      '--accent-hover': '#00505f',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
      '--accent-2': '#a8127a',
      '--danger': '#b8123a',
      '--accent-rgb': '0, 103, 124',
      '--accent-2-rgb': '168, 18, 122',
    },
  },
  acid: {
    label: 'Acid',
    swatch: '#c6ff1a',
    dark: {
      '--bg-primary': '#050807',
      '--bg-secondary': '#0b100e',
      '--bg-tertiary': '#131b18',
      '--border': '#24342e',
      '--text-primary': '#eafff4',
      '--text-secondary': '#93ab9f',
      '--accent': '#c6ff1a',
      '--accent-hover': '#dbff66',
      '--accent-text': '#0b1200',
      '--btn-text': '#0b1200',
      '--accent-2': '#a685ff',
      '--danger': '#ff5c7a',
      '--accent-rgb': '198, 255, 26',
      '--accent-2-rgb': '166, 133, 255',
    },
    light: {
      '--bg-primary': '#eef3ec',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e4ece1',
      '--border': '#bccbb8',
      '--text-primary': '#0d1a10',
      '--text-secondary': '#4a5c4d',
      '--accent': '#3f5e00',
      '--accent-hover': '#2f4700',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
      '--accent-2': '#5a2fc2',
      '--danger': '#b8123a',
      '--accent-rgb': '63, 94, 0',
      '--accent-2-rgb': '90, 47, 194',
    },
  },
  ultraviolet: {
    label: 'Ultraviolet',
    swatch: '#b48cff',
    dark: {
      '--bg-primary': '#07050f',
      '--bg-secondary': '#0e0a1c',
      '--bg-tertiary': '#17122b',
      '--border': '#2d2450',
      '--text-primary': '#efeaff',
      '--text-secondary': '#a39cc4',
      '--accent': '#b48cff',
      '--accent-hover': '#cdb2ff',
      '--accent-text': '#0d0620',
      '--btn-text': '#0d0620',
      '--accent-2': '#00f0c8',
      '--danger': '#ff5c7a',
      '--accent-rgb': '180, 140, 255',
      '--accent-2-rgb': '0, 240, 200',
    },
    light: {
      '--bg-primary': '#f0eef8',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e8e4f5',
      '--border': '#c6bfe0',
      '--text-primary': '#120c26',
      '--text-secondary': '#514a6e',
      '--accent': '#5b2fc9',
      '--accent-hover': '#4720a6',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
      '--accent-2': '#006b5a',
      '--danger': '#b8123a',
      '--accent-rgb': '91, 47, 201',
      '--accent-2-rgb': '0, 107, 90',
    },
  },
  ghost: {
    label: 'Ghost',
    swatch: '#e6edf5',
    dark: {
      '--bg-primary': '#060708',
      '--bg-secondary': '#0c0e11',
      '--bg-tertiary': '#15181d',
      '--border': '#2a2f37',
      '--text-primary': '#edf1f6',
      '--text-secondary': '#9aa3ae',
      '--accent': '#e6edf5',
      '--accent-hover': '#ffffff',
      '--accent-text': '#060708',
      '--btn-text': '#060708',
      '--accent-2': '#00e5ff',
      '--danger': '#ff5c7a',
      '--accent-rgb': '230, 237, 245',
      '--accent-2-rgb': '0, 229, 255',
    },
    light: {
      '--bg-primary': '#eff1f4',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e6e9ee',
      '--border': '#c3c9d2',
      '--text-primary': '#0b0d10',
      '--text-secondary': '#4d5560',
      '--accent': '#0b0d10',
      '--accent-hover': '#2a2f37',
      '--accent-text': '#ffffff',
      '--btn-text': '#ffffff',
      '--accent-2': '#00677c',
      '--danger': '#b8123a',
      '--accent-rgb': '11, 13, 16',
      '--accent-2-rgb': '0, 103, 124',
    },
  },
}

// v2 keys: visitors who picked one of the old palettes start fresh on the new look.
const THEME_KEY = 'hud.colorTheme'
const MODE_KEY = 'hud.darkMode'

const readTheme = (): ColorTheme => {
  const stored = localStorage.getItem(THEME_KEY) as ColorTheme | null
  return stored && stored in themeConfig ? stored : DEFAULT_THEME
}

const readMode = (): DarkMode => {
  const stored = localStorage.getItem(MODE_KEY)
  // The HUD look is dark-first, so dark is the default whatever the OS says.
  return stored === 'light' ? 'light' : 'dark'
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(readTheme)
  const [darkMode, setDarkMode] = useState<DarkMode>(readMode)

  const theme = darkMode
  const toggleTheme = () => setDarkMode(prev => (prev === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    const config = themeConfig[colorTheme][darkMode]
    const root = document.documentElement

    Object.entries(config).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    root.classList.toggle('dark', darkMode === 'dark')
    root.dataset.theme = colorTheme
    root.style.colorScheme = darkMode
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', config['--bg-primary'])

    localStorage.setItem(THEME_KEY, colorTheme)
    localStorage.setItem(MODE_KEY, darkMode)
  }, [colorTheme, darkMode])

  const setColorTheme = (next: ColorTheme) => setColorThemeState(next)
  const toggleDarkMode = toggleTheme

  return (
    <ThemeContext.Provider value={{ colorTheme, darkMode, setColorTheme, toggleDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
