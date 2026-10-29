import { Link } from 'react-router-dom'
import type { LeaderboardRow } from '@/types'
import { TeamBadge } from './TeamBadge'

export function Leaderboard({ rows, icon }: { rows: LeaderboardRow[]; icon?: string }) {
  return (
    <ol className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.player.id}>
          <Link
            to={`/players/${row.player.id}`}
            className="flex items-center gap-3 rounded-md px-2 py-2.5 transition hover:bg-muted"
          >
            <span className="font-display w-6 text-center text-lg font-bold text-muted-foreground tabular-nums">
              {row.rank}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{row.player.nickname}</span>
              {row.team && <TeamBadge team={row.team} className="text-xs text-muted-foreground" />}
            </span>
            <span className="font-display text-2xl font-extrabold tabular-nums">
              {icon && <span className="mr-1 text-base" aria-hidden>{icon}</span>}
              {row.value}
            </span>
          </Link>
        </li>
      ))}
      {rows.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">—</li>}
    </ol>
  )
}
