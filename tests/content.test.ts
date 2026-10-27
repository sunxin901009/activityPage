import { afterEach, describe, expect, it, vi } from 'vitest'
import { getActivity, getPortfolio, sanitizeBody } from '../server/utils/content'
import { assetUrl } from '../shared/format'

const config = { contentMode: 'directus', directusUrl: 'http://cms.test:8055' }
afterEach(() => vi.unstubAllGlobals())

describe('public content boundary', () => {
  it('does not silently show demo data when CMS is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(getPortfolio(config)).rejects.toMatchObject({ statusCode: 503 })
  })
  it('does not turn a CMS permission failure into an empty successful page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })))
    await expect(getPortfolio(config)).rejects.toMatchObject({ statusCode: 503 })
  })
  it('requires published status and never sends an administrative credential', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getActivity(config, 'hidden-activity')).rejects.toMatchObject({ statusCode: 404 })
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url.searchParams.get('filter[status][_eq]')).toBe('published')
    expect(url.searchParams.get('filter[slug][_eq]')).toBe('hidden-activity')
    expect(options.headers).toBeUndefined()
  })
  it('returns 404 for missing demo activities', async () => {
    await expect(getActivity({ ...config, contentMode: 'demo' }, 'not-present')).rejects.toMatchObject({ statusCode: 404 })
  })
  it('rejects invalid slugs before contacting the CMS', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(getActivity(config, '../../profile')).rejects.toMatchObject({ statusCode: 404 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('marks explicit demo content and excludes full article bodies from the index', async () => {
    const data = await getPortfolio({ ...config, contentMode: 'demo' })
    expect(data.demo).toBe(true)
    expect(data.categories).toHaveLength(5)
    expect(data.activities[0]).not.toHaveProperty('body')
  })
  it('rejects unknown content modes', async () => {
    await expect(getPortfolio({ ...config, contentMode: 'typo' })).rejects.toMatchObject({ statusCode: 500 })
  })
})

describe('rich text safety', () => {
  it('removes script, event handlers and script URLs while retaining editorial markup', () => {
    const clean = sanitizeBody('<h2>Title</h2><script>alert(1)</script><p onclick="alert(1)">Text</p><a href="javascript:alert(1)">Link</a><iframe src="https://evil.test"></iframe>')
    expect(clean).toContain('<h2>Title</h2>')
    expect(clean).not.toMatch(/<script|onclick|javascript:|<iframe/)
  })
  it('routes uploaded images through the permission checked media endpoint', () => {
    const clean = sanitizeBody('<img src="https://cms.example.com/assets/10000000-0000-4000-8000-000000000001?token=secret" onerror="alert(1)" alt="Photo">')
    expect(clean).toContain('/api/media/10000000-0000-4000-8000-000000000001?width=1200')
    expect(clean).not.toContain('secret')
    expect(clean).not.toContain('onerror')
  })
  it('does not embed arbitrary remote images or data URLs in articles', () => {
    expect(sanitizeBody('<img src="https://tracker.example/pixel"><img src="data:image/svg+xml;base64,xxx">')).toBe('')
  })
  it('uses only local demo media or the same-origin media route', () => {
    expect(assetUrl('/images/forest.jpg', 800)).toBe('/images/forest.jpg')
    expect(assetUrl('file-id', 800)).toBe('/api/media/file-id?width=800')
    expect(assetUrl(null)).toBeNull()
  })
})
