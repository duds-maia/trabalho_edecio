import { Link } from 'react-router-dom'
import type { Provider } from '../types/entities'

interface ProviderCardProps {
  provider: Provider
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const rating = Number(provider.ratingAverage)

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700" aria-hidden="true">
          {provider.user.name.slice(0, 1).toUpperCase()}
        </div>
        {provider.isFeatured && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            Destaque
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-900">{provider.user.name}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="font-medium text-brand-700">{provider.category.name}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Disponível
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
        {provider.address || 'Endereço informado durante a solicitação.'}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-sm font-semibold text-slate-700" aria-label={`Avaliação ${rating.toFixed(1)} de 5`}>
          <span className="text-amber-500" aria-hidden="true">★</span> {rating.toFixed(1)}
        </span>
        <Link className="text-sm font-bold text-brand-700 hover:text-brand-800" to={`/prestadores/${provider.id}`}>
          Ver perfil →
        </Link>
      </div>
    </article>
  )
}
