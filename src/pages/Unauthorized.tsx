import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-park-bg text-park-text">
      <p className="text-6xl font-bold text-danger">403</p>
      <p className="text-park-textMuted">У вас нет доступа к этой странице</p>
      <Link to="/login" className="mt-2 text-sm text-primary underline">Войти снова</Link>
    </div>
  )
}
