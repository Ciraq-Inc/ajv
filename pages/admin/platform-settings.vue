<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div class="max-w-screen-xl mx-auto px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 leading-tight">Platform Settings</h1>
          <p class="text-sm text-gray-500 mt-0.5">Live configuration — changes affect the production platform within minutes</p>
        </div>
        <div class="flex items-center gap-2 shrink-0 pt-0.5">
          <!-- Refresh: demoted to icon-only -->
          <button
            @click="fetchSettings"
            :disabled="loading"
            aria-label="Refresh settings"
            class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg class="w-4 h-4" :class="{ 'animate-spin': loading && Object.keys(editedSettings).length > 0 }" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>

          <!-- Save button with change count badge -->
          <button
            @click="saveAll"
            :disabled="loading || !hasChanges"
            class="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[36px]"
          >
            <!-- Saving spinner -->
            <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span>{{ loading ? 'Saving…' : 'Save Changes' }}</span>
            <!-- Change count pill -->
            <span
              v-if="!loading && changeCount > 0"
              class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white text-blue-700 text-xs font-bold leading-none"
              aria-label="{{ changeCount }} pending changes"
            >{{ changeCount }}</span>
          </button>

          <!-- Inline save success indicator -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-90"
            leave-active-class="transition-all duration-300 ease-in"
            leave-to-class="opacity-0 scale-90"
          >
            <span v-if="saveSuccess" class="flex items-center gap-1 text-green-600 text-sm font-medium" aria-live="polite">
              <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Saved
            </span>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Unsaved changes banner -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition-all duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="hasChanges && !loading"
        class="bg-amber-50 border-b border-amber-200"
        role="alert"
        aria-live="polite"
      >
        <div class="max-w-screen-xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-amber-800 text-sm">
            <svg class="w-4 h-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span><strong class="font-semibold">{{ changeCount }} unsaved {{ changeCount === 1 ? 'change' : 'changes' }}</strong> — these won't take effect until you save</span>
          </div>
          <button
            @click="saveAll"
            class="shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Save now
          </button>
        </div>
      </div>
    </Transition>

    <!-- Main layout: sidebar nav + content -->
    <div class="max-w-screen-xl mx-auto px-6 py-8">
      <div class="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">

        <!-- Sidebar nav (desktop only) -->
        <aside class="hidden lg:block">
          <nav class="sticky top-[120px] space-y-1" aria-label="Settings sections">
            <a
              v-for="section in sections"
              :key="section.id"
              :href="`#section-${section.id}`"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group"
            >
              <span class="section-chip text-xs font-bold tracking-wide px-2 py-0.5 rounded-md"
                :class="sectionChipClass(section.short)">
                {{ section.short }}
              </span>
              <span class="truncate">{{ section.title }}</span>
              <!-- Pending change dot for this section -->
              <span
                v-if="sectionChangeCount(section) > 0"
                class="ml-auto w-2 h-2 rounded-full bg-amber-500 shrink-0"
                :title="`${sectionChangeCount(section)} pending change(s)`"
                aria-hidden="true"
              ></span>
            </a>
          </nav>
        </aside>

        <!-- Settings content area -->
        <main class="space-y-6" role="main">

          <!-- Skeleton loading state -->
          <template v-if="loading && Object.keys(editedSettings).length === 0">
            <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div class="px-6 py-5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                <div class="w-12 h-6 bg-gray-200 rounded-md"></div>
                <div class="space-y-1.5">
                  <div class="w-36 h-4 bg-gray-200 rounded"></div>
                  <div class="w-64 h-3 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div v-for="j in 3" :key="j" class="space-y-2">
                  <div class="w-32 h-3 bg-gray-100 rounded"></div>
                  <div class="w-full h-10 bg-gray-100 rounded-lg"></div>
                  <div class="w-48 h-2.5 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          </template>

          <!-- Loaded: sections -->
          <template v-else>
            <section
              v-for="section in sections"
              :key="section.id"
              :id="`section-${section.id}`"
              class="bg-white rounded-xl border border-gray-200 overflow-hidden scroll-mt-32"
            >
              <!-- Section header -->
              <div class="px-6 py-5 bg-gray-50 border-b border-gray-100 flex items-start gap-3">
                <span
                  class="mt-0.5 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-widest uppercase"
                  :class="sectionChipClass(section.short)"
                >{{ section.short }}</span>
                <div class="min-w-0">
                  <h2 class="text-base font-semibold text-gray-900 leading-tight">{{ section.title }}</h2>
                  <p class="mt-0.5 text-sm text-gray-500 leading-snug">{{ section.description }}</p>
                </div>
                <!-- Section change count badge -->
                <span
                  v-if="sectionChangeCount(section) > 0"
                  class="ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold"
                  aria-live="polite"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                  {{ sectionChangeCount(section) }} changed
                </span>
              </div>

              <!-- SMS section: grouped sub-providers -->
              <template v-if="section.id === 'sms'">
                <div class="p-6 space-y-6">
                  <!-- Active provider stays first -->
                  <div>
                    <SettingField
                      v-for="setting in smsProviderSetting"
                      :key="setting.key"
                      :setting="setting"
                      :edited-settings="editedSettings"
                      :original-settings="originalSettings"
                      :reveal-map="revealMap"
                      @revert="revertField"
                      @toggle-reveal="toggleReveal"
                      @update="(key, val) => { editedSettings[key] = val }"
                    />
                  </div>

                  <!-- Nalo sub-group -->
                  <div class="rounded-lg border border-gray-100 overflow-hidden">
                    <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Nalo Solutions</span>
                      <span
                        v-if="editedSettings['sms_active_provider'] === 'nalo'"
                        class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium"
                      >Active</span>
                      <span v-else class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-400 text-xs">Fallback</span>
                    </div>
                    <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <SettingField
                        v-for="setting in smsNaloSettings"
                        :key="setting.key"
                        :setting="setting"
                        :edited-settings="editedSettings"
                        :original-settings="originalSettings"
                        :reveal-map="revealMap"
                        @revert="revertField"
                        @toggle-reveal="toggleReveal"
                        @update="(key, val) => { editedSettings[key] = val }"
                      />
                    </div>
                  </div>

                  <!-- MNotify sub-group -->
                  <div class="rounded-lg border border-gray-100 overflow-hidden">
                    <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest">MNotify</span>
                      <span
                        v-if="editedSettings['sms_active_provider'] === 'mnotify'"
                        class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium"
                      >Active</span>
                      <span v-else class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-400 text-xs">Fallback</span>
                    </div>
                    <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <SettingField
                        v-for="setting in smsMnotifySettings"
                        :key="setting.key"
                        :setting="setting"
                        :edited-settings="editedSettings"
                        :original-settings="originalSettings"
                        :reveal-map="revealMap"
                        @revert="revertField"
                        @toggle-reveal="toggleReveal"
                        @update="(key, val) => { editedSettings[key] = val }"
                      />
                    </div>
                  </div>

                  <!-- Termii sub-group -->
                  <div class="rounded-lg border border-gray-100 overflow-hidden">
                    <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Termii</span>
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium">International</span>
                    </div>
                    <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <SettingField
                        v-for="setting in smsTermiiSettings"
                        :key="setting.key"
                        :setting="setting"
                        :edited-settings="editedSettings"
                        :original-settings="originalSettings"
                        :reveal-map="revealMap"
                        @revert="revertField"
                        @toggle-reveal="toggleReveal"
                        @update="(key, val) => { editedSettings[key] = val }"
                      />
                    </div>
                  </div>
                </div>
              </template>

              <!-- All other sections: regular grid -->
              <template v-else>
                <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <SettingField
                    v-for="setting in section.settings"
                    :key="setting.key"
                    :setting="setting"
                    :edited-settings="editedSettings"
                    :original-settings="originalSettings"
                    :reveal-map="revealMap"
                    @revert="revertField"
                    @toggle-reveal="toggleReveal"
                    @update="(key, val) => { editedSettings[key] = val }"
                  />
                </div>
              </template>
            </section>
          </template>

        </main>
      </div>
    </div>

    <!-- Toast notification -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition-all duration-200 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="message"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold max-w-sm"
        :class="message.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'"
        role="status"
        aria-live="polite"
      >
        <svg v-if="message.type === 'error'" class="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <svg v-else class="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        {{ message.text }}
      </div>
    </Transition>

  </div>

</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { InputTypeHTMLAttribute } from 'vue'
import { createPlatformSettingsService } from '~/services/platformSettings/platformSettingsService'
import type { PlatformSetting, PlatformSettingUpdate, ApiEnvelope } from '~/services/types'

const platformSettingsService = createPlatformSettingsService(useApi())

const loading = ref<boolean>(false)
const message = ref<{ text: string; type: string } | null>(null)
const originalSettings = reactive<Record<string, string>>({})
const editedSettings = reactive<Record<string, string>>({})

// UI-only state: which sensitive fields are revealed, and post-save success flash
const revealMap = reactive<Record<string, boolean>>({})
const saveSuccess = ref<boolean>(false)

const toggleReveal = (key: string): void => {
  revealMap[key] = !revealMap[key]
}

const revertField = (key: string): void => {
  editedSettings[key] = originalSettings[key]
}

interface SettingOption {
  value: string;
  label: string;
}

interface SettingDefinition {
  key: string;
  label: string;
  help: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  inputType?: InputTypeHTMLAttribute;
  step?: string;
  defaultValue: string;
  options?: SettingOption[];
}

interface SectionDefinition {
  id: string;
  short: string;
  title: string;
  description: string;
  settings: SettingDefinition[];
}

const sections: SectionDefinition[] = [
  {
    id: 'order',
    short: 'OPS',
    title: 'Order Processing',
    description: 'Request fees, markup, sourcing retries, radius, and timing controls',
    settings: [
      {
        key: 'request_submission_fee',
        label: 'Request Submission Fee (GHS)',
        help: 'Fee charged when the customer submits a request',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '5.00'
      },
      {
        key: 'order_markup_rate',
        label: 'Order Markup Rate',
        help: 'Markup applied on sourced pharmacy prices (e.g., 0.15 = 15%)',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '0.15'
      },
      {
        key: 'min_order_amount',
        label: 'Minimum Order Amount (GHS)',
        help: 'Minimum checkout amount allowed for an order',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '5.00'
      },
      {
        key: 'max_pharmacy_retries',
        label: 'Max Pharmacy Retries',
        help: 'Maximum number of pharmacies to try before giving up',
        type: 'number',
        inputType: 'number',
        defaultValue: '3'
      },
      {
        key: 'max_pharmacy_search_radius_km',
        label: 'Max Pharmacy Search Radius (km)',
        help: 'Maximum sourcing radius in kilometers',
        type: 'number',
        inputType: 'number',
        defaultValue: '10'
      },
      {
        key: 'pharmacy_response_timeout_minutes',
        label: 'Pharmacy Response Timeout (minutes)',
        help: 'Timeout before a pending pharmacy contact is marked as timed out',
        type: 'number',
        inputType: 'number',
        defaultValue: '15'
      },
      {
        key: 'request_no_response_refund_minutes',
        label: 'No-Response Refund Delay (minutes)',
        help: 'Minutes before request fee is refunded if no pharmacy responds',
        type: 'number',
        inputType: 'number',
        defaultValue: '120'
      },
      {
        key: 'max_delivery_stops_for_single_driver',
        label: 'Max Stops For Single Driver',
        help: 'Above this pickup-stop count, delivery should be handled manually',
        type: 'number',
        inputType: 'number',
        defaultValue: '2'
      }
    ]
  },
  {
    id: 'payment',
    short: 'PAY',
    title: 'Wallet and Payments',
    description: 'Keys used for customer wallet top-up and verification',
    settings: [
      {
        key: 'paystack_public_key',
        label: 'Paystack Public Key',
        help: 'Client-side key used for Paystack initialization',
        type: 'string',
        inputType: 'text',
        defaultValue: ''
      },
      {
        key: 'paystack_secret_key',
        label: 'Paystack Secret Key',
        help: 'Server-side key used for transaction verification',
        type: 'string',
        inputType: 'password',
        defaultValue: ''
      },
      {
        key: 'paystack_fee_rate',
        label: 'Paystack Fee Rate',
        help: 'Percentage of transaction amount charged by Paystack (1.95% = 0.0195)',
        type: 'number',
        inputType: 'number',
        step: '0.0001',
        defaultValue: '0.0195'
      },
      {
        key: 'paystack_fee_flat',
        label: 'Paystack Flat Fee (GHS)',
        help: 'Fixed fee Paystack adds to every transaction in GHS',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '0.50'
      }
    ]
  },
  {
    id: 'delivery',
    short: 'LOG',
    title: 'Delivery and Routing',
    description: 'Distance-based pricing, dispatch visibility, and route service integration',
    settings: [
      {
        key: 'delivery_fee_per_km',
        label: 'Delivery Fee Per KM (GHS)',
        help: 'Per-kilometer delivery charge',
        type: 'number',
        inputType: 'number',
        step: '0.01',
        defaultValue: '2.00'
      },
      {
        key: 'delivery_visibility_radius_km',
        label: 'Dispatch Visibility Radius (km)',
        help: 'How far from a pickup pharmacy a dispatch company can be and still see the delivery. Set high (e.g. 100) to show all open deliveries regardless of location.',
        type: 'number',
        inputType: 'number',
        defaultValue: '20'
      },
      {
        key: 'openrouteservice_api_key',
        label: 'OpenRouteService API Key',
        help: 'Required for distance and route calculations',
        type: 'string',
        inputType: 'text',
        defaultValue: ''
      },
      {
        key: 'pickup_close_buffer_minutes',
        label: 'Pickup Close Buffer (minutes)',
        help: 'A pharmacy must remain open for at least this many minutes after payment for pickup to be offered to the customer',
        type: 'number',
        inputType: 'number',
        defaultValue: '30'
      }
    ]
  },
  {
    id: 'sms',
    short: 'SMS',
    title: 'SMS Providers',
    description: 'Active provider, credentials, and sender IDs. Changes take effect within 5 minutes (cache TTL).',
    settings: [
      {
        key: 'sms_active_provider',
        label: 'Active Provider',
        help: 'Primary SMS provider. MNotify is used as fallback if the primary fails.',
        type: 'select',
        options: [{ value: 'nalo', label: 'Nalo Solutions' }, { value: 'mnotify', label: 'MNotify' }],
        defaultValue: 'nalo'
      },
      {
        key: 'sms_nalo_username',
        label: 'Nalo Username',
        help: 'Nalo Solutions API username',
        type: 'string',
        inputType: 'text',
        defaultValue: ''
      },
      {
        key: 'sms_nalo_password',
        label: 'Nalo Password',
        help: 'Nalo Solutions API password',
        type: 'string',
        inputType: 'password',
        defaultValue: ''
      },
      {
        key: 'sms_nalo_sender_platform',
        label: 'Nalo — Platform Sender ID',
        help: 'Sender name for OTP, verification, and system alerts via Nalo (max 11 chars)',
        type: 'string',
        inputType: 'text',
        defaultValue: 'RigelOS'
      },
      {
        key: 'sms_nalo_sender_medsgh',
        label: 'Nalo — MedsGH Sender ID',
        help: 'Sender name for order, delivery, and pharmacy notifications via Nalo (max 11 chars)',
        type: 'string',
        inputType: 'text',
        defaultValue: 'RigelOS'
      },
      {
        key: 'sms_mnotify_api_key',
        label: 'MNotify API Key',
        help: 'MNotify API key from the MNotify dashboard',
        type: 'string',
        inputType: 'password',
        defaultValue: ''
      },
      {
        key: 'sms_mnotify_sender_platform',
        label: 'MNotify — Platform Sender ID',
        help: 'Sender name for OTP, verification, and system alerts via MNotify (must be approved)',
        type: 'string',
        inputType: 'text',
        defaultValue: 'MedsGh'
      },
      {
        key: 'sms_mnotify_sender_medsgh',
        label: 'MNotify — MedsGH Sender ID',
        help: 'Sender name for order, delivery, and pharmacy notifications via MNotify (must be approved)',
        type: 'string',
        inputType: 'text',
        defaultValue: 'MedsGh'
      },
      {
        key: 'termii_api_key',
        label: 'Termii API Key',
        help: 'API key from the Termii dashboard — used for international (non-Ghana) numbers',
        type: 'string',
        inputType: 'password',
        defaultValue: ''
      },
      {
        key: 'termii_sender_id',
        label: 'Termii Sender ID',
        help: 'Termii registered sender ID (3-11 alphanumeric chars)',
        type: 'string',
        inputType: 'text',
        defaultValue: 'MedsGh'
      },
      {
        key: 'termii_channel',
        label: 'Termii Channel',
        help: 'Must match the channel each destination country is approved for on the Termii dashboard (e.g. UK is DND-only, Ghana is generic-only)',
        type: 'select',
        options: [{ value: 'dnd', label: 'DND' }, { value: 'generic', label: 'Generic' }],
        defaultValue: 'dnd'
      }
    ]
  },
  {
    id: 'notifications',
    short: 'NTF',
    title: 'Notifications',
    description: 'Phone numbers that receive automated platform alerts',
    settings: [
      {
        key: 'platform_admin_phone',
        label: 'Platform Admin Phone',
        help: 'Ghana number (e.g. 233556637717) that receives an SMS alert whenever a new request is submitted. Falls back to 233556637717 if left blank.',
        type: 'string',
        inputType: 'tel',
        defaultValue: '233556637717'
      }
    ]
  },
  // {
  //   id: 'system',
  //   short: 'SYS',
  //   title: 'System',
  //   description: 'General platform access behavior',
  //   settings: [
  //     {
  //       key: 'require_login_to_browse',
  //       label: 'Require Login To Browse',
  //       help: 'If enabled, browsing customer pages requires authentication',
  //       type: 'boolean',
  //       inputType: 'text',
  //       defaultValue: 'false'
  //     }
  //   ]
  // }
]

const allSettings = computed<SettingDefinition[]>(() => sections.flatMap((section) => section.settings))

const hasChanges = computed<boolean>(() =>
  allSettings.value.some((setting) => editedSettings[setting.key] !== originalSettings[setting.key])
)

// Derived: count of changed fields (UI only — never modifies business logic)
const changeCount = computed<number>(() =>
  allSettings.value.filter((s) => editedSettings[s.key] !== originalSettings[s.key]).length
)

// SMS sub-groups for grouped template rendering
const smsSection = computed(() => sections.find((s) => s.id === 'sms')!)
const smsProviderSetting = computed(() => smsSection.value.settings.filter((s) => s.key === 'sms_active_provider'))
const smsNaloSettings = computed(() => smsSection.value.settings.filter((s) => s.key.startsWith('sms_nalo_')))
const smsMnotifySettings = computed(() => smsSection.value.settings.filter((s) => s.key.startsWith('sms_mnotify_')))
const smsTermiiSettings = computed(() => smsSection.value.settings.filter((s) => s.key.startsWith('termii_')))

// Per-section change count for sidebar dots
const sectionChangeCount = (section: SectionDefinition): number =>
  section.settings.filter((s) => editedSettings[s.key] !== originalSettings[s.key]).length

// Section chip color by short code
const sectionChipClass = (short: string): string => {
  const map: Record<string, string> = {
    OPS: 'bg-blue-50 text-blue-700',
    PAY: 'bg-green-50 text-green-700',
    LOG: 'bg-purple-50 text-purple-700',
    SMS: 'bg-orange-50 text-orange-700',
    NTF: 'bg-red-50 text-red-700',
    SYS: 'bg-gray-100 text-gray-600',
  }
  return map[short] ?? 'bg-gray-100 text-gray-600'
}

const showMessage = (text: string, type: string = 'success'): void => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 4500)
}

// Domain calls go through `platformSettingsService` (created above).
// Envelope nuance: the previous inline `apiCall` rejected on
// `payload.success === false` even when the HTTP status was 2xx.
// `useApi` only throws on HTTP status, so each call site below
// preserves the `success === false` guard explicitly and re-throws
// with `payload.message`, matching the prior behavior byte-for-byte.
const ensureSuccess = <T>(payload: ApiEnvelope<T>): ApiEnvelope<T> => {
  if (payload && payload.success === false) {
    throw new Error(payload.message ?? 'API error')
  }
  return payload
}

const fetchSettings = async (): Promise<void> => {
  loading.value = true
  try {
    const res = ensureSuccess(await platformSettingsService.listSettings())
    const current: PlatformSetting[] = Array.isArray(res.data) ? res.data : []

    for (const setting of allSettings.value) {
      const found = current.find((row) => row.setting_key === setting.key)
      const value = found?.setting_value ?? setting.defaultValue
      originalSettings[setting.key] = found?.setting_value ?? ''
      editedSettings[setting.key] = value
    }

    showMessage('Settings loaded')
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Failed to load settings', 'error')
  } finally {
    loading.value = false
  }
}

const saveAll = async (): Promise<void> => {
  loading.value = true
  try {
    const changedSettings: PlatformSettingUpdate[] = allSettings.value
      .filter((setting) => editedSettings[setting.key] !== originalSettings[setting.key])
      .map((setting) => ({ key: setting.key, value: editedSettings[setting.key] ?? '' }))

    if (changedSettings.length === 0) {
      showMessage('No changes to save')
      return
    }

    ensureSuccess(await platformSettingsService.bulkUpdate(changedSettings))

    for (const { key, value } of changedSettings) {
      originalSettings[key] = value
    }

    showMessage(`${changedSettings.length} setting(s) saved`)

    // Flash the inline save-success indicator
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 2500)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Failed to save settings', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => { void fetchSettings() })

definePageMeta({ middleware: ['admin-auth'], layout: 'admin-layout' })
</script>

<style scoped>
/* Smooth scroll for sidebar jump links */
html {
  scroll-behavior: smooth;
}

/* form-control compatibility shim — Tailwind classes handle most styling,
   this ensures any external .form-control usage still gets a focus ring */
.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #111827;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* Reduced motion: strip all transitions and animations */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
