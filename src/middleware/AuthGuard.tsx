import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { RoleTypes } from '@/const/constData'
import { getStoredRole, getStoredToken } from '@/widgets/features/login/hooks/authApi'

export function AuthGuard({ children, roles }: { children: ReactNode; roles?: RoleTypes[] }) {
  const location = useLocation()
  const token = getStoredToken()
  const role = getStoredRole()

  if (!token || !role) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(role)) return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
