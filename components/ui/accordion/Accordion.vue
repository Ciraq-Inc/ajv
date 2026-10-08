<script setup lang="ts">
import { AccordionRoot } from 'radix-vue'

// Props (type, collapsible, defaultValue, modelValue...) and the
// update:modelValue listener fall through to AccordionRoot as attributes.
</script>

<template>
  <AccordionRoot>
    <slot />
  </AccordionRoot>
</template>
