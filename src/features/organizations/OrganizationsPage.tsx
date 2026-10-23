import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { useAsync } from '@/hooks/useAsync'

export function OrganizationsPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(() => api.organizations(), [])

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl font-extrabold uppercase">{t('nav.organizations')}</h1>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.map((org) => (
            <Link
              key={org.id}
              to={`/organizations/${org.slug}`}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 transition hover:border-primary/60 hover:shadow-md"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-pitch-800 text-lime-accent">
                <Trophy className="h-6 w-6" aria-hidden />
              </span>
              <span>
                <span className="font-display block text-xl font-bold uppercase">{org.name}</span>
                <span className="text-sm text-muted-foreground">{org.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}
