import { cn } from '@/lib/cn'

export function CusAvatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size }} className={cn('rounded-full object-cover', className)} />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary', className)}
    >
      {initials}
    </span>
  )
}
