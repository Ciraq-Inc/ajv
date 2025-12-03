<template>
  <div class="companies-management p-6 bg-gray-50 min-h-screen">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">
        Companies Management
      </h1>
      <p class="text-gray-600">
        Manage pharmacies, hospitals, clinics and their subsidiaries
      </p>
    </div>

    <!-- Action Bar -->
    <div class="bg-white rounded-lg p-6 mb-6 border border-gray-200">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Search -->
        <div class="flex flex-col sm:flex-row gap-4 flex-1">
          <div class="relative flex-1 max-w-md">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search companies..."
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              @input="debouncedSearch"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button
            @click="refreshCompanies"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm font-medium transition-colors duration-150"
            :disabled="loading"
          >
            <span class="flex items-center gap-2">
              <ArrowPathIcon class="refresh-icon" :class="{ 'animate-spin': loading }" />
              <span>Refresh</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Companies Table -->
    <div class="bg-white rounded-lg overflow-hidden border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">Companies</h2>
        <span class="text-sm font-medium text-gray-600">
          Total: <span class="font-bold text-gray-900">{{ companies.length }}</span>
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                UUID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(company, index) in companies"
              :key="company.id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 ">
                <div class="flex items-center">
                  <!-- <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span class="text-sm font-medium text-gray-700">{{
                        getCompanyInitials(company.name)
                      }}</span>
                    </div>
                  </div> -->
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ company.name }}
                    </div>
                    <div class="text-sm text-gray-500">{{ company.uiid }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getTypeClass(company.companytype)"
                >
                  {{ getCompanyTypeName(company.companytype) }}
                </span>
                <div
                  v-if="company.maincompanyid > 0"
                  class="text-xs text-gray-500 mt-1"
                >
                  Subsidiary
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div>{{ company.email || "N/A" }}</div>
                <div>{{ company.tel1 || company.tel2 || "N/A" }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div>{{ company.location || "N/A" }}</div>
                <div class="text-xs">{{ company.address1 || "" }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                {{ company.uiid }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                {{ company.id }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewCompany(company)"
                    class="text-blue-500 hover:text-blue-600 transition-colors duration-150 p-1 rounded"
                    title="View Details"
                  >
                    <EyeIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="editCompany(company)"
                    class="text-green-500 hover:text-green-600 transition-colors duration-150 p-1 rounded"
                    title="Edit Contact Info"
                  >
                    <PencilIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="companies.length === 0 && !loading"
        class="px-6 py-4 text-center text-gray-500"
      >
        No companies found.
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-md p-4 mb-6"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="w-6 h-6 text-red-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">{{ error }}</div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Company Modal -->
    <div
      v-if="showCreateModal || showEditModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeModals"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 rounded-lg bg-white border-gray-200"
        @click.stop
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
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
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                  placeholder="Unique identifier"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  v-model="companyForm.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  v-model="companyForm.email"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="company@email.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone 1</label>
                <input
                  v-model="companyForm.tel1"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0241234567"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone 2</label>
                <input
                  v-model="companyForm.tel2"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0201234567"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
                <select
                  v-model="companyForm.companytype"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="0">Pharmacy</option>
                  <option value="1">Hospital</option>
                  <option value="2">Clinic</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Address 1</label>
                <input
                  v-model="companyForm.address1"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Address 2</label>
                <input
                  v-model="companyForm.address2"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Additional address info"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  v-model="companyForm.location"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="City, Region"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                <input
                  v-model="companyForm.ddate"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Parent Company ID</label>
                <input
                  v-model="companyForm.maincompanyid"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0 for main company"
                />
              </div>
            </div>

            <!-- Edit Modal - Only Domain Name, WhatsApp Number, Logo, Shop Banner, and SMS Sender ID -->
            <div v-if="showEditModal" class="space-y-4">
              <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <InformationCircleIcon class="w-6 h-6 text-blue-400" />
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-blue-800">Update Company Contact & Branding Information</h3>
                    <div class="mt-2 text-sm text-blue-700">
                      You can update the domain name, WhatsApp number, SMS sender ID, logo, and shop banner for this company.
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Domain Name</label>
                  <input
                    v-model="companyForm.domain_name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="company-domain"
                  />
                  <p class="text-xs text-gray-500 mt-1">Unique domain identifier for the company</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    v-model="companyForm.whatsapp_number"
                    type="tel"
                    class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="+233501234567"
                  />
                  <p class="text-xs text-gray-500 mt-1">WhatsApp contact number with country code</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">SMS Sender ID</label>
                  <input
                    v-model="companyForm.sender_id"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g., RigelOS"
                    maxlength="11"
                  />
                  <p class="text-xs text-gray-500 mt-1">Custom SMS sender ID (max 11 chars). Leave empty to use default (RigelOS)</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    v-model="companyForm.logo"
                    type="url"
                    class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="https://example.com/logo.png"
                  />
                  <p class="text-xs text-gray-500 mt-1">URL to company logo image</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Shop Banner URL</label>
                  <input
                    v-model="companyForm.shop_banner"
                    type="url"
                    class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="https://example.com/banner.jpg"
                  />
                  <p class="text-xs text-gray-500 mt-1">URL to shop banner/header image</p>
                </div>
              </div>

              <!-- Toggle More Section -->
              <div class="border-t border-gray-200 pt-4">
                <button
                  @click="showMoreFields = !showMoreFields"
                  type="button"
                  class="flex items-center justify-between w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-150"
                >
                  <span class="text-sm font-medium text-gray-700">More Fields (Optional)</span>
                  <svg
                    :class="{ 'rotate-180': showMoreFields }"
                    class="w-5 h-5 text-gray-500 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div v-show="showMoreFields" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Alternate Company ID</label>
                    <input
                      v-model="companyForm.alternate_company_id"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Alternative identifier"
                    />
                    <p class="text-xs text-gray-500 mt-1">Secondary company identifier</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      v-model="companyForm.country"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g., Ghana"
                    />
                    <p class="text-xs text-gray-500 mt-1">Country name</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <input
                      v-model="companyForm.region"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g., Greater Accra"
                    />
                    <p class="text-xs text-gray-500 mt-1">Region or state</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      v-model="companyForm.location_detail"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g., Accra"
                    />
                    <p class="text-xs text-gray-500 mt-1">City or locality</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      v-model="companyForm.latitude"
                      type="number"
                      step="any"
                      class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g., 5.6037"
                    />
                    <p class="text-xs text-gray-500 mt-1">Geographic latitude coordinate</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      v-model="companyForm.longitude"
                      type="number"
                      step="any"
                      class="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g., -0.1870"
                    />
                    <p class="text-xs text-gray-500 mt-1">Geographic longitude coordinate</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModals"
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="modalLoading"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm font-medium transition-colors duration-150"
              >
                {{ modalLoading ? "Updating..." : showCreateModal ? "Create Company" : showEditModal ? "Update Contact Info" : "Update Company" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Company Modal -->
    <div
      v-if="showViewModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeModals"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 rounded-lg bg-white border-gray-200"
        @click.stop
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Company Details
          </h3>

          <div v-if="selectedCompany" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Company Name</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">UIID</label>
                <p class="mt-1 text-sm text-gray-900 font-mono">{{ selectedCompany.uiid }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Type</label>
                <p class="mt-1 text-sm text-gray-900">{{ getCompanyTypeName(selectedCompany.companytype) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.email || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Phone 1</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.tel1 || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Phone 2</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.tel2 || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Domain Name</label>
                <p class="mt-1 text-sm text-gray-900 font-mono">{{ selectedCompany.domain_name || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.whatsapp_number || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">SMS Sender ID</label>
                <p class="mt-1 text-sm text-gray-900 font-mono">{{ selectedCompany.sender_id || "Default (RigelOS)" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Logo</label>
                <div class="mt-1">
                  <p v-if="selectedCompany.logo" class="text-sm text-gray-900">
                    <a :href="selectedCompany.logo" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                      View Logo
                    </a>
                  </p>
                  <p v-else class="text-sm text-gray-900">N/A</p>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Shop Banner</label>
                <div class="mt-1">
                  <p v-if="selectedCompany.shop_banner" class="text-sm text-gray-900">
                    <a :href="selectedCompany.shop_banner" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                      View Banner
                    </a>
                  </p>
                  <p v-else class="text-sm text-gray-900">N/A</p>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Address 1</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.address1 || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Address 2</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.address2 || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Location</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.location || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Alternate Company ID</label>
                <p class="mt-1 text-sm text-gray-900 font-mono">{{ selectedCompany.alternate_company_id || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Country</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.country || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Region</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.region || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Location Detail</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.location_detail || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Coordinates</label>
                <p class="mt-1 text-sm text-gray-900">
                  {{ selectedCompany.latitude && selectedCompany.longitude 
                    ? `${selectedCompany.latitude}, ${selectedCompany.longitude}` 
                    : "N/A" }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Registration Date</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedCompany.ddate) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Parent Company ID</label>
                <p class="mt-1 text-sm text-gray-900">{{ selectedCompany.maincompanyid || "N/A" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Created</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedCompany.created_at) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Updated</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedCompany.updated_at) }}</p>
              </div>
            </div>

            <!-- Subsidiaries Section -->
            <div
              v-if="selectedCompany.maincompanyid === 0"
              class="mt-6 pt-4 border-t border-gray-200"
            >
              <h4 class="text-md font-medium text-gray-900 mb-2">
                Subsidiaries
              </h4>
              <button
                @click="viewSubsidiaries(selectedCompany)"
                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium transition-colors duration-150"
              >
                View Subsidiaries ({{ subsidiaryCount }})
              </button>
            </div>
          </div>

          <div class="flex justify-end pt-4">
            <button
              @click="closeModals"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium transition-colors duration-150"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAdminStore } from "~/stores/admin";
import { MagnifyingGlassIcon, ArrowPathIcon, InformationCircleIcon, EyeIcon, PencilIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const adminStore = useAdminStore();

// Reactive data
const companies = ref([]);
const loading = ref(false);
const error = ref(null);
const searchQuery = ref("");
const modalLoading = ref(false);
const subsidiaryCount = ref(0);

// Modal states
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showViewModal = ref(false);
const showMoreFields = ref(false);
const selectedCompany = ref(null);

// Company form
const companyForm = ref({
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
  latitude: "",
  longitude: "",
});

// Debounced search
let searchTimeout = null;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchCompanies();
  }, 500);
};

// Fetch companies
const fetchCompanies = async () => {
  loading.value = true;
  error.value = null;

  try {
    const config = useRuntimeConfig();
    const baseURL = config.public.apiBase;
    let endpoint = `${baseURL}/api/companies`;

    if (searchQuery.value) {
      endpoint = `${baseURL}/api/companies/search?q=${encodeURIComponent(
        searchQuery.value
      )}`;
    }

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      companies.value = data.data;
    } else {
      error.value = data.message || "Failed to fetch companies";
    }
  } catch (err) {
    error.value = err.message || "An error occurred while fetching companies";
    console.error("Companies fetch error:", err);
  } finally {
    loading.value = false;
  }
};

// Get company type name
const getCompanyTypeName = (type) => {
  const types = {
    0: "Pharmacy",
    1: "Hospital",
    2: "Clinic",
  };
  return types[type] || "Unknown";
};

// Get type class for styling
const getTypeClass = (type) => {
  const classes = {
    0: "bg-blue-100 text-blue-800",
    1: "bg-red-100 text-red-800",
    2: "bg-purple-100 text-purple-800",
  };
  return classes[type] || "bg-gray-100 text-gray-800";
};

// Get company initials
const getCompanyInitials = (name) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

// Create company
const createCompany = async () => {
  modalLoading.value = true;

  try {
    const config = useRuntimeConfig();
    const baseURL = config.public.apiBase;

    const response = await fetch(`${baseURL}/api/companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(companyForm.value),
    });

    const data = await response.json();

    if (data.success) {
      closeModals();
      fetchCompanies();
      // Reset form
      companyForm.value = {
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
        latitude: "",
        longitude: "",
      };
    } else {
      alert(data.message || "Failed to create company");
    }
  } catch (err) {
    console.error("Create company error:", err);
    alert("An error occurred while creating the company");
  } finally {
    modalLoading.value = false;
  }
};

// Edit company
const editCompany = (company) => {
  selectedCompany.value = company;
  // Only populate domain_name, whatsapp_number, sender_id, logo, and shop_banner for editing
  companyForm.value = {
    domain_name: company.domain_name || "",
    whatsapp_number: company.whatsapp_number || "",
    sender_id: company.sender_id || "",
    logo: company.logo || "",
    shop_banner: company.shop_banner || "",
    alternate_company_id: company.alternate_company_id || "",
    country: company.country || "",
    region: company.region || "",
    location_detail: company.location_detail || "",
    latitude: company.latitude || "",
    longitude: company.longitude || "",
  };
  showMoreFields.value = false;
  showEditModal.value = true;
};

// Update company
const updateCompany = async () => {
  if (!selectedCompany.value) return;

  modalLoading.value = true;

  try {
    const config = useRuntimeConfig();
    const baseURL = config.public.apiBase;

    // Send all editable fields including the "more fields"
    const updateData = {
      domain_name: companyForm.value.domain_name,
      whatsapp_number: companyForm.value.whatsapp_number,
      sender_id: companyForm.value.sender_id,
      logo: companyForm.value.logo,
      shop_banner: companyForm.value.shop_banner,
      alternate_company_id: companyForm.value.alternate_company_id,
      country: companyForm.value.country,
      region: companyForm.value.region,
      location_detail: companyForm.value.location_detail,
      latitude: companyForm.value.latitude ? parseFloat(companyForm.value.latitude) : null,
      longitude: companyForm.value.longitude ? parseFloat(companyForm.value.longitude) : null
    };

    const response = await fetch(`${baseURL}/api/companies/${selectedCompany.value.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (data.success) {
      closeModals();
      fetchCompanies();
    } else {
      alert(data.message || "Failed to update company");
    }
  } catch (err) {
    console.error("Update company error:", err);
    alert("An error occurred while updating the company");
  } finally {
    modalLoading.value = false;
  }
};

// View company
const viewCompany = (company) => {
  selectedCompany.value = company;
  showViewModal.value = true;
};

// View subsidiaries
const viewSubsidiaries = async (company) => {
  try {
    const config = useRuntimeConfig();
    const baseURL = config.public.apiBase;

    const response = await fetch(`${baseURL}/api/companies/${company.id}/subsidiaries`);
    const data = await response.json();

    if (data.success) {
      subsidiaryCount.value = data.count;
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
const deleteCompany = async (company) => {
  if (
    !confirm(
      `Are you sure you want to delete "${company.name}"? This action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    const config = useRuntimeConfig();
    const baseURL = config.public.apiBase;

    const response = await fetch(`${baseURL}/api/companies/${company.id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      fetchCompanies();
    } else {
      alert(data.message || "Failed to delete company");
    }
  } catch (err) {
    console.error("Delete company error:", err);
    alert("An error occurred while deleting the company");
  }
};

// Close modals
const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  showViewModal.value = false;
  showMoreFields.value = false;
  selectedCompany.value = null;
  companyForm.value = {
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
    latitude: "",
    longitude: "",
  };
};

// Refresh companies
const refreshCompanies = () => {
  searchQuery.value = "";
  fetchCompanies();
};

// Initialize
onMounted(() => {
  fetchCompanies();
});
</script>

<style scoped>
.companies-management {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  max-width: 1280px; /* max-w-7xl */
  margin: 0 auto;
}

.refresh-icon {
  width: 18px;
  height: 18px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
