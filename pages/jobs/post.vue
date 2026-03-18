<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Nav -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/jobs" class="font-bold text-slate-800 text-sm tracking-tight">Rigel Jobs</NuxtLink>
        <div v-if="isReadyToPost" class="flex items-center gap-3 text-sm">
          <span class="text-slate-600">{{ companyStore.currentCompany?.name || companyStore.currentCompany?.domain_name }}</span>
          <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs capitalize">{{ normalizedRole.replace(/_/g, ' ') }}</span>
          <button class="text-slate-500 hover:text-red-600 text-xs" @click="handleLogout">Sign out</button>
        </div>
      </div>
    </header>

    <div class="max-w-5xl mx-auto px-4 py-8 md:py-10 space-y-6">

      <!-- ─── Not logged in: portal entry ─── -->
      <div v-if="!isReadyToPost" class="max-w-lg mx-auto">
        <div class="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
          <h1 class="text-2xl font-extrabold text-slate-900">Recruiter Portal</h1>
          <p class="text-sm text-slate-600 mt-2">Sign in with your recruiter account or create one to post and manage job openings.</p>

          <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
          <p v-if="signupError" class="mt-3 text-sm text-red-600">{{ signupError }}</p>
          <p v-if="signupSuccess" class="mt-3 text-sm text-emerald-700">{{ signupSuccess }}</p>

          <div class="mt-6 space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Company domain</label>
              <input
                v-model="companyDomain"
                type="text"
                placeholder="e.g. lessonpharmacy"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <p class="text-xs text-slate-400 mt-1">Your company's short URL handle.</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                class="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
                :disabled="!companyDomain"
                @click="goToRecruiterLogin"
              >
                Sign in
              </button>
              <button
                class="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm disabled:opacity-50"
                :disabled="!companyDomain"
                @click="goToRecruiterBoard"
              >
                Open Dashboard
              </button>
            </div>

            <button
              class="w-full py-2.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 text-sm font-medium"
              @click="showSignup = !showSignup"
            >
              {{ showSignup ? 'Hide account creation' : 'Create recruiter account' }}
            </button>

            <div v-if="showSignup" class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div class="grid md:grid-cols-2 gap-3">
                <div class="md:col-span-2">
                  <label class="field-label">Recruiter or agency name <span class="text-red-500">*</span></label>
                  <input v-model="signupForm.companyName" type="text" class="field" placeholder="e.g. Apex Talent Partners" />
                </div>
                <div class="md:col-span-2">
                  <label class="field-label">Your full name <span class="text-red-500">*</span></label>
                  <input v-model="signupForm.recruiterName" type="text" class="field" placeholder="e.g. Ama Owusu" />
                </div>
                <div>
                  <label class="field-label">Phone <span class="text-red-500">*</span></label>
                  <input v-model="signupForm.phone" type="tel" class="field" placeholder="024..." />
                </div>
                <div>
                  <label class="field-label">Email</label>
                  <input v-model="signupForm.email" type="email" class="field" placeholder="you@agency.com" />
                </div>
                <div>
                  <label class="field-label">Preferred domain <span class="text-red-500">*</span></label>
                  <input v-model="signupForm.domain" type="text" class="field" placeholder="apextalent" />
                </div>
                <div>
                  <label class="field-label">Password <span class="text-red-500">*</span></label>
                  <input v-model="signupForm.password" type="password" class="field" placeholder="Minimum 6 characters" />
                </div>
              </div>

              <button
                class="w-full py-2.5 rounded-lg bg-pink-600 text-white text-sm font-medium disabled:opacity-50"
                :disabled="signupLoading"
                @click="handleRecruiterSignup"
              >
                {{ signupLoading ? 'Creating account...' : 'Create recruiter account' }}
              </button>
            </div>
          </div>

          <div class="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            You must be signed in as a third-party recruiter, company admin, or manager to post jobs.
          </div>
        </div>
      </div>

      <!-- ─── Logged in: recruiter dashboard ─── -->
      <template v-else>

        <!-- Stats row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p class="text-2xl font-bold text-slate-800">{{ myJobs.length }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Total postings</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p class="text-2xl font-bold text-emerald-600">{{ openCount }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Open</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p class="text-2xl font-bold text-slate-400">{{ closedCount }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Closed</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p class="text-2xl font-bold text-blue-600">{{ expiringSoonCount }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Expiring soon</p>
          </div>
        </div>

        <!-- Post new job toggle -->
        <div>
          <button
            class="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-pink-700 transition-colors"
            @click="showForm = !showForm"
          >
            {{ showForm ? '✕ Cancel' : '+ Post New Job' }}
          </button>

          <div v-if="showForm" class="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
            <h2 class="font-semibold text-slate-800 text-lg mb-4">New Job Posting</h2>

            <p v-if="successMessage" class="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">{{ successMessage }}</p>
            <p v-if="formError" class="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{{ formError }}</p>

            <form class="space-y-4" @submit.prevent="handleCreateJob">
              <div class="grid md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="field-label">Job title <span class="text-red-500">*</span></label>
                  <input v-model="form.title" type="text" class="field" placeholder="e.g. Community Pharmacist" required />
                </div>
                <div class="md:col-span-2">
                  <label class="field-label">Description <span class="text-red-500">*</span></label>
                  <textarea v-model="form.description" rows="5" class="field" placeholder="Describe the role, responsibilities, requirements…" required />
                </div>
                <div>
                  <label class="field-label">Location <span class="text-red-500">*</span></label>
                  <input v-model="form.location" type="text" class="field" placeholder="Accra, Greater Accra" required />
                </div>
                <div>
                  <label class="field-label">Employment type</label>
                  <select v-model="form.employmentType" class="field">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                    <option>Locum</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">Contact email</label>
                  <input v-model="form.contactEmail" type="email" class="field" placeholder="recruit@company.com" />
                </div>
                <div>
                  <label class="field-label">Application deadline <span class="text-slate-400 font-normal">(optional)</span></label>
                  <input v-model="form.expiresAt" type="date" class="field" :min="today" />
                </div>
                <div class="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Required applicant documents</p>
                  <div class="grid md:grid-cols-3 gap-3 text-sm text-slate-700">
                    <label class="flex items-center gap-2">
                      <input v-model="form.requireResume" type="checkbox" />
                      Resume required
                    </label>
                    <label class="flex items-center gap-2">
                      <input v-model="form.requireCv" type="checkbox" />
                      CV required
                    </label>
                    <label class="flex items-center gap-2">
                      <input v-model="form.requireCertificates" type="checkbox" />
                      Certificates required
                    </label>
                  </div>
                </div>
                <div>
                  <label class="field-label">Min salary (GHS) <span class="text-slate-400 font-normal">(optional)</span></label>
                  <input v-model.number="form.salaryMin" type="number" class="field" placeholder="e.g. 2000" min="0" />
                </div>
                <div>
                  <label class="field-label">Max salary (GHS) <span class="text-slate-400 font-normal">(optional)</span></label>
                  <input v-model.number="form.salaryMax" type="number" class="field" placeholder="e.g. 5000" min="0" />
                </div>
              </div>

              <div class="flex flex-wrap gap-2 pt-1">
                <button type="submit" class="px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50" :disabled="loading">
                  {{ loading ? 'Publishing…' : 'Publish Job' }}
                </button>
                <button type="button" class="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm" @click="showForm = false">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- My jobs list -->
        <div>
          <h2 class="text-lg font-semibold text-slate-800 mb-3">My Postings</h2>

          <div v-if="jobsLoading" class="text-sm text-slate-500 py-6 text-center">Loading…</div>
          <p v-else-if="!myJobs.length" class="text-sm text-slate-500 py-6 text-center bg-white rounded-xl border border-slate-200">
            No jobs posted yet. Click "Post New Job" to get started.
          </p>

          <div v-else class="space-y-3">
            <div
              v-for="job in myJobs"
              :key="job.id"
              class="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-slate-800 truncate">{{ job.title }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="job.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                  >{{ job.status }}</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">{{ job.location }} · {{ job.employmentType }}</p>
                <p v-if="job.expiresAt" class="text-xs mt-0.5" :class="isExpired(job.expiresAt) ? 'text-red-500' : 'text-slate-400'">
                  Deadline: {{ formatDate(job.expiresAt) }}{{ isExpired(job.expiresAt) ? ' (expired)' : '' }}
                </p>
                <p v-if="job.salaryMin || job.salaryMax" class="text-xs text-slate-400 mt-0.5">
                  GHS {{ job.salaryMin ?? '—' }} – {{ job.salaryMax ?? '—' }}
                </p>
                <p v-if="job.requireResume || job.requireCv || job.requireCertificates" class="text-xs text-slate-400 mt-0.5">
                  Requires:
                  {{ [job.requireResume ? 'Resume' : null, job.requireCv ? 'CV' : null, job.requireCertificates ? 'Certificates' : null].filter(Boolean).join(', ') }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2 shrink-0">
                <NuxtLink
                  :to="`/jobs/${job.id}`"
                  class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200"
                >
                  View
                </NuxtLink>
                <button
                  class="px-3 py-1.5 rounded-lg text-xs"
                  :class="job.status === 'open' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'"
                  :disabled="togglingId === job.id"
                  @click="toggleStatus(job)"
                >
                  {{ togglingId === job.id ? '…' : job.status === 'open' ? 'Close' : 'Reopen' }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '~/stores/company'

definePageMeta({ layout: false })

const router = useRouter()
const companyStore = useCompanyStore()
const { jobs: myJobs, loading: jobsLoading, fetchCompanyJobs, createJob, updateJob } = useJobs()

const error = ref('')
const formError = ref('')
const successMessage = ref('')
const loading = ref(false)
const companyDomain = ref('')
const showForm = ref(false)
const showSignup = ref(false)
const togglingId = ref(null)
const signupLoading = ref(false)
const signupError = ref('')
const signupSuccess = ref('')

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  title: '',
  description: '',
  location: '',
  employmentType: 'Full-time',
  salaryMin: null,
  salaryMax: null,
  contactEmail: '',
  expiresAt: '',
  requireResume: false,
  requireCv: false,
  requireCertificates: false,
})

const signupForm = reactive({
  recruiterName: '',
  companyName: '',
  phone: '',
  email: '',
  password: '',
  domain: '',
})

const normalizedRole = computed(() =>
  String(companyStore.userRole || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
)

const canPostJobs = computed(() =>
  ['company', 'admin', 'super_admin', 'manager', 'third_party_poster'].includes(normalizedRole.value)
)

const isReadyToPost = computed(() => companyStore.isLoggedIn && canPostJobs.value)

const openCount = computed(() => myJobs.value.filter((j) => j.status === 'open').length)
const closedCount = computed(() => myJobs.value.filter((j) => j.status === 'closed').length)
const expiringSoonCount = computed(() => {
  const cutoff = Date.now() + 7 * 24 * 60 * 60 * 1000
  return myJobs.value.filter((j) => j.status === 'open' && j.expiresAt && new Date(j.expiresAt).getTime() < cutoff).length
})

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const isExpired = (iso) => iso && new Date(iso).getTime() < Date.now()

const hydrateCompanyAuthFromAnyDomain = () => {
  if (typeof window === 'undefined' || companyStore.isLoggedIn) return

  const keys = Object.keys(localStorage)
  const tokenKey = keys.find((k) => /^company_.+_token$/.test(k))
  if (!tokenKey) return

  const base = tokenKey.replace(/_token$/, '')
  const savedToken = localStorage.getItem(`${base}_token`)
  const savedUser = localStorage.getItem(`${base}_user`)
  const savedCompany = localStorage.getItem(`${base}_company`)

  if (!savedToken || !savedUser) return

  try {
    companyStore.companyAuthToken = savedToken
    companyStore.user = JSON.parse(savedUser)
    companyStore.company = savedCompany ? JSON.parse(savedCompany) : null
    companyStore.authInitialized = true

    const domain = base.replace(/^company_/, '')
    if (domain && !companyDomain.value) companyDomain.value = domain
  } catch {
    // silent
  }
}

const getSafeDomain = () => String(companyDomain.value || '').trim().toLowerCase()

const goToRecruiterLogin = () => {
  const domain = getSafeDomain()
  if (!domain) return
  const redirect = encodeURIComponent(`/${domain}/services/rigel-boards`)
  router.push(`/${domain}/services/login?redirect=${redirect}`)
}

const goToRecruiterBoard = () => {
  const domain = getSafeDomain()
  if (!domain) return
  router.push(`/${domain}/services/rigel-boards`)
}

const handleLogout = () => {
  companyStore.companyAuthToken = null
  companyStore.user = null
  companyStore.company = null
  // Clear localStorage tokens for current domain
  const domain = getSafeDomain() || companyStore.currentCompany?.domain_name || ''
  if (domain) {
    localStorage.removeItem(`company_${domain}_token`)
    localStorage.removeItem(`company_${domain}_user`)
    localStorage.removeItem(`company_${domain}_company`)
  }
  router.push('/jobs/post')
}

const handleCreateJob = async () => {
  formError.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    await createJob({
      title: form.title,
      description: form.description,
      location: form.location,
      employmentType: form.employmentType,
      salaryMin: form.salaryMin || null,
      salaryMax: form.salaryMax || null,
      contactEmail: form.contactEmail || null,
      expiresAt: form.expiresAt || null,
      requireResume: form.requireResume,
      requireCv: form.requireCv,
      requireCertificates: form.requireCertificates,
      companyDomain: getSafeDomain() || companyStore.currentCompany?.domain_name || companyStore.currentCompany?.domainName || '',
      companyName: companyStore.currentCompany?.name || 'Company',
    })

    successMessage.value = 'Job published successfully!'
    Object.assign(form, { title: '', description: '', location: '', employmentType: 'Full-time', salaryMin: null, salaryMax: null, contactEmail: '', expiresAt: '', requireResume: false, requireCv: false, requireCertificates: false })
    showForm.value = false
  } catch (err) {
    formError.value = err?.data?.message || err?.message || 'Failed to publish job'
  } finally {
    loading.value = false
  }
}

const handleRecruiterSignup = async () => {
  signupError.value = ''
  signupSuccess.value = ''
  signupLoading.value = true

  try {
    const result = await companyStore.recruiterSignup(signupForm)
    companyDomain.value = result.company?.domain || result.company?.domain_name || signupForm.domain
    signupSuccess.value = 'Recruiter account created successfully. You can post immediately.'
    showSignup.value = false
    Object.assign(signupForm, { recruiterName: '', companyName: '', phone: '', email: '', password: '', domain: '' })
    await fetchCompanyJobs()
    showForm.value = true
  } catch (err) {
    signupError.value = err.message || 'Failed to create recruiter account'
  } finally {
    signupLoading.value = false
  }
}

const toggleStatus = async (job) => {
  togglingId.value = job.id
  try {
    await updateJob(job.id, { status: job.status === 'open' ? 'closed' : 'open' })
  } catch {
    // ignore — job list will stay as-is
  } finally {
    togglingId.value = null
  }
}

onMounted(async () => {
  await companyStore.checkAuthState()
  hydrateCompanyAuthFromAnyDomain()

  if (companyStore.currentCompany?.domain_name && !companyDomain.value) {
    companyDomain.value = companyStore.currentCompany.domain_name
  }

  if (isReadyToPost.value) {
    await fetchCompanyJobs()
  }
})
</script>

<style scoped>
.field {
  width: 100%;
  border: 1px solid rgb(203 213 225);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.field-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(71 85 105);
}

.field:focus {
  outline: none;
  border-color: rgb(236 72 153);
  box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.2);
}
</style>
