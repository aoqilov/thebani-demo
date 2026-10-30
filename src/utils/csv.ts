/** Скачивает таблицу как CSV (разделитель «;», UTF-8 с BOM — открывается в Excel). */
export function downloadCsv(filename: string, head: string[], rows: (string | number)[][]) {
  const csv = [head, ...rows].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
