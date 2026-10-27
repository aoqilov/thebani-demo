import { useEffect, useState } from 'react'
import { LuMenu, LuMoon, LuPanelLeft, LuPanelLeftClose, LuRotateCw, LuSun } from 'react-icons/lu'
import { SettingsPanel } from '@/components/layout/shared/SettingsPanel'
import { UserMenu } from '@/components/layout/shared/UserMenu'
import { OnlineIndicator } from '@/components/shared/OnlineIndicator'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from '@/i18n/languageConfig'
import { formatTime } from '@/utils/dateUtils'

export default function Header({ sidebarOpen, onMenuToggle }: { sidebarOpen: boolean; onMenuToggle: () => void }) {
  const { t } = useTranslation('common.')
  const { theme, toggle } = useTheme()
  const [time, setTime] = useState(formatTime)

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 60_000)
    return () => clearInterval(id)
  }, [])

  const iconBtn = 'rounded-md p-2 text-park-textMuted transition-colors hover:bg-park-bgHover'

  return (
    <header className="sticky top-0 z-40 flex h-[73px] items-center gap-3 bg-park-bgCard px-4 shadow-card">
      <button onClick={onMenuToggle} className={iconBtn} aria-label="Toggle sidebar">
        <LuMenu size={18} className="desktop:hidden" />
        {sidebarOpen ? <LuPanelLeftClose size={18} className="hidden desktop:block" /> : <LuPanelLeft size={18} className="hidden desktop:block" />}
      </button>

      <div className="ml-auto flex items-center gap-2">
        <OnlineIndicator size={20} showLabel />
        <button onClick={() => window.location.reload()} className={iconBtn} title={t('refreshPage')}><LuRotateCw size={16} /></button>
        <span className="hidden items-center gap-2 tablet:flex">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" />
          <span className="font-mono text-lg text-park-text3">{time}</span>
        </span>
        <button onClick={toggle} className={iconBtn} aria-label="Toggle theme">{theme === 'dark' ? <LuSun size={18} /> : <LuMoon size={18} />}</button>
        <SettingsPanel />
        <UserMenu />
      </div>
    </header>
  )
}
