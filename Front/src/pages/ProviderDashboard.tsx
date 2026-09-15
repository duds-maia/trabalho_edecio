import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApprovalStatusBadge } from '../components/ApprovalStatusBadge'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { useAuth } from '../contexts/auth-context'
import { providerService } from '../services/provider.service'
import { requestService } from '../services/request.service'
import type { ApprovalStatus, Provider, ServiceRequest } from '../types/entities'

export function ProviderDashboard() {
  const { session } = useAuth()
  const providerId = session?.prestador?.id || ''
  const [provider, setProvider] = useState<Provider | null>(null)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(providerId))
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!providerId) return
    Promise.allSettled([
      providerService.getById(providerId),
      requestService.list(),
    ]).then(([providerResult, requestsResult]) => {
      if (providerResult.status === 'fulfilled') setProvider(providerResult.value)
      if (requestsResult.status === 'fulfilled') setRequests(requestsResult.value.solicitacoes)
    }).finally(() => setIsLoading(false))
  }, [providerId])

  async function toggleAvailability() {
    if (!provider) return
    setIsUpdating(true)
    setError('')
    try {
      const updatedProvider = await providerService.updateAvailability(provider.id, !provider.isAvailable)
      setProvider((current) => current ? { ...current, isAvailable: updatedProvider.isAvailable } : current)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível alterar sua disponibilidade.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) return <Loading label="Carregando painel..." />

  const approvalStatus: ApprovalStatus = provider?.approvalStatus || session?.prestador?.statusAprovacao || 'PENDING'
  const counts = {
    pending: requests.filter((request) => request.status === 'PENDING').length,
    active: requests.filter((request) => ['ACCEPTED', 'IN_PROGRESS'].includes(request.status)).length,
    completed: requests.filter((request) => request.status === 'COMPLETED').length,
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Área do prestador</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Painel de atendimentos</h1>
        </div>
        <Link className="font-bold text-brand-700" to="/prestador/perfil">Editar perfil</Link>
      </div>

      {error && <div className="mt-5"><ErrorState message={error} /></div>}

      <section className="mt-7 grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-slate-900">Situação do cadastro</h2>
            <ApprovalStatusBadge status={approvalStatus} />
          </div>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            {approvalStatus === 'APPROVED'
              ? 'Defina quando você pode receber novas solicitações.'
              : 'Você poderá receber e operar solicitações quando o administrador aprovar o cadastro.'}
          </p>
        </div>
        <Button disabled={!provider || approvalStatus !== 'APPROVED' || isUpdating} onClick={toggleAvailability} variant={provider?.isAvailable ? 'secondary' : 'primary'}>
          {isUpdating ? 'Atualizando...' : provider?.isAvailable ? 'Ficar indisponível' : 'Ficar disponível'}
        </Button>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Pendentes', counts.pending, 'Aguardam seu aceite'],
          ['Em atendimento', counts.active, 'Aceitas ou em andamento'],
          ['Concluídas', counts.completed, 'Serviços finalizados'],
        ].map(([label, value, description]) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-5" key={label}>
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-6">
        <h2 className="text-lg font-black text-slate-900">Gerencie seus pedidos</h2>
        <p className="mt-2 text-slate-600">Aceite solicitações, inicie o atendimento, informe o valor e conclua o serviço.</p>
        <Link className={`mt-4 inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold ${approvalStatus === 'APPROVED' ? 'bg-brand-600 text-white' : 'pointer-events-none bg-slate-200 text-slate-500'}`} aria-disabled={approvalStatus !== 'APPROVED'} to="/prestador/solicitacoes">Ver solicitações</Link>
      </div>
    </div>
  )
}
