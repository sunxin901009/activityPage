<script setup lang="ts">
type PortfolioTheme = 'field-notes' | 'meadow-breeze' | 'ocean-spray' | 'sunset-grove'

const theme = useState<PortfolioTheme>('portfolio-theme', () => 'field-notes')
const isOpen = ref(false)
const options: { id: PortfolioTheme; name: string; note: string; colors: string[] }[] = [
  { id: 'field-notes', name: 'Field Notes', note: 'Soft & botanical', colors: ['#f7f7ef', '#294f3b', '#e17f5d'] },
  { id: 'meadow-breeze', name: 'Meadow Breeze', note: 'Fresh & playful', colors: ['#eef6df', '#3a8f4a', '#e08e3c'] },
  { id: 'ocean-spray', name: 'Ocean Spray', note: 'Misty forest pond', colors: ['#ecf6ef', '#1e7a63', '#e0703a'] },
  { id: 'sunset-grove', name: 'Sunset Grove', note: 'Warm & golden', colors: ['#fff4dd', '#a8541f', '#c22b4a'] },
]
</script>

<template>
  <aside class="theme-switcher" aria-label="Page appearance">
    <button
      class="theme-switcher-trigger"
      type="button"
      aria-controls="theme-options"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="theme-trigger-spark" aria-hidden="true">✳</span>
      <span>Style</span>
    </button>
    <section v-if="isOpen" id="theme-options" class="theme-panel" aria-label="Choose a visual style">
      <div class="theme-panel-heading">
        <span class="theme-panel-kicker">MAKE IT YOURS</span>
        <strong>Choose a look</strong>
      </div>
      <div class="theme-options" role="radiogroup" aria-label="Visual style">
        <button
          v-for="option in options"
          :key="option.id"
          class="theme-option"
          :class="{ selected: theme === option.id }"
          type="button"
          role="radio"
          :aria-checked="theme === option.id"
          @click="theme = option.id"
        >
          <span class="theme-swatches" aria-hidden="true">
            <i v-for="color in option.colors" :key="color" :style="{ backgroundColor: color }" />
          </span>
          <span class="theme-option-copy"><strong>{{ option.name }}</strong><small>{{ option.note }}</small></span>
          <span class="theme-option-check" aria-hidden="true">{{ theme === option.id ? '✓' : '' }}</span>
        </button>
      </div>
    </section>
  </aside>
</template>
