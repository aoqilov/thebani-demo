import { useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { CusToolbar } from '@/components/ui/toolbar/CusToolbar'
import { TARIFF_KIND_LABEL, type Tariff } from '@/types/tariff.types'
import { fmtMoney } from '@/utils/format'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import ModalTariff from './modals/ModalTariff'
import { useTariffs } from './hooks/useTariffs'

export default function FeatureTariffs() {
  const { data: tariffs = [], isLoading } = useTariffs()
  const [editing, setEditing] = useState<Tariff | null>(null)
  const [open, setOpen] = useState(false)

  const columns: ColumnDef<Tariff>[] = [
    { key: 'name', header: 'Название', sortable: true, render: (t) => <span className="font-semibold text-park-text">{t.name}</span> },
    { key: 'kind', header: 'Тип', render: (t) => TARIFF_KIND_LABEL[t.kind] },
    { key: 'durationMin', header: 'Время', sortable: true, render: (t) => (t.durationMin >= 960 ? 'безлимит' : `${t.durationMin / 60} ч`) },
    { key: 'guests', header: 'Гостей', align: 'right' },
    { key: 'price', header: 'Цена, сум', align: 'right', sortable: true, render: (t) => (t.price === 0 ? 'Бесплатно' : fmtMoney(t.price)) },
    { key: 'extraHourPrice', header: '+1 час', align: 'right', render: (t) => fmtMoney(t.extraHourPrice) },
    { key: 'includes', header: 'Входит', render: (t) => <span className="text-park-textMuted">{t.includes.join(', ') || '—'}</span> },
    { key: 'active', header: 'Статус', render: (t) => (t.active ? <CusBadge color="success">Активен</CusBadge> : <CusBadge color="dark">Отключён</CusBadge>) },
  ]

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader label="Управление" title="Тарифы" highlight="входа" subtitle="Тарифы, которые администратор ресепшн выбирает при встрече гостя." />
      <CusCard>
        <CusToolbar left={<CusButton size="sm" leftIcon={<LuPlus size={14} />} onClick={() => { setEditing(null); setOpen(true) }}>Новый тариф</CusButton>} />
        <CusTable data={tariffs} columns={columns} isLoading={isLoading} interactive onRowClick={(t) => { setEditing(t); setOpen(true) }} />
        <div className="border-t border-park-border px-4 py-2.5 text-sm text-park-textMuted">Тарифов: {tariffs.length}</div>
      </CusCard>
      <ModalTariff open={open} onClose={() => setOpen(false)} tariff={editing} />
    </div>
  )
}
