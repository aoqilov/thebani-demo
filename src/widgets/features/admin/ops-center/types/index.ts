export type Tone = 'ok' | 'warn' | 'bad' | 'idle'

export interface DeptMetric {
  label: string
  value: string | number
  /** Подсветить значение */
  tone?: Tone
}

/** Состояние одного участка работы (ресепшн, кухня, касса…). */
export interface Dept {
  id: string
  title: string
  tone: Tone
  /** Короткое пояснение статуса: «Всё в норме» / «Есть просрочка» */
  note: string
  to: string
  metrics: DeptMetric[]
}

export interface FeedEvent {
  id: string
  at: string
  actor: string
  role: string
  text: string
  tone: Tone
}

export interface StaffActivity {
  actor: string
  role: string
  lastAt: string
  lastText: string
  count: number
  /** Был активен за последние 30 минут */
  online: boolean
}

/** Что сотрудник делает прямо сейчас. */
export interface WorkerNow {
  name: string
  role: string
  /** busy — занят делом, idle — свободен, off — не на смене */
  state: 'busy' | 'idle' | 'off'
  /** warn/bad — стоит обратить внимание (например, блюдо готовится слишком долго) */
  tone: Tone
  doing: string
  /** Когда началось текущее дело */
  since?: string
}

export interface OpsData {
  depts: Dept[]
  workers: WorkerNow[]
  feed: FeedEvent[]
  staff: StaffActivity[]
  /** Сколько участков требуют внимания */
  issues: number
}
