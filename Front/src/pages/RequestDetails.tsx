import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { RequestStatusBadge } from '../components/RequestStatusBadge'
import { useAuth } from '../contexts/auth-context'
import { ApiError } from '../services/api'
import { requestService } from '../services/request.service'
import { reviewService } from '../services/review.service'
import type { ServiceRequest } from '../types/entities'
import { hasReviewedRequest, markRequestAsReviewed } from '../utils/reviewedRequests'

interface LocationState {
  success?: string
}

export function RequestDetails() {
  const { session } = useAuth()
  const isClient = session?.usuario.perfil === 'CLIENT'
  const isProvider = session?.usuario.perfil === 'PROVIDER'
  const isAdmin = session?.usuario.perfil === 'ADMIN'
  const { id = '' } = useParams()
  const location = useLocation()
  const requestId = Number(id)
  const isValidRequestId = Number.isInteger(requestId) && requestId > 0
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(isValidRequestId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [reviewSent, setReviewSent] = useState(() => hasReviewedRequest(requestId))
  const [pendingProviderAction, setPendingProviderAction] = useState<'ACCEPT' | 'IN_PROGRESS' | 'COMPLETED' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState((location.state as LocationState | null)?.success || '')

  useEffect(() => {
    if (!isValidRequestId) return
    requestService.getById(requestId)
      .then((response) => setRequest(response.solicitacao))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a solicitação.'))
      .finally(() => setIsLoading(false))
  }, [isValidRequestId, requestId])

  async function cancelRequest() {
    if (!request) return
    setIsSubmitting(true)
    setError('')
    try {
      const response = await requestService.updateStatus(request.id, 'CANCELLED')
      setRequest(response.solicitacao)
      setConfirmingCancel(false)
      setSuccess('Solicitação cancelada.')
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Não foi possível cancelar a solicitação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!request) return
    setIsSubmitting(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await reviewService.create({
        idSolicitacao: request.id,
        nota: Number(form.get('nota')),
        comentario: String(form.get('comentario')).trim() || undefined,
      })
      markRequestAsReviewed(request.id)
      setReviewSent(true)
      setSuccess('Avaliação enviada. Obrigado por compartilhar sua experiência.')
    } catch (reviewError) {
      if (reviewError instanceof ApiError && reviewError.status === 409) {
        markRequestAsReviewed(request.id)
        setReviewSent(true)
      }
      setError(reviewError instanceof Error ? reviewError.message : 'Não foi possível enviar a avaliação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function runProviderAction(action: 'ACCEPT' | 'IN_PROGRESS' | 'COMPLETED') {
    if (!request) return
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const response = action === 'ACCEPT'
        ? await requestService.accept(request.id)
        : await requestService.updateStatus(request.id, action)
      setRequest(response.solicitacao)
      setPendingProviderAction(null)
      setSuccess(action === 'ACCEPT' ? 'Solicitação aceita.' : action === 'IN_PROGRESS' ? 'Atendimento iniciado.' : 'Atendimento concluído.')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível atualizar o atendimento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function updateFinalValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!request) return
    const form = new FormData(event.currentTarget)
    const value = Number(form.get('valorFinal'))
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const response = await requestService.updateValue(request.id, value)
      setRequest(response.solicitacao)
      setSuccess('Valor final atualizado.')
    } catch (valueError) {
      setError(valueError instanceof Error ? valueError.message : 'Não foi possível informar o valor final.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Loading label="Carregando solicitação..." />
  if (!isValidRequestId) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message="Solicitação inválida." /></div>
  if (!request) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message={error || 'Solicitação não encontrada.'} /></div>

  const returnPath = isProvider ? '/prestador/solicitacoes' : isAdmin ? '/admin/solicitacoes' : '/minhas-solicitacoes'
  const returnLabel = isProvider ? 'Solicitações recebidas' : isAdmin ? 'Todas as solicitações' : 'Minhas solicitações'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Link className="text-sm font-bold text-brand-700" to={returnPath}>← {returnLabel}</Link>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-bold text-brand-700">Solicitação #{request.id}</p><h1 className="mt-1 text-3xl font-black text-slate-900">{request.category.name}</h1></div>
        <RequestStatusBadge status={request.status} />
      </div>

      {success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">{success}</div>}
      {error && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</div>}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2"><dt className="text-sm font-bold text-slate-500">Descrição</dt><dd className="mt-1 leading-7 text-slate-900">{request.description}</dd></div>
          <div><dt className="text-sm font-bold text-slate-500">Profissional</dt><dd className="mt-1 font-semibold text-slate-900">{request.provider?.user.name || 'Não informado'}</dd></div>
          <div><dt className="text-sm font-bold text-slate-500">Endereço</dt><dd className="mt-1 text-slate-900">{request.address}</dd></div>
          <div><dt className="text-sm font-bold text-slate-500">Atendimento</dt><dd className="mt-1 text-slate-900">{request.serviceType === 'IMMEDIATE' ? 'O quanto antes' : `Agendado para ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.scheduledAt!))}`}</dd></div>
          <div><dt className="text-sm font-bold text-slate-500">Valor final</dt><dd className="mt-1 text-slate-900">{request.finalPrice === null ? 'Ainda não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(request.finalPrice))}</dd></div>
          {request.photoUrl && <div className="sm:col-span-2"><dt className="text-sm font-bold text-slate-500">Foto de referência</dt><dd className="mt-1"><a className="break-all font-semibold text-brand-700 underline" href={request.photoUrl} rel="noreferrer" target="_blank">Abrir imagem enviada</a></dd></div>}
        </dl>

        {isClient && request.status === 'PENDING' && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            {confirmingCancel ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="font-bold text-red-900">Cancelar esta solicitação?</p>
                <p className="mt-1 text-sm text-red-700">O profissional deixará de poder aceitar o atendimento.</p>
                <div className="mt-4 flex flex-wrap gap-3"><Button disabled={isSubmitting} onClick={() => setConfirmingCancel(false)} variant="secondary">Manter solicitação</Button><Button className="bg-red-600 hover:bg-red-700" disabled={isSubmitting} onClick={cancelRequest}>{isSubmitting ? 'Cancelando...' : 'Confirmar cancelamento'}</Button></div>
              </div>
            ) : <Button onClick={() => setConfirmingCancel(true)} variant="secondary">Cancelar solicitação</Button>}
          </div>
        )}

        {isProvider && !['CANCELLED', 'COMPLETED'].includes(request.status) && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="text-lg font-black text-slate-900">Próxima ação</h2>
            <p className="mt-1 text-sm text-slate-500">As ações seguem a ordem do atendimento e não podem ser desfeitas.</p>
            {pendingProviderAction ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-bold text-amber-900">Confirmar esta mudança no atendimento?</p>
                <p className="mt-1 text-sm text-amber-800">{pendingProviderAction === 'ACCEPT' ? 'A solicitação ficará vinculada ao seu atendimento.' : pendingProviderAction === 'IN_PROGRESS' ? 'O cliente verá que o serviço foi iniciado.' : 'O atendimento será marcado como concluído e poderá ser avaliado.'}</p>
                <div className="mt-4 flex flex-wrap gap-2"><Button disabled={isSubmitting} onClick={() => setPendingProviderAction(null)} variant="secondary">Voltar</Button><Button disabled={isSubmitting} onClick={() => runProviderAction(pendingProviderAction)}>{isSubmitting ? 'Atualizando...' : 'Confirmar'}</Button></div>
              </div>
            ) : (
              <div className="mt-4">
                {request.status === 'PENDING' && <Button onClick={() => setPendingProviderAction('ACCEPT')}>Aceitar solicitação</Button>}
                {request.status === 'ACCEPTED' && <Button onClick={() => setPendingProviderAction('IN_PROGRESS')}>Iniciar atendimento</Button>}
                {request.status === 'IN_PROGRESS' && <Button onClick={() => setPendingProviderAction('COMPLETED')}>Concluir atendimento</Button>}
              </div>
            )}
          </div>
        )}
      </section>

      {isProvider && ['IN_PROGRESS', 'COMPLETED'].includes(request.status) && (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-slate-900">Valor final</h2>
          <p className="mt-1 text-sm text-slate-500">Informe o total combinado com o cliente.</p>
          <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={updateFinalValue}>
            <label className="flex-1"><span className="mb-2 block text-sm font-semibold text-slate-700">Valor em reais</span><input className="min-h-12 w-full rounded-xl border border-slate-200 px-4" defaultValue={request.finalPrice === null ? '' : String(request.finalPrice)} min="0.01" name="valorFinal" required step="0.01" type="number" /></label>
            <Button disabled={isSubmitting} type="submit">{isSubmitting ? 'Salvando...' : 'Salvar valor'}</Button>
          </form>
        </section>
      )}

      {isClient && request.status === 'COMPLETED' && !reviewSent && (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-slate-900">Avalie o atendimento</h2>
          <p className="mt-1 text-sm text-slate-500">Sua avaliação ajuda outras pessoas a escolher.</p>
          <form className="mt-5 space-y-5" onSubmit={submitReview}>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Nota</span><select className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4" defaultValue="5" name="nota" required><option value="5">5 — Excelente</option><option value="4">4 — Muito bom</option><option value="3">3 — Bom</option><option value="2">2 — Ruim</option><option value="1">1 — Muito ruim</option></select></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Comentário (opcional)</span><textarea className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3" maxLength={1000} minLength={3} name="comentario" placeholder="Conte como foi o atendimento" /></label>
            <Button disabled={isSubmitting} type="submit">{isSubmitting ? 'Enviando...' : 'Enviar avaliação'}</Button>
          </form>
        </section>
      )}
    </div>
  )
}
