import { useState } from 'react'
import { LuUtensils } from 'react-icons/lu'
import { cn } from '@/lib/cn'

const gradients = [
  'from-amber-400 to-orange-500', 'from-sky-400 to-blue-500', 'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500', 'from-violet-400 to-purple-500', 'from-lime-400 to-green-500',
]

/** Фото с заглушкой: если картинки нет или она не загрузилась — цветной градиент с иконкой. */
export function CusImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const hash = [...alt].reduce((s, c) => s + c.charCodeAt(0), 0)

  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-linear-to-br text-white/90', gradients[hash % gradients.length], className)} aria-label={alt}>
        <LuUtensils size={28} />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn('object-cover', className)} />
}
