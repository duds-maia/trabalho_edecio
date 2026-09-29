import {
  Ban,
  CheckCircle2,
  ClipboardList,
  FolderTree,
  Hourglass,
  ShieldAlert,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { VictoryAxis, VictoryBar, VictoryChart, VictoryContainer, VictoryPie, VictoryTooltip } from 'victory'
import { Card } from '../../components/Card/Card'
import { ErrorState } from '../../components/Feedback/Feedback'
import { Loading } from '../../components/Loading/Loading'
import { useAsync } from '../../hooks/useAsync'
import { adminService } from '../../services/admin.service'
import type { ApprovalStatus, RequestStatus } from '../../types/entities'
import { approvalStatusLabel, requestStatusLabel } from '../../utils/format'
import styles from './Admin.module.css'

const providerStatuses: Array<{ status: ApprovalStatus; color: string }> = [
  { status: 'PENDING', color: '#d97706' },
  { status: 'APPROVED', color: '#15803d' },
  { status: 'SUSPENDED', color: '#ea580c' },
  { status: 'BANNED', color: '#b91c1c' },
  { status: 'REJECTED', color: '#64748b' },
]

const requestStatuses: Array<{ status: RequestStatus; color: string }> = [
  { status: 'PENDING', color: '#d97706' },
  { status: 'ACCEPTED', color: '#2563eb' },
  { status: 'IN_PROGRESS', color: '#0891b2' },
  { status: 'COMPLETED', color: '#15803d' },
  { status: 'CANCELLED', color: '#64748b' },
]

function quantityFor<T extends string>(rows: Array<{ status: T; quantidade: number }>, status: T) {
  return rows.find((row) => row.status === status)?.quantidade ?? 0
}

export function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => adminService.getDashboard(), [])

  if (loading) return <Loading />
  if (error || !data) {
    return (
      <div className="container page">
        <ErrorState message={error ?? 'Erro ao carregar.'} onRetry={reload} />
      </div>
    )
  }

  const providerData = providerStatuses.map(({ status, color }) => ({
    status,
    label: approvalStatusLabel[status],
    value: quantityFor(data.prestadoresPorStatus, status),
    color,
  }))
  const requestData = requestStatuses.map(({ status, color }) => ({
    status,
    label: requestStatusLabel[status],
    value: quantityFor(data.solicitacoesPorStatus, status),
    color,
  }))
  const totalProviders = providerData.reduce((sum, item) => sum + item.value, 0)
  const totalRequests = requestData.reduce((sum, item) => sum + item.value, 0)
  const pending = quantityFor(data.prestadoresPorStatus, 'PENDING')

  const statusCards = [
    { status: 'PENDING' as const, icon: Hourglass, className: pending > 0 ? styles.kpiAlert : '' },
    { status: 'APPROVED' as const, icon: CheckCircle2, className: styles.kpiApproved },
    { status: 'SUSPENDED' as const, icon: ShieldAlert, className: styles.kpiSuspended },
    { status: 'BANNED' as const, icon: Ban, className: styles.kpiBanned },
  ]

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <p className="page-subtitle">Administração</p>
          <h1 className="page-title">Visão geral</h1>
          <p className="page-subtitle">Indicadores atualizados com os dados da plataforma.</p>
        </div>
      </div>

      <div className={styles.kpis}>
        {statusCards.map(({ status, icon: Icon, className }) => (
          <Link key={status} to={`/admin/prestadores?status=${status}`}>
            <Card interactive className={`${styles.kpi} ${className}`}>
              <Icon aria-hidden />
              <strong>{quantityFor(data.prestadoresPorStatus, status)}</strong>
              <span>Prestadores {approvalStatusLabel[status].toLowerCase()}s</span>
            </Card>
          </Link>
        ))}
        <Link to="/admin/clientes">
          <Card interactive className={styles.kpi}>
            <Users aria-hidden />
            <strong>{data.clientes}</strong>
            <span>Clientes cadastrados</span>
          </Card>
        </Link>
        <Link to="/admin/avaliacoes">
          <Card interactive className={styles.kpi}>
            <Star aria-hidden />
            <strong>{data.avaliacoes}</strong>
            <span>Avaliações enviadas</span>
          </Card>
        </Link>
      </div>

      {pending > 0 && (
        <Link to="/admin/prestadores?status=PENDING" className={styles.pendingCallout}>
          <Hourglass aria-hidden />
          <span>
            <strong>{pending} {pending === 1 ? 'cadastro aguarda' : 'cadastros aguardam'} análise</strong>
            Revise os dados dos prestadores antes de aprová-los.
          </span>
          <span className={styles.pendingAction}>Analisar agora</span>
        </Link>
      )}

      <div className={styles.panels}>
        <Card padding="lg" className={styles.chartCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Prestadores por status</h2>
              <p>Distribuição dos cadastros na plataforma</p>
            </div>
            <Wrench aria-hidden />
          </div>

          <div className={styles.donutLayout}>
            <div className={styles.donutChart} aria-label={`Total de ${totalProviders} prestadores`}>
              {totalProviders > 0 ? (
                <VictoryPie
                  data={providerData}
                  x="label"
                  y="value"
                  width={320}
                  height={260}
                  innerRadius={72}
                  padAngle={2}
                  cornerRadius={4}
                  colorScale={providerData.map((item) => item.color)}
                  labels={({ datum }) => `${datum.label}: ${datum.value}`}
                  labelComponent={
                    <VictoryTooltip
                      flyoutStyle={{ fill: '#ffffff', stroke: '#cbd5e1' }}
                      style={{ fontSize: 12, fill: '#0f172a' }}
                    />
                  }
                  style={{ labels: { fill: 'transparent' } }}
                  containerComponent={<VictoryContainer responsive />}
                />
              ) : (
                <div className={styles.chartEmpty}>Nenhum prestador cadastrado</div>
              )}
              <div className={styles.donutTotal} aria-hidden>
                <strong>{totalProviders}</strong>
                <span>prestadores</span>
              </div>
            </div>

            <div className={styles.chartLegend}>
              {providerData.map((item) => (
                <Link key={item.status} to={`/admin/prestadores?status=${item.status}`}>
                  <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="lg" className={styles.chartCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Solicitações por status</h2>
              <p>{totalRequests} {totalRequests === 1 ? 'solicitação registrada' : 'solicitações registradas'}</p>
            </div>
            <ClipboardList aria-hidden />
          </div>

          <div className={styles.barChart} aria-label={`Total de ${totalRequests} solicitações`}>
            <VictoryChart
              width={560}
              height={330}
              domainPadding={{ x: 30, y: 12 }}
              padding={{ top: 30, right: 20, bottom: 82, left: 52 }}
              containerComponent={<VictoryContainer responsive />}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: '#cbd5e1' },
                  ticks: { stroke: 'transparent' },
                  tickLabels: { fill: '#475569', fontSize: 11, angle: -20, textAnchor: 'end' },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(tick) => (Number.isInteger(tick) ? tick : '')}
                style={{
                  axis: { stroke: 'transparent' },
                  grid: { stroke: '#e2e8f0', strokeDasharray: '4,4' },
                  ticks: { stroke: 'transparent' },
                  tickLabels: { fill: '#64748b', fontSize: 11 },
                }}
              />
              <VictoryBar
                data={requestData}
                x="label"
                y="value"
                barWidth={34}
                cornerRadius={{ top: 6 }}
                labels={({ datum }) => String(datum.value)}
                labelComponent={
                  <VictoryTooltip
                    flyoutStyle={{ fill: '#ffffff', stroke: '#cbd5e1' }}
                    style={{ fontSize: 12, fill: '#0f172a' }}
                  />
                }
                style={{
                  data: { fill: ({ datum }) => datum.color },
                  labels: { fill: '#334155', fontSize: 12, fontWeight: 700 },
                }}
              />
            </VictoryChart>
          </div>
        </Card>
      </div>

      <div className={styles.shortcuts}>
        <Link to="/admin/prestadores" className={styles.shortcut}>
          <Wrench aria-hidden /> Gerenciar prestadores
        </Link>
        <Link to="/admin/categorias" className={styles.shortcut}>
          <FolderTree aria-hidden /> Categorias
        </Link>
        <Link to="/admin/clientes" className={styles.shortcut}>
          <Users aria-hidden /> Clientes
        </Link>
      </div>
    </div>
  )
}
