import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminNav } from '../components/AdminNav'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { RequestStatusBadge } from '../components/RequestStatusBadge'
import { adminService } from '../services/admin.service'
import type { RequestStatus, ServiceRequest } from '../types/entities'
import { requestStatusLabels } from '../utils/requestStatus'

const statuses: RequestStatus[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export function AdminRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [status, setStatus] = useState<RequestStatus | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService.listRequests()
      .then((response) => setRequests(response.solicitacoes))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as solicitações.'))
      .finally(() => setIsLoading(false))
  }, [])

  const visibleRequests = useMemo(
    () => status ? requests.filter((request) => request.status === status) : requests,
    [requests, status],
  )

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Administração</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Todas as solicitações</h1>
      <AdminNav />

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar solicitações por status">
        <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${!status ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`} onClick={() => setStatus(undefined)}>Todas</button>
        {statuses.map((value) => <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${status === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`} key={value} onClick={() => setStatus(value)}>{requestStatusLabels[value]}</button>)}
      </div>

      <div className="mt-6">
        {isLoading ? <Loading label="Carregando solicitações..." /> : error ? <ErrorState message={error} /> : visibleRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Nenhuma solicitação encontrada.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleRequests.map((request) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={request.id}>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-bold text-brand-700">Solicitação #{request.id}</p><h2 className="mt-1 text-lg font-black text-slate-900">{request.category.name}</h2></div>
                  <RequestStatusBadge status={request.status} />
                </div>
                <p className="mt-4 line-clamp-2 leading-6 text-slate-600">{request.description}</p>
                <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                  <div><dt className="font-bold text-slate-500">Cliente</dt><dd className="mt-1 text-slate-900">{request.client.name}</dd></div>
                  <div><dt className="font-bold text-slate-500">Prestador</dt><dd className="mt-1 text-slate-900">{request.provider?.user.name || 'Não informado'}</dd></div>
                  <div><dt className="font-bold text-slate-500">Criada em</dt><dd className="mt-1 text-slate-900">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(request.createdAt))}</dd></div>
                  <div><dt className="font-bold text-slate-500">Valor final</dt><dd className="mt-1 text-slate-900">{request.finalPrice === null ? 'Não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(request.finalPrice))}</dd></div>
                </dl>
                <Link className="mt-4 inline-flex text-sm font-bold text-brand-700" to={`/solicitacoes/${request.id}`}>Ver detalhes →</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
