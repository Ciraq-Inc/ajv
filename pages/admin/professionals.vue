<template>
  <div class="container mx-auto p-4">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-2xl font-bold text-gray-800">Professional Verifications</h1>
          <p class="text-gray-600 mt-1">Review applications and manage the professional registry</p>
        </div>
        <button
          @click="refresh"
          :disabled="loading"
          class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center disabled:opacity-50 self-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" :class="['h-5 w-5 mr-1.5', loading ? 'animate-spin' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-gray-200">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="switchTab(tab.value)"
        :class="[
          'px-5 py-2.5 text-sm font-medium rounded-t-md transition-colors',
          activeTab === tab.value
            ? 'bg-white border border-b-white border-gray-200 -mb-px text-indigo-700'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        {{ tab.label }}
        <span
          v-if="tab.value !== 'registry' && counts[tab.value] !== null"
          :class="[
            'ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
            tab.value === 'pending' ? 'bg-amber-100 text-amber-800' :
            tab.value === 'approved' ? 'bg-emerald-100 text-emerald-800' :
            'bg-red-100 text-red-800'
          ]"
        >
          {{ counts[tab.value] }}
        </span>
        <span
          v-else-if="tab.value === 'registry' && registryTotal !== null"
          class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
        >
          {{ registryTotal }}
        </span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-2">
      <svg class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- ===================== Registry tab ===================== -->
    <template v-if="activeTab === 'registry'">
      <!-- Import panel -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 class="text-sm font-semibold text-gray-800 mb-1">Import professionals</h2>
        <p class="text-xs text-gray-500 mb-3">
          Upload a membership export CSV (columns: <code class="bg-gray-100 px-1 rounded">PSGH ID</code>,
          <code class="bg-gray-100 px-1 rounded">Display Name</code>, <code class="bg-gray-100 px-1 rounded">Email</code>,
          <code class="bg-gray-100 px-1 rounded">Phone Number</code>, <code class="bg-gray-100 px-1 rounded">Member Since</code>).
          Existing rows with the same ID are updated, not duplicated.
        </p>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            v-model="importProfession"
            class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option v-for="p in professions" :key="p" :value="p">{{ capitalize(p) }}</option>
          </select>
          <input
            ref="fileInputRef"
            type="file"
            accept=".csv,text/csv"
            @change="onFileSelected"
            class="text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <button
            @click="submitImport"
            :disabled="!selectedFile || importing"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {{ importing ? 'Importing…' : 'Import CSV' }}
          </button>
        </div>
        <div v-if="importResult" class="mt-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md px-3 py-2">
          Parsed {{ importResult.seen }} row(s) — {{ importResult.upserted }} imported/updated.
          <span v-if="importResult.skippedNoId || importResult.skippedNoName">
            Skipped {{ importResult.skippedNoId }} (no ID), {{ importResult.skippedNoName }} (no name).
          </span>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          v-model="registryProfessionFilter"
          @change="searchRegistry"
          class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All professions</option>
          <option v-for="p in professions" :key="p" :value="p">{{ capitalize(p) }}</option>
        </select>
        <input
          v-model="registryQuery"
          @keyup.enter="searchRegistry"
          type="text"
          placeholder="Search name, ID, email, or phone…"
          class="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          @click="searchRegistry"
          class="px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
        >
          Search
        </button>
        <div v-if="registryCounts.length" class="flex flex-wrap gap-2">
          <span
            v-for="c in registryCounts"
            :key="c.profession"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          >
            {{ capitalize(c.profession) }}: {{ c.total }}
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Registry table -->
      <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profession</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registry ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="registryEntries.length === 0">
                <td colspan="7" class="px-6 py-10 text-center text-gray-500 text-sm">No registry entries found</td>
              </tr>
              <tr v-for="entry in registryEntries" :key="entry.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ entry.display_name }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="capitalize text-sm text-gray-900">{{ entry.profession }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ entry.psgh_id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div v-if="entry.email">{{ entry.email }}</div>
                  <div v-if="entry.phone_e164" class="text-xs text-gray-400">{{ entry.phone_e164 }}</div>
                  <div v-if="!entry.email && !entry.phone_e164">—</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ entry.member_since || '—' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{{ entry.source_file || '—' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div v-if="deletingId === entry.id" class="flex gap-2 justify-end">
                    <button
                      @click="deletingId = null"
                      class="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      @click="confirmDelete(entry.id)"
                      :disabled="deleteActionId === entry.id"
                      class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {{ deleteActionId === entry.id ? 'Removing…' : 'Confirm' }}
                    </button>
                  </div>
                  <button
                    v-else
                    @click="deletingId = entry.id"
                    class="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="registryTotal" class="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>{{ registryRangeLabel }}</span>
          <div class="flex gap-2">
            <button
              @click="changeRegistryPage(-1)"
              :disabled="registryOffset === 0"
              class="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              @click="changeRegistryPage(1)"
              :disabled="registryOffset + registryLimit >= registryTotal"
              class="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ===================== Application tabs ===================== -->
    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Table -->
      <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profession</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th v-if="activeTab !== 'pending'" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed</th>
                <th v-if="activeTab === 'pending'" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                <th v-else class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="applications.length === 0">
                <td :colspan="activeTab === 'pending' ? 5 : 6" class="px-6 py-10 text-center text-gray-500 text-sm">
                  No {{ activeTab }} applications
                </td>
              </tr>
              <tr v-for="app in applications" :key="app.id" class="hover:bg-gray-50 transition-colors">
                <!-- Customer -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span class="text-indigo-700 font-semibold text-sm">{{ initials(app) }}</span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ app.fname }} {{ app.lname }}</div>
                      <div class="text-xs text-gray-500">{{ app.phone }}</div>
                      <div v-if="app.email" class="text-xs text-gray-400">{{ app.email }}</div>
                    </div>
                  </div>
                </td>
                <!-- Profession -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="capitalize text-sm text-gray-900">{{ app.profession_type }}</span>
                </td>
                <!-- License -->
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ app.license_number }}</div>
                  <div v-if="app.license_body" class="text-xs text-gray-500 mt-0.5">{{ app.license_body }}</div>
                  <div v-if="app.registry_match_name" class="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    PSGH match: {{ app.registry_match_name }}
                  </div>
                </td>
                <!-- Submitted -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(app.submitted_at) }}
                </td>
                <!-- Reviewed (non-pending tabs) -->
                <td v-if="activeTab !== 'pending'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{{ formatDate(app.reviewed_at) }}</div>
                  <div v-if="app.verification_method === 'auto_sms'" class="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                    Auto-verified · PSGH SMS
                  </div>
                  <div v-else-if="app.reviewed_by" class="text-xs text-gray-400 mt-0.5">by {{ app.reviewed_by }}</div>
                  <div v-if="app.rejection_reason" class="text-xs text-red-600 mt-1 max-w-xs">{{ app.rejection_reason }}</div>
                </td>
                <!-- Actions (pending) -->
                <td v-if="activeTab === 'pending'" class="px-6 py-4 whitespace-nowrap text-right">
                  <div v-if="rejectingId === app.id" class="flex flex-col items-end gap-2">
                    <textarea
                      v-model="rejectReason"
                      rows="2"
                      placeholder="Rejection reason (required)"
                      class="text-sm border border-gray-300 rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    />
                    <div class="flex gap-2">
                      <button
                        @click="rejectingId = null; rejectReason = ''"
                        class="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        @click="submitReview(app.id, 'reject')"
                        :disabled="!rejectReason.trim() || actionId === app.id"
                        class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {{ actionId === app.id ? 'Rejecting…' : 'Confirm Reject' }}
                      </button>
                    </div>
                  </div>
                  <div v-else class="flex gap-2 justify-end">
                    <button
                      @click="submitReview(app.id, 'approve')"
                      :disabled="actionId === app.id"
                      class="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {{ actionId === app.id ? 'Approving…' : 'Approve' }}
                    </button>
                    <button
                      @click="rejectingId = app.id; rejectReason = ''"
                      :disabled="actionId === app.id"
                      class="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </td>
                <!-- Status badge (non-pending) -->
                <td v-else class="px-6 py-4 whitespace-nowrap">
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
                    app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  ]">
                    {{ app.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { createProfessionalsAdminService } from '~/services/professionals/professionalsAdminService';
import type { ProfessionalApplication, Profession, RegistryEntry } from '~/services/professionals/professionalsAdminService';

definePageMeta({
  layout: 'admin-layout',
  middleware: ['admin-auth'],
});

type ApplicationTab = 'pending' | 'approved' | 'rejected';
type TabValue = ApplicationTab | 'registry';

const tabs: { label: string; value: TabValue }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Registry', value: 'registry' },
];

const professions: Profession[] = ['doctor', 'pharmacist', 'nurse', 'other'];

const service = createProfessionalsAdminService(useApi());

const activeTab = ref<TabValue>('pending');
const loading = ref(false);
const error = ref<string | null>(null);

// --- Applications state ---
const applications = ref<ProfessionalApplication[]>([]);
const counts = reactive<Record<ApplicationTab, number | null>>({ pending: null, approved: null, rejected: null });
const actionId = ref<number | null>(null);
const rejectingId = ref<number | null>(null);
const rejectReason = ref('');

// --- Registry state ---
const registryEntries = ref<RegistryEntry[]>([]);
const registryTotal = ref<number | null>(null);
const registryCounts = ref<{ profession: Profession; total: number }[]>([]);
const registryProfessionFilter = ref<Profession | ''>('');
const registryQuery = ref('');
const registryLimit = 50;
const registryOffset = ref(0);
const deletingId = ref<number | null>(null);
const deleteActionId = ref<number | null>(null);

const importProfession = ref<Profession>('pharmacist');
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const importing = ref(false);
const importResult = ref<{ seen: number; upserted: number; skippedNoId: number; skippedNoName: number } | null>(null);

const registryRangeLabel = computed(() => {
  if (!registryTotal.value) return '';
  const from = registryOffset.value + 1;
  const to = Math.min(registryOffset.value + registryLimit, registryTotal.value);
  return `${from}–${to} of ${registryTotal.value}`;
});

const loadApplications = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await service.list(activeTab.value as ApplicationTab);
    applications.value = res.data ?? [];
    counts[activeTab.value as ApplicationTab] = applications.value.length;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load applications';
  } finally {
    loading.value = false;
  }
};

const loadRegistry = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await service.listRegistry({
      profession: registryProfessionFilter.value || undefined,
      q: registryQuery.value.trim() || undefined,
      limit: registryLimit,
      offset: registryOffset.value,
    });
    registryEntries.value = res.data ?? [];
    registryTotal.value = res.total ?? 0;
    registryCounts.value = res.counts ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load registry';
  } finally {
    loading.value = false;
  }
};

const load = () => (activeTab.value === 'registry' ? loadRegistry() : loadApplications());
const refresh = () => void load();

const switchTab = (tab: TabValue) => {
  activeTab.value = tab;
  rejectingId.value = null;
  rejectReason.value = '';
  deletingId.value = null;
  void load();
};

const searchRegistry = () => {
  registryOffset.value = 0;
  void loadRegistry();
};

const changeRegistryPage = (direction: 1 | -1) => {
  registryOffset.value = Math.max(0, registryOffset.value + direction * registryLimit);
  void loadRegistry();
};

const onFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] ?? null;
  importResult.value = null;
};

const submitImport = async () => {
  if (!selectedFile.value) return;
  importing.value = true;
  error.value = null;
  importResult.value = null;
  try {
    const res = await service.importRegistry(selectedFile.value, importProfession.value);
    importResult.value = res.data;
    selectedFile.value = null;
    if (fileInputRef.value) fileInputRef.value.value = '';
    registryOffset.value = 0;
    await loadRegistry();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to import CSV';
  } finally {
    importing.value = false;
  }
};

const confirmDelete = async (id: number) => {
  deleteActionId.value = id;
  try {
    await service.deleteRegistryEntry(id);
    registryEntries.value = registryEntries.value.filter(r => r.id !== id);
    if (registryTotal.value !== null) registryTotal.value -= 1;
    deletingId.value = null;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to remove entry';
  } finally {
    deleteActionId.value = null;
  }
};

const submitReview = async (id: number, action: 'approve' | 'reject') => {
  if (action === 'reject' && !rejectReason.value.trim()) return;
  actionId.value = id;
  try {
    await service.review({
      id,
      action,
      rejection_reason: action === 'reject' ? rejectReason.value.trim() : null,
    });
    applications.value = applications.value.filter(a => a.id !== id);
    counts[activeTab.value as ApplicationTab] = applications.value.length;
    rejectingId.value = null;
    rejectReason.value = '';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Action failed';
  } finally {
    actionId.value = null;
  }
};

const initials = (app: ProfessionalApplication) =>
  ((app.fname?.[0] ?? '') + (app.lname?.[0] ?? '')).toUpperCase() || '?';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatDate = (d: string | null | undefined) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

onMounted(() => void load());
</script>
