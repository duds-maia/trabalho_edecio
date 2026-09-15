import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${isActive ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand-700'}`

export function AdminNav() {
  return (
    <nav className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Administração">
      <NavLink className={linkClass} end to="/admin">Visão geral</NavLink>
      <NavLink className={linkClass} to="/admin/prestadores">Prestadores</NavLink>
      <NavLink className={linkClass} to="/admin/solicitacoes">Solicitações</NavLink>
      <NavLink className={linkClass} to="/admin/avaliacoes">Avaliações</NavLink>
      <NavLink className={linkClass} to="/admin/clientes">Clientes</NavLink>
      <NavLink className={linkClass} to="/admin/categorias">Categorias</NavLink>
    </nav>
  )
}
