import { useRef, useState } from 'react'
import { LuImagePlus, LuTrash2 } from 'react-icons/lu'
import { CusButton } from '../buttons/CusButton'
import { CusImage } from './CusImage'

const MAX_SIDE = 480

/** Загружает файл и уменьшает до 480px (JPEG), чтобы не раздувать localStorage. */
function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * k)
      canvas.height = Math.round(img.height * k)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось прочитать изображение.')) }
    img.src = url
  })
}

export function CusImagePicker({ value, name, onChange }: { value?: string; name: string; onChange: (v: string | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function pick(file?: File) {
    if (!file) return
    setError(null)
    try {
      onChange(await resize(file))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <CusImage src={value} alt={name || 'Фото'} className="h-24 w-32 shrink-0 rounded-lg" />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <CusButton size="sm" variant="outline" leftIcon={<LuImagePlus size={14} />} onClick={() => input.current?.click()}>Загрузить фото</CusButton>
          {value && <CusButton size="sm" variant="ghost" color="danger" leftIcon={<LuTrash2 size={14} />} onClick={() => onChange(undefined)}>Убрать</CusButton>}
        </div>
        <p className="text-xs text-park-textMuted">JPG или PNG. Фото автоматически уменьшается до 480px.</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}
