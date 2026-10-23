import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Alert, Field, Input } from '@/components/ui/form'
import { env } from '@/lib/env'
import { login } from '@/store/authSlice'
import { useAppDispatch } from '@/store'

export function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await dispatch(login({ email, password }))
    setSubmitting(false)
    if (login.fulfilled.match(result)) navigate(from, { replace: true })
    else setError(t('auth.invalid'))
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold uppercase">{t('auth.login')}</h1>

      {env.useMock && <Alert>{t('auth.mockHint')}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        <Field label={t('auth.password')} htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            {t('auth.forgot')}
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={submitting || !email || !password}>
          {t('auth.login')}
        </Button>
      </form>
    </div>
  )
}
