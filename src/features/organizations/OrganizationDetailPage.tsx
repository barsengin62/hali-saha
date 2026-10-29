import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { Leaderboard } from '@/components/Leaderboard'
import { GameCard } from '@/components/GameCard'
import { TeamBadge } from '@/components/TeamBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/utils'

export function OrganizationDetailPage() {
  const { slug = '' } = useParams()
  const { t } = useTranslation()
  const [stat, setStat] = useState('goal')

  const page = useAsync(
    () => Promise.all([
        api.organization(slug),
        api.standings(slug),
        api.games({ organization: slug, status: ['played', 'analyzed'] }),
        api.statTypes(),
      ]),
    [slug],
  )
  const board = useAsync(() => api.leaderboard({ organization: slug, stat, limit: 10 }), [slug, stat])

  return (
    <AsyncState loading={page.loading} error={page.error} onRetry={page.reload}>
      {page.data &&
        (() => {
          const [org, standings, gamePage, statTypes] = page.data
          const activeType = statTypes.find((s) => s.slug === stat)
          return (
            <div className="space-y-6">
              <header>
                <h1 className="font-display text-4xl font-extrabold uppercase">{org.name}</h1>
                {org.description && <p className="text-muted-foreground">{org.description}</p>}
              </header>

              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('org.standings')}</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-sm">
                      <thead className="text-xs text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="py-2 text-left">#</th>
                          <th className="py-2 text-left">{t('org.team')}</th>
                          {(['played', 'won', 'drawn', 'lost', 'goalDiff', 'points'] as const).map((k) => (
                            <th key={k} className="py-2 text-center">{t(`org.${k}`)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {standings.map((row) => (
                          <tr key={row.team.id} className="border-b border-border last:border-0">
                            <td className="py-2.5 text-muted-foreground">{row.rank}</td>
                            <td className="py-2.5 font-medium"><TeamBadge team={row.team} /></td>
                            <td className="py-2.5 text-center">{row.played}</td>
                            <td className="py-2.5 text-center">{row.won}</td>
                            <td className="py-2.5 text-center">{row.drawn}</td>
                            <td className="py-2.5 text-center">{row.lost}</td>
                            <td className="py-2.5 text-center">{row.goal_difference}</td>
                            <td className="font-display py-2.5 text-center text-lg font-bold">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card className="self-start">
                  <CardHeader className="flex-col items-start">
                    <CardTitle>{t('org.leaderboard')}</CardTitle>
                    {/* İstatistik türleri dinamik: admin panelden eklenen her tür burada sekme olur */}
                    <div className="flex flex-wrap gap-1 pt-1" role="tablist">
                      {statTypes.map((s) => (
                        <button
                          key={s.id}
                          role="tab"
                          aria-selected={stat === s.slug}
                          onClick={() => setStat(s.slug)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium transition',
                            stat === s.slug ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {s.icon} {s.name}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AsyncState loading={board.loading} error={board.error} onRetry={board.reload}>
                      <Leaderboard rows={board.data ?? []} icon={activeType?.icon ?? undefined} />
                    </AsyncState>
                  </CardContent>
                </Card>
              </div>

              <section>
                <h2 className="font-display mb-3 text-2xl font-bold uppercase">{t('nav.games')}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {gamePage.data.map((g) => (
                    <GameCard key={g.id} game={g} />
                  ))}
                </div>
              </section>
            </div>
          )
        })()}
    </AsyncState>
  )
}
