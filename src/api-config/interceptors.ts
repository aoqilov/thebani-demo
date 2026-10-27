import api from './axiosInstance'
import { clearAuth, getStoredToken } from '@/widgets/features/login/hooks/authApi'

// Side-effect only: main.tsx bir marta import qiladi.
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)
