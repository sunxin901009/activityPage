import type { Portfolio } from '#shared/types'
export const usePortfolio = () => useFetch<Portfolio>('/api/portfolio', { key: 'portfolio' })
