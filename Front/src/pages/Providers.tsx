import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { ProviderCard } from '../components/ProviderCard'
import { categoryService } from '../services/category.service'
import { providerService } from '../services/provider.service'
import type { Category, Provider } from '../types/entities'

export function Providers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('busca') || ''
  const categoryId = Number(searchParams.get('categoria')) || undefined
  const [categories, setCategories] = useState<Category[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let isCurrent = true

    providerService
      .list({ search, categoryId })
      .then((data) => {
        if (isCurrent) setProviders(data)
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Não foi possível buscar profissionais.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [categoryId, search])

  function handleFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    const data = new FormData(event.currentTarget)
    const nextParams = new URLSearchParams()
    const nextSearch = String(data.get('search') || '').trim()
    const nextCategory = String(data.get('categoryId') || '')

    if (nextSearch) nextParams.set('busca', nextSearch)
    if (nextCategory) nextParams.set('categoria', nextCategory)
    setSearchParams(nextParams)
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Profissionais</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Encontre a ajuda certa</h1>
        <p className="mt-3 leading-7 text-slate-600">Escolha por serviço, nome ou região. Só exibimos profissionais aprovados e disponíveis.</p>
      </div>

      <form className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_240px_auto]" onSubmit={handleFilters}>
        <label>
          <span className="sr-only">Buscar profissional</span>
          <input className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-base" defaultValue={search} key={`search-${search}`} name="search" placeholder="Nome, serviço ou endereço" />
        </label>
        <label>
          <span className="sr-only">Filtrar por categoria</span>
          <select className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base" defaultValue={categoryId || ''} key={`category-${categoryId || 'all'}`} name="categoryId">
            <option value="">Todas as categorias</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <Button type="submit">Buscar</Button>
      </form>

      <div className="mt-8">
        {isLoading ? (
          <Loading label="Buscando profissionais..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : providers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-slate-900">Nenhum profissional encontrado</h2>
            <p className="mt-2 text-slate-500">Tente outro termo ou remova o filtro de categoria.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-slate-500">{providers.length} {providers.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
