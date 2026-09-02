<script setup lang="ts">
import { PopoverRoot } from 'radix-vue'

const open = defineModel<boolean>('open', { default: undefined })
</script>

<template>
  <PopoverRoot v-model:open="open">
    <slot />
  </PopoverRoot>
</template>
