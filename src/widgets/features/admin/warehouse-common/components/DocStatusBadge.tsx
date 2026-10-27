import { CusBadge } from '@/components/ui/badge/CusBadge'
import type { DocStatus } from '@/types/warehouse.types'

export default function DocStatusBadge({ status }: { status: DocStatus }) {
  return status === 'posted' ? <CusBadge color="success">Проведён</CusBadge> : <CusBadge color="warning">Черновик</CusBadge>
}
