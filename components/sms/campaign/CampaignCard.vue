<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">
          {{ campaign.name }}
        </h3>
        <p class="text-sm text-gray-600 flex items-center gap-2">
          <CalendarIcon class="h-4 w-4" />
          {{ formatDate(campaign.created_at, 'short') }}
        </p>
      </div>
      <StatusBadge :status="campaign.status" show-dot />
    </div>

    <!-- Message Preview -->
    <div class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p class="text-sm text-gray-700 line-clamp-2">
        {{ campaign.message }}
      </p>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
      <div>
        <p class="text-xs text-gray-500 mb-1">Recipients</p>
        <p class="text-lg font-semibold text-gray-900">
          {{ formatNumber(campaign.total_recipients || 0) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">Sent</p>
        <p class="text-lg font-semibold text-green-600">
          {{ formatNumber(campaign.messages_sent || 0) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-gray-500 mb-1">Cost</p>
        <p class="text-lg font-semibold text-blue-600">
           {{ formatCurrency(campaign.actual_cost || campaign.sms_cost || 0) }}
        </p>
      </div>
    </div>

    <!-- Progress Bar (for sending campaigns) -->
    <div v-if="campaign.status === 'sending' || campaign.status === 'paused'" class="mb-4">
      <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>Progress</span>
        <span>{{ progressPercentage }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        @click="$emit('view', campaign.id)"
        class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
      >
        View Details
      </button>
      
      <!-- Edit Button (for draft/paused campaigns) -->
      <!-- <button
        @click="$emit('update', campaign.id)"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
        title="Edit campaign"
      >
        <PencilIcon class="h-4 w-4" />
        <span class="hidden sm:inline">Edit</span>
      </button> -->
      
      <button
        v-if="campaign.status === 'draft'"
        @click="$emit('start', campaign.id)"
        class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
      >
        <PlayIcon class="h-4 w-4 inline mr-1" />
        Start
      </button>

      <button
        v-else-if="campaign.status === 'sending'"
        @click="$emit('pause', campaign.id)"
        class="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
      >
        <PauseIcon class="h-4 w-4 inline mr-1" />
        Pause
      </button>

      <button
        v-else-if="campaign.status === 'paused'"
        @click="$emit('resume', campaign.id)"
        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <PlayIcon class="h-4 w-4 inline mr-1" />
        Resume
      </button>

      <!-- More Actions Menu -->
      <div class="relative">
        <button
          @click="showMenu = !showMenu"
          class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="More actions"
        >
          <EllipsisVerticalIcon class="h-4 w-4" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showMenu"
          class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
          @mouseleave="showMenu = false"
        >
          <button
            v-if="canEdit"
            @click="() => { $emit('update', campaign.id); showMenu = false }"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 text-sm"
          >
            <PencilIcon class="h-4 w-4" />
            <span>Edit Campaign</span>
          </button>

          <button
            v-if="canReuse"
            @click="() => { $emit('reuse', campaign.id); showMenu = false }"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 text-sm"
          >
            <DocumentDuplicateIcon class="h-4 w-4" />
            <span>Reuse Campaign</span>
          </button>

          <button
            v-if="canResend"
            @click="() => { $emit('resend', campaign.id); showMenu = false }"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 text-sm"
          >
            <PaperAirplaneIcon class="h-4 w-4" />
            <span>Resend Campaign</span>
          </button>

          <button
            v-if="canCancel"
            @click="() => { $emit('cancel', campaign.id); showMenu = false }"
            class="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 border-b border-gray-100 text-red-600 text-sm"
          >
            <XCircleIcon class="h-4 w-4" />
            <span>Cancel Campaign</span>
          </button>

          <button
            v-if="canArchive"
            @click="() => { $emit('archive', campaign.id); showMenu = false }"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 text-gray-700 text-sm"
          >
            <ArchiveBoxIcon class="h-4 w-4" />
            <span>Archive Campaign</span>
          </button>

          <button
            v-if="canRestore"
            @click="() => { $emit('restore', campaign.id); showMenu = false }"
            class="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center gap-2 border-b border-gray-100 text-green-600 text-sm"
          >
            <ArrowUturnLeftIcon class="h-4 w-4" />
            <span>Restore Campaign</span>
          </button>

          <button
            v-if="canDelete"
            @click="() => { $emit('delete', campaign.id); showMenu = false }"
            class="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 text-sm"
          >
            <TrashIcon class="h-4 w-4" />
            <span>Delete Campaign</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Failed Count Warning -->
    <div 
      v-if="campaign.messages_failed > 0" 
      class="mt-3 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg"
    >
      <ExclamationTriangleIcon class="h-4 w-4 flex-shrink-0" />
      <span>{{ campaign.messages_failed }} message(s) failed</span>
    </div>

    <!-- Completion Notification -->
    <div 
      v-if="showCompletionNotification" 
      class="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 animate-pulse"
    >
      <CheckCircleIcon class="h-4 w-4 flex-shrink-0" />
      <span>Campaign completed successfully!</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { CalendarIcon, PlayIcon, PauseIcon, PencilIcon, DocumentDuplicateIcon, PaperAirplaneIcon, TrashIcon, XCircleIcon, ArchiveBoxIcon, ArrowUturnLeftIcon, EllipsisVerticalIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import StatusBadge from '~/components/sms/shared/StatusBadge.vue'
import { formatDate, formatNumber } from '~/utils/constants/sms'

const props = defineProps({
  campaign: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view', 'start', 'pause', 'resume', 'cancel', 'archive', 'restore', 'delete', 'reuse', 'resend', 'update', 'completed', 'status-changed'])

const showMenu = ref(false)
const previousStatus = ref(props.campaign.status)
const showCompletionNotification = ref(false)

// Watch for status changes
watch(() => props.campaign.status, (newStatus, oldStatus) => {
  if (oldStatus && newStatus !== oldStatus) {
    previousStatus.value = oldStatus
    
    // Emit status change event
    emit('status-changed', {
      campaignId: props.campaign.id,
      oldStatus,
      newStatus
    })
    
    // Show completion notification
    if (newStatus === 'completed' && oldStatus === 'sending') {
      showCompletionNotification.value = true
      emit('completed', props.campaign)
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        showCompletionNotification.value = false
      }, 5000)
    }
  }
})

const progressPercentage = computed(() => {
  const total = props.campaign.total_recipients || 0
  const sent = props.campaign.messages_sent || 0
  
  if (total === 0) return 0
  return Math.round((sent / total) * 100)
})

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0
  return num.toFixed(2)
}

const canReuse = computed(() => {
  return ['draft', 'completed', 'cancelled', 'paused'].includes(props.campaign.status)
})

const canResend = computed(() => {
  // Allow resend for completed/paused campaigns, or any campaign with failed messages
  return ['completed', 'paused', 'failed'].includes(props.campaign.status) || 
         (props.campaign.messages_failed > 0)
})

const canEdit = computed(() => {
  return ['draft', 'paused'].includes(props.campaign.status)
})

const canCancel = computed(() => {
  return ['draft', 'sending', 'paused'].includes(props.campaign.status)
})

const canArchive = computed(() => {
  // Can archive completed or cancelled campaigns (preserves data)
  return ['completed', 'cancelled'].includes(props.campaign.status)
})

const canRestore = computed(() => {
  // Can restore archived campaigns
  return props.campaign.status === 'archived'
})

const canDelete = computed(() => {
  // Can only delete draft campaigns (never sent, safe to remove)
  // Archived campaigns can also be permanently deleted if needed
  return ['draft', 'archived'].includes(props.campaign.status)
})
</script>
