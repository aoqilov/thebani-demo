import { useState } from 'react'
import { LuBanknote, LuChevronRight, LuPlus, LuTrash2, LuUsers } from 'react-icons/lu'
import { CusChart } from '@/components/charts/CusChart'
import { CusCard, CusCardHeader, CusInfoRow } from '@/components/shared/card/CusCard'
import { CusStatCard } from '@/components/shared/card/CusStatCard'
import { CusAlert } from '@/components/ui/alert/CusAlert'
import { CusAvatar } from '@/components/ui/avatar/CusAvatar'
import { CusBadge } from '@/components/ui/badge/CusBadge'
import { CusBreadCrumb } from '@/components/ui/bread-crumb/CusBreadCrumb'
import { CusButton } from '@/components/ui/buttons/CusButton'
import { CusDialog } from '@/components/ui/dialog/CusDialog'
import { CusDialogDelete } from '@/components/ui/dialog/CusDialogDelete'
import { CusDrawer } from '@/components/ui/dialog/CusDrawer'
import { CusCheckbox } from '@/components/ui/inputs/CusCheckbox'
import { CusInput } from '@/components/ui/inputs/CusInput'
import { CusSwitch } from '@/components/ui/inputs/CusSwitch'
import { CusTextArea } from '@/components/ui/inputs/CusTextArea'
import { CusPopover } from '@/components/ui/popover/CusPopover'
import { CusSelect } from '@/components/ui/select/CusSelect'
import { CusTabs } from '@/components/ui/tabs/CusTabs'
import { CusPagination } from '@/components/ui/table/CusPagination'
import { CusTable, type ColumnDef } from '@/components/ui/table/CusTable'
import type { CusColor } from '@/types/common.types'
import PageHeader from '@/widgets/shared-ui/PageHeader'
import DevSection from './components/DevSection'

const colors: CusColor[] = ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'dark']

interface Row { id: number; name: string; role: string; amount: number }
const rows: Row[] = [
  { id: 1, name: 'Иван Петров', role: 'Кассир', amount: 120000 },
  { id: 2, name: 'Анна Смирнова', role: 'Оператор', amount: 85000 },
  { id: 3, name: 'Сергей Иванов', role: 'Администратор', amount: 230000 },
]
const columns: ColumnDef<Row>[] = [
  { key: 'name', header: 'Имя', sortable: true },
  { key: 'role', header: 'Роль', sortable: true },
  { key: 'amount', header: 'Сумма', sortable: true, align: 'right', render: (r) => r.amount.toLocaleString('ru-RU') },
]

const chartData = [
  { month: 'Янв', sales: 400, profit: 240 }, { month: 'Фев', sales: 520, profit: 300 },
  { month: 'Мар', sales: 480, profit: 280 }, { month: 'Апр', sales: 700, profit: 420 },
  { month: 'Май', sales: 650, profit: 390 }, { month: 'Июн', sales: 820, profit: 500 },
]
const pieData = [{ name: 'Наличные', value: 400 }, { name: 'UzCard', value: 300 }, { name: 'Карта', value: 200 }, { name: 'Онлайн', value: 150 }]

/** Превью всех Cus* компонентов. Доступно только в dev-режиме (/test-ui). */
export default function FeatureDevUI() {
  const [page, setPage] = useState(2)
  const [on, setOn] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [del, setDel] = useState(false)
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="space-y-4 px-4 pb-10 tablet:px-6">
      <PageHeader title="UI" highlight="превью" label="Dev only" subtitle="Все Cus-компоненты в одном месте. Страница доступна только в dev-режиме." />

      <DevSection title="Кнопки" name="CusButton">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{colors.map((c) => <CusButton key={c} color={c}>{c}</CusButton>)}</div>
          <div className="flex flex-wrap gap-2">{colors.map((c) => <CusButton key={c} color={c} variant="outline">{c}</CusButton>)}</div>
          <div className="flex flex-wrap items-center gap-2">
            <CusButton size="sm">Маленькая</CusButton>
            <CusButton>Средняя</CusButton>
            <CusButton size="lg" leftIcon={<LuPlus size={18} />}>Большая (56px)</CusButton>
            <CusButton round>Круглая</CusButton>
            <CusButton variant="ghost">Ghost</CusButton>
            <CusButton isLoading>Загрузка</CusButton>
            <CusButton isDisabled>Отключена</CusButton>
          </div>
        </div>
      </DevSection>

      <DevSection title="Бейджи и аватары" name="CusBadge / CusAvatar">
        <div className="flex flex-wrap items-center gap-2">
          {colors.map((c) => <CusBadge key={c} color={c}>{c}</CusBadge>)}
          {colors.slice(0, 3).map((c) => <CusBadge key={c} color={c} solidFill>{c}</CusBadge>)}
          <CusAvatar name="Иван Петров" size={32} /><CusAvatar name="Анна Смирнова" /><CusAvatar name="Сергей Иванов" size={56} />
        </div>
      </DevSection>

      <DevSection title="Алерты" name="CusAlert">
        <div className="space-y-2">{colors.slice(0, 6).map((c) => <CusAlert key={c} color={c}>Это уведомление типа «{c}».</CusAlert>)}</div>
      </DevSection>

      <DevSection title="Формы" name="CusInput / CusSelect / CusTextArea / CusCheckbox / CusSwitch">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          <CusInput label="Телефон" placeholder="+998 XX XXX XX XX" />
          <CusInput label="С ошибкой" error="Обязательное поле" />
          <CusInput label="С иконкой" leftIcon={<LuUsers size={14} />} placeholder="Поиск..." />
          <CusSelect label="Роль" options={[{ value: 'a', label: 'Кассир' }, { value: 'b', label: 'Оператор' }]} />
          <div className="tablet:col-span-2"><CusTextArea label="Комментарий" placeholder="Текст..." /></div>
          <CusCheckbox label="Запомнить меня" />
          <CusSwitch checked={on} onChange={setOn} label="Уведомления" />
        </div>
      </DevSection>

      <DevSection title="Вкладки" name="CusTabs">
        <CusTabs tabs={[{ label: 'Обзор', content: 'Содержимое первой вкладки.' }, { label: 'Детали', content: 'Содержимое второй вкладки.' }, { label: 'История', content: 'Содержимое третьей вкладки.' }]} />
      </DevSection>

      <DevSection title="Таблица (сортировка)" name="CusTable">
        <CusTable data={rows} columns={columns} />
      </DevSection>
      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <DevSection title="Таблица: striped + interactive" name="striped interactive"><CusTable data={rows} columns={columns} striped interactive /></DevSection>
        <DevSection title="Таблица: bordered + цветной head" name="bordered headColor"><CusTable data={rows} columns={columns} bordered headColor="primary" /></DevSection>
      </div>

      <DevSection title="Пагинация" name="CusPagination">
        <CusPagination page={page} pageCount={5} onChange={setPage} />
      </DevSection>

      <DevSection title="Диалоги, drawer, popover" name="CusDialog / CusDialogDelete / CusDrawer / CusPopover">
        <div className="flex flex-wrap items-center gap-2">
          <CusButton onClick={() => setDialog(true)}>Диалог</CusButton>
          <CusButton color="danger" variant="outline" leftIcon={<LuTrash2 size={16} />} onClick={() => setDel(true)}>Удаление</CusButton>
          <CusButton color="secondary" onClick={() => setDrawer(true)}>Drawer</CusButton>
          <CusPopover align="left" trigger={<span className="rounded-md border border-park-border px-3 py-2 text-sm font-semibold">Popover</span>}>
            {(close) => <button onClick={close} className="block w-full px-4 py-3 text-left text-sm hover:bg-park-bgHover">Нажмите, чтобы закрыть</button>}
          </CusPopover>
        </div>
        <CusDialog open={dialog} onClose={() => setDialog(false)} title="Заголовок" footer={<CusButton onClick={() => setDialog(false)}>Закрыть</CusButton>}>Содержимое диалога.</CusDialog>
        <CusDialogDelete open={del} onClose={() => setDel(false)} onConfirm={() => setDel(false)} text="Удалить запись без возможности восстановления?" />
        <CusDrawer open={drawer} onClose={() => setDrawer(false)} title="Детали">Содержимое drawer.</CusDrawer>
      </DevSection>

      <DevSection title="Хлебные крошки" name="CusBreadCrumb">
        <CusBreadCrumb separator={<LuChevronRight size={10} />} items={[{ label: 'Дашборд', to: '/' }, { label: 'Сотрудники', to: '/employees' }, { label: '#12' }]} />
      </DevSection>

      <DevSection title="Карточки" name="CusCard / CusInfoRow / CusStatCard">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
          <CusStatCard icon={<LuUsers size={24} />} label="Посетители" value="1 294" color="info" />
          <CusStatCard icon={<LuBanknote size={24} />} label="Выручка" value="1 345 000" color="primary" />
          <CusStatCard icon={<LuUsers size={24} />} label="Заказы" value="576" color="success" />
          <CusStatCard icon={<LuTrash2 size={24} />} label="Возвраты" value="23" color="danger" />
        </div>
        <CusCard className="mt-4">
          <CusCardHeader title="Информация" subtitle="CusCardHeader" />
          <div className="divide-y divide-park-border px-5"><CusInfoRow label="Смена" value="Открыта" /><CusInfoRow label="Касса" value="№ 3" /></div>
        </CusCard>
      </DevSection>

      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <DevSection title="График: линия" name="CusChart type=line"><CusChart type="line" data={chartData} xKey="month" series={['sales', 'profit']} /></DevSection>
        <DevSection title="График: столбцы" name="CusChart type=bar"><CusChart type="bar" data={chartData} xKey="month" series={['sales', 'profit']} /></DevSection>
        <DevSection title="График: область" name="CusChart type=area"><CusChart type="area" data={chartData} xKey="month" series={['sales']} /></DevSection>
        <DevSection title="График: круговая" name="CusChart type=pie"><CusChart type="pie" data={pieData} xKey="name" series={['value']} /></DevSection>
      </div>
    </div>
  )
}
