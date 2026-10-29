/**
 * Uygulamanın kullandığı tek API yüzeyi.
 * VITE_USE_MOCK=true  → mock/handlers.ts (backend olmadan demo)
 * VITE_USE_MOCK=false → Laravel API (Sanctum token, /api/*) — halisaha-api HS-34…HS-37
 */
import { env } from '@/lib/env'
import type {
  Game,
  GameDetail,
  GameQuery,
  HighlightWithGame,
  LeaderboardRow,
  LoginResponse,
  Organization,
  Paginated,
  PlayerStats,
  StandingRow,
  StatType,
  User,
  UserSettings,
} from '@/types'
import { http, tokenStore } from './client'
import { mockApi } from './mock/handlers'

export interface ApiClient {
  // Auth
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
  me(): Promise<User>
  forgotPassword(email: string): Promise<void>
  resetPassword(payload: { token: string; email: string; password: string }): Promise<void>
  updateProfile(patch: Partial<Pick<User, 'name' | 'email'>>): Promise<User>
  updateSettings(patch: Partial<UserSettings>): Promise<User>
  updatePassword(payload: { current_password: string; password: string }): Promise<void>

  // Tanımlar ve istatistik
  statTypes(): Promise<StatType[]>
  organizations(): Promise<Organization[]>
  organization(slug: string): Promise<Organization>
  standings(slug: string): Promise<StandingRow[]>
  leaderboard(params: { stat: string; organization?: string; limit?: number }): Promise<LeaderboardRow[]>
  player(id: number): Promise<PlayerStats>
  highlights(params?: { organization?: string; per_page?: number }): Promise<Paginated<HighlightWithGame>>

  // Maçlar (bütün durumlar tek endpoint: /api/games)
  games(query?: GameQuery): Promise<Paginated<Game>>
  game(id: number): Promise<GameDetail>
  /** Takvim = planlanmış maçlar, tarih aralığında, eskiden yeniye */
  schedule(range: { from: string; to: string }): Promise<Game[]>
  registerForGame(id: number): Promise<Game>
  unregisterFromGame(id: number): Promise<Game>
}

/** Laravel API Resource'ları tekil kayıtları { data: ... } içinde döndürür. */
type Wrapped<T> = { data: T }

const realApi: ApiClient = {
  // ---------- Auth (HS-34) ----------
  async login(email, password) {
    const { data } = await http.post<LoginResponse>('/api/auth/login', { email, password, device_name: navigator.userAgent.slice(0, 255) })
    tokenStore.set(data.token)
    return data.user
  },
  async logout() {
    try {
      await http.post('/api/auth/logout')
    } finally {
      tokenStore.clear()
    }
  },
  async me() {
    if (!tokenStore.get()) throw new Error('401')
    const { data } = await http.get<Wrapped<User>>('/api/user')
    return data.data
  },
  async forgotPassword(email) {
    await http.post('/api/auth/forgot-password', { email })
  },
  async resetPassword({ token, email, password }) {
    await http.post('/api/auth/reset-password', { token, email, password, password_confirmation: password })
  },
  async updateProfile(patch) {
    const { data } = await http.patch<Wrapped<User>>('/api/user', patch)
    return data.data
  },
  async updateSettings(patch) {
    const { data } = await http.patch<Wrapped<User>>('/api/user/settings', patch)
    return data.data
  },
  async updatePassword({ current_password, password }) {
    await http.put('/api/user/password', { current_password, password, password_confirmation: password })
  },

  // ---------- Okuma (HS-36) ----------
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
  async standings(slug) {
    const { data } = await http.get<Wrapped<StandingRow[]>>(`/api/organizations/${slug}/standings`)
    return data.data
  },
  async leaderboard(params) {
    const { data } = await http.get<Wrapped<LeaderboardRow[]>>('/api/leaderboard', { params })
    return data.data
  },
  async player(id) {
    const { data } = await http.get<Wrapped<PlayerStats>>(`/api/players/${id}`)
    return data.data
  },
  async highlights(params = {}) {
    const { data } = await http.get<Paginated<HighlightWithGame>>('/api/highlights', { params })
    return data
  },
  async games(query = {}) {
    const { data } = await http.get<Paginated<Game>>('/api/games', { params: query })
    return data
  },
  async game(id) {
    const { data } = await http.get<Wrapped<GameDetail>>(`/api/games/${id}`)
    return data.data
  },

  // ---------- Takvim ve kayıt (HS-37) ----------
  async schedule({ from, to }) {
    const page = await realApi.games({ status: ['scheduled'], from, to, sort: 'starts_at', per_page: 50 })
    return page.data
  },
  async registerForGame(id) {
    const { data } = await http.post<Wrapped<Game>>(`/api/games/${id}/registration`)
    return data.data
  },
  async unregisterFromGame(id) {
    const { data } = await http.delete<Wrapped<Game>>(`/api/games/${id}/registration`)
    return data.data
  },
}

export const api: ApiClient = env.useMock ? mockApi : realApi
