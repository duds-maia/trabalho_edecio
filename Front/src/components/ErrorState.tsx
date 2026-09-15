import { Button } from './Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-800">{message}</p>
      {onRetry && (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
