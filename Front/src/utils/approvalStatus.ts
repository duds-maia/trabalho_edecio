import type { ApprovalStatus } from '../types/entities'

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  SUSPENDED: 'Suspenso',
  BANNED: 'Banido',
}

export const approvalStatusClasses: Record<ApprovalStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-800 ring-red-200',
  SUSPENDED: 'bg-orange-50 text-orange-800 ring-orange-200',
  BANNED: 'bg-slate-200 text-slate-800 ring-slate-300',
}
