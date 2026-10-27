<script setup lang="ts">
import { formatStoryCount } from '#shared/format'
const route = useRoute()
const { data, error } = await usePortfolio()
if (error.value) throw createError({ statusCode: error.value.statusCode || 503, statusMessage: 'The activity list is temporarily unavailable.' })
const category = computed(() => data.value?.categories.find(item => item.slug === route.params.category))
if (!category.value) throw createError({ statusCode: 404, statusMessage: 'This chapter could not be found.' })
const sortOrder = ref('curated')
const activities = computed(() => {
  const items = data.value?.activities.filter(item => item.category.slug === category.value?.slug) || []
  return sortOrder.value === 'newest' ? [...items].sort((a, b) => b.date.localeCompare(a.date)) : items
})
useSeoMeta({ title: () => `${category.value?.title} · ${data.value?.profile.name}`, description: () => category.value?.description })
</script>

<template>
  <div v-if="category && data" class="shell category-page">
    <div class="breadcrumb"><NuxtLink to="/">Home</NuxtLink><span>/</span><span>{{ category.title }}</span></div>
    <section :class="['category-banner', `tone-${category.color}`]"><div><span class="eyebrow">A CHAPTER OF MY JOURNEY</span><h1><span class="category-number">{{ String(category.sort).padStart(2, '0') }}</span>{{ category.title }}<span class="green-text">.</span></h1><h2>{{ category.subtitle }}</h2><p>{{ category.description }}</p></div><div class="banner-decoration" aria-hidden="true"><Sparkle /><span>little things,<br><em>big meaning.</em></span></div></section>
    <div class="list-toolbar"><nav class="category-tabs" aria-label="Activity Categories"><NuxtLink v-for="item in data.categories" :key="item.id" :to="`/activities/${item.slug}`" :aria-current="category.slug === item.slug ? 'page' : undefined">{{ item.title }}<span>{{ data.activities.filter(activity => activity.category.slug === item.slug).length }}</span></NuxtLink></nav><label class="sort-select"><span class="sr-only">Sort activities</span><select v-model="sortOrder"><option value="curated">Curated order</option><option value="newest">Newest first</option></select></label></div>
    <p class="results-count">{{ formatStoryCount(activities.length) }} · {{ category.subtitle }}</p>
    <div v-if="activities.length" class="activity-grid"><ActivityCard v-for="(activity, index) in activities" :key="activity.id" :activity="activity" :index="index" /></div>
    <div v-else class="empty-state"><Sparkle /><h2>New stories are on the way.</h2><p>No stories have been published in this chapter yet. Check back soon.</p><NuxtLink to="/" class="button-primary">Explore other chapters <ArrowIcon /></NuxtLink></div>
    <div class="page-end"><span>✳</span> Every experience leaves a little something.</div>
  </div>
</template>
