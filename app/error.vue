<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
</script>
<template><main class="error-page"><Sparkle /><span class="eyebrow">{{ error.statusCode === 404 ? 'PAGE NOT FOUND' : 'A LITTLE PAUSE' }}</span><h1>{{ error.statusCode === 404 ? 'No story on this page yet.' : 'A little pause in the story.' }}</h1><p>{{ error.statusCode === 404 ? 'The link may have changed, or this story has not been published yet.' : 'We cannot reach the content service right now. Please try again later.' }}</p><div><button class="button-primary" @click="clearError({ redirect: '/' })">Back to home <ArrowIcon /></button><button v-if="error.statusCode !== 404" class="button-secondary" @click="reloadNuxtApp({ force: true })">Try again</button></div></main></template>
