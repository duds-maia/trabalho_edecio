import type { UserRole } from '../types/entities'

export function roleHome(role?: UserRole) {
  if (role === 'PROVIDER') return '/prestador'
  if (role === 'ADMIN') return '/admin'
  return '/minha-area'
}
