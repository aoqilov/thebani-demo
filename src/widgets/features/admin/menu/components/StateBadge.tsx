import { CusBadge } from '@/components/ui/badge/CusBadge'
import { AVAILABILITY_LABEL, type Availability } from '@/data/menu.calc'
import type { CusColor } from '@/types/common.types'

const color: Record<Availability, CusColor> = {
  ok: 'success',
  low: 'warning',
  'stop-manual': 'danger',
  'stop-auto': 'danger',
  norecipe: 'dark',
  hidden: 'dark',
}

export default function StateBadge({ status }: { status: Availability }) {
  return <CusBadge color={color[status]}>{AVAILABILITY_LABEL[status]}</CusBadge>
}
