import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || props.name

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        id={inputId}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 transition-colors ${
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-slate-200 focus:border-brand-500'
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="mt-1.5 block text-sm text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}
