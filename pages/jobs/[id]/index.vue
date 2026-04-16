<template>
  <div class="min-h-screen bg-white">
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
        <NuxtLink to="/jobs" class="font-bold text-slate-800 text-sm tracking-tight">Rigel Jobs</NuxtLink>
        <span class="text-slate-300">|</span>
        <NuxtLink to="/jobs" class="text-sm text-blue-600 hover:underline">All openings</NuxtLink>
      </div>
    </header>

    <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div v-if="loading" class="text-sm text-gray-500">Loading job details...</div>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>

      <article v-else-if="selectedJob" class="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-8">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-slate-900">{{ selectedJob.title }}</h1>
            <p class="text-sm text-slate-600 mt-1">{{ selectedJob.companyName }} · {{ selectedJob.location }}</p>
          </div>
          <span
            class="text-xs px-2 py-1 rounded-full self-start"
            :class="selectedJob.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
          >{{ selectedJob.status }}</span>
        </div>

        <p class="text-slate-700 mt-5 whitespace-pre-wrap leading-relaxed">{{ selectedJob.description }}</p>

        <div class="mt-6 flex flex-wrap gap-2 text-xs">
          <span class="px-2 py-1 rounded bg-white border border-slate-200">{{ selectedJob.employmentType }}</span>
          <span v-if="selectedJob.salaryMin || selectedJob.salaryMax" class="px-2 py-1 rounded bg-white border border-slate-200">
            GHS {{ selectedJob.salaryMin ?? '—' }} - {{ selectedJob.salaryMax ?? '—' }}
          </span>
          <span v-else class="px-2 py-1 rounded bg-white border border-slate-200">Salary negotiable</span>
          <span
            v-if="selectedJob.expiresAt"
            class="px-2 py-1 rounded border"
            :class="isExpired(selectedJob.expiresAt) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600'"
          >
            Deadline: {{ formatDate(selectedJob.expiresAt) }}{{ isExpired(selectedJob.expiresAt) ? ' · Closed' : '' }}
          </span>
          <span v-if="selectedJob.contactEmail" class="px-2 py-1 rounded bg-white border border-slate-200">{{ selectedJob.contactEmail }}</span>
        </div>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <!-- Application flow commented out — using direct WhatsApp instead
          <NuxtLink
            v-if="selectedJob.status === 'open' && !isExpired(selectedJob.expiresAt)"
            :to="`/jobs/${selectedJob.id}/apply`"
            class="inline-block px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Apply Now
          </NuxtLink>
          <p v-else class="text-sm text-slate-500 italic">This position is no longer accepting applications.</p>
          -->
          <a
            v-if="selectedJob.contactPhone"
            :href="whatsappJobUrl(selectedJob)"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#25d366] text-white text-sm font-semibold hover:bg-[#1ebe57] transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp Recruiter
          </a>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import phoneUtils from '~/utils/phone'

definePageMeta({ layout: false })

const route = useRoute()
const { selectedJob, loading, error, fetchJobById } = useJobs()

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const isExpired = (iso) => iso && new Date(iso).getTime() < Date.now()

const whatsappJobUrl = (job) => {
  const num = phoneUtils.formatWhatsApp(job.contactPhone)
  const text = encodeURIComponent(`Hi, I'm interested in the ${job.title} position listed on Rigel Jobs.`)
  return `https://wa.me/${num}?text=${text}`
}

onMounted(async () => {
  await fetchJobById(route.params.id)
})
</script>
