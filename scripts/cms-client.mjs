export function createCmsClient() {
  const url = process.env.DIRECTUS_URL || 'http://127.0.0.1:8055'
  let token
  async function request(path, { method = 'GET', body, anonymous = false } = {}) {
    const response = await fetch(new URL(path, url), {
      method, signal: AbortSignal.timeout(30000),
      headers: { ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(!anonymous && token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      const error = new Error(`${method} ${path}: HTTP ${response.status} (${payload.errors?.[0]?.extensions?.code || 'REQUEST_FAILED'})`)
      error.status = response.status
      throw error
    }
    return response.status === 204 ? undefined : (await response.json()).data
  }
  async function login() {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.')
    const result = await request('/auth/login', { method: 'POST', body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } })
    token = result.access_token
  }
  return { request, login, url }
}
