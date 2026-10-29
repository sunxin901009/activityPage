import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, createRouter, toWebHandler } from 'h3'
import mediaHandler from '../server/api/media/[id].get'

const id = '10000000-0000-4000-8000-000000000001'
const handler = toWebHandler(createApp().use(createRouter().get('/api/media/:id', mediaHandler)))

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

function setup(response: Response) {
  vi.stubGlobal('useRuntimeConfig', () => ({ directusUrl: 'http://cms.test:8055' }))
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('public media streaming', () => {
  it('forwards byte ranges and preserves partial video responses for seeking', async () => {
    const fetchMock = setup(new Response('clip', { status: 206, headers: {
      'Content-Type': 'video/mp4', 'Content-Length': '4', 'Content-Range': 'bytes 4-7/12',
      'Accept-Ranges': 'bytes', 'ETag': '"video-v1"', 'Content-Disposition': 'attachment',
    } }))
    const response = await handler(new Request(`http://site.test/api/media/${id}`, { headers: {
      Range: 'bytes=4-7', 'If-Range': '"video-v1"', Cookie: 'admin=secret', Authorization: 'Bearer secret',
    } }))
    expect(response.status).toBe(206)
    expect(response.headers.get('Content-Range')).toBe('bytes 4-7/12')
    expect(response.headers.get('Accept-Ranges')).toBe('bytes')
    expect(response.headers.get('Content-Length')).toBe('4')
    expect(response.headers.get('ETag')).toBe('"video-v1"')
    expect(response.headers.get('Content-Disposition')).toBe('inline')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.text()).toBe('clip')
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url.toString()).toBe(`http://cms.test:8055/assets/${id}`)
    expect(options.headers.get('Range')).toBe('bytes=4-7')
    expect(options.headers.get('If-Range')).toBe('"video-v1"')
    expect(options.headers.has('Authorization')).toBe(false)
    expect(options.headers.has('Cookie')).toBe(false)
  })

  it('does not abort a video after the header timeout has elapsed', async () => {
    vi.useFakeTimers()
    const fetchMock = setup(new Response('clip', { headers: { 'Content-Type': 'video/mp4' } }))
    const response = await handler(new Request(`http://site.test/api/media/${id}`))
    await vi.advanceTimersByTimeAsync(16000)
    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(false)
    expect(await response.text()).toBe('clip')
  })

  it('preserves an unsatisfiable range response', async () => {
    setup(new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */12' } }))
    const response = await handler(new Request(`http://site.test/api/media/${id}`, { headers: { Range: 'bytes=100-' } }))
    expect(response.status).toBe(416)
    expect(response.headers.get('Content-Range')).toBe('bytes */12')
  })

  it('keeps private files inaccessible', async () => {
    setup(new Response(null, { status: 403 }))
    const response = await handler(new Request(`http://site.test/api/media/${id}`))
    expect(response.status).toBe(404)
  })

  it('keeps documents as downloads', async () => {
    setup(new Response('document', { headers: { 'Content-Type': 'application/pdf' } }))
    const response = await handler(new Request(`http://site.test/api/media/${id}`))
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
  })
})
