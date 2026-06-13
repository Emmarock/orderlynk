// HTTP plumbing shared by every feature's api slice: the fetch wrapper, auth token store,
// error type, and small helpers. Feature slices import `request`/`upload` from here.

export const BASE = import.meta.env.VITE_API_URL ?? ''

const TOKEN_KEY = 'orderlynk.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  details?: Record<string, string>
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message)
    this.status = status
    this.details = details
  }
}

/**
 * Best user-facing message for a failed request: prefers a specific field-validation message
 * (the `details` map returned for 400s) over the generic "Validation failed" envelope.
 */
export function apiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const first = err.details && Object.values(err.details)[0]
    return first || err.message
  }
  return fallback
}

/** Build a `?from=&to=` query string from optional ISO dates (yyyy-MM-dd). */
export function dateRangeQuery(from?: string, to?: string): string {
  const qs = new URLSearchParams()
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  // Always attach the token when present so guest checkout can be linked to a logged-in customer.
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const message = (data && (data.message as string)) || `Request failed (${res.status})`
    throw new ApiError(res.status, message, data?.details)
  }
  return data as T
}

/**
 * Multipart file upload — lets the browser set the Content-Type (with boundary), so it doesn't go
 * through {@link request}. `path` may include a query string (e.g. branding `?kind=logo`).
 */
export async function upload(path: string, file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: form })
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const message = (data && (data.message as string)) || `Upload failed (${res.status})`
    throw new ApiError(res.status, message, data?.details)
  }
  return data as { url: string }
}
