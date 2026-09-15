import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="mx-auto min-h-[70vh] max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-bold text-brand-700">Erro 404</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900">Página não encontrada</h1>
      <p className="mt-3 text-slate-500">O endereço pode estar incorreto ou a página foi movida.</p>
      <Link className="mt-6 inline-flex font-bold text-brand-700" to="/">Voltar para o início</Link>
    </div>
  )
}
