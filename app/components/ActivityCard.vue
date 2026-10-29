<script setup lang="ts">
import type { Activity } from '#shared/types'
import { assetUrl } from '#shared/format'
defineProps<{ activity: Activity; index?: number }>()
</script>

<template>
  <NuxtLink :to="`/activity/${activity.slug}`" class="activity-card group" :style="{ '--delay': `${(index || 0) * 60}ms` }">
    <div :class="['card-image', `tone-${activity.category.color}`]">
      <img v-if="activity.cover" :src="assetUrl(activity.cover, 800)!" :alt="activity.cover_alt || activity.title" loading="lazy" width="800" height="600">
      <div v-else class="image-placeholder"><Sparkle /><span>{{ activity.category.title }}</span></div>
      <span class="card-category">{{ activity.category.title }}</span>
      <span class="card-open"><ArrowIcon /></span>
    </div>
    <div class="card-content">
      <div class="card-meta">
        <!-- <time :datetime="activity.date">{{ formatDate(activity.date) }}</time> -->
        <span>{{ activity.role }}</span>
      </div>
      <h3>{{ activity.title }}</h3>
      <!-- <p>{{ activity.summary }}</p> -->
      <span class="card-link">Read the story <span>↗</span></span>
    </div>
  </NuxtLink>
</template>
