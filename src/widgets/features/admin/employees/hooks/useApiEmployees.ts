import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEmployee, deleteEmployees, fetchEmployees, fetchEmployeeStats } from '@/api/employees/employees.api'
import type { EmployeesParams } from '@/types/employee.types'

export const EMPLOYEE_KEYS = {
  all: ['employees'] as const,
  list: (params: EmployeesParams) => ['employees', params] as const,
  stats: ['employee-stats'] as const,
}

export function useEmployees(params: EmployeesParams = {}) {
  return useQuery({ queryKey: EMPLOYEE_KEYS.list(params), queryFn: () => fetchEmployees(params) })
}

export function useEmployeeStats() {
  return useQuery({ queryKey: EMPLOYEE_KEYS.stats, queryFn: fetchEmployeeStats })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => Promise.all([qc.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all }), qc.invalidateQueries({ queryKey: EMPLOYEE_KEYS.stats })])
}

export function useCreateEmployee() {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: createEmployee, onSuccess: invalidate })
}

export function useDeleteEmployees() {
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: deleteEmployees, onSuccess: invalidate })
}
