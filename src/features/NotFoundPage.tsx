import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-8xl font-extrabold text-primary">404</p>
      <p className="text-muted-foreground">{t('common.notFound')}</p>
      <Link to="/" className={buttonVariants()}>
        {t('common.goHome')}
      </Link>
    </div>
  )
}
