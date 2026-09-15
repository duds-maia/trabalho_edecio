import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import { roleHome } from '../utils/roleHome'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-brand-700'
  }`

export function Header() {
  const { isAuthenticated, session, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900" to="/">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-xl text-white" aria-hidden="true">
            +
          </span>
          Me Socorre
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          <NavLink
            className={({ isActive }) => `${navLinkClass({ isActive })} hidden sm:block`}
            to="/prestadores"
          >
            Profissionais
          </NavLink>
          {isAuthenticated ? (
            <>
              {session?.usuario.perfil === 'CLIENT' && (
                <NavLink className={({ isActive }) => `${navLinkClass({ isActive })} hidden md:block`} to="/minhas-solicitacoes">
                  Solicitações
                </NavLink>
              )}
              {session?.usuario.perfil === 'PROVIDER' && (
                <NavLink className={({ isActive }) => `${navLinkClass({ isActive })} hidden md:block`} to="/prestador/solicitacoes">Atendimentos</NavLink>
              )}
              {session?.usuario.perfil === 'ADMIN' && (
                <NavLink className={({ isActive }) => `${navLinkClass({ isActive })} hidden md:block`} to="/admin/prestadores">Moderação</NavLink>
              )}
              <NavLink className={navLinkClass} to={roleHome(session?.usuario.perfil)}>
                <span className="hidden sm:inline">Olá, </span>
                {session?.usuario.nome.split(' ')[0]}
              </NavLink>
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600" onClick={logout}>
                Sair
              </button>
            </>
          ) : (
            <NavLink className={navLinkClass} to="/entrar">
              Entrar
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
