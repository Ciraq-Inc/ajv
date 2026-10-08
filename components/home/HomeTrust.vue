<script setup lang="ts">
import { BuildingStorefrontIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <section aria-label="Certifications and compliance" class="px-4 pb-20 sm:px-8">
    <div class="mx-auto max-w-4xl rounded-3xl border border-brand-100 bg-brand-50/60 px-6 py-8 text-center">
      <p class="mb-6 text-xs font-bold uppercase tracking-[0.16em] text-ink-500">Accreditations &amp; compliance</p>
      <div class="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
        <div class="flex items-center gap-3 text-left">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-soft">
            <ShieldCheckIcon class="h-6 w-6" aria-hidden="true" />
          </span>
          <div class="flex flex-col">
            <span class="text-sm font-bold uppercase tracking-wide text-ink-600">Ghana Data Protection</span>
            <span class="text-xs font-semibold text-brand-700">Reg. No. 0004463</span>
          </div>
        </div>
        <span class="hidden h-8 w-px bg-brand-200 sm:block" aria-hidden="true"></span>
        <div class="flex items-center gap-3 text-left">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-soft">
            <BuildingStorefrontIcon class="h-6 w-6" aria-hidden="true" />
          </span>
          <span class="text-sm font-bold uppercase tracking-wide text-ink-600">Pharmacy Council accredited pharmacies</span>
        </div>
      </div>
    </div>
  </section>
</template>
