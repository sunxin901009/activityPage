<script setup lang="ts">
const { data } = await usePortfolio()
const config = useRuntimeConfig()
const route = useRoute()
const menuOpen = ref(false)
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <div>
    <a href="#main" class="skip-link">Skip to main content</a>
    <header class="site-header">
      <div class="shell header-inner">
        <div class="brand-lockup">
          <NuxtLink to="/" class="brand" aria-label="Back to home"><Sparkle class="brand-star" />{{ data?.profile.name || 'My Portfolio' }}<span class="brand-dot">.</span></NuxtLink>
          <span class="brand-id">CAID 51303010</span>
        </div>
        <button class="menu-toggle" :aria-expanded="menuOpen" aria-controls="main-nav" @click="menuOpen = !menuOpen">{{ menuOpen ? 'Close ×' : 'Menu ☰' }}</button>
        <nav id="main-nav" :class="['main-nav', { open: menuOpen }]" aria-label="Main navigation">
          <NuxtLink v-for="category in data?.categories" :key="category.id" :to="`/activities/${category.slug}`">{{ category.title }}</NuxtLink>
        </nav>
      </div>
    </header>
    <main id="main"><slot /></main>
    <footer class="site-footer">
      <div class="shell footer-main">
        <div><NuxtLink to="/" class="brand">{{ data?.profile.name || 'My Portfolio' }}<span class="brand-dot">.</span></NuxtLink><p>Curiosity has no limits. The journey continues.</p></div>
        <div class="footer-note"><span class="status-dot" /> Always learning. Always growing.</div>
        <a v-if="data?.profile.email" :href="`mailto:${data.profile.email}`" class="text-link">Get in touch <ArrowIcon /></a>
      </div>
      <div class="shell footer-bottom"><span>© {{ new Date().getFullYear() }} {{ data?.profile.name }} · Personal portfolio</span><span v-if="data?.demo" class="demo-label">Demo preview · Sample stories and illustrative photos</span><a :href="config.public.cmsUrl" target="_blank" rel="noopener noreferrer">Manage content ↗</a></div>
    </footer>
    <!-- <ThemeSwitcher /> -->
  </div>
</template>
