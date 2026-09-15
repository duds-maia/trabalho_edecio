import { useEffect, useState, type FormEvent } from 'react'
import { AdminNav } from '../components/AdminNav'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { Input } from '../components/Input'
import { Loading } from '../components/Loading'
import { categoryService } from '../services/category.service'
import type { Category } from '../types/entities'

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Category | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    categoryService.list()
      .then(setCategories)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as categorias.'))
      .finally(() => setIsLoading(false))
  }, [])

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const data = {
      name: String(form.get('name')).trim(),
      description: String(form.get('description')).trim() || undefined,
    }
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    try {
      if (editing) {
        const updated = await categoryService.update(editing.id, data)
        setCategories((current) => current.map((category) => category.id === updated.id ? updated : category).sort((a, b) => a.name.localeCompare(b.name)))
        setSuccess('Categoria atualizada.')
        setEditing(null)
      } else {
        const created = await categoryService.create(data)
        setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
        setSuccess('Categoria criada.')
        formElement.reset()
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a categoria.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteCategory() {
    if (!confirmingDelete) return
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await categoryService.delete(confirmingDelete.id)
      setCategories((current) => current.filter((category) => category.id !== confirmingDelete.id))
      setSuccess('Categoria excluída.')
      setConfirmingDelete(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir a categoria.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Administração</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Categorias de serviço</h1>
      <AdminNav />

      {error && <div className="mt-5"><ErrorState message={error} /></div>}
      {success && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">{success}</div>}

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black text-slate-900">{editing ? `Editar ${editing.name}` : 'Nova categoria'}</h2>
        <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end" key={editing?.id || 'new'} onSubmit={saveCategory}>
          <Input defaultValue={editing?.name || ''} label="Nome" minLength={2} name="name" required />
          <Input defaultValue={editing?.description || ''} label="Descrição (opcional)" name="description" />
          <div className="flex gap-2"><Button disabled={isSubmitting} type="submit">{isSubmitting ? 'Salvando...' : editing ? 'Atualizar' : 'Adicionar'}</Button>{editing && <Button onClick={() => setEditing(null)} variant="secondary">Cancelar</Button>}</div>
        </form>
      </section>

      <section className="mt-6">
        {isLoading ? <Loading label="Carregando categorias..." /> : categories.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Nenhuma categoria cadastrada.</div> : (
          <div className="grid gap-3 md:grid-cols-2">
            {categories.map((category) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5" key={category.id}>
                <h2 className="font-black text-slate-900">{category.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{category.description || 'Sem descrição.'}</p>
                {confirmingDelete?.id === category.id ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-900">Excluir esta categoria?</p>
                    <p className="mt-1 text-sm text-red-700">A exclusão falhará se houver prestadores ou solicitações vinculados.</p>
                    <div className="mt-3 flex gap-2"><Button disabled={isSubmitting} onClick={() => setConfirmingDelete(null)} variant="secondary">Voltar</Button><Button className="bg-red-600 hover:bg-red-700" disabled={isSubmitting} onClick={deleteCategory}>{isSubmitting ? 'Excluindo...' : 'Confirmar exclusão'}</Button></div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4"><Button onClick={() => { setEditing(category); window.scrollTo({ top: 0, behavior: 'smooth' }) }} variant="secondary">Editar</Button><Button onClick={() => setConfirmingDelete(category)} variant="ghost">Excluir</Button></div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
