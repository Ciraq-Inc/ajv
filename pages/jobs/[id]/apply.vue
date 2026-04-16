<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Simple standalone nav -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
        <NuxtLink to="/jobs" class="font-bold text-slate-800 text-sm tracking-tight">Rigel Jobs</NuxtLink>
        <span class="text-slate-300">|</span>
        <NuxtLink :to="`/jobs/${route.params.id}`" class="text-sm text-blue-600 hover:underline">Back to job</NuxtLink>
      </div>
    </header>

    <div class="max-w-3xl mx-auto px-4 py-8 md:py-10">
      <h1 class="text-2xl md:text-3xl font-bold text-slate-900">Apply for this role</h1>
      <p class="text-sm text-slate-500 mt-1">SMS OTP verification is required for guest applications.</p>
      <div v-if="selectedJob" class="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p class="font-medium text-slate-900">{{ selectedJob.title }}</p>
        <p v-if="selectedJob.requireResume || selectedJob.requireCv || selectedJob.requireCertificates" class="mt-2 text-xs text-slate-500">
          Required documents:
          {{ [selectedJob.requireResume ? 'Resume' : null, selectedJob.requireCv ? 'CV' : null, selectedJob.requireCertificates ? 'Certificates' : null].filter(Boolean).join(', ') }}
        </p>
        <p v-if="selectedJob.expiresAt" class="mt-1 text-xs text-slate-500">Deadline: {{ formatDate(selectedJob.expiresAt) }}</p>
      </div>

      <div v-if="submitted" class="mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
        <div class="text-3xl mb-2">✓</div>
        <h2 class="font-semibold text-emerald-800 text-lg">Application submitted!</h2>
        <p class="text-sm text-emerald-700 mt-1">We've received your application. Good luck!</p>
        <NuxtLink :to="`/jobs/${route.params.id}`" class="mt-4 inline-block text-sm text-blue-600 hover:underline">Back to job</NuxtLink>
      </div>

      <template v-else>
        <p v-if="formError" class="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{{ formError }}</p>

        <form class="mt-6 space-y-4 bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm" @submit.prevent="onSubmit">
          <!-- Personal info -->
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Full name <span class="text-red-500">*</span></label>
              <input v-model="form.fullName" type="text" class="input" placeholder="Jane Asante" required />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Email <span class="text-red-500">*</span></label>
              <input v-model="form.email" type="email" class="input" placeholder="jane@email.com" required />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-slate-600 mb-1">Phone <span class="text-red-500">*</span></label>
              <input v-model="form.phone" type="tel" class="input" placeholder="+233 …" required />
            </div>
          </div>

          <!-- Cover letter -->
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Cover letter <span class="text-slate-400">(optional)</span></label>
            <textarea v-model="form.coverLetter" rows="4" class="input" placeholder="Tell us why you're a great fit…" />
          </div>

          <!-- Document uploads -->
          <div class="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
            <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Documents <span class="text-slate-400 font-normal normal-case">(PDF, DOC, DOCX — max 5 MB each)</span></p>

            <div class="grid md:grid-cols-3 gap-3">
              <!-- Resume -->
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Resume <span v-if="selectedJob?.requireResume" class="text-red-500">*</span></label>
                <div class="file-drop" :class="{ 'uploading': uploads.resume.uploading, 'done': uploads.resume.url }">
                  <span v-if="uploads.resume.uploading" class="text-xs text-slate-500">Uploading…</span>
                  <span v-else-if="uploads.resume.url" class="text-xs text-emerald-700">✓ Uploaded</span>
                  <template v-else>
                    <span class="text-xs text-slate-500">Click to attach</span>
                  </template>
                  <input type="file" accept=".pdf,.doc,.docx" class="file-input" @change="(e) => handleFileUpload(e, 'resume')" />
                </div>
                <p v-if="uploads.resume.error" class="text-xs text-red-600 mt-1">{{ uploads.resume.error }}</p>
              </div>

              <!-- CV -->
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Curriculum Vitae (CV) <span v-if="selectedJob?.requireCv" class="text-red-500">*</span></label>
                <div class="file-drop" :class="{ 'uploading': uploads.cv.uploading, 'done': uploads.cv.url }">
                  <span v-if="uploads.cv.uploading" class="text-xs text-slate-500">Uploading…</span>
                  <span v-else-if="uploads.cv.url" class="text-xs text-emerald-700">✓ Uploaded</span>
                  <template v-else>
                    <span class="text-xs text-slate-500">Click to attach</span>
                  </template>
                  <input type="file" accept=".pdf,.doc,.docx" class="file-input" @change="(e) => handleFileUpload(e, 'cv')" />
                </div>
                <p v-if="uploads.cv.error" class="text-xs text-red-600 mt-1">{{ uploads.cv.error }}</p>
              </div>

              <!-- Certificates -->
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Certificates <span v-if="selectedJob?.requireCertificates" class="text-red-500">*</span></label>
                <div class="file-drop" :class="{ 'uploading': uploads.certificates.uploading, 'done': uploads.certificates.url }">
                  <span v-if="uploads.certificates.uploading" class="text-xs text-slate-500">Uploading…</span>
                  <span v-else-if="uploads.certificates.url" class="text-xs text-emerald-700">✓ Uploaded</span>
                  <template v-else>
                    <span class="text-xs text-slate-500">Click to attach</span>
                  </template>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="file-input" @change="(e) => handleFileUpload(e, 'certificates')" />
                </div>
                <p v-if="uploads.certificates.error" class="text-xs text-red-600 mt-1">{{ uploads.certificates.error }}</p>
              </div>
            </div>
          </div>

          <!-- Guest verification -->
          <div class="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input v-model="isGuest" type="checkbox" class="rounded" />
              Applying as a guest (OTP verification required)
            </label>

            <GuestOtpStep
              v-if="isGuest"
              v-model:phone="form.phone"
              :loading="loading"
              :verified="otpVerified"
              :error="otpError"
              :debug-code="debugCode"
              @request-otp="handleRequestOtp"
              @verify-otp="handleVerifyOtp"
            />
          </div>

          <button
            type="submit"
            class="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            :disabled="loading || anyUploading || (isGuest && !otpVerified)"
          >
            <span v-if="loading">Submitting…</span>
            <span v-else-if="anyUploading">Uploading files…</span>
            <span v-else>Submit Application</span>
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import GuestOtpStep from '~/components/jobs/GuestOtpStep.vue'

definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const { selectedJob, fetchJobById } = useJobs()
const { loading, error: appError, requestGuestOtp, verifyGuestOtp, submitApplication } = useJobApplications()

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  coverLetter: '',
})

const uploads = reactive({
  resume:       { uploading: false, url: null, error: '' },
  cv:           { uploading: false, url: null, error: '' },
  certificates: { uploading: false, url: null, error: '' },
})

const anyUploading = computed(() => Object.values(uploads).some((u) => u.uploading))

const isGuest = ref(true)
const otpVerified = ref(false)
const guestOtpToken = ref('')
const otpError = ref('')
const debugCode = ref('')
const formError = ref('')
const submitted = ref(false)

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const handleFileUpload = async (event, field) => {
  const file = event.target.files?.[0]
  if (!file) return

  uploads[field].error = ''
  uploads[field].url = null
  uploads[field].uploading = true

  try {
    const fd = new FormData()
    fd.append('file', file)

    const res = await $fetch(`${config.public.apiBase}/api/jobs/upload-document`, { method: 'POST', body: fd })
    uploads[field].url = res.url
  } catch (err) {
    uploads[field].error = err?.data?.statusMessage || err?.message || 'Upload failed'
  } finally {
    uploads[field].uploading = false
    // reset so same file can be re-picked if re-upload needed
    event.target.value = ''
  }
}

const handleRequestOtp = async (phone) => {
  otpError.value = ''
  otpVerified.value = false
  try {
    const response = await requestGuestOtp(phone)
    debugCode.value = response.debugCode || ''
  } catch (err) {
    otpError.value = err.message || 'Failed to request OTP'
  }
}

const handleVerifyOtp = async ({ phone, code }) => {
  otpError.value = ''
  try {
    const response = await verifyGuestOtp(phone, code)
    guestOtpToken.value = response.guestOtpToken
    otpVerified.value = true
  } catch (err) {
    otpError.value = err.message || 'OTP verification failed'
    otpVerified.value = false
  }
}

const onSubmit = async () => {
  formError.value = ''
  try {
    if (selectedJob.value?.requireResume && !uploads.resume.url) {
      throw new Error('Resume upload is required for this job')
    }
    if (selectedJob.value?.requireCv && !uploads.cv.url) {
      throw new Error('CV upload is required for this job')
    }
    if (selectedJob.value?.requireCertificates && !uploads.certificates.url) {
      throw new Error('Certificates upload is required for this job')
    }

    await submitApplication(route.params.id, {
      ...form,
      resumeUrl: uploads.resume.url || null,
      cvUrl: uploads.cv.url || null,
      certificatesUrl: uploads.certificates.url || null,
      isGuest: isGuest.value,
      guestOtpToken: guestOtpToken.value,
    })
    submitted.value = true
  } catch (err) {
    formError.value = err?.data?.message || err?.message || 'Failed to submit application. Please try again.'
  }
}

onMounted(async () => {
  await fetchJobById(route.params.id)
})
</script>

<style scoped>
.input {
  @apply w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.file-drop {
  @apply relative flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-16 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors;
}

.file-drop.uploading {
  @apply border-amber-400 bg-amber-50;
}

.file-drop.done {
  @apply border-emerald-400 bg-emerald-50;
}

.file-input {
  @apply absolute inset-0 w-full h-full opacity-0 cursor-pointer;
}
</style>
