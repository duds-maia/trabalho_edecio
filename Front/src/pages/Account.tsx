import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

const roleLabels = {
  CLIENT: 'Cliente',
  PROVIDER: 'Prestador',
  ADMIN: 'Administrador',
} as const

export function Account() {
  const { session } = useAuth()
  const role = session?.usuario.perfil

  if (role === 'PROVIDER') return <Navigate replace to="/prestador" />
  if (role === 'ADMIN') return <Navigate replace to="/admin" />

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Minha área</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Olá, {session?.usuario.nome.split(' ')[0]}</h1>
      <p className="mt-3 text-slate-600">Perfil: {session ? roleLabels[session.usuario.perfil] : ''}</p>

      {role === 'CLIENT' && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300" to="/minhas-solicitacoes">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-100 text-xl font-black text-brand-700">#</span>
            <h2 className="mt-4 text-lg font-black text-slate-900">Minhas solicitações</h2>
            <p className="mt-2 leading-6 text-slate-600">Acompanhe atendimentos, cancele pedidos pendentes e avalie serviços concluídos.</p>
          </Link>
          <Link className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300" to="/perfil">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-100 text-xl font-black text-brand-700">@</span>
            <h2 className="mt-4 text-lg font-black text-slate-900">Meus dados</h2>
            <p className="mt-2 leading-6 text-slate-600">Atualize seu nome, telefone e endereço de atendimento.</p>
          </Link>
        </div>
      )}
    </div>
  )
}
