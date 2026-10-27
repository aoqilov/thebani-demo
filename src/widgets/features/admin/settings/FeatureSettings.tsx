import { LuCheck, LuEye } from 'react-icons/lu'
import { navGroups, systemItems, type NavEntry } from '@/components/layout/admin/sidebar/sidebarNav'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { RoleLabel, RoleTypes, type RoleTypes as Role } from '@/const/constData'
import { roleApps } from '@/const/roleApps'
import { useTranslation } from '@/i18n/languageConfig'
import PageHeader from '@/widgets/shared-ui/PageHeader'

const adminRoles: Role[] = [RoleTypes.SUPERADMIN, RoleTypes.OWNER, RoleTypes.DIRECTOR, RoleTypes.ADMIN, RoleTypes.ACCOUNTANT, RoleTypes.MARKETING, RoleTypes.HR, RoleTypes.SKLAD, RoleTypes.PROCEDURE]
/** Только просмотр, без изменений */
const viewOnly: Role[] = [RoleTypes.OWNER, RoleTypes.DIRECTOR]

interface Row { group?: string; label: string; roles?: Role[] }

/** Строки матрицы собираются из тех же данных, что и боковое меню, поэтому всегда актуальны. */
function useRows(): Row[] {
  const { t } = useTranslation('sidebar.')
  const rows: Row[] = []
  const add = (e: NavEntry, prefix = '') => {
    if (e.subItems) e.subItems.forEach((s) => rows.push({ label: `${t(e.labelKey)} → ${t(s.labelKey)}`, roles: s.roles }))
    else rows.push({ label: prefix + t(e.labelKey), roles: e.roles })
  }
  navGroups.forEach((g) => { rows.push({ group: t(g.labelKey), label: '' }); g.items.forEach((e) => add(e)) })
  rows.push({ group: t('system'), label: '' })
  systemItems.filter((s) => s.to !== '/test-ui').forEach((s) => rows.push({ label: t(s.labelKey), roles: s.roles }))
  return rows
}

export default function FeatureSettings() {
  const rows = useRows()
  const can = (r: Row, role: Role) => !r.roles || r.roles.length === 0 || r.roles.includes(role)

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Система" title="Права" highlight="доступа" subtitle="Кто и какие разделы видит. Матрица строится из настроек бокового меню." />

      <CusCard>
        <CusCardHeader title="Админ-панель" subtitle="Галочка — полный доступ, глаз — только просмотр (владелец и директор)" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead className="bg-park-bgHover/60">
              <tr>
                <th className="sticky left-0 bg-park-bgHover px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-park-textMuted">Раздел</th>
                {adminRoles.map((r) => <th key={r} className="px-2 py-3 text-center text-xs font-semibold text-park-text3">{RoleLabel[r]}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => r.group ? (
                <tr key={i} className="bg-park-bgHover/40"><td colSpan={adminRoles.length + 1} className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-park-textDim">{r.group}</td></tr>
              ) : (
                <tr key={i} className="border-t border-park-border">
                  <td className="sticky left-0 bg-park-bgCard px-4 py-2 text-park-text">{r.label}</td>
                  {adminRoles.map((role) => (
                    <td key={role} className="px-2 py-2 text-center">
                      {can(r, role)
                        ? (viewOnly.includes(role) ? <LuEye size={16} className="mx-auto text-info" /> : <LuCheck size={16} className="mx-auto text-success" />)
                        : <span className="text-park-border2">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CusCard>

      <CusCard>
        <CusCardHeader title="Рабочие места" subtitle="Мобильные роли видят только свой экран" />
        <ul className="divide-y divide-park-border">
          {roleApps.map((a) => (
            <li key={a.key} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
              <div>
                <p className="font-semibold text-park-text">{RoleLabel[a.role]}</p>
                <p className="font-mono text-xs text-park-textMuted">{a.base}</p>
              </div>
              <p className="text-park-textMuted">{a.screens.map((s) => s.label).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </CusCard>
    </div>
  )
}
