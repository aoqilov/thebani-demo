import { RoleTypes } from '@/const/constData'
import { roleApps } from '@/const/roleApps'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY ?? 'parkops_token'
const ROLE_KEY = 'parkops_role'

export function saveAuth(token: string, role: RoleTypes) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredRole(): RoleTypes | null {
  const r = localStorage.getItem(ROLE_KEY)
  return r && (Object.values(RoleTypes) as string[]).includes(r) ? (r as RoleTypes) : null
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

/** Админ-роли без доступа к дашборду начинают со своего раздела. */
const adminHome: Partial<Record<RoleTypes, string>> = {
  [RoleTypes.OWNER]: '/ops',
  [RoleTypes.DIRECTOR]: '/ops',
  [RoleTypes.ADMIN]: '/ops',
  [RoleTypes.HR]: '/employees',
  [RoleTypes.SKLAD]: '/warehouse/stock',
  [RoleTypes.PROCEDURE]: '/services/list',
}

/** Стартовая страница после входа в зависимости от роли. */
export function getRoleDefaultPath(role: RoleTypes): string {
  const app = roleApps.find((a) => a.role === role)
  return app ? app.base : (adminHome[role] ?? '/')
}
