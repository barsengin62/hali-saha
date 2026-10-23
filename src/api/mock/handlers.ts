/**
 * Mock API: gerçek endpoint'lerle aynı imzaları taşır.
 * İstatistik hesapları (puan durumu, gol krallığı) burada yapılır —
 * Laravel'de aynı hesaplar GROUP BY sorgularıyla yapılacak.
 */
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
import { matches, organizations, players, SAMPLE_VIDEO_URL, statTypes, teams } from './data'

const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const USER_KEY = 'mock_user'

function toSummary(m: MatchDetail): MatchSummary {
  const { lineups: _l, events: _e, video: _v, highlights: _h, ...summary } = m
  return summary
}

function teamOfPlayer(playerId: number) {
  return teams[Math.floor((playerId - 1) / 6)] ?? null
}

function notFound(): never {
  throw new Error('404')
}

export const mockApi = {
  // ---------- Auth ----------
  async login(email: string, password: string): Promise<User> {
    await wait()
    if (password.length < 6) throw new Error('invalid')
    const user: User = {
      id: 1,
      name: 'Barış Engin',
      email,
      avatar_url: null,
      player_id: 1,
      settings: { locale: 'tr', theme: 'light', notify_new_match: true },
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  },
  async logout() {
    await wait(100)
    localStorage.removeItem(USER_KEY)
  },
  async me(): Promise<User> {
    await wait(150)
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) throw new Error('401')
    return JSON.parse(raw) as User
  },
  async forgotPassword(_email: string) {
    await wait()
  },
  async resetPassword(_payload: { token: string; email: string; password: string }) {
    await wait()
  },
  async updateProfile(patch: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    await wait()
    const user = { ...(await mockApi.me()), ...patch }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  },
  async updateSettings(settings: User['settings']): Promise<User> {
    await wait(150)
    const user = { ...(await mockApi.me()), settings }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  },
  async updatePassword(_payload: { current_password: string; password: string }) {
    await wait()
  },

  // ---------- Domain ----------
  async statTypes(): Promise<StatType[]> {
    await wait(100)
    return statTypes
  },

  async organizations(): Promise<Organization[]> {
    await wait()
    return organizations
  },

  async organization(slug: string): Promise<Organization> {
    await wait()
    return organizations.find((o) => o.slug === slug) ?? notFound()
  },

  async matches(params: { organization?: string; page?: number } = {}): Promise<Paginated<MatchSummary>> {
    await wait()
    const list = matches
      .filter((m) => !params.organization || m.organization.slug === params.organization)
      .slice()
      .sort((a, b) => b.played_at.localeCompare(a.played_at))
      .map(toSummary)
    return { data: list, meta: { current_page: 1, last_page: 1, total: list.length } }
  },

  async match(id: number): Promise<MatchDetail> {
    await wait()
    return matches.find((m) => m.id === id) ?? notFound()
  },

  async standings(slug: string): Promise<StandingRow[]> {
    await wait()
    const org = organizations.find((o) => o.slug === slug) ?? notFound()
    const rows = new Map<number, StandingRow>()
    for (const team of teams.filter((t) => t.organization_id === org.id)) {
      rows.set(team.id, { team, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 })
    }
    for (const m of matches) {
      if (m.organization.id !== org.id || m.home_score === null || m.away_score === null) continue
      const h = rows.get(m.home_team.id)!
      const a = rows.get(m.away_team.id)!
      h.played++; a.played++
      h.goals_for += m.home_score; h.goals_against += m.away_score
      a.goals_for += m.away_score; a.goals_against += m.home_score
      if (m.home_score > m.away_score) { h.won++; a.lost++; h.points += 3 }
      else if (m.home_score < m.away_score) { a.won++; h.lost++; a.points += 3 }
      else { h.drawn++; a.drawn++; h.points++; a.points++ }
    }
    return [...rows.values()].sort(
      (x, y) => y.points - x.points || (y.goals_for - y.goals_against) - (x.goals_for - x.goals_against),
    )
  },

  async leaderboard(params: { organization?: string; stat: string; limit?: number }): Promise<LeaderboardRow[]> {
    await wait()
    const type = statTypes.find((s) => s.key === params.stat) ?? notFound()
    const counts = new Map<number, number>()
    for (const m of matches) {
      if (params.organization && m.organization.slug !== params.organization) continue
      for (const e of m.events) {
        if (e.stat_type_id === type.id) counts.set(e.player_id, (counts.get(e.player_id) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, params.limit ?? 10)
      .map(([playerId, value]) => ({
        player: players.find((p) => p.id === playerId)!,
        team: teamOfPlayer(playerId),
        value,
      }))
  },

  async player(id: number): Promise<PlayerStats> {
    await wait()
    const player = players.find((p) => p.id === id) ?? notFound()
    const team = teamOfPlayer(id)
    const played = matches.filter(
      (m) => m.status !== 'scheduled' && (m.home_team.id === team?.id || m.away_team.id === team?.id),
    )
    const totals = statTypes.map((st) => ({
      stat_type: st,
      value: matches.reduce(
        (sum, m) => sum + m.events.filter((e) => e.player_id === id && e.stat_type_id === st.id).length,
        0,
      ),
    }))
    return {
      player,
      matches_played: played.length,
      totals,
      recent_matches: played
        .slice()
        .sort((a, b) => b.played_at.localeCompare(a.played_at))
        .slice(0, 5)
        .map(toSummary),
    }
  },

  async highlights(params: { limit?: number } = {}): Promise<HighlightWithMatch[]> {
    await wait()
    const all = matches
      .slice()
      .sort((a, b) => b.played_at.localeCompare(a.played_at))
      .flatMap((m) =>
        m.highlights.map((h) => ({ ...h, match: toSummary(m), video_url: m.video?.url ?? SAMPLE_VIDEO_URL })),
      )
    return params.limit ? all.slice(0, params.limit) : all
  },
}
