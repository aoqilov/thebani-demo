import { useTranslation } from '@/i18n/languageConfig'
import { CusButton } from '../buttons/CusButton'
import { CusDialog } from './CusDialog'

export function CusDialogDelete({ open, onClose, onConfirm, text, isLoading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; text: string; isLoading?: boolean
}) {
  const { t } = useTranslation('common.')
  return (
    <CusDialog
      open={open}
      onClose={onClose}
      title={t('delete')}
      size="sm"
      footer={
        <>
          <CusButton variant="ghost" onClick={onClose}>{t('cancel')}</CusButton>
          <CusButton color="danger" isLoading={isLoading} onClick={onConfirm}>{t('delete')}</CusButton>
        </>
      }
    >
      {text}
    </CusDialog>
  )
}
