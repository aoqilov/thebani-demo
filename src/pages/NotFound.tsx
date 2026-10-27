import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-park-bg text-park-text">
      <p className="text-6xl font-bold text-primary">404</p>
      <p className="text-park-textMuted">Страница не найдена</p>
      <Link to="/" className="mt-2 text-sm text-primary underline">На главную</Link>
    </div>
  )
}
