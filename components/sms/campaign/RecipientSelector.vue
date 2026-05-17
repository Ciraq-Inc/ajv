<template>
  <div class="recipient-selector space-y-4">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Select Recipients *
      </label>

      <!-- Recipient Type Tabs -->
      <div class="border-b border-gray-200 mb-4">
        <nav class="flex -mb-px">
          <button
            @click="selectType('all')"
            :class="[
              'px-4 py-2 border-b-2 font-medium text-sm',
              selectedType === 'all'
                ? 'cs-selected'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <UserGroupIcon class="h-4 w-4 inline mr-1" />
            All Customers
          </button>
          <button
            @click="selectType('filtered')"
            :class="[
              'px-4 py-2 border-b-2 font-medium text-sm',
              selectedType === 'filtered'
                ? 'cs-selected'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <FunnelIcon class="h-4 w-4 inline mr-1" />
            Filtered
          </button>
          <button
            @click="selectType('custom')"
            :class="[
              'px-4 py-2 border-b-2 font-medium text-sm',
              selectedType === 'custom'
                ? 'cs-selected'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <ArrowUpTrayIcon class="h-4 w-4 inline mr-1" />
            Custom List
          </button>
        </nav>
      </div>

      <!-- All Customers -->
      <div v-if="selectedType === 'all'" class="space-y-4">
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <InformationCircleIcon class="h-5 w-5 cs-text flex-shrink-0" />
            <div>
              <p class="text-sm font-medium cs-text mb-1">Send to All Customers</p>
              <p class="text-sm cs-text">
                Your message will be sent to all customers in your database.
              </p>
            </div>
          </div>
        </div>

        <!-- Estimated count -->
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Estimated Recipients</p>
              <p class="text-2xl font-bold text-gray-900">{{ estimatedCount }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600">Estimated Cost</p>
              <p class="text-2xl font-bold cs-text">{{ (estimatedCount ?? 0) * (messageParts ?? 1) }} credits</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtered Recipients -->
      <div v-else-if="selectedType === 'filtered'" class="space-y-4">
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <InformationCircleIcon class="h-5 w-5 cs-text flex-shrink-0" />
            <div>
              <p class="text-sm font-medium cs-text mb-1">Select Specific Customers</p>
              <p class="text-sm cs-text">
                Choose individual customers to receive this campaign message.
              </p>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex-1 relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                v-model="customerSearchQuery"
                type="text"
                placeholder="Search customers by name or phone..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg cs-input text-sm"
              />
            </div>
            <button
              @click="toggleSelectAll"
              class="px-4 py-2 text-sm font-medium cs-text cs-border rounded-lg"
            >
              {{ localSelectedCustomers.length === filteredCustomers.length ? 'Deselect All' : 'Select All' }}
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingCustomers" class="flex items-center justify-center py-8">
            <div class="flex flex-col items-center gap-2">
              <ArrowPathIcon class="h-6 w-6 cs-text animate-spin" />
              <p class="text-sm text-gray-600">Loading customers...</p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="customersError" class="bg-red-50 border border-red-200 rounded p-3">
            <p class="text-sm text-red-800">{{ customersError }}</p>
            <button
              @click="fetchCustomers"
              class="text-xs text-red-600 hover:text-red-700 font-medium mt-2"
            >
              Try Again
            </button>
          </div>

          <!-- Customer Selection List -->
          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-if="filteredCustomers.length === 0"
              class="text-center py-4 text-gray-500"
            >
              <p class="text-sm">No customers found</p>
            </div>
            <div
              v-for="customer in filteredCustomers"
              :key="customer.id"
              @click="toggleCustomer(customer)"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                :checked="isCustomerSelected(customer)"
                @click.stop="toggleCustomer(customer)"
                class="h-4 w-4 cs-text border-gray-300 rounded cs-input"
              />
              <div class="flex items-center gap-2 flex-1">
                <UserIcon class="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">
                    {{ customer.name || customer.fname + ' ' + customer.lname }}
                  </p>
                  <p class="text-xs text-gray-500">{{ customer.phone || customer.mobile }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected count -->
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Selected Recipients</p>
              <p class="text-2xl font-bold text-gray-900">{{ localSelectedCustomers.length }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600">Estimated Cost</p>
              <p class="text-2xl font-bold cs-text">{{ localSelectedCustomers.length * (messageParts ?? 1) }} credits</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom List -->
      <div v-else-if="selectedType === 'custom'" class="space-y-4">
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <ArrowUpTrayIcon class="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h4 class="text-sm font-semibold text-gray-900 mb-2">Upload Customer List</h4>
          <p class="text-sm text-gray-600 mb-2">
            Upload a CSV file with customer information
          </p>
          <div class="text-xs text-gray-600 mb-4 space-y-1">
            <p class="font-medium">✓ Supported formats:</p>
            <p>• <span class="font-mono">firstname, lastname, contact</span> (tab or comma separated)</p>
            <!-- <p>• <span class="font-mono">name, phone</span> (tab or comma separated)</p>
            <p>• <span class="font-mono">phone</span> only (one per line)</p> -->
            <p class="text-gray-500 mt-2">First row with headers will be auto-detected and skipped</p>
          </div>

          <!-- File Input -->
          <input
            ref="fileInput"
            type="file"
            accept=".csv,.txt"
            @change="handleFileUpload"
            class="hidden"
          />
          <button
            @click="$refs.fileInput.click()"
            class="px-4 py-2 cs-btn text-white rounded-lg transition-colors text-sm font-medium"
          >
            Choose File
          </button>

          <p class="text-xs text-gray-500 mt-3">
            Or enter manually below
          </p>
        </div>

        <!-- Manual Input -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Manual Entry (one per line)</label>
          <textarea
            v-model="localCustomIds"
            @input="updateCustomIds"
            rows="5"
            placeholder="Prince Boateng, 0557706385&#10;Agadzi Desmond, 0592014589&#10;or just:&#10;0557706385&#10;0592014589"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg cs-input text-sm font-mono"
          ></textarea>
        </div>

        <!-- Uploaded Recipients Preview -->
        <div v-if="uploadedRecipients.length > 0" class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h5 class="text-sm font-semibold text-gray-900">Uploaded Recipients</h5>
            <button
              @click="clearUploadedRecipients"
              class="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          </div>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="(recipient, index) in uploadedRecipients"
              :key="index"
              class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100"
            >
              <div class="flex items-center gap-2">
                <UserIcon class="h-4 w-4 text-gray-400" />
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ recipient.name }}</p>
                  <p class="text-xs text-gray-500">{{ recipient.phone }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom count -->
        <div v-if="customCount > 0" class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Custom Recipients</p>
              <p class="text-2xl font-bold text-gray-900">{{ customCount }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600">Estimated Cost</p>
              <p class="text-2xl font-bold cs-text">{{ customCount * (messageParts ?? 1) }} credits</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-700">Total Recipients</p>
          <p class="text-3xl font-bold text-gray-900">{{ totalRecipients }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-gray-700">Total Cost</p>
          <p class="text-3xl font-bold cs-text">{{ totalCost }}</p>
          <p class="text-xs text-gray-500">SMS credits</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  UserGroupIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
import { useApi } from '~/composables/useApi'
import { useCompanyStore } from '~/stores/company'

// TODO: remove once composables/ and stores/ are .ts

interface Customer {
  id: number | string
  name?: string
  fname?: string
  lname?: string
  phone?: string
  mobile?: string
  [key: string]: unknown
}

interface Recipient {
  name: string
  phone: string
  firstname?: string
  lastname?: string
  contact?: string
}

const props = defineProps<{
  selectedType?: string
  selectedCustomers?: Customer[]
  customIds?: string
  estimatedCount?: number
  messageParts?: number
}>()

const emit = defineEmits<{
  'update:selectedType': [value: string]
  'update:selectedCustomers': [value: Customer[]]
  'update:customIds': [value: string]
  'update:estimatedCount': [value: number]
  update: []
}>()

const api = useApi()
const companyStore = useCompanyStore()

const localSelectedCustomers = ref<Customer[]>([...(props.selectedCustomers ?? [])])
const localCustomIds = ref(props.customIds ?? '')
const customerSearchQuery = ref('')
const allCustomers = ref<Customer[]>([])
const isLoadingCustomers = ref(false)
const customersError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadedRecipients = ref<Recipient[]>([])

const customCount = computed<number>(() => {
  if (uploadedRecipients.value.length > 0) return uploadedRecipients.value.length
  if (!localCustomIds.value) return 0
  return localCustomIds.value.split('\n').filter((line) => line.trim().length > 0).length
})

const filteredCustomers = computed<Customer[]>(() => {
  if (!customerSearchQuery.value) return allCustomers.value
  const query = customerSearchQuery.value.toLowerCase()
  return allCustomers.value.filter((customer) => {
    const name = (customer.name ?? `${customer.fname ?? ''} ${customer.lname ?? ''}`).toLowerCase()
    const phone = (customer.phone ?? customer.mobile ?? '').toLowerCase()
    return name.includes(query) || phone.includes(query)
  })
})

const totalRecipients = computed<number>(() => {
  if (props.selectedType === 'all') return props.estimatedCount ?? 0
  if (props.selectedType === 'filtered') return localSelectedCustomers.value.length
  if (props.selectedType === 'custom') return customCount.value
  return 0
})

const totalCost = computed<number>(() => totalRecipients.value * (props.messageParts ?? 1))

watch(
  () => props.selectedCustomers,
  (newVal) => { localSelectedCustomers.value = [...(newVal ?? [])] },
)

watch(
  () => props.customIds,
  (newVal) => { localCustomIds.value = newVal ?? '' },
)

onMounted(() => { fetchCustomers() })

const fetchCustomers = async (): Promise<void> => {
  try {
    isLoadingCustomers.value = true
    customersError.value = null

    // companyStore is untyped (store not yet .ts)
    const store = companyStore as { currentCompany?: { id?: number }; selectedCompany?: { id?: number } }
    const companyId = store.currentCompany?.id ?? store.selectedCompany?.id

    if (!companyId) {
      console.warn('No company ID available')
      allCustomers.value = []
      emit('update:estimatedCount', 0)
      return
    }

    // api.get is untyped (composable not yet .ts)
    const response = await api.get(`/api/companies/${companyId}/customers`) as {
      success: boolean
      data?: Customer[]
      count?: number
    }

    if (response.success && response.data) {
      allCustomers.value = response.data
      emit('update:estimatedCount', response.data.length ?? response.count ?? 0)
    } else {
      allCustomers.value = []
      emit('update:estimatedCount', 0)
    }
  } catch (error: unknown) {
    console.error('Error fetching customers:', error)
    customersError.value = error instanceof Error ? error.message : 'Failed to load customers'
    allCustomers.value = []
    emit('update:estimatedCount', 0)
  } finally {
    isLoadingCustomers.value = false
  }
}

const selectType = (type: string): void => {
  emit('update:selectedType', type)
  if (type === 'filtered') {
    localSelectedCustomers.value = []
    emit('update:selectedCustomers', [])
  }
  emit('update')
}

const toggleCustomer = (customer: Customer): void => {
  const index = localSelectedCustomers.value.findIndex((c) => c.id === customer.id)
  if (index > -1) {
    localSelectedCustomers.value.splice(index, 1)
  } else {
    localSelectedCustomers.value.push(customer)
  }
  emit('update:selectedCustomers', localSelectedCustomers.value)
  emit('update')
}

const isCustomerSelected = (customer: Customer): boolean =>
  localSelectedCustomers.value.some((c) => c.id === customer.id)

const toggleSelectAll = (): void => {
  if (localSelectedCustomers.value.length === filteredCustomers.value.length) {
    localSelectedCustomers.value = []
  } else {
    localSelectedCustomers.value = [...filteredCustomers.value]
  }
  emit('update:selectedCustomers', localSelectedCustomers.value)
  emit('update')
}

const parseLine = (line: string): Recipient | null => {
  let parts = line.includes('\t') ? line.split('\t') : line.split(',')
  parts = parts.map((p) => p.trim()).filter((p) => p.length > 0)

  if (parts.length >= 3) {
    return { name: `${parts[0] ?? ''} ${parts[1] ?? ''}`.trim(), firstname: parts[0] ?? '', lastname: parts[1] ?? '', phone: parts[2] ?? '', contact: parts[2] ?? '' }
  } else if (parts.length === 2) {
    return { name: parts[0] ?? '', firstname: parts[0] ?? '', lastname: '', phone: parts[1] ?? '', contact: parts[1] ?? '' }
  } else if (parts.length === 1 && parts[0]) {
    return { name: parts[0], firstname: '', lastname: '', phone: parts[0], contact: parts[0] }
  }
  return null
}

const updateCustomIds = (): void => {
  if (localCustomIds.value) {
    const lines = localCustomIds.value.split('\n').filter((line) => line.trim().length > 0)
    uploadedRecipients.value = lines
      .map((line) => parseLine(line))
      .filter((r): r is Recipient => r !== null && r.phone.length > 0)
  } else {
    uploadedRecipients.value = []
  }
  emit('update:customIds', localCustomIds.value)
  emit('update')
}

const clearUploadedRecipients = (): void => {
  uploadedRecipients.value = []
  localCustomIds.value = ''
  emit('update:customIds', '')
  emit('update')
}

const handleFileUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const lines = content.trim().split('\n')

      let dataLines = lines
      if (file.name.endsWith('.csv')) {
        const firstLine = lines[0]?.toLowerCase() ?? ''
        const hasHeader =
          firstLine.includes('name') ||
          firstLine.includes('phone') ||
          firstLine.includes('contact') ||
          firstLine.includes('firstname') ||
          firstLine.includes('lastname')
        dataLines = hasHeader ? lines.slice(1) : lines
      }

      const extracted: Recipient[] = dataLines
        .filter((line) => line.trim().length > 0)
        .map((line) => parseLine(line))
        .filter((r): r is Recipient => r !== null)

      if (extracted.length === 0) {
        alert(`No valid recipients found in ${file.name}`)
        return
      }

      const uniqueRecipients = extracted.reduce<Recipient[]>((acc, curr) => {
        if (!acc.find((r) => r.phone === curr.phone)) acc.push(curr)
        return acc
      }, [])

      uploadedRecipients.value = uniqueRecipients
      localCustomIds.value = uniqueRecipients.map((r) => `${r.name}, ${r.phone}`).join('\n')
      emit('update:customIds', localCustomIds.value)
      emit('update')

      alert(`Successfully imported ${uniqueRecipients.length} recipient${uniqueRecipients.length !== 1 ? 's' : ''} from ${file.name}`)
    } catch (error: unknown) {
      alert(`Error parsing file: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      target.value = ''
    }
  }

  reader.onerror = () => {
    alert('Error reading file')
    target.value = ''
  }
  reader.readAsText(file)
}
</script>
