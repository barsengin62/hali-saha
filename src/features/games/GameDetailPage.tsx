import { ArrowLeft, MapPin, Play } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { TeamOrTbd } from '@/components/TeamBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsync } from '@/hooks/useAsync'
import { cn, formatDate, formatSeconds } from '@/lib/utils'
import type { GameDetail, GameEvent, LineupPlayer, StatType } from '@/types'
import { LineupPitch } from './LineupPitch'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'

export function GameDetailPage() {
  const { id } = useParams()
  const gameId = Number(id)
  const [searchParams] = useSearchParams()
  const startAt = searchParams.has('t') ? Number(searchParams.get('t')) : undefined
  const endAt = searchParams.has('end') ? Number(searchParams.get('end')) : undefined

  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.game(gameId), api.statTypes()]),
    [gameId],
  )

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && <GameView game={data[0]} statTypes={data[1]} startAt={startAt} endAt={endAt} />}
    </AsyncState>
  )
}

function GameView({
  game,
  statTypes,
  startAt,
  endAt,
}: {
  game: GameDetail
  statTypes: StatType[]
  startAt?: number
  endAt?: number
}) {
  const { t, i18n } = useTranslation()
  const player = useRef<VideoPlayerHandle>(null)
  const back = (useLocation().state as { back?: string } | null)?.back

  const playersById = useMemo(() => {
    const map = new Map<number, LineupPlayer>()
    game.lineups.forEach((l) => l.players.forEach((p) => map.set(p.id, p)))
    return map
  }, [game])
  const typeById = useMemo(() => new Map(statTypes.map((s) => [s.id, s])), [statTypes])

  // Asistler gol satırının altında gösterildiği için zaman çizelgesinde ayrıca listelenmez
  const assistsByGoal = useMemo(() => {
    const map = new Map<number, GameEvent>()
    game.events.forEach((e) => e.related_event_id && map.set(e.related_event_id, e))
    return map
  }, [game])
  const timeline = game.events.filter((e) => e.related_event_id === null)

  const teamTotals = statTypes
    .map((s) => ({
      type: s,
      home: game.events.filter((e) => e.stat_type_id === s.id && e.team_id === game.home_team?.id).length,
      away: game.events.filter((e) => e.stat_type_id === s.id && e.team_id === game.away_team?.id).length,
    }))
    .filter((row) => row.home + row.away > 0)

  const seek = (sec: number, end?: number) => player.current?.seek(sec, end)

  return (
    <div className="space-y-6">
      {/* HS-40: takvimden gelindiyse aynı haftanın takvimine döner */}
      <Link to={back ?? '/'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {back ? t('nav.schedule') : t('nav.home')}
      </Link>

      {/* Skor tabelası */}
      <section className="pitch-pattern rounded-xl px-4 py-6 text-chalk sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-chalk/70">
          <Link to={`/organizations/${game.organization.slug}`} className="hover:text-lime-accent">
            {game.organization.name}
          </Link>
          <span>{formatDate(game.starts_at, i18n.language)}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {game.pitch.venue.name} · {game.pitch.name}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamOrTbd team={game.home_team} align="right" className="font-display justify-self-end text-xl font-bold uppercase sm:text-3xl" />
          <div className="font-display rounded-lg bg-pitch-950/70 px-4 py-2 text-4xl font-extrabold tabular-nums sm:text-6xl">
            {game.home_score ?? '–'} : {game.away_score ?? '–'}
          </div>
          <TeamOrTbd team={game.away_team} className="font-display text-xl font-bold uppercase sm:text-3xl" />
        </div>
        <p className="mt-3 text-center text-xs uppercase tracking-widest text-lime-accent">
          {t(`game.status.${game.status}`)}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {game.video && (
            <section aria-label={t('game.video')}>
              <VideoPlayer ref={player} video={game.video} startAt={startAt} endAt={endAt} />
            </section>
          )}

          {game.highlights.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-2xl font-bold uppercase">{t('game.highlights')}</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {game.highlights.map((h) => (
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
                <CardTitle>{t('game.stats')}</CardTitle>
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
                        <div style={{ width: `${(home / total) * 100}%`, backgroundColor: game.home_team?.color }} />
                        <div className="ml-auto" style={{ width: `${(away / total) * 100}%`, backgroundColor: game.away_team?.color }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* HS-40: kadro saha üzerinde; kadrolar oluşturulduktan sonra (HS-44) */}
          <Card>
            <CardHeader>
              <CardTitle>{t('game.lineups')}</CardTitle>
            </CardHeader>
            <CardContent>
              {game.status !== 'scheduled' && game.lineups.some((l) => l.players.length > 0) ? (
                <LineupPitch game={game} statTypes={statTypes} />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('game.lineupsNotSet')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Maç akışı */}
        <Card className="self-start lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>{t('game.timeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('game.noEvents')}</p>
            ) : (
              <ol className="relative space-y-1 before:absolute before:inset-y-1 before:left-[1.35rem] before:w-px before:bg-border">
                {timeline.map((e) => {
                  const type = typeById.get(e.stat_type_id)
                  const who = playersById.get(e.player_id)
                  const assist = assistsByGoal.get(e.id)
                  const isHome = e.team_id === game.home_team?.id
                  return (
                    <li key={e.id}>
                      <button
                        onClick={() => game.video && e.video_time_sec !== null && seek(Math.max(0, e.video_time_sec - 5))}
                        disabled={!game.video || e.video_time_sec === null}
                        title={e.video_time_sec !== null ? t('game.jumpTo', { time: formatSeconds(e.video_time_sec) }) : undefined}
                        className="relative flex w-full items-start gap-3 rounded-md px-1 py-1.5 text-left transition enabled:hover:bg-muted"
                      >
                        <span
                          className={cn(
                            'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 bg-card text-sm',
                          )}
                          style={{ borderColor: isHome ? game.home_team?.color : game.away_team?.color }}
                          aria-hidden
                        >
                          {type?.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className="font-display text-lg font-bold tabular-nums">{e.minute ?? '–'}'</span>
                            <span className="truncate font-medium">{who?.nickname}</span>
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {type?.name}
                            {assist && ` · ${t('game.assistBy', { name: playersById.get(assist.player_id)?.nickname })}`}
                          </span>
                        </span>
                        {game.video && e.video_time_sec !== null && (
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
