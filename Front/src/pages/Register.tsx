import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { authService } from '../services/auth.service'
import { categoryService } from '../services/category.service'
import type { Category, UserRole } from '../types/entities'

type RegistrationRole = Extract<UserRole, 'CLIENT' | 'PROVIDER'>

export function Register() {
  const [role, setRole] = useState<RegistrationRole>('CLIENT')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => {
      setCategoryError('Não foi possível carregar as categorias agora.')
    })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    const form = new FormData(formElement)
    const baseData = {
      nome: String(form.get('nome')).trim(),
      email: String(form.get('email')).trim(),
      senha: String(form.get('senha')),
      telefone: String(form.get('telefone')).trim() || undefined,
      endereco: String(form.get('endereco')).trim() || undefined,
    }

    try {
      if (role === 'PROVIDER') {
        await authService.registerProvider({
          ...baseData,
          idCategoria: Number(form.get('idCategoria')),
        })
        setSuccess('Cadastro enviado. Seu perfil ficará pendente até a aprovação do administrador.')
      } else {
        await authService.registerClient(baseData)
        setSuccess('Conta criada com sucesso. Você já pode entrar.')
      }
      formElement.reset()
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : 'Não foi possível concluir o cadastro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Nova conta</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Como você quer usar o Me Socorre?</h1>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1" role="group" aria-label="Tipo de conta">
          {([
            ['CLIENT', 'Preciso de um serviço'],
            ['PROVIDER', 'Quero prestar serviços'],
          ] as const).map(([value, label]) => (
            <button
              className={`min-h-12 rounded-xl px-3 text-sm font-bold transition ${role === value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'}`}
              key={value}
              onClick={() => {
                setRole(value)
                setError('')
                setSuccess('')
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</div>}
        {success && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">
            {success} <Link className="font-black underline" to="/entrar">Ir para o login</Link>
          </div>
        )}

        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2"><Input label="Nome completo" minLength={2} name="nome" required /></div>
          <Input autoComplete="email" label="E-mail" name="email" required type="email" />
          <Input autoComplete="new-password" label="Senha" minLength={8} name="senha" required type="password" />
          <Input label="Telefone (opcional)" minLength={8} name="telefone" placeholder="(11) 99999-9999" type="tel" />
          <Input label="Endereço (opcional)" minLength={5} name="endereco" placeholder="Rua, número e bairro" />

          {role === 'PROVIDER' && (
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Categoria de serviço</span>
              <select className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base" disabled={Boolean(categoryError)} name="idCategoria" required>
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {categoryError && <span className="mt-2 block text-sm text-red-600">{categoryError}</span>}
              <p className="mt-2 text-sm leading-6 text-slate-500">O perfil será analisado antes de aparecer para clientes.</p>
            </label>
          )}

          <div className="sm:col-span-2">
            <Button className="w-full" disabled={isSubmitting || (role === 'PROVIDER' && Boolean(categoryError))} type="submit">
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">Já possui uma conta? <Link className="font-bold text-brand-700" to="/entrar">Entrar</Link></p>
      </section>
    </div>
  )
}
