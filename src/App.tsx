import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { GuestRoute, ProtectedRoute } from '@/components/layout/RouteGuards'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { HighlightsPage } from '@/features/highlights/HighlightsPage'
import { HomePage } from '@/features/home/HomePage'
import { GameDetailPage } from '@/features/games/GameDetailPage'
import { NotFoundPage } from '@/features/NotFoundPage'
import { OrganizationDetailPage } from '@/features/organizations/OrganizationDetailPage'
import { OrganizationsPage } from '@/features/organizations/OrganizationsPage'
import { PlayerPage } from '@/features/players/PlayerPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { SchedulePage } from '@/features/schedule/SchedulePage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { fetchMe } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store'

const router = createBrowserRouter(
  [
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
    ],
  },
  // Şifre sıfırlama, giriş yapmış olsa bile açılabilmeli
  {
    element: <AuthLayout />,
    children: [{ path: '/reset-password/:token', element: <ResetPasswordPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/schedule', element: <SchedulePage /> },
          { path: '/organizations', element: <OrganizationsPage /> },
          { path: '/organizations/:slug', element: <OrganizationDetailPage /> },
          { path: '/games/:id', element: <GameDetailPage /> },
          { path: '/players/:id', element: <PlayerPage /> },
          { path: '/highlights', element: <HighlightsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
  ],
  // GitHub Pages alt yolu (/hali-saha/) — vite.config.ts içindeki `base` değerinden gelir
  { basename: import.meta.env.BASE_URL },
)

export default function App() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((s) => s.auth.user?.settings.theme ?? 'light')

  // Açılışta oturumu kontrol et
  useEffect(() => {
    void dispatch(fetchMe())
  }, [dispatch])

  // Kullanıcının tema tercihini uygula
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return <RouterProvider router={router} />
}
