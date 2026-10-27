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
  let response: Response
  try { response = await fetch(url, { signal: AbortSignal.timeout(15000) }) }
  catch { throw createError({ statusCode: 503, statusMessage: 'The file service is temporarily unavailable.' }) }
  if (!response.ok) throw createError({ statusCode: [403, 404].includes(response.status) ? 404 : 503, statusMessage: 'The file does not exist or is not publicly accessible.' })
  setHeader(event, 'Content-Type', response.headers.get('Content-Type') || 'application/octet-stream')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Content-Security-Policy', "default-src 'none'; sandbox")
  setHeader(event, 'Cache-Control', 'no-store')
  if (!response.headers.get('Content-Type')?.startsWith('image/')) {
    setHeader(event, 'Content-Disposition', response.headers.get('Content-Disposition') || `attachment; filename="${id}"`)
  }
  return sendStream(event, response.body!)
})
