import type { ActivityDetail } from '#shared/types'
import { toValue, type MaybeRefOrGetter } from 'vue'

export const useActivity = (slug: MaybeRefOrGetter<string>) => {
  const config = useRuntimeConfig()
  const getUrl = () => {
    const encoded = encodeURIComponent(toValue(slug))
    if (!config.public.staticSite) return `/api/activities/${encoded}`
    const prefix = import.meta.server ? '/static-data' : `${config.app.baseURL}static-data`
    return `${prefix}/activities/${encoded}.json`
  }

  return useFetch<ActivityDetail>(getUrl, { key: () => `activity:${toValue(slug)}` })
}
