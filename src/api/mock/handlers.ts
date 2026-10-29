/**
 * Mock API: gerçek API ile aynı arayüz (ApiClient) ve aynı JSON yapıları.
 * İstatistik hesapları (puan durumu, krallık) burada basitçe yapılır;
 * Laravel'de aynı hesaplar app/Services altında (HS-36).
 */
import type { ApiClient } from '@/api'
import type {
  Game,
  GameDetail,
  HighlightWithGame,
  LeaderboardRow,
  Paginated,
  StandingRow,
  User,
} from '@/types'
import { games, lineupOf, organizations, organizationTeams, players, SAMPLE_VIDEO_URL, statTypes, teams } from './data'
import { isChangeable, myRequest, scheduledGames, setRequest, withRegistration } from './schedule'

const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const USER_KEY = 'mock_user'

function toSummary(g: GameDetail): Game {
  const { lineups: _l, events: _e, video: _v, highlights: _h, ...summary } = g
  return summary
}

function teamOfPlayer(playerId: number) {
  return teams[Math.floor((playerId - 1) / 6)] ?? null
}

function notFound(): never {
  throw new Error('404')
}

/** Backend'deki 422 doğrulama hatası gibi (getErrorMessage bunu okur) */
function unprocessable(field: string, message: string): never {
  throw Object.assign(new Error(message), { response: { status: 422, data: { message, errors: { [field]: [message] } } } })
}

function paginate<T>(list: T[], page = 1, perPage = 15): Paginated<T> {
  const lastPage = Math.max(1, Math.ceil(list.length / perPage))
  return {
    data: list.slice((page - 1) * perPage, page * perPage),
    links: { first: null, last: null, prev: null, next: null },
    meta: { current_page: page, last_page: lastPage, per_page: perPage, total: list.length },
  }
}

/** Takvimdeki planlanmış maçlar + sonuçlanmış maçlar = /api/games */
function allGames(): Game[] {
  return [...games.map(toSummary), ...scheduledGames.map(withRegistration)]
}

export const mockApi: ApiClient = {
  // ---------- Auth ----------
  async login(email, password) {
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
  async me() {
    await wait(150)
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) throw new Error('401')
    return JSON.parse(raw) as User
  },
  async forgotPassword() {
    await wait()
  },
  async resetPassword() {
    await wait()
  },
  async updateProfile(patch) {
    await wait()
    const user = { ...(await mockApi.me()), ...patch }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  },
  async updateSettings(patch) {
    await wait(150)
    const current = await mockApi.me()
    const user = { ...current, settings: { ...current.settings, ...patch } }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return user
  },
  async updatePassword() {
    await wait()
  },

  // ---------- Tanımlar ve istatistik ----------
  async statTypes() {
    await wait(100)
    return statTypes
  },

  async organizations() {
    await wait()
    return organizations
  },

  async organization(slug) {
    await wait()
    const org = organizations.find((o) => o.slug === slug) ?? notFound()
    return { ...org, teams: teams.filter((t) => organizationTeams[org.id]?.includes(t.id)) }
  },

  async standings(slug) {
    await wait()
    const org = organizations.find((o) => o.slug === slug) ?? notFound()
    const rows = new Map<number, Omit<StandingRow, 'rank' | 'goal_difference'>>()
    for (const team of teams.filter((t) => organizationTeams[org.id]?.includes(t.id))) {
      rows.set(team.id, { team, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 })
    }
    for (const g of games) {
      if (g.organization.id !== org.id || g.home_score === null || g.away_score === null || !g.home_team || !g.away_team) continue
      const h = rows.get(g.home_team.id)
      const a = rows.get(g.away_team.id)
      if (!h || !a) continue
      h.played++; a.played++
      h.goals_for += g.home_score; h.goals_against += g.away_score
      a.goals_for += g.away_score; a.goals_against += g.home_score
      if (g.home_score > g.away_score) { h.won++; a.lost++; h.points += 3 }
      else if (g.home_score < g.away_score) { a.won++; h.lost++; a.points += 3 }
      else { h.drawn++; a.drawn++; h.points++; a.points++ }
    }
    return [...rows.values()]
      .map((r) => ({ ...r, goal_difference: r.goals_for - r.goals_against }))
      .sort((x, y) => y.points - x.points || y.goal_difference - x.goal_difference || y.goals_for - x.goals_for)
      .map((r, i) => ({ ...r, rank: i + 1 }))
  },

  async leaderboard({ organization, stat, limit }) {
    await wait()
    const type = statTypes.find((s) => s.slug === stat) ?? notFound()
    const counts = new Map<number, number>()
    for (const g of games) {
      if (organization && g.organization.slug !== organization) continue
      for (const e of g.events) {
        if (e.stat_type_id === type.id) counts.set(e.player_id, (counts.get(e.player_id) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit ?? 10)
      .map(([playerId, value], i): LeaderboardRow => ({
        rank: i + 1,
        player: players.find((p) => p.id === playerId)!,
        team: teamOfPlayer(playerId),
        value,
      }))
  },

  async player(id) {
    await wait()
    const player = players.find((p) => p.id === id) ?? notFound()
    const played = games.filter(
      (g) => g.status !== 'scheduled' && g.lineups.some((l) => l.players.some((p) => p.id === id)),
    )
    const totals = statTypes.map((st) => ({
      stat_type: st,
      value: games.reduce(
        (sum, g) => sum + g.events.filter((e) => e.player_id === id && e.stat_type_id === st.id).length,
        0,
      ),
    }))
    return {
      player,
      games_played: played.length,
      totals,
      recent_games: played
        .slice()
        .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
        .slice(0, 5)
        .map(toSummary),
    }
  },

  async highlights(params = {}) {
    await wait()
    const all = games
      .filter((g) => !params.organization || g.organization.slug === params.organization)
      .slice()
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
      .flatMap((g) =>
        g.highlights.map(
          (h): HighlightWithGame => ({
            ...h,
            game: toSummary(g),
            video: g.video ?? {
              id: 0, provider: 'file', url: SAMPLE_VIDEO_URL, youtube_id: null, thumbnail_url: null, duration_sec: null,
            },
          }),
        ),
      )
    return paginate(all, 1, params.per_page ?? 12)
  },

  // ---------- Maçlar ----------
  async games(query = {}) {
    await wait()
    const from = query.from ? new Date(`${query.from}T00:00:00`).getTime() : -Infinity
    const to = query.to ? new Date(`${query.to}T23:59:59`).getTime() : Infinity
    const list = allGames()
      .filter((g) => !query.status?.length || query.status.includes(g.status))
      .filter((g) => !query.organization || g.organization.slug === query.organization)
      .filter((g) => {
        const t = new Date(g.starts_at).getTime()
        return t >= from && t <= to
      })
      .sort((a, b) =>
        query.sort === 'starts_at' ? a.starts_at.localeCompare(b.starts_at) : b.starts_at.localeCompare(a.starts_at),
      )
    return paginate(list, query.page ?? 1, query.per_page ?? 15)
  },

  async game(id) {
    await wait()
    const detail = games.find((g) => g.id === id)
    if (detail) return detail
    const scheduled = scheduledGames.find((g) => g.id === id) ?? notFound()
    // HS-40: kadroları oluşturulmuş maçta takım kadrolarından varsayılan diziliş
    const lineups =
      scheduled.status === 'lineups_set' && scheduled.home_team && scheduled.away_team
        ? [
            { team_id: scheduled.home_team.id, players: lineupOf(scheduled.home_team.id, 'home') },
            { team_id: scheduled.away_team.id, players: lineupOf(scheduled.away_team.id, 'away') },
          ]
        : []
    return { ...withRegistration(scheduled), lineups, events: [], video: null, highlights: [] }
  },

  // ---------- Takvim ve kayıt ----------
  async schedule({ from, to }) {
    const page = await mockApi.games({ status: ['scheduled', 'lineups_set'], from, to, sort: 'starts_at', per_page: 50 })
    return page.data
  },

  // HS-42: talep "bekliyor" ile başlar; reddedilen talep tekrar gönderilebilir (tercihler mock'ta saklanmaz)
  async requestGame(id) {
    await wait(250)
    const game = scheduledGames.find((g) => g.id === id) ?? notFound()
    const mine = myRequest(id)
    if (mine === 'pending' || mine === 'approved') return withRegistration(game)
    if (game.status === 'lineups_set') unprocessable('registration', 'Kadrolar oluşturuldu; kayıt değiştirilemez.')
    if (!isChangeable(game)) unprocessable('registration', 'Maç başladı; kayıt değiştirilemez.')
    if (withRegistration(game).registration!.spots_left === 0) unprocessable('registration', 'Kontenjan dolu.')
    setRequest(id, 'pending')
    return withRegistration(game)
  },

  async withdrawFromGame(id) {
    await wait(250)
    const game = scheduledGames.find((g) => g.id === id) ?? notFound()
    const mine = myRequest(id)
    if (mine === null) return withRegistration(game)
    if (mine !== 'rejected') {
      if (game.status === 'lineups_set') unprocessable('registration', 'Kadrolar oluşturuldu; kayıt değiştirilemez.')
      if (!isChangeable(game)) unprocessable('registration', 'Maç başladı; kayıt değiştirilemez.')
    }
    setRequest(id, null)
    return withRegistration(game)
  },
}
