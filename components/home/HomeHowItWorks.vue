<script setup lang="ts">
import Reveal from '~/components/home/Reveal.vue'
import { STEPS } from '~/components/home/content'
</script>

<template>
  <section id="how-it-works" class="mesh-soft overflow-hidden px-4 py-24 sm:px-8 lg:py-32">
    <div class="mx-auto max-w-6xl">
      <Reveal class="mx-auto mb-14 max-w-2xl text-center lg:mb-20">
        <span class="eyebrow">How it works</span>
        <h2 class="section-title mt-4">Three steps to your door</h2>
        <p class="section-lede mt-4">
          Get your prescriptions filled without leaving home — we handle the sourcing, verification, and delivery.
        </p>
      </Reveal>

      <div class="grid gap-6 md:grid-cols-3 lg:gap-8">
        <Reveal v-for="(step, i) in STEPS" :key="step.title" :delay="i * 0.12">
          <article class="group flex h-full flex-col overflow-hidden rounded-3xl border border-brand-100/80 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <div class="relative aspect-[5/4] overflow-hidden">
              <img
                :src="step.image"
                :alt="step.alt"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-brand-950/55 via-transparent to-transparent" aria-hidden="true"></div>
              <span
                data-step
                class="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white font-display text-lg font-extrabold text-brand-700 shadow-lg"
                aria-hidden="true"
              >{{ i + 1 }}</span>
            </div>
            <div class="flex flex-1 flex-col gap-2 p-6 sm:p-7">
              <h3 class="text-xl font-bold text-brand-950">{{ step.title }}</h3>
              <p class="leading-relaxed text-ink-500">{{ step.body }}</p>
            </div>
          </article>
        </Reveal>
      </div>
    </div>
  </section>
</template>
