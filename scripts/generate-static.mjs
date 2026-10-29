import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sanitizeBody } from '../shared/rich-text.ts'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const directusUrl = (process.env.DIRECTUS_URL || process.env.NUXT_DIRECTUS_URL || '').replace(/\/$/, '')
if (!directusUrl) throw new Error('Set DIRECTUS_URL to the public Directus base URL before generating the static site.')

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const inferredBasePath = repositoryName && !repositoryName.endsWith('.github.io') ? `/${repositoryName}/` : '/'
const basePath = normalizeBasePath(process.env.PAGES_BASE_PATH || process.env.NUXT_APP_BASE_URL || inferredBasePath)
const contentDir = resolve(root, 'public/static-content')
const dataDir = resolve(root, 'public/static-data')
await rm(contentDir, { recursive: true, force: true })
await rm(dataDir, { recursive: true, force: true })
await mkdir(contentDir, { recursive: true })
await mkdir(resolve(dataDir, 'activities'), { recursive: true })

const profile = await readData('items/profile', {
  fields: 'name,tagline,introduction,school,interest,hero,nature_photo,email',
})
const categories = await readData('items/categories', {
  fields: 'id,slug,title,subtitle,description,sort,color',
  sort: 'sort',
  limit: '-1',
})
const activities = await readData('items/activities', {
  fields: 'id,slug,title,date,summary,role,location,cover,cover_alt,category.*,featured,sort,body,outcome,reflection,media.id,media.file,media.kind,media.caption,media.sort',
  'filter[status][_eq]': 'published',
  sort: 'sort,-date',
  limit: '-1',
  'deep[media][_sort]': 'sort',
})

if (!profile?.name) throw new Error('Directus profile is missing. Add a profile before generating the static site.')
for (const item of activities) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || '')) {
    throw new Error(`Published activity has an invalid or missing slug: ${item.title || item.id}`)
  }
}

const fileIds = new Set()
const addFileId = (value) => {
  const id = typeof value === 'string' ? value : value?.id
  if (typeof id === 'string' && /^[a-f0-9-]{36}$/i.test(id)) fileIds.add(id)
}
addFileId(profile.hero)
addFileId(profile.nature_photo)
for (const activity of activities) {
  addFileId(activity.cover)
  for (const media of activity.media || []) addFileId(media.file)
  sanitizeBody(activity.body || '', id => { fileIds.add(id); return undefined })
}

const fileMap = new Map()
if (fileIds.size) {
  const files = await readData('files', {
    fields: 'id,filename_download,type',
    'filter[id][_in]': [...fileIds].join(','),
    limit: '-1',
  })
  for (const file of files) fileMap.set(file.id, file)
  const missing = [...fileIds].filter(id => !fileMap.has(id))
  if (missing.length) throw new Error(`Directus did not return ${missing.length} referenced file(s). Check public read permission for directus_files.`)

  for (const [id, file] of fileMap) {
    const extension = safeExtension(file.filename_download, file.type)
    const response = await fetch(`${directusUrl}/assets/${id}`)
    if (!response.ok) throw new Error(`Could not download Directus asset ${id} (HTTP ${response.status}). Check public file permissions.`)
    await writeFile(resolve(contentDir, `${id}${extension}`), Buffer.from(await response.arrayBuffer()))
    fileMap.set(id, { ...file, staticPath: `${basePath}static-content/${id}${extension}` })
  }
}

const mapFile = (value) => {
  const id = typeof value === 'string' ? value : value?.id
  return fileMap.get(id)?.staticPath || null
}
const publicProfile = {
  ...profile,
  hero: mapFile(profile.hero),
  nature_photo: mapFile(profile.nature_photo),
}
const details = activities.map((activity) => ({
  ...activity,
  cover: mapFile(activity.cover),
  body: sanitizeBody(activity.body || '', id => fileMap.get(id)?.staticPath),
  media: (activity.media || []).map(media => ({
    ...media, file: mapFile(media.file), mime_type: fileMap.get(typeof media.file === 'string' ? media.file : media.file?.id)?.type,
  })).filter(media => media.file),
}))
const portfolio = {
  profile: publicProfile,
  categories,
  activities: details.map(({ body, outcome, reflection, media, ...activity }) => activity),
  demo: false,
}

await writeFile(resolve(dataDir, 'portfolio.json'), JSON.stringify(portfolio))
for (const activity of details) {
  await writeFile(resolve(dataDir, 'activities', `${activity.slug}.json`), JSON.stringify(activity))
}

const routes = [
  ...categories.map(category => `/activities/${category.slug}`),
  ...details.map(activity => `/activity/${activity.slug}`),
]
const env = {
  ...process.env,
  NUXT_PUBLIC_STATIC_SITE: 'true',
  NUXT_PUBLIC_SITE_URL: process.env.PAGES_SITE_URL || (process.env.GITHUB_REPOSITORY
    ? `https://${process.env.GITHUB_REPOSITORY.split('/')[0]}.github.io`
    : 'http://localhost:3000'),
  NUXT_APP_BASE_URL: basePath,
  NUXT_PRERENDER_ROUTES: JSON.stringify(routes),
}
const nuxtCli = resolve(root, 'node_modules/nuxt/bin/nuxt.mjs')
const result = await new Promise((resolvePromise, reject) => {
  const child = spawn(process.execPath, [nuxtCli, 'generate'], { cwd: root, env, stdio: 'inherit' })
  child.once('error', reject)
  child.once('exit', code => resolvePromise(code ?? 1))
})
if (result !== 0) process.exitCode = Number(result)
else await writeFile(resolve(root, '.output/public/.nojekyll'), '')

async function readData(path, query) {
  const url = new URL(path, `${directusUrl}/`)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error(`Directus request failed: ${url.pathname} (HTTP ${response.status}). Check the public API and permissions.`)
  const payload = await response.json()
  return payload.data
}

function safeExtension(filename, mimeType) {
  const extension = extname(filename || '').toLowerCase()
  if (/^\.[a-z0-9]{1,8}$/.test(extension)) return extension
  const mimeExtensions = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
    'image/avif': '.avif', 'image/svg+xml': '.svg', 'application/pdf': '.pdf',
    'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv', 'video/quicktime': '.mov',
  }
  return mimeExtensions[mimeType] || '.bin'
}

function normalizeBasePath(path) {
  const clean = `/${String(path).split('/').filter(Boolean).join('/')}`
  return clean === '/' ? '/' : `${clean}/`
}
