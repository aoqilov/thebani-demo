import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LuChevronDown, LuX } from 'react-icons/lu'
import type { RoleTypes } from '@/const/constData'
import { useTranslation } from '@/i18n/languageConfig'
import { cn } from '@/lib/cn'
import { getStoredRole } from '@/widgets/features/login/hooks/authApi'
import { navGroups, systemItems, type NavBadge, type NavItemDef, type NavSubMenuDef } from './sidebarNav'

function canSee(roles: RoleTypes[] | undefined, role: RoleTypes | null) {
  return !roles || !roles.length || (role !== null && roles.includes(role))
}

function BadgeChip({ type }: { type: NavBadge }) {
  return <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">{type}</span>
}

// Ranglar CSS variable'lardan keladi (Settings -> Sidebar color)
const linkBase = 'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition'
const linkActive = 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)] shadow-md'
const linkIdle = 'text-[var(--sidebar-fg-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-fg)]'

function NavItem({ item, onNavClick, collapsed }: { item: NavItemDef; onNavClick: () => void; collapsed?: boolean }) {
  const { t } = useTranslation('sidebar.')
  return (
    <NavLink to={item.to} end={item.to === '/'} onClick={onNavClick} title={collapsed ? t(item.labelKey) : undefined} className={({ isActive }) => cn(linkBase, collapsed && 'justify-center px-0', isActive ? linkActive : linkIdle)}>
      <item.icon size={20} />
      {!collapsed && <span className="flex-1">{t(item.labelKey)}</span>}
      {!collapsed && item.badge && <BadgeChip type={item.badge} />}
    </NavLink>
  )
}

function NavSubMenu({ item, onNavClick, collapsed }: { item: NavSubMenuDef; onNavClick: () => void; collapsed?: boolean }) {
  const { t } = useTranslation('sidebar.')
  const { pathname } = useLocation()
  const isAnyActive = item.subItems.some((s) => pathname.startsWith(s.to))
  const [open, setOpen] = useState(isAnyActive)

  useEffect(() => {
    if (isAnyActive) setOpen(true)
  }, [isAnyActive])

  if (collapsed) {
    // Yig'ilgan holatda faqat parent icon; bosilsa birinchi sub-sahifaga o'tadi
    return (
      <NavLink to={item.subItems[0].to} onClick={onNavClick} title={t(item.labelKey)} className={cn(linkBase, 'justify-center px-0', isAnyActive ? linkActive : linkIdle)}>
        <item.icon size={20} />
      </NavLink>
    )
  }

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className={cn(linkBase, 'w-full', isAnyActive ? 'text-[var(--sidebar-fg)]' : linkIdle)}>
        <item.icon size={20} />
        <span className="flex-1 text-left">{t(item.labelKey)}</span>
        {item.badge && <BadgeChip type={item.badge} />}
        <LuChevronDown size={14} className={cn('transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-[var(--sidebar-border)] pl-3">
          {item.subItems.map((sub) => (
            <NavLink
              key={sub.to}
              to={sub.to}
              onClick={onNavClick}
              className={({ isActive }) => cn('flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition', isActive ? linkActive : linkIdle)}
            >
              <sub.icon size={16} />
              <span className="flex-1">{t(sub.labelKey)}</span>
              {sub.badge && <BadgeChip type={sub.badge} />}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarContent({ onClose, onNavClick, collapsed }: { onClose: () => void; onNavClick: () => void; collapsed?: boolean }) {
  const { t } = useTranslation('sidebar.')
  const role = getStoredRole()
  const label = 'mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--sidebar-fg-muted)] opacity-70'

  return (
    <div style={{ width: collapsed ? 92 : 270 }} className="flex h-full flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] shadow-lg">
      <div className={cn('flex h-[73px] shrink-0 items-center gap-2.5 border-b border-[var(--sidebar-border)]', collapsed ? 'justify-center' : 'px-5')}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">T</div>
        {!collapsed && <p className="flex-1 text-lg font-bold tracking-wide">Thebani</p>}
        {!collapsed && <button onClick={onClose} className="rounded-md p-1 hover:bg-[var(--sidebar-hover)]" aria-label="Close sidebar"><LuX size={16} /></button>}
      </div>

      <nav className={cn('no-scrollbar flex-1 overflow-y-auto py-4', collapsed ? 'overflow-x-hidden px-2' : 'px-3')}>
        {navGroups.map((group, gi) => (
          <div key={group.labelKey} className={cn(gi > 0 && 'mt-5')}>
            {collapsed ? gi > 0 && <div className="mx-2 mb-3 border-t border-[var(--sidebar-border)]" /> : <p className={label}>{t(group.labelKey)}</p>}
            <div className="space-y-1">
              {group.items.map((entry) => {
                if (entry.subItems) {
                  const subItems = entry.subItems.filter((s) => canSee(s.roles, role))
                  if (!subItems.length) return null // нет видимых подпунктов — родитель тоже скрывается
                  return <NavSubMenu key={entry.labelKey} item={{ ...entry, subItems }} onNavClick={onNavClick} collapsed={collapsed} />
                }
                return canSee(entry.roles, role) ? <NavItem key={entry.to} item={entry} onNavClick={onNavClick} collapsed={collapsed} /> : null
              })}
            </div>
          </div>
        ))}

        {collapsed ? <div className="mx-2 mb-3 mt-5 border-t border-[var(--sidebar-border)]" /> : <p className={cn(label, 'mt-5')}>{t('system')}</p>}
        <div className="space-y-1">
          {systemItems.filter((i) => canSee(i.roles, role)).map((i) => <NavItem key={i.to} item={i} onNavClick={onNavClick} collapsed={collapsed} />)}
        </div>
      </nav>
    </div>
  )
}

export default function Sidebar({ open, onClose, onNavClick }: { open: boolean; onClose: () => void; onNavClick: () => void }) {
  return (
    <>
      {/* Desktop: закреплён, ширина меняется с анимацией */}
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 overflow-hidden transition-[width] duration-300 desktop:block', open ? 'w-[270px]' : 'w-[92px]')}>
        <SidebarContent onClose={onClose} onNavClick={onNavClick} collapsed={!open} />
      </aside>
      {/* Mobil / planshet: kontent ustidan chiqadigan drawer */}
      <div className={cn('fixed inset-y-0 left-0 z-50 transition-transform duration-300 desktop:hidden', open ? 'translate-x-0' : '-translate-x-full')}>
        <SidebarContent onClose={onClose} onNavClick={onNavClick} />
      </div>
    </>
  )
}
