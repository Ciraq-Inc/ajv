<template>
  <div class="message-composer">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Campaign Message *
      </label>
      
      <!-- Textarea -->
      <textarea
        ref="textareaRef"
        v-model="localMessage"
        @input="handleInput"
        @click="updateCursorPosition"
        @keyup="updateCursorPosition"
        rows="6"
        placeholder="Type your message here... Use variables like [name], [fname], [lname], or [phone]"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg cs-input resize-none"
        :class="{ 'border-red-500': hasInvalidVariables }"
      ></textarea>

      <!-- Variable buttons -->
      <div v-if="showVariablePicker" class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
          <span class="text-sm font-medium text-gray-700">Insert variable:</span>
          <span class="text-xs text-gray-500">Click a token to add it at your cursor</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="variable in availableVariables"
            :key="variable.key"
            type="button"
            :title="variable.description"
            @mousedown.prevent
            @click="insertVariable(variable.key)"
            class="rounded-md border border-purple-200 bg-white px-3 py-1.5 font-mono text-sm cs-text transition-colors hover:border-purple-400 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            {{ variable.key }}
          </button>
        </div>
      </div>

      <!-- Error message for invalid variables -->
      <div v-if="hasInvalidVariables" class="mt-2 text-sm text-red-600 flex items-start gap-2">
        <Icon name="AlertCircle" class="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-medium">Invalid variables detected:</p>
          <p>{{ invalidVariables.join(', ') }}</p>
        </div>
      </div>

      <!-- Message info bar -->
      <div class="mt-2 flex items-center justify-between text-sm">
        <div class="flex items-center gap-4">
          <span class="text-gray-600">
            {{ messageInfo.length }} characters
          </span>
          <span class="text-gray-600">
            {{ messageInfo.parts }} {{ messageInfo.parts === 1 ? 'SMS' : 'messages' }}
          </span>
          <span class="text-gray-500">
            ({{ messageInfo.remaining }} remaining)
          </span>
        </div>
        
      </div>
    </div>

    <!-- Preview Section -->
    <div v-if="showPreview" class="mt-6">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-gray-900">Preview</h4>
        <button
          @click="useCustomPreviewData = !useCustomPreviewData"
          class="text-xs cs-text"
        >
          {{ useCustomPreviewData ? 'Use sample data' : 'Customize preview' }}
        </button>
      </div>

      <!-- Custom preview data inputs -->
      <div v-if="useCustomPreviewData" class="mb-3 p-3 bg-gray-50 rounded-lg">
        <div class="grid grid-cols-2 gap-2">
          <input
            v-model="previewData.name"
            placeholder="Name"
            class="px-2 py-1 text-sm border border-gray-300 rounded"
          />
          <input
            v-model="previewData.phone"
            placeholder="Phone"
            class="px-2 py-1 text-sm border border-gray-300 rounded"
          />
          <input
            v-model="previewData.customer_code"
            placeholder="Customer Code"
            class="px-2 py-1 text-sm border border-gray-300 rounded"
          />
          <input
            v-model="previewData.email"
            placeholder="Email"
            class="px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>

      <!-- Preview message -->
      <div class="cs-gradient text-white p-4 rounded-lg">
        <div class="flex items-start gap-3">
          <Icon name="MessageSquare" class="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium mb-1">SMS Preview</p>
            <p class="text-white/90 whitespace-pre-wrap">{{ previewMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div v-if="showTips" class="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <Icon name="Lightbulb" class="h-5 w-5 cs-text flex-shrink-0" />
        <div>
          <h4 class="text-sm font-semibold cs-text mb-2">Message Tips</h4>
          <ul class="text-sm cs-text space-y-1">
            <li>• Keep messages concise and clear</li>
            <li>• Use variables to personalize each message</li>
            <li>• Each SMS can contain up to 160 characters</li>
            <li>• Messages over 160 chars are split into multiple SMS</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { DYNAMIC_VARIABLES, validateMessageTemplate, replaceVariables, getSmsLengthInfo } from '~/utils/constants/sms'

interface MessageValidationResult {
  isValid: boolean
  invalidVariables: string[]
}

interface MessageInfo {
  length: number
  parts: number
  remaining: number
}

const props = defineProps<{
  modelValue?: string
  showVariablePicker?: boolean
  showPreview?: boolean
  showTips?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  validation: [result: { isValid: boolean; messageInfo: MessageInfo; invalidVariables: string[] }]
}>()

const localMessage = ref(props.modelValue ?? '')
const useCustomPreviewData = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const cursorPosition = ref(0)

const previewData = ref({
  name: 'John Doe',
  customer_name: 'John Doe',
  fname: 'John',
  lname: 'Doe',
  customer_code: 'CUST001',
  phone: '+233241234567',
  email: 'john@example.com',
  city: 'Accra',
  customer_type: 'retail',
})

const availableVariables = DYNAMIC_VARIABLES

const validation = computed<MessageValidationResult>(() => validateMessageTemplate(localMessage.value))
const hasInvalidVariables = computed<boolean>(() => !validation.value.isValid)
const invalidVariables = computed<string[]>(() => validation.value.invalidVariables)
const messageInfo = computed<MessageInfo>(() => getSmsLengthInfo(localMessage.value))

const previewMessage = computed<string>(() => {
  if (!localMessage.value) return 'Your message will appear here...'
  return replaceVariables(localMessage.value, previewData.value)
})

const handleInput = (): void => {
  emit('update:modelValue', localMessage.value)
  emit('validation', {
    isValid: validation.value.isValid,
    messageInfo: messageInfo.value,
    invalidVariables: invalidVariables.value,
  })
}

const updateCursorPosition = (): void => {
  if (textareaRef.value) {
    cursorPosition.value = textareaRef.value.selectionStart ?? 0
  }
}

const insertVariable = (variableKey: string): void => {
  if (!textareaRef.value) return

  const start = cursorPosition.value
  const text = localMessage.value
  localMessage.value = text.substring(0, start) + variableKey + text.substring(start)

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
      const newPos = start + variableKey.length
      textareaRef.value.setSelectionRange(newPos, newPos)
      cursorPosition.value = newPos
    }
  })

  handleInput()
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localMessage.value) localMessage.value = newValue ?? ''
  },
)
</script>
