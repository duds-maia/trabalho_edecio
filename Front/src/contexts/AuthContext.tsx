import {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { authService } from '../services/auth.service'
import { SESSION_EXPIRED_EVENT, SESSION_KEY } from '../services/api'
import type { AuthSession } from '../types/entities'
import { AuthContext, type AuthContextValue } from './auth-context'

function getStoredSession(): AuthSession | null {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY)
    return storedSession ? (JSON.parse(storedSession) as AuthSession) : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(getStoredSession)

  useEffect(() => {
    const expireSession = () => setSession(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      login: async (email, senha) => {
        const newSession = await authService.login({ email, senha })
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
        setSession(newSession)
        return newSession
      },
      logout: () => {
        localStorage.removeItem(SESSION_KEY)
        setSession(null)
      },
      updateUser: ({ nome }) => {
        setSession((currentSession) => {
          if (!currentSession) return null
          const updatedSession = {
            ...currentSession,
            usuario: { ...currentSession.usuario, nome },
          }
          localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession))
          return updatedSession
        })
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
