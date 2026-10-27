import assert from 'node:assert/strict'
import { createCmsClient } from './cms-client.mjs'

const { request, login, url } = createCmsClient()
await login()
const categories = await request('/items/categories?limit=1')
assert(categories.length, 'Run cms:setup first')
let activity, privateFile, publicFile
async function denied(path, options = {}) {
  try { await request(path, { ...options, anonymous: true }) }
  catch (error) { assert([401, 403, 404].includes(error.status), error.message); return }
  throw new Error(`Access control failed: ${path}`)
}
async function upload(name, isPublic) {
  const form = new FormData()
  form.set('title', name)
  form.set('is_public', String(isPublic))
  form.set('file', new Blob(['portfolio integration test'], { type: 'text/plain' }), `${name}.txt`)
  return request('/files', { method: 'POST', body: form })
}
try {
  const slug = `verification-${Date.now()}`
  privateFile = await upload(`${slug}-private`, false)
  publicFile = await upload(`${slug}-public`, true)
  activity = await request('/items/activities', { method: 'POST', body: { title: 'Temporary Verification Activity', slug, status: 'draft', date: '2026-01-01', category: categories[0].id, summary: 'Removed after verification', body: '<p>Live CMS integration check</p>', media: [{ file: privateFile.id, kind: 'attachment', caption: 'private' }, { file: publicFile.id, kind: 'attachment', caption: 'public' }] } })
  const query = `/items/activities?filter[slug][_eq]=${slug}&fields=id,title,media.file`
  assert.equal((await request(query, { anonymous: true })).length, 0, 'A draft was exposed in the public list')
  await denied(`/items/activities/${activity.id}`)
  await denied('/items/activities', { method: 'POST', body: { title: 'unauthorized' } })
  await denied(`/items/activities/${activity.id}`, { method: 'PATCH', body: { title: 'unauthorized' } })
  await denied(`/items/activities/${activity.id}`, { method: 'DELETE' })
  await request(`/items/activities/${activity.id}`, { method: 'PATCH', body: { status: 'published' } })
  const published = await request(query, { anonymous: true })
  assert.equal(published.length, 1)
  assert.equal(published[0].media.length, 1, 'A private attachment appeared in public data')
  assert.equal(published[0].media[0].file, publicFile.id)
  for (const [file, expected] of [[privateFile, false], [publicFile, true]]) {
    const response = await fetch(`${url}/assets/${file.id}`)
    assert.equal(response.ok, expected, 'File permissions failed')
  }
  await request(`/files/${publicFile.id}`, { method: 'PATCH', body: { is_public: false } })
  assert.equal((await fetch(`${url}/assets/${publicFile.id}`)).ok, false, 'File still accessible after withdrawal')
  await request(`/items/activities/${activity.id}`, { method: 'PATCH', body: { status: 'archived' } })
  assert.equal((await request(query, { anonymous: true })).length, 0, 'Archived activity still publicly readable')
  console.log('PASS: draft isolation, publishing, archiving, anonymous write denial, attachment filtering, and file access controls.')
} finally {
  if (activity) await request(`/items/activities/${activity.id}`, { method: 'DELETE' })
  if (privateFile) await request(`/files/${privateFile.id}`, { method: 'DELETE' })
  if (publicFile) await request(`/files/${publicFile.id}`, { method: 'DELETE' })
}
