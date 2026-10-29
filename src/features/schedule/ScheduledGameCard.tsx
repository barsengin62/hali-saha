import { ArrowRight, CheckCircle2, Clock, Hourglass, Loader2, Lock, MapPin, Users, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { TeamOrTbd } from '@/components/TeamBadge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, Select } from '@/components/ui/form'
import { formatTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Game, Position, RegistrationRequest } from '@/types'

interface Props {
  game: Game
  busy: boolean
  /** Talep gönderir; başarılıysa true (form kapanır) */
  onRequest: (body: RegistrationRequest) => Promise<boolean>
  onWithdraw: () => void
}

export function ScheduledGameCard({ game, busy, onRequest, onWithdraw }: Props) {
  const { t, i18n } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  // HS-40: detay sayfasından aynı haftanın takvimine geri dönülsün
  const location = useLocation()
  const detail = { to: `/games/${game.id}`, state: { back: `${location.pathname}${location.search}` } }

  // Kayıt durumu API'den (GameResource.registration, HS-37 / HS-42); kurallar backend'de
  const registration = game.registration ?? {
    count: 0, capacity: game.capacity, spots_left: game.capacity, request_status: null,
    is_open: false, can_request: false, can_withdraw: false,
  }
  const status = registration.request_status

  async function submit(body: RegistrationRequest) {
    if (await onRequest(body)) setFormOpen(false)
  }
  const spotsLeft = registration.spots_left
  const isFull = spotsLeft === 0
  const hasStarted = new Date(game.starts_at).getTime() <= Date.now()
  // HS-44: kadrolar oluşturuldu; kayıt ve kayıttan çıkma kapalı
  const lineupsSet = game.status === 'lineups_set'
  const fillPct = Math.min(100, (registration.count / game.capacity) * 100)
  const endTime = new Date(new Date(game.starts_at).getTime() + game.duration_min * 60_000).toISOString()

  return (
    <article
      className={cn(
        'flex flex-col rounded-lg border bg-card transition',
        status === 'approved' ? 'border-primary ring-1 ring-primary/40' : status === 'pending' ? 'border-amber-500/60' : 'border-border',
        hasStarted && 'opacity-70',
      )}
    >
      {/* Üst şerit: saat + format */}
      <header className="flex items-center justify-between gap-2 rounded-t-lg bg-pitch-900 px-4 py-2.5 text-chalk">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-lime-accent" aria-hidden />
          <span className="font-display text-2xl font-bold tabular-nums leading-none">
            {formatTime(game.starts_at, i18n.language)}
          </span>
          <span className="text-xs text-chalk/60">– {formatTime(endTime, i18n.language)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          {lineupsSet && (
            <span className="inline-flex items-center gap-1 rounded bg-chalk/15 px-2 py-0.5 text-xs font-semibold">
              <Lock className="h-3 w-3" aria-hidden />
              {t('schedule.lineupsSet')}
            </span>
          )}
          <span className="rounded bg-lime-accent px-2 py-0.5 text-xs font-bold text-pitch-950">
            {t('schedule.format', { n: game.format })}
          </span>
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Takımlar */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm font-semibold">
          <TeamOrTbd team={game.home_team} />
          <span className="text-xs font-normal text-muted-foreground">{t('common.vs')}</span>
          <TeamOrTbd team={game.away_team} align="right" className="justify-self-end" />
        </div>

        {/* Saha */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="truncate font-medium">
              {game.pitch.venue.name} · {game.pitch.name}
            </p>
            {game.pitch.venue.address && (
              <p className="truncate text-xs text-muted-foreground">{game.pitch.venue.address}</p>
            )}
          </div>
        </div>

        {/* Maç detayı her kartta (başlamış maçlar dahil); kadroları belli, başlamamış maçta altta ayrıca "Kadroyu gör" */}
        {(!lineupsSet || hasStarted) && (
          <Link
            {...detail}
            className="inline-flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
          >
            {t('schedule.details')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}

        {/* Doluluk */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
              {t('schedule.capacity', { count: game.capacity })}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {t('schedule.registered', { count: registration.count, capacity: game.capacity })}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={game.capacity}
            aria-valuenow={registration.count}
          >
            <div
              className={cn('h-full rounded-full transition-all', isFull ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className={cn('text-xs font-medium', isFull ? 'text-destructive' : 'text-primary')}>
            {isFull ? t('schedule.full') : t('schedule.spotsLeft', { count: spotsLeft })}
          </p>
        </div>

        {/* Aksiyon: talep durumuna göre (HS-42) */}
        <div className="mt-auto space-y-2">
          {hasStarted ? (
            <Button variant="outline" className="w-full" disabled>
              {t('schedule.started')}
            </Button>
          ) : lineupsSet ? (
            // HS-40: kadro saha üzerinde maç detayında
            <div className="flex items-center gap-2">
              {status === 'approved' && (
                <span className="inline-flex flex-1 items-center gap-1.5 text-sm font-semibold text-primary">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {t('schedule.inSquad')}
                </span>
              )}
              <Link {...detail} className={cn(buttonVariants({ variant: status === 'approved' ? 'outline' : 'default', size: status === 'approved' ? 'sm' : 'default' }), status !== 'approved' && 'w-full')}>
                <Lock className="h-4 w-4" aria-hidden />
                {t('schedule.viewLineup')}
              </Link>
            </div>
          ) : formOpen ? (
            <RequestForm game={game} busy={busy} onSubmit={submit} onCancel={() => setFormOpen(false)} />
          ) : status === 'approved' || status === 'pending' ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex flex-1 items-center gap-1.5 text-sm font-semibold',
                  status === 'approved' ? 'text-primary' : 'text-amber-600 dark:text-amber-400',
                )}
              >
                {status === 'approved' ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Hourglass className="h-4 w-4" aria-hidden />}
                {t(status === 'approved' ? 'schedule.inSquad' : 'schedule.pending')}
              </span>
              <Button variant="outline" size="sm" onClick={onWithdraw} disabled={busy || !registration.can_withdraw}>
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                {t(status === 'approved' ? 'schedule.leave' : 'schedule.withdraw')}
              </Button>
            </div>
          ) : (
            <>
              {status === 'rejected' && (
                <p className="inline-flex w-full items-center gap-1.5 text-sm font-medium text-destructive">
                  <XCircle className="h-4 w-4" aria-hidden />
                  {t('schedule.rejected')}
                </p>
              )}
              <Button className="w-full" onClick={() => setFormOpen(true)} disabled={!registration.can_request || busy}>
                {isFull ? t('schedule.full') : t(status === 'rejected' ? 'schedule.requestAgain' : 'schedule.register')}
              </Button>
            </>
          )}
          {/* Kural (HS-37 / HS-42 / HS-44) */}
          {!hasStarted && (
            <p className="text-center text-xs text-muted-foreground">
              {t(lineupsSet ? 'schedule.lineupsRule' : 'schedule.rule')}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

const positions: Position[] = ['GK', 'DF', 'MF', 'FW']

/** Kayıt talebi formu (kart içinde): takım ve pozisyon tercihi, ikisi de isteğe bağlı */
function RequestForm({
  game,
  busy,
  onSubmit,
  onCancel,
}: {
  game: Game
  busy: boolean
  onSubmit: (body: RegistrationRequest) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [teamId, setTeamId] = useState('')
  const [position, setPosition] = useState('')
  const teams = [game.home_team, game.away_team].filter((team) => team !== null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      team_id: teamId ? Number(teamId) : null,
      position: position ? (position as Position) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
      {/* Takımlar belli değilse takım tercihi yok */}
      {teams.length === 2 && (
        <Field label={t('schedule.form.team')} htmlFor={`team-${game.id}`}>
          <Select id={`team-${game.id}`} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">{t('schedule.form.any')}</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={t('schedule.form.position')} htmlFor={`position-${game.id}`}>
        <Select id={`position-${game.id}`} value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="">{t('schedule.form.any')}</option>
          {positions.map((p) => (
            <option key={p} value={p}>
              {t(`player.position.${p}`)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t('schedule.form.submit')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          {t('schedule.form.cancel')}
        </Button>
      </div>
    </form>
  )
}
