import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/api'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, Field, Input, Select } from '@/components/ui/form'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import { updateSettings } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store'
import type { UserSettings } from '@/types'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const settings = useAppSelector((s) => s.auth.user!.settings)

  function save(patch: Partial<UserSettings>) {
    const next = { ...settings, ...patch }
    if (patch.locale) void i18n.changeLanguage(patch.locale)
    void dispatch(updateSettings(next))
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-4xl font-extrabold uppercase">{t('settings.title')}</h1>

      <Card>
        <CardContent className="space-y-5 pt-4">
          <Field label={t('settings.language')} htmlFor="locale">
            <Select id="locale" value={i18n.resolvedLanguage} onChange={(e) => save({ locale: e.target.value })}>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('settings.theme')} htmlFor="theme">
            <Select
              id="theme"
              value={settings.theme}
              onChange={(e) => save({ theme: e.target.value as UserSettings['theme'] })}
            >
              <option value="light">{t('settings.light')}</option>
              <option value="dark">{t('settings.dark')}</option>
            </Select>
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t('settings.notifications')}</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--primary)]"
                checked={settings.notify_new_match}
                onChange={(e) => save({ notify_new_match: e.target.checked })}
              />
              {t('settings.notifyNewMatch')}
            </label>
          </fieldset>
        </CardContent>
      </Card>

      <ChangePasswordCard />
    </div>
  )
}

function ChangePasswordCard() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (next.length < 8) return setMessage({ tone: 'error', text: t('auth.passwordTooShort') })
    if (next !== confirm) return setMessage({ tone: 'error', text: t('auth.passwordMismatch') })

    setSaving(true)
    try {
      await api.updatePassword({ current_password: current, password: next })
      setMessage({ tone: 'success', text: t('settings.passwordUpdated') })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err, t('common.error')) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.changePassword')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <Field label={t('settings.currentPassword')} htmlFor="current">
            <Input id="current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label={t('settings.newPassword')} htmlFor="new">
            <Input id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          <Field label={t('auth.passwordConfirm')} htmlFor="confirm">
            <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={saving || !current}>
            {t('settings.updatePassword')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
