import { READ_ONLY_ROLES, type RoleTypes } from '@/const/constData'
import { getStoredRole } from '@/widgets/features/login/hooks/authApi'

export function useHasRole(...roles: RoleTypes[]) {
  const role = getStoredRole()
  return role !== null && roles.includes(role)
}

/** Director / owner faqat ko'ra oladi. */
export function useIsReadOnly() {
  const role = getStoredRole()
  return role !== null && READ_ONLY_ROLES.includes(role)
}
