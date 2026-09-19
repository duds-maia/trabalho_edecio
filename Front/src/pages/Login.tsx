import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useAuth } from '../contexts/auth-context'
import { roleHome } from '../utils/roleHome'

interface LoginLocationState {
  from?: string
}

export function Login() {
  const { isAuthenticated, login, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate replace to={roleHome(session?.usuario.perfil)} />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const data = new FormData(event.currentTarget)

    try {
      const newSession = await login(String(data.get('email')), String(data.get('senha')))
      const from = (location.state as LoginLocationState | null)?.from
      navigate(from || roleHome(newSession.usuario.perfil), { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
      <div className="hidden lg:block">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Sua conta</p>
        <h1 className="mt-3 max-w-md text-4xl font-black leading-tight tracking-tight text-slate-900">Acompanhe seus atendimentos em um só lugar.</h1>
        <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">Entre para solicitar serviços, consultar o andamento e avaliar os profissionais.</p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 lg:text-2xl">Entrar no Me Socorre</h1>
        <p className="mt-2 text-slate-500">Use o e-mail e a senha da sua conta.</p>

        {error && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</div>}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Input autoComplete="email" label="E-mail" name="email" placeholder="voce@exemplo.com" required type="email" />
          <Input autoComplete="current-password" label="Senha" minLength={4} name="senha" placeholder="Sua senha" required type="password" />
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">Ainda não tem uma conta? <Link className="font-bold text-brand-700" to="/cadastro">Cadastre-se</Link></p>
      </section>
    </div>
  )
}
