import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { ApiError } from '../services/api'
import { providerService } from '../services/provider.service'
import type { Provider, Review, ReviewSummary } from '../types/entities'

export function ProviderDetails() {
  const { id = '' } = useParams()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [summaryMessage, setSummaryMessage] = useState('')
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    Promise.all([providerService.getById(id), providerService.getReviews(id)])
      .then(([providerData, reviewData]) => {
        if (!isCurrent) return
        setProvider(providerData)
        setReviews(reviewData.avaliacoes)
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o perfil.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [id])

  useEffect(() => {
    let isCurrent = true
    providerService.getReviewSummary(id)
      .then((data) => {
        if (isCurrent) setSummary(data)
      })
      .catch((summaryError) => {
        if (!isCurrent) return
        setSummaryMessage(summaryError instanceof ApiError && summaryError.status === 503
          ? 'O resumo por IA está temporariamente indisponível.'
          : 'Não foi possível carregar o resumo das avaliações.')
      })
      .finally(() => {
        if (isCurrent) setIsSummaryLoading(false)
      })
    return () => { isCurrent = false }
  }, [id])

  if (isLoading) return <Loading label="Carregando perfil..." />

  if (error || !provider) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message={error || 'Profissional não encontrado.'} /></div>
  }

  const rating = Number(provider.ratingAverage)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link className="text-sm font-bold text-brand-700 hover:text-brand-800" to="/prestadores">← Voltar para profissionais</Link>

      <section className="mt-5 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_auto] md:p-8">
        <div className="flex gap-5">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-100 text-2xl font-black text-brand-700" aria-hidden="true">
            {provider.user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{provider.user.name}</h1>
              {provider.isFeatured && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Destaque</span>}
            </div>
            <p className="mt-1 font-semibold text-brand-700">{provider.category.name}</p>
            <p className="mt-3 text-slate-500">{provider.address || 'Local de atendimento a combinar'}</p>
            <p className="mt-3 font-semibold text-slate-700"><span className="text-amber-500">★</span> {rating.toFixed(1)} de 5</p>
          </div>
        </div>

        <div className="md:self-center">
          <Link className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-6 font-bold text-white transition hover:bg-brand-700" to={`/solicitacoes/nova?prestador=${provider.id}&categoria=${provider.categoryId}`}>
            Solicitar atendimento
          </Link>
          <p className="mt-2 text-center text-xs text-slate-400">Você confirma os detalhes antes de enviar.</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-black text-slate-900">Resumo das avaliações</h2>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">Gerado por IA</span>
        </div>
        {isSummaryLoading ? (
          <p className="mt-3 text-sm text-slate-500">Gerando resumo...</p>
        ) : summaryMessage ? (
          <p className="mt-3 text-sm text-slate-600">{summaryMessage}</p>
        ) : (
          <p className="mt-3 leading-7 text-slate-700">{summary?.resumoGeradoPorIa || 'Ainda não há avaliações suficientes para gerar um resumo.'}</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black text-slate-900">Avaliações de clientes</h2>
        {reviews.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Este profissional ainda não recebeu avaliações.</div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5" key={review.id}>
                <p className="font-semibold text-amber-500" aria-label={`${review.rating} de 5 estrelas`}>{'★'.repeat(review.rating)}<span className="text-slate-200">{'★'.repeat(5 - review.rating)}</span></p>
                <p className="mt-3 leading-7 text-slate-600">{review.comment || 'Cliente não deixou comentário.'}</p>
                <time className="mt-4 block text-sm text-slate-400" dateTime={review.createdAt}>{new Intl.DateTimeFormat('pt-BR').format(new Date(review.createdAt))}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
