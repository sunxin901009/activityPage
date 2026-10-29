<script setup lang="ts">
import { assetUrl } from '#shared/format'
const route = useRoute()
const { data: activity, error } = await useActivity(() => String(route.params.slug))
if (error.value) throw createError({ statusCode: error.value.statusCode || 503, statusMessage: error.value.statusCode === 404 ? 'This activity does not exist or has not been published.' : 'This story is temporarily unavailable. Please try again later.' })
const { data: portfolio } = await usePortfolio()
const gallery = computed(() => activity.value?.media.filter(item => item.kind === 'gallery') || [])
const attachments = computed(() => activity.value?.media.filter(item => item.kind === 'attachment') || [])
const galleryTitle = computed(() => gallery.value.some(item => item.mime_type?.startsWith('video/')) ? 'Photos and Videos' : 'In Pictures')
const related = computed(() => portfolio.value?.activities.filter(item => item.category.slug === activity.value?.category.slug && item.id !== activity.value?.id).slice(0, 2) || [])
const copyState = ref('Copy link')
async function copyLink() {
  try { await navigator.clipboard.writeText(window.location.href); copyState.value = 'Link copied' }
  catch { copyState.value = 'Please copy the link from your address bar' }
}
const config = useRuntimeConfig()
useSeoMeta({ title: () => `${activity.value?.title} · ${portfolio.value?.profile.name}`, description: () => activity.value?.summary, ogType: 'article', ogImage: () => activity.value?.cover ? new URL(assetUrl(activity.value.cover, 1200)!, config.public.siteUrl).href : undefined })
</script>

<template>
  <div v-if="activity" class="detail-page">
    <div class="shell"><div class="breadcrumb"><NuxtLink to="/">Home</NuxtLink><span>/</span><NuxtLink :to="`/activities/${activity.category.slug}`">{{ activity.category.title }}</NuxtLink><span>/</span><span>Activity Stories</span></div></div>
    <header class="article-heading">
      <NuxtLink :to="`/activities/${activity.category.slug}`" :class="['article-category', `tone-${activity.category.color}`]">{{ activity.category.title }}</NuxtLink><h1>{{ activity.title }}</h1><p>{{ activity.summary }}</p>
      <!-- <div class="article-meta"><time :datetime="activity.date">{{ formatDate(activity.date) }}</time><span>{{ activity.location }}</span><span>{{ activity.role }}</span></div> -->
    </header>
    <figure v-if="activity.cover" class="article-cover shell"><img :src="assetUrl(activity.cover, 1600)!" :alt="activity.cover_alt || activity.title" width="1600" height="950" fetchpriority="high"><figcaption>{{ activity.cover_alt }}</figcaption></figure>
    <div class="article-layout shell">
      <aside class="article-sidebar"><span class="eyebrow">IN THIS STORY</span><a href="#story">Activity Stories</a><a v-if="gallery.length" href="#gallery">{{ galleryTitle }}</a><a v-if="activity.outcome" href="#outcome">Outcomes and Takeaways</a><a v-if="activity.reflection" href="#reflection">Reflections</a><a v-if="attachments.length" href="#attachments">Related Materials</a><button @click="copyLink">{{ copyState }} ↗</button><span class="sr-only" role="status">{{ copyState }}</span></aside>
      <article class="article-content">
        <p v-if="portfolio?.demo" class="demo-notice">Sample content · The text and illustrative photos on this page demonstrate the layout and do not represent actual activities.</p>
        <div id="story" class="prose" v-html="activity.body" />
        <section v-if="gallery.length" id="gallery" class="article-section">
          <h2>{{ galleryTitle }}</h2>
          <div class="article-gallery">
            <figure v-for="media in gallery" :key="media.id">
              <video v-if="media.mime_type?.startsWith('video/')" :src="assetUrl(media.file)!" controls playsinline preload="metadata" :aria-label="media.caption || activity.title">
                Your browser does not support this video. <a :href="assetUrl(media.file)!" download>Download video</a>
              </video>
              <a v-else :href="assetUrl(media.file)!" target="_blank" rel="noopener noreferrer" :aria-label="`View full image: ${media.caption || activity.title}`"><img :src="assetUrl(media.file, 800)!" :alt="media.caption || activity.title" loading="lazy"></a>
              <figcaption>{{ media.caption }}</figcaption>
            </figure>
          </div>
        </section>
        <section v-if="activity.outcome" id="outcome" class="outcome-note article-section"><span class="eyebrow">WHAT CAME OUT OF IT</span><h2>Outcomes and Takeaways</h2><p>{{ activity.outcome }}</p></section>
        <section v-if="activity.reflection" id="reflection" class="article-section reflection"><h2>Reflections</h2><p>{{ activity.reflection }}</p></section>
        <section v-if="attachments.length" id="attachments" class="article-section"><h2>Related Materials</h2><a v-for="media in attachments" :key="media.id" :href="assetUrl(media.file)!" download class="attachment" target="_blank" rel="noopener noreferrer">{{ media.caption || 'View attachment' }} <span>Download ↗</span></a></section>
        <div class="article-signature"><Sparkle /><span>Thanks for being part of the journey.</span></div>
      </article>
    </div>
    <section class="shell related-section"><div class="section-heading"><h2>The story <span class="serif-italic">continues.</span></h2><NuxtLink :to="`/activities/${activity.category.slug}`" class="text-link">Back to {{ activity.category.title }} <ArrowIcon /></NuxtLink></div><div v-if="related.length" class="activity-grid"><ActivityCard v-for="item in related" :key="item.id" :activity="item" /></div></section>
  </div>
</template>
