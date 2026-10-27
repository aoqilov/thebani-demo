import { useMemo } from 'react'
import { LuCircleCheck } from 'react-icons/lu'
import { CusCard } from '@/components/shared/card/CusCard'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import { isStopped, itemState } from '@/data/menu.calc'
import type { CostCtx } from '@/data/recipe.calc'
import { STATION_LABEL, type MenuItem } from '@/types/menu.types'
import { useSetItemStopped } from '../hooks/useMenu'
import StateBadge from './StateBadge'

type Row = MenuItem & { status: ReturnType<typeof itemState>['status']; reason: string }

/** Стоп-лист: вручную отключённые + автоматически (нет продуктов на складе / нет тех. карты). */
export default function StopListTab({ items, ctx }: { items: MenuItem[]; ctx: CostCtx }) {
  const setStopped = useSetItemStopped()

  const rows: Row[] = useMemo(
    () => items.map((i) => ({ ...i, ...itemState(i, ctx) })).filter((r) => isStopped(r.status)),
    [items, ctx],
  )

  const columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Позиция', sortable: true, render: (r) => <span className="font-semibold text-park-text">{r.name}</span> },
    { key: 'station', header: 'Цех', render: (r) => STATION_LABEL[r.station] },
    { key: 'status', header: 'Тип', render: (r) => <StateBadge status={r.status} /> },
    { key: 'reason', header: 'Причина', render: (r) => <span className="text-park-textMuted">{r.reason}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => r.status === 'stop-manual' && (
        <CusButton size="sm" color="success" variant="outline" leftIcon={<LuCircleCheck size={14} />} onClick={() => setStopped.mutate({ id: r.id, stopped: false })}>Вернуть в продажу</CusButton>
      ),
    },
  ]

  return (
    <CusCard>
      <div className="border-b border-park-border px-5 py-3 text-sm text-park-textMuted">
        Автоматический стоп появляется, когда на складе не хватает продуктов даже на одну порцию (или у блюда нет тех. карты). Он снимается сам после прихода товара.
      </div>
      <CusTable data={rows} columns={columns} emptyText="Стоп-лист пуст — всё в продаже" />
    </CusCard>
  )
}
