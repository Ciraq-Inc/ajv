<template>
  <article class="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
    <div class="flex justify-between items-start gap-3">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ job.title }}</h3>
        <p class="text-sm text-gray-600">{{ job.companyName }} • {{ job.location }}</p>
      </div>
      <span
        class="text-xs px-2 py-1 rounded-full font-medium"
        :class="job.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'"
      >
        {{ job.status }}
      </span>
    </div>

    <p class="text-sm text-gray-700 mt-3 line-clamp-3">{{ job.description }}</p>

    <div class="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
      <span class="px-2 py-1 rounded bg-gray-100">{{ job.employmentType }}</span>
      <span v-if="job.salaryMin || job.salaryMax" class="px-2 py-1 rounded bg-blue-50 text-blue-700">
        GHS {{ job.salaryMin || 0 }} - {{ job.salaryMax || 'Negotiable' }}
      </span>
    </div>

    <div class="mt-4 flex gap-2">
      <button
        class="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
        @click="$emit('view', job)"
      >
        View
      </button>
      <button
        v-if="showApply"
        class="px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700"
        @click="$emit('apply', job)"
      >
        Apply
      </button>
      <button
        v-if="showManage"
        class="px-3 py-2 rounded-lg text-sm bg-amber-100 text-amber-800 hover:bg-amber-200"
        @click="$emit('manage', job)"
      >
        Manage
      </button>
      <button
        v-if="showStatusAction"
        class="px-3 py-2 rounded-lg text-sm bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
        @click="$emit('status-action', job)"
      >
        {{ statusActionLabel }}
      </button>
    </div>
  </article>
</template>

<script setup>
defineProps({
  job: {
    type: Object,
    required: true,
  },
  showApply: {
    type: Boolean,
    default: false,
  },
  showManage: {
    type: Boolean,
    default: false,
  },
  showStatusAction: {
    type: Boolean,
    default: false,
  },
  statusActionLabel: {
    type: String,
    default: 'Update Status',
  },
})

defineEmits(['apply', 'view', 'manage', 'status-action'])
</script>
