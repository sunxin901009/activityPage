import { mkdir, writeFile } from 'node:fs/promises'
const photos = {
  forest: 'photo-1441974231531-c6227db76b6e',
  cleanup: 'photo-1618477462146-050d2767eac4',
  classroom: 'photo-1503676260728-1c00da094a0b',
  baking: 'photo-1484723091739-30a097e8f929',
  water: 'photo-1500375592092-40eb2168fd21',
  journal: 'photo-1455390582262-044cdead277a',
  hiking: 'photo-1551632811-561732d1e306',
}
await mkdir('public/images', { recursive: true })
for (const [name, photo] of Object.entries(photos)) {
  const response = await fetch(`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1400&q=85`, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Photo ${name}: HTTP ${response.status}`)
  await writeFile(`public/images/${name}.jpg`, Buffer.from(await response.arrayBuffer()))
  console.log(`Downloaded ${name}`)
}
