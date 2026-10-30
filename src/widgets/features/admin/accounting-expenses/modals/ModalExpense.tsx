import { useEffect, useState } from 'react'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL, ExpenseCategory, type Expense } from '@/types/accounting.types'
import { today } from '@/utils/format'
import { useDeleteExpense, useSaveExpense } from '../hooks/useExpenses'

interface Props {
  open: boolean
  onClose: () => void
  expense: Expense | null
}

export default function ModalExpense({ open, onClose, expense }: Props) {
  const save = useSaveExpense()
  const remove = useDeleteExpense()
  const [date, setDate] = useState(today())
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.OTHER)
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    setDate(expense?.date ?? today())
    setCategory(expense?.category ?? ExpenseCategory.OTHER)
    setAmount(expense ? String(expense.amount) : '')
    setTitle(expense?.title ?? '')
    setComment(expense?.comment ?? '')
    setError(null)
  }, [open, expense])

  async function submit() {
    setError(null)
    try {
      await save.mutateAsync({ id: expense?.id, date, category, amount: Number(amount.replace(/\s/g, '').replace(',', '.')) || 0, title, comment })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function doDelete() {
    await remove.mutateAsync(expense!.id)
    setConfirm(false)
    onClose()
  }

  return (
    <>
      <CusDialog
        open={open}
        onClose={onClose}
        title={expense ? 'Расход' : 'Новый расход'}
        footer={
          <>
            {expense && <CusButton variant="outline" color="danger" className="mr-auto" onClick={() => setConfirm(true)}>Удалить</CusButton>}
            <CusButton variant="ghost" onClick={onClose}>Отмена</CusButton>
            <CusButton isLoading={save.isPending} onClick={submit}>Сохранить</CusButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {error && <div className="tablet:col-span-2"><CusAlert color="danger">{error}</CusAlert></div>}
          <CusInput label="Дата" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <CusSelect label="Статья" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: EXPENSE_CATEGORY_LABEL[c] }))} />
          <div className="tablet:col-span-2"><CusInput label="На что потрачено" value={title} autoFocus onChange={(e) => setTitle(e.target.value)} /></div>
          <CusInput label="Сумма, сум" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <CusInput label="Комментарий" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      </CusDialog>
      <CusDialogDelete open={confirm} onClose={() => setConfirm(false)} onConfirm={doDelete} isLoading={remove.isPending} text={`Удалить расход «${expense?.title}»? Он пропадёт из отчёта о прибылях и убытках.`} />
    </>
  )
}
