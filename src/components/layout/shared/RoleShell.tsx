import { Suspense, type ElementType, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { UserMenu } from './UserMenu'
import { useTheme } from '@/context/ThemeContext'
import { LuMoon, LuSun } from 'react-icons/lu'
import { OnlineIndicator } from '@/components/shared/OnlineIndicator'

export interface RoleNavItem {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

/**
 * Общая оболочка мобильных рабочих мест:
 *  - desktop: узкий sidebar слева
 *  - мобильный/планшет: BottomNav 88px внизу (крупные области нажатия)
 * Контент: max-w-3xl (768px), mobile-first.
 */
/** Красный кружок с числом на значке пункта меню. */
function NavBadge({ n }: { n?: number }) {
  if (!n) return null
  return <span className="absolute -right-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold leading-none text-white">{n > 99 ? '99+' : n}</span>
}

export function RoleShell({ title, nav, headerExtra, wide, badges, overlay }: {
  title: string; nav: RoleNavItem[]; headerExtra?: ReactNode; wide?: boolean
  /** Числа на пунктах меню по их `to` */
  badges?: Record<string, number>
  /** Поверх экрана: уведомления и т. п. */
  overlay?: ReactNode
}) {
  const { theme, toggle } = useTheme()
  return (
    <div className="min-h-screen bg-park-bg desktop:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[var(--sidebar-bg)] p-3 text-[var(--sidebar-fg)] desktop:flex">
        <p className="px-3 py-4 text-lg font-bold">{title}</p>
        <nav className="space-y-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium', isActive ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]' : 'text-[var(--sidebar-fg-muted)] hover:bg-[var(--sidebar-hover)]')}>
              <span className="relative"><n.icon size={20} /><NavBadge n={badges?.[n.to]} /></span> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-park-bgCard px-4 shadow-card">
          <p className="text-sm font-bold text-park-text desktop:hidden">{title}</p>
          <div className="ml-auto flex items-center gap-2">
            {headerExtra}
            <OnlineIndicator showLabel />
            <button onClick={toggle} className="rounded-lg p-2 text-park-textMuted hover:bg-park-bgHover" aria-label="Toggle theme">
              {theme === 'dark' ? <LuSun size={18} /> : <LuMoon size={18} />}
            </button>
            <UserMenu />
          </div>
        </header>

        <main className={cn('mx-auto w-full flex-1 px-4 pb-28 pt-4 desktop:pb-6', wide ? 'max-w-6xl' : 'max-w-3xl')}>
          <Suspense fallback={<div className="py-16 text-center text-park-textMuted">…</div>}>
            <Outlet />
          </Suspense>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[88px] items-stretch gap-1 border-t border-park-border bg-park-bg px-2 pb-2 pt-1.5 desktop:hidden">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => cn('flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl text-xs font-medium transition active:scale-95', isActive ? 'bg-primary/10 text-primary' : 'text-park-textMuted')}
            >
              <span className="relative"><n.icon size={26} /><NavBadge n={badges?.[n.to]} /></span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      {overlay}
    </div>
  )
}
