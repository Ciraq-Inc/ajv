<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/jobs" class="font-bold text-slate-800 text-sm tracking-tight">Rigel Jobs</NuxtLink>
      </div>
    </header>

    <div class="max-w-3xl mx-auto px-4 py-8 md:py-10">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-8">
        <h1 class="text-2xl font-extrabold text-slate-900 mb-2">Post Your Profile</h1>
        <p class="text-sm text-slate-600 mb-6">Let recruiters find you. Fill out your details below to become visible in our talent directory.</p>

        <p v-if="successMessage" class="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
          {{ successMessage }}
        </p>
        <p v-if="formError" class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          {{ formError }}
        </p>

        <form v-if="!successMessage" class="space-y-4" @submit.prevent="handleSubmit">
          <div class="grid md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="field-label">Full Name <span class="text-red-500">*</span></label>
              <input v-model="form.fullName" type="text" class="field" placeholder="Ama Owusu" required />
            </div>
            
            <div class="md:col-span-2">
              <label class="field-label">Profession <span class="text-red-500">*</span></label>
              <input v-model="form.profession" type="text" class="field" placeholder="e.g. Community Pharmacist" required />
            </div>
            
            <div>
              <label class="field-label">Location</label>
              <input v-model="form.location" type="text" class="field" placeholder="e.g. Accra" />
            </div>
            
            <div>
              <label class="field-label">Years of Experience</label>
              <input v-model.number="form.yearsOfExperience" type="number" class="field" placeholder="e.g. 3" min="0" />
            </div>

            <div class="md:col-span-2">
              <label class="field-label">Bio / Summary</label>
              <textarea v-model="form.bio" rows="4" class="field" placeholder="Tell us a bit about your experience..."></textarea>
            </div>
            
            <div>
              <label class="field-label">Email <span class="text-red-500">*</span></label>
              <input v-model="form.email" type="email" class="field" placeholder="ama@example.com" required />
            </div>
            
            <div>
              <label class="field-label">Phone Number <span class="text-red-500">*</span></label>
              <input v-model="form.phone" type="tel" class="field" placeholder="e.g. 0240000000" required />
            </div>
            
            <div class="md:col-span-2">
              <label class="field-label">Resume URL (Optional)</label>
              <input v-model="form.resumeUrl" type="url" class="field" placeholder="https://linkedin.com/in/ama" />
            </div>
          </div>

          <div class="pt-4 flex gap-3">
            <button
              type="submit"
              class="px-6 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
              :disabled="loading"
            >
              {{ loading ? 'Publishing...' : 'Publish Profile' }}
            </button>
            <NuxtLink to="/jobs" class="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50">
              Cancel
            </NuxtLink>
          </div>
        </form>
        
        <div v-else class="pt-4">
           <NuxtLink to="/jobs" class="inline-block px-6 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium">
             Back to Jobs
           </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { createJobsService } from '~/services/jobs/jobsService'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: false })

const api = useApi()
const jobsService = createJobsService(api)

const loading = ref(false)
const formError = ref('')
const successMessage = ref('')

const form = reactive({
  fullName: '',
  profession: '',
  location: '',
  yearsOfExperience: null,
  bio: '',
  email: '',
  phone: '',
  resumeUrl: '',
})

const handleSubmit = async () => {
  formError.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    await jobsService.createSeeker({
      ...form,
      isGuest: false // Bypass OTP for now
    })
    
    successMessage.value = 'Your profile is now live in the Talent Directory!'
  } catch (err) {
    formError.value = err?.data?.message || err?.message || 'Failed to publish profile.'
  } finally {
    loading.value = false
  }
}
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
