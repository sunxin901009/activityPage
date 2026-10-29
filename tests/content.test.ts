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
  it('includes file MIME types so gallery videos are distinguishable from images', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: [{
      slug: 'video-story', body: '', media: [
        { id: 1, file: { id: 'public-video', type: 'video/mp4' }, kind: 'gallery' },
        { id: 2, file: null, kind: 'gallery' },
      ],
    }] }))
    vi.stubGlobal('fetch', fetchMock)
    const activity = await getActivity(config, 'video-story')
    expect(activity.media).toEqual([{ id: 1, file: 'public-video', mime_type: 'video/mp4', kind: 'gallery' }])
    expect(fetchMock.mock.calls[0]![0].searchParams.get('fields')).toContain('media.file.type')
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
  const videoId = '10000000-0000-4000-8000-000000000001'
  const posterId = '10000000-0000-4000-8000-000000000002'
  it('retains uploaded videos and posters without tokens, autoplay or event handlers', () => {
    const clean = sanitizeBody(`<video src="https://cms.test/assets/${videoId}.mp4?access_token=secret" poster="/assets/${posterId}" autoplay onerror="alert(1)"></video>`)
    expect(clean).toContain(`src="/api/media/${videoId}"`)
    expect(clean).toContain(`poster="/api/media/${posterId}?width=1200"`)
    expect(clean).toContain('controls')
    expect(clean).toContain('playsinline')
    expect(clean).toContain('preload="metadata"')
    expect(clean).not.toMatch(/secret|autoplay|onerror/)
  })
  it('supports nested video sources without assigning an empty src to their parent', () => {
    const clean = sanitizeBody(`<video><source src="/assets/${videoId}" type="video/mp4"></video>`)
    expect(clean).toContain(`<source src="/api/media/${videoId}" type="video/mp4"`)
    expect(clean).not.toContain('src=""')
  })
  it('removes remote and executable video sources and posters', () => {
    const clean = sanitizeBody('<video src="javascript:alert(1)" poster="https://tracker.test/pixel"><source src="https://remote.test/video.mp4"><source src="data:video/mp4;base64,aaa"></video>')
    expect(clean).not.toMatch(/javascript:|tracker|remote|data:|<source|src=|poster=/)
  })
  it('uses the same media sanitization for static exports, including repository base paths', () => {
    const clean = sanitizeBody(`<video poster="/assets/${posterId}"><source src="/api/media/${videoId}?token=secret" type="video/mp4"></video>`,
      (id, image) => `/portfolio/static-content/${id}${image ? '.jpg' : '.mp4'}`)
    expect(clean).toContain(`src="/portfolio/static-content/${videoId}.mp4"`)
    expect(clean).toContain(`poster="/portfolio/static-content/${posterId}.jpg"`)
    expect(clean).not.toMatch(/\/api\/media|\/assets\/|secret/)
  })
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
