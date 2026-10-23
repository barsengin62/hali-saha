import { useTranslation } from 'react-i18next'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { HighlightCard } from '@/components/HighlightCard'
import { useAsync } from '@/hooks/useAsync'

export function HighlightsPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.highlights(), [])

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl font-extrabold uppercase">{t('nav.highlights')}</h1>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((h) => <HighlightCard key={h.id} highlight={h} />)}
        </div>
      </AsyncState>
    </div>
  )
}
