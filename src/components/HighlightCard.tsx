import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HighlightWithMatch } from '@/types'
import { formatSeconds } from '@/lib/utils'

/**
 * Highlight ayrı bir dosya değil; ana videonun [start_sec, end_sec] aralığı.
 * Tıklanınca maç sayfasına ?t= parametresiyle gider ve video o saniyeden başlar.
 */
export function HighlightCard({ highlight }: { highlight: HighlightWithMatch }) {
  const { match } = highlight
  return (
    <Link
      to={`/matches/${match.id}?t=${highlight.start_sec}&end=${highlight.end_sec}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition hover:shadow-md"
    >
      <div className="pitch-pattern relative grid aspect-video place-items-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-lime-accent text-pitch-950 shadow-lg transition group-hover:scale-110">
          <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
        </span>
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs tabular-nums text-white">
          {formatSeconds(highlight.end_sec - highlight.start_sec)}
        </span>
      </div>
      <div className="p-3">
        <p className="truncate font-medium">{highlight.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {match.home_team.name} {match.home_score}–{match.away_score} {match.away_team.name}
        </p>
      </div>
    </Link>
  )
}
