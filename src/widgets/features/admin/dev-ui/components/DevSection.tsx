import type { ReactNode } from 'react'
import { CusCard, CusCardHeader } from '@/components/shared/card/CusCard'

/** Один блок превью: заголовок + имя компонента + содержимое. */
export default function DevSection({ title, name, children }: { title: string; name: string; children: ReactNode }) {
  return (
    <CusCard>
      <CusCardHeader title={title} subtitle={<code className="text-primary">{name}</code>} />
      <div className="p-5">{children}</div>
    </CusCard>
  )
}
