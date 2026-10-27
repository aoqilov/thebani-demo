import { LuChevronDown, LuLogOut } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusAvatar } from '@/components/ui/avatar/CusAvatar'
import { CusPopover } from '@/components/ui/popover/CusPopover'
import { RoleLabel } from '@/const/constData'
import { useTranslation } from '@/i18n/languageConfig'
import { clearAuth, getStoredRole } from '@/widgets/features/login/hooks/authApi'

/** Общее меню профиля для header админки и мобильных рабочих мест. */
export function UserMenu({ name = 'Demo User' }: { name?: string }) {
  const { t } = useTranslation('common.')
  const navigate = useNavigate()
  const role = getStoredRole()

  return (
    <CusPopover
      width="w-56"
      trigger={
        <span className="flex items-center gap-2 rounded-lg p-1 hover:bg-park-bgHover">
          <CusAvatar name={name} size={32} />
          <span className="hidden text-left text-xs leading-tight tablet:block">
            <b className="block text-park-text">{name}</b>
            <span className="text-park-textMuted">{role ? RoleLabel[role] : ''}</span>
          </span>
          <LuChevronDown size={14} className="text-park-textMuted" />
        </span>
      }
    >
      {() => (
        <button
          onClick={() => { clearAuth(); navigate('/login', { replace: true }) }}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-park-bgHover"
        >
          <LuLogOut size={16} /> {t('logout')}
        </button>
      )}
    </CusPopover>
  )
}
