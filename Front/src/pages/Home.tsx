import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { ProviderCard } from '../components/ProviderCard'
import { categoryService } from '../services/category.service'
import { providerService } from '../services/provider.service'
import type { Category, Provider } from '../types/entities'

export function Home() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    Promise.all([
        categoryService.list(),
        providerService.list(),
      ])
      .then(([categoryData, providerData]) => {
        if (!isCurrent) return
        setCategories(categoryData)
        setProviders(providerData.slice(0, 3))
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a página.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  function retryLoad() {
    setIsLoading(true)
    setError('')
    setReloadKey((value) => value + 1)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const search = String(data.get('search') || '').trim()
    navigate(search ? `/prestadores?busca=${encodeURIComponent(search)}` : '/prestadores')
  }

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(45,164,245,0.35),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-sm font-semibold text-brand-200">
              Profissionais disponíveis na sua região
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Precisou de ajuda? A gente encontra quem resolve.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Busque pelo serviço, compare profissionais e escolha quem vai atender você.
            </p>

            <form className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row" onSubmit={handleSearch}>
              <label className="sr-only" htmlFor="home-search">Qual serviço você precisa?</label>
              <input
                className="min-h-12 flex-1 rounded-xl px-4 text-base text-slate-900 placeholder:text-slate-400"
                id="home-search"
                name="search"
                placeholder="Ex.: eletricista, encanador..."
              />
              <button className="min-h-12 rounded-xl bg-brand-600 px-6 font-bold text-white transition hover:bg-brand-700" type="submit">
                Buscar profissional
              </button>
            </form>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto max-w-md rounded[2rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
                <p className="text-sm font-semibold text-slate-500">Atendimento simples</p>
                <ol className="mt-5 space-y-5">
                  {['Conte o que precisa', 'Escolha o profissional', 'Acompanhe o atendimento'].map((step, index) => (
                    <li className="flex items-center gap-4" key={step}>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 font-black text-brand-700">
                        {index + 1}
                      </span>
                      <span className="font-semibold">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Categorias</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Do que você precisa hoje?</h2>
          </div>
        </div>

        {isLoading ? (
          <Loading label="Buscando serviços..." />
        ) : error ? (
          <div className="mt-8"><ErrorState message={error} onRetry={retryLoad} /></div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 sm:p-5"
                key={category.id}
                to={`/prestadores?categoria=${category.id}`}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand-100 font-black text-brand-700" aria-hidden="true">
                  {category.name.slice(0, 1).toUpperCase()}
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{category.name}</h3>
                {category.description && <p className="mt-1 hidden text-sm leading-5 text-slate-500 sm:line-clamp-2">{category.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {!isLoading && !error && providers.length > 0 && (
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Bem avaliados</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Profissionais em destaque</h2>
              </div>
              <Link className="hidden text-sm font-bold text-brand-700 hover:text-brand-800 sm:block" to="/prestadores">
                Ver todos →
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {providers.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
