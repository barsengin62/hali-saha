import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Alert, Field, Input } from '@/components/ui/form'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err, t('common.error')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold uppercase">{t('auth.forgotTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.forgotHint')}</p>
      </div>

      {sent ? (
        <Alert tone="success">{t('auth.linkSent')}</Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Field label={t('auth.email')} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={submitting || !email}>
            {t('auth.sendLink')}
          </Button>
        </form>
      )}

      <Link to="/login" className="block text-center text-sm text-primary hover:underline">
        {t('auth.backToLogin')}
      </Link>
    </div>
  )
}
