import type { Category } from '../types/entities'
import { api } from './api'

export const categoryService = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: { name: string; description?: string }) =>
    api.post<Category>('/categories', data),
  update: (id: number, data: { name: string; description?: string }) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) => api.delete<void>(`/categories/${id}`),
  remove: (id: number) => api.delete<void>(`/categories/${id}`),
}
