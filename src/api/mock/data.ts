/**
 * Backend olmadan çalışabilmek için sahte veri.
 * Laravel'deki seeder'larla aynı mantığı izler; VITE_USE_MOCK=false olunca hiç kullanılmaz.
 */
import type {
  Highlight,
  MatchDetail,
  MatchEvent,
  Organization,
  Player,
  Position,
  StatType,
  Team,
} from '@/types'

// Açık lisanslı örnek video (CC BY). Gerçekte maç videosu burada olacak.
export const SAMPLE_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
const SAMPLE_VIDEO_DURATION = 596

export const statTypes: StatType[] = [
  { id: 1, key: 'goal', name: 'Gol', icon: '⚽', color: '#16a34a', is_visible: true },
  { id: 2, key: 'assist', name: 'Asist', icon: '👟', color: '#0284c7', is_visible: true },
  { id: 3, key: 'save', name: 'Kurtarış', icon: '🧤', color: '#9333ea', is_visible: true },
  { id: 4, key: 'yellow_card', name: 'Sarı kart', icon: '🟨', color: '#ca8a04', is_visible: true },
  { id: 5, key: 'own_goal', name: 'Kendi kalesine', icon: '🙈', color: '#dc2626', is_visible: true },
]

export const organizations: Organization[] = [
  {
    id: 1,
    slug: 'favoriten-carsamba-ligi',
    name: 'Favoriten Çarşamba Ligi',
    description: 'Her çarşamba akşamı 7v7, sezon boyu puan usulü.',
    logo_url: null,
  },
  {
    id: 2,
    slug: 'donaustadt-cup',
    name: 'Donaustadt Cup',
    description: 'Aylık eleme usulü turnuva.',
    logo_url: null,
  },
]

export const teams: Team[] = [
  { id: 1, organization_id: 1, name: 'Yeşil Şimşekler', color: '#16a34a' },
  { id: 2, organization_id: 1, name: 'Kırmızı Kartallar', color: '#dc2626' },
  { id: 3, organization_id: 1, name: 'Mavi Dalga', color: '#2563eb' },
  { id: 4, organization_id: 1, name: 'Sarı Arılar', color: '#eab308' },
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

export const players: Player[] = names.map(([full_name, nickname], i) => ({
  id: i + 1,
  full_name,
  nickname,
  position: positionsPerTeam[i % 6],
  preferred_foot: i % 5 === 0 ? 'left' : i % 7 === 0 ? 'both' : 'right',
  avatar_url: null,
}))

/** Takım id'sine göre kadro (her takımda 6 oyuncu). */
export function rosterOf(teamId: number): Player[] {
  const start = (teamId - 1) * 6
  return players.slice(start, start + 6)
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

function buildMatch(id: number, home: number, away: number): MatchDetail {
  const rand = seeded(id * 101)
  const playedAt = new Date(Date.UTC(2026, 8, 2 + (id - 1) * 7, 17, 30)).toISOString()
  const isUpcoming = id === fixtures.length
  const isAnalyzed = !isUpcoming && id !== fixtures.length - 1

  const events: MatchEvent[] = []
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
      const videoTime = Math.floor((minute / 60) * (SAMPLE_VIDEO_DURATION - 20))
      if (teamId === home) homeScore++
      else awayScore++

      if (!isAnalyzed) continue // "played" maçlarda sadece skor var, analiz yok

      const goal: MatchEvent = {
        id: eventId++, match_id: id, player_id: scorer.id, team_id: teamId,
        stat_type_id: 1, minute, video_time_sec: videoTime, related_event_id: null,
      }
      events.push(goal)

      if (rand() > 0.35) {
        const assisters = roster.filter((p) => p.id !== scorer.id)
        const assister = assisters[Math.floor(rand() * assisters.length)]
        events.push({
          id: eventId++, match_id: id, player_id: assister.id, team_id: teamId,
          stat_type_id: 2, minute, video_time_sec: videoTime, related_event_id: goal.id,
        })
      }

      if (g % 2 === 0) {
        highlights.push({
          id: highlightId++, match_id: id, match_event_id: goal.id,
          title: `${minute}' ${scorer.nickname}`,
          start_sec: Math.max(0, videoTime - 6), end_sec: videoTime + 6,
          thumbnail_url: null,
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
            id: eventId++, match_id: id, player_id: gk.id, team_id: teamId, stat_type_id: 3,
            minute, video_time_sec: Math.floor((minute / 60) * (SAMPLE_VIDEO_DURATION - 20)),
            related_event_id: null,
          })
        }
      }
      if (rand() > 0.5) {
        const p = rosterOf(home)[1]
        events.push({
          id: eventId++, match_id: id, player_id: p.id, team_id: home, stat_type_id: 4,
          minute: 38, video_time_sec: 360, related_event_id: null,
        })
      }
      events.sort((a, b) => a.minute - b.minute || a.stat_type_id - b.stat_type_id)
    }
  }

  const org = organizations[0]
  return {
    id,
    organization: { id: org.id, slug: org.slug, name: org.name },
    venue: 'Sportzentrum Favoriten — Saha 2',
    played_at: playedAt,
    status: isUpcoming ? 'scheduled' : isAnalyzed ? 'analyzed' : 'played',
    home_team: teams[home - 1],
    away_team: teams[away - 1],
    home_score: isUpcoming ? null : homeScore,
    away_score: isUpcoming ? null : awayScore,
    lineups: [
      { team_id: home, players: rosterOf(home) },
      { team_id: away, players: rosterOf(away) },
    ],
    events,
    video: isAnalyzed
      ? { id, match_id: id, provider: 'file', url: SAMPLE_VIDEO_URL, duration_sec: SAMPLE_VIDEO_DURATION }
      : null,
    highlights,
  }
}

export const matches: MatchDetail[] = fixtures.map(([h, a], i) => buildMatch(i + 1, h, a))
