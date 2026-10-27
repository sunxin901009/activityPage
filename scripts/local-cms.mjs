import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'

// Development fallback for machines without Docker; production uses PostgreSQL via Compose.
await mkdir('.tools/cms/uploads', { recursive: true })
try { await access('.env') } catch {
  const source = await readFile('.env.example', 'utf8')
  await writeFile('.env', source.replace('replace-with-a-long-random-password', randomBytes(24).toString('base64url')).replace('replace-with-at-least-32-random-characters', randomBytes(32).toString('hex')).replace('replace-with-a-different-random-password', randomBytes(24).toString('hex')))
}
process.loadEnvFile('.env')
const env = {
  ...process.env, DB_CLIENT: 'sqlite3', DB_FILENAME: resolve('.tools/cms/data-v11.db'),
  STORAGE_LOCATIONS: 'local', STORAGE_LOCAL_DRIVER: 'local', STORAGE_LOCAL_ROOT: resolve('.tools/cms/uploads'),
  SECRET: process.env.DIRECTUS_SECRET, HOST: '127.0.0.1', PORT: '8055',
  PUBLIC_URL: 'http://localhost:8055', TELEMETRY: 'false', CACHE_ENABLED: 'false', ASSETS_CACHE_TTL: '0',
  PM2_HOME: resolve('.tools/cms/.pm2'),
}
const cli = resolve('.tools/cms/node_modules/directus/cli.js')
function run(args) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { env, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? done() : reject(new Error(`Directus exited ${code}`)))
  })
}
await run(['bootstrap'])
await run(['start'])
