import { useMemo, useState } from 'react'
import { CusChip } from '@/components/ui/toolbar/CusToolbar'
import { isStopped, itemState } from '@/data/menu.calc'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useCostCtx } from '../warehouse-recipes/components/useCostCtx'
import CategoriesPanel from './components/CategoriesPanel'
import ItemsTab from './components/ItemsTab'
import ModifiersTab from './components/ModifiersTab'
import StopListTab from './components/StopListTab'
import { useMenuCategories, useMenuItems, useModifierGroups } from './hooks/useMenu'

type Tab = 'items' | 'modifiers' | 'stop'

export default function FeatureMenu() {
  const { ctx, products } = useCostCtx()
  const { data: categories = [] } = useMenuCategories()
  const { data: items = [] } = useMenuItems()
  const { data: modifierGroups = [] } = useModifierGroups()
  const [tab, setTab] = useState<Tab>('items')
  const [categoryId, setCategoryId] = useState<number | 'all'>('all')

  const stopCount = useMemo(() => items.filter((i) => isStopped(itemState(i, ctx).status)).length, [items, ctx])

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader
        label="Управление"
        title="Меню"
        highlight="и стоп-лист"
        subtitle="Позиции, цены, цеха и модификаторы. Стоп-лист обновляется автоматически по остаткам склада."
      />

      <div className="flex flex-wrap gap-1.5">
        <CusChip active={tab === 'items'} onClick={() => setTab('items')}>Позиции ({items.length})</CusChip>
        <CusChip active={tab === 'modifiers'} onClick={() => setTab('modifiers')}>Модификаторы ({modifierGroups.length})</CusChip>
        <CusChip active={tab === 'stop'} onClick={() => setTab('stop')}>Стоп-лист ({stopCount})</CusChip>
      </div>

      {tab === 'items' && (
        <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[260px_1fr]">
          <CategoriesPanel categories={categories} items={items} selectedId={categoryId} onSelect={setCategoryId} />
          <ItemsTab items={items} categories={categories} products={products} modifierGroups={modifierGroups} ctx={ctx} categoryId={categoryId} />
        </div>
      )}
      {tab === 'modifiers' && <ModifiersTab groups={modifierGroups} items={items} products={products} ctx={ctx} />}
      {tab === 'stop' && <StopListTab items={items} ctx={ctx} />}
    </div>
  )
}
