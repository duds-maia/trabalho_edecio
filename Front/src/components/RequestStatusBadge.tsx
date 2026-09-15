import type { RequestStatus } from '../types/entities'
import { requestStatusLabels } from '../utils/requestStatus'

const statusClasses: Record<RequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  ACCEPTED: 'bg-sky-50 text-sky-800 ring-sky-200',
  IN_PROGRESS: 'bg-violet-50 text-violet-800 ring-violet-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusClasses[status]}`}>
      {requestStatusLabels[status]}
    </span>
  )
}
