import { useTranslation } from 'react-i18next'
import type { Team } from '@/types'
import { cn } from '@/lib/utils'

/** Takım rengiyle forma şeklinde küçük rozet + isim */
export function TeamBadge({ team, className, align = 'left' }: { team: Team; className?: string; align?: 'left' | 'right' }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', align === 'right' && 'flex-row-reverse', className)}>
      <span
        aria-hidden
        className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
        style={{ backgroundColor: team.color }}
      />
      <span className="truncate">{team.name}</span>
    </span>
  )
}

/** Takım henüz belli değilse (null) "Belirlenecek" yazar */
export function TeamOrTbd({ team, className, align = 'left' }: { team: Team | null; className?: string; align?: 'left' | 'right' }) {
  const { t } = useTranslation()
  if (team) return <TeamBadge team={team} className={className} align={align} />
  return <span className={cn('italic text-muted-foreground', className)}>{t('schedule.tbd')}</span>
}
