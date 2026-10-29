import sanitizeHtml from 'sanitize-html'

function mediaId(src: string | undefined) {
  return src?.match(/(?:^|\/)(?:assets|api\/media)\/([a-f0-9-]{36})(?:\.[a-z0-9]+)?(?:[?#]|$)/i)?.[1]
}

// Both deployment modes resolve uploaded files through their public media boundary.
export function sanitizeBody(body: string, resolveFile: (id: string, image: boolean) => string | undefined =
  (id, image) => `/api/media/${id}${image ? '?width=1200' : ''}`) {
  const mediaUrl = (src: string | undefined, image = false) => {
    const id = mediaId(src)
    return id ? resolveFile(id, image) || '' : ''
  }
  return sanitizeHtml(body, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'video', 'source', 'figure', 'figcaption', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      video: ['src', 'poster', 'width', 'height', 'controls', 'preload', 'playsinline'],
      source: ['src', 'type'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: {
      a: (_tag, attrs) => ({ tagName: 'a', attribs: { ...attrs, rel: 'noopener noreferrer' } }),
      img: (_tag, attrs) => ({ tagName: 'img', attribs: { ...attrs, src: mediaUrl(attrs.src, true), loading: 'lazy' } }),
      video: (_tag, { src, poster, ...attrs }) => {
        const videoSrc = mediaUrl(src)
        const posterSrc = mediaUrl(poster, true)
        return { tagName: 'video', attribs: {
          ...attrs, ...(videoSrc ? { src: videoSrc } : {}), ...(posterSrc ? { poster: posterSrc } : {}),
          controls: '', preload: 'metadata', playsinline: '',
        } }
      },
      source: (_tag, attrs) => ({ tagName: 'source', attribs: { ...attrs, src: mediaUrl(attrs.src) } }),
    },
    exclusiveFilter: frame => ['img', 'source'].includes(frame.tag) && !frame.attribs.src,
  })
}
