/**
 * Backend olmadan çalışabilmek için sahte veri.
 * Laravel'deki seeder'larla aynı mantığı izler; VITE_USE_MOCK=false olunca hiç kullanılmaz.
 */
import type {
  GameDetail,
  GameEvent,
  GameVideo,
  Highlight,
  LineupPlayer,
  Organization,
  Pitch,
  Player,
  Position,
  StatType,
  Team,
} from '@/types'
import { YOUTUBE_VIDEOS, youtubeId, youtubeThumbnail } from './videos'

// Açık lisanslı örnek video (CC BY). videos.ts boşsa bu kullanılır.
export const SAMPLE_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
const SAMPLE_VIDEO_DURATION = 596

/** Geçerli YouTube linkleri (bozuk linkler sessizce atlanır) */
const youtubeSources = YOUTUBE_VIDEOS.flatMap((v) => {
  const vid = youtubeId(v.url)
  return vid ? [{ id: vid, duration: Math.max(60, v.durationSec) }] : []
})

/** N. analiz edilmiş maça hangi video düşüyor? YouTube varsa sırayla, yoksa örnek mp4. */
function videoSource(index: number): { provider: GameVideo['provider']; url: string; duration: number; thumbnail: string | null } {
  if (youtubeSources.length > 0) {
    const yt = youtubeSources[index % youtubeSources.length]
    return { provider: 'youtube', url: yt.id, duration: yt.duration, thumbnail: youtubeThumbnail(yt.id) }
  }
  return { provider: 'file', url: SAMPLE_VIDEO_URL, duration: SAMPLE_VIDEO_DURATION, thumbnail: null }
}

// Slug'lar backend'deki StatTypeSeeder ile aynı
export const statTypes: StatType[] = [
  { id: 1, slug: 'goal', name: 'Gol', icon: '⚽', color: '#16a34a' },
  { id: 2, slug: 'assist', name: 'Asist', icon: '👟', color: '#0284c7' },
  { id: 3, slug: 'save', name: 'Kurtarış', icon: '🧤', color: '#9333ea' },
  { id: 4, slug: 'yellow-card', name: 'Sarı kart', icon: '🟨', color: '#ca8a04' },
  { id: 5, slug: 'own-goal', name: 'Kendi kalesine', icon: '🙈', color: '#dc2626' },
]

export const organizations: Organization[] = [
  {
    id: 1,
    slug: 'favoriten-carsamba-ligi',
    name: 'Favoriten Çarşamba Ligi',
    type: 'league',
    description: 'Her çarşamba akşamı 7v7, sezon boyu puan usulü.',
    logo_url: null,
  },
  {
    id: 2,
    slug: 'donaustadt-cup',
    name: 'Donaustadt Cup',
    type: 'tournament',
    description: 'Aylık eleme usulü turnuva.',
    logo_url: null,
  },
]

export const teams: Team[] = [
  { id: 1, name: 'Yeşil Şimşekler', color: '#16a34a' },
  { id: 2, name: 'Kırmızı Kartallar', color: '#dc2626' },
  { id: 3, name: 'Mavi Dalga', color: '#2563eb' },
  { id: 4, name: 'Sarı Arılar', color: '#eab308' },
]

/** organization_team (çoka çok): organizasyon id → takım id'leri */
export const organizationTeams: Record<number, number[]> = {
  1: [1, 2, 3, 4],
  2: [1, 3],
}

export const venues = [
  { id: 1, name: 'Sportzentrum Favoriten', address: 'Favoritenstraße 120, 1100 Wien' },
  { id: 2, name: 'Arena Donaustadt', address: 'Wagramer Str. 200, 1220 Wien' },
  { id: 3, name: 'Soccer Dome Ottakring', address: 'Thaliastraße 85, 1160 Wien' },
]

export const pitches: Pitch[] = [
  { id: 1, name: 'Saha 2', is_indoor: false, surface: 'Suni çim', venue: venues[0] },
  { id: 2, name: 'Kapalı saha', is_indoor: true, surface: 'Parke', venue: venues[1] },
  { id: 3, name: 'Saha 1', is_indoor: true, surface: 'Suni çim', venue: venues[2] },
]

const names: [string, string][] = [
  ['Barış Engin', 'Barış'], ['Emre Kaya', 'Kaptan'], ['Mert Aydın', 'Mert'],
  ['Can Öztürk', 'Canavar'], ['Burak Şahin', 'Burak'], ['Onur Yılmaz', 'Onur'],
  ['Lukas Huber', 'Luki'], ['Selim Demir', 'Selo'], ['Kerem Arslan', 'Kerem'],
  ['Tobias Wagner', 'Tobi'], ['Hakan Çelik', 'Hoca'], ['Volkan Koç', 'Volki'],
  ['Deniz Polat', 'Deniz'], ['Florian Bauer', 'Flo'], ['Serkan Aksoy', 'Serko'],
  ['Murat Kılıç', 'Murat'], ['Ali Yıldız', 'Ali'], ['Jakob Gruber', 'Jakob'],
  ['Eren Doğan', 'Eren'], ['Tolga Kurt', 'Tolga'], ['Stefan Pichler', 'Steff'],
  ['Kaan Özkan', 'Kaan'], ['Umut Erdem', 'Umut'], ['David Moser', 'Dave'],
]
const positionsPerTeam: Position[] = ['GK', 'DF', 'DF', 'MF', 'MF', 'FW']
// Forma pozisyonu (1 kaleci, 4/5 stoper, 8/10 orta saha, 9 santrfor) ve sahadaki yer (% olarak, ev sahibi solda)
const numbersPerTeam = [1, 4, 5, 8, 10, 9]
const spotsPerTeam: [number, number][] = [[6, 50], [18, 30], [18, 70], [30, 35], [30, 65], [42, 50]]

export const players: Player[] = names.map(([full_name, nickname], i) => ({
  id: i + 1,
  full_name,
  nickname,
  position: positionsPerTeam[i % 6],
  position_number: numbersPerTeam[i % 6],
  preferred_foot: i % 5 === 0 ? 'left' : i % 7 === 0 ? 'both' : 'right',
  avatar_url: null,
}))

/** Takım id'sine göre kadro (her takımda 6 oyuncu). */
export function rosterOf(teamId: number): Player[] {
  const start = (teamId - 1) * 6
  return players.slice(start, start + 6)
}

/** Maç kadrosu: oyuncu + bu maçtaki pozisyonu ve sahadaki yeri (deplasman sağ yarıda) */
export function lineupOf(teamId: number, side: 'home' | 'away'): LineupPlayer[] {
  return rosterOf(teamId).map((p, i) => {
    const [x, y] = spotsPerTeam[i]
    return { ...p, pitch: { position: p.position, x: side === 'home' ? x : 100 - x, y } }
  })
}

// Basit, tekrarlanabilir rastgele sayı üreteci — her yenilemede aynı veri gelsin.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const fixtures: [number, number][] = [
  [1, 2], [3, 4], [1, 3], [2, 4], [1, 4], [2, 3], [2, 1], [4, 3],
]

let eventId = 1
let highlightId = 1

function buildGame(id: number, home: number, away: number): GameDetail {
  const rand = seeded(id * 101)
  const startsAt = new Date(Date.UTC(2026, 8, 2 + (id - 1) * 7, 17, 30)).toISOString()
  const isUpcoming = id === fixtures.length
  const isAnalyzed = !isUpcoming && id !== fixtures.length - 1
  const source = videoSource(id - 1)
  // Maç dakikasını (0–60) videonun içindeki saniyeye çevir
  const toVideoTime = (minute: number) => Math.floor((minute / 60) * Math.max(30, source.duration - 20))

  const events: GameEvent[] = []
  const highlights: Highlight[] = []
  let homeScore = 0
  let awayScore = 0

  if (!isUpcoming) {
    const goals = 3 + Math.floor(rand() * 7)
    for (let g = 0; g < goals; g++) {
      const teamId = rand() > 0.5 ? home : away
      const roster = rosterOf(teamId).filter((p) => p.position !== 'GK')
      const scorer = roster[Math.floor(rand() * roster.length)]
      const minute = Math.max(1, Math.min(60, Math.floor(((g + rand()) / goals) * 60)))
      const videoTime = toVideoTime(minute)
      if (teamId === home) homeScore++
      else awayScore++

      if (!isAnalyzed) continue // "played" maçlarda sadece skor var, analiz yok

      const goal: GameEvent = {
        id: eventId++, game_id: id, player_id: scorer.id, team_id: teamId,
        stat_type_id: 1, minute, video_time_sec: videoTime, related_event_id: null,
      }
      events.push(goal)

      if (rand() > 0.35) {
        const assisters = roster.filter((p) => p.id !== scorer.id)
        const assister = assisters[Math.floor(rand() * assisters.length)]
        events.push({
          id: eventId++, game_id: id, player_id: assister.id, team_id: teamId,
          stat_type_id: 2, minute, video_time_sec: videoTime, related_event_id: goal.id,
        })
      }

      if (g % 2 === 0) {
        highlights.push({
          id: highlightId++, game_id: id, game_event_id: goal.id,
          title: `${minute}' ${scorer.nickname}`,
          start_sec: Math.max(0, videoTime - 6), end_sec: videoTime + 6,
          thumbnail_url: source.thumbnail,
        })
      }
    }

    if (isAnalyzed) {
      // Birkaç kurtarış ve kart
      for (const teamId of [home, away]) {
        const gk = rosterOf(teamId)[0]
        const saves = 1 + Math.floor(rand() * 4)
        for (let s = 0; s < saves; s++) {
          const minute = 1 + Math.floor(rand() * 59)
          events.push({
            id: eventId++, game_id: id, player_id: gk.id, team_id: teamId, stat_type_id: 3,
            minute, video_time_sec: toVideoTime(minute),
            related_event_id: null,
          })
        }
      }
      if (rand() > 0.5) {
        const p = rosterOf(home)[1]
        events.push({
          id: eventId++, game_id: id, player_id: p.id, team_id: home, stat_type_id: 4,
          minute: 38, video_time_sec: toVideoTime(38), related_event_id: null,
        })
      }
      events.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || a.stat_type_id - b.stat_type_id)
    }
  }

  const org = organizations[0]
  return {
    id,
    organization: { id: org.id, slug: org.slug, name: org.name },
    pitch: pitches[0],
    starts_at: startsAt,
    duration_min: 60,
    format: 6,
    capacity: 12,
    status: isUpcoming ? 'scheduled' : isAnalyzed ? 'analyzed' : 'played',
    home_team: teams[home - 1],
    away_team: teams[away - 1],
    home_score: isUpcoming ? null : homeScore,
    away_score: isUpcoming ? null : awayScore,
    lineups: [
      { team_id: home, players: lineupOf(home, 'home') },
      { team_id: away, players: lineupOf(away, 'away') },
    ],
    events,
    video: isAnalyzed
      ? {
          id,
          provider: source.provider,
          url: source.url,
          youtube_id: source.provider === 'youtube' ? source.url : null,
          thumbnail_url: source.thumbnail,
          duration_sec: source.duration,
        }
      : null,
    highlights,
  }
}

export const games: GameDetail[] = fixtures.map(([h, a], i) => buildGame(i + 1, h, a))
