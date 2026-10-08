<script setup lang="ts">
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/solid'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import Reveal from '~/components/home/Reveal.vue'
import { FAQS, SUPPORT_WHATSAPP } from '~/components/home/content'
</script>

<template>
  <section id="support" class="px-4 py-24 sm:px-8 lg:py-32">
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
          class="mt-7 inline-flex min-h-[3rem] items-center gap-2.5 rounded-2xl border border-brand-200 bg-white px-5 text-[0.95rem] font-bold text-brand-700 shadow-soft transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/50"
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
          class="rounded-3xl border border-brand-100/80 bg-white px-6 shadow-soft sm:px-8"
        >
          <AccordionItem
            v-for="faq in FAQS"
            :key="faq.id"
            :value="faq.id"
            class="last:border-b-0"
          >
            <AccordionTrigger class="text-[1.05rem] text-brand-950">{{ faq.question }}</AccordionTrigger>
            <AccordionContent>{{ faq.answer }}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Reveal>
    </div>
  </section>
</template>
