<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Companies</h1>
      <p class="text-sm text-gray-500 mt-0.5">Manage pharmacies, hospitals, clinics and their subsidiaries</p>
    </div>

    <!-- Action Bar -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <div class="flex flex-wrap items-end gap-3">
        <div class="relative flex-1 max-w-sm">
          <label class="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search companies..."
              class="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              @input="debouncedSearch"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="w-4 h-4 text-gray-400" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div class="ml-auto">
          <button
            @click="refreshCompanies"
            class="h-9 w-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
            :disabled="loading"
            aria-label="Refresh companies"
          >
            <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>
        </div>
      </div>
    </div>

    <!-- Companies Table -->
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 class="text-sm font-semibold text-gray-900">Companies</h2>
        <span class="text-xs text-gray-500">
          {{ companies.length }} total
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-16">
        <div class="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="companies.length === 0" class="text-center py-16">
        <BuildingOfficeIcon class="w-10 h-10 mx-auto text-gray-300 mb-3" aria-hidden="true" />
        <p class="text-sm font-medium text-gray-600 mb-1">No companies found</p>
        <p class="text-xs text-gray-400">Try a different search term.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">#</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Location</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(company, index) in companies"
              :key="company.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3 text-sm text-gray-500">{{ index + 1 }}</td>
              <td class="px-4 py-3" style="max-width: 200px;">
                <div class="text-sm font-medium text-gray-900 truncate">{{ company.name }}</div>
                <div class="text-xs text-gray-400 truncate font-mono" :title="company.uiid">{{ company.uiid }}</div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full"
                  :class="getTypeClass(company.companytype)"
                >
                  {{ getCompanyTypeName(company.companytype) }}
                </span>
                <!-- Subsidiary label hidden for now -->
                <div v-if="false && (company.maincompanyid ?? 0) > 0" class="text-xs text-gray-400 mt-0.5">Subsidiary</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">
                <div>{{ company.email || "N/A" }}</div>
                <div>{{ company.tel1 || company.tel2 || "N/A" }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">
                <div>{{ company.location || "N/A" }}</div>
                <div class="text-xs">{{ company.address1 || "" }}</div>
              </td>
              <td class="px-4 py-3 text-sm font-mono text-gray-500">{{ company.id }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <button
                    @click="viewCompany(company)"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="View Details"
                    aria-label="View company details"
                  >
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="editCompany(company)"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Edit Contact Info"
                    aria-label="Edit company contact info"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
      <div class="flex gap-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-medium text-red-800">Something went wrong</h3>
          <div class="mt-1 text-sm text-red-700">{{ error }}</div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Company Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto z-50 flex items-start justify-center pt-16"
      @click="closeModals"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 mb-8"
        @click.stop
      >
        <h3 class="text-base font-semibold text-gray-900 mb-5">
          {{ showCreateModal ? "Add New Company" : showEditModal ? "Update Contact Information" : "Edit Company" }}
        </h3>

        <form
          @submit.prevent="showCreateModal ? createCompany() : updateCompany()"
          class="space-y-4"
        >
          <div v-if="showCreateModal" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">UIID *</label>
              <input
                v-model="companyForm.uiid"
                type="text"
                required
                :disabled="showEditModal"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-sm"
                placeholder="Unique identifier"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                v-model="companyForm.name"
                type="text"
                required
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Company name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                v-model="companyForm.email"
                type="email"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="company@email.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone 1</label>
              <input
                v-model="companyForm.tel1"
                type="tel"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0241234567"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone 2</label>
              <input
                v-model="companyForm.tel2"
                type="tel"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0201234567"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
              <select
                v-model="companyForm.companytype"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="0">Pharmacy</option>
                <option value="1">Hospital</option>
                <option value="2">Clinic</option>
                <option value="3">Wholesaler</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Address 1</label>
              <input
                v-model="companyForm.address1"
                type="text"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Street address"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Address 2</label>
              <input
                v-model="companyForm.address2"
                type="text"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Additional address info"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                v-model="companyForm.location"
                type="text"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="City, Region"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
              <input
                v-model="companyForm.ddate"
                type="date"
                class="w-full h-9 px-3 appearance-none bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Parent Company ID</label>
              <input
                v-model="companyForm.maincompanyid"
                type="number"
                min="0"
                class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0 for main company"
              />
            </div>
          </div>

          <!-- Edit Modal fields -->
          <div v-if="showEditModal" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Domain Name</label>
                <input
                  v-model="companyForm.domain_name"
                  type="text"
                  class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="company-domain"
                />
                <p class="text-xs text-gray-400 mt-1">Unique domain identifier for the company</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  v-model="companyForm.whatsapp_number"
                  type="tel"
                  class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="+233501234567"
                />
                <p class="text-xs text-gray-400 mt-1">WhatsApp contact number with country code</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
                <select
                  v-model="companyForm.companytype"
                  class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option :value="0">Pharmacy</option>
                  <option :value="1">Hospital</option>
                  <option :value="2">Clinic</option>
                  <option :value="3">Wholesaler</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">SMS Sender ID</label>
                <input
                  v-model="companyForm.sender_id"
                  type="text"
                  class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., RigelOS"
                  maxlength="11"
                />
                <p class="text-xs text-gray-400 mt-1">Custom SMS sender ID (max 11 chars). Leave empty to use default (RigelOS)</p>
              </div>
            </div>

            <!-- Additional Details -->
            <div class="border-t border-gray-100 pt-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">Additional Details</h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Alternate Company ID</label>
                  <input
                    v-model="companyForm.alternate_company_id"
                    type="text"
                    class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Alternative identifier"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    v-model="companyForm.country"
                    type="text"
                    class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="e.g., Ghana"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    v-model="companyForm.location_detail"
                    type="text"
                    class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="e.g., Accra"
                  />
                </div>
              </div>

              <!-- Region -> District -> Sub-district cascade. Each field is
                   disabled until its parent is chosen, and the chevrons /
                   helper text make the dependency explicit. -->
              <div class="mt-4 border border-gray-200 rounded-xl bg-gray-50/60 p-4">
                <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-2 gap-y-3 items-start">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">1. Region</label>
                    <select
                      v-model="companyForm.region"
                      class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      @change="onRegionChange"
                    >
                      <option value="">Select region</option>
                      <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
                    </select>
                  </div>
                  <div class="hidden md:flex items-center justify-center pt-7">
                    <ChevronRightIcon class="w-4 h-4 text-gray-300" aria-hidden="true" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">2. District</label>
                    <select
                      v-model="companyForm.district"
                      :disabled="!companyForm.region"
                      class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                      @change="onDistrictChange"
                    >
                      <option value="">Select district</option>
                      <option v-for="d in districtOptions" :key="d" :value="d">{{ d }}</option>
                    </select>
                    <p v-if="!companyForm.region" class="text-xs text-gray-400 mt-1">Select a region first</p>
                  </div>
                  <div class="hidden md:flex items-center justify-center pt-7">
                    <ChevronRightIcon class="w-4 h-4 text-gray-300" aria-hidden="true" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">3. Sub-district</label>
                    <select
                      v-model="companyForm.sub_district"
                      :disabled="!companyForm.district"
                      class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      <option value="">Select sub-district</option>
                      <option v-for="sd in subDistrictOptions" :key="sd" :value="sd">{{ sd }}</option>
                    </select>
                    <p v-if="!companyForm.district" class="text-xs text-gray-400 mt-1">Select a district first</p>
                  </div>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    v-model="companyForm.latitude"
                    type="number"
                    step="any"
                    class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="e.g., 5.6037"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    v-model="companyForm.longitude"
                    type="number"
                    step="any"
                    class="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="e.g., -0.1870"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              @click="closeModals"
              class="h-9 px-4 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="modalLoading"
              class="h-9 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {{ modalLoading ? "Saving..." : showCreateModal ? "Create Company" : showEditModal ? "Update Contact Info" : "Update Company" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Company Modal -->
    <div
      v-if="showViewModal"
      class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto z-50 flex items-start justify-center pt-16"
      @click="closeModals"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 mb-8"
        @click.stop
      >
        <h3 class="text-base font-semibold text-gray-900 mb-5">Company Details</h3>

        <div v-if="selectedCompany" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Company Name</label>
              <p class="text-sm text-gray-900">{{ selectedCompany.name }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">UIID</label>
              <p class="text-sm text-gray-900 font-mono">{{ selectedCompany.uiid }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Type</label>
              <p class="text-sm text-gray-900">{{ getCompanyTypeName(selectedCompany.companytype) }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Email</label>
              <p class="text-sm text-gray-900">{{ selectedCompany.email || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Phone 1</label>
              <p class="text-sm text-gray-900">{{ selectedCompany.tel1 || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Phone 2</label>
              <p class="text-sm text-gray-900">{{ selectedCompany.tel2 || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Domain Name</label>
              <p class="text-sm text-gray-900 font-mono">{{ selectedCompany.domain_name || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">WhatsApp Number</label>
              <p class="text-sm text-gray-900">{{ selectedCompany.whatsapp_number || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">SMS Sender ID</label>
              <p class="text-sm text-gray-900 font-mono">{{ selectedCompany.sender_id || "Default (RigelOS)" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Logo</label>
              <p v-if="selectedCompany.logo" class="text-sm">
                <a :href="selectedCompany.logo" target="_blank" class="text-indigo-600 hover:text-indigo-800 underline">View Logo</a>
              </p>
              <p v-else class="text-sm text-gray-900">N/A</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Shop Banner</label>
              <p v-if="selectedCompany.shop_banner" class="text-sm">
                <a :href="selectedCompany.shop_banner" target="_blank" class="text-indigo-600 hover:text-indigo-800 underline">View Banner</a>
              </p>
              <p v-else class="text-sm text-gray-900">N/A</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Address</label>
              <p class="text-sm text-gray-900">{{ [selectedCompany.address1, selectedCompany.address2].filter(Boolean).join(', ') || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Location</label>
              <p class="text-sm text-gray-900">{{ selectedCompany.location || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Alternate Company ID</label>
              <p class="text-sm text-gray-900 font-mono">{{ selectedCompany.alternate_company_id || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Country / Region</label>
              <p class="text-sm text-gray-900">{{ [selectedCompany.country, selectedCompany.region].filter(Boolean).join(', ') || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">District / Sub-district</label>
              <p class="text-sm text-gray-900">{{ [selectedCompany.district, selectedCompany.sub_district].filter(Boolean).join(', ') || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Coordinates</label>
              <p class="text-sm text-gray-900">
                {{ selectedCompany.latitude && selectedCompany.longitude
                  ? `${selectedCompany.latitude}, ${selectedCompany.longitude}`
                  : "N/A" }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Registration Date</label>
              <p class="text-sm text-gray-900">{{ formatDate(selectedCompany.ddate) }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Parent Company ID</label>
              <p class="text-sm text-gray-900">{{ selectedCompany.maincompanyid || "N/A" }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Created</label>
              <p class="text-sm text-gray-900">{{ formatDate(selectedCompany.created_at) }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-0.5">Updated</label>
              <p class="text-sm text-gray-900">{{ formatDate(selectedCompany.updated_at) }}</p>
            </div>
          </div>

          <!-- Subsidiaries Section -->
          <div
            v-if="selectedCompany.maincompanyid === 0"
            class="mt-4 pt-4 border-t border-gray-100"
          >
            <h4 class="text-sm font-medium text-gray-900 mb-3">Subsidiaries</h4>
            <button
              @click="viewSubsidiaries(selectedCompany)"
              class="h-9 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
              View Subsidiaries ({{ subsidiaryCount }})
            </button>
          </div>
        </div>

        <div class="flex justify-end pt-5 border-t border-gray-100 mt-5">
          <button
            @click="closeModals"
            class="h-9 px-4 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAdminStore } from "~/stores/admin";
import { createCompaniesAnalyticsService } from "~/services/analytics/companiesAnalyticsService";
import type { Company } from "~/services/types";
import { MagnifyingGlassIcon, ArrowPathIcon, EyeIcon, PencilIcon, ExclamationTriangleIcon, ChevronRightIcon } from "@heroicons/vue/24/outline";
import { GHANA_REGIONS, GHANA_DISTRICTS_BY_REGION, GHANA_SUBDISTRICTS_BY_DISTRICT } from "~/utils/constants/ghanaLocations";

/** Extended company shape — all fields from the admin list endpoint. */
interface CompanyRow extends Company {
  email?: string;
  tel1?: string;
  tel2?: string;
  address1?: string;
  address2?: string;
  location?: string;
  companytype?: number;
  maincompanyid?: number;
  ddate?: string;
  alternate_company_id?: string;
  country?: string;
  region?: string;
  location_detail?: string;
  district?: string;
  sub_district?: string;
  latitude?: number | string;
  longitude?: number | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface CompanyFormState {
  uiid: string;
  name: string;
  email: string;
  tel1: string;
  tel2: string;
  address1: string;
  address2: string;
  location: string;
  companytype: number;
  maincompanyid: number;
  ddate: string;
  domain_name: string;
  whatsapp_number: string;
  sender_id: string;
  logo: string;
  shop_banner: string;
  alternate_company_id: string;
  country: string;
  region: string;
  location_detail: string;
  district: string;
  sub_district: string;
  latitude: string;
  longitude: string;
}

const BLANK_FORM: CompanyFormState = {
  uiid: "",
  name: "",
  email: "",
  tel1: "",
  tel2: "",
  address1: "",
  address2: "",
  location: "",
  companytype: 0,
  maincompanyid: 0,
  ddate: "",
  domain_name: "",
  whatsapp_number: "",
  sender_id: "",
  logo: "",
  shop_banner: "",
  alternate_company_id: "",
  country: "",
  region: "",
  location_detail: "",
  district: "",
  sub_district: "",
  latitude: "",
  longitude: "",
}

const adminStore = useAdminStore();
const companiesService = createCompaniesAnalyticsService(useApi());

// Reactive data
const companies = ref<CompanyRow[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const searchQuery = ref<string>("");
const modalLoading = ref<boolean>(false);
const subsidiaryCount = ref<number>(0);

// Modal states
const showCreateModal = ref<boolean>(false);
const showEditModal = ref<boolean>(false);
const showViewModal = ref<boolean>(false);
const selectedCompany = ref<CompanyRow | null>(null);

// Company form
const companyForm = ref<CompanyFormState>({ ...BLANK_FORM });

// Region -> District -> Sub-district cascading dropdown options.
// Legacy free-text values (saved before this field became a dropdown) are
// appended to the options list so editing an existing company never blanks
// out a value that doesn't match the canonical dataset.
const regionOptions = computed<string[]>(() => {
  const current = companyForm.value.region;
  return current && !GHANA_REGIONS.includes(current) ? [...GHANA_REGIONS, current] : GHANA_REGIONS;
});

const districtOptions = computed<string[]>(() => {
  const base = GHANA_DISTRICTS_BY_REGION[companyForm.value.region] ?? [];
  const current = companyForm.value.district;
  return current && !base.includes(current) ? [...base, current] : base;
});

const subDistrictOptions = computed<string[]>(() => {
  const base = GHANA_SUBDISTRICTS_BY_DISTRICT[companyForm.value.district] ?? [];
  const current = companyForm.value.sub_district;
  return current && !base.includes(current) ? [...base, current] : base;
});

// @change (not watch()) so these only fire on genuine user interaction —
// a watch() also fires when editCompany()/resetForm() bulk-assign the whole
// form object, which would wipe legacy district/sub_district values that
// don't match the new dataset before the user ever touched the dropdown.
const onRegionChange = (): void => {
  const validDistricts = GHANA_DISTRICTS_BY_REGION[companyForm.value.region] ?? [];
  if (companyForm.value.district && !validDistricts.includes(companyForm.value.district)) {
    companyForm.value.district = "";
    companyForm.value.sub_district = "";
  }
};

const onDistrictChange = (): void => {
  const validSubDistricts = GHANA_SUBDISTRICTS_BY_DISTRICT[companyForm.value.district] ?? [];
  if (companyForm.value.sub_district && !validSubDistricts.includes(companyForm.value.sub_district)) {
    companyForm.value.sub_district = "";
  }
};

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSearch = (): void => {
  if (searchTimeout !== null) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    void fetchCompanies();
  }, 500);
};

// Fetch companies
const fetchCompanies = async (): Promise<void> => {
  loading.value = true;
  error.value = null;

  try {
    const data = await companiesService.list({ search: searchQuery.value });

    if (data.success) {
      companies.value = data.data as CompanyRow[];
    } else {
      error.value = data.message ?? "Failed to fetch companies";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "An error occurred while fetching companies";
    console.error("Companies fetch error:", err);
  } finally {
    loading.value = false;
  }
};

// Get company type name
const getCompanyTypeName = (type: number | undefined): string => {
  const types: Record<number, string> = {
    0: "Pharmacy",
    1: "Hospital",
    2: "Clinic",
    3: "Wholesaler",
  };
  return (type !== undefined ? types[type] : undefined) ?? "Unknown";
};

// Get type class for styling
const getTypeClass = (type: number | undefined): string => {
  const classes: Record<number, string> = {
    0: "bg-blue-100 text-blue-800",
    1: "bg-red-100 text-red-800",
    2: "bg-purple-100 text-purple-800",
    3: "bg-amber-100 text-amber-800",
  };
  return (type !== undefined ? classes[type] : undefined) ?? "bg-gray-100 text-gray-800";
};

// Get company initials
const getCompanyInitials = (name: string | undefined): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Format date
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

// Create company
const createCompany = async (): Promise<void> => {
  modalLoading.value = true;

  try {
    const data = await companiesService.create(companyForm.value);

    if (data.success) {
      closeModals();
      void fetchCompanies();
    } else {
      alert(data.message ?? "Failed to create company");
    }
  } catch (err) {
    console.error("Create company error:", err);
    alert("An error occurred while creating the company");
  } finally {
    modalLoading.value = false;
  }
};

// Edit company
const editCompany = (company: CompanyRow): void => {
  selectedCompany.value = company;
  companyForm.value = {
    ...BLANK_FORM,
    domain_name: company.domain_name ?? "",
    whatsapp_number: company.whatsapp_number ?? "",
    companytype: company.companytype ?? 0,
    sender_id: company.sender_id ?? "",
    logo: company.logo ?? "",
    shop_banner: company.shop_banner ?? "",
    alternate_company_id: company.alternate_company_id ?? "",
    country: company.country ?? "",
    region: company.region ?? "",
    location_detail: company.location_detail ?? "",
    district: company.district ?? "",
    sub_district: company.sub_district ?? "",
    latitude: String(company.latitude ?? ""),
    longitude: String(company.longitude ?? ""),
  };
  showEditModal.value = true;
};

// Update company
const updateCompany = async (): Promise<void> => {
  if (!selectedCompany.value) return;

  modalLoading.value = true;

  try {
    // Send all editable fields including the "more fields"
    const updateData = {
      domain_name: companyForm.value.domain_name,
      whatsapp_number: companyForm.value.whatsapp_number,
      companytype: companyForm.value.companytype,
      sender_id: companyForm.value.sender_id,
      logo: companyForm.value.logo,
      shop_banner: companyForm.value.shop_banner,
      alternate_company_id: companyForm.value.alternate_company_id,
      country: companyForm.value.country,
      region: companyForm.value.region,
      location_detail: companyForm.value.location_detail,
      district: companyForm.value.district,
      sub_district: companyForm.value.sub_district,
      latitude: companyForm.value.latitude ? parseFloat(companyForm.value.latitude) : null,
      longitude: companyForm.value.longitude ? parseFloat(companyForm.value.longitude) : null,
    };

    const data = await companiesService.update(selectedCompany.value.id, updateData);

    if (data.success) {
      closeModals();
      void fetchCompanies();
    } else {
      alert(data.message ?? "Failed to update company");
    }
  } catch (err) {
    console.error("Update company error:", err);
    alert("An error occurred while updating the company");
  } finally {
    modalLoading.value = false;
  }
};

// View company
const viewCompany = (company: CompanyRow): void => {
  selectedCompany.value = company;
  showViewModal.value = true;
};

// View subsidiaries
const viewSubsidiaries = async (company: CompanyRow): Promise<void> => {
  try {
    const data = await companiesService.listSubsidiaries(company.id);

    if (data.success) {
      subsidiaryCount.value = (data as unknown as { count: number }).count ?? 0;
      // For now, just show an alert with subsidiary info
      if (data.data.length > 0) {
        const subsidiaryNames = data.data.map((sub) => sub.name).join(", ");
        alert(`Subsidiaries of ${company.name}:\n${subsidiaryNames}`);
      } else {
        alert(`${company.name} has no subsidiaries.`);
      }
    }
  } catch (err) {
    console.error("Fetch subsidiaries error:", err);
    alert("Failed to fetch subsidiaries");
  }
};

// Delete company
const deleteCompany = async (company: CompanyRow): Promise<void> => {
  if (
    !confirm(
      `Are you sure you want to delete "${company.name}"? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    const data = await companiesService.remove(company.id);

    if (data.success) {
      void fetchCompanies();
    } else {
      alert(data.message ?? "Failed to delete company");
    }
  } catch (err) {
    console.error("Delete company error:", err);
    alert("An error occurred while deleting the company");
  }
};

// Close modals
const closeModals = (): void => {
  showCreateModal.value = false;
  showEditModal.value = false;
  showViewModal.value = false;
  selectedCompany.value = null;
  companyForm.value = { ...BLANK_FORM };
};

// Refresh companies
const refreshCompanies = (): void => {
  searchQuery.value = "";
  void fetchCompanies();
};

// Initialize
onMounted(() => {
  void fetchCompanies();
});
</script>

