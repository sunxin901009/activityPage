import tailwindcss from '@tailwindcss/vite'

const buildEnv = (globalThis as typeof globalThis & {
  process: { env: Record<string, string | undefined> }
}).process.env

export default defineNuxtConfig({
  compatibilityDate: '2026-03-01',
  devtools: { enabled: false },
  telemetry: false,
  css: ['~/assets/css/main.css', '~/assets/css/themes.css'],
  vite: { plugins: [tailwindcss()] },
  runtimeConfig: {
    contentMode: 'directus',
    directusUrl: 'http://127.0.0.1:8055',
    public: { siteUrl: 'http://localhost:3000', cmsUrl: 'http://localhost:8055', staticSite: false },
  },
  app: {
    baseURL: buildEnv.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Wang Tairan · A Journey of Curiosity',
      meta: [{ name: 'theme-color', content: '#f7f7ef' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: `${buildEnv.NUXT_APP_BASE_URL || '/'}favicon.svg` }],
    },
  },
  routeRules: { '/api/**': { headers: { 'Cache-Control': 'no-store' } } },
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: buildEnv.NUXT_PRERENDER_ROUTES
        ? JSON.parse(buildEnv.NUXT_PRERENDER_ROUTES)
        : [],
    },
  },
  typescript: { strict: true },
})
