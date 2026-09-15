const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const SESSION_KEY = 'me-socorre:session'
const SESSION_EXPIRED_EVENT = 'me-socorre:session-expired'

const statusMessages: Record<number, string> = {
  400: 'Confira os dados informados e tente novamente.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'O conteúdo solicitado não foi encontrado.',
  409: 'Não foi possível concluir por causa de um conflito nos dados.',
  429: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
}

function extractApiMessage(data: unknown) {
  if (!data || typeof data !== 'object' || !('error' in data)) return undefined
  const error = data.error
  if (typeof error === 'string') return error
  if (!error || typeof error !== 'object') return undefined

  if ('fieldErrors' in error && error.fieldErrors && typeof error.fieldErrors === 'object') {
    for (const messages of Object.values(error.fieldErrors)) {
      if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0]
    }
  }
  if ('formErrors' in error && Array.isArray(error.formErrors) && typeof error.formErrors[0] === 'string') {
    return error.formErrors[0]
  }
  return undefined
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function getToken() {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY)
    if (!storedSession) return null
    return (JSON.parse(storedSession) as { token?: string }).token ?? null
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)

  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique se o backend está ligado.',
      0,
    )
  }

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const apiMessage = extractApiMessage(data)

    if (response.status === 401 && token) {
      localStorage.removeItem(SESSION_KEY)
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }

    throw new ApiError(
      apiMessage || statusMessages[response.status] || 'Algo deu errado. Tente novamente.',
      response.status,
      data && typeof data === 'object' && 'error' in data ? data.error : undefined,
    )
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export { SESSION_EXPIRED_EVENT, SESSION_KEY }
