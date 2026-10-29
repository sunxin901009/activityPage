import { createError, defineEventHandler, getQuery, getRequestHeader, getRouterParam, sendStream, setHeader, setResponseStatus } from 'h3'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') || ''
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw createError({ statusCode: 404, statusMessage: 'File not found.' })
  const config = useRuntimeConfig(event)
  const width = getQuery(event).width
  const url = new URL(`assets/${id}`, `${config.directusUrl.replace(/\/$/, '')}/`)
  if (width !== undefined) {
    if (!['480', '800', '1200', '1600'].includes(String(width))) throw createError({ statusCode: 400, statusMessage: 'Invalid image size.' })
    url.searchParams.set('width', String(width))
    url.searchParams.set('quality', '82')
    url.searchParams.set('format', 'webp')
    url.searchParams.set('withoutEnlargement', 'true')
  }
  const headers = new Headers({ 'Accept-Encoding': 'identity' })
  for (const name of ['Range', 'If-Range']) {
    const value = getRequestHeader(event, name)
    if (value) headers.set(name, value)
  }
  // Limit the wait for headers, not the duration of a large video stream.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  event.node.res.once('close', () => controller.abort())
  let response: Response
  try { response = await fetch(url, { headers, signal: controller.signal }) }
  catch { throw createError({ statusCode: 503, statusMessage: 'The file service is temporarily unavailable.' }) }
  finally { clearTimeout(timeout) }
  if (response.status === 416) {
    setResponseStatus(event, 416)
    const contentRange = response.headers.get('Content-Range')
    if (contentRange) setHeader(event, 'Content-Range', contentRange)
    setHeader(event, 'Cache-Control', 'no-store')
    await response.body?.cancel()
    return ''
  }
  if (!response.ok) throw createError({ statusCode: [403, 404].includes(response.status) ? 404 : 503, statusMessage: 'The file does not exist or is not publicly accessible.' })
  setResponseStatus(event, response.status)
  const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
  setHeader(event, 'Content-Type', contentType)
  for (const name of ['Content-Length', 'Content-Range', 'Accept-Ranges', 'ETag', 'Last-Modified']) {
    const value = response.headers.get(name)
    if (value) setHeader(event, name, value)
  }
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Content-Security-Policy', "default-src 'none'; sandbox")
  setHeader(event, 'Cache-Control', 'no-store')
  if (contentType.startsWith('video/')) {
    setHeader(event, 'Content-Disposition', 'inline')
  } else if (!contentType.startsWith('image/')) {
    setHeader(event, 'Content-Disposition', response.headers.get('Content-Disposition') || `attachment; filename="${id}"`)
  }
  return sendStream(event, response.body!)
})
