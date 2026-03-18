<template>
  <div class="jobs-page min-h-screen">
    <div class="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <header class="bg-white/95 border border-white/70 rounded-2xl px-4 md:px-6 py-4 shadow-[0_14px_40px_rgba(35,53,84,0.08)]">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img src="~/assets/images/rigellogo.png" alt="Rigel" class="h-10 w-auto" />
            <div>
              <p class="text-sm font-semibold tracking-[0.08em] text-slate-800">RIGEL JOB FINDER</p>
              <p class="text-xs text-slate-500">Get your next pharmacy role</p>
            </div>
          </div>
          <nav class="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <NuxtLink to="/jobs" class="font-semibold text-slate-900">Home</NuxtLink>
            <a href="#openings" class="hover:text-slate-900">Find Jobs</a>
            <a href="#categories" class="hover:text-slate-900">Categories</a>
            <NuxtLink to="/jobs/post" class="px-3 py-2 rounded-lg text-white bg-[var(--accent)] hover:bg-[var(--accent-strong)] font-semibold">
              Post a Job
            </NuxtLink>
          </nav>
        </div>
      </header>

      <section class="hero mt-5 md:mt-7 rounded-3xl p-5 md:p-10 overflow-hidden">
        <div class="grid md:grid-cols-2 items-center gap-6 md:gap-10 relative z-10">
          <div class="hero-copy animate-rise">
            <p class="text-xs md:text-sm tracking-[0.14em] text-slate-500 font-semibold">PHARMACY CAREERS</p>
            <h1 class="mt-3 text-4xl md:text-6xl font-black leading-[1.05] text-slate-900">
              Find the most exciting pharmacy jobs
            </h1>
            <p class="mt-4 text-sm md:text-base text-slate-600 max-w-xl">
              Discover verified openings from pharmacies, hospitals, and healthcare recruiters across Ghana.
            </p>

            <div class="mt-4">
              <NuxtLink to="/jobs/post" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Recruiter? Post a Job
              </NuxtLink>
            </div>

            <div class="mt-6 bg-white rounded-xl p-2 md:p-2.5 shadow-[0_12px_30px_rgba(35,53,84,0.08)] border border-slate-200/80">
              <div class="grid grid-cols-1 md:grid-cols-[1fr_180px_150px] gap-2">
                <input
                  v-model="search"
                  type="text"
                  placeholder="Job title or keyword"
                  class="h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800"
                  @keyup.enter="loadJobs"
                />
                <input
                  v-model="location"
                  type="text"
                  placeholder="Location"
                  class="h-11 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800"
                  @keyup.enter="loadJobs"
                />
                <button class="h-11 rounded-lg font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-strong)] transition-colors" @click="loadJobs">
                  Find Jobs
                </button>
              </div>
            </div>
          </div>

          <div class="hero-art animate-rise-delay">
            <div class="hero-image-wrap">
              <img src="/female-pharmacist.jpg" alt="Female pharmacist" class="hero-image" />
            </div>
          </div>
        </div>
      </section>

      <section id="categories" class="mt-10 md:mt-14">
        <p class="text-xs md:text-sm tracking-[0.14em] text-[var(--accent)] font-semibold text-center">EXPLORE CATEGORIES</p>
        <h2 class="mt-2 text-3xl md:text-4xl font-extrabold text-slate-900 text-center">Browse Top Categories</h2>

        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <article v-for="item in categories" :key="item" class="category-card">
            <p class="text-sm md:text-base font-semibold text-slate-900">{{ item }}</p>
          </article>
        </div>
      </section>

      <section id="openings" class="mt-10 md:mt-14">
        <div class="flex items-center justify-between gap-4 mb-4">
          <h3 class="text-2xl md:text-3xl font-extrabold text-slate-900">Open Positions</h3>
          <p class="text-sm text-slate-500">{{ openJobs.length }} opportunities</p>
        </div>

        <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>

        <div v-if="loading" class="text-sm text-slate-500 py-8">Loading jobs...</div>

        <div v-else-if="openJobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <article v-for="job in filteredJobs" :key="job.id" class="job-card">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs text-slate-500 font-semibold tracking-[0.08em]">{{ job.companyName }}</p>
                <h4 class="text-lg font-extrabold text-slate-900 mt-1">{{ job.title }}</h4>
              </div>
              <span class="status-pill">{{ job.status }}</span>
            </div>
            <p class="mt-3 text-sm text-slate-600 line-clamp-3">{{ job.description }}</p>
            <div class="mt-4 flex flex-wrap gap-2 text-xs">
              <span class="meta-chip">{{ job.location || 'Location not set' }}</span>
              <span class="meta-chip">{{ job.employmentType || 'Role' }}</span>
            </div>
            <div class="mt-5 flex items-center gap-2">
              <button class="action-btn action-primary" @click="openApply(job)">Apply Now</button>
              <button class="action-btn action-light" @click="openDetails(job)">View Details</button>
            </div>
          </article>
        </div>

        <div v-else class="text-center text-sm text-gray-500 mt-8">No open jobs found.</div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const search = ref('')
const location = ref('')

const { openJobs, loading, error, fetchJobs } = useJobs()

const categories = [
  'Retail Pharmacy',
  'Hospital Pharmacy',
  'Clinical Services',
  'Operations & Sales',
]

const filteredJobs = computed(() => {
  const locationTerm = location.value.trim().toLowerCase()
  if (!locationTerm) return openJobs.value
  return openJobs.value.filter((job) => String(job.location || '').toLowerCase().includes(locationTerm))
})

const loadJobs = async () => {
  await fetchJobs({ search: search.value, status: 'open' })
}

const openDetails = (job) => {
  router.push(`/jobs/${job.id}`)
}

const openApply = (job) => {
  router.push(`/jobs/${job.id}/apply`)
}

onMounted(loadJobs)

definePageMeta({
  layout: false,
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Manrope:wght@400;500;700&display=swap');

.jobs-page {
  --accent: #ef3f78;
  --accent-strong: #db2f67;
  --hero-bg: #e7eaf7;
  background:
    radial-gradient(circle at 12% 10%, #ffffff 0, #f5f7ff 34%, #eef2ff 100%);
  font-family: 'Manrope', sans-serif;
}

h1,
h2,
h3,
h4,
.hero-copy p:first-child,
.status-pill {
  font-family: 'Space Grotesk', sans-serif;
}

.hero {
  position: relative;
  background: var(--hero-bg);
  border: 1px solid #d4dbf2;
}

.hero::before,
.hero::after {
  content: '';
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 999px;
  background: linear-gradient(140deg, rgba(239, 63, 120, 0.16), rgba(70, 106, 255, 0.08));
}

.hero::before {
  top: -90px;
  left: -60px;
}

.hero::after {
  bottom: -110px;
  right: 22%;
}

.hero-image-wrap {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  border: 8px solid #f8f9ff;
  box-shadow: 0 16px 40px rgba(38, 53, 96, 0.22);
}

.hero-image {
  width: 100%;
  height: 420px;
  object-fit: cover;
  object-position: center;
}

.hero-image-wrap::after {
  content: '';
  position: absolute;
  top: 8%;
  right: -38px;
  width: 100px;
  height: 260px;
  transform: rotate(24deg);
  background: repeating-linear-gradient(
    to bottom,
    rgba(35, 88, 255, 0.9) 0,
    rgba(35, 88, 255, 0.9) 7px,
    transparent 7px,
    transparent 15px
  );
}

.category-card {
  background: #ffffff;
  border: 1px solid #e6ebf5;
  border-radius: 14px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.category-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 22px rgba(50, 65, 115, 0.12);
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
  background: #e8f7ef;
  color: #157347;
  font-weight: 700;
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

.action-light {
  background: #eff3fb;
  color: #364a72;
}

.animate-rise {
  animation: riseIn 520ms ease both;
}

.animate-rise-delay {
  animation: riseIn 720ms ease both;
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hero-image {
    height: 300px;
  }

  .hero-image-wrap::after {
    width: 70px;
    height: 180px;
    right: -24px;
  }
}
</style>
