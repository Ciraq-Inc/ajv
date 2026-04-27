<template>
  <div v-if="open" class="fixed inset-0 bg-black/40 z-50 flex justify-end" @click.self="$emit('close')">
    <aside class="w-full max-w-xl h-full bg-white p-5 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Applications</h3>
        <button class="text-sm px-3 py-2 bg-gray-100 rounded" @click="$emit('close')">Close</button>
      </div>

      <div v-if="loading" class="text-sm text-gray-500">Loading applications...</div>
      <div v-else-if="applications.length === 0" class="text-sm text-gray-500">No applications yet.</div>

      <div v-else class="space-y-3">
        <article v-for="item in applications" :key="item.id" class="border border-gray-200 rounded-lg p-3">
          <div class="flex justify-between gap-2">
            <div>
              <p class="font-medium text-gray-900">{{ item.fullName }}</p>
              <p class="text-xs text-gray-600">{{ item.email }} • {{ item.phone }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded bg-gray-100">{{ item.status }}</span>
          </div>
          <p v-if="item.coverLetter" class="text-sm text-gray-700 mt-2">{{ item.coverLetter }}</p>
          <div v-if="item.resumeUrl || item.cvUrl || item.certificatesUrl" class="mt-3 flex flex-wrap gap-2">
            <a v-if="item.resumeUrl" :href="item.resumeUrl" target="_blank" rel="noopener noreferrer" class="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">Resume</a>
            <a v-if="item.cvUrl" :href="item.cvUrl" target="_blank" rel="noopener noreferrer" class="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">CV</a>
            <a v-if="item.certificatesUrl" :href="item.certificatesUrl" target="_blank" rel="noopener noreferrer" class="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">Certificates</a>
          </div>
          <div class="mt-3 flex gap-2">
            <button class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800" @click="$emit('status', item, 'shortlisted')">Shortlist</button>
            <button class="px-2 py-1 text-xs rounded bg-red-100 text-red-700" @click="$emit('status', item, 'rejected')">Reject</button>
            <button class="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700" @click="$emit('status', item, 'hired')">Hire</button>
          </div>
        </article>
      </div>
    </aside>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  applications: { type: Array, default: () => [] },
})

defineEmits(['close', 'status'])
</script>
