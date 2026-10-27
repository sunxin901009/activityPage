import { spawn } from 'node:child_process'
const command = process.argv[2] || 'dev'
const child = spawn(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', command, '--host', '127.0.0.1'], {
  stdio: 'inherit', env: { ...process.env, NUXT_CONTENT_MODE: 'demo' },
})
child.on('exit', code => process.exit(code || 0))
child.on('error', error => { console.error(error.message); process.exit(1) })
