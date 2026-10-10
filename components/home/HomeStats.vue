<script setup lang="ts">
import { BoltIcon, BuildingStorefrontIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import Reveal from '~/components/home/Reveal.vue'
import { STATS } from '~/components/home/content'

const icons = [BuildingStorefrontIcon, BoltIcon, CheckBadgeIcon, ChatBubbleLeftRightIcon]
</script>

<template>
  <section aria-label="Key figures" class="bg-brand-700 px-4 py-10 text-white sm:px-8">
    <Reveal class="mx-auto max-w-6xl">
      <dl class="grid grid-cols-2 gap-8 lg:grid-cols-4">
        <div v-for="(stat, i) in STATS" :key="stat.label" class="flex flex-col gap-1">
          <component :is="icons[i]" class="mb-1 h-6 w-6 text-brand-200" aria-hidden="true" />
          <dd class="order-1 font-display text-3xl font-extrabold tabular-nums sm:text-4xl">{{ stat.value }}</dd>
          <dt class="order-2 text-sm font-semibold text-brand-100">{{ stat.label }}</dt>
        </div>
      </dl>
    </Reveal>
  </section>
</template>
