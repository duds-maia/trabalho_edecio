import type {
  AuthSession,
  ProviderRegistrationData,
  RegistrationData,
  User,
} from '../types/entities'
import { api } from './api'

interface LoginData {
  email: string
  senha: string
}

export const authService = {
  login: (data: LoginData) => api.post<AuthSession>('/auth/login', data),
  registerClient: (data: RegistrationData) =>
    api.post<{ usuario: User }>('/auth/client/register', data),
  registerProvider: (data: ProviderRegistrationData) =>
    api.post<{
      usuario: User
      prestador: {
        id: string
        statusAprovacao: 'PENDING'
        categoria: { id: number; name: string }
      }
    }>('/auth/provider/register', data),
}
