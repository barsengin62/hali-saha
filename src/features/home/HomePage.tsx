import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { HighlightCard } from '@/components/HighlightCard'
import { Leaderboard } from '@/components/Leaderboard'
import { GameCard } from '@/components/GameCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsync } from '@/hooks/useAsync'
import { useAppSelector } from '@/store'

export function HomePage() {
  const { t } = useTranslation()
  const user = useAppSelector((s) => s.auth.user)

  const { data, loading, error, reload } = useAsync(
    () =>
      Promise.all([
        api.games({ status: ['played', 'analyzed'], per_page: 6 }),
        api.highlights({ per_page: 3 }),
        api.leaderboard({ stat: 'goal', limit: 5 }),
      ]),
    [],
  )

  return (
    <div className="space-y-8">
      <section className="pitch-pattern overflow-hidden rounded-xl px-6 py-10 text-chalk">
        <p className="text-sm text-chalk/70">{user?.name}</p>
        <h1 className="font-display mt-1 text-4xl font-extrabold uppercase leading-none sm:text-5xl">
          {t('app.tagline')}
        </h1>
      </section>

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              <section>
                <h2 className="font-display mb-3 text-2xl font-bold uppercase">{t('home.recentGames')}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data[0].data.map((g) => (
                    <GameCard key={g.id} game={g} />
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-display text-2xl font-bold uppercase">{t('home.latestHighlights')}</h2>
                  <Link to="/highlights" className="text-sm text-primary hover:underline">
                    {t('home.seeAll')}
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {data[1].data.map((h) => (
                    <HighlightCard key={h.id} highlight={h} />
                  ))}
                </div>
              </section>
            </div>

            <Card className="self-start">
              <CardHeader>
                <CardTitle>{t('home.topScorers')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard rows={data[2]} icon="⚽" />
              </CardContent>
            </Card>
          </div>
        )}
      </AsyncState>
    </div>
  )
}
