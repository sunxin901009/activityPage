import { createError } from 'h3'
import { sanitizeBody } from '../../shared/rich-text'
import { activities as demoActivities, categories as demoCategories, profile as demoProfile } from '../../shared/demo'
import type { Activity, ActivityDetail, Category, Media, Portfolio, Profile } from '../../shared/types'

type ContentConfig = { contentMode: string; directusUrl: string }
const activityFields = 'id,slug,title,date,summary,role,location,cover,cover_alt,category.*,featured,sort'

export { sanitizeBody }

type CmsActivity = Omit<ActivityDetail, 'media'> & {
  media: Array<Omit<Media, 'file'> & { file: { id: string; type: string | null } | null }>
}

export async function cmsRead<T>(config: ContentConfig, path: string, query: Record<string, string> = {}): Promise<T> {
  const url = new URL(path, `${config.directusUrl.replace(/\/$/, '')}/`)
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value))
  let response: Response
  try {
    // Public reads use Directus public permissions, never an administrator token.
    response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'The content service is temporarily unavailable. Please try again later.' })
  }
  if (!response.ok) throw createError({ statusCode: 503, statusMessage: 'Content could not be loaded. Please check the CMS configuration.' })
  const payload = await response.json() as { data: T }
  return payload.data
}

function isDemo(config: ContentConfig) {
  if (!['demo', 'directus'].includes(config.contentMode)) throw createError({ statusCode: 500, statusMessage: 'The content mode is invalid.' })
  return config.contentMode === 'demo'
}

export async function getPortfolio(config: ContentConfig): Promise<Portfolio> {
  if (isDemo(config)) return {
    profile: demoProfile, categories: demoCategories, demo: true,
    activities: demoActivities.map(({ body, outcome, reflection, media, ...activity }) => activity),
  }
  const [profile, categories, activities] = await Promise.all([
    cmsRead<Profile>(config, 'items/profile', { fields: 'name,tagline,introduction,school,interest,hero,nature_photo,email' }),
    cmsRead<Category[]>(config, 'items/categories', { fields: '*', sort: 'sort', limit: '-1' }),
    cmsRead<Activity[]>(config, 'items/activities', { fields: activityFields, 'filter[status][_eq]': 'published', sort: 'sort,-date', limit: '-1' }),
  ])
  if (!profile?.name) throw createError({ statusCode: 503, statusMessage: 'Please complete the profile in the admin panel.' })
  return { profile, categories, activities, demo: false }
}

export async function getActivity(config: ContentConfig, slug: string): Promise<ActivityDetail> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw createError({ statusCode: 404, statusMessage: 'This activity does not exist or has not been published.' })
  let activity: ActivityDetail | undefined
  if (isDemo(config)) activity = demoActivities.find(item => item.slug === slug)
  else {
    const items = await cmsRead<CmsActivity[]>(config, 'items/activities', {
      fields: `${activityFields},body,outcome,reflection,media.id,media.file.id,media.file.type,media.kind,media.caption,media.sort`,
      'filter[slug][_eq]': slug, 'filter[status][_eq]': 'published', limit: '1', 'deep[media][_sort]': 'sort',
    })
    const item = items[0]
    if (item) activity = {
      ...item,
      media: (item.media || []).flatMap(media => media.file
        ? [{ ...media, file: media.file.id, mime_type: media.file.type }]
        : []),
    }
  }
  if (!activity) throw createError({ statusCode: 404, statusMessage: 'This activity does not exist or has not been published.' })
  return { ...activity, body: sanitizeBody(activity.body || ''), media: activity.media || [] }
}
