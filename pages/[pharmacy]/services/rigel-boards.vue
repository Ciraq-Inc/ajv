<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Rigel Boards</h1>
        <p class="text-sm text-gray-600 mt-1">Post jobs and manage applicants.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          to="/jobs"
          class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          View Jobs Page
        </NuxtLink>
        <button
          class="px-4 py-2 rounded-lg text-white"
          :class="canPostJobs ? 'cs-btn' : 'bg-gray-400 cursor-not-allowed'"
          :disabled="!canPostJobs"
          @click="openCreateModal"
        >
          Post Job
        </button>
      </div>
    </div>

    <p v-if="!canPostJobs" class="text-sm text-amber-700">
      Your account role ({{ normalizedRole || 'unknown' }}) cannot post jobs. Use a company/manager/third-party-poster/admin account.
    </p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white border border-gray-200 rounded-lg p-3">
        <p class="text-xs text-gray-500">Total Jobs</p>
        <p class="text-2xl font-bold text-gray-900">{{ jobs.length }}</p>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-3">
        <p class="text-xs text-gray-500">Open</p>
        <p class="text-2xl font-bold text-emerald-700">{{ openJobs.length }}</p>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-3">
        <p class="text-xs text-gray-500">Closed</p>
        <p class="text-2xl font-bold text-gray-700">{{ closedJobs }}</p>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-3">
        <p class="text-xs text-gray-500">Role</p>
        <p class="text-sm font-semibold text-gray-900">{{ companyStore.userRole || 'user' }}</p>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl p-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input
          v-model="search"
          type="text"
          placeholder="Search jobs"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <select v-model="status" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <button class="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm" @click="loadJobs">Apply</button>
      </div>
    </div>

    <p v-if="jobsError || localError" class="text-sm text-red-600">{{ localError || jobsError }}</p>
    <p v-if="jobsNotice" class="text-sm cs-text">{{ jobsNotice }}</p>

    <div v-if="jobsLoading" class="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
      Loading jobs...
    </div>

    <div v-else-if="jobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <JobCard
        v-for="job in jobs"
        :key="job.id"
        :job="(job as unknown as JobCardJobShape)"
        :show-manage="canManageJob(job)"
        :show-status-action="canManageJob(job)"
        :status-action-label="job.status === 'open' ? 'Close Job' : 'Reopen Job'"
        @manage="(j: unknown) => openApplications(j as JobRecord)"
        @status-action="(j: unknown) => toggleJobStatus(j as JobRecord)"
      />
    </div>

    <div v-else class="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
      No jobs to display yet. Use "Post Job" to create one, or adjust your search filters.
    </div>

    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="showCreateModal = false">
      <div class="w-full max-w-xl bg-white rounded-xl p-5">
        <h2 class="text-lg font-semibold text-gray-900">Post New Job</h2>
        <p class="text-sm text-gray-600 mt-1">Open this role to companies, pharmacies, and regular applicants.</p>

        <div class="grid md:grid-cols-2 gap-3 mt-4">
          <input v-model="form.title" type="text" placeholder="Job title" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model="form.location" type="text" placeholder="Location" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model="form.employmentType" type="text" placeholder="Employment type" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model="form.contactEmail" type="email" placeholder="Contact email" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model="form.expiresAt" type="date" :min="today" placeholder="Application deadline" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model.number="form.salaryMin" type="number" placeholder="Salary min" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model.number="form.salaryMax" type="number" placeholder="Salary max" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <textarea v-model="form.description" rows="4" placeholder="Describe role requirements" class="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />

        <div class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Required applicant documents</p>
          <div class="grid md:grid-cols-3 gap-2 text-sm text-gray-700">
            <label class="flex items-center gap-2"><input v-model="form.requireResume" type="checkbox" /> Resume required</label>
            <label class="flex items-center gap-2"><input v-model="form.requireCv" type="checkbox" /> CV required</label>
            <label class="flex items-center gap-2"><input v-model="form.requireCertificates" type="checkbox" /> Certificates required</label>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button class="px-3 py-2 rounded-lg bg-gray-100" @click="showCreateModal = false">Cancel</button>
          <button class="px-3 py-2 rounded-lg cs-btn text-white" @click="handleCreateJob">Publish Job</button>
        </div>
      </div>
    </div>

    <ApplicationDrawer
      :open="showApplications"
      :loading="applicationsLoading"
      :applications="applications"
      @close="showApplications = false"
      @status="updateStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCompanyStore } from '~/stores/company'
import JobCard from '~/components/jobs/JobCard.vue'
import ApplicationDrawer from '~/components/jobs/ApplicationDrawer.vue'

/** Minimal shape that satisfies JobCard's `job` prop (mirrors JobCardJob in JobCard.vue). */
type JobCardJobShape = {
  id: number
  title: string
  companyName?: string
  location?: string
  description?: string
  status?: string
  employmentType?: string
  salaryMin?: number
  salaryMax?: number | string
}

definePageMeta({
  middleware: ['company-auth'],
  layout: 'company',
})

interface JobRecord {
  id: string | number
  status?: string | null
  companyDomain?: string | null
  [key: string]: unknown
}

interface ApplicationRecord {
  id: string | number
  [key: string]: unknown
}

const {
  jobs,
  loading: jobsLoading,
  error: jobsError,
  openJobs,
  fetchCompanyJobs,
  fetchJobs,
  createJob,
  updateJob,
} = useJobs()

const {
  applications,
  loading: applicationsLoading,
  fetchApplications,
  updateApplicationStatus,
} = useJobApplications()

const companyStore = useCompanyStore()

const route = useRoute()

const showCreateModal = ref<boolean>(false)
const showApplications = ref<boolean>(false)
const activeJobId = ref<string | number>('')
const search = ref<string>('')
const status = ref<string>('')
const localError = ref<string>('')
const jobsNotice = ref<string>('')
const isFallbackPublicJobs = ref<boolean>(false)
const today = new Date().toISOString().split('T')[0]!

const form = reactive({
  title: '',
  description: '',
  location: '',
  employmentType: 'Full-time',
  salaryMin: null as number | null,
  salaryMax: null as number | null,
  contactEmail: '',
  expiresAt: '',
  requireResume: false,
  requireCv: false,
  requireCertificates: false,
})

const normalizedRole = computed<string>(() =>
  String(companyStore.userRole ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
)

const canPostJobs = computed<boolean>(() => {
  const role = normalizedRole.value
  return ['company', 'admin', 'super_admin', 'manager', 'third_party_poster'].includes(role)
})

const closedJobs = computed<number>(() => jobs.value.filter((item) => item.status === 'closed').length)

const loadJobs = async (): Promise<void> => {
  localError.value = ''
  jobsNotice.value = ''
  isFallbackPublicJobs.value = false

  const companyJobs = await fetchCompanyJobs({
    search: search.value,
    status: status.value,
  })

  // When a company has not posted yet, show public open jobs so the page is not empty.
  if ((!companyJobs || companyJobs.length === 0) && !status.value) {
    const publicJobs = await fetchJobs({
      search: search.value,
      status: 'open',
    })

    if (publicJobs.length > 0) {
      isFallbackPublicJobs.value = true
      jobsNotice.value = 'Showing public open jobs because your company has no posted jobs yet.'
    }
  }
}

const normalizeDomain = (value: string | null | undefined = ''): string =>
  String(value ?? '').trim().toLowerCase()

const canManageJob = (job: JobRecord | null | undefined): boolean => {
  if (!canPostJobs.value || !job) return false
  if (!isFallbackPublicJobs.value) return true
  return normalizeDomain(job.companyDomain as string | undefined) === normalizeDomain(String(route.params['pharmacy'] ?? ''))
}

const openCreateModal = (): void => {
  localError.value = ''
  if (!canPostJobs.value) {
    localError.value = 'You do not have permission to post jobs with this account.'
    return
  }
  showCreateModal.value = true
}

const handleCreateJob = async (): Promise<void> => {
  localError.value = ''
  if (!canPostJobs.value) {
    localError.value = 'You do not have permission to post jobs with this account.'
    return
  }

  await createJob({
    ...form,
    companyDomain: String(route.params['pharmacy'] ?? ''),
    companyName: companyStore.currentCompany?.name ?? 'Company',
  })

  showCreateModal.value = false
  form.title = ''
  form.description = ''
  form.location = ''
  form.employmentType = 'Full-time'
  form.contactEmail = ''
  form.expiresAt = ''
  form.salaryMin = null
  form.salaryMax = null
  form.requireResume = false
  form.requireCv = false
  form.requireCertificates = false
}

const openApplications = async (job: JobRecord): Promise<void> => {
  if (!canManageJob(job)) return
  activeJobId.value = job.id
  showApplications.value = true
  await fetchApplications(job.id)
}

const toggleJobStatus = async (job: JobRecord): Promise<void> => {
  if (!canManageJob(job)) return
  localError.value = ''
  const nextStatus = job.status === 'open' ? 'closed' : 'open'
  try {
    await updateJob(job.id, { status: nextStatus })
  } catch (err) {
    localError.value = err instanceof Error ? err.message : 'Failed to update job status'
  }
}

const updateStatus = async (application: ApplicationRecord, nextStatus: string): Promise<void> => {
  if (!activeJobId.value) return
  await updateApplicationStatus(activeJobId.value, application.id, nextStatus)
}

onMounted(() => { void loadJobs() })
</script>
