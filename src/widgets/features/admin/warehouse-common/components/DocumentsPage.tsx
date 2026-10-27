import { useState } from 'react'
import type { DocType } from '@/types/warehouse.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import DocumentEditor from './DocumentEditor'
import DocumentsList from './DocumentsList'

/** Список документов ↔ редактор. Общая страница для прихода и списания. */
export default function DocumentsPage({ type }: { type: DocType }) {
  // undefined — показываем список; null — новый документ; number — существующий
  const [editing, setEditing] = useState<number | null | undefined>(undefined)
  const isIncome = type === 'income'

  return (
    <div className="space-y-4 px-4 pb-6 tablet:px-6">
      {editing === undefined ? (
        <>
          <PageHeader
            label="Склад"
            title={isIncome ? 'Приход' : 'Расход'}
            highlight={isIncome ? 'товара' : 'и списание'}
            subtitle={isIncome ? 'Приходные накладные: проведение увеличивает остаток и пересчитывает себестоимость.' : 'Акты списания: проведение уменьшает остаток по средней себестоимости.'}
          />
          <DocumentsList type={type} onOpen={setEditing} />
        </>
      ) : (
        <DocumentEditor key={editing ?? 'new'} type={type} docId={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
