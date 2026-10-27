export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`))
}

export function formatStoryCount(count: number) {
  return `${count} ${count === 1 ? 'story' : 'stories'}`
}

export function assetUrl(file: string | null, width?: number) {
  if (!file) return null
  if (file.startsWith('/images/')) return file
  return `/api/media/${encodeURIComponent(file)}${width ? `?width=${width}` : ''}`
}
