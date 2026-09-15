import { useEffect, useMemo, useState } from 'react'
import { AdminNav } from '../components/AdminNav'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { adminService } from '../services/admin.service'
import type { AdminClient } from '../types/entities'

export function AdminClients() {
  const [clients, setClients] = useState<AdminClient[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService.listClients()
      .then((response) => setClients(response.clientes))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os clientes.'))
      .finally(() => setIsLoading(false))
  }, [])

  const visibleClients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return clients
    return clients.filter((client) => `${client.name} ${client.email} ${client.phone || ''}`.toLocaleLowerCase('pt-BR').includes(term))
  }, [clients, search])

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Administração</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Clientes cadastrados</h1>
      <AdminNav />

      <label className="mt-6 block max-w-xl"><span className="sr-only">Buscar cliente</span><input className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base shadow-sm" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou telefone" type="search" value={search} /></label>

      <div className="mt-6">
        {isLoading ? <Loading label="Carregando clientes..." /> : error ? <ErrorState message={error} /> : visibleClients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Nenhum cliente encontrado.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleClients.map((client) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={client.id}>
                <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-100 font-black text-brand-700">{client.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><h2 className="truncate font-black text-slate-900">{client.name}</h2><p className="truncate text-sm text-slate-500">{client.email}</p></div></div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div><dt className="font-bold text-slate-500">Telefone</dt><dd className="mt-1 text-slate-900">{client.phone || 'Não informado'}</dd></div>
                  <div><dt className="font-bold text-slate-500">Endereço</dt><dd className="mt-1 text-slate-900">{client.address || 'Não informado'}</dd></div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3"><div><dt className="font-bold text-slate-500">Solicitações</dt><dd className="mt-1 text-lg font-black text-slate-900">{client._count.requests}</dd></div><div><dt className="font-bold text-slate-500">Avaliações</dt><dd className="mt-1 text-lg font-black text-slate-900">{client._count.reviews}</dd></div></div>
                </dl>
                <time className="mt-4 block text-xs text-slate-400" dateTime={client.createdAt}>Cadastro em {new Intl.DateTimeFormat('pt-BR').format(new Date(client.createdAt))}</time>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
