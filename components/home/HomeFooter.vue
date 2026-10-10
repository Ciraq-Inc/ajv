<script setup lang="ts">
import { EnvelopeIcon, PhoneIcon, ShareIcon } from '@heroicons/vue/24/outline'
import { SUPPORT_PHONE } from '~/components/home/content'

const currentYear = new Date().getFullYear()

const quickLinks = ['Find a pharmacy', 'Request medication', 'Partner login', 'Wellness resources']
const legalLinks = [
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Terms of service', href: '#' },
  { label: 'Cookie settings', href: '#' },
  { label: 'Accessibility', href: '#' },
]
const payments = [
  { alt: 'Visa', src: 'https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/card-logo-visa.svg' },
  { alt: 'Mastercard', src: 'https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/card-logo-mastercard.svg' },
  { alt: 'MTN Mobile Money', src: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/mtn-mobile-logo-icon.svg' },
]

const linkClass = 'text-brand-200/80 transition hover:text-white hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm'
const socialClass = 'flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-brand-100 transition hover:bg-white hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60'
</script>

<template>
  <footer class="relative overflow-hidden bg-brand-950 px-4 pb-10 pt-16 text-brand-100 sm:px-8">
    <div class="dot-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true"></div>

    <div class="relative mx-auto mb-12 grid max-w-6xl gap-10 md:grid-cols-4">
      <div>
        <div class="mb-4 flex items-center gap-2.5">
          <img src="/brand/rig-mark.svg" alt="" width="32" height="32" class="rounded-lg bg-white/10 p-1" />
          <span class="font-display text-xl font-extrabold text-white">MedsGh</span>
        </div>
        <p class="text-sm leading-relaxed text-brand-200/80">
          Connecting patients with verified pharmacies across Ghana for safe, fast medication delivery.
        </p>
      </div>

      <div>
        <h4 class="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-white">Quick links</h4>
        <ul class="space-y-2.5 text-sm">
          <li v-for="label in quickLinks" :key="label"><a :class="linkClass" href="#">{{ label }}</a></li>
        </ul>
      </div>

      <div>
        <h4 class="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-white">Legal</h4>
        <ul class="space-y-2.5 text-sm">
          <li v-for="link in legalLinks" :key="link.label"><a :class="linkClass" :href="link.href">{{ link.label }}</a></li>
        </ul>
      </div>

      <div>
        <h4 class="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-white">Contact</h4>
        <div class="mb-5 flex gap-3">
          <a href="mailto:rigelis@rigelisinc.com" aria-label="Email us" :class="socialClass">
            <EnvelopeIcon class="h-5 w-5" aria-hidden="true" />
          </a>
          <a :href="`tel:${SUPPORT_PHONE}`" aria-label="Call us" :class="socialClass">
            <PhoneIcon class="h-5 w-5" aria-hidden="true" />
          </a>
          <a href="#" aria-label="Share" :class="socialClass">
            <ShareIcon class="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
        <p class="text-xs text-brand-200/80">rigelis@rigelisinc.com</p>
      </div>
    </div>

    <div class="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row">
      <p class="text-xs text-brand-200/70">
        &copy; {{ currentYear }} MedsGh Digital Care. All rights reserved.
      </p>
      <div class="flex items-center gap-3">
        <span
          v-for="p in payments"
          :key="p.alt"
          class="flex h-8 items-center rounded-md bg-white px-2.5"
        >
          <img :alt="p.alt" :src="p.src" loading="lazy" class="h-4 w-auto" />
        </span>
      </div>
    </div>
  </footer>
</template>
