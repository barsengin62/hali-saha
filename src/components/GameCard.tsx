import { Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Game } from '@/types'
import { cn, formatDate } from '@/lib/utils'
import { TeamOrTbd } from './TeamBadge'

export function GameCard({ game }: { game: Game }) {
  const { t, i18n } = useTranslation()
  const hasScore = game.home_score !== null && game.away_score !== null

  return (
    <Link
      to={`/games/${game.id}`}
      className="group block rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(game.starts_at, i18n.language)}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
            game.status === 'analyzed' && 'bg-lime-accent/30 text-pitch-800 dark:text-lime-accent',
            game.status === 'played' && 'bg-muted',
            game.status === 'scheduled' && 'bg-muted',
          )}
        >
          {game.status === 'analyzed' && <Video className="h-3 w-3" aria-hidden />}
          {t(`game.status.${game.status}`)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamOrTbd team={game.home_team} className="text-sm font-medium" />
        <div className="font-display rounded-md bg-pitch-900 px-3 py-1 text-2xl font-extrabold tabular-nums text-chalk">
          {hasScore ? `${game.home_score} – ${game.away_score}` : t('common.vs')}
        </div>
        <TeamOrTbd team={game.away_team} align="right" className="justify-self-end text-sm font-medium" />
      </div>

      <p className="mt-3 truncate text-xs text-muted-foreground">{game.organization.name}</p>
    </Link>
  )
}
