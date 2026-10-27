import { LuCheck, LuSettings } from 'react-icons/lu'
import { CusPopover } from '@/components/ui/popover/CusPopover'
import { sidebarPresets, useTheme } from '@/context/ThemeContext'

/** Панель настроек (как в Kaiadmin): выбор цвета бокового меню. */
export function SettingsPanel() {
  const { sidebarId, setSidebar } = useTheme()
  return (
    <CusPopover
      width="w-64"
      trigger={<span className="rounded-md p-2 text-park-textMuted hover:bg-park-bgHover"><LuSettings size={18} /></span>}
    >
      {() => (
        <div className="p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-park-textMuted">Цвет бокового меню</p>
          <div className="flex flex-wrap gap-2">
            {sidebarPresets.map((p) => (
              <button
                key={p.id}
                title={p.label}
                onClick={() => setSidebar(p.id)}
                style={{ background: p.bg }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-park-border2 text-white shadow-sm transition hover:scale-110"
              >
                {sidebarId === p.id && <LuCheck size={14} className={p.fg === '#ffffff' ? 'text-white' : 'text-park-text'} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </CusPopover>
  )
}
