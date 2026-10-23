import { ArrowLeft, MapPin, Play } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { TeamBadge } from '@/components/TeamBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsync } from '@/hooks/useAsync'
import { cn, formatDate, formatSeconds } from '@/lib/utils'
import type { MatchDetail, MatchEvent, Player, StatType } from '@/types'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'

export function MatchDetailPage() {
  const { id } = useParams()
  const matchId = Number(id)
  const [searchParams] = useSearchParams()
  const startAt = searchParams.has('t') ? Number(searchParams.get('t')) : undefined
  const endAt = searchParams.has('end') ? Number(searchParams.get('end')) : undefined

  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.match(matchId), api.statTypes()]),
    [matchId],
  )

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && <MatchView match={data[0]} statTypes={data[1]} startAt={startAt} endAt={endAt} />}
    </AsyncState>
  )
}

function MatchView({
  match,
  statTypes,
  startAt,
  endAt,
}: {
  match: MatchDetail
  statTypes: StatType[]
  startAt?: number
  endAt?: number
}) {
  const { t, i18n } = useTranslation()
  const player = useRef<VideoPlayerHandle>(null)

  const playersById = useMemo(() => {
    const map = new Map<number, Player>()
    match.lineups.forEach((l) => l.players.forEach((p) => map.set(p.id, p)))
    return map
  }, [match])
  const typeById = useMemo(() => new Map(statTypes.map((s) => [s.id, s])), [statTypes])

  // Asistler gol satırının altında gösterildiği için zaman çizelgesinde ayrıca listelenmez
  const assistsByGoal = useMemo(() => {
    const map = new Map<number, MatchEvent>()
    match.events.forEach((e) => e.related_event_id && map.set(e.related_event_id, e))
    return map
  }, [match])
  const timeline = match.events.filter((e) => e.related_event_id === null)

  const teamTotals = statTypes
    .filter((s) => s.is_visible)
    .map((s) => ({
      type: s,
      home: match.events.filter((e) => e.stat_type_id === s.id && e.team_id === match.home_team.id).length,
      away: match.events.filter((e) => e.stat_type_id === s.id && e.team_id === match.away_team.id).length,
    }))
    .filter((row) => row.home + row.away > 0)

  const seek = (sec: number, end?: number) => player.current?.seek(sec, end)

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {t('nav.home')}
      </Link>

      {/* Skor tabelası */}
      <section className="pitch-pattern rounded-xl px-4 py-6 text-chalk sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-chalk/70">
          <Link to={`/organizations/${match.organization.slug}`} className="hover:text-lime-accent">
            {match.organization.name}
          </Link>
          <span>{formatDate(match.played_at, i18n.language)}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {match.venue}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamBadge team={match.home_team} align="right" className="font-display justify-self-end text-xl font-bold uppercase sm:text-3xl" />
          <div className="font-display rounded-lg bg-pitch-950/70 px-4 py-2 text-4xl font-extrabold tabular-nums sm:text-6xl">
            {match.home_score ?? '–'} : {match.away_score ?? '–'}
          </div>
          <TeamBadge team={match.away_team} className="font-display text-xl font-bold uppercase sm:text-3xl" />
        </div>
        <p className="mt-3 text-center text-xs uppercase tracking-widest text-lime-accent">
          {t(`match.status.${match.status}`)}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {match.video && (
            <section aria-label={t('match.video')}>
              <VideoPlayer ref={player} video={match.video} startAt={startAt} endAt={endAt} />
            </section>
          )}

          {match.highlights.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-2xl font-bold uppercase">{t('match.highlights')}</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {match.highlights.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => seek(h.start_sec, h.end_sec)}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition hover:border-primary"
                  >
                    <Play className="h-3.5 w-3.5 fill-current text-primary" aria-hidden />
                    {h.title}
                  </button>
                ))}
              </div>
            </section>
          )}

          {teamTotals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('match.stats')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamTotals.map(({ type, home, away }) => {
                  const total = home + away
                  return (
                    <div key={type.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-semibold tabular-nums">{home}</span>
                        <span className="text-muted-foreground">
                          {type.icon} {type.name}
                        </span>
                        <span className="font-semibold tabular-nums">{away}</span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        <div style={{ width: `${(home / total) * 100}%`, backgroundColor: match.home_team.color }} />
                        <div className="ml-auto" style={{ width: `${(away / total) * 100}%`, backgroundColor: match.away_team.color }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('match.lineups')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {match.lineups.map((lineup) => {
                const team = lineup.team_id === match.home_team.id ? match.home_team : match.away_team
                return (
                  <div key={lineup.team_id}>
                    <TeamBadge team={team} className="mb-2 font-semibold" />
                    <ul className="space-y-1">
                      {lineup.players.map((p) => (
                        <li key={p.id}>
                          <Link to={`/players/${p.id}`} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted">
                            <span className="w-7 text-xs font-semibold text-muted-foreground">{p.position}</span>
                            {p.nickname}
                            <span className="text-xs text-muted-foreground">· {p.full_name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Maç akışı */}
        <Card className="self-start lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>{t('match.timeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('match.noEvents')}</p>
            ) : (
              <ol className="relative space-y-1 before:absolute before:inset-y-1 before:left-[1.35rem] before:w-px before:bg-border">
                {timeline.map((e) => {
                  const type = typeById.get(e.stat_type_id)
                  const who = playersById.get(e.player_id)
                  const assist = assistsByGoal.get(e.id)
                  const isHome = e.team_id === match.home_team.id
                  return (
                    <li key={e.id}>
                      <button
                        onClick={() => match.video && seek(Math.max(0, e.video_time_sec - 5))}
                        disabled={!match.video}
                        title={t('match.jumpTo', { time: formatSeconds(e.video_time_sec) })}
                        className="relative flex w-full items-start gap-3 rounded-md px-1 py-1.5 text-left transition enabled:hover:bg-muted"
                      >
                        <span
                          className={cn(
                            'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 bg-card text-sm',
                          )}
                          style={{ borderColor: isHome ? match.home_team.color : match.away_team.color }}
                          aria-hidden
                        >
                          {type?.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className="font-display text-lg font-bold tabular-nums">{e.minute}'</span>
                            <span className="truncate font-medium">{who?.nickname}</span>
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {type?.name}
                            {assist && ` · ${t('match.assistBy', { name: playersById.get(assist.player_id)?.nickname })}`}
                          </span>
                        </span>
                        {match.video && (
                          <span className="mt-1 text-xs tabular-nums text-muted-foreground">
                            ▶ {formatSeconds(e.video_time_sec)}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
