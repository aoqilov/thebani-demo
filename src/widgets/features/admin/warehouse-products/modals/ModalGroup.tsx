import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSelect } from '@/components/ui/select/CusSelect'
import type { ProductGroup } from '@/types/warehouse.types'
import { useDeleteGroup, useSaveGroup } from '../../warehouse-common/hooks/useWarehouse'
import { flattenGroups } from './ModalProduct'

interface Props {
  open: boolean
  onClose: () => void
  groups: ProductGroup[]
  /** null — новая группа */
  group: ProductGroup | null
  /** Родитель по умолчанию для новой группы (выбранная папка) */
  defaultParentId: number | null
}

const ROOT = 'root'

const descendants = (groups: ProductGroup[], id: number): number[] => [id, ...groups.filter((g) => g.parentId === id).flatMap((g) => descendants(groups, g.id))]

export default function ModalGroup({ open, onClose, groups, group, defaultParentId }: Props) {
  const save = useSaveGroup()
  const remove = useDeleteGroup()
  const [name, setName] = useState('')
  const [parent, setParent] = useState<string>(ROOT)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(group?.name ?? '')
    const p = group ? group.parentId : defaultParentId
    setParent(p === null ? ROOT : String(p))
    setError(null)
  }, [open, group, defaultParentId])

  // Родителем нельзя выбрать саму группу и её потомков
  const banned = group ? descendants(groups, group.id) : []
  const parentOptions = [{ value: ROOT, label: 'Корень (без родителя)' }, ...flattenGroups(groups).filter((o) => !banned.includes(Number(o.value)))]

  async function submit() {
    setError(null)
    try {
      await save.mutateAsync({ id: group?.id, name, parentId: parent === ROOT ? null : Number(parent) })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    try {
      await remove.mutateAsync(group!.id)
      setConfirm(false)
      onClose()
    } catch (e) {
      setConfirm(false)
      setError((e as Error).message)
    }
  }

  return (
    <>
      <CusDialog
        open={open}
        onClose={onClose}
        title={group ? 'Группа номенклатуры' : 'Новая группа'}
        footer={
          <>
            {group && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && <CusAlert color="danger">{error}</CusAlert>}
          <CusInput label="Название группы" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
          <CusSelect label="Родительская группа" value={parent} onChange={(e) => setParent(e.target.value)} options={parentOptions} />
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить группу «${group?.name}»? Удалить можно только пустую группу.`} />
    </>
  )
}
