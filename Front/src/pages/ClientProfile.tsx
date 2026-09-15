import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { Input } from '../components/Input'
import { Loading } from '../components/Loading'
import { useAuth } from '../contexts/auth-context'
import { clientService } from '../services/client.service'
import type { ClientProfile as ClientProfileData } from '../types/entities'

export function ClientProfile() {
  const { session, updateUser } = useAuth()
  const [profile, setProfile] = useState<ClientProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!session) return
    clientService.getById(session.usuario.id)
      .then((response) => setProfile(response.cliente))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar seu perfil.'))
      .finally(() => setIsLoading(false))
  }, [session])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await clientService.update(session.usuario.id, {
        nome: String(form.get('nome')).trim(),
        telefone: String(form.get('telefone')).trim() || null,
        endereco: String(form.get('endereco')).trim() || null,
      })
      setProfile(response.cliente)
      updateUser({ nome: response.cliente.nome })
      setSuccess('Perfil atualizado com sucesso.')
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível atualizar seu perfil.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Loading label="Carregando perfil..." />
  if (!profile) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message={error || 'Perfil não encontrado.'} /></div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Minha conta</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Dados do perfil</h1>

      {error && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</div>}
      {success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">{success}</div>}

      <form className="mt-7 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" onSubmit={handleSubmit}>
        <Input defaultValue={profile.nome} label="Nome completo" minLength={2} name="nome" required />
        <Input disabled defaultValue={profile.email} label="E-mail" name="email" type="email" />
        <Input defaultValue={profile.telefone || ''} label="Telefone" minLength={8} name="telefone" type="tel" />
        <Input defaultValue={profile.endereco || ''} label="Endereço" minLength={5} name="endereco" />
        <Button disabled={isSubmitting} type="submit">{isSubmitting ? 'Salvando...' : 'Salvar alterações'}</Button>
      </form>
    </div>
  )
}
