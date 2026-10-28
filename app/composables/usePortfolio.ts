import type { Portfolio } from '#shared/types'

export const usePortfolio = () => {
  const config = useRuntimeConfig()
  const url = config.public.staticSite
    ? (import.meta.server ? '/static-data/portfolio.json' : `${config.app.baseURL}static-data/portfolio.json`)
    : '/api/portfolio'

  return useFetch<Portfolio>(url, { key: 'portfolio' })
}
