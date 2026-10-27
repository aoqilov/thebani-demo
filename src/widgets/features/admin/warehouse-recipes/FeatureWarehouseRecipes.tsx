import { useState } from 'react'
import { CusCard } from '@/components/shared/card/CusCard'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import { useGroups } from '../warehouse-common/hooks/useWarehouse'
import ModalProduct from '../warehouse-products/modals/ModalProduct'
import RecipeEditor from './components/RecipeEditor'
import RecipeList from './components/RecipeList'
import { useCostCtx } from './components/useCostCtx'

export default function FeatureWarehouseRecipes() {
  const { ctx, products, recipes } = useCostCtx()
  const { data: groups = [] } = useGroups()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const selected = selectedId !== null ? ctx.products.get(selectedId) : undefined
  const dishGroupId = groups.find((g) => g.name === 'Горячее')?.id ?? groups[0]?.id ?? 1

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      <PageHeader
        label="Склад"
        title="Рецепты"
        highlight="(тех. карты)"
        subtitle="Состав блюд и заготовок, себестоимость и food cost. При продаже блюда ингредиенты списываются со склада автоматически."
      />

      <div className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-[360px_1fr]">
        <RecipeList
          products={products}
          recipes={recipes}
          ctx={ctx}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={() => setCreateOpen(true)}
        />

        {selected ? (
          <RecipeEditor key={selected.id} product={selected} recipe={ctx.recipes.get(selected.id)} products={products} ctx={ctx} />
        ) : (
          <CusCard className="p-10 text-center text-sm text-park-textMuted">Выберите блюдо или заготовку слева, либо создайте новую тех. карту.</CusCard>
        )}
      </div>

      <ModalProduct open={createOpen} onClose={() => setCreateOpen(false)} groups={groups} product={null} defaultGroupId={dishGroupId} defaultKind="dish" />
    </div>
  )
}
