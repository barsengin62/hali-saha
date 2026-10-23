/**
 * Uygulamanın kullandığı tek API yüzeyi.
 * VITE_USE_MOCK=true  → mock/handlers.ts
 * VITE_USE_MOCK=false → Laravel (Sanctum + Fortify + /api/*)
 */
import { env } from '@/lib/env'
import type {
  HighlightWithMatch,
  LeaderboardRow,
  MatchDetail,
  MatchSummary,
  Organization,
  Paginated,
  PlayerStats,
  StandingRow,
  StatType,
  User,
} from '@/types'
import { ensureCsrfCookie, http } from './client'
import { mockApi } from './mock/handlers'

/** Laravel API Resource'ları tekil kayıtları { data: ... } içinde döndürür. */
type Wrapped<T> = { data: T }

const realApi: typeof mockApi = {
  // ---------- Auth (Fortify endpoint'leri) ----------
  async login(email, password) {
    await ensureCsrfCookie()
    await http.post('/login', { email, password })
    return realApi.me()
  },
  async logout() {
    await http.post('/logout')
  },
  async me() {
    const { data } = await http.get<Wrapped<User>>('/api/user')
    return data.data
  },
  async forgotPassword(email) {
    await ensureCsrfCookie()
    await http.post('/forgot-password', { email })
  },
  async resetPassword({ token, email, password }) {
    await ensureCsrfCookie()
    await http.post('/reset-password', {
      token,
      email,
      password,
      password_confirmation: password,
    })
  },
  async updateProfile(patch) {
    const { data } = await http.put<Wrapped<User>>('/api/user/profile', patch)
    return data.data
  },
  async updateSettings(settings) {
    const { data } = await http.put<Wrapped<User>>('/api/user/settings', settings)
    return data.data
  },
  async updatePassword({ current_password, password }) {
    await http.put('/user/password', {
      current_password,
      password,
      password_confirmation: password,
    })
  },

  // ---------- Domain ----------
  async statTypes() {
    const { data } = await http.get<Wrapped<StatType[]>>('/api/stat-types')
    return data.data
  },
  async organizations() {
    const { data } = await http.get<Wrapped<Organization[]>>('/api/organizations')
    return data.data
  },
  async organization(slug) {
    const { data } = await http.get<Wrapped<Organization>>(`/api/organizations/${slug}`)
    return data.data
  },
  async matches(params = {}) {
    const { data } = await http.get<Paginated<MatchSummary>>('/api/matches', { params })
    return data
  },
  async match(id) {
    const { data } = await http.get<Wrapped<MatchDetail>>(`/api/matches/${id}`)
    return data.data
  },
  async standings(slug) {
    const { data } = await http.get<Wrapped<StandingRow[]>>(`/api/organizations/${slug}/standings`)
    return data.data
  },
  async leaderboard({ organization, stat, limit }) {
    const url = organization ? `/api/organizations/${organization}/leaderboard` : '/api/leaderboard'
    const { data } = await http.get<Wrapped<LeaderboardRow[]>>(url, { params: { stat, limit } })
    return data.data
  },
  async player(id) {
    const { data } = await http.get<Wrapped<PlayerStats>>(`/api/players/${id}`)
    return data.data
  },
  async highlights(params = {}) {
    const { data } = await http.get<Wrapped<HighlightWithMatch[]>>('/api/highlights', { params })
    return data.data
  },
}

export const api = env.useMock ? mockApi : realApi
