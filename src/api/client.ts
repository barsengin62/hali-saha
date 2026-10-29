import axios from 'axios'
import i18n from '@/i18n'
import { env } from '@/lib/env'

/**
 * Laravel Sanctum token (Bearer) ile konuşan axios örneği (HS-34).
 * - Token localStorage'da; her istekte Authorization başlığı eklenir
 * - Accept-Language: giriş yapılmadan önce de API mesajları seçili dilde gelir
 */
const TOKEN_KEY = 'auth_token'

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* tarayıcı depolamayı engellediyse oturum sadece bu sayfada kalır */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* yok say */
    }
  },
}

export const http = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Accept-Language'] = i18n.language
  return config
})

/** 401 gelirse token silinir ve uygulamanın geri kalanına haber verilir (store çıkış yapar). */
type UnauthorizedListener = () => void
let onUnauthorized: UnauthorizedListener | null = null
export function setUnauthorizedHandler(fn: UnauthorizedListener) {
  onUnauthorized = fn
}

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      tokenStore.clear()
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

/** Laravel doğrulama / iş kuralı hatasından (422) ilk mesajı çıkarır. */
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
