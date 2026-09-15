import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminNav } from '../components/AdminNav'
import { ErrorState } from '../components/ErrorState'
import { Loading } from '../components/Loading'
import { adminService } from '../services/admin.service'
import type { AdminDashboardData, ApprovalStatus, RequestStatus } from '../types/entities'
import { approvalStatusLabels } from '../utils/approvalStatus'
import { requestStatusLabels } from '../utils/requestStatus'

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService.getDashboard()
      .then(setDashboard)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o painel.'))
  }, [])

  if (error) return <div className="mx-auto max-w-6xl px-4 py-16"><ErrorState message={error} /></div>
  if (!dashboard) return <Loading label="Carregando indicadores..." />

  const providerTotal = dashboard.prestadoresPorStatus.reduce((total, item) => total + item.quantidade, 0)
  const requestTotal = dashboard.solicitacoesPorStatus.reduce((total, item) => total + item.quantidade, 0)

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Administração</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Visão geral da plataforma</h1>
      <AdminNav />

      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Clientes', dashboard.clientes],
          ['Prestadores', providerTotal],
          ['Solicitações', requestTotal],
          ['Avaliações', dashboard.avaliacoes],
        ].map(([label, value]) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black text-slate-900">Prestadores por situação</h2><Link className="text-sm font-bold text-brand-700" to="/admin/prestadores">Gerenciar</Link></div>
          <div className="mt-5 space-y-3">
            {dashboard.prestadoresPorStatus.length === 0 ? <p className="text-slate-500">Nenhum prestador cadastrado.</p> : dashboard.prestadoresPorStatus.map((item) => (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3" key={item.status}><span className="font-semibold text-slate-700">{approvalStatusLabels[item.status as ApprovalStatus]}</span><strong className="text-slate-900">{item.quantidade}</strong></div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black text-slate-900">Solicitações por status</h2>
          <div className="mt-5 space-y-3">
            {dashboard.solicitacoesPorStatus.length === 0 ? <p className="text-slate-500">Nenhuma solicitação registrada.</p> : dashboard.solicitacoesPorStatus.map((item) => (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3" key={item.status}><span className="font-semibold text-slate-700">{requestStatusLabels[item.status as RequestStatus]}</span><strong className="text-slate-900">{item.quantidade}</strong></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
