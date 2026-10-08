<script setup lang="ts">
import { motion } from 'motion-v'

// Fades + lifts its content in once it scrolls into view. Falls back to a plain
// element when the user prefers reduced motion or IntersectionObserver is missing.
const props = withDefaults(defineProps<{ delay?: number; y?: number }>(), { delay: 0, y: 24 })

const canAnimate =
  typeof window !== 'undefined'
  && 'IntersectionObserver' in window
  && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
</script>

<template>
  <motion.div
    v-if="canAnimate"
    :initial="{ opacity: 0, y: props.y }"
    :while-in-view="{ opacity: 1, y: 0 }"
    :in-view-options="{ once: true, amount: 0.15 }"
    :transition="{ duration: 0.6, delay: props.delay, ease: [0.2, 0.8, 0.2, 1] }"
  >
    <slot />
  </motion.div>
  <div v-else>
    <slot />
  </div>
</template>
