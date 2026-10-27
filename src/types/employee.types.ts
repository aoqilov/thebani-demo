import type { RoleTypes } from '@/const/constData'
import type { Pagination } from './common.types'

export type EmployeeStatus = 'active' | 'blocked' | 'vacation'

export interface ApiEmployee {
  id: number
  firstname: string
  lastname: string
  phone: string
  role: RoleTypes
  status: EmployeeStatus
}

export interface EmployeesParams {
  search?: string
  role?: RoleTypes
  page?: number
  limit?: number
}

export interface EmployeeStats {
  total: number
  active: number
  blocked: number
  vacation: number
}

export type CreateEmployeePayload = Omit<ApiEmployee, 'id'>
export type UpdateEmployeePayload = Partial<CreateEmployeePayload>

export interface EmployeesResult {
  employees: ApiEmployee[]
  pagination: Pagination
}
