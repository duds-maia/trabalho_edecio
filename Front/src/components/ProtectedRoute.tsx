import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import type { UserRole } from '../types/entities'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, session } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: `${location.pathname}${location.search}` }} to="/entrar" />
  }

  if (allowedRoles && session && !allowedRoles.includes(session.usuario.perfil)) {
    return <Navigate replace to="/minha-area" />
  }

  return <Outlet />
}
