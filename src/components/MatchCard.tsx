import { Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { MatchSummary } from '@/types'
import { cn, formatDate } from '@/lib/utils'
import { TeamBadge } from './TeamBadge'

export function MatchCard({ match }: { match: MatchSummary }) {
  const { t, i18n } = useTranslation()
  const hasScore = match.home_score !== null && match.away_score !== null

  return (
    <Link
      to={`/matches/${match.id}`}
      className="group block rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(match.played_at, i18n.language)}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
            match.status === 'analyzed' && 'bg-lime-accent/30 text-pitch-800 dark:text-lime-accent',
            match.status === 'played' && 'bg-muted',
            match.status === 'scheduled' && 'bg-muted',
          )}
        >
          {match.status === 'analyzed' && <Video className="h-3 w-3" aria-hidden />}
          {t(`match.status.${match.status}`)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamBadge team={match.home_team} className="text-sm font-medium" />
        <div className="font-display rounded-md bg-pitch-900 px-3 py-1 text-2xl font-extrabold tabular-nums text-chalk">
          {hasScore ? `${match.home_score} – ${match.away_score}` : t('common.vs')}
        </div>
        <TeamBadge team={match.away_team} align="right" className="justify-self-end text-sm font-medium" />
      </div>

      <p className="mt-3 truncate text-xs text-muted-foreground">{match.organization.name}</p>
    </Link>
  )
}
