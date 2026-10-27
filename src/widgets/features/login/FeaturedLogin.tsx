import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { RoleLabel, RoleTypes } from '@/const/constData'
import { getRoleDefaultPath, saveAuth } from './hooks/authApi'

const roleOptions = Object.values(RoleTypes).map((r) => ({ value: r, label: RoleLabel[r] }))

/** Демо-вход: backend нет, сохраняется фейковый токен с выбранной ролью. */
export default function FeaturedLogin() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }
  const [role, setRole] = useState<RoleTypes>(RoleTypes.SUPERADMIN)
  const [phone, setPhone] = useState('+998 ')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    saveAuth('demo-token', role)
    navigate(location.state?.from?.pathname ?? getRoleDefaultPath(role), { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-park-bg p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-park-border bg-park-bgCard p-6">
        <div>
          <h1 className="text-xl font-bold text-park-text">Thebani</h1>
          <p className="text-sm text-park-textMuted">Вход в систему (демо)</p>
        </div>
        <CusInput label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <CusInput label="Пароль" type="password" placeholder="••••••" />
        <CusSelect label="Роль (демо)" options={roleOptions} value={role} onChange={(e) => setRole(e.target.value as RoleTypes)} />
        <CusButton type="submit" className="w-full">Войти</CusButton>
      </form>
    </div>
  )
}
