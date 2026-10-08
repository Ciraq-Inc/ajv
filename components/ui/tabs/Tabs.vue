<script setup lang="ts">
import { TabsRoot } from 'radix-vue'

// modelValue / defaultValue and update:modelValue fall through to TabsRoot.
</script>

<template>
  <TabsRoot>
    <slot />
  </TabsRoot>
</template>
