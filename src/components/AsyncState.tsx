import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'

/** Yükleniyor / hata durumlarını tek yerden gösterir. */
export function AsyncState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean
  error: unknown
  onRetry?: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>{t('common.loading')}</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-muted-foreground">{t('common.error')}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )}
      </div>
    )
  }
  return <>{children}</>
}
