import { useState } from 'react'
import { LuPlus, LuSearch, LuTrash2 } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'
import { CusAvatar } from '@/components/ui/avatar/CusAvatar'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusPagination } from '@/components/ui/table/CusPagination'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { RoleLabel } from '@/const/constData'
import { useTranslation } from '@/i18n/languageConfig'
import type { CusColor } from '@/types/common.types'
import { useDeleteEmployees, useEmployees } from '../hooks/useApiEmployees'
import ModalAddEmploye from '../modals/ModalAddEmploye'
import type { ApiEmployee, EmployeeStatus } from '../types'

const PAGE_SIZE = 6
const statusColor: Record<EmployeeStatus, CusColor> = { active: 'success', blocked: 'danger', vacation: 'warning' }
const statusText: Record<EmployeeStatus, string> = { active: 'Активные', blocked: 'Заблокированные', vacation: "В отпуске" }

export default function EmployeeTableCard() {
  const { t } = useTranslation('common.')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ApiEmployee | null>(null)

  const { data, isLoading } = useEmployees({ search })
  const remove = useDeleteEmployees()

  const all = data?.employees ?? []
  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const rows = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const columns: ColumnDef<ApiEmployee>[] = [
    {
      key: 'firstname',
      header: 'Сотрудник',
      sortable: true,
      render: (r) => (
        <span className="flex items-center gap-3">
          <CusAvatar name={`${r.firstname} ${r.lastname}`} size={32} />
          <span className="font-semibold text-park-text">{r.lastname} {r.firstname}</span>
        </span>
      ),
    },
    { key: 'phone', header: 'Телефон' },
    { key: 'role', header: 'Роль', sortable: true, render: (r) => RoleLabel[r.role] },
    { key: 'status', header: 'Статус', render: (r) => <CusBadge color={statusColor[r.status]}>{statusText[r.status]}</CusBadge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setToDelete(r) }}
          className="rounded-lg p-1.5 text-park-textMuted hover:bg-danger/10 hover:text-danger"
          aria-label={t('delete')}
        >
          <LuTrash2 size={16} />
        </button>
      ),
    },
  ]

  return (
    <CusCard>
      <CusCardHeader
        title="Список сотрудников"
        actions={
          <div className="flex items-center gap-2">
            <CusInput placeholder={t('search')} value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            <CusButton leftIcon={<LuPlus size={16} />} onClick={() => setAddOpen(true)}>{t('add')}</CusButton>
          </div>
        }
      />
      <CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={(r) => navigate(`/employee/${r.id}`)} />
      <div className="flex justify-end border-t border-park-border p-3">
        <CusPagination page={current} pageCount={pageCount} onChange={setPage} />
      </div>

      <ModalAddEmploye open={addOpen} onClose={() => setAddOpen(false)} />
      <CusDialogDelete
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        isLoading={remove.isPending}
        text={toDelete ? `${toDelete.lastname} ${toDelete.firstname} — удалить?` : ''}
        onConfirm={() => toDelete && remove.mutate([toDelete.id], { onSuccess: () => setToDelete(null) })}
      />
    </CusCard>
  )
}
