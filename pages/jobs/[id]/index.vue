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

        <div class="mt-8">
          <NuxtLink
            v-if="selectedJob.status === 'open' && !isExpired(selectedJob.expiresAt)"
            :to="`/jobs/${selectedJob.id}/apply`"
            class="inline-block px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Apply Now
          </NuxtLink>
          <p v-else class="text-sm text-slate-500 italic">This position is no longer accepting applications.</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({ layout: false })

const route = useRoute()
const { selectedJob, loading, error, fetchJobById } = useJobs()

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const isExpired = (iso) => iso && new Date(iso).getTime() < Date.now()

onMounted(async () => {
  await fetchJobById(route.params.id)
})
</script>
