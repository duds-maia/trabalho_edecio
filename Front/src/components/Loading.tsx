interface LoadingProps {
  label?: string
}

export function Loading({ label = 'Carregando...' }: LoadingProps) {
  return (
    <div className="flex min-h-36 items-center justify-center gap-3 text-slate-500" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <span>{label}</span>
    </div>
  )
}
