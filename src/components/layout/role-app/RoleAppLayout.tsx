import { Navigate } from 'react-router-dom'
import { getRoleApp } from '@/const/roleApps'
import { RoleShell } from '../shared/RoleShell'

/** Единый layout мобильных рабочих мест: конфигурация берётся из `roleApps` по ключу. */
export default function RoleAppLayout({ appKey }: { appKey: string }) {
  const app = getRoleApp(appKey)
  if (!app) return <Navigate to="/unauthorized" replace />

  const nav = app.screens.map((s) => ({
    to: s.path ? `${app.base}/${s.path}` : app.base,
    label: s.label,
    icon: s.icon,
    end: s.path === '',
  }))
  return <RoleShell title={app.title} nav={nav} wide={app.wide} />
}
