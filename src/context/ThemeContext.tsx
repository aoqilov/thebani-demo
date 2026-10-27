import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

export interface SidebarPreset {
  id: string
  label: string
  bg: string
  /** Цвет текста: тёмный на светлом фоне, иначе белый */
  fg: string
  activeBg: string
  activeFg: string
}

export const sidebarPresets: SidebarPreset[] = [
  { id: 'dark', label: 'Dark', bg: '#1a2035', fg: '#ffffff', activeBg: '#1572e8', activeFg: '#ffffff' },
  { id: 'dark2', label: 'Dark 2', bg: '#2a2f5b', fg: '#ffffff', activeBg: '#6861ce', activeFg: '#ffffff' },
  { id: 'blue', label: 'Blue', bg: '#1572e8', fg: '#ffffff', activeBg: 'rgb(255 255 255 / 0.2)', activeFg: '#ffffff' },
  { id: 'purple', label: 'Purple', bg: '#6861ce', fg: '#ffffff', activeBg: 'rgb(255 255 255 / 0.2)', activeFg: '#ffffff' },
  { id: 'green', label: 'Green', bg: '#1f9d55', fg: '#ffffff', activeBg: 'rgb(255 255 255 / 0.2)', activeFg: '#ffffff' },
  { id: 'red', label: 'Red', bg: '#f25961', fg: '#ffffff', activeBg: 'rgb(255 255 255 / 0.2)', activeFg: '#ffffff' },
  { id: 'white', label: 'White', bg: '#ffffff', fg: '#575962', activeBg: '#1572e8', activeFg: '#ffffff' },
]

interface ThemeCtx {
  theme: Theme
  toggle: () => void
  sidebarId: string
  setSidebar: (id: string) => void
}

const ThemeContext = createContext<ThemeCtx | null>(null)
const THEME_KEY = 'app_theme'
const SIDEBAR_KEY = 'app_sidebar_color'

function applySidebar(p: SidebarPreset) {
  const s = document.documentElement.style
  const dark = p.fg === '#ffffff'
  s.setProperty('--sidebar-bg', p.bg)
  s.setProperty('--sidebar-fg', p.fg)
  s.setProperty('--sidebar-fg-muted', dark ? 'rgb(255 255 255 / 0.7)' : p.fg)
  s.setProperty('--sidebar-hover', dark ? 'rgb(255 255 255 / 0.1)' : 'rgb(0 0 0 / 0.05)')
  s.setProperty('--sidebar-border', dark ? 'rgb(255 255 255 / 0.15)' : '#ebedf2')
  s.setProperty('--sidebar-active-bg', p.activeBg)
  s.setProperty('--sidebar-active-fg', p.activeFg)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'))
  const [sidebarId, setSidebarId] = useState(() => localStorage.getItem(SIDEBAR_KEY) ?? 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    applySidebar(sidebarPresets.find((p) => p.id === sidebarId) ?? sidebarPresets[0])
    localStorage.setItem(SIDEBAR_KEY, sidebarId)
  }, [sidebarId])

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), sidebarId, setSidebar: setSidebarId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
