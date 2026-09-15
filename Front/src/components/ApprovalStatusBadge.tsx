import type { ApprovalStatus } from '../types/entities'
import { approvalStatusClasses, approvalStatusLabels } from '../utils/approvalStatus'

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${approvalStatusClasses[status]}`}>
      {approvalStatusLabels[status]}
    </span>
  )
}
