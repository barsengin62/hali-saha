import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '@/api'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Alert, Field, Input } from '@/components/ui/form'

/**
 * Laravel'in gönderdiği e-postadaki bağlantı:
 *   https://site/reset-password/{token}?email=kullanici@ornek.com
 * Fortify'da bu URL'yi frontend'e yönlendirmek için
 * ResetPassword::createUrlUsing(...) kullanılır.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation()
  const { token = '' } = useParams()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError(t('auth.passwordTooShort'))
    if (password !== confirm) return setError(t('auth.passwordMismatch'))

    setSubmitting(true)
    try {
      await api.resetPassword({ token, email, password })
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err, t('common.error')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold uppercase">{t('auth.resetTitle')}</h1>

      {done ? (
        <Alert tone="success">{t('auth.resetDone')}</Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <Field label={t('auth.email')} htmlFor="email">
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t('auth.password')} htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label={t('auth.passwordConfirm')} htmlFor="confirm">
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={submitting}>
            {t('auth.resetSubmit')}
          </Button>
        </form>
      )}

      <Link to="/login" className="block text-center text-sm text-primary hover:underline">
        {t('auth.backToLogin')}
      </Link>
    </div>
  )
}
