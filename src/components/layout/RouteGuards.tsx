import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store'

function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  )
}

/** Sadece giriş yapmış kullanıcılar. Değilse login'e, geri dönüş adresiyle yönlendirir. */
export function ProtectedRoute() {
  const status = useAppSelector((s) => s.auth.status)
  const location = useLocation()

  if (status === 'idle' || status === 'checking') return <FullScreenLoader />
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** Sadece misafirler (login, şifremi unuttum). Giriş yapmışsa ana sayfaya atar. */
export function GuestRoute() {
  const status = useAppSelector((s) => s.auth.status)

  if (status === 'idle' || status === 'checking') return <FullScreenLoader />
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <Outlet />
}
