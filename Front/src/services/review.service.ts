import { api } from './api'

interface CreateReviewData {
  idSolicitacao: number
  nota: number
  comentario?: string
}

export const reviewService = {
  create: (data: CreateReviewData) =>
    api.post<{ avaliacao: { id: number } }>('/reviews', data),
}
