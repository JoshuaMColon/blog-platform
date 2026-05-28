import { useState, useRef, useEffect } from 'react'
import { useTheme, themeConfig } from '../context/ThemeContext'
import type { ColorTheme } from '../context/ThemeContext'

const ThemeSelector = () => {
  const { colorTheme, darkMode, setColorTheme, toggleDarkMode } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="flex items-center gap-2">
      {/* Dark/light toggle */}
      <button
        onClick={toggleDarkMode}
        className="text-xs font-mono px-2 py-1 rounded border transition-all"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        {darkMode === 'dark' ? 'Light' : 'Dark'}
      </button>

      {/* Theme dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs font-mono px-2 py-1 rounded border flex items-center gap-1 transition-all"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          {themeConfig[colorTheme].emoji} {themeConfig[colorTheme].label}
          <span className="ml-1">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div
            className="absolute right-0 mt-1 w-44 rounded-lg border shadow-xl z-50 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
            }}
          >
            {(Object.keys(themeConfig) as ColorTheme[]).map((theme) => (
              <button
                key={theme}
                onClick={() => { setColorTheme(theme); setOpen(false) }}
                className="w-full text-left px-4 py-2 text-xs font-mono flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: colorTheme === theme ? 'var(--bg-tertiary)' : 'transparent',
                  color: colorTheme === theme ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = colorTheme === theme ? 'var(--bg-tertiary)' : 'transparent')}
              >
                {themeConfig[theme].emoji} {themeConfig[theme].label}
                {colorTheme === theme && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ThemeSelector