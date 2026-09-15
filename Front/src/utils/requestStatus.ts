import type { RequestStatus } from '../types/entities'

export const requestStatusLabels: Record<RequestStatus, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceita',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
}
