import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/api'
import { AsyncState } from '@/components/AsyncState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, Field, Input } from '@/components/ui/form'
import { useAsync } from '@/hooks/useAsync'
import { updateProfile } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store'
import { PlayerView } from '../players/PlayerPage'

export function ProfilePage() {
  const { t } = useTranslation()
  const user = useAppSelector((s) => s.auth.user)!
  const dispatch = useAppDispatch()

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Kullanıcı bir oyuncu kaydına bağlıysa istatistiklerini göster
  const stats = useAsync(
    () => (user.player_id ? api.player(user.player_id) : Promise.resolve(null)),
    [user.player_id],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const result = await dispatch(updateProfile({ name, email }))
    setSaving(false)
    setSaved(updateProfile.fulfilled.match(result))
  }

  return (
    <div className="space-y-8">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t('profile.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {saved && <Alert tone="success">{t('profile.saved')}</Alert>}
            <Field label={t('profile.name')} htmlFor="name">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label={t('auth.email')} htmlFor="email">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={saving}>
              {t('profile.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {user.player_id && (
        <section>
          <h2 className="font-display mb-3 text-3xl font-extrabold uppercase">{t('profile.myStats')}</h2>
          <AsyncState loading={stats.loading} error={stats.error} onRetry={stats.reload}>
            {stats.data && <PlayerView stats={stats.data} />}
          </AsyncState>
        </section>
      )}
    </div>
  )
}
