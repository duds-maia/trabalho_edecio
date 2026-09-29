import { useEffect, useState, type FormEvent } from 'react'
import { ApprovalStatusBadge } from '../components/ApprovalStatusBadge'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Loading } from '../components/Loading'
import { useAuth } from '../contexts/auth-context'
import { categoryService } from '../services/category.service'
import { providerService } from '../services/provider.service'
import type { ApprovalStatus, Category, Provider } from '../types/entities'

export function ProviderProfile() {
  const { session, updateUserName } = useAuth()
  const providerId = session?.prestador?.id || ''
  const [provider, setProvider] = useState<Provider | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.allSettled([categoryService.list(), providerService.getById(providerId)])
      .then(([categoriesResult, providerResult]) => {
        if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value)
        if (providerResult.status === 'fulfilled') setProvider(providerResult.value)
      })
      .finally(() => setIsLoading(false))
  }, [providerId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    const form = new FormData(event.currentTarget)
    const categoryId = Number(form.get('idCategoria'))
    try {
      const updatedProvider = await providerService.update(providerId, {
        nome: String(form.get('nome')).trim(),
        telefone: String(form.get('telefone')).trim() || null,
        endereco: String(form.get('endereco')).trim() || null,
        ...(categoryId > 0 ? { idCategoria: categoryId } : {}),
      })
      setProvider(updatedProvider)
      updateUserName(updatedProvider.user.name)
      setSuccess('Perfil atualizado com sucesso.')
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível atualizar seu perfil.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Loading label="Carregando perfil..." />
  const approvalStatus: ApprovalStatus = provider?.approvalStatus || session?.prestador?.statusAprovacao || 'PENDING'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-bold uppercase tracking-wider text-brand-700">Área do prestador</p><h1 className="mt-2 text-3xl font-black text-slate-900">Perfil profissional</h1></div>
        <ApprovalStatusBadge status={approvalStatus} />
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</div>}
      {success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">{success}</div>}

      <form className="mt-7 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" onSubmit={handleSubmit}>
        <Input defaultValue={provider?.user.name || session?.usuario.nome || ''} label="Nome" minLength={2} name="nome" required />
        <Input disabled defaultValue={session?.usuario.email || ''} label="E-mail" name="email" type="email" />
        <Input defaultValue={provider?.user.phone || ''} label="Telefone" minLength={8} name="telefone" type="tel" />
        <Input defaultValue={provider?.address || ''} label="Endereço profissional" minLength={5} name="endereco" />
        <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Categoria</span><select className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4" defaultValue={provider?.categoryId || ''} name="idCategoria"><option value="">Manter categoria atual</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        {!provider && <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">Enquanto o cadastro aguarda aprovação, alguns dados atuais ficam ocultos pela API. Preencha apenas o que deseja atualizar.</p>}
        <Button disabled={isSubmitting || !providerId} type="submit">{isSubmitting ? 'Salvando...' : 'Salvar alterações'}</Button>
      </form>
    </div>
  )
}
