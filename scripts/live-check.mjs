import { chromium } from '../.tools/browser/node_modules/playwright/index.mjs'
import { readFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createCmsClient } from './cms-client.mjs'

process.loadEnvFile('.env')
const { request, login, url } = createCmsClient()
await login()
const base = process.env.TEST_SITE_URL || 'http://127.0.0.1:3001'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
let activity, file
try {
  const portfolio = await (await fetch(`${base}/api/portfolio`)).json()
  assert.equal(portfolio.demo, false)
  assert.equal(portfolio.categories.length, 5)
  const form = new FormData()
  form.set('title', 'Temporary verification photo')
  form.set('is_public', 'true')
  form.set('file', new Blob([await readFile('public/images/forest.jpg')], { type: 'image/jpeg' }), 'verification.jpg')
  file = await request('/files', { method: 'POST', body: form })
  const slug = `live-test-${Date.now()}`
  activity = await request('/items/activities', { method: 'POST', body: {
    title: 'Rich Text Integration Check', slug, status: 'draft', date: '2026-01-01', category: portfolio.categories[0].id,
    summary: 'Test content, automatically removed after verification.', role: 'Verification', location: 'Local', cover: file.id, cover_alt: 'Temporary verification photo',
    body: `<h2>Live CMS Story</h2><p>Text and images from Directus.</p><img src="${url}/assets/${file.id}" alt="Story image"><script>alert('unsafe')</script>`,
    outcome: 'Verify images, gallery, and attachments.', reflection: 'Verify immediate content updates.',
    media: [{ file: file.id, kind: 'gallery', caption: 'In Pictures', sort: 1 }, { file: file.id, kind: 'attachment', caption: 'Download photo', sort: 2 }],
  } })
  assert.equal((await fetch(`${base}/activity/${slug}`)).status, 404)
  await request(`/items/activities/${activity.id}`, { method: 'PATCH', body: { status: 'published' } })
  const json = await (await fetch(`${base}/api/activities/${slug}`)).json()
  assert.equal(json.media.length, 2)
  assert(!json.body.includes('<script'))
  assert(json.body.includes('/api/media/'))
  assert.equal((await page.goto(`${base}/activity/${slug}`))?.status(), 200)
  await page.getByRole('heading', { name: 'Live CMS Story' }).waitFor()
  await page.locator('img').evaluateAll(async images => { for (const image of images) image.loading = 'eager'; await Promise.all(images.map(image => image.decode())) })
  assert(await page.locator('img').evaluateAll(images => images.every(image => image.naturalWidth > 0)))
  await mkdir('test-results', { recursive: true })
  await page.screenshot({ path: 'test-results/live-detail.png', fullPage: true, animations: 'disabled' })
  const image = await fetch(`${base}/api/media/${file.id}?width=800`)
  assert.equal(image.status, 200)
  assert.match(image.headers.get('content-type'), /image\/webp/)
  assert.equal(image.headers.get('cache-control'), 'no-store')
  const content = await (await fetch(`${base}/api/portfolio`)).json()
  assert(content.activities.some(item => item.id === activity.id))
  await request(`/items/activities/${activity.id}`, { method: 'PATCH', body: { title: 'Updated Activity Title' } })
  await page.reload()
  await page.getByRole('heading', { level: 1, name: 'Updated Activity Title' }).waitFor()
  await request(`/items/activities/${activity.id}`, { method: 'PATCH', body: { status: 'archived' } })
  assert.equal((await fetch(`${base}/activity/${slug}`)).status, 404)
  await request(`/files/${file.id}`, { method: 'PATCH', body: { is_public: false } })
  assert.equal((await fetch(`${base}/api/media/${file.id}?width=800`)).status, 404)
  await page.goto(`${base}/activities/hobbies`)
  await page.getByText('New stories are on the way.').waitFor()
  await page.goto(`${url}/admin/login`)
  await page.locator('input[type="email"]').fill(process.env.ADMIN_EMAIL)
  await page.locator('input[type="password"]').fill(process.env.ADMIN_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/admin/content**', { timeout: 20000 })
  await page.getByRole('button', { name: 'Remind Later', exact: true }).click()
  await page.goto(`${url}/admin/content/activities`)
  await page.getByText('Activity Stories', { exact: true }).first().waitFor()
  await page.screenshot({ path: 'test-results/admin.png', fullPage: true, animations: 'disabled' })
  await page.goto(`${url}/admin/content/activities/+`)
  await page.getByText('Story Content', { exact: true }).waitFor()
  await page.screenshot({ path: 'test-results/admin-editor.png', fullPage: true, animations: 'disabled' })
  console.log('PASS: live CMS → SSR, rich-text sanitization, inline photos, gallery, attachment, WebP resize, immediate edits, unpublish, file withdrawal, empty category, admin UI login.')
} finally {
  await browser.close()
  if (activity) await request(`/items/activities/${activity.id}`, { method: 'DELETE' })
  if (file) await request(`/files/${file.id}`, { method: 'DELETE' })
}
