<!-- pages/index.vue - Customer Order Request Page -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <!-- <Navbar /> -->

    <div class="container mx-auto px-4 pt-24 pb-12 max-w-5xl">

      <!-- Hero Section -->
      <div class="text-center mb-8">
        <h1 class="text-3xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight">
          Need Meds? Get Them Delivered, <span class="text-indigo-600">Fast.</span>
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Tell us what you need — we'll find it at the nearest pharmacy and arrange delivery to your door.
        </p>
      </div>

      <!-- Wallet Banner (if logged in) -->
      <div v-if="userStore.isLoggedIn"
        class="bg-white rounded-2xl shadow-sm border border-indigo-100 p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <i class="ri-wallet-3-line text-indigo-600 text-xl"></i>
          </div>
          <div>
            <p class="text-xs text-gray-500 font-medium">Wallet Balance</p>
            <p class="text-xl font-bold text-gray-900">GHS {{ walletBalance.toFixed(2) }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="showTopUpModal = true"
            class="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
            <i class="ri-add-line"></i> Top Up
          </button>
          <button @click="activeView = 'requests'"
            class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5">
            <i class="ri-file-list-3-line"></i> My Requests
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="flex gap-2 mb-6">
        <button @click="activeView = 'new'"
          class="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all"
          :class="activeView === 'new' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'">
          <i class="ri-add-circle-line"></i> New Request
        </button>
        <button v-if="userStore.isLoggedIn" @click="activeView = 'requests'; fetchMyRequests()"
          class="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all"
          :class="activeView === 'requests' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'">
          <i class="ri-history-line"></i> My Requests
          <span v-if="myRequests.length" class="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{{ myRequests.length
          }}</span>
        </button>
      </div>

      <!-- ============= NEW REQUEST VIEW ============= -->
      <div v-if="activeView === 'new'">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <!-- Step indicator -->
          <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4">
            <div class="flex items-center justify-center gap-3">
              <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  :class="currentStep === i ? 'bg-white text-indigo-600 scale-110' : currentStep > i ? 'bg-white/80 text-indigo-600' : 'bg-white/20 text-white/70'">
                  <i v-if="currentStep > i" class="ri-check-line"></i>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span v-if="i < steps.length - 1" class="hidden sm:inline text-sm text-white/50 font-medium">{{ step
                }}</span>
                <div v-if="i < steps.length - 1" class="w-6 sm:w-10 h-0.5 rounded-full"
                  :class="currentStep > i ? 'bg-white/80' : 'bg-white/20'"></div>
              </div>
            </div>
          </div>

          <div class="p-6 lg:p-8">
            <!-- STEP 0: Items List -->
            <div v-if="currentStep === 0">
              <h3 class="text-xl font-bold text-gray-900 mb-1">What do you need?</h3>
              <p class="text-sm text-gray-500 mb-5">Add each medicine or product you'd like us to find.</p>

              <!-- Items -->
              <div class="space-y-3 mb-4">
                <div v-for="(item, index) in requestItems" :key="index"
                  class="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 group relative">
                  <div
                    class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {{ index + 1 }}
                  </div>
                  <div class="flex-1 relative">
                    <input v-model="item.product_name" type="text" placeholder="e.g. Paracetamol 500mg"
                      class="w-full bg-transparent border-0 text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-0 focus:outline-none"
                      @input="onProductInput(item)" @focus="onProductInput(item)" @blur="closeDropdown(item)" />

                    <!-- Search Dropdown -->
                    <div v-if="item.showDropdown && (item.searchResults.length || item.loading)"
                      class="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
                      <div v-if="item.loading" class="p-3 text-xs text-gray-500 flex items-center gap-2">
                        <i class="ri-loader-4-line animate-spin"></i> Searching...
                      </div>
                      <template v-else>
                        <div v-for="res in item.searchResults" :key="res.id"
                          @mousedown.prevent="selectProduct(item, res)"
                          class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                          <div class="font-medium text-gray-900 text-sm">{{ res.product_description }}</div>
                          <div class="text-xs text-gray-500 mt-0.5">
                            {{ [res.strength, res.unit].filter(Boolean).join(' • ') }}
                          </div>
                        </div>
                        <div v-if="item.searchResults.length === 0 && item.product_name.length > 2"
                          class="p-3 text-xs text-gray-500 italic">
                          No matches found. Using custom entry.
                        </div>
                      </template>
                    </div>
                  </div>
                  <input v-model.number="item.quantity" type="number" min="1" placeholder="Qty"
                    class="w-16 text-center bg-white border border-gray-200 rounded-lg py-1.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  <button v-if="requestItems.length > 1" @click="removeItem(index)"
                    class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1">
                    <i class="ri-delete-bin-line text-lg"></i>
                  </button>
                </div>
              </div>

              <button @click="addItem"
                class="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <i class="ri-add-line text-lg"></i> Add Another Item
              </button>

              <!-- Prescription Upload -->
              <div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="ri-camera-line text-blue-600 text-xl"></i>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-gray-900 mb-1">Have a prescription?</p>
                    <p class="text-xs text-gray-600 mb-2">Upload a photo and we'll process the items for you</p>
                    <label
                      class="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
                      <i class="ri-upload-2-line"></i>
                      {{ prescriptionFile ? prescriptionFile.name : 'Choose Photo' }}
                      <input type="file" accept="image/*" @change="handlePrescription" class="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- STEP 1: Location & Delivery -->
            <div v-if="currentStep === 1">
              <h3 class="text-xl font-bold text-gray-900 mb-1">Delivery Details</h3>
              <p class="text-sm text-gray-500 mb-5">Tell us where to deliver your order.</p>

              <div class="space-y-4">
                <!-- Get Current Location -->
                <div>
                  <button @click="getLocation" :disabled="gettingLocation"
                    class="w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all"
                    :class="customerLat ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-indigo-300 bg-white'">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      :class="customerLat ? 'bg-green-100' : 'bg-gray-100'">
                      <i :class="customerLat ? 'ri-map-pin-fill text-green-600' : gettingLocation ? 'ri-loader-4-line text-gray-400 animate-spin' : 'ri-crosshair-2-line text-gray-500'"
                        class="text-xl"></i>
                    </div>
                    <div class="text-left flex-1">
                      <p class="text-sm font-semibold" :class="customerLat ? 'text-green-700' : 'text-gray-900'">{{
                        locationLabel }}</p>
                      <p class="text-xs" :class="customerLat ? 'text-green-600' : 'text-gray-500'">{{ locationSublabel
                      }}</p>
                    </div>
                    <span v-if="customerLat" class="text-green-500"><i
                        class="ri-checkbox-circle-fill text-2xl"></i></span>
                  </button>
                </div>

                <!-- Delivery Address -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Address</label>
                  <div class="relative">
                    <i class="ri-map-pin-line absolute left-3 top-3 text-gray-400"></i>
                    <textarea v-model="deliveryAddress" rows="2"
                      placeholder="e.g. Room 12, Kofi Mensah Hostel, University of Ghana, Legon"
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"></textarea>
                  </div>
                </div>

                <!-- Additional Notes -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Notes <span
                      class="text-gray-400 font-normal">(optional)</span></label>
                  <textarea v-model="customerNotes" rows="2"
                    placeholder="Any special instructions, e.g. brand preference, dosage form..."
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"></textarea>
                </div>
              </div>
            </div>

            <!-- STEP 2: Review & Submit -->
            <div v-if="currentStep === 2">
              <h3 class="text-xl font-bold text-gray-900 mb-1">Review Your Request</h3>
              <p class="text-sm text-gray-500 mb-5">Please confirm everything looks good.</p>

              <!-- Login Prompt -->
              <div v-if="!userStore.isLoggedIn"
                class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                <i class="ri-error-warning-line text-amber-500 text-xl mt-0.5"></i>
                <div>
                  <p class="text-sm font-semibold text-amber-800">Login required to submit</p>
                  <p class="text-xs text-amber-700 mt-0.5">You need to be logged in so we can track your order and
                    notify you.</p>
                </div>
              </div>

              <!-- Summary -->
              <div class="bg-gray-50 rounded-xl p-5 mb-5 space-y-4">
                <div>
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items ({{
                    requestItems.length }})</p>
                  <div class="space-y-1.5">
                    <div v-for="(item, i) in validItems" :key="i" class="flex items-center justify-between">
                      <span class="text-sm text-gray-800">{{ item.product_name }}</span>
                      <span class="text-sm text-gray-500">× {{ item.quantity }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="prescriptionFile" class="flex items-center gap-2 text-sm text-blue-600">
                  <i class="ri-attachment-2"></i> Prescription: {{ prescriptionFile.name }}
                </div>
                <div class="border-t border-gray-200 pt-3 space-y-1.5">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">📍 Location</span>
                    <span class="text-gray-800">{{ customerLat ? 'Set' : 'Not set' }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">🏠 Address</span>
                    <span class="text-gray-800 text-right max-w-[60%]">{{ deliveryAddress || 'Not provided' }}</span>
                  </div>
                </div>
              </div>

              <!-- Fee info -->
              <div class="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="ri-money-cny-circle-line text-indigo-600 text-xl"></i>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900">A small request fee may be deducted from your wallet
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">Prices will be shared with you before any payment is taken</p>
                </div>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
              <button v-if="currentStep > 0" @click="currentStep--"
                class="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <i class="ri-arrow-left-s-line text-lg"></i> Back
              </button>
              <div v-else></div>

              <button v-if="currentStep < 2" @click="nextStep" :disabled="!canProceed"
                class="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1.5 shadow-sm shadow-indigo-200">
                Continue <i class="ri-arrow-right-s-line text-lg"></i>
              </button>

              <button v-else @click="submitRequest" :disabled="!canSubmit || isSubmitting"
                class="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-2">
                <span v-if="isSubmitting" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  Submitting...
                </span>
                <span v-else>
                  <i class="ri-send-plane-fill"></i> Submit Request
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============= MY REQUESTS VIEW ============= -->
      <div v-if="activeView === 'requests'">
        <div v-if="loadingRequests" class="text-center py-16">
          <svg class="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <p class="text-gray-500 text-sm">Loading your requests...</p>
        </div>

        <div v-else-if="myRequests.length === 0" class="text-center py-16">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="ri-file-list-3-line text-3xl text-gray-400"></i>
          </div>
          <p class="text-gray-600 font-semibold mb-1">No requests yet</p>
          <p class="text-sm text-gray-400 mb-4">Submit your first order request to get started</p>
          <button @click="activeView = 'new'"
            class="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="ri-add-line"></i> New Request
          </button>
        </div>

        <div v-else class="space-y-4">
          <div v-for="req in myRequests" :key="req.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            @click="viewRequestDetail(req)">
            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="text-lg font-bold text-gray-900">#{{ req.request_number }}</p>
                  <p class="text-xs text-gray-400">{{ formatDate(req.created_at) }}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                  :class="statusClass(req.status)">
                  {{ formatStatus(req.status) }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span><i class="ri-capsule-line mr-1"></i>{{ req.item_count || '—' }} items</span>
                <span v-if="req.request_fee"><i class="ri-money-cny-circle-line mr-1"></i>GHS {{
                  parseFloat(req.request_fee).toFixed(2) }}</span>
                <span v-if="req.fulfillment_type"><i class="ri-truck-line mr-1"></i>{{ req.fulfillment_type }}</span>
              </div>
            </div>
            <!-- Progress bar -->
            <div class="h-1 bg-gray-100">
              <div class="h-full rounded-r-full transition-all duration-500" :class="statusBarColor(req.status)"
                :style="{ width: statusProgress(req.status) + '%' }">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============= REQUEST DETAIL MODAL ============= -->
      <div v-if="selectedRequest" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="selectedRequest = null">
        <div class="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
          <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Request #{{ selectedRequest.request_number }}</h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase"
                :class="statusClass(selectedRequest.status)">{{ formatStatus(selectedRequest.status) }}</span>
            </div>
            <button @click="selectedRequest = null" class="text-gray-400 hover:text-gray-600 p-1"><i
                class="ri-close-line text-2xl"></i></button>
          </div>

          <div class="px-6 py-5 space-y-5">
            <!-- Items -->
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
              <div class="space-y-2">
                <div v-for="item in selectedRequest.items" :key="item.id"
                  class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ item.product_name }}</p>
                    <p class="text-xs text-gray-400">Qty: {{ item.quantity }}</p>
                  </div>
                  <div class="text-right">
                    <p v-if="item.marked_up_price" class="text-sm font-bold text-gray-900">GHS {{
                      parseFloat(item.marked_up_price).toFixed(2) }}</p>
                    <p v-else class="text-xs text-gray-400 italic">Price pending</p>
                    <span class="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      :class="statusClass(item.item_status || 'pending')">
                      {{ item.item_status || 'pending' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Totals (if calculated) -->
            <div v-if="selectedRequest.estimated_total" class="bg-indigo-50 rounded-xl p-4">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">Items total</span>
                <span class="font-semibold">GHS {{ parseFloat(selectedRequest.items_total || 0).toFixed(2) }}</span>
              </div>
              <div v-if="selectedRequest.delivery_fee" class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">Delivery fee</span>
                <span class="font-semibold">GHS {{ parseFloat(selectedRequest.delivery_fee).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-base font-bold border-t border-indigo-200 pt-2 mt-2">
                <span>Estimated Total</span>
                <span class="text-indigo-600">GHS {{ parseFloat(selectedRequest.estimated_total).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Fulfillment Choice -->
            <div v-if="selectedRequest.status === 'awaiting_customer' || selectedRequest.status === 'items_sourced'">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Choose Fulfillment</p>
              <div class="grid grid-cols-2 gap-3">
                <button @click="chooseFulfillment(selectedRequest.id, 'delivery')"
                  class="p-4 rounded-xl border-2 text-center transition-all"
                  :class="selectedRequest.fulfillment_type === 'delivery' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'">
                  <i class="ri-truck-line text-2xl text-indigo-600 mb-1"></i>
                  <p class="text-sm font-semibold text-gray-900">Delivery</p>
                  <p class="text-xs text-gray-500">To your door</p>
                </button>
                <button @click="chooseFulfillment(selectedRequest.id, 'pickup')"
                  class="p-4 rounded-xl border-2 text-center transition-all"
                  :class="selectedRequest.fulfillment_type === 'pickup' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'">
                  <i class="ri-store-2-line text-2xl text-indigo-600 mb-1"></i>
                  <p class="text-sm font-semibold text-gray-900">Pickup</p>
                  <p class="text-xs text-gray-500">From pharmacy</p>
                </button>
              </div>
            </div>

            <!-- Info -->
            <div class="space-y-2 text-sm">
              <div v-if="selectedRequest.delivery_address" class="flex gap-2">
                <i class="ri-map-pin-line text-gray-400 mt-0.5"></i>
                <span class="text-gray-700">{{ selectedRequest.delivery_address }}</span>
              </div>
              <div v-if="selectedRequest.admin_notes" class="flex gap-2">
                <i class="ri-message-2-line text-gray-400 mt-0.5"></i>
                <span class="text-gray-700">{{ selectedRequest.admin_notes }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============= WALLET TOP-UP MODAL ============= -->
      <div v-if="showTopUpModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showTopUpModal = false">
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
            <h3 class="text-lg font-bold">Top Up Wallet</h3>
            <p class="text-sm text-white/80">Add funds via Paystack</p>
          </div>
          <div class="p-6">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Amount (GHS)</label>
            <input v-model.number="topUpAmount" type="number" min="1" step="0.01" placeholder="50.00"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-bold text-gray-900 text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2" />
            <div class="flex gap-2 mb-4">
              <button v-for="amt in [10, 20, 50, 100]" :key="amt" @click="topUpAmount = amt"
                class="flex-1 py-2 text-sm font-semibold rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                :class="topUpAmount === amt ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'text-gray-600'">
                {{ amt }}
              </button>
            </div>
            <div class="flex gap-3">
              <button @click="showTopUpModal = false"
                class="flex-1 py-2.5 border border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button @click="initiateTopUp" :disabled="!topUpAmount || topUpAmount <= 0"
                class="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-40">
                Pay GHS {{ (topUpAmount || 0).toFixed(2) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============= SUCCESS MODAL ============= -->
      <div v-if="showSuccess" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showSuccess = false">
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="ri-check-double-line text-3xl text-green-600"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Request Submitted! 🎉</h3>
          <p class="text-sm text-gray-600 mb-2">We'll find the best prices from nearby pharmacies and get back to you
            shortly.</p>
          <p v-if="submittedRequestNumber" class="text-sm text-gray-500 mb-5">Request #<strong
              class="text-indigo-600">{{
              submittedRequestNumber }}</strong></p>
          <button @click="showSuccess = false; activeView = 'requests'; fetchMyRequests()"
            class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm">
            View My Requests
          </button>
        </div>
      </div>

    </div>

    <!-- Toast -->
    <div v-if="toast" class="fixed bottom-6 right-6 z-50 animate-bounce-in">
      <div class="px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-lg flex items-center gap-2"
        :class="toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'">
        <i :class="toast.type === 'error' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'" class="text-lg"></i>
        {{ toast.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

// State
const activeView = ref('new')
const currentStep = ref(0)
const isSubmitting = ref(false)
const loadingRequests = ref(false)
const gettingLocation = ref(false)
const toast = ref(null)
const showTopUpModal = ref(false)
const showSuccess = ref(false)
const submittedRequestNumber = ref('')

const steps = ['Items', 'Delivery', 'Review']

// New Request State
const requestItems = ref([
  { product_name: '', quantity: 1, searchResults: [], loading: false, showDropdown: false }
])
const prescriptionFile = ref(null)
const customerLat = ref(null)
const customerLng = ref(null)
const deliveryAddress = ref('')
const customerNotes = ref('')
const walletBalance = ref(0)
const topUpAmount = ref(50)

// My Requests State
const myRequests = ref([])
const selectedRequest = ref(null)

// Computed
const validItems = computed(() => requestItems.value.filter(i => i.product_name.trim()))

const canProceed = computed(() => {
  if (currentStep.value === 0) return validItems.value.length > 0
  if (currentStep.value === 1) return customerLat.value && deliveryAddress.value.trim()
  return true
})

const canSubmit = computed(() => {
  return userStore.isLoggedIn && validItems.value.length > 0 && customerLat.value
})

const locationLabel = computed(() => {
  if (customerLat.value) return '📍 Location Set'
  if (gettingLocation.value) return 'Getting location...'
  return 'Use My Current Location'
})

const locationSublabel = computed(() => {
  if (customerLat.value) return `${customerLat.value.toFixed(4)}, ${customerLng.value.toFixed(4)}`
  return 'We need this to find nearby pharmacies'
})

// Methods
const newItem = () => ({
  product_name: '',
  quantity: 1,
  searchResults: [],
  loading: false,
  showDropdown: false
})
const addItem = () => requestItems.value.push(newItem())
const removeItem = (i) => requestItems.value.splice(i, 1)

// Search Logic
let debounceTimer = null
const onProductInput = (item) => {
  item.showDropdown = true
  if (!item.product_name || item.product_name.length < 2) {
    item.searchResults = []
    return
  }

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => searchProducts(item), 300)
}

const searchProducts = async (item) => {
  item.loading = true
  try {
    const res = await customerApiCall('GET', `/api/master-products?search=${encodeURIComponent(item.product_name)}&limit=5`)
    item.searchResults = res.data || []
  } catch (e) {
    // silent fail
  } finally {
    item.loading = false
  }
}

const selectProduct = (item, res) => {
  let name = res.product_description
  if (res.strength) name += ` ${res.strength}`
  item.product_name = name
  item.showDropdown = false
  // Optionally focus quantity input here if desired
}

const closeDropdown = (item) => {
  setTimeout(() => { item.showDropdown = false }, 200)
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < 2) currentStep.value++
}

const handlePrescription = (e) => {
  prescriptionFile.value = e.target.files[0] || null
}

const getLocation = () => {
  if (!navigator.geolocation) return showToast('Geolocation not supported', 'error')
  gettingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      customerLat.value = pos.coords.latitude
      customerLng.value = pos.coords.longitude
      gettingLocation.value = false
      showToast('Location set!')
    },
    (err) => {
      gettingLocation.value = false
      showToast('Could not get location. Please enable GPS.', 'error')
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}

// API helpers
const customerApiCall = async (method, url, data = null) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userStore.customerAuthToken}` }
  }
  if (data) opts.body = JSON.stringify(data)
  const response = await fetch(`${apiBase}${url}`, opts)
  const json = await response.json()
  if (!response.ok || !json.success) throw new Error(json.message || `API error ${response.status}`)
  return json
}

const fetchWalletBalance = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await customerApiCall('GET', '/api/wallet')
    walletBalance.value = parseFloat(res.data?.balance || 0)
  } catch (e) {
    // Wallet might not exist yet — that's ok
    walletBalance.value = 0
  }
}

const fetchMyRequests = async () => {
  if (!userStore.isLoggedIn) return
  loadingRequests.value = true
  try {
    const res = await customerApiCall('GET', '/api/order-requests/customer')
    myRequests.value = res.data || []
  } catch (e) {
    showToast('Failed to load requests', 'error')
  } finally {
    loadingRequests.value = false
  }
}

const viewRequestDetail = async (req) => {
  try {
    const res = await customerApiCall('GET', `/api/order-requests/customer/${req.id}`)
    selectedRequest.value = res.data
  } catch (e) {
    showToast('Failed to load request', 'error')
  }
}

const submitRequest = async () => {
  if (!canSubmit.value) return
  isSubmitting.value = true
  try {
    const payload = {
      items: validItems.value.map(i => ({ product_name: i.product_name.trim(), quantity: i.quantity || 1 })),
      customer_latitude: customerLat.value,
      customer_longitude: customerLng.value,
      delivery_address: deliveryAddress.value.trim(),
      customer_notes: customerNotes.value.trim(),
    }

    const res = await customerApiCall('POST', '/api/order-requests/customer', payload)
    submittedRequestNumber.value = res.data?.request_number || ''
    showSuccess.value = true

    // Reset form
    // Reset form
    requestItems.value = [newItem()]
    prescriptionFile.value = null
    deliveryAddress.value = ''
    customerNotes.value = ''
    currentStep.value = 0

    // Refresh wallet
    await fetchWalletBalance()
  } catch (e) {
    showToast(e.message || 'Failed to submit request', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const chooseFulfillment = async (requestId, type) => {
  try {
    await customerApiCall('PUT', `/api/order-requests/customer/${requestId}/fulfillment`, { fulfillment_type: type })
    selectedRequest.value.fulfillment_type = type
    showToast(`${type === 'delivery' ? 'Delivery' : 'Pickup'} selected!`)
  } catch (e) {
    showToast(e.message || 'Failed to update', 'error')
  }
}

const initiateTopUp = async () => {
  if (!topUpAmount.value || topUpAmount.value <= 0) return
  try {
    const res = await customerApiCall('POST', '/api/wallet/topup', { amount: topUpAmount.value })
    if (res.data?.authorization_url) {
      window.open(res.data.authorization_url, '_blank')
    }
    showTopUpModal.value = false
    showToast('Redirecting to payment...')
    // Poll for balance update after a delay
    setTimeout(fetchWalletBalance, 10000)
  } catch (e) {
    showToast(e.message || 'Failed to initiate payment', 'error')
  }
}

// Formatting
const formatStatus = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

const statusClass = (s) => {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    items_sourced: 'bg-purple-100 text-purple-700',
    awaiting_customer: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-cyan-100 text-cyan-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    sourced: 'bg-purple-100 text-purple-700',
    unavailable: 'bg-red-100 text-red-700',
  }
  return map[s] || 'bg-gray-100 text-gray-600'
}

const statusBarColor = (s) => {
  const map = { pending: 'bg-amber-400', processing: 'bg-blue-500', items_sourced: 'bg-purple-500', awaiting_customer: 'bg-orange-500', confirmed: 'bg-cyan-500', completed: 'bg-green-500', cancelled: 'bg-red-400' }
  return map[s] || 'bg-gray-300'
}

const statusProgress = (s) => {
  const map = { pending: 15, processing: 35, items_sourced: 55, awaiting_customer: 65, confirmed: 80, completed: 100, cancelled: 100 }
  return map[s] || 10
}

const showToast = (text, type = 'success') => {
  toast.value = { text, type }
  setTimeout(() => { toast.value = null }, 4000)
}

// Init
onMounted(async () => {
  await userStore.checkAuthState()
  if (userStore.isLoggedIn) {
    fetchWalletBalance()
    fetchMyRequests()
  }
})
</script>

<style scoped>
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  50% {
    transform: translateY(-4px) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.4s ease-out;
}
</style>