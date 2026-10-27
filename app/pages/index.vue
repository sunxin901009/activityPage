<script setup lang="ts">
import { assetUrl, formatStoryCount } from '#shared/format'
const { data, error } = await usePortfolio()
if (error.value) throw createError({ statusCode: error.value.statusCode || 503, statusMessage: 'The portfolio is temporarily unavailable. Please try again later.' })
useSeoMeta({ title: () => `${data.value?.profile.name} · A Journey of Curiosity`, description: () => data.value?.profile.introduction })
</script>

<template>
  <div v-if="data">
    <section class="shell hero">
      <div class="hero-copy">
        <div class="eyebrow"><span class="status-dot" /> A LITTLE ABOUT ME</div>
        <h1>Hi, I'm<br><span>{{ data.profile.name }}</span><span class="hello-dot">.</span></h1>
        <p class="hero-tagline">{{ data.profile.tagline }}<svg viewBox="0 0 280 15" aria-hidden="true"><path d="M3 10Q130-2 276 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" /></svg></p>
        <p class="hero-intro">{{ data.profile.introduction }}</p>
        <a href="#explore" class="button-primary">Explore my journey <ArrowIcon /></a>
        <div class="hero-footnote"><span>BASED IN BEIJING</span><span>CURIOUS ABOUT THE WORLD ↗</span></div>
      </div>
      <div class="hero-art">
        <div class="orbit-label">A WORK IN PROGRESS — JUST LIKE ME</div>
        <div class="hero-photo"><img v-if="data.profile.hero" :src="assetUrl(data.profile.hero, 1200)!" :alt="`A portrait of ${data.profile.name}`" fetchpriority="high" width="900" height="1100"><div v-else class="hero-no-photo"><Sparkle /></div><span class="photo-caption">THIS IS ME / LIFE & LEARNING</span></div>
        <div class="hero-collage" aria-hidden="true">
          <span class="hc-petal">✿</span>
          <span class="hc-quote">collecting sunlight,<br><em>one story at a time.</em></span>
          <span class="hc-chip hc-leaf">✳</span>
          <span class="hc-swatch"></span>
          <span class="hc-chip hc-seed">❋</span>
        </div>
        <div class="curiosity-sticker">Stay<br><em>curious.</em><Sparkle /></div>
        <div class="interest-note"><span class="note-pin" /><span class="note-small">MY NEXT CHAPTER</span><strong>{{ data.profile.interest }}</strong><svg viewBox="0 0 100 32" aria-hidden="true"><path d="M4 15q35 25 85-5m-19-1 20 1-6 17" fill="none" stroke="currentColor" stroke-width="2" /></svg></div>
        <span class="art-small-cross">✳</span>
      </div>
    </section>

    <section id="explore" class="explore-section">
      <div class="shell">
        <div class="section-heading"><div><span class="eyebrow">MY LITTLE UNIVERSE</span><h2>Every passion <span class="serif-italic">leaves a mark.</span></h2></div><p>Five paths. One unfolding journey.<br>Turn a page and get to know me.</p></div>
        <div class="category-grid">
          <NuxtLink v-for="(category, index) in data.categories" :key="category.id" :to="`/activities/${category.slug}`" :class="['category-tile', `tone-${category.color}`]">
            <div class="tile-top"><span>0{{ index + 1 }}</span><span class="tile-arrow">↗</span></div>
            <span class="tile-symbol" aria-hidden="true">{{ ['✳', '☀', '⌘', '✎', '❋'][index % 5] }}</span>
            <h3>{{ category.title }}</h3><p>{{ category.subtitle }}</p>
            <span class="tile-count">{{ formatStoryCount(data.activities.filter(activity => activity.category.slug === category.slug).length) }}</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!--
    <section v-if="featured.length" class="shell featured-section">
      <div class="section-heading"><div><span class="eyebrow">SELECTED STORIES</span><h2>A few <span class="serif-italic">moments to remember.</span></h2></div><span class="handwritten">Small steps, real stories <span>↙</span></span></div>
      <div class="activity-grid"><ActivityCard v-for="(activity, index) in featured" :key="activity.id" :activity="activity" :index="index" /></div>
    </section>

    <section v-if="recent.length" class="shell journal-section">
      <div class="journal-intro"><span class="eyebrow">THE JOURNEY SO FAR</span><h2>Growing,<br> one story at a time<span class="green-text">.</span></h2><p>Collecting experiences, one page at a time.<br>Following curiosity wherever it leads next.</p><Sparkle /></div>
      <div class="timeline"><NuxtLink v-for="activity in recent" :key="activity.id" :to="`/activity/${activity.slug}`" class="timeline-item"><time :datetime="activity.date">{{ activity.date.slice(0, 7).replace('-', ' / ') }}</time><div><span>{{ activity.category.title }}</span><h3>{{ activity.title }}</h3></div><ArrowIcon /></NuxtLink></div>
    </section>
    -->

    <NatureInterlude />
    <div class="closing-note shell"><span>“</span><p>Keep asking. Keep doing.<br><em>There is still so much world to discover.</em></p><Sparkle /></div>
  </div>
</template>

