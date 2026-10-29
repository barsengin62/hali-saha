import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { GameDetail, LineupPlayer, StatType, Team } from '@/types'

/**
 * HS-40: maç kadrosu saha üzerinde (Filament kadro ekranıyla aynı görünüm, HS-24).
 * Koordinatlar API'den: x 0–100 ev sahibi kalesinden, y 0–100 yukarıdan (deplasman sağ yarıda).
 * Masaüstünde yatay saha (ev sahibi solda), mobilde dikey (ev sahibi aşağıda). Yön sadece CSS ile:
 * her kart konumunu --x / --y değişkeni olarak taşır; dar ekranda left = y, top = 100 − x.
 */
export function LineupPitch({ game, statTypes }: { game: GameDetail; statTypes: StatType[] }) {
  const { t } = useTranslation()

  // Oyuncu → istatistik türü → sayı (gol, asist…); türlerin sırası istatistik türleri listesindeki gibi
  const eventsByPlayer = new Map<number, Map<number, number>>()
  for (const e of game.events) {
    const counts = eventsByPlayer.get(e.player_id) ?? new Map<number, number>()
    counts.set(e.stat_type_id, (counts.get(e.stat_type_id) ?? 0) + 1)
    eventsByPlayer.set(e.player_id, counts)
  }

  const sides = game.lineups.map((lineup) => {
    const isHome = lineup.team_id === game.home_team?.id
    return { side: isHome ? ('home' as const) : ('away' as const), team: isHome ? game.home_team : game.away_team, players: lineup.players }
  })

  return (
    <div
      className="pitch-pattern relative mx-auto aspect-[68/105] w-full max-w-sm overflow-hidden rounded-xl sm:aspect-[105/68] sm:max-w-none"
    >
      <PitchLines className="absolute inset-0 h-full w-full sm:hidden" vertical />
      <PitchLines className="absolute inset-0 hidden h-full w-full sm:block" />

      {sides.map(({ side, team }) =>
        team ? (
          <span
            key={`label-${side}`}
            className={cn(
              'absolute z-10 text-[11px] font-bold uppercase tracking-wide text-chalk/90',
              side === 'home' ? 'bottom-1.5 left-2 sm:top-1.5 sm:bottom-auto' : 'right-2 top-1.5',
            )}
          >
            {team.name}
          </span>
        ) : null,
      )}

      <ul aria-label={t('game.lineups')} className="absolute inset-0">
        {sides.flatMap(({ side, team, players }) =>
          players
            .filter((p) => p.pitch.x !== null && p.pitch.y !== null)
            .map((p) => (
              <PlayerCard key={p.id} player={p} team={team} side={side} events={eventsByPlayer.get(p.id)} statTypes={statTypes} />
            )),
        )}
      </ul>
    </div>
  )
}

function PlayerCard({
  player,
  team,
  side,
  events,
  statTypes,
}: {
  player: LineupPlayer
  team: Team | null
  side: 'home' | 'away'
  events: Map<number, number> | undefined
  statTypes: StatType[]
}) {
  const { t } = useTranslation()
  const position = player.pitch.position ?? player.position
  const badges = statTypes
    .filter((s) => events?.has(s.id))
    .map((s) => ({ type: s, count: events!.get(s.id)! }))
  const shown = badges.slice(0, 3)
  const hidden = badges.length - shown.length

  // Ekran okuyucu: "Canavar, #9, Forvet, 2 × Gol"
  const label = [
    player.nickname,
    player.position_number ? `#${player.position_number}` : null,
    t(`player.position.${position}`),
    ...badges.map((b) => t('game.lineupEvent', { count: b.count, type: b.type.name })),
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <li
      className="absolute left-[calc(var(--y)*1%)] top-[calc((100_-_var(--x))*1%)] -translate-x-1/2 -translate-y-1/2 sm:left-[calc(var(--x)*1%)] sm:top-[calc(var(--y)*1%)]"
      style={{ '--x': player.pitch.x, '--y': player.pitch.y } as CSSProperties}
    >
      <Link
        to={`/players/${player.id}`}
        aria-label={label}
        title={`${player.full_name} · ${t(`player.position.${position}`)}`}
        className="group flex flex-col items-center gap-0.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-accent"
      >
        <span className="relative">
          <span
            className="flex h-10 w-9 flex-col items-center justify-center rounded-md border-t-4 bg-white leading-none text-pitch-900 shadow-md transition group-hover:-translate-y-0.5 sm:h-11 sm:w-10"
            style={{ borderTopColor: team?.color ?? (side === 'home' ? '#16a34a' : '#2563eb') }}
          >
            <span className="text-sm font-extrabold sm:text-base">{player.position_number ?? '•'}</span>
            <span className="mt-0.5 text-[9px] font-bold opacity-70">{position}</span>
          </span>
          {shown.length > 0 && (
            <span className="absolute -right-3 -top-2 flex gap-0.5" aria-hidden>
              {shown.map(({ type, count }) => (
                <span
                  key={type.id}
                  className="rounded-full bg-white px-1 text-[10px] font-bold leading-4 text-pitch-900 shadow"
                  title={type.name}
                >
                  {type.icon ?? type.name.charAt(0)}
                  {count > 1 && `×${count}`}
                </span>
              ))}
              {hidden > 0 && (
                <span className="rounded-full bg-white px-1 text-[10px] font-bold leading-4 text-pitch-900 shadow">+{hidden}</span>
              )}
            </span>
          )}
        </span>
        <span className="max-w-[4.5rem] truncate text-[10px] font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,.7)] sm:text-xs">
          {player.nickname}
        </span>
      </Link>
    </li>
  )
}

/**
 * Saha çizgileri (105 × 68 m). Dikeyde aynı çizim döndürülür: (x, y) → (y, 105 − x), ev sahibi aşağıda.
 */
function PitchLines({ className, vertical = false }: { className?: string; vertical?: boolean }) {
  const line = { fill: 'none', stroke: 'rgba(255,255,255,.75)', strokeWidth: 1.5, vectorEffect: 'non-scaling-stroke' as const }
  return (
    <svg
      className={className}
      viewBox={vertical ? '0 0 68 105' : '0 0 105 68'}
      preserveAspectRatio="none"
      aria-hidden
    >
      <g transform={vertical ? 'translate(0 105) rotate(-90)' : undefined}>
        <rect x="2" y="2" width="101" height="64" rx="0.5" {...line} />
        <line x1="52.5" y1="2" x2="52.5" y2="66" {...line} />
        <circle cx="52.5" cy="34" r="9.15" {...line} />
        <circle cx="52.5" cy="34" r="0.6" fill="rgba(255,255,255,.75)" />
        {/* Ceza sahaları ve kale alanları */}
        <rect x="2" y="13.85" width="16.5" height="40.3" {...line} />
        <rect x="86.5" y="13.85" width="16.5" height="40.3" {...line} />
        <rect x="2" y="24.84" width="5.5" height="18.32" {...line} />
        <rect x="97.5" y="24.84" width="5.5" height="18.32" {...line} />
      </g>
    </svg>
  )
}
