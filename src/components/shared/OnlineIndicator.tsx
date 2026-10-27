import { LuWifi, LuWifiOff } from 'react-icons/lu'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useTranslation } from '@/i18n/languageConfig'

export function OnlineIndicator({ size = 18, showLabel }: { size?: number; showLabel?: boolean }) {
  const online = useOnlineStatus()
  const { t } = useTranslation('common.')
  const Icon = online ? LuWifi : LuWifiOff
  return (
    <span className={`flex items-center gap-1.5 text-xs ${online ? 'text-success' : 'text-danger'}`}>
      <Icon size={size} />
      {showLabel && <span className="hidden tablet:inline">{online ? t('online') : t('offline')}</span>}
    </span>
  )
}
