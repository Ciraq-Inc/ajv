<template>
  <div class="jobs-page min-h-screen">
    <div class="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <header
        class="bg-white/95 border border-white/70 rounded-2xl px-4 md:px-6 py-4 shadow-[0_14px_40px_rgba(35,53,84,0.08)]">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img src="~/assets/images/rigellogo.png" alt="Rigel" class="h-10 w-auto" />
            <div>
              <p class="text-sm font-semibold tracking-[0.08em] text-slate-800">RIGEL JOB FINDER</p>
              <p class="text-xs text-slate-500">Browse available talent</p>
            </div>
          </div>
          <nav class="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <NuxtLink to="/jobs" class="hover:text-slate-900">Home</NuxtLink>
            <NuxtLink to="/jobs/talent" class="font-semibold text-slate-900">Talent</NuxtLink>
            <NuxtLink to="/jobs/post"
              class="px-3 py-2 rounded-lg text-white bg-[var(--accent)] hover:bg-[var(--accent-strong)] font-semibold">
              Post a Job
            </NuxtLink>
          </nav>
        </div>
      </header>

      <section class="mt-6 md:mt-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900">Available Talent</h1>
            <p class="text-sm text-slate-500 mt-1">Browse pharmacy professionals looking for opportunities</p>
          </div>
          <NuxtLink to="/jobs/talent/post"
            class="inline-flex items-center self-start rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--accent-strong)]">
            Post Your Profile
          </NuxtLink>
        </div>

        <div class="bg-white rounded-xl p-2.5 shadow-sm border border-slate-200/80 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-[1fr_180px_120px] gap-2">
            <input v-model="search" type="text" placeholder="Search by profession or name"
              class="h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800"
              @keyup.enter="loadSeekers" />
            <input v-model="locationFilter" type="text" placeholder="Location"
              class="h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800"
              @keyup.enter="loadSeekers" />
            <button
              class="h-11 rounded-lg font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-strong)] transition-colors"
              @click="loadSeekers">
              Search
            </button>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>
        <div v-if="loading" class="text-sm text-slate-500 py-8 text-center">Loading talent...</div>

        <div v-else-if="filtered.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <article v-for="seeker in filtered" :key="seeker.id" class="job-card">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs text-slate-500 font-semibold tracking-[0.08em]">AVAILABLE TALENT</p>
                <h4 class="text-lg font-extrabold text-slate-900 mt-1">{{ seeker.profession }}</h4>
                <p class="text-sm text-slate-600 mt-0.5">{{ seeker.fullName }}</p>
              </div>
              <span class="status-pill status-talent">Looking for job</span>
            </div>
            <p class="mt-3 text-sm text-slate-600 line-clamp-3">{{ seeker.bio || 'No bio provided' }}</p>
            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <span class="meta-chip">{{ seeker.location || 'Location not set' }}</span>
              <span class="meta-chip">{{ seeker.yearsOfExperience || '0' }} yrs exp</span>
            </div>
            <div class="mt-5 flex items-center gap-2">
              <NuxtLink :to="`/jobs/talent/${seeker.id}`" class="action-btn action-primary inline-flex items-center">View Profile</NuxtLink>
              <a
                v-if="seeker.phone"
                :href="whatsappSeekerUrl(seeker)"
                target="_blank"
                rel="noopener noreferrer"
                class="action-btn action-whatsapp inline-flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </article>
        </div>

        <div v-else class="text-center text-sm text-gray-500 mt-8 py-10">
          <p>No talent profiles found.</p>
          <NuxtLink to="/jobs/talent/post" class="text-[var(--accent)] font-semibold hover:underline mt-2 inline-block">
            Be the first — post your profile
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { createJobsService } from '~/services/jobs/jobsService'
import { useApi } from '~/composables/useApi'
import phoneUtils from '~/utils/phone'

definePageMeta({ layout: false })

const api = useApi()
const jobsService = createJobsService(api)

const seekers = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const locationFilter = ref('')

const filtered = computed(() => {
  const loc = locationFilter.value.trim().toLowerCase()
  if (!loc) return seekers.value
  return seekers.value.filter((s) => String(s.location || '').toLowerCase().includes(loc))
})

const loadSeekers = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await jobsService.listSeekers({ search: search.value })
    seekers.value = response.data || []
  } catch (err) {
    error.value = 'Failed to load talent profiles.'
  } finally {
    loading.value = false
  }
}

const whatsappSeekerUrl = (seeker) => {
  const num = phoneUtils.formatWhatsApp(seeker.phone)
  const text = encodeURIComponent(`Hi ${seeker.fullName}, I saw your profile on Rigel Jobs and I'm interested in connecting.`)
  return `https://wa.me/${num}?text=${text}`
}

onMounted(loadSeekers)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Manrope:wght@400;500;700&display=swap');

.jobs-page {
  --accent: #ef3f78;
  --accent-strong: #db2f67;
  background: radial-gradient(circle at 12% 10%, #ffffff 0, #f5f7ff 34%, #eef2ff 100%);
  font-family: 'Manrope', sans-serif;
}

h1, h2, h3, h4, .status-pill {
  font-family: 'Space Grotesk', sans-serif;
}

.job-card {
  background: #ffffff;
  border: 1px solid #e4eaf8;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(46, 63, 108, 0.06);
}

.status-pill {
  text-transform: capitalize;
  font-size: 11px;
  border-radius: 999px;
  padding: 5px 10px;
  font-weight: 700;
}

.status-talent {
  background: #fdf3d8;
  color: #995c00;
}

.meta-chip {
  background: #f3f6ff;
  border: 1px solid #dfe5f6;
  color: #33466e;
  border-radius: 999px;
  padding: 4px 9px;
}

.action-btn {
  height: 38px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
}

.action-primary {
  color: white;
  background: var(--accent);
}

.action-primary:hover {
  background: var(--accent-strong);
}

.action-whatsapp {
  background: #25d366;
  color: white;
}

.action-whatsapp:hover {
  background: #1ebe57;
}
</style>
