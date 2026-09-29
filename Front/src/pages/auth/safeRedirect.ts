// Aceita apenas caminhos internos para evitar redirecionamento para outro site.
export function safeRedirect(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}
