<script setup lang="ts">
import { assetUrl } from '#shared/format'
const { data } = await usePortfolio()
const photoUrl = computed(() => data.value?.profile.nature_photo ? assetUrl(data.value.profile.nature_photo, 1600) : null)
</script>

<template>
  <section class="nature-interlude shell" aria-labelledby="nature-title">
    <div class="nature-copy">
      <span class="eyebrow"><span class="status-dot" /> A MOMENT OUTSIDE</span>
      <h2 id="nature-title">Room to <em>breathe.</em></h2>
      <p>Curiosity grows when we make time to notice the world around us.</p>
    </div>
    <figure class="nature-photo">
      <img v-if="photoUrl" :src="photoUrl!" alt="A quiet moment in nature, from one of my walks" width="1600" height="900" loading="lazy">
      <div v-else class="nature-photo-empty"><Sparkle /></div>
      <span class="nature-tape nature-tape-l" aria-hidden="true" />
      <span class="nature-tape nature-tape-r" aria-hidden="true" />
      <figcaption class="nature-figcaption"><span class="nature-loc">SOMEWHERE GREEN ↗</span><span class="nature-date">A SLOW AFTERNOON</span></figcaption>
    </figure>
    <div class="nature-caption"><span class="nature-caption-mark" aria-hidden="true">✳</span><span>Under the same sky, there is always something new to discover.</span></div>
  </section>
</template>
