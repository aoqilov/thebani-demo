import { delay, mockEmployees } from '@/data/mock'
import type { ApiEmployee, CreateEmployeePayload, EmployeeStats, EmployeesParams, EmployeesResult } from '@/types/employee.types'

// TODO: когда появится backend, заменить на api.get('/employees', { params })
// (import api from '@/api-config/axiosInstance').
let store: ApiEmployee[] = [...mockEmployees]

export async function fetchEmployees(params: EmployeesParams = {}): Promise<EmployeesResult> {
  const q = params.search?.toLowerCase()
  const list = store.filter((e) => (!params.role || e.role === params.role) && (!q || `${e.firstname} ${e.lastname} ${e.phone}`.toLowerCase().includes(q)))
  return delay({ employees: list, pagination: { page: 1, limit: list.length, total: list.length } })
}

export async function fetchEmployeeStats(): Promise<EmployeeStats> {
  return delay({
    total: store.length,
    active: store.filter((e) => e.status === 'active').length,
    blocked: store.filter((e) => e.status === 'blocked').length,
    vacation: store.filter((e) => e.status === 'vacation').length,
  })
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<void> {
  store = [{ ...payload, id: Math.max(0, ...store.map((e) => e.id)) + 1 }, ...store]
  await delay(null)
}

export async function deleteEmployees(ids: number[]): Promise<void> {
  store = store.filter((e) => !ids.includes(e.id))
  await delay(null)
}
