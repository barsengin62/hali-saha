import { CalendarDays, Film, Home, LogOut, Menu, Settings, Trophy, User, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

const links = [
  { to: '/', key: 'nav.home', icon: Home, end: true },
  { to: '/schedule', key: 'nav.schedule', icon: CalendarDays },
  { to: '/organizations', key: 'nav.organizations', icon: Trophy },
  { to: '/highlights', key: 'nav.highlights', icon: Film },
  { to: '/profile', key: 'nav.profile', icon: User },
  { to: '/settings', key: 'nav.settings', icon: Settings },
] as const

export function AppLayout() {
  const { t } = useTranslation()
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await dispatch(logout())
    navigate('/login', { replace: true })
  }

  const nav = (
    <nav className="flex flex-col gap-1 md:flex-row md:items-center">
      {links.map(({ to, key, icon: Icon, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={'end' in rest}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-chalk/80 transition hover:bg-white/10 hover:text-chalk',
              isActive && 'bg-white/10 text-lime-accent',
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-pitch-950 text-chalk shadow">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <NavLink to="/" className="font-display flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-lime-accent text-sm text-pitch-950">⚽</span>
            {t('app.name')}
          </NavLink>

          <div className="hidden md:block">{nav}</div>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-chalk/70 lg:inline">{user?.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-chalk hover:bg-white/10 md:inline-flex"
              onClick={handleLogout}
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-chalk hover:bg-white/10 md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
            {nav}
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-chalk/80 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {t('nav.logout')}
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
