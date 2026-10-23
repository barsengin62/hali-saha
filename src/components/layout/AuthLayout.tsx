import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { SUPPORTED_LANGUAGES } from '@/i18n'

/** Login / şifremi unuttum / şifre sıfırlama sayfalarının ortak düzeni */
export function AuthLayout() {
  const { t, i18n } = useTranslation()

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="pitch-pattern relative hidden flex-col justify-between p-10 text-chalk lg:flex">
        <div className="font-display flex items-center gap-2 text-3xl font-extrabold uppercase">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-lime-accent text-base text-pitch-950">⚽</span>
          {t('app.name')}
        </div>
        <p className="font-display max-w-md text-5xl font-extrabold uppercase leading-[0.95]">
          {t('app.tagline')}
        </p>
        <div className="flex gap-6 text-sm text-chalk/70">
          <span>⚽ Gol</span>
          <span>👟 Asist</span>
          <span>🧤 Kurtarış</span>
          <span>🎬 Highlight</span>
        </div>
      </aside>

      <section className="flex flex-col">
        <div className="flex justify-end gap-1 p-4">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => i18n.changeLanguage(l.code)}
              className={`rounded px-2 py-1 text-xs font-medium uppercase ${
                i18n.resolvedLanguage === l.code ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {l.code}
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </section>
    </div>
  )
}
