import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { GameCard } from '@/components/GameCard'
import { useAsync } from '@/hooks/useAsync'
import type { PlayerStats } from '@/types'

export function PlayerPage() {
  const { id } = useParams()
  const { data, loading, error, reload } = useAsync(() => api.player(Number(id)), [id])

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && <PlayerView stats={data} />}
    </AsyncState>
  )
}

/** Profil sayfası da bunu kullanır. */
export function PlayerView({ stats }: { stats: PlayerStats }) {
  const { t } = useTranslation()
  const { player } = stats
  const initials = player.full_name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <section className="pitch-pattern flex flex-col items-center gap-4 rounded-xl px-6 py-8 text-chalk sm:flex-row">
        <div className="font-display grid h-24 w-24 place-items-center rounded-full bg-lime-accent text-4xl font-extrabold text-pitch-950">
          {initials}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-display text-5xl font-extrabold uppercase leading-none">{player.nickname}</h1>
          <p className="text-chalk/80">{player.full_name}</p>
          <p className="mt-1 text-sm text-lime-accent">{t(`player.position.${player.position}`)}</p>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-3 text-2xl font-bold uppercase">{t('player.totals')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label={t('player.games')} value={stats.games_played} icon="🏟️" />
          {stats.totals.map((x) => (
            <StatTile key={x.stat_type.id} label={x.stat_type.name} value={x.value} icon={x.stat_type.icon ?? ''} />
          ))}
        </div>
      </section>

      {stats.recent_games.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-2xl font-bold uppercase">{t('player.recentGames')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.recent_games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xl" aria-hidden>{icon}</div>
      <div className="font-display mt-1 text-4xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
