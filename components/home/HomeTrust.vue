<script setup lang="ts">
import { BuildingStorefrontIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <section aria-label="Certifications and compliance" class="px-4 pb-20 sm:px-8">
    <div class="mx-auto max-w-4xl rounded-3xl bg-brand-50 px-6 py-8 text-center">
      <p class="mb-6 text-sm font-bold text-ink-600">Accreditations &amp; compliance</p>
      <div class="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
        <div class="flex items-center gap-3 text-left">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-700">
            <ShieldCheckIcon class="h-6 w-6" aria-hidden="true" />
          </span>
          <div class="flex flex-col">
            <span class="text-base font-bold text-ink-900">Ghana Data Protection</span>
            <span class="text-sm font-semibold text-brand-700">Reg. No. 0004463</span>
          </div>
        </div>
        <span class="hidden h-8 w-px bg-brand-200 sm:block" aria-hidden="true"></span>
        <div class="flex items-center gap-3 text-left">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-700">
            <BuildingStorefrontIcon class="h-6 w-6" aria-hidden="true" />
          </span>
          <span class="text-base font-bold text-ink-900">Pharmacy Council accredited pharmacies</span>
        </div>
      </div>
    </div>
  </section>
</template>
