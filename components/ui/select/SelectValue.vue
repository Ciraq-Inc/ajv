<script setup lang="ts">
import { SelectValue } from 'radix-vue'

const props = defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <SelectValue :placeholder="props.placeholder" />
</template>
