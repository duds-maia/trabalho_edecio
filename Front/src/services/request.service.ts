import type { RequestStatus, ServiceRequest, ServiceType } from '../types/entities'
import { api } from './api'

export interface CreateRequestData {
  idCategoria: number
  idPrestador: string
  descricao: string
  endereco: string
  tipoAtendimento: ServiceType
  dataAgendamento?: string
  fotoUrl?: string
}

function statusQuery(status?: RequestStatus) {
  return status ? `?status=${encodeURIComponent(status)}` : ''
}

export const requestService = {
  create: (data: CreateRequestData) =>
    api.post<{ solicitacao: ServiceRequest }>('/requests', data),
  list: (status?: RequestStatus) =>
    api.get<{ solicitacoes: ServiceRequest[] }>(`/requests${statusQuery(status)}`),
  getById: (id: number) =>
    api.get<{ solicitacao: ServiceRequest }>(`/requests/${id}`),
  updateStatus: (id: number, status: RequestStatus) =>
    api.patch<{ solicitacao: ServiceRequest }>(`/requests/${id}/status`, { status }),
  accept: (id: number) =>
    api.patch<{ solicitacao: ServiceRequest }>(`/requests/${id}/provider`, {}),
  updateValue: (id: number, valorFinal: number) =>
    api.patch<{ solicitacao: ServiceRequest }>(`/requests/${id}/value`, { valorFinal }),
}
