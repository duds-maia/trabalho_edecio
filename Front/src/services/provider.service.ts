import type { Provider, Review, ReviewSummary } from '../types/entities'
import { api } from './api'

interface ProviderFilters {
  search?: string
  categoryId?: number
}

interface ProviderReviews {
  avaliacaoMedia: number | string
  avaliacoes: Review[]
}

interface ProviderUpdate {
  nome?: string
  telefone?: string | null
  endereco?: string | null
  idCategoria?: number
}

function buildQuery(filters: ProviderFilters) {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set('search', filters.search.trim())
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId))

  const query = params.toString()
  return query ? `?${query}` : ''
}

export const providerService = {
  list: (filters: ProviderFilters = {}) =>
    api.get<Provider[]>(`/providers${buildQuery(filters)}`),
  getById: (id: string) => api.get<Provider>(`/providers/${id}`),
  getReviews: (id: string) =>
    api.get<ProviderReviews>(`/providers/${id}/reviews`),
  getReviewSummary: (id: string) =>
    api.get<ReviewSummary>(`/providers/${id}/review-summary`),
  update: (id: string, data: ProviderUpdate) =>
    api.put<Provider>(`/providers/${id}`, data),
  updateAvailability: (id: string, disponivel: boolean) =>
    api.patch<Provider>(`/providers/${id}/status`, { disponivel }),
}
