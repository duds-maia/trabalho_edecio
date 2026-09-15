import { useEffect, useState } from 'react'
import { AdminNav } from '../components/AdminNav'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { RequestStatusBadge } from '../components/RequestStatusBadge'
import { adminService } from '../services/admin.service'
import type { AdminReview } from '../types/entities'

export function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService.listReviews()
      .then((response) => setReviews(response.avaliacoes))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as avaliações.'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Administração</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Avaliações da plataforma</h1>
      <AdminNav />

      <div className="mt-6">
        {isLoading ? <Loading label="Carregando avaliações..." /> : error ? <ErrorState message={error} /> : reviews.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Nenhuma avaliação recebida.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.map((review) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={review.id}>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="font-semibold text-amber-500" aria-label={`${review.rating} de 5 estrelas`}>{'★'.repeat(review.rating)}<span className="text-slate-200">{'★'.repeat(5 - review.rating)}</span></p><h2 className="mt-2 font-black text-slate-900">{review.provider.user.name}</h2></div>
                  <RequestStatusBadge status={review.request.status} />
                </div>
                <p className="mt-4 min-h-14 leading-7 text-slate-600">{review.comment || 'Cliente não deixou comentário.'}</p>
                <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                  <div><dt className="font-bold text-slate-500">Cliente</dt><dd className="mt-1 text-slate-900">{review.client.name}</dd></div>
                  <div><dt className="font-bold text-slate-500">Categoria</dt><dd className="mt-1 text-slate-900">{review.request.category.name}</dd></div>
                  <div><dt className="font-bold text-slate-500">Solicitação</dt><dd className="mt-1 text-slate-900">#{review.request.id}</dd></div>
                  <div><dt className="font-bold text-slate-500">Data</dt><dd className="mt-1 text-slate-900">{new Intl.DateTimeFormat('pt-BR').format(new Date(review.createdAt))}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
