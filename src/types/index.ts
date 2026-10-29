/**
 * Laravel API Resource'larıyla birebir aynı tipler (halisaha-api/app/Http/Resources).
 * Backend isimlendirmesi esas: game (maç), starts_at, pitch → venue.
 */

export type Position = 'GK' | 'DF' | 'MF' | 'FW'
export type Foot = 'right' | 'left' | 'both'
/** lineups_set: kadrolar oluşturuldu (HS-44); kayıt ve kayıttan çıkma kapalı */
export type GameStatus = 'scheduled' | 'lineups_set' | 'played' | 'analyzed'
export type OrganizationType = 'league' | 'tournament' | 'random'

// ---------- Kullanıcı (UserResource) ----------

export interface User {
  id: number
  name: string
  email: string
  avatar_url: string | null
  player_id: number | null
  settings: UserSettings
}

export interface UserSettings {
  locale: string
  theme: 'light' | 'dark'
  notify_new_match: boolean
}

/** POST /api/auth/login */
export interface LoginResponse {
  token: string
  token_type: 'Bearer'
  expires_at: string
  user: User
}

// ---------- Tanımlar ----------

export interface Player {
  id: number
  nickname: string
  full_name: string
  position: Position
  position_number: number | null
  preferred_foot: Foot
  avatar_url: string | null
}

/** Takım birden fazla organizasyonda olabilir; organizasyon bilgisi takımda tutulmaz */
export interface Team {
  id: number
  name: string
  color: string // hex — forma rengi
}

export interface Organization {
  id: number
  slug: string
  name: string
  type: OrganizationType
  description: string | null
  logo_url: string | null
  /** Sadece GET /api/organizations/{slug} */
  teams?: Team[]
}

/** Dinamik istatistik türü: gol, asist, kurtarış, sarı kart… Admin panelden eklenir. Sadece görünür türler gelir. */
export interface StatType {
  id: number
  slug: string
  name: string
  icon: string | null // emoji
  color: string
}

export interface Venue {
  id: number
  name: string
  address: string | null
}

export interface Pitch {
  id: number
  name: string
  is_indoor: boolean
  surface: string | null
  venue: Venue
}

// ---------- Maç (GameResource / GameDetailResource) ----------

/** Takvim kartı için kayıt durumu (giriş yapmış kullanıcıya göre) */
/** HS-42: kayıt talebinin durumu; kontenjanı sadece onaylananlar doldurur */
export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

/** GameResource.registration (HS-37 / HS-42) */
export interface GameRegistration {
  /** Onaylanmış kayıt sayısı */
  count: number
  capacity: number
  spots_left: number
  /** Kullanıcının talebi; talep yoksa null */
  request_status: RegistrationStatus | null
  /** Kayıt şu an açık mı (planlandı, başlamadı, yer var) */
  is_open: boolean
  /** Talep gönderebilir mi: kayıt açık ve talebi yok ya da reddedilmiş */
  can_request: boolean
  /** Talebini geri çekebilir mi: bekleyen / onaylı talep, maç planlandı ve başlamadı */
  can_withdraw: boolean
}

/** POST /api/games/{id}/registration gövdesi; ikisi de isteğe bağlı (null = fark etmez) */
export interface RegistrationRequest {
  team_id?: number | null
  position?: Position | null
}

export interface Game {
  id: number
  status: GameStatus
  starts_at: string // ISO tarih-saat
  duration_min: number
  /** Takım başına oyuncu sayısı: 7 → 7v7 */
  format: number
  capacity: number
  organization: Pick<Organization, 'id' | 'slug' | 'name'>
  pitch: Pitch
  /** Takımlar henüz belli değilse null — "Belirlenecek" gösterilir */
  home_team: Team | null
  away_team: Team | null
  home_score: number | null
  away_score: number | null
  /** /api/games ve kayıt cevaplarında var; iç içe maçlarda (highlight, oyuncu) yok */
  registration?: GameRegistration
}

export interface GameEvent {
  id: number
  game_id: number
  player_id: number
  team_id: number
  stat_type_id: number
  minute: number | null
  video_time_sec: number | null
  related_event_id: number | null // gol ↔ asist bağlantısı
}

export interface GameVideo {
  id: number
  provider: 'file' | 'youtube'
  /** YouTube'da kaydedilen link, dosyada oynatılabilir adres */
  url: string
  youtube_id: string | null
  thumbnail_url: string | null
  duration_sec: number | null
}

/** Kadrodaki oyuncu + bu maçtaki pozisyonu ve sahadaki yeri (% olarak) */
export interface LineupPlayer extends Player {
  pitch: { position: Position | null; x: number | null; y: number | null }
}

export interface Highlight {
  id: number
  game_id: number
  game_event_id: number | null
  title: string
  start_sec: number
  end_sec: number
  thumbnail_url: string | null
}

/** GET /api/highlights: maç ve video bilgisiyle */
export interface HighlightWithGame extends Highlight {
  game: Game
  video: GameVideo | null
}

export interface GameDetail extends Game {
  lineups: { team_id: number; players: LineupPlayer[] }[]
  events: GameEvent[]
  video: GameVideo | null
  highlights: Highlight[]
}

// ---------- İstatistik ----------

export interface StandingRow {
  rank: number
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

export interface LeaderboardRow {
  rank: number
  player: Player
  /** Seçilen kapsamda en son oynadığı takım */
  team: Team | null
  value: number
}

export interface PlayerStats {
  player: Player
  games_played: number
  totals: { stat_type: StatType; value: number }[]
  recent_games: Game[]
}

// ---------- Ortak ----------

/** Laravel sayfalama biçimi (Resource collection + paginate) */
export interface Paginated<T> {
  data: T[]
  links: { first: string | null; last: string | null; prev: string | null; next: string | null }
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

/** GET /api/games filtreleri */
export interface GameQuery {
  status?: GameStatus[]
  organization?: string
  from?: string // YYYY-MM-DD
  to?: string
  sort?: 'starts_at' | '-starts_at'
  page?: number
  per_page?: number
}
