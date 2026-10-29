/**
 * Maç takvimi için sahte veri. Bugünün tarihine göre üretilir:
 * geçen haftadan 3 hafta sonrasına kadar, her hafta birkaç planlanmış maç.
 * Bu haftanın bazı takımlı maçlarının kadroları oluşturulmuş (HS-44, lineups_set).
 * Bu hafta örnek talepler: kadrodasın (onaylı), onay bekliyor, reddedildi (HS-42).
 * Talep / geri çekme sayfa açık kaldığı sürece bellekte tutulur; admin onayı mock'ta yok.
 * Kurallar backend'deki GameRegistrationService ile aynı (HS-37 / HS-42).
 */
import { addDays, startOfWeek } from '@/lib/dates'
import type { Game, RegistrationStatus, Team } from '@/types'
import { organizations, pitches, teams } from './data'

// [haftanın günü (0=Pzt), saat, dakika, saha, format, takımlar belli mi]
const weeklySlots: [number, number, number, number, number, boolean][] = [
  [0, 19, 0, 0, 7, true],
  [1, 20, 30, 1, 6, false],
  [2, 18, 30, 0, 7, true],
  [2, 20, 0, 2, 5, false],
  [3, 19, 30, 1, 7, true],
  [4, 20, 0, 0, 6, true],
  [5, 10, 0, 2, 6, false],
  [6, 17, 0, 0, 7, true],
]

function pick<T>(list: T[], i: number): T {
  return list[i % list.length]
}

/** Kayıt durumu (bellekte): maç id → { onaylı kayıt sayısı (benimki dahil), benim talebim } */
const registrations = new Map<number, { count: number; mine: RegistrationStatus | null }>()

/** Bu haftanın örnek talepleri: slot → durum */
const sampleRequests: Record<number, RegistrationStatus> = { 0: 'approved', 2: 'pending', 4: 'rejected' }

function build(): Game[] {
  const weekStart = startOfWeek(new Date())
  const result: Game[] = []
  let id = 1000

  for (let week = -1; week <= 3; week++) {
    weeklySlots.forEach(([dayOffset, hour, minute, pitchIdx, format, hasTeams], slotIdx) => {
      const start = addDays(weekStart, week * 7 + dayOffset)
      start.setHours(hour, minute, 0, 0)

      const capacity = format * 2
      // Deterministik doluluk: bazı maçlar dolu, bazıları yarı boş
      const seed = (week + 2) * 7 + slotIdx
      const registered = seed % 5 === 2 ? capacity : Math.min(capacity - 1, 3 + ((seed * 5) % capacity))

      let home: Team | null = null
      let away: Team | null = null
      if (hasTeams) {
        home = pick(teams, seed)
        away = pick(teams, seed + 1 + (seed % 2))
        if (away.id === home.id) away = pick(teams, seed + 2)
      }

      const org = hasTeams ? organizations[0] : organizations[1]
      // Kadrolar oluşturuldu: bu hafta, takımlı maçların bazıları; ilkinde kullanıcı kadroda
      const lineupsSet = hasTeams && week === 0 && slotIdx % 3 === 0
      const mine = week === 0 ? (sampleRequests[slotIdx] ?? null) : null
      registrations.set(id, { count: registered, mine })
      result.push({
        id: id++,
        status: lineupsSet ? 'lineups_set' : 'scheduled',
        organization: { id: org.id, slug: org.slug, name: org.name },
        pitch: pitches[pitchIdx],
        starts_at: start.toISOString(),
        duration_min: 60,
        format,
        capacity,
        home_team: home,
        away_team: away,
        home_score: null,
        away_score: null,
      })
    })
  }
  return result
}

export const scheduledGames: Game[] = build()

/** Kayıt değiştirilebilir mi: planlandı ve başlamadı (kadrolar oluşturulduysa kapalı) */
export function isChangeable(game: Game): boolean {
  return game.status === 'scheduled' && new Date(game.starts_at).getTime() > Date.now()
}

export function myRequest(gameId: number): RegistrationStatus | null {
  return registrations.get(gameId)?.mine ?? null
}

/** Backend'deki GameResource.registration ile aynı alanlar */
export function withRegistration(game: Game): Game {
  const state = registrations.get(game.id) ?? { count: 0, mine: null }
  const spotsLeft = Math.max(0, game.capacity - state.count)
  const isOpen = isChangeable(game) && spotsLeft > 0
  return {
    ...game,
    registration: {
      count: state.count,
      capacity: game.capacity,
      spots_left: spotsLeft,
      request_status: state.mine,
      is_open: isOpen,
      can_request: isOpen && (state.mine === null || state.mine === 'rejected'),
      can_withdraw: (state.mine === 'pending' || state.mine === 'approved') && isChangeable(game),
    },
  }
}

/** Talep durumunu değiştirir; onaylı talep eklenip çıkınca sayı güncellenir */
export function setRequest(gameId: number, mine: RegistrationStatus | null) {
  const state = registrations.get(gameId) ?? { count: 0, mine: null }
  const delta = (mine === 'approved' ? 1 : 0) - (state.mine === 'approved' ? 1 : 0)
  registrations.set(gameId, { count: state.count + delta, mine })
}
