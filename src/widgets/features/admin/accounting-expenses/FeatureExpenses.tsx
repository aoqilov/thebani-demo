import { useMemo, useState } from 'react'
import { LuDownload, LuPlus, LuSearch } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL, type Expense } from '@/types/accounting.types'
import { downloadCsv } from '@/utils/csv'
import { fmtDate, fmtMoney, today } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useExpenses } from './hooks/useExpenses'
import ModalExpense from './modals/ModalExpense'

const monthStart = () => `${today().slice(0, 7)}-01`

/** Журнал расходов: аренда, коммуналка, зарплата, налоги. Из него строится отчёт о прибылях и убытках. */
export default function FeatureExpenses() {
  const { data: expenses = [], isLoading } = useExpenses()
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Expense | null>(null)
  const [open, setOpen] = useState(false)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return expenses.filter((e) => e.date >= from && e.date <= to && (category === 'all' || e.category === category) && (!q || e.title.toLowerCase().includes(q) || e.comment.toLowerCase().includes(q)))
  }, [expenses, from, to, category, search])
  const total = rows.reduce((s, e) => s + e.amount, 0)

  const columns: ColumnDef<Expense>[] = [
    { key: 'date', header: 'Дата', sortable: true, width: 110, render: (e) => fmtDate(e.date) },
    { key: 'category', header: 'Статья', render: (e) => <CusBadge color={e.category === 'taxes' ? 'danger' : 'info'}>{EXPENSE_CATEGORY_LABEL[e.category]}</CusBadge> },
    { key: 'title', header: 'На что потрачено', render: (e) => <span className="font-semibold text-park-text">{e.title}</span> },
    { key: 'comment', header: 'Комментарий', render: (e) => e.comment || <span className="text-park-textMuted">—</span> },
    { key: 'amount', header: 'Сумма, сум', sortable: true, align: 'right', render: (e) => (e.amount > 0 ? fmtMoney(e.amount) : <span className="text-park-textMuted">—</span>) },
  ]

  function exportCsv() {
    downloadCsv(`rashody_${from}_${to}.csv`, ['Дата', 'Статья', 'На что потрачено', 'Комментарий', 'Сумма, сум'], rows.map((e) => [e.date, EXPENSE_CATEGORY_LABEL[e.category], e.title, e.comment, Math.round(e.amount)]))
  }

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Бухгалтерия" title="Журнал" highlight="расходов" subtitle="Аренда, коммунальные услуги, зарплата, реклама, налоги. Эти данные попадают в отчёт о прибылях и убытках." />

      <CusCard>
        <CusToolbar
          left={
            <>
              <CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={() => { setEditing(null); setOpen(true) }}>Добавить расход</CusButton>
              <div className="ml-2 w-40"><CusInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <span className="text-park-textMuted">—</span>
              <div className="w-40"><CusInput type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <div className="w-56"><CusSelect value={category} onChange={(e) => setCategory(e.target.value)} options={[{ value: 'all', label: 'Все статьи' }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: EXPENSE_CATEGORY_LABEL[c] }))]} /></div>
            </>
          }
          right={
            <>
              <CusInput placeholder="Поиск…" value={search} leftIcon={<LuSearch size={14} />} onChange={(e) => setSearch(e.target.value)} />
              <CusButton size="sm" variant="outline" leftIcon={<LuDownload size={14} />} isDisabled={rows.length === 0} onClick={exportCsv}>Экспорт CSV</CusButton>
            </>
          }
        />
        <div className="overflow-x-auto">
          <CusTable data={rows} columns={columns} isLoading={isLoading} interactive onRowClick={(e) => { setEditing(e); setOpen(true) }} emptyText="За выбранный период расходов нет" />
        </div>
        <div className="flex justify-between border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">
          <span>Записей: {rows.length}</span>
          <span className="font-semibold text-park-text">Итого: {fmtMoney(total)} сум</span>
        </div>
      </CusCard>

      <ModalExpense open={open} onClose={() => setOpen(false)} expense={editing} />
    </div>
  )
}
