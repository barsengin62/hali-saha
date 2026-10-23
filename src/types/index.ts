/**
 * Laravel tarafındaki tablolarla birebir eşleşen tipler.
 * API Resource'lar bu şekilde JSON döndürmeli.
 */

export type Position = 'GK' | 'DF' | 'MF' | 'FW'
export type Foot = 'right' | 'left' | 'both'
export type MatchStatus = 'scheduled' | 'played' | 'analyzed'

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

export interface Player {
  id: number
  nickname: string
  full_name: string
  position: Position
  preferred_foot: Foot
  avatar_url: string | null
}

export interface Organization {
  id: number
  slug: string
  name: string
  description: string
  logo_url: string | null
}

export interface Team {
  id: number
  organization_id: number
  name: string
  color: string // hex — forma rengi
}

/** Dinamik istatistik türü: gol, asist, kurtarış, sarı kart… Admin panelden eklenir. */
export interface StatType {
  id: number
  key: string
  name: string
  icon: string // emoji veya ikon adı
  color: string
  is_visible: boolean
}

export interface MatchEvent {
  id: number
  match_id: number
  player_id: number
  team_id: number
  stat_type_id: number
  minute: number
  video_time_sec: number
  related_event_id: number | null // gol → asist bağlantısı
}

export interface MatchVideo {
  id: number
  match_id: number
  provider: 'file' | 'youtube' | 'bunny'
  url: string
  duration_sec: number
}

export interface Highlight {
  id: number
  match_id: number
  match_event_id: number | null
  title: string
  start_sec: number
  end_sec: number
  thumbnail_url: string | null
}

export interface MatchSummary {
  id: number
  organization: Pick<Organization, 'id' | 'slug' | 'name'>
  venue: string
  played_at: string
  status: MatchStatus
  home_team: Team
  away_team: Team
  home_score: number | null
  away_score: number | null
}

export interface MatchDetail extends MatchSummary {
  lineups: { team_id: number; players: Player[] }[]
  events: MatchEvent[]
  video: MatchVideo | null
  highlights: Highlight[]
}

export interface StandingRow {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}

export interface LeaderboardRow {
  player: Player
  team: Team | null
  value: number
}

export interface PlayerStats {
  player: Player
  matches_played: number
  totals: { stat_type: StatType; value: number }[]
  recent_matches: MatchSummary[]
}

export interface HighlightWithMatch extends Highlight {
  match: MatchSummary
  video_url: string
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number }
}
