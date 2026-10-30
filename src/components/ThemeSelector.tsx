import { useState, useRef, useEffect } from 'react'
import { useTheme, themeConfig } from '../context/ThemeContext'
import type { ColorTheme } from '../context/ThemeContext'

const Swatch = ({ color }: { color: string }) => (
  <span
    aria-hidden="true"
    className="hud-swatch"
    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
  />
)

const ThemeSelector = ({ compact = false }: { compact?: boolean }) => {
  const { colorTheme, darkMode, setColorTheme, toggleDarkMode } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close the dropdown on outside clicks and on Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleDarkMode}
        className="hud-chip"
        aria-label={darkMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        <span aria-hidden="true">{darkMode === 'dark' ? '☀' : '☾'}</span>
        {!compact && <span className="hidden lg:inline">{darkMode === 'dark' ? 'LIGHT' : 'DARK'}</span>}
      </button>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="hud-chip"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Colour theme: ${themeConfig[colorTheme].label}`}
        >
          <Swatch color={themeConfig[colorTheme][darkMode]['--accent']} />
          {!compact && <span className="hidden lg:inline">{themeConfig[colorTheme].label.toUpperCase()}</span>}
          <span aria-hidden="true" className="text-[9px]">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Colour theme"
            className="hud-panel hud-menu absolute right-0 mt-2 w-48 z-50 py-1"
          >
            <div className="hud-menu-label">// theme.select()</div>
            {(Object.keys(themeConfig) as ColorTheme[]).map((theme) => {
              const active = colorTheme === theme
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  key={theme}
                  onClick={() => { setColorTheme(theme); setOpen(false) }}
                  className="hud-menu-item"
                  data-active={active || undefined}
                >
                  <Swatch color={themeConfig[theme][darkMode]['--accent']} />
                  <Swatch color={themeConfig[theme][darkMode]['--accent-2']} />
                  <span className="ml-1">{themeConfig[theme].label}</span>
                  {active && <span className="ml-auto" aria-hidden="true">●</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ThemeSelector
