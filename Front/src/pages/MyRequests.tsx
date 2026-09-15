import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { RequestStatusBadge } from '../components/RequestStatusBadge'
import { requestService } from '../services/request.service'
import type { RequestStatus, ServiceRequest } from '../types/entities'
import { requestStatusLabels } from '../utils/requestStatus'
import { useAuth } from '../contexts/auth-context'

const statuses: RequestStatus[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export function MyRequests() {
  const { session } = useAuth()
  const isProvider = session?.usuario.perfil === 'PROVIDER'
  const [searchParams, setSearchParams] = useSearchParams()
  const rawStatus = searchParams.get('status')
  const status = statuses.includes(rawStatus as RequestStatus) ? rawStatus as RequestStatus : undefined
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    requestService.list(status)
      .then((response) => {
        if (isCurrent) setRequests(response.solicitacoes)
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar suas solicitações.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [status])

  function filterByStatus(nextStatus?: RequestStatus) {
    setIsLoading(true)
    setError('')
    setSearchParams(nextStatus ? { status: nextStatus } : {})
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">{isProvider ? 'Área do prestador' : 'Minha área'}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{isProvider ? 'Solicitações recebidas' : 'Minhas solicitações'}</h1>
        </div>
        {isProvider ? (
          <Link className="font-bold text-brand-700" to="/prestador">Voltar ao painel</Link>
        ) : (
          <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-bold text-white" to="/prestadores">Solicitar serviço</Link>
        )}
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar solicitações por status">
        <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${!status ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`} onClick={() => filterByStatus()}>Todas</button>
        {statuses.map((value) => (
          <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${status === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`} key={value} onClick={() => filterByStatus(value)}>{requestStatusLabels[value]}</button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? <Loading label="Carregando solicitações..." /> : error ? <ErrorState message={error} /> : requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-slate-900">Nenhuma solicitação encontrada</h2>
            <p className="mt-2 text-slate-500">{isProvider ? 'As solicitações enviadas diretamente para você aparecerão aqui.' : 'Quando você pedir um serviço, o acompanhamento aparecerá aqui.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {requests.map((request) => (
              <Link className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md" key={request.id} to={`/solicitacoes/${request.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-brand-700">Solicitação #{request.id}</p>
                    <h2 className="mt-1 text-lg font-black text-slate-900">{request.category.name}</h2>
                  </div>
                  <RequestStatusBadge status={request.status} />
                </div>
                <p className="mt-4 line-clamp-2 leading-6 text-slate-600">{request.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <span>{isProvider ? request.client.name : request.provider?.user.name || 'Profissional não informado'}</span>
                  <time dateTime={request.createdAt}>{new Intl.DateTimeFormat('pt-BR').format(new Date(request.createdAt))}</time>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
