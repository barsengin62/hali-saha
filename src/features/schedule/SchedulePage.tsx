import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { Button } from '@/components/ui/button'
import { Alert, Input, Label } from '@/components/ui/form'
import { useAsync } from '@/hooks/useAsync'
import {
  addDays,
  formatDayHeading,
  formatShortRange,
  parseISODate,
  thisWeekRange,
  toISODate,
} from '@/lib/dates'
import { getErrorMessage } from '@/api/client'
import type { Game, RegistrationRequest } from '@/types'
import { ScheduledGameCard } from './ScheduledGameCard'

/**
 * Maç takvimi. Tarih aralığı URL'de tutulur (?from=2026-10-19&to=2026-10-25),
 * böylece link paylaşılabilir ve geri tuşu çalışır. Parametre yoksa bu hafta.
 */
export function SchedulePage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const defaults = thisWeekRange()
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const from = fromParam && parseISODate(fromParam) ? fromParam : defaults.from
  const to = toParam && parseISODate(toParam) ? toParam : defaults.to
  const fromDate = parseISODate(from)!
  const toDate = parseISODate(to)!
  const isThisWeek = from === defaults.from && to === defaults.to

  // Form alanları (kullanıcı "Göster"e basana kadar URL değişmez)
  const [draftFrom, setDraftFrom] = useState(from)
  const [draftTo, setDraftTo] = useState(to)
  const [rangeError, setRangeError] = useState<string | null>(null)
  useEffect(() => {
    setDraftFrom(from)
    setDraftTo(to)
  }, [from, to])

  const { data, loading, error, reload } = useAsync(() => api.schedule({ from, to }), [from, to])

  // Kayıt işlemleri kartı anında güncellesin diye yerel kopya
  const [items, setItems] = useState<Game[]>([])
  useEffect(() => {
    if (data) setItems(data)
  }, [data])

  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function setRange(nextFrom: string, nextTo: string) {
    setSearchParams({ from: nextFrom, to: nextTo })
  }

  function shiftWeek(direction: 1 | -1) {
    // Aralık uzunluğunu koruyarak kaydır (varsayılan 7 gün)
    const span = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1
    const step = span === 7 ? 7 : span
    setRange(toISODate(addDays(fromDate, step * direction)), toISODate(addDays(toDate, step * direction)))
  }

  function onApply(e: FormEvent) {
    e.preventDefault()
    const f = parseISODate(draftFrom)
    const tt = parseISODate(draftTo)
    if (!f || !tt || tt < f) {
      setRangeError(t('schedule.invalidRange'))
      return
    }
    setRangeError(null)
    setRange(draftFrom, draftTo)
  }

  /** Kayıt işlemi: kart anında güncellenir; hata olursa mesaj gösterilir ve liste yeniden çekilir */
  async function changeRegistration(game: Game, operation: () => Promise<Game>): Promise<boolean> {
    setBusyId(game.id)
    setActionError(null)
    try {
      const updated = await operation()
      setItems((list) => list.map((g) => (g.id === updated.id ? updated : g)))
      return true
    } catch (error) {
      // API'nin açıklayıcı mesajı (ör. "Kontenjan dolu."), yoksa genel mesaj
      setActionError(getErrorMessage(error, t('schedule.registerError')))
      reload() // güncel doluluğu tekrar çek
      return false
    } finally {
      setBusyId(null)
    }
  }

  // HS-42: talep gönder / geri çek
  const requestGame = (game: Game, body: RegistrationRequest) => changeRegistration(game, () => api.requestGame(game.id, body))
  const withdraw = (game: Game) => changeRegistration(game, () => api.withdrawFromGame(game.id))

  // Güne göre grupla
  const days = useMemo(() => {
    const groups = new Map<string, Game[]>()
    for (const g of items) {
      const key = toISODate(new Date(g.starts_at))
      groups.set(key, [...(groups.get(key) ?? []), g])
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [items])

  const todayKey = toISODate(new Date())

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold uppercase">{t('schedule.title')}</h1>
          <p className="text-muted-foreground">
            {formatShortRange(fromDate, toDate, i18n.language)}
            {data && ` · ${t('schedule.gameCount', { count: items.length })}`}
          </p>
        </div>

        {/* Hafta gezinme */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => shiftWeek(-1)} aria-label={t('schedule.prevWeek')} title={t('schedule.prevWeek')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant={isThisWeek ? 'default' : 'outline'} onClick={() => setRange(defaults.from, defaults.to)}>
            <CalendarDays className="h-4 w-4" aria-hidden />
            {t('schedule.thisWeek')}
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftWeek(1)} aria-label={t('schedule.nextWeek')} title={t('schedule.nextWeek')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Özel tarih aralığı */}
      <form onSubmit={onApply} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <div className="space-y-1">
          <Label htmlFor="from">{t('schedule.from')}</Label>
          <Input id="from" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className="w-auto" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">{t('schedule.to')}</Label>
          <Input id="to" type="date" value={draftTo} min={draftFrom} onChange={(e) => setDraftTo(e.target.value)} className="w-auto" />
        </div>
        <Button type="submit" variant="outline">
          {t('schedule.apply')}
        </Button>
        {rangeError && <p className="w-full text-sm text-destructive">{rangeError}</p>}
      </form>

      {actionError && <Alert tone="error">{actionError}</Alert>}

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {days.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
            {t('schedule.empty')}
          </div>
        ) : (
          <div className="space-y-8">
            {days.map(([dayKey, dayGames]) => (
              <section key={dayKey} aria-labelledby={`day-${dayKey}`}>
                <h2 id={`day-${dayKey}`} className="mb-3 flex items-center gap-2">
                  <span className="font-display text-2xl font-bold uppercase">
                    {formatDayHeading(parseISODate(dayKey)!, i18n.language)}
                  </span>
                  {dayKey === todayKey && (
                    <span className="rounded-full bg-lime-accent px-2 py-0.5 text-xs font-bold text-pitch-950">
                      {t('schedule.today')}
                    </span>
                  )}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {dayGames.map((g) => (
                    <ScheduledGameCard
                      key={g.id}
                      game={g}
                      busy={busyId === g.id}
                      onRequest={(body) => requestGame(g, body)}
                      onWithdraw={() => void withdraw(g)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </AsyncState>
    </div>
  )
}
