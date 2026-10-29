import { CheckCircle2, Clock, Loader2, MapPin, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TeamOrTbd } from '@/components/TeamBadge'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Game } from '@/types'

interface Props {
  game: Game
  busy: boolean
  onRegister: () => void
  onUnregister: () => void
}

export function ScheduledGameCard({ game, busy, onRegister, onUnregister }: Props) {
  const { t, i18n } = useTranslation()

  // Kayıt durumu API'den (GameResource.registration, HS-37); kurallar backend'de
  const registration = game.registration ?? {
    count: 0, capacity: game.capacity, spots_left: game.capacity, is_registered: false, is_open: false, can_unregister: false,
  }
  const spotsLeft = registration.spots_left
  const isFull = spotsLeft === 0
  const hasStarted = new Date(game.starts_at).getTime() <= Date.now()
  const fillPct = Math.min(100, (registration.count / game.capacity) * 100)
  const endTime = new Date(new Date(game.starts_at).getTime() + game.duration_min * 60_000).toISOString()

  return (
    <article
      className={cn(
        'flex flex-col rounded-lg border bg-card transition',
        registration.is_registered ? 'border-primary ring-1 ring-primary/40' : 'border-border',
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
        <span className="rounded bg-lime-accent px-2 py-0.5 text-xs font-bold text-pitch-950">
          {t('schedule.format', { n: game.format })}
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

        {/* Aksiyon */}
        <div className="mt-auto space-y-2">
          {hasStarted ? (
            <Button variant="outline" className="w-full" disabled>
              {t('schedule.started')}
            </Button>
          ) : registration.is_registered ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex flex-1 items-center gap-1.5 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {t('schedule.youAreIn')}
              </span>
              <Button variant="outline" size="sm" onClick={onUnregister} disabled={busy || !registration.can_unregister}>
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                {t('schedule.unregister')}
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={onRegister} disabled={!registration.is_open || busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {isFull ? t('schedule.full') : t('schedule.register')}
            </Button>
          )}
          {/* Kayıt kuralı (HS-37): kayıt ve kayıttan çıkma maç başlayana kadar açık */}
          {!hasStarted && <p className="text-center text-xs text-muted-foreground">{t('schedule.rule')}</p>}
        </div>
      </div>
    </article>
  )
}
