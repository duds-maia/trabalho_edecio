import { useEffect, useState } from 'react'
import { AdminNav } from '../components/AdminNav'
import { ApprovalStatusBadge } from '../components/ApprovalStatusBadge'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { adminService } from '../services/admin.service'
import type { ApprovalStatus, Provider } from '../types/entities'
import { approvalStatusLabels } from '../utils/approvalStatus'

type ProviderAction = 'approve' | 'reject' | 'suspend' | 'ban'

const statuses: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BANNED']
const actionLabels: Record<ProviderAction, string> = {
  approve: 'Aprovar',
  reject: 'Rejeitar',
  suspend: 'Suspender',
  ban: 'Banir',
}

function availableActions(status: ApprovalStatus): ProviderAction[] {
  if (status === 'PENDING') return ['approve', 'reject', 'ban']
  if (status === 'APPROVED') return ['suspend', 'ban']
  if (status === 'SUSPENDED') return ['ban']
  return []
}

export function AdminProviders() {
  const [status, setStatus] = useState<ApprovalStatus | undefined>('PENDING')
  const [providers, setProviders] = useState<Provider[]>([])
  const [pendingAction, setPendingAction] = useState<{ provider: Provider; action: ProviderAction } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isCurrent = true
    adminService.listProviders(status)
      .then((response) => { if (isCurrent) setProviders(response.prestadores) })
      .catch((loadError) => { if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os prestadores.') })
      .finally(() => { if (isCurrent) setIsLoading(false) })
    return () => { isCurrent = false }
  }, [status])

  function changeStatusFilter(nextStatus?: ApprovalStatus) {
    setStatus(nextStatus)
    setIsLoading(true)
    setError('')
    setSuccess('')
  }

  async function confirmAction() {
    if (!pendingAction) return
    setIsSubmitting(true)
    setError('')
    try {
      const response = await adminService.updateProviderStatus(pendingAction.provider.id, pendingAction.action)
      setProviders((current) => current.map((provider) => provider.id === response.prestador.id ? response.prestador : provider).filter((provider) => !status || provider.approvalStatus === status))
      setSuccess(`${response.prestador.user.name}: situação atualizada para ${approvalStatusLabels[response.prestador.approvalStatus].toLowerCase()}.`)
      setPendingAction(null)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível atualizar o prestador.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function toggleFeatured(provider: Provider) {
    setIsSubmitting(true)
    setError('')
    try {
      const response = await adminService.updateFeatured(provider.id, !provider.isFeatured)
      setProviders((current) => current.map((item) => item.id === response.prestador.id ? response.prestador : item))
      setSuccess(response.prestador.isFeatured ? `${provider.user.name} agora está em destaque.` : `${provider.user.name} foi removido dos destaques.`)
    } catch (featureError) {
      setError(featureError instanceof Error ? featureError.message : 'Não foi possível alterar o destaque.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Administração</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Gestão de prestadores</h1>
      <AdminNav />

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar prestadores por situação">
        <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${!status ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`} onClick={() => changeStatusFilter()}>Todos</button>
        {statuses.map((value) => <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${status === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`} key={value} onClick={() => changeStatusFilter(value)}>{approvalStatusLabels[value]}</button>)}
      </div>

      {error && <div className="mt-5"><ErrorState message={error} /></div>}
      {success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">{success}</div>}

      <div className="mt-6">
        {isLoading ? <Loading label="Carregando prestadores..." /> : providers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Nenhum prestador nesta situação.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {providers.map((provider) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={provider.id}>
                <div className="flex items-start justify-between gap-4">
                  <div><h2 className="text-lg font-black text-slate-900">{provider.user.name}</h2><p className="mt-1 text-sm text-slate-500">{provider.user.email}</p></div>
                  <ApprovalStatusBadge status={provider.approvalStatus} />
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="font-bold text-slate-500">Categoria</dt><dd className="mt-1 text-slate-900">{provider.category.name}</dd></div>
                  <div><dt className="font-bold text-slate-500">Endereço</dt><dd className="mt-1 text-slate-900">{provider.address || 'Não informado'}</dd></div>
                  <div><dt className="font-bold text-slate-500">Solicitações</dt><dd className="mt-1 text-slate-900">{provider._count?.requests ?? 0}</dd></div>
                  <div><dt className="font-bold text-slate-500">Avaliações</dt><dd className="mt-1 text-slate-900">{provider._count?.reviews ?? 0}</dd></div>
                </dl>

                {pendingAction?.provider.id === provider.id ? (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-bold text-amber-900">Confirmar: {actionLabels[pendingAction.action].toLowerCase()} {provider.user.name}?</p>
                    <p className="mt-1 text-sm text-amber-800">A API validará se esta mudança de situação é permitida.</p>
                    <div className="mt-4 flex flex-wrap gap-2"><Button disabled={isSubmitting} onClick={() => setPendingAction(null)} variant="secondary">Voltar</Button><Button disabled={isSubmitting} onClick={confirmAction}>{isSubmitting ? 'Atualizando...' : 'Confirmar'}</Button></div>
                  </div>
                ) : (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {availableActions(provider.approvalStatus).map((action) => <Button key={action} onClick={() => setPendingAction({ provider, action })} variant={action === 'approve' ? 'primary' : 'secondary'}>{actionLabels[action]}</Button>)}
                    {provider.approvalStatus === 'APPROVED' && <Button disabled={isSubmitting} onClick={() => toggleFeatured(provider)} variant="ghost">{provider.isFeatured ? 'Remover destaque' : 'Destacar'}</Button>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
