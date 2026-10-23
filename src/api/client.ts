import axios from 'axios'
import { env } from '@/lib/env'

/**
 * Laravel Sanctum (SPA, cookie tabanlı) ile konuşan axios örneği.
 * - withCredentials: oturum cookie'si her istekte gider
 * - withXSRFToken: Laravel'in XSRF-TOKEN cookie'sini X-XSRF-TOKEN header'ına koyar
 */
export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

/** Sanctum: login/logout gibi state değiştiren isteklerden önce CSRF cookie'sini al. */
export async function ensureCsrfCookie() {
  await http.get('/sanctum/csrf-cookie')
}

/** 401 gelirse uygulamanın geri kalanına haber ver (store bunu dinleyip çıkış yapar). */
type UnauthorizedListener = () => void
let onUnauthorized: UnauthorizedListener | null = null
export function setUnauthorizedHandler(fn: UnauthorizedListener) {
  onUnauthorized = fn
}

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

/** Laravel validation hatasından (422) ilk mesajı çıkarır. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    return firstFieldError ?? data?.message ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
