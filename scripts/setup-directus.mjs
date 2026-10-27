import { createCmsClient } from './cms-client.mjs'
import { collections, relations, publicFileField, publicPermissions, initialCategories } from './cms-model.mjs'

const { request, login } = createCmsClient()
await login()
const existingCollections = await request('/collections')
for (const collection of collections) {
  if (!existingCollections.some(item => item.collection === collection.collection)) {
    await request('/collections', { method: 'POST', body: collection })
    console.log(`Created ${collection.collection}`)
  } else {
    const fields = await request(`/fields/${collection.collection}`)
    for (const field of collection.fields) {
      if (!fields.some(item => item.field === field.field)) await request(`/fields/${collection.collection}`, { method: 'POST', body: field })
    }
  }
}
const fileFields = await request('/fields/directus_files')
if (!fileFields.some(field => field.field === publicFileField.field)) await request('/fields/directus_files', { method: 'POST', body: publicFileField })
const existingRelations = await request('/relations')
for (const relation of relations) {
  if (!existingRelations.some(item => item.collection === relation.collection && item.field === relation.field)) await request('/relations', { method: 'POST', body: relation })
}

const policies = await request('/policies?limit=-1')
let policy = policies.find(item => item.name === 'Portfolio Public')
if (!policy) policy = await request('/policies', { method: 'POST', body: { name: 'Portfolio Public', icon: 'public', description: 'Published activities and explicitly public files only.', admin_access: false, app_access: false } })
const accesses = await request('/access?limit=-1')
if (!accesses.some(item => item.policy === policy.id && !item.role && !item.user)) await request('/access', { method: 'POST', body: { policy: policy.id, role: null, user: null } })
const permissions = await request(`/permissions?filter[policy][_eq]=${policy.id}&limit=-1`)
for (const permission of publicPermissions) {
  const previous = permissions.find(item => item.collection === permission.collection && item.action === 'read')
  const body = { ...permission, action: 'read', policy: policy.id }
  await request(previous ? `/permissions/${previous.id}` : '/permissions', { method: previous ? 'PATCH' : 'POST', body })
}
// Preserve existing policies but fail if overlapping permissions could broaden access.
const publicPolicyIds = accesses.filter(item => !item.role && !item.user && item.policy !== policy.id).map(item => item.policy)
if (policies.some(item => publicPolicyIds.includes(item.id) && item.admin_access)) throw new Error('Another public administrator policy was found. Remove it in the admin panel first.')
const allPermissions = await request('/permissions?limit=-1')
if (allPermissions.some(item => publicPolicyIds.includes(item.policy) && publicPermissions.some(scope => scope.collection === item.collection))) throw new Error('Another public policy grants access to portfolio collections. Review and remove overlapping permissions first.')

const categories = await request('/items/categories?limit=-1')
for (const category of initialCategories) {
  if (!categories.some(item => item.slug === category.slug)) await request('/items/categories', { method: 'POST', body: category })
}
const profile = await request('/items/profile')
if (!profile?.name) await request('/items/profile', { method: 'PATCH', body: { name: 'Wang Tairan', tagline: 'Stay curious. Step into the world.', introduction: 'Add your personal introduction in the admin panel.', school: '', interest: 'Environmental Science' } })
await request('/settings', { method: 'PATCH', body: { project_name: 'Wang Tairan · Activity Manager', project_color: '#294F3B', default_language: 'en-US' } })
console.log('CMS initialized. No sample activities were published. Run npm run cms:verify before going live.')
