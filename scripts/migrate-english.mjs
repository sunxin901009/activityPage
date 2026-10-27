import { createCmsClient } from './cms-client.mjs'
import { collections, publicFileField } from './cms-model.mjs'

// Match known initial content exactly so later editorial changes are preserved.
const initialCopy = new Map([
  ['与世界温柔相处', 'A little kindness goes a long way'],
  ['从身边的小事开始，把关心变成行动。', 'Turning care into action, starting close to home.'],
  ['把课堂延伸到远方', 'Learning beyond the classroom'],
  ['走进新的校园，与不同的想法相遇。', 'New campuses, different perspectives, and room to explore.'],
  ['好问题，值得探索', 'Good questions deserve exploring'],
  ['观察、提问、实验，再重新思考。', 'Observe, ask, experiment, and think again.'],
  ['让想法留下痕迹', 'Giving ideas a life on the page'],
  ['整理观察与思考，记录研究和写作。', 'Collecting observations, reflections, research, and writing.'],
  ['热爱，不止一种形状', 'More than one way to find joy'],
  ['在生活的细节里，寻找属于自己的节奏。', 'Finding my own rhythm in the details of everyday life.'],
  ['保持好奇，走进世界。', 'Stay curious. Step into the world.'],
  ['请在后台填写真实的个人简介。', 'Add your personal introduction in the admin panel.'],
])

const { request, login } = createCmsClient()
await login()
for (const collection of collections) {
  await request(`/collections/${collection.collection}`, { method: 'PATCH', body: { meta: { translations: collection.meta.translations } } })
  for (const field of collection.fields) {
    const { translations, note, options } = field.meta || {}
    const meta = { ...(translations ? { translations } : {}), ...(note ? { note } : {}), ...(options ? { options } : {}) }
    if (Object.keys(meta).length) await request(`/fields/${collection.collection}/${field.field}`, { method: 'PATCH', body: { meta } })
  }
}
await request('/fields/directus_files/is_public', { method: 'PATCH', body: { meta: { translations: publicFileField.meta.translations, note: publicFileField.meta.note } } })
for (const collection of ['profile', 'categories']) {
  const result = await request(`/items/${collection}?limit=-1`)
  for (const item of Array.isArray(result) ? result : [result]) {
    const patch = Object.fromEntries(Object.entries(item).filter(([, value]) => initialCopy.has(value)).map(([key, value]) => [key, initialCopy.get(value)]))
    if (Object.keys(patch).length) await request(`/items/${collection}${collection === 'profile' ? '' : `/${item.id}`}`, { method: 'PATCH', body: patch })
  }
}
const policies = await request('/policies?filter[name][_eq]=Portfolio%20Public')
for (const policy of policies) await request(`/policies/${policy.id}`, { method: 'PATCH', body: { description: 'Published activities and explicitly public files only.' } })
await request('/settings', { method: 'PATCH', body: { project_name: 'Wang Tairan · Activity Manager', default_language: 'en-US' } })
await request('/users/me', { method: 'PATCH', body: { language: 'en-US' } })

const remaining = []
for (const collection of ['profile', 'categories', 'activities', 'activity_media']) {
  const content = await request(`/items/${collection}?limit=-1`)
  for (const item of Array.isArray(content) ? content : [content]) {
    for (const [field, value] of Object.entries(item || {})) {
      if (typeof value === 'string' && /\p{Script=Han}/u.test(value)) remaining.push({ collection, id: item.id, field })
    }
  }
}
if (remaining.length) throw new Error(`Content still needs translation: ${JSON.stringify(remaining)}`)
console.log('English metadata, initial content, project settings and administrator language updated.')
