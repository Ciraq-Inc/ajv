<script setup lang="ts">
import Reveal from '~/components/home/Reveal.vue'
import { STEPS } from '~/components/home/content'
</script>

<template>
  <section id="how-it-works" class="overflow-hidden bg-white px-4 py-16 sm:px-8 lg:py-24">
    <div class="mx-auto max-w-6xl">
      <Reveal class="mx-auto mb-8 max-w-2xl text-center md:mb-14 lg:mb-20">
        <span class="eyebrow">How it works</span>
        <h2 class="section-title mt-4">Three steps to your door</h2>
        <p class="section-lede mt-4">
          Get your prescriptions filled without leaving home — we handle the sourcing, verification, and delivery.
        </p>
      </Reveal>

      <div
        data-steps-track
        class="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        <Reveal
          v-for="(step, i) in STEPS"
          :key="step.title"
          :delay="i * 0.12"
          data-step-slot
          class="w-[82%] max-w-sm shrink-0 snap-center md:w-auto md:max-w-none"
        >
          <article class="flex h-full flex-col overflow-hidden rounded-3xl bg-ink-50">
            <div class="aspect-[16/10] overflow-hidden md:aspect-[5/4]">
              <img :src="step.image" :alt="step.alt" loading="lazy" class="h-full w-full object-cover" />
            </div>
            <div class="flex flex-1 flex-col gap-2.5 p-5 sm:p-7 md:gap-3">
              <span
                data-step
                class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 font-display text-lg font-extrabold text-white"
                aria-hidden="true"
              >{{ i + 1 }}</span>
              <h3 class="text-xl font-bold text-ink-900">{{ step.title }}</h3>
              <p class="text-base leading-relaxed text-ink-600">{{ step.body }}</p>
            </div>
          </article>
        </Reveal>
      </div>
    </div>
  </section>
</template>
