<script setup lang="ts">
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/solid'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import Reveal from '~/components/home/Reveal.vue'
import { FAQS, SUPPORT_WHATSAPP } from '~/components/home/content'
</script>

<template>
  <section id="support" class="bg-white px-4 py-16 sm:px-8 lg:py-24">
    <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <Reveal class="lg:sticky lg:top-32 lg:self-start">
        <span class="eyebrow">FAQ</span>
        <h2 class="section-title mt-4">You may be wondering</h2>
        <p class="section-lede mt-4 max-w-md">
          Straight answers about licensing, prescriptions, delivery and your data. Can’t find yours? Talk to a person.
        </p>
        <a
          :href="SUPPORT_WHATSAPP"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-7 inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-brand-700 px-6 text-base font-bold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/50"
        >
          <ChatBubbleLeftRightIcon class="h-5 w-5" aria-hidden="true" />
          Chat with us on WhatsApp
        </a>
      </Reveal>

      <Reveal :delay="0.1">
        <Accordion
          type="single"
          collapsible
          :default-value="FAQS[0].id"
          class="rounded-3xl bg-ink-50 px-6 sm:px-8"
        >
          <AccordionItem
            v-for="faq in FAQS"
            :key="faq.id"
            :value="faq.id"
            class="last:border-b-0"
          >
            <AccordionTrigger class="text-lg text-ink-900">{{ faq.question }}</AccordionTrigger>
            <AccordionContent>{{ faq.answer }}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Reveal>
    </div>
  </section>
</template>
