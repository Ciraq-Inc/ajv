<script setup lang="ts">
import { BoltIcon, BuildingStorefrontIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import Reveal from '~/components/home/Reveal.vue'
import { STATS } from '~/components/home/content'

const icons = [BuildingStorefrontIcon, BoltIcon, CheckBadgeIcon, ChatBubbleLeftRightIcon]
</script>

<template>
  <section aria-label="Key figures" class="relative z-10 -mt-10 px-4 sm:px-8 lg:-mt-14">
    <Reveal class="mx-auto max-w-6xl">
      <dl class="grid grid-cols-2 divide-brand-100 overflow-hidden rounded-3xl border border-white bg-white shadow-lift lg:grid-cols-4 lg:divide-x">
        <div
          v-for="(stat, i) in STATS"
          :key="stat.label"
          class="flex flex-col items-center gap-1.5 border-brand-100 px-4 py-7 text-center sm:py-9"
          :class="i < 2 ? 'border-b lg:border-b-0' : ''"
        >
          <span class="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <component :is="icons[i]" class="h-6 w-6" aria-hidden="true" />
          </span>
          <dt class="order-2 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink-500">{{ stat.label }}</dt>
          <dd class="order-1 font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{{ stat.value }}</dd>
        </div>
      </dl>
    </Reveal>
  </section>
</template>
