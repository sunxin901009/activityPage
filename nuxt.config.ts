import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-03-01',
  devtools: { enabled: false },
  telemetry: false,
  css: ['~/assets/css/main.css', '~/assets/css/themes.css'],
  vite: { plugins: [tailwindcss()] },
  runtimeConfig: {
    contentMode: 'directus',
    directusUrl: 'http://127.0.0.1:8055',
    public: { siteUrl: 'http://localhost:3000', cmsUrl: 'http://localhost:8055' },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Wang Tairan · A Journey of Curiosity',
      meta: [{ name: 'theme-color', content: '#f7f7ef' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  routeRules: { '/api/**': { headers: { 'Cache-Control': 'no-store' } } },
  typescript: { strict: true },
})
