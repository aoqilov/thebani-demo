import { useState } from 'react'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { RoleLabel, RoleTypes } from '@/const/constData'
import { useTranslation } from '@/i18n/languageConfig'
import { useCreateEmployee } from '../hooks/useApiEmployees'

const roleOptions = Object.values(RoleTypes).map((r) => ({ value: r, label: RoleLabel[r] }))
const empty = { firstname: '', lastname: '', phone: '', role: RoleTypes.CASHIER as RoleTypes }

export default function ModalAddEmploye({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('common.')
  const [form, setForm] = useState(empty)
  const create = useCreateEmployee()
  const valid = form.firstname.trim() && form.lastname.trim()

  function submit() {
    create.mutate({ ...form, status: 'active' }, { onSuccess: () => { setForm(empty); onClose() } })
  }

  return (
    <CusDialog
      open={open}
      onClose={onClose}
      title="Новый сотрудник"
      footer={
        <>
          <CusButton variant="ghost" onClick={onClose}>{t('cancel')}</CusButton>
          <CusButton isDisabled={!valid} isLoading={create.isPending} onClick={submit}>{t('save')}</CusButton>
        </>
      }
    >
      <div className="grid gap-3">
        <CusInput label="Имя" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
        <CusInput label="Фамилия" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
        <CusInput label="Телефон" placeholder="+998 XX XXX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <CusSelect label="Роль" options={roleOptions} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as RoleTypes })} />
      </div>
    </CusDialog>
  )
}
