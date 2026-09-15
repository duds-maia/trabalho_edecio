import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { Input } from '../components/Input'
import { Loading } from '../components/Loading'
import { useAuth } from '../contexts/auth-context'
import { clientService } from '../services/client.service'
import { providerService } from '../services/provider.service'
import { requestService, type CreateRequestData } from '../services/request.service'
import type { Provider, ServiceType } from '../types/entities'

interface RequestDraft extends CreateRequestData {
  dataLocal?: string
}

function toLocalDateTimeValue(date: Date) {
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 16)
}

export function NewRequest() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const providerId = searchParams.get('prestador') || ''
  const categoryId = Number(searchParams.get('categoria'))
  const [provider, setProvider] = useState<Provider | null>(null)
  const [defaultAddress, setDefaultAddress] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('IMMEDIATE')
  const [minimumScheduleDate] = useState(() => toLocalDateTimeValue(new Date(Date.now() + 60_000)))
  const [draft, setDraft] = useState<RequestDraft | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(providerId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!providerId) return
    let isCurrent = true

    const profileRequest = session
      ? clientService.getById(session.usuario.id).catch(() => null)
      : Promise.resolve(null)

    Promise.all([providerService.getById(providerId), profileRequest])
      .then(([providerData, profileData]) => {
        if (!isCurrent) return
        setProvider(providerData)
        setDefaultAddress(profileData?.cliente.endereco || '')
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o profissional.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [providerId, session])

  function prepareConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const selectedType = String(form.get('tipoAtendimento')) as ServiceType
    const localDate = String(form.get('dataAgendamento') || '')

    if (selectedType === 'SCHEDULED' && (!localDate || new Date(localDate) <= new Date())) {
      setError('Escolha uma data e hora futuras para o atendimento agendado.')
      return
    }

    const nextDraft: RequestDraft = {
      idCategoria: categoryId,
      idPrestador: providerId,
      descricao: String(form.get('descricao')).trim(),
      endereco: String(form.get('endereco')).trim(),
      tipoAtendimento: selectedType,
      fotoUrl: String(form.get('fotoUrl')).trim() || undefined,
      ...(selectedType === 'SCHEDULED' ? {
        dataAgendamento: new Date(localDate).toISOString(),
        dataLocal: localDate,
      } : {}),
    }
    setDraft(nextDraft)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function confirmRequest() {
    if (!draft) return
    setError('')
    setIsSubmitting(true)
    try {
      const { dataLocal: _dataLocal, ...requestData } = draft
      void _dataLocal
      const response = await requestService.create(requestData)
      navigate(`/solicitacoes/${response.solicitacao.id}`, {
        replace: true,
        state: { success: 'Solicitação enviada ao profissional.' },
      })
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'Não foi possível enviar a solicitação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!providerId || !categoryId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-black text-slate-900">Escolha primeiro um profissional</h1>
        <p className="mt-3 leading-7 text-slate-600">A solicitação precisa ser enviada diretamente para um profissional disponível.</p>
        <Link className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-600 px-6 font-bold text-white" to="/prestadores">Ver profissionais</Link>
      </div>
    )
  }

  if (isLoading) return <Loading label="Preparando sua solicitação..." />
  if (!provider) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message={error || 'Profissional não encontrado.'} /></div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Nova solicitação</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{draft ? 'Revise antes de enviar' : 'Conte o que você precisa'}</h1>

      <section className="mt-7 flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white font-black text-brand-700">{provider.user.name.slice(0, 1)}</div>
        <div>
          <p className="font-bold text-slate-900">{provider.user.name}</p>
          <p className="text-sm text-slate-600">{provider.category.name}</p>
        </div>
        {!draft && <Link className="ml-auto text-sm font-bold text-brand-700" to="/prestadores">Trocar</Link>}
      </section>

      {error && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</div>}

      {draft ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><dt className="text-sm font-bold text-slate-500">Descrição</dt><dd className="mt-1 leading-7 text-slate-900">{draft.descricao}</dd></div>
            <div><dt className="text-sm font-bold text-slate-500">Endereço</dt><dd className="mt-1 text-slate-900">{draft.endereco}</dd></div>
            <div><dt className="text-sm font-bold text-slate-500">Quando</dt><dd className="mt-1 text-slate-900">{draft.tipoAtendimento === 'IMMEDIATE' ? 'O quanto antes' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(draft.dataAgendamento!))}</dd></div>
            {draft.fotoUrl && <div className="sm:col-span-2"><dt className="text-sm font-bold text-slate-500">Foto de referência</dt><dd className="mt-1 break-all text-brand-700">{draft.fotoUrl}</dd></div>}
          </dl>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button disabled={isSubmitting} onClick={() => setDraft(null)} variant="secondary">Editar dados</Button>
            <Button disabled={isSubmitting} onClick={confirmRequest}>{isSubmitting ? 'Enviando...' : 'Confirmar e enviar'}</Button>
          </div>
        </section>
      ) : (
        <form className="mt-6 space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" onSubmit={prepareConfirmation}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">O que precisa ser feito?</span>
            <textarea className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base" minLength={10} name="descricao" placeholder="Descreva o problema com pelo menos 10 caracteres" required />
          </label>
          <Input defaultValue={defaultAddress} label="Endereço do atendimento" minLength={5} name="endereco" placeholder="Rua, número e bairro" required />

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-700">Quando você precisa?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ['IMMEDIATE', 'O quanto antes', 'O profissional combina o horário com você.'],
                ['SCHEDULED', 'Quero agendar', 'Escolha uma data e hora futuras.'],
              ] as const).map(([value, title, description]) => (
                <label className={`cursor-pointer rounded-2xl border p-4 ${serviceType === value ? 'border-brand-400 bg-brand-50' : 'border-slate-200'}`} key={value}>
                  <input checked={serviceType === value} className="mr-2 accent-brand-600" name="tipoAtendimento" onChange={() => setServiceType(value)} type="radio" value={value} />
                  <span className="font-bold text-slate-900">{title}</span>
                  <span className="mt-1 block pl-6 text-sm text-slate-500">{description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {serviceType === 'SCHEDULED' && <Input label="Data e hora" min={minimumScheduleDate} name="dataAgendamento" required type="datetime-local" />}
          <Input label="URL de uma foto (opcional)" name="fotoUrl" placeholder="https://exemplo.com/foto.jpg" type="url" />
          <Button className="w-full" type="submit">Revisar solicitação</Button>
        </form>
      )}
    </div>
  )
}
