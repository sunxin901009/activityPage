<script setup lang="ts">
import { assetUrl } from '#shared/format'
const { data } = await usePortfolio()
const photoUrl = computed(() => data.value?.profile.nature_photo ? assetUrl(data.value.profile.nature_photo, 1600) : null)
</script>

<template>
  <section class="nature-interlude" aria-labelledby="nature-title">
    <div class="nature-band">
      <img v-if="photoUrl" :src="photoUrl!" alt="A quiet moment in nature, from one of my walks" width="1600" height="900" loading="lazy">
      <div v-else class="nature-photo-empty"><Sparkle /></div>
      <div class="nature-band-overlay" aria-hidden="true" />
    </div>
    <div class="nature-copy shell">
      <span class="eyebrow"><span class="status-dot" /> A MOMENT OUTSIDE</span>
      <h2 id="nature-title">Room to <em>breathe.</em></h2>
      <p>Curiosity grows when we make time to notice the world around us.</p>
    </div>
  </section>
</template>
