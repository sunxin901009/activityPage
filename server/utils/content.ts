import { createError } from 'h3'
import sanitizeHtml from 'sanitize-html'
import { activities as demoActivities, categories as demoCategories, profile as demoProfile } from '../../shared/demo'
import type { Activity, ActivityDetail, Category, Portfolio, Profile } from '../../shared/types'

type ContentConfig = { contentMode: string; directusUrl: string }
const activityFields = 'id,slug,title,date,summary,role,location,cover,cover_alt,category.*,featured,sort'

export function sanitizeBody(body: string) {
  return sanitizeHtml(body, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt', 'width', 'height', 'loading'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: {
      a: (_tag, attrs) => ({ tagName: 'a', attribs: { ...attrs, rel: 'noopener noreferrer' } }),
      img: (_tag, attrs) => {
        // Route rich-text images through the permission-checked same-origin media endpoint.
        const match = attrs.src?.match(/(?:^|\/)assets\/([a-f0-9-]{36})(?:\.[a-z0-9]+)?(?:[?#]|$)/i)
        const src = match ? `/api/media/${match[1]}?width=1200` : attrs.src
        return { tagName: 'img', attribs: { ...attrs, src: src || '', loading: 'lazy' } }
      },
    },
    exclusiveFilter: frame => frame.tag === 'img' && !/^\/api\/media\/[a-f0-9-]{36}(?:\?|$)/i.test(frame.attribs.src || ''),
  })
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
    cmsRead<Profile>(config, 'items/profile', { fields: 'name,tagline,introduction,school,interest,hero,email' }),
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
    const items = await cmsRead<ActivityDetail[]>(config, 'items/activities', {
      fields: `${activityFields},body,outcome,reflection,media.id,media.file,media.kind,media.caption,media.sort`,
      'filter[slug][_eq]': slug, 'filter[status][_eq]': 'published', limit: '1', 'deep[media][_sort]': 'sort',
    })
    activity = items[0]
  }
  if (!activity) throw createError({ statusCode: 404, statusMessage: 'This activity does not exist or has not been published.' })
  return { ...activity, body: sanitizeBody(activity.body || ''), media: activity.media || [] }
}
