<template>
    <div class="order-requests">
        <!-- ====== NEW REQUEST FORM ====== -->
        <div v-if="isNewView" class="space-y-6 pb-28 lg:pb-0">

            <!-- Page Header -->
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h2 class="text-[1.8rem] font-black uppercase tracking-[-0.07em] text-[#4F217A] mt-0.5">New Request
                    </h2>
                    <p class="text-sm font-medium text-zinc-600 mt-1">A pharmacist will source and price your medicines.</p>
                </div>
                <div class="flex flex-col items-end gap-2 flex-shrink-0 mt-1">
                    <button @click="openWalletTab" type="button"
                        class="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors"
                        :class="canSearchProducts ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'">
                        <WalletIcon class="w-3.5 h-3.5" />
                        GHS {{ walletBalance.toFixed(2) }}
                    </button>
                </div>
            </div>

            <!-- Main content: form + desktop sidebar -->
            <div class="flex flex-col lg:flex-row gap-6 lg:items-start">
                <!-- Left column: form sections -->
                <div class="flex-1 min-w-0 space-y-4">
                <div class="relative space-y-4">

                    <!-- Add Medication (with inline triggers for prescription + notes) -->
                    <section class="bg-white rounded-2xl p-5">
                        <div class="flex items-center gap-3 mb-4">
                            <h3 class="font-black text-zinc-900 text-base tracking-tight">Add Medication</h3>
                        </div>
                        <div class="flex flex-col divide-y divide-zinc-100">
                            <div v-for="(item, index) in requestItems" :key="index" class="flex flex-col gap-3 py-4 first:pt-0">
                                <label :for="`request-medicine-${index}`" class="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">
                                    Medication {{ requestItems.length > 1 ? `#${index + 1}` : '' }}
                                </label>
                                <input v-model="item.product_name" type="text"
                                    :id="`request-medicine-${index}`"
                                    autocomplete="off"
                                    autocapitalize="words"
                                    inputmode="text"
                                    placeholder="Medicine name, brand, or strength"
                                    class="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 transition-colors" />

                                <div v-if="item.product_name.trim()" class="flex items-center gap-2">
                                    <select v-model="item.requested_unit"
                                        class="flex-1 h-10 bg-zinc-50 border border-zinc-200 rounded-xl px-3 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 cursor-pointer">
                                        <option value="">Unit</option>
                                        <option v-for="option in medicineUnitOptions" :key="option" :value="option">{{ option }}</option>
                                    </select>

                                    <div class="flex items-center h-10 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden">
                                        <button type="button"
                                            class="w-10 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 transition-colors"
                                            @click="decrementQty(item)" :disabled="Number(item.quantity || 1) <= 1">−</button>
                                        <input v-model.number="item.quantity" type="number" min="1" placeholder="1"
                                            class="w-10 h-full text-center text-sm font-black text-zinc-900 focus:outline-none border-x border-zinc-200 appearance-none bg-transparent p-0" />
                                        <button type="button"
                                            class="w-10 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                                            @click="incrementQty(item)">+</button>
                                    </div>

                                    <button v-if="requestItems.length > 1" @click="removeRequestItem(index)"
                                        class="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                                        type="button">
                                        <XMarkIcon class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <!-- Prescription -->
                        <div class="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                            <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prescription</span>
                            <div class="flex items-center gap-2">
                                <label class="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 cursor-pointer transition-colors" title="Take a photo">
                                    <CameraIcon class="w-4 h-4" />
                                    <input ref="prescriptionPicker" type="file" accept="image/*" multiple @change="onPrescriptionFilesSelected" class="hidden" />
                                </label>
                                <label class="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 cursor-pointer transition-colors" title="Upload file">
                                    <ArrowUpTrayIcon class="w-4 h-4" />
                                    <input type="file" accept="image/*" multiple @change="onPrescriptionFilesSelected" class="hidden" />
                                </label>
                            </div>
                        </div>

                        <div v-if="isUploading" class="mt-3 flex items-center gap-3">
                            <div class="flex-1 h-1.5 bg-[#4F217A]/10 rounded-full overflow-hidden">
                                <span class="block h-full bg-[#4F217A] transition-all duration-300"
                                    :style="{ width: `${uploadProgress}%` }"></span>
                            </div>
                            <span class="text-xs font-bold text-[#4F217A] tabular-nums">{{ Math.round(uploadProgress) }}%</span>
                        </div>

                        <!-- Notes -->
                        <div v-if="showNotesField" class="mt-4 pt-4 border-t border-zinc-100 flex items-start gap-2">
                            <textarea v-model="customerNotes" rows="2"
                                ref="notesTextarea"
                                id="request-notes"
                                inputmode="text"
                                autocapitalize="sentences"
                                placeholder="Notes — e.g. brand preference, dosage form..."
                                class="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 resize-none"></textarea>
                            <button v-if="!customerNotes.trim()" @click="dismissNotesField" type="button"
                                class="mt-1 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors flex-shrink-0">
                                <XMarkIcon class="w-4 h-4" />
                            </button>
                        </div>

                        <!-- Icon action row -->
                        <div class="mt-5 pt-4 border-t border-zinc-100 flex items-center gap-2">
                            <button @click="addItem" type="button" title="Add another medication"
                                class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#4F217A]/[0.07] text-[#4F217A] hover:bg-[#4F217A]/[0.14] transition-colors">
                                <PlusIcon class="w-5 h-5" />
                            </button>
                            <button v-if="!showNotesField" @click="openNotesField" type="button" title="Add a note"
                                class="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 transition-colors">
                                <ChatBubbleLeftEllipsisIcon class="w-5 h-5" />
                            </button>
                        </div>
                    </section>


                    <!-- Address & Location -->
                    <section class="bg-white rounded-2xl p-5">
                        <h3 class="font-black text-zinc-900 text-base tracking-tight mb-4">Your Address</h3>
                        <button @click="getLocation" :disabled="gettingLocation"
                            class="w-full flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3 mb-4 transition-all hover:bg-zinc-100 hover:border-zinc-300"
                            :class="{ 'bg-emerald-50/50 border-emerald-200': customerLat }">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 transition-colors"
                                :class="customerLat ? 'bg-emerald-500 text-white' : 'bg-white border border-zinc-200 text-zinc-500'">
                                <MapPinIconSolid v-if="customerLat" class="w-5 h-5" />
                                <ArrowPathIcon v-else-if="gettingLocation" class="w-5 h-5 animate-spin" />
                                <MapPinIcon v-else class="w-5 h-5" />
                            </div>
                            <div class="flex-1 text-left min-w-0">
                                <strong class="block text-sm font-bold text-zinc-900 truncate">{{ locationLabel }}</strong>
                                <span class="block text-[11px] font-semibold text-zinc-500 truncate mt-0.5">{{ locationSublabel }}</span>
                            </div>
                            <CheckCircleIconSolid v-if="customerLat" class="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        </button>
                        <div class="flex flex-col gap-2">
                            <div class="relative">
                                <div
                                    class="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm focus-within:border-[#4F217A]/40 focus-within:ring-2 focus-within:ring-[#4F217A]/10">
                                    <MagnifyingGlassIcon class="w-[18px] h-[18px] text-zinc-400" />
                                    <input v-model="deliveryAddressSearch" type="text"
                                        id="delivery-address-search"
                                        placeholder="Type an address or landmark"
                                        role="combobox"
                                        aria-autocomplete="list"
                                        aria-controls="delivery-address-suggestions"
                                        :aria-expanded="deliveryAddressSuggestions.length > 0"
                                        :aria-activedescendant="deliveryAddressActiveIndex >= 0 ? `delivery-address-option-${deliveryAddressActiveIndex}` : ''"
                                        autocomplete="street-address"
                                        inputmode="text"
                                        @keydown="onDeliveryAddressKeydown"
                                        class="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400" />
                                    <ArrowPathIcon v-if="deliveryAutocompleteLoading" class="w-[18px] h-[18px] text-zinc-400 animate-spin" />
                                </div>
                                <ul v-if="deliveryAddressSuggestions.length"
                                    id="delivery-address-suggestions"
                                    role="listbox"
                                    aria-label="Address suggestions"
                                    class="absolute left-0 right-0 top-[calc(100%+0.65rem)] z-20 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl max-h-60 overflow-y-auto overscroll-contain list-none m-0 p-0">
                                    <li v-for="(suggestion, index) in deliveryAddressSuggestions"
                                        :key="`${suggestion.display_name}-${index}`"
                                        :id="`delivery-address-option-${index}`"
                                        role="option"
                                        :aria-selected="deliveryAddressActiveIndex === index"
                                        class="border-b border-zinc-100 last:border-b-0 cursor-pointer transition-colors"
                                        :class="deliveryAddressActiveIndex === index ? 'bg-[#f7f1ff]' : 'hover:bg-zinc-50'"
                                        @click="applyDeliveryAddressSuggestion(suggestion)"
                                        @mouseenter="deliveryAddressActiveIndex = index">
                                        <div class="px-4 py-3.5">
                                            <p class="text-sm font-semibold text-zinc-900 line-clamp-2">{{
                                                suggestion.display_name }}</p>
                                            <p class="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
                                                {{ suggestion.type || 'Address' }}</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <textarea v-model="deliveryAddress" rows="2"
                                placeholder="e.g. Room 12, Kofi Mensah Hostel, University of Ghana, Legon"
                                autocomplete="street-address"
                                inputmode="text"
                                class="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 resize-none"></textarea>
                        </div>
                    </section>

                    <!-- Wallet gate overlay -->
                    <div v-if="!canSearchProducts"
                        class="absolute inset-0 z-10 rounded-2xl bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 px-6 text-center">
                        <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <WalletIcon class="w-6 h-6" />
                        </div>
                        <div>
                            <p class="font-black text-zinc-900 text-sm">Top up to continue</p>
                            <p class="text-xs text-zinc-500 mt-0.5">GHS {{ requestFee.toFixed(2) }} needed · Balance: GHS {{ (walletBalance ?? 0).toFixed(2) }}</p>
                        </div>
                        <button @click="openWalletTab" type="button"
                            class="bg-[#4F217A] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3d1861] transition-colors">
                            Top Up Wallet
                        </button>
                    </div>
                </div><!-- /wallet gate wrapper -->

                    <!-- Privacy note -->

                </div><!-- /left form column -->

                <!-- Right sidebar (desktop only) -->
                <div class="hidden lg:block w-72 flex-shrink-0 sticky top-6 space-y-4">
                    <div class="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
                        <h3 class="font-black text-zinc-900 text-base tracking-tight mb-4">Order Summary</h3>
                        <div class="space-y-2.5 text-sm mb-5">
                            <div class="flex items-center justify-between gap-3">
                                <span class="text-zinc-500">Medications</span>
                                <span class="font-semibold text-zinc-900">{{ validItems.length ? `${validItems.length}
                                    item${validItems.length !== 1 ? 's' : ''}` : (prescriptionFiles.length ?
                                    `${prescriptionFiles.length} Rx page${prescriptionFiles.length !== 1 ? 's' : ''}` :
                                    '—') }}</span>
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <span class="text-zinc-500">Fulfillment</span>
                                <span class="font-semibold text-zinc-900">Home Delivery</span>
                            </div>
                            <div class="flex items-center justify-between gap-3 border-t border-zinc-100 pt-2.5">
                                <span class="text-zinc-500">Charge</span>
                                <span class="font-black" :class="(firstRequestFree || isProfessional) ? 'text-emerald-600' : 'text-zinc-900'">
                                    {{ isProfessional ? 'Free (Pro)' : firstRequestFree ? 'Free' : `GHS ${requestFee.toFixed(2)}` }}
                                </span>
                            </div>
                            <div class="flex items-center justify-between gap-3 border-t border-zinc-100 pt-2.5">
                                <span class="text-zinc-500">Wallet Balance</span>
                                <span class="font-black tabular-nums"
                                    :class="canSearchProducts ? 'text-emerald-600' : 'text-amber-600'">GHS {{ walletBalance.toFixed(2) }}</span>
                            </div>
                        </div>
                        <p class="text-[11px] text-zinc-500 leading-snug mb-3">Pickup or delivery options shown at next step.</p>
                        <button @click="openPriorityGate" :disabled="!canSubmit || isSubmitting" type="button"
                            class="w-full bg-purple-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            <ArrowPathIcon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                            <template v-else>Send Request ›</template>
                        </button>
                        <p v-if="!canSubmit && !isSubmitting" class="text-[11px] text-zinc-400 text-center mt-2">
                            {{ !validItems.length && !prescriptionFiles.length ? 'Add a medication or prescription' : !customerLat ? 'Set your location' : !deliveryAddress.trim() ? 'Add your address' : !canSearchProducts ? `Top up your wallet to GHS ${requestFee.toFixed(2)} to send` : '' }}
                        </p>
                    </div>
                </div><!-- /right sidebar -->

            </div><!-- /main content row -->

            <!-- Mobile submit bar -->
            <div class="lg:hidden space-y-2">
                <div class="bg-white rounded-2xl border border-zinc-200 px-4 py-3 flex items-center gap-3">
                    <div class="flex-1 min-w-0">
                        <p class="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Charge</p>
                        <p class="text-lg font-black leading-tight" :class="(firstRequestFree || isProfessional) ? 'text-emerald-600' : 'text-zinc-900'">
                            {{ isProfessional ? 'Free (Pro)' : firstRequestFree ? 'Free' : `GHS ${requestFee.toFixed(2)}` }}
                        </p>
                        <p class="text-[11px] font-semibold mt-0.5"
                            :class="canSearchProducts ? 'text-emerald-600' : 'text-amber-600'">
                            Balance: GHS {{ walletBalance.toFixed(2) }}
                        </p>
                    </div>
                    <button @click="openPriorityGate" :disabled="!canSubmit || isSubmitting" type="button"
                        class="bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0">
                        <ArrowPathIcon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                        <template v-else>Send Request ›</template>
                    </button>
                </div>
            </div>
        </div>

        <!-- ====== REQUESTS LIST ====== -->
        <div v-if="isListView" class="w-full pb-12">
            <header class="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 mb-6">
                <div class="flex items-center gap-3">
                    <button @click="goToNewRequest"
                        class="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100/50 border border-zinc-200 hover:bg-zinc-100 transition-colors text-zinc-600 shadow-sm"
                        type="button">
                        <ChevronLeftIcon class="w-4 h-4" />
                    </button>
                    <div>
                        <h1 class="text-lg font-bold text-zinc-900 tracking-tight">My Requests</h1>
                    </div>
                </div>
            </header>

            <div class="px-5 max-w-5xl mx-auto">
                <!-- Active / Completed tabs -->
                <div class="mb-5 flex justify-start">
                    <div class="inline-flex gap-2 p-1 bg-white border border-zinc-200 rounded-lg shadow-sm">
                        <button class="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all"
                            :class="requestListTab === 'active' ? 'bg-zinc-100 text-[#4F217A] font-bold ring-1 ring-zinc-200' : 'text-zinc-500 font-semibold hover:text-zinc-700 hover:bg-zinc-50'"
                            @click="requestListTab = 'active'">
                            Active
                            <span v-if="activeRequests.length"
                                class="inline-flex items-center justify-center px-1.5 min-w-[20px] h-5 rounded-full text-[10px] font-black tabular-nums"
                                :class="requestListTab === 'active' ? 'bg-[#f3e8ff] text-[#7e22ce]' : 'bg-zinc-200 text-zinc-600'">{{
                                activeRequests.length }}</span>
                        </button>
                        <button class="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all"
                            :class="requestListTab === 'completed' ? 'bg-zinc-100 text-[#4F217A] font-bold ring-1 ring-zinc-200' : 'text-zinc-500 font-semibold hover:text-zinc-700 hover:bg-zinc-50'"
                            @click="requestListTab = 'completed'">
                            Completed
                            <span v-if="completedRequests.length"
                                class="inline-flex items-center justify-center px-1.5 min-w-[20px] h-5 rounded-full text-[10px] font-black tabular-nums"
                                :class="requestListTab === 'completed' ? 'bg-[#f3e8ff] text-[#7e22ce]' : 'bg-zinc-200 text-zinc-600'">{{
                                completedRequests.length }}</span>
                        </button>
                    </div>
                </div>

                <div v-if="loadingRequests"
                    class="flex flex-col items-center justify-center py-16 border border-zinc-200 bg-zinc-50 rounded-xl">
                    <ArrowPathIcon class="w-8 h-8 text-zinc-400 animate-spin mb-3" />
                    <p class="text-sm font-medium text-zinc-500">Loading requests...</p>
                </div>

                <div v-else-if="myRequests.length === 0"
                    class="flex flex-col items-center justify-center py-16 border border-zinc-200 bg-white rounded-xl shadow-sm">
                    <div
                        class="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-zinc-100">
                        <InboxIcon class="w-7 h-7 text-zinc-300" />
                    </div>
                    <p class="text-base font-bold text-zinc-900 mb-1">No requests yet</p>
                    <p class="text-sm font-medium text-zinc-500 mb-6">Submit your first order request to get started</p>
                    <button @click="goToNewRequest"
                        class="px-5 py-2.5 bg-[#4F217A] text-white rounded-xl font-bold text-sm hover:bg-[#3d1861] transition-colors inline-flex items-center gap-2 shadow-sm">
                        <PlusIcon class="w-4 h-4" /> Create request
                    </button>
                </div>

                <div v-else class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-6">
                    <!-- Request List Items -->
                    <div class="space-y-0 text-sm">
                        <article v-for="req in filteredRequests" :key="req.id"
                            class="flex items-center justify-between px-5 py-4 border-b last:border-b-0 border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer group"
                            @click="viewDetail(req)">
                            <div class="flex items-center gap-4 min-w-0">
                                <!-- Colored Icon Box based on status -->
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
                                    :class="req.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (req.status === 'processing' || req.status === 'composed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100')">
                                    <component :is="req.status === 'completed' ? CheckCircleIcon : BeakerIcon" class="w-5 h-5" />
                                </div>
                                <div class="min-w-0">
                                    <div class="flex items-center gap-2 mb-0.5">
                                        <h4 class="text-sm font-bold text-zinc-900 uppercase tracking-tight">#{{
                                            req.request_number }}</h4>
                                    </div>
                                    <p class="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                                        <span>{{ formatDate(req.created_at) }}</span>
                                        <span class="w-1 h-1 rounded-full bg-zinc-300"></span>
                                        <span>{{ req.item_count || 0 }} item(s)</span>
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center ml-auto gap-3 sm:gap-6">
                                <!-- Status Column (Middle) -->
                                <div class="hidden sm:flex items-center justify-end flex-shrink-0 min-w-[130px]">
                                    <span
                                        class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm"
                                        :style="req.status === 'pending' ? 'background: #fffbeb; color: #d97706; border-color: #fcd34d;' : req.status === 'processing' ? 'background: #eff6ff; color: #2563eb; border-color: #bfdbfe;' : req.status === 'completed' ? 'background: #ecfdf5; color: #059669; border-color: #a7f3d0;' : req.status === 'composed' ? 'background: #f5f3ff; color: #9333ea; border-color: #d8b4fe;' : 'background: #f3f4f6; color: #374151; border-color: #e5e7eb;'">
                                        <span v-if="req.status === 'pending' || req.status === 'searching'"
                                            class="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5"></span>
                                        {{ formatStatus(getRequestStatus(req)) }}
                                    </span>
                                </div>

                                <!-- Cost Column (Right) -->
                                <div
                                    class="text-right flex flex-col items-end flex-shrink-0 min-w-[90px] sm:min-w-[100px]">
                                    <template
                                        v-if="(req.total_cost && parseFloat(String(req.total_cost)) > 0) || (req.estimated_total && parseFloat(String(req.estimated_total)) > 0)">
                                        <strong
                                            class="text-[15px] font-black text-zinc-900 tabular-nums tracking-tight">GHS
                                            {{ parseFloat(String(req.total_cost ?? req.estimated_total ?? 0)).toFixed(2) }}</strong>
                                    </template>
                                    <span v-else class="text-sm font-semibold text-zinc-400 italic">To be priced</span>

                                    <!-- Mobile Badge Fallback -->
                                    <span
                                        class="sm:hidden inline-flex mt-1.5 items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
                                        :style="req.status === 'pending' ? 'background: #fffbeb; color: #d97706; border-color: #fcd34d;' : req.status === 'processing' ? 'background: #eff6ff; color: #2563eb; border-color: #bfdbfe;' : req.status === 'completed' ? 'background: #ecfdf5; color: #059669; border-color: #a7f3d0;' : req.status === 'composed' ? 'background: #f5f3ff; color: #9333ea; border-color: #d8b4fe;' : 'background: #f3f4f6; color: #374151; border-color: #e5e7eb;'">
                                        <span v-if="req.status === 'pending' || req.status === 'searching'"
                                            class="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1"></span>
                                        {{ formatStatus(getRequestStatus(req)) }}
                                    </span>
                                </div>
                            </div>
                            <!-- Hover Chevron -->
                            <div
                                class="ml-2 hidden sm:flex w-5 h-5 items-center justify-center text-zinc-300 group-hover:text-[#4F217A] transition-colors flex-shrink-0">
                                <ChevronRightIcon class="w-5 h-5" />
                            </div>
                        </article>
                    </div>
                </div>
                <!-- End of max-w-5xl container -->
            </div>
        </div>

        <!-- ====== REQUEST DETAIL MODAL ====== -->
        <div v-if="selectedRequest" class="modal-overlay" @click.self="selectedRequest = null">
            <div class="modal-content">
                <div class="modal-header modal-header--concierge">
                    <div>
                        <h3>Request #{{ selectedRequest.request_number }}</h3>
                        <span class="status-badge" :class="getRequestStatus(selectedRequest)">{{
                            formatStatus(getRequestStatus(selectedRequest))
                        }}</span>
                    </div>
                    <button @click="selectedRequest = null" class="modal-close">
                        <XMarkIcon class="close-svg" />
                    </button>
                </div>

                <div class="modal-body">
                    <div v-if="selectedRequest.prescription_images?.length" class="detail-section">
                        <span class="detail-label">Prescription Images</span>
                        <div class="detail-prescription-grid">
                            <a v-for="(imageUrl, imageIndex) in selectedRequest.prescription_images"
                                :key="`prescription-${imageIndex}`" :href="imageUrl" target="_blank"
                                rel="noopener noreferrer" class="detail-prescription-link">
                                <img :src="imageUrl" :alt="`Prescription image ${imageIndex + 1}`"
                                    class="detail-prescription-image" />
                            </a>
                        </div>
                    </div>

                    <!-- Items -->
                    <div v-if="selectedRequest.items?.length" class="detail-section">
                        <span class="detail-label">Items</span>
                        <div v-for="(item, itemIdx) in selectedRequest.items" :key="item.id ?? itemIdx" class="detail-item">
                            <div>
                                <strong>{{ item.product_name }}</strong>
                                <span class="item-qty">Qty: {{ item.quantity }}</span>
                                <div v-if="item.item_images?.length" class="detail-item-images">
                                    <a v-for="(imageUrl, imageIndex) in item.item_images"
                                        :key="`${item.id}-img-${imageIndex}`" :href="imageUrl" target="_blank"
                                        rel="noopener noreferrer" class="detail-item-image-link">
                                        <img :src="imageUrl" :alt="`${item.product_name} photo ${imageIndex + 1}`"
                                            class="detail-item-image" />
                                    </a>
                                </div>
                            </div>
                            <div class="item-price-info">
                                <span v-if="item.marked_up_price" class="item-price">GHS {{
                                    parseFloat(String(item.marked_up_price)).toFixed(2) }}</span>
                                <span v-else class="price-pending">Price pending</span>
                                <span class="status-badge sm" :class="item.item_status || 'pending'">{{ item.item_status
                                    ||
                                    'pending' }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Rider contact (shown when delivery is active and rider is assigned) -->
                    <div v-if="selectedRequest.rider_phone" class="rider-contact-card">
                        <span class="detail-label">Your Rider</span>
                        <p v-if="selectedRequest.rider_name" class="rider-name">{{ selectedRequest.rider_name }}</p>
                        <a :href="`https://wa.me/${riderWhatsAppNumber(selectedRequest.rider_phone)}`" target="_blank" rel="noopener noreferrer" class="rider-whatsapp-btn">
                            <ChatBubbleLeftEllipsisIcon class="w-4 h-4" />
                            Message on WhatsApp
                        </a>
                    </div>

                    <!-- Pickup location (revealed after payment for pickup orders) -->
                    <div v-if="selectedRequest.fulfillment_type === 'pickup' && selectedRequest.pharmacy?.name" class="rider-contact-card">
                        <span class="detail-label">Pickup Location</span>
                        <p class="rider-name">{{ selectedRequest.pharmacy.name }}</p>
                        <p v-if="selectedRequest.pharmacy.address" class="text-sm text-zinc-500 mt-0.5">{{ selectedRequest.pharmacy.address }}</p>
                        <a v-if="selectedRequest.pharmacy.phone" :href="`tel:${selectedRequest.pharmacy.phone}`" class="rider-whatsapp-btn mt-2">
                            <PhoneIcon class="w-4 h-4" />
                            Call pharmacy
                        </a>
                    </div>

                    <!-- Totals (hidden while pickup vs delivery is still being chosen — the
                         comparison cards below carry per-method totals) -->
                    <div v-if="selectedRequest.estimated_total && !requiresMethodSelection(selectedRequest)" class="totals-box">
                        <div class="total-row"><span>Items total</span><span>GHS {{
                            parseFloat(String(selectedRequest.items_total ?? 0)).toFixed(2) }}</span></div>
                        <div v-if="selectedRequest.fulfillment_type === 'delivery' && selectedRequest.delivery_fee" class="total-row"><span>Delivery fee</span><span>GHS {{
                            parseFloat(String(selectedRequest.delivery_fee)).toFixed(2) }}</span></div>
                        <div class="total-row grand"><span>Estimated Total</span><span>GHS {{
                            parseFloat(String(selectedRequest.estimated_total)).toFixed(2) }}</span></div>
                    </div>

                    <div v-if="canLeaveFeedback(selectedRequest)" class="feedback-card">
                        <div class="feedback-head">
                            <div>
                                <span class="detail-label">Your Feedback</span>
                                <p class="feedback-copy">
                                    {{ selectedRequest.fulfillment_type === 'pickup' ? 'How was your pickup experience?' : 'How was your delivery experience?' }}
                                </p>
                            </div>
                            <span v-if="selectedRequest.feedback?.created_at" class="feedback-date">
                                {{ formatDate(selectedRequest.feedback?.created_at) }}
                            </span>
                        </div>

                        <!-- Delivery categories: Product · Delivery quality · Overall -->
                        <template v-if="selectedRequest.fulfillment_type === 'delivery'">
                            <div class="feedback-category">
                                <span class="feedback-category-label">Product quality</span>
                                <div class="feedback-stars" role="radiogroup" aria-label="Product quality rating">
                                    <button v-for="star in 5" :key="`prod-star-${star}`" type="button"
                                        class="feedback-star-btn" :class="{ active: star <= feedbackForm.rating_product }"
                                        @click="feedbackForm.rating_product = star">
                                        <StarIcon class="feedback-star-icon" />
                                        <span class="sr-only">{{ star }} star{{ star > 1 ? 's' : '' }}</span>
                                    </button>
                                </div>
                            </div>
                            <div class="feedback-category">
                                <span class="feedback-category-label">Delivery quality</span>
                                <div class="feedback-stars" role="radiogroup" aria-label="Delivery quality rating">
                                    <button v-for="star in 5" :key="`del-star-${star}`" type="button"
                                        class="feedback-star-btn" :class="{ active: star <= feedbackForm.rating_delivery }"
                                        @click="feedbackForm.rating_delivery = star">
                                        <StarIcon class="feedback-star-icon" />
                                        <span class="sr-only">{{ star }} star{{ star > 1 ? 's' : '' }}</span>
                                    </button>
                                </div>
                            </div>
                            <div class="feedback-category">
                                <span class="feedback-category-label">Overall</span>
                                <div class="feedback-stars" role="radiogroup" aria-label="Overall rating">
                                    <button v-for="star in 5" :key="`overall-star-${star}`" type="button"
                                        class="feedback-star-btn" :class="{ active: star <= feedbackForm.rating_overall }"
                                        @click="feedbackForm.rating_overall = star">
                                        <StarIcon class="feedback-star-icon" />
                                        <span class="sr-only">{{ star }} star{{ star > 1 ? 's' : '' }}</span>
                                    </button>
                                </div>
                            </div>
                        </template>

                        <!-- Pickup categories: Product · Customer Service -->
                        <template v-else>
                            <div class="feedback-category">
                                <span class="feedback-category-label">Product quality</span>
                                <div class="feedback-stars" role="radiogroup" aria-label="Product quality rating">
                                    <button v-for="star in 5" :key="`prod-star-${star}`" type="button"
                                        class="feedback-star-btn" :class="{ active: star <= feedbackForm.rating_product }"
                                        @click="feedbackForm.rating_product = star">
                                        <StarIcon class="feedback-star-icon" />
                                        <span class="sr-only">{{ star }} star{{ star > 1 ? 's' : '' }}</span>
                                    </button>
                                </div>
                            </div>
                            <div class="feedback-category">
                                <span class="feedback-category-label">Customer Service</span>
                                <div class="feedback-stars" role="radiogroup" aria-label="Customer service rating">
                                    <button v-for="star in 5" :key="`svc-star-${star}`" type="button"
                                        class="feedback-star-btn" :class="{ active: star <= feedbackForm.rating_service }"
                                        @click="feedbackForm.rating_service = star">
                                        <StarIcon class="feedback-star-icon" />
                                        <span class="sr-only">{{ star }} star{{ star > 1 ? 's' : '' }}</span>
                                    </button>
                                </div>
                            </div>
                        </template>

                        <textarea v-model="feedbackForm.notes" rows="3" maxlength="2000"
                            class="form-textarea feedback-textarea"
                            placeholder="Optional: tell us what worked well or what felt difficult."></textarea>

                        <div class="feedback-actions">
                            <button type="button" class="nav-submit feedback-submit-btn" :disabled="savingFeedback"
                                @click="submitFeedback">
                                <ArrowPathIcon v-if="savingFeedback" class="nav-svg spin" />
                                <span>{{ savingFeedback ? 'Saving...' : (selectedRequest.feedback ? 'Update Feedback' : 'Submit Feedback') }}</span>
                            </button>
                        </div>
                    </div>

                    <div v-if="selectedRequest.pending_decisions?.length" class="decision-panel">
                        <span class="detail-label">Customer Decision</span>
                        <div v-for="(decision, decIdx) in selectedRequest.pending_decisions" :key="decision.id ?? decIdx"
                            class="decision-card">
                            <span class="decision-eyebrow" :class="getDecisionVariantClass(decision)">{{
                                getDecisionEyebrow(decision) }}</span>
                            <div class="decision-copy">
                                <strong>{{ decision.title }}</strong>
                                <p>{{ decision.message }}</p>
                            </div>
                            <p v-if="getDecisionConciseSummary(decision)" class="decision-flow-headline">
                                {{ getDecisionConciseSummary(decision) }}
                            </p>

                            <div v-if="getDecisionItems(decision).length" class="decision-item-list">
                                <div v-for="decisionItem in getDecisionItems(decision)"
                                    :key="`${decision.id}-${decisionItem.item_id}`" class="decision-item-row">
                                    <div class="decision-item-copy">
                                        <strong>{{ decisionItem.product_name }}</strong>
                                        <span class="decision-item-meta">Qty: {{ decisionItem.quantity }}</span>
                                        <span v-if="shouldShowDecisionItemPrice(decisionItem)"
                                            class="decision-item-meta">
                                            GHS {{ formatMoney(decisionItem.unit_price) }} each
                                        </span>
                                        <span v-if="getDecisionItemRouteText(decision, decisionItem)"
                                            class="decision-item-meta source">
                                            {{ getDecisionItemRouteText(decision, decisionItem) }}
                                        </span>
                                        <span v-if="decisionItem.status === 'unavailable'"
                                            class="decision-item-meta unavailable">
                                            Unavailable right now
                                        </span>
                                        <div v-if="decisionItem.substitute_option" class="decision-substitute">
                                            <span class="decision-item-meta substitute-label">Suggested
                                                alternative</span>
                                            <strong>{{ decisionItem.substitute_option.name }}</strong>
                                            <span v-if="decisionItem.substitute_option.marked_up_price !== null"
                                                class="decision-item-meta">
                                                GHS {{ formatMoney(decisionItem.substitute_option.marked_up_price) }}
                                                each
                                            </span>
                                            <span v-if="getDecisionSubstituteRouteText(decision, decisionItem)"
                                                class="decision-item-meta source">
                                                {{ getDecisionSubstituteRouteText(decision, decisionItem) }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="decision-item-actions">
                                        <button v-for="choice in getDecisionItemChoices(decisionItem)"
                                            :key="`${decision.id}-${decisionItem.item_id}-${choice.value}`"
                                            type="button" class="decision-item-btn"
                                            :class="{ active: getDecisionChoice(decision, decisionItem) === choice.value }"
                                            @click="setDecisionChoice(decision, decisionItem, choice.value)">
                                            {{ choice.label }}
                                        </button>
                                    </div>
                                </div>
                                <div class="decision-preview-total">
                                    <span>Updated total</span>
                                    <strong>GHS {{ formatMoney(getDecisionPreviewTotal(decision)) }}</strong>
                                </div>
                            </div>
                            <div class="decision-actions">
                                <button class="decision-btn secondary" :disabled="respondingDecisionId === decision.id"
                                    @click="respondToDecision(decision, 'declined')">
                                    {{ getDecisionDeclineLabel(decision) }}
                                </button>
                                <button class="decision-btn primary" :disabled="respondingDecisionId === decision.id"
                                    @click="respondToDecision(decision, 'approved')">
                                    {{ respondingDecisionId === decision.id ? 'Saving...' :
                                    getDecisionApproveLabel(decision) }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="canPayRequest(selectedRequest) && !selectedRequest.pending_decisions?.length"
                        class="payment-action">
                        <!-- Pickup vs delivery comparison (flag-gated) -->
                        <div v-if="requiresMethodSelection(selectedRequest)" class="fulfillment-picker">
                            <div class="fulfillment-picker-header">
                                <h4>How would you like to receive your order?</h4>
                                <p>Compare pickup and delivery before paying.</p>
                            </div>

                            <div v-if="paymentOptionsLoading[selectedRequest.id]" class="fulfillment-picker-loading">
                                <ArrowPathIcon class="pay-svg spin" />
                                <span>Loading options…</span>
                            </div>

                            <div v-else-if="selectedPaymentOptions" class="fulfillment-options">
                                <!-- Pickup card -->
                                <button
                                    type="button"
                                    class="fulfillment-option"
                                    :class="{
                                        'fulfillment-option--selected': selectedPaymentMethodByRequest[selectedRequest.id] === 'pickup',
                                        'fulfillment-option--disabled': !selectedPaymentOptions?.pickup?.available
                                    }"
                                    :disabled="!selectedPaymentOptions?.pickup?.available"
                                    @click="choosePaymentMethod(selectedRequest.id, 'pickup')"
                                >
                                    <div class="fulfillment-option-row">
                                        <div class="fulfillment-option-icon fulfillment-option-icon--pickup" aria-hidden="true">
                                            <BuildingStorefrontIcon />
                                        </div>
                                        <div class="fulfillment-option-body">
                                            <div class="fulfillment-option-head">
                                                <span class="fulfillment-option-title">Pickup</span>
                                                <span class="fulfillment-option-price">
                                                    <template v-if="selectedPaymentOptions?.pickup?.available">
                                                        GHS {{ Number(selectedPaymentOptions?.pickup?.total ?? 0).toFixed(2) }}
                                                    </template>
                                                    <template v-else>—</template>
                                                </span>
                                            </div>
                                            <div v-if="selectedPaymentOptions?.pickup?.available && selectedPaymentOptions?.pickup?.pharmacy" class="fulfillment-option-meta">
                                                <span v-if="selectedPaymentOptions?.pickup?.pharmacy?.distance_km != null">{{ selectedPaymentOptions?.pickup?.pharmacy?.distance_km }} km away</span>
                                                <span v-if="selectedPaymentOptions?.pickup?.pharmacy?.is_24_hours">
                                                    · Open 24 hours
                                                </span>
                                                <span v-else-if="selectedPaymentOptions?.pickup?.pharmacy?.closes_at">
                                                    · Open until {{ selectedPaymentOptions?.pickup?.pharmacy?.closes_at }}
                                                </span>
                                                <span class="fulfillment-option-meta--muted"> · Pharmacy shown after payment</span>
                                            </div>
                                            <div v-else-if="selectedPaymentOptions?.pickup?.unavailable_reason" class="fulfillment-option-meta fulfillment-option-meta--muted">
                                                {{ formatPickupReason(selectedPaymentOptions?.pickup?.unavailable_reason) }}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                <!-- Delivery card -->
                                <button
                                    type="button"
                                    class="fulfillment-option"
                                    :class="{ 'fulfillment-option--selected': selectedPaymentMethodByRequest[selectedRequest.id] === 'delivery' }"
                                    @click="choosePaymentMethod(selectedRequest.id, 'delivery')"
                                >
                                    <div class="fulfillment-option-row">
                                        <div class="fulfillment-option-icon fulfillment-option-icon--delivery" aria-hidden="true">
                                            <TruckIcon />
                                        </div>
                                        <div class="fulfillment-option-body">
                                            <div class="fulfillment-option-head">
                                                <span class="fulfillment-option-title">Delivery</span>
                                                <span class="fulfillment-option-price">
                                                    GHS {{ Number(selectedPaymentOptions?.delivery?.total ?? 0).toFixed(2) }}
                                                </span>
                                            </div>
                                            <div class="fulfillment-option-meta">
                                                <span>Delivery fee GHS {{ Number(selectedPaymentOptions?.delivery?.fee ?? 0).toFixed(2) }}</span>
                                                <span v-if="selectedPaymentOptions?.delivery?.distance_km != null">
                                                    · {{ selectedPaymentOptions?.delivery?.distance_km }} km
                                                </span>
                                                <span v-if="selectedPaymentOptions?.delivery?.eta_minutes">
                                                    · ~{{ selectedPaymentOptions?.delivery?.eta_minutes }} min
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- Fee credit toggle: shown when the request fee can be applied or returned -->
                        <div v-if="selectedPaymentOptions?.fee_applicable" class="fee-credit-picker">
                            <div class="fee-credit-header">
                                <span class="fee-credit-label">GHS {{ parseFloat(String(selectedPaymentOptions?.request_fee ?? 0)).toFixed(2) }} search fee</span>
                                <span class="fee-credit-sub">How would you like to use it?</span>
                            </div>
                            <div class="fee-credit-options">
                                <button
                                    type="button"
                                    class="fee-credit-option"
                                    :class="{ 'fee-credit-option--selected': applyFeeByRequest[selectedRequest.id] !== false }"
                                    @click="setApplyFee(selectedRequest.id, true)"
                                >
                                    <span class="fee-credit-option-title">Apply to this order</span>
                                    <span class="fee-credit-option-sub">Pay less now</span>
                                </button>
                                <button
                                    type="button"
                                    class="fee-credit-option"
                                    :class="{ 'fee-credit-option--selected': applyFeeByRequest[selectedRequest.id] === false }"
                                    @click="setApplyFee(selectedRequest.id, false)"
                                >
                                    <span class="fee-credit-option-title">Return to wallet</span>
                                    <span class="fee-credit-option-sub">Save for a future request</span>
                                </button>
                            </div>
                        </div>

                        <!-- Live total row — shown whenever a total is computable -->
                        <div v-if="selectedMethodTotal != null" class="payment-total-row">
                            <span>Total</span>
                            <span class="payment-total-amount">GHS {{ selectedMethodTotal.toFixed(2) }}</span>
                        </div>

                        <div class="payment-method-grid">
                            <button @click="payForRequest(selectedRequest.id, 'wallet')"
                                :class="['pay-request-btn', walletBalance >= (selectedMethodTotal ?? 0) ? '' : 'secondary-pay-btn']"
                                :disabled="payingRequest || !canPayWithSelection(selectedRequest)">
                                <ArrowPathIcon v-if="payingRequest && payingMethod === 'wallet'" class="pay-svg spin" />
                                <CurrencyDollarIcon v-else class="pay-svg" />
                                <span>
                                    {{ payingRequest && payingMethod === 'wallet'
                                        ? 'Processing wallet payment...'
                                        : selectedMethodTotal != null
                                            ? `Pay with Wallet · GHS ${selectedMethodTotal.toFixed(2)}`
                                            : 'Pay with Wallet' }}
                                </span>
                            </button>
                            <button @click="payForRequest(selectedRequest.id, 'paystack')"
                                :class="['pay-request-btn', walletBalance >= (selectedMethodTotal ?? 0) ? 'secondary-pay-btn' : '']"
                                :disabled="payingRequest || !canPayWithSelection(selectedRequest)">
                                <ArrowPathIcon v-if="payingRequest && payingMethod === 'paystack'"
                                    class="pay-svg spin" />
                                <CreditCardIcon v-else class="pay-svg" />
                                <span>
                                    {{ payingRequest && payingMethod === 'paystack'
                                        ? 'Redirecting to Paystack...'
                                        : selectedMethodTotal != null
                                            ? `Pay with Paystack · GHS ${selectedMethodTotal.toFixed(2)}`
                                            : 'Pay with Paystack' }}
                                </span>
                            </button>
                        </div>
                        <p class="payment-note">Choose wallet or Paystack. Direct Paystack payments are also recorded in
                            your
                            wallet history.</p>
                        <div v-if="paymentShortfall.requestId === selectedRequest.id && paymentShortfall.amount > 0"
                            class="payment-shortfall">
                            <div class="payment-shortfall-head">
                                <div class="payment-shortfall-icon">
                                    <ExcTriIcon class="payment-shortfall-svg" />
                                </div>
                                <div class="payment-shortfall-copy">
                                    <strong>Add funds to continue</strong>
                                    <span>Your wallet balance is below the amount needed for this payment.</span>
                                </div>
                                <div class="payment-shortfall-amount">
                                    GHS {{ paymentShortfall.amount.toFixed(2) }}
                                </div>
                            </div>
                            <div class="payment-shortfall-actions">
                                <span class="payment-shortfall-note">Top up this amount to complete the payment from
                                    your
                                    wallet.</span>
                                <button @click="openWalletTab" class="priority-topup payment-topup-btn">
                                    Top Up Wallet
                                </button>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="isPaymentPendingRequest(selectedRequest)"
                        class="payment-action payment-action--pending">
                        <p class="payment-note">Payment will appear here once item pricing is confirmed for this
                            request.</p>
                    </div>

                    <div v-if="canCancelRequest(selectedRequest)" class="cancel-action">
                        <button @click="requestCancelConfirmation(selectedRequest.id)" class="cancel-request-btn"
                            :disabled="cancelingRequest || payingRequest">
                            <ArrowPathIcon v-if="cancelingRequest" class="pay-svg spin" />
                            <XMarkIcon v-else class="pay-svg" />
                            <span>{{ cancelingRequest ? 'Cancelling request...' : 'Cancel request' }}</span>
                        </button>
                        <p class="payment-note">This only works while the request is still pending.</p>
                    </div>

                    <!-- Address / Notes -->
                    <div v-if="selectedRequest.customer_address || selectedRequest.delivery_address"
                        class="detail-info">
                        <MapPinIcon class="detail-svg" /> {{ compactAddress(selectedRequest.customer_address ?? selectedRequest.delivery_address ?? '') }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Priority Gate Modal -->
        <div v-if="showPriorityModal" class="modal-overlay" @click.self="showPriorityModal = false">
            <div class="modal-content priority-modal">
                <div class="modal-header">
                    <div>
                        <span v-if="isProfessional" class="text-xs font-bold text-emerald-600 uppercase tracking-wide">Free — professional</span>
                        <span v-else-if="firstRequestFree" class="text-xs font-bold text-emerald-600 uppercase tracking-wide">Free — first request</span>
                        <span v-else class="text-xs font-bold text-zinc-500 uppercase tracking-wide">GHS {{ requestFee.toFixed(2) }} charge</span>
                    </div>
                    <button @click="showPriorityModal = false" class="modal-close">
                        <XMarkIcon class="close-svg" />
                    </button>
                </div>

                <div class="modal-body">
                    <div class="priority-hero">
                        <p v-if="isProfessional" class="priority-copy">
                            You're a verified health professional — no fee will be charged for this request.
                        </p>
                        <p v-else-if="firstRequestFree" class="priority-copy">
                            Your first request is free — no fee will be charged.
                        </p>
                        <p v-else class="priority-copy">
                            A GHS {{ requestFee.toFixed(2) }} search fee is deducted from your wallet — it's credited back against your order if you proceed, or kept if you don't.
                        </p>
                    </div>

                    <div v-if="submitShortfall > 0" class="priority-shortfall">
                        <strong>GHS {{ submitShortfall.toFixed(2) }} short.</strong>
                        <span>Top up your wallet to continue.</span>
                    </div>

                    <div class="priority-actions">
                        <button @click="showPriorityModal = false" class="nav-back priority-back">
                            Not Yet
                        </button>
                        <button v-if="submitShortfall > 0" @click="openWalletTab" class="nav-next priority-topup">
                            Top Up Wallet
                        </button>
                        <button v-if="submitShortfall <= 0" @click="confirmPriorityAndSubmit" :disabled="isSubmitting"
                            class="nav-submit priority-submit">
                            <template v-if="isSubmitting">
                                <ArrowPathIcon class="nav-svg spin" /> Sending...
                            </template>
                            <template v-else>
                             Send Request
                            </template>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Success Modal -->
        <div v-if="showSuccess" class="modal-overlay" @click.self="showSuccess = false">
            <div class="success-modal">
                <div class="success-icon">
                    <CheckBadgeIcon class="success-svg" />
                </div>
                <h3>Request Submitted</h3>
                <p>Your request has been submitted, we'll notify you once it has been processed.</p>
                <p v-if="submittedNumber" class="success-num">Request #<strong>{{ submittedNumber }}</strong></p>
                <button @click="goToRequestHistory" class="nav-submit" style="width:100%">View My Requests</button>
            </div>
        </div>

        <!-- Cancel request confirmation -->
        <ConfirmDialog
            :is-open="!!pendingCancelRequestId"
            title="Cancel this request?"
            message="The pharmacy will stop sourcing for you. You can submit a new request anytime."
            confirm-text="Yes, cancel"
            cancel-text="Keep request"
            variant="danger"
            @close="pendingCancelRequestId = null"
            @confirm="performCancelRequest"
        />

        <!-- Toast -->
        <div v-if="toast"
            class="fixed bottom-8 right-8 z-[2000] flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white shadow-lg animate-[slideUp_0.3s_ease]"
            :class="{
                'bg-emerald-500': toast.type === 'success',
                'bg-red-500': toast.type === 'error',
                'bg-[#350062]': toast.type === 'info' || !toast.type
            }">
            <component :is="toast.type === 'error' ? ExcTriIcon : CheckCircleIcon" class="w-5 h-5 flex-shrink-0" />
            {{ toast.text }}
        </div>

        <!-- Payment Success Animation Overlay -->
        <Transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-300 ease-in"
            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
            <div v-if="showPaymentSuccessAnim"
                class="fixed inset-0 z-[100] flex items-center justify-center bg-[#4F217A]/60 backdrop-blur-sm">
                <div
                    class="bg-white rounded-[2rem] p-8 max-w-[320px] w-full mx-4 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div class="absolute inset-0 pointer-events-none"
                        style="background: radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 70%);">
                    </div>
                    <div class="w-24 h-24 mb-6 relative z-10 flex items-center justify-center">
                        <div
                            class="absolute inset-0 rounded-full bg-emerald-100 scale-0 animate-[scaleIn_0.5s_ease-out_forwards]">
                        </div>
                        <div
                            class="absolute inset-0 rounded-full border-4 border-emerald-500 scale-0 animate-[scaleIn_0.5s_ease-out_0.2s_forwards]">
                        </div>
                        <svg class="w-12 h-12 text-emerald-600 relative z-20 stroke-dasharray-[100] stroke-dashoffset-[100] animate-[drawCheck_0.5s_ease-out_0.4s_forwards]"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3
                        class="text-2xl font-black text-[#350062] mb-3 opacity-0 animate-[fadeUp_0.5s_ease-out_0.6s_forwards]">
                        Payment Successful!</h3>
                    <p
                        class="text-gray-600 text-[0.85rem] mb-8 font-medium leading-relaxed opacity-0 animate-[fadeUp_0.5s_ease-out_0.7s_forwards]">
                        Your order payment was successfully processed. Our pharmacists will fulfill your request
                        shortly.
                    </p>
                    <button @click="showPaymentSuccessAnim = false"
                        class="w-full bg-[#4F217A] hover:bg-[#350062] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_14px_rgba(79,33,122,0.3)] opacity-0 animate-[fadeUp_0.5s_ease-out_0.8s_forwards]">
                        Awesome
                    </button>
                    <!-- Scoped keyframes purely for this modal -->
                    <component :is="'style'">
                        @keyframes scaleIn { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.1);
                        opacity: 1; }
                        100% { transform: scale(1); opacity: 1; } }
                        @keyframes drawCheck { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
                        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1;
                        transform:
                        translateY(0); } }
                        .stroke-dasharray-\[100\] { stroke-dasharray: 100; }
                        .stroke-dashoffset-\[100\] { stroke-dashoffset: 100; }
                    </component>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, watchEffect, nextTick } from 'vue'
import imageCompression from 'browser-image-compression'
import { useUserStore } from '~/stores/user'
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService'
import { useApi, ApiError } from '~/composables/useApi'
import { formatCompactAddress } from '~/utils/addressFormat'
import {
    PAYABLE_REQUEST_STATUSES as payableStatuses,
    getRequestTotalAmount as getPayableAmount,
    isPayableRequest as canPayRequest,
    isPaymentPendingRequest
} from '~/utils/requestPayment'
import {
    PlusCircleIcon, ClipboardDocumentListIcon as ClipDocList, CheckIcon, PlusIcon, XMarkIcon,
    CameraIcon, ArrowUpTrayIcon, MapPinIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon,
    PaperClipIcon, InformationCircleIcon, CubeIcon, CurrencyDollarIcon, TruckIcon, StarIcon,
    ChatBubbleLeftIcon, CheckBadgeIcon, MagnifyingGlassIcon,
    MinusSmallIcon, PlusSmallIcon, CreditCardIcon,
    ExclamationTriangleIcon as ExcTriIcon, CheckCircleIcon,
    ClockIcon, WalletIcon, InboxIcon, BeakerIcon, ChatBubbleLeftEllipsisIcon,
    BuildingStorefrontIcon, PhoneIcon,
} from '@heroicons/vue/24/outline'
import { MapPinIcon as MapPinIconSolid, CheckCircleIcon as CheckCircleIconSolid, PaperAirplaneIcon as PaperAirplaneIconSolid } from '@heroicons/vue/24/solid'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

// ─── Domain types ────────────────────────────────────────────────────────────

interface RequestItem {
    product_name: string;
    requested_unit: string;
    quantity: number;
    imageFiles: PrescriptionPreview[];
}

interface PrescriptionPreview {
    id: string;
    file: File;
    previewUrl: string;
}

interface AddressSuggestion {
    display_name?: string;
    latitude?: number | string;
    longitude?: number | string;
    [key: string]: unknown;
}

interface HomeLocation {
    address: string;
    latitude: number;
    longitude: number;
}

interface LocationIssue {
    message: string;
    instructions: string;
}

interface DecisionItem {
    item_id?: number | string;
    status?: string;
    unit_price?: number | string | null;
    quantity?: number;
    marked_up_price?: number | string | null;
    substitute_option?: {
        marked_up_price?: number | string | null;
        source_pharmacy_id?: number | string;
        distance_km?: number;
        [key: string]: unknown;
    } | null;
    source_pharmacy_id?: number | string;
    source_pharmacy_ids?: Array<number | string>;
    source_distances_km?: Array<number | string>;
    distance_km?: number;
    default_choice?: string;
    [key: string]: unknown;
}

interface RequestDecision {
    id?: number | string;
    decision_type?: string;
    payload?: {
        summary?: {
            decision_context?: string;
            source_pharmacy_count?: number;
            [key: string]: unknown;
        };
        decision_items?: DecisionItem[];
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface RequestFeedback {
    rating?: number;
    comment?: string;
    created_at?: string;
    [key: string]: unknown;
}

interface OrderRequestItem {
    id?: number | string;
    product_name?: string;
    quantity?: number;
    marked_up_price?: number | string | null;
    item_status?: string;
    item_images?: string[];
    [key: string]: unknown;
}

interface OrderRequest {
    id: number | string;
    request_number?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    fulfillment_type?: string | null;
    delivery_fee?: number | string;
    items_total?: number | string;
    estimated_total?: number | string;
    total_cost?: number | string;
    item_count?: number;
    items?: OrderRequestItem[];
    prescription_images?: string[];
    pending_decisions?: RequestDecision[];
    feedback?: RequestFeedback;
    rider?: { phone?: string; [key: string]: unknown };
    rider_phone?: string;
    rider_name?: string;
    customer_address?: string;
    delivery_address?: string;
    pharmacy?: { name?: string; address?: string; [key: string]: unknown };
    [key: string]: unknown;
}

interface PaymentOptions {
    selected?: string;
    fee_applicable?: boolean;
    request_fee?: number | string | null;
    pickup?: {
        available?: boolean;
        total?: number | string | null;
        total_fee_applied?: number | string | null;
        unavailable_reason?: string;
        pharmacy?: {
            name?: string;
            area?: string;
            distance_km?: number | null;
            is_24_hours?: boolean;
            closes_at?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    delivery?: {
        total?: number | string | null;
        total_fee_applied?: number | string | null;
        fee?: number | string | null;
        distance_km?: number | null;
        eta_minutes?: number | null;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

// TODO: remove once stores/ are .ts
interface UserStoreShape {
    masterCustomer?: { id?: number | string };
    customerAuthToken?: string | null;
    getProfile: () => Promise<{
        home_address?: string;
        address?: string;
        home_latitude?: number | string | null;
        home_longitude?: number | string | null;
        latitude?: number | string | null;
        longitude?: number | string | null;
        [key: string]: unknown;
    }>;
    updateProfile: (data: Record<string, unknown>) => Promise<void>;
}

interface ApiError extends Error {
    status?: number;
    data?: Record<string, unknown>;
}

const props = defineProps<{
    defaultSubTab?: string;
    initialRequestId?: string | number | null;
}>()

const userStore = useUserStore() as unknown as UserStoreShape
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const apiBase = config.public['apiBase'] as string ?? ''
const orderRequestsService = createOrderRequestsService(useApi())

const isNewView = computed<boolean>(() => props.defaultSubTab === 'new')
const isListView = computed<boolean>(() => props.defaultSubTab === 'list')
const isSubmitting = ref<boolean>(false)
const loadingRequests = ref<boolean>(false)
const gettingLocation = ref<boolean>(false)
const payingRequest = ref<boolean>(false)
const payingMethod = ref<string>('')
const cancelingRequest = ref<boolean>(false)
const toast = ref<{ text: string; type: string } | null>(null)
const showSuccess = ref<boolean>(false)
const showPaymentSuccessAnim = ref<boolean>(false)
const showPriorityModal = ref<boolean>(false)
const submittedNumber = ref<string>('')
const requestFee = ref<number>(5)
const requestRefundMinutes = ref<number>(30)
const firstRequestFree = ref<boolean>(false)
const isProfessional = ref<boolean>(false)
const paymentOptionsByRequest = ref<Record<string | number, PaymentOptions>>({})
const paymentOptionsLoading = ref<Record<string | number, boolean>>({})
const selectedPaymentMethodByRequest = ref<Record<string | number, string>>({})
const applyFeeByRequest = ref<Record<string | number, boolean>>({})
// Convenience accessor — avoids repeated index lookups that vue-tsc cannot narrow through v-else-if guards
const selectedPaymentOptions = computed<PaymentOptions | undefined>(
    () => selectedRequest.value != null ? paymentOptionsByRequest.value[selectedRequest.value.id] : undefined
)
const setApplyFee = (requestId: string | number, value: boolean): void => {
    applyFeeByRequest.value = { ...applyFeeByRequest.value, [requestId]: value }
}
const walletBalance = ref<number>(0)
const submitShortfall = ref<number>(0)
const paymentShortfall = ref<{ requestId: string | number | null; amount: number }>({
    requestId: null,
    amount: 0
})
const medicineUnitOptions: string[] = [
    'tab',
    'capsule',
    'bottle',
    'suppository',
    'tube',
    'vial',
    'ampoule',
    'sachet',
    'pack',
    'other'
]

const newItem = (): RequestItem => ({
    product_name: '',
    requested_unit: '',
    quantity: 1,
    imageFiles: []
})

const HOMEPAGE_REQUEST_DRAFT_KEY = 'medsgh_homepage_request_draft'
const HOMEPAGE_PRESCRIPTION_DRAFT_KEY = 'medsgh_homepage_prescription_image'
const FORM_DRAFT_KEY_BASE = 'medsgh_order_form_draft'
const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000
let formDraftSaveTimer: ReturnType<typeof setTimeout> | null = null

const draftStorageKey = (): string => {
    const cid = userStore.masterCustomer?.id ?? 'anon'
    return `${FORM_DRAFT_KEY_BASE}:${cid}`
}

const migrateLegacyDraftKey = (): void => {
    try {
        const legacy = localStorage.getItem(FORM_DRAFT_KEY_BASE)
            ?? sessionStorage.getItem(FORM_DRAFT_KEY_BASE)
        if (legacy) {
            const target = draftStorageKey()
            if (!localStorage.getItem(target)) localStorage.setItem(target, legacy)
            localStorage.removeItem(FORM_DRAFT_KEY_BASE)
            sessionStorage.removeItem(FORM_DRAFT_KEY_BASE)
        }
    } catch {}
}

const saveFormDraft = (): void => {
    if (!process.client) return
    formDraftSaveTimer = null

    try {
        const draft = {
            items: requestItems.value.map(item => ({
                product_name: item.product_name,
                requested_unit: item.requested_unit ?? '',
                quantity: item.quantity
            })),
            customerLat: customerLat.value,
            customerLng: customerLng.value,
            fulfillmentType: fulfillmentType.value,
            customerAddress: customerAddress.value,
            deliveryAddress: deliveryAddress.value,
            customerNotes: customerNotes.value,
            locationMode: locationMode.value,
            savedAt: Date.now()
        }
        localStorage.setItem(draftStorageKey(), JSON.stringify(draft))
    } catch (err) {
        console.error('Failed to save form draft:', err)
    }
}

const debouncedSaveFormDraft = (): void => {
    if (formDraftSaveTimer) clearTimeout(formDraftSaveTimer)
    formDraftSaveTimer = setTimeout(saveFormDraft, 1000)
}

const restoreFormDraft = (): void => {
    if (!process.client) return

    try {
        migrateLegacyDraftKey()

        const key = draftStorageKey()
        const raw = localStorage.getItem(key)
        if (!raw) return

        const draft = JSON.parse(raw) as Record<string, unknown> | null
        if (!draft) return

        const savedAt = Number(draft['savedAt'] ?? 0)
        if (!savedAt || Date.now() - savedAt > DRAFT_TTL_MS) {
            try { localStorage.removeItem(key) } catch {}
            return
        }

        // Only restore if the items are mostly empty (user hasn't started typing).
        // Note: fulfillmentType defaults to 'delivery' on mount so it can't be used
        // as a "has the user interacted" signal — relying on items + location only.
        const hasSignificantContent = requestItems.value.some(item => item.product_name.trim()) ||
            customerLat.value ||
            customerNotes.value.trim() ||
            deliveryAddress.value.trim()
        if (hasSignificantContent) return

        // Restore items
        const draftItems = draft['items']
        if (Array.isArray(draftItems) && draftItems.length > 0) {
            requestItems.value = (draftItems as Array<Record<string, unknown>>).map(item => ({
                ...newItem(),
                product_name: String(item['product_name'] ?? ''),
                requested_unit: String(item['requested_unit'] ?? ''),
                quantity: Math.max(1, Number(item['quantity'] ?? 1))
            }))
        }

        // Restore location data
        if (draft['customerLat']) customerLat.value = draft['customerLat'] as number
        if (draft['customerLng']) customerLng.value = draft['customerLng'] as number
        if (draft['locationMode']) locationMode.value = String(draft['locationMode'])

        // Restore form fields
        fulfillmentType.value = 'delivery'
        if (draft['customerAddress']) customerAddress.value = String(draft['customerAddress'])
        if (draft['deliveryAddress']) deliveryAddress.value = String(draft['deliveryAddress'])
        if (draft['customerNotes']) customerNotes.value = String(draft['customerNotes'])
    } catch (err) {
        console.error('Failed to restore form draft:', err)
    }
}

const clearFormDraft = (): void => {
    if (!process.client) return
    try {
        localStorage.removeItem(draftStorageKey())
        if (formDraftSaveTimer) clearTimeout(formDraftSaveTimer)
        formDraftSaveTimer = null
    } catch (err) {
        console.error('Failed to clear form draft:', err)
    }
}

interface NormalizedDraftItem {
    product_name: string;
    requested_unit: string;
    quantity: number;
}

const normalizeHomepageDraftItem = (item: unknown): NormalizedDraftItem | null => {
    const src = item as Record<string, unknown> | string | null | undefined
    const productName = String(typeof src === 'string' ? src : (src as Record<string, unknown> | null)?.['product_name'] ?? '').trim()
    if (!productName) return null

    const srcObj = typeof src === 'string' ? null : src as Record<string, unknown> | null
    return {
        product_name: productName,
        requested_unit: String(srcObj?.['requested_unit'] ?? '').trim().toLowerCase(),
        quantity: Math.max(1, Number(srcObj?.['quantity'] ?? 1))
    }
}

const consumeHomepageRequestDraft = (): NormalizedDraftItem[] | null => {
    if (!process.client) return null

    const raw = sessionStorage.getItem(HOMEPAGE_REQUEST_DRAFT_KEY)
    if (!raw) return null

    sessionStorage.removeItem(HOMEPAGE_REQUEST_DRAFT_KEY)

    try {
        const parsed = JSON.parse(raw) as Record<string, unknown> | null
        if (Array.isArray(parsed?.['items'])) {
            return (parsed['items'] as unknown[]).map(normalizeHomepageDraftItem).filter((x): x is NormalizedDraftItem => x !== null)
        }

        const singleItem = normalizeHomepageDraftItem(parsed)
        return singleItem ? [singleItem] : []
    } catch {
        return []
    }
}

const consumeHomepagePrescriptionDraft = async (): Promise<void> => {
    if (!process.client) return
    try {
        const raw = sessionStorage.getItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY)
        if (!raw) return
        sessionStorage.removeItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY)
        const { name, type, data } = JSON.parse(raw) as { name: string; type: string; data: string }
        if (!data) return
        const file = dataUrlToFile(data, name, type)
        const compressed = await compressRequestImage(file)
        prescriptionFiles.value = [createPrescriptionPreview(compressed)]
        await persistPrescriptionsToSession()
    } catch {}
}

const applyHomepageRequestDraft = (draftItems: NormalizedDraftItem[] | null = []): void => {
    const items = draftItems ?? []
    if (!items.length) return

    const existingNames = new Set(
        requestItems.value
            .map((item) => String(item.product_name ?? '').trim().toLowerCase())
            .filter(Boolean)
    )

    const preparedItems = items
        .map(normalizeHomepageDraftItem)
        .filter((item): item is NormalizedDraftItem => item !== null && !existingNames.has(item.product_name.trim().toLowerCase()))
        .map((item) => ({
            ...newItem(),
            product_name: item.product_name,
            requested_unit: item.requested_unit ?? '',
            quantity: item.quantity
        }))

    if (!preparedItems.length) return

    const firstItem = requestItems.value[0]
    const canReplaceFirstEmptyRow = requestItems.value.length === 1
        && firstItem != null
        && !String(firstItem.product_name ?? '').trim()
        && (!Array.isArray(firstItem.imageFiles) || firstItem.imageFiles.length === 0)

    if (canReplaceFirstEmptyRow) {
        requestItems.value = preparedItems
        return
    }

    requestItems.value = [...preparedItems, ...requestItems.value]
}

const requestItems = ref<RequestItem[]>([newItem()])
const prescriptionPicker = ref<HTMLInputElement | null>(null)
const prescriptionReplacePicker = ref<HTMLInputElement | null>(null)
const prescriptionFiles = ref<PrescriptionPreview[]>([])
const prescriptionReplaceIndex = ref<number | null>(null)
const customerLat = ref<number | null>(null)
const customerLng = ref<number | null>(null)
const savedHomeLocation = ref<HomeLocation | null>(null)
const locationMode = ref<string>('none')
const fulfillmentType = ref<string>('delivery')
const customerAddress = ref<string>('')
const deliveryAddress = ref<string>('')
const deliveryAddressSearch = ref<string>('')
const deliveryAddressSuggestions = ref<AddressSuggestion[]>([])
const deliveryAddressActiveIndex = ref<number>(-1)
const deliveryAutocompleteLoading = ref<boolean>(false)
const customerNotes = ref<string>('')
const notesTextarea = ref<HTMLTextAreaElement | null>(null)
const showPrescriptionField = ref<boolean>(false)
const showNotesField = ref<boolean>(false)
const locationIssue = ref<LocationIssue | null>(null)
const uploadProgress = ref<number>(0)

const openPrescriptionField = (): void => {
    showPrescriptionField.value = true
    void nextTick(() => {
        prescriptionPicker.value?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
    })
}

const openNotesField = (): void => {
    showNotesField.value = true
    void nextTick(() => {
        notesTextarea.value?.focus()
    })
}

const dismissPrescriptionField = (): void => {
    if (prescriptionFiles.value.length) return
    showPrescriptionField.value = false
}

const dismissNotesField = (): void => {
    if (customerNotes.value.trim().length) return
    showNotesField.value = false
}

watch(prescriptionFiles, (files) => {
    if (files.length > 0) showPrescriptionField.value = true
}, { deep: true })

watch(customerNotes, (val) => {
    if (String(val || '').trim().length > 0) showNotesField.value = true
})
let deliveryAutocompleteTimer: ReturnType<typeof setTimeout> | null = null
let deliveryAutocompleteSuspend = false

const myRequests = ref<OrderRequest[]>([])
const selectedRequest = ref<OrderRequest | null>(null)

// Auto-fetch payment options when the customer opens a payable request.
// The payment-options endpoint is the source of truth for pickup viability
// + fee/distance/ETA.
watch(selectedRequest, (req) => {
    if (!req) return
    if (!canPayRequest(req)) return
    if (req.id != null && paymentOptionsByRequest.value[req.id]) return
    if (req.id != null) void loadPaymentOptions(req.id)
})
const requestListTab = ref<string>('active')
const respondingDecisionId = ref<number | string | null>(null)
const decisionSelections = ref<Record<string | number, Record<string, string>>>({})
const savingFeedback = ref<boolean>(false)
const feedbackForm = ref<{
    rating: number; comment: string;
    rating_product: number; rating_delivery: number; rating_service: number; rating_overall: number; notes: string;
}>({
    rating: 0, comment: '',
    rating_product: 0, rating_delivery: 0, rating_service: 0, rating_overall: 0, notes: ''
})
const POLL_INTERVAL_MS = 15000
let pollTimer: ReturnType<typeof setInterval> | null = null

const goToNewRequest = async (): Promise<void> => {
    selectedRequest.value = null
    showSuccess.value = false
    await navigateTo({ path: '/customer', query: { tab: 'new' } })
}

const goToRequestHistory = async (): Promise<void> => {
    selectedRequest.value = null
    showSuccess.value = false
    await navigateTo({ path: '/customer', query: { tab: 'requests' } })
}

const validItems = computed<RequestItem[]>(() => requestItems.value.filter(i => i.product_name.trim()))
const hasPrescriptionFiles = computed<boolean>(() => prescriptionFiles.value.length > 0)
const hasItemImageFiles = computed<boolean>(() => requestItems.value.some((item) => Array.isArray(item.imageFiles) && item.imageFiles.length > 0))
const hasMultipartUploads = computed<boolean>(() => hasPrescriptionFiles.value || hasItemImageFiles.value)
const isUploading = computed<boolean>(() => isSubmitting.value && uploadProgress.value > 0)
const homeLocationAvailable = computed<boolean>(() => !!(savedHomeLocation.value?.latitude && savedHomeLocation.value?.longitude))
const canSearchProducts = computed<boolean>(() =>
    firstRequestFree.value ||
    isProfessional.value ||
    Number(walletBalance.value ?? 0) >= Number(requestFee.value ?? 5)
)
const canSubmit = computed<boolean>(() => {
    const hasRequestContent = validItems.value.length > 0 || prescriptionFiles.value.length > 0
    if (!hasRequestContent || !customerLat.value) return false
    // fulfillment_type is chosen later on the payment screen; address is still
    // required here because we use it for sourcing nearby pharmacies.
    if (!deliveryAddress.value.trim()) return false
    // Block submission when the wallet can't cover the priority search fee —
    // the server enforces this too, but disabling here avoids a confusing
    // round-trip and matches the amber "top up first" warning already shown.
    if (!canSearchProducts.value) return false
    return true
})

const locationLabel = computed<string>(() => {
    if (customerLat.value) return 'Location set'
    if (gettingLocation.value) return 'Getting location...'
    return 'Use my location'
})
const locationSublabel = computed<string>(() => {
    if (locationMode.value === 'home' && savedHomeLocation.value?.address) {
        return formatCompactAddress(savedHomeLocation.value.address, { primaryCount: 3, fallback: savedHomeLocation.value.address })
    }
    if (locationMode.value === 'current-request' && customerAddress.value) {
        return formatCompactAddress(customerAddress.value, { primaryCount: 3, fallback: customerAddress.value })
    }
    if (customerLat.value) return `${customerLat.value.toFixed(4)}, ${customerLng.value?.toFixed(4) ?? ''}`
    return 'Tap to detect your location'
})

const compactAddress = (value: string): string => formatCompactAddress(value, { primaryCount: 3, fallback: value ?? '' })

const reviewLocationLabel = computed<string>(() => {
    if (customerAddress.value) {
        return compactAddress(customerAddress.value)
    }
    if (customerLat.value) return 'Location set'
    return 'Not set'
})

const isCompletedRequest = (request: OrderRequest): boolean => {
    const status = getCustomerStatus(request?.status ?? '')
    return ['completed', 'delivered', 'picked_up', 'expired', 'cancelled', 'returned'].includes(status)
}

const activeRequests = computed<OrderRequest[]>(() => myRequests.value.filter(req => !isCompletedRequest(req)))
const completedRequests = computed<OrderRequest[]>(() => myRequests.value.filter(req => isCompletedRequest(req)))
const filteredRequests = computed<OrderRequest[]>(() => (
    requestListTab.value === 'completed' ? completedRequests.value : activeRequests.value
))

const buildLocationIssue = (message: string, instructions: string): LocationIssue => ({ message, instructions })

const clearDeliveryAddressSuggestions = (): void => {
    deliveryAddressSuggestions.value = []
    deliveryAddressActiveIndex.value = -1
    deliveryAutocompleteLoading.value = false
}

const fetchDeliveryAddressSuggestions = async (query: string): Promise<void> => {
    const trimmed = String(query ?? '').trim()
    if (trimmed.length < 3) {
        clearDeliveryAddressSuggestions()
        return
    }

    try {
        deliveryAutocompleteLoading.value = true
        const res = await apiCall('GET', `/api/auth/customer/autocomplete-location?q=${encodeURIComponent(trimmed)}&limit=5`)
        deliveryAddressSuggestions.value = Array.isArray(res.data) ? res.data as AddressSuggestion[] : []
        deliveryAddressActiveIndex.value = deliveryAddressSuggestions.value.length > 0 ? 0 : -1
    } catch {
        deliveryAddressSuggestions.value = []
        deliveryAddressActiveIndex.value = -1
    } finally {
        deliveryAutocompleteLoading.value = false
    }
}

const onDeliveryAddressKeydown = (event: KeyboardEvent): void => {
    const count = deliveryAddressSuggestions.value.length
    if (!count) return
    if (event.key === 'ArrowDown') {
        event.preventDefault()
        deliveryAddressActiveIndex.value = (deliveryAddressActiveIndex.value + 1) % count
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        deliveryAddressActiveIndex.value = deliveryAddressActiveIndex.value <= 0 ? count - 1 : deliveryAddressActiveIndex.value - 1
    } else if (event.key === 'Enter' && deliveryAddressActiveIndex.value >= 0) {
        event.preventDefault()
        // noUncheckedIndexedAccess: guarded by the `>= 0` check above
        applyDeliveryAddressSuggestion(deliveryAddressSuggestions.value[deliveryAddressActiveIndex.value]!)
    } else if (event.key === 'Escape') {
        clearDeliveryAddressSuggestions()
    }
}

const applyDeliveryAddressSuggestion = (suggestion: AddressSuggestion | undefined): void => {
    const address = String(suggestion?.display_name ?? '').trim()
    if (!address) return

    deliveryAddress.value = address
    deliveryAddressSearch.value = address
    customerAddress.value = address

    const lat = Number(suggestion?.latitude)
    const lng = Number(suggestion?.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        customerLat.value = lat
        customerLng.value = lng
        locationMode.value = 'current-request'
        locationIssue.value = null
    }

    deliveryAutocompleteSuspend = true
    clearDeliveryAddressSuggestions()
}

const applySavedHomeLocation = (homeLocation: HomeLocation | null | undefined, { force = false } = {}): void => {
    if (!homeLocation?.latitude || !homeLocation?.longitude) return
    if (!force && (customerLat.value || customerLng.value || locationMode.value === 'current-request')) return

    customerLat.value = Number(homeLocation.latitude)
    customerLng.value = Number(homeLocation.longitude)
    customerAddress.value = homeLocation.address ?? ''
    if (fulfillmentType.value === 'delivery' && (!deliveryAddress.value.trim() || force || locationMode.value !== 'current-request')) {
        deliveryAddress.value = homeLocation.address ?? ''
        deliveryAddressSearch.value = deliveryAddress.value
    }
    locationMode.value = 'home'
}

const loadSavedHomeLocation = async (): Promise<void> => {
    try {
        const profile = await userStore.getProfile()
        const address = profile?.home_address ?? profile?.address ?? ''
        const latitude = profile?.home_latitude ?? profile?.latitude ?? null
        const longitude = profile?.home_longitude ?? profile?.longitude ?? null

        if (latitude && longitude) {
            savedHomeLocation.value = {
                address: String(address),
                latitude: Number(latitude),
                longitude: Number(longitude)
            }
            applySavedHomeLocation(savedHomeLocation.value)
        } else {
            savedHomeLocation.value = null
        }
    } catch {
        savedHomeLocation.value = null
    }
}

const restoreSavedHomeLocation = (): void => {
    if (!savedHomeLocation.value) return
    applySavedHomeLocation(savedHomeLocation.value, { force: true })
    locationIssue.value = null
    showToast('Saved home location restored')
}

const selectFulfillment = (type: string): void => {
    fulfillmentType.value = type
    if (type === 'delivery' && !deliveryAddress.value.trim()) {
        deliveryAddress.value = customerAddress.value ?? ''
        deliveryAddressSearch.value = deliveryAddress.value
    }
}

const isFeedbackEligibleStatus = (status: string | undefined): boolean =>
    ['completed', 'delivered', 'picked_up'].includes(getCustomerStatus(status ?? ''))

const canLeaveFeedback = (request: OrderRequest): boolean => isFeedbackEligibleStatus(request?.status)

const syncFeedbackForm = (): void => {
    const feedback = selectedRequest.value?.feedback ?? null
    feedbackForm.value = {
        rating: Number(feedback?.rating ?? 0),
        comment: String(feedback?.comment ?? ''),
        rating_product: Number(feedback?.rating_product ?? 0),
        rating_delivery: Number(feedback?.rating_delivery ?? 0),
        rating_service: Number(feedback?.rating_service ?? 0),
        rating_overall: Number(feedback?.rating_overall ?? 0),
        notes: String(feedback?.notes ?? '')
    }
}

const getPlatformLocationSettingsLink = (): string | null => {
    if (typeof window === 'undefined') return null
    const ua = window.navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) return 'app-settings:'
    if (/android/.test(ua)) return 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end'
    return null
}

const openLocationSettings = (): void => {
    const deepLink = getPlatformLocationSettingsLink()
    if (deepLink) {
        window.location.href = deepLink
        return
    }
    showToast('Open your browser site settings and allow location access for this page.', 'info')
}

const createPrescriptionPreview = (file: File): PrescriptionPreview => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: URL.createObjectURL(file)
})

const RX_SESSION_KEY = 'medsgh_pending_rx'

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
})

const dataUrlToFile = (dataUrl: string, name: string, type: string): File => {
    const [, base64] = dataUrl.split(',') as [string, string]
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    return new File([bytes], name, { type })
}

const persistPrescriptionsToSession = async (): Promise<void> => {
    try {
        const entries = await Promise.all(
            prescriptionFiles.value.map(async (p) => ({
                name: p.file.name,
                type: p.file.type,
                dataUrl: await fileToDataUrl(p.file)
            }))
        )
        sessionStorage.setItem(RX_SESSION_KEY, JSON.stringify(entries))
    } catch {}
}

const restorePrescriptionsFromSession = async (): Promise<void> => {
    try {
        const raw = sessionStorage.getItem(RX_SESSION_KEY)
        if (!raw) return
        const entries = JSON.parse(raw) as Array<{ dataUrl: string; name: string; type: string }>
        if (!Array.isArray(entries) || !entries.length) return
        const files = entries.map(({ dataUrl, name, type }) => dataUrlToFile(dataUrl, name, type))
        prescriptionFiles.value = files.map(createPrescriptionPreview)
    } catch {}
}

const clearPrescriptionSession = (): void => {
    try { sessionStorage.removeItem(RX_SESSION_KEY) } catch {}
}

const compressRequestImage = async (file: File): Promise<File> => {
    const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true
    }

    try {
        const compressedFile = await imageCompression(file, options)
        return new File(
            [compressedFile],
            compressedFile.name || file.name,
            {
                type: compressedFile.type || file.type,
                lastModified: Date.now()
            }
        )
    } catch (err) {
        console.error('Failed to compress request image:', err)
        return file
    }
}

const buildItemPayload = (item: RequestItem): { product_name: string; requested_unit: string | null; quantity: number } => ({
    product_name: item.product_name.trim(),
    requested_unit: String(item.requested_unit ?? '').trim().toLowerCase() || null,
    quantity: item.quantity || 1
})

const resetPickerInput = (pickerRef: { value?: HTMLInputElement | null } | null): void => {
    if (pickerRef?.value) pickerRef.value.value = ''
}

const revokePrescriptionPreview = (image: PrescriptionPreview | undefined | null): void => {
    if (image?.previewUrl) {
        URL.revokeObjectURL(image.previewUrl)
    }
}

const appendPrescriptionFiles = async (files: FileList | File[]): Promise<void> => {
    const accepted = Array.from(files).slice(0, Math.max(0, 6 - prescriptionFiles.value.length))
    if (!accepted.length) return
    const compressedFiles = await Promise.all(accepted.map(compressRequestImage))
    const nextFiles = compressedFiles.map(createPrescriptionPreview)
    prescriptionFiles.value = [...prescriptionFiles.value, ...nextFiles]
    await persistPrescriptionsToSession()
}

const onPrescriptionFilesSelected = async (event: Event): Promise<void> => {
    const target = event.target as HTMLInputElement
    await appendPrescriptionFiles(target.files ?? [])
    if (target) target.value = ''
    resetPickerInput(prescriptionPicker)
}

const queuePrescriptionReplace = (index: number): void => {
    prescriptionReplaceIndex.value = index
    prescriptionReplacePicker.value?.click()
}

const onReplacePrescriptionFile = async (event: Event): Promise<void> => {
    const target = event.target as HTMLInputElement
    const replacement = target.files?.[0]
    const index = prescriptionReplaceIndex.value
    if (!replacement || index === null || !prescriptionFiles.value[index]) {
        resetPickerInput(prescriptionReplacePicker)
        prescriptionReplaceIndex.value = null
        return
    }

    const compressedReplacement = await compressRequestImage(replacement)
    revokePrescriptionPreview(prescriptionFiles.value[index])
    prescriptionFiles.value.splice(index, 1, createPrescriptionPreview(compressedReplacement))
    resetPickerInput(prescriptionReplacePicker)
    prescriptionReplaceIndex.value = null
    await persistPrescriptionsToSession()
}

const removePrescriptionFile = (index: number): void => {
    const current = prescriptionFiles.value[index]
    revokePrescriptionPreview(current)
    prescriptionFiles.value.splice(index, 1)
    void persistPrescriptionsToSession()
}

const appendItemImages = async (item: RequestItem, files: FileList | File[]): Promise<void> => {
    const accepted = Array.from(files).slice(0, Math.max(0, 6 - (item.imageFiles?.length ?? 0)))
    if (!accepted.length) return
    const compressedFiles = await Promise.all(accepted.map(compressRequestImage))
    const nextFiles = compressedFiles.map(createPrescriptionPreview)
    item.imageFiles = [...(item.imageFiles ?? []), ...nextFiles]
}

const onItemImagesSelected = async (event: Event, item: RequestItem): Promise<void> => {
    const target = event.target as HTMLInputElement
    await appendItemImages(item, target.files ?? [])
    target.value = ''
}

const replaceItemImage = async (event: Event, item: RequestItem, imageIndex: number): Promise<void> => {
    const target = event.target as HTMLInputElement
    const replacement = target.files?.[0]
    if (!replacement || !item?.imageFiles?.[imageIndex]) {
        target.value = ''
        return
    }

    const compressedReplacement = await compressRequestImage(replacement)
    revokePrescriptionPreview(item.imageFiles[imageIndex])
    item.imageFiles.splice(imageIndex, 1, createPrescriptionPreview(compressedReplacement))
    target.value = ''
}

const removeItemImage = (item: RequestItem, imageIndex: number): void => {
    const current = item?.imageFiles?.[imageIndex]
    if (!current) return
    revokePrescriptionPreview(current)
    item.imageFiles.splice(imageIndex, 1)
}

const cleanupItemImages = (item: RequestItem): void => {
    ;(item?.imageFiles ?? []).forEach(revokePrescriptionPreview)
}

const removeRequestItem = (index: number): void => {
    const item = requestItems.value[index]
    if (item) cleanupItemImages(item)
    requestItems.value.splice(index, 1)
}

const reverseGeocodeLocation = async (lat: number, lng: number): Promise<{ address?: string; [key: string]: unknown } | null> => {
    const res = await apiCall('GET', `/api/auth/customer/reverse-geocode?lat=${lat}&lng=${lng}`)
    return (res.data as { address?: string } | null) ?? null
}

const getLocation = (): void => {
    if (!navigator.geolocation) {
        locationIssue.value = buildLocationIssue(
            'Location is not available in this browser.',
            'Try a modern browser on your phone, then allow location access and try again.'
        )
        showToast('Geolocation not supported', 'error')
        return
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        locationIssue.value = buildLocationIssue(
            'Location needs a secure page before it can work here.',
            'Open the secure site, then allow location access for your browser and try again.'
        )
        showToast('Location access requires HTTPS on staging. Use a secure URL to continue.', 'error')
        return
    }
    gettingLocation.value = true
    locationIssue.value = null
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            customerLat.value = pos.coords.latitude
            customerLng.value = pos.coords.longitude
            locationMode.value = 'current-request'
            try {
                const locationData = await reverseGeocodeLocation(customerLat.value, customerLng.value)
                if (locationData?.address) {
                    customerAddress.value = locationData.address
                    if (fulfillmentType.value === 'delivery') {
                        deliveryAddress.value = locationData.address
                        deliveryAddressSearch.value = locationData.address
                    }
                    try {
                        await userStore.updateProfile({
                            home_address: locationData.address,
                            home_latitude: customerLat.value,
                            home_longitude: customerLng.value
                        })
                    } catch (saveErr) {
                        console.error('Failed to save location to profile:', saveErr)
                    }
                }
            } catch (err) {
                console.error('Reverse geocode failed:', err)
            } finally {
                gettingLocation.value = false
                locationIssue.value = null
                showToast('Location set and saved to your profile')
            }
        },
        (geoError) => {
            gettingLocation.value = false
            if (geoError.code === geoError.PERMISSION_DENIED) {
                locationIssue.value = buildLocationIssue(
                    'Location permission is off for this page.',
                    'Turn on GPS, then allow location access in your browser settings for this site.'
                )
                showToast('Location permission was denied. Allow location access and try again.', 'error')
                return
            }
            if (geoError.code === geoError.POSITION_UNAVAILABLE) {
                locationIssue.value = buildLocationIssue(
                    'We could not read your location just now.',
                    'Check that GPS is on, move to a clearer signal area, then try again.'
                )
                showToast('Your location is unavailable right now. Check GPS and try again.', 'error')
                return
            }
            if (geoError.code === geoError.TIMEOUT) {
                locationIssue.value = buildLocationIssue(
                    'Location is taking too long to load.',
                    'Check that GPS is on and try again. If it keeps failing, open browser settings and re-enable location access.'
                )
                showToast('Location request timed out. Try again.', 'error')
                return
            }
            locationIssue.value = buildLocationIssue(
                'We could not get your location right now.',
                'Check GPS and browser location permission, then try again.'
            )
            showToast('Could not get your location right now. Try again.', 'error')
        },
        { enableHighAccuracy: true, timeout: 15000 }
    )
}

// Generic authenticated call helper — delegates to useApi so auth headers
// and base URL are handled in one place. Method + URL are passed through;
// an optional data object is serialised as JSON body.
const api = useApi()
const apiCall = async (method: string, url: string, data: Record<string, unknown> | null = null): Promise<{ data?: unknown; message?: string; success?: boolean }> => {
    const opts: RequestInit = { method }
    if (data) opts.body = JSON.stringify(data)
    try {
        return await api.request(url, opts)
    } catch (err) {
        // Preserve the legacy thrown shape callers expect.
        const raw = err as ApiError
        const shaped: ApiError = new Error(raw.message ?? 'Error')
        if (raw.status !== undefined) shaped.status = raw.status
        if (raw.data !== undefined) shaped.data = raw.data
        throw shaped
    }
}

const fetchRequestSettings = async (): Promise<void> => {
    try {
        const res = await orderRequestsService.getCustomerSettings() as { data?: { request_submission_fee?: number; request_no_response_refund_minutes?: number; first_request_free?: boolean; is_professional?: boolean } }
        requestFee.value = Number(res.data?.request_submission_fee ?? 5)
        requestRefundMinutes.value = Number(res.data?.request_no_response_refund_minutes ?? 30)
        firstRequestFree.value = Boolean(res.data?.first_request_free ?? false)
        isProfessional.value = Boolean(res.data?.is_professional ?? false)
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
            userStore.clearAuthState()
            await navigateTo('/')
            return
        }
        requestFee.value = 5
        requestRefundMinutes.value = 30
        firstRequestFree.value = false
        isProfessional.value = false
    }
}

const fetchMyRequests = async ({ silent = false }: { silent?: boolean } = {}): Promise<void> => {
    if (!silent) loadingRequests.value = true
    try {
        const res = await apiCall('GET', '/api/order-requests/customer')
        const nextRequests = (res.data ?? []) as OrderRequest[]
        myRequests.value = nextRequests

        // Keep open modal status/details in sync when admin updates a request.
        if (selectedRequest.value?.id != null) {
            const refreshed = nextRequests.find(r => r.id === selectedRequest.value!.id)
            if (refreshed) {
                selectedRequest.value = { ...selectedRequest.value, ...refreshed }
            }
        }
    } catch {
        if (!silent) showToast('Failed to load requests', 'error')
    }
    finally { if (!silent) loadingRequests.value = false }
}

const viewDetail = async (req: OrderRequest): Promise<void> => {
    try {
        const res = await apiCall('GET', `/api/order-requests/customer/${String(req.id ?? '')}`)
        selectedRequest.value = res.data as OrderRequest
        syncDecisionSelections()
        syncFeedbackForm()
    } catch { showToast('Failed to load request', 'error') }
}

const normalizeRequestId = (value: unknown): number | null => {
    const n = Number(value)
    return Number.isInteger(n) && n > 0 ? n : null
}

const openRequestById = async (requestId: unknown, options: { silent?: boolean } = {}): Promise<void> => {
    const { silent = false } = options
    const id = normalizeRequestId(requestId)
    if (!id) return
    try {
        const res = await apiCall('GET', `/api/order-requests/customer/${id}`)
        selectedRequest.value = res.data as OrderRequest
        syncDecisionSelections()
        syncFeedbackForm()
    } catch {
        if (!silent) showToast('Failed to load request', 'error')
    }
}

const refreshSelectedRequest = async (): Promise<void> => {
    if (!selectedRequest.value?.id) return
    try {
        const res = await apiCall('GET', `/api/order-requests/customer/${String(selectedRequest.value.id)}`)
        selectedRequest.value = res.data as OrderRequest
        syncDecisionSelections()
        syncFeedbackForm()
    } catch {}
}

const submitFeedback = async (): Promise<void> => {
    if (!selectedRequest.value?.id || savingFeedback.value) return
    const type = selectedRequest.value.fulfillment_type
    const f = feedbackForm.value

    let overallRating: number
    if (type === 'delivery') {
        overallRating = f.rating_overall || f.rating
        if (!f.rating_product || !f.rating_delivery || !overallRating) {
            showToast('Please rate Product quality, Delivery quality, and Overall.', 'error')
            return
        }
    } else {
        if (!f.rating_product || !f.rating_service) {
            showToast('Please rate Product quality and Customer Service.', 'error')
            return
        }
        overallRating = Math.round((f.rating_product + f.rating_service) / 2)
    }

    savingFeedback.value = true
    try {
        const body: Record<string, unknown> = {
            rating: overallRating,
            comment: f.notes?.trim() ?? '',
            rating_product: f.rating_product || null,
            rating_delivery: type === 'delivery' ? (f.rating_delivery || null) : undefined,
            rating_service: type === 'pickup' ? (f.rating_service || null) : undefined,
            rating_overall: type === 'delivery' ? (overallRating || null) : undefined,
            notes: f.notes?.trim() || null
        }
        const res = await apiCall('POST', `/api/order-requests/customer/${String(selectedRequest.value.id)}/feedback`, body)

        selectedRequest.value = {
            ...selectedRequest.value,
            feedback: res.data as RequestFeedback
        }
        syncFeedbackForm()
        showToast(res.message ?? 'Thanks for sharing your feedback')
        selectedRequest.value = null
    } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to save feedback', 'error')
    } finally {
        savingFeedback.value = false
    }
}

const fetchWalletBalance = async (): Promise<void> => {
    try {
        const res = await apiCall('GET', '/api/wallet')
        const resData = res.data as { balance?: number | string } | null
        walletBalance.value = Number(resData?.balance ?? 0)
    } catch {
        walletBalance.value = 0
    }
}

const submitMultipartRequest = (formData: FormData): Promise<{ data?: unknown; message?: string; success?: boolean }> => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${apiBase}/api/order-requests/customer`)
    xhr.setRequestHeader('Authorization', `Bearer ${userStore.customerAuthToken ?? ''}`)

    xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        uploadProgress.value = (event.loaded / event.total) * 100
    }

    xhr.onload = () => {
        try {
            const json = JSON.parse(xhr.responseText || '{}') as { success?: boolean; message?: string; data?: unknown }
            if (xhr.status >= 200 && xhr.status < 300 && json.success) {
                resolve(json)
                return
            }
            const uploadErr: ApiError = new Error(json.message ?? `Error ${xhr.status}`)
            uploadErr.status = xhr.status
            const _uploadData = json.data as Record<string, unknown> | undefined
            if (_uploadData !== undefined) uploadErr.data = _uploadData
            reject(uploadErr)
        } catch {
            reject(new Error('Failed to parse upload response'))
        }
    }

    xhr.onerror = () => reject(new Error('Upload failed. Please try again.'))
    xhr.send(formData)
})

const submitRequest = async (): Promise<void> => {
    if (!canSubmit.value) return
    isSubmitting.value = true
    uploadProgress.value = 0
    try {
        // fulfillment_type is always null at submission — the customer chooses
        // pickup vs delivery on the payment screen after sourcing completes.
        const payload = {
            items: validItems.value.map(buildItemPayload),
            customer_latitude: customerLat.value,
            customer_longitude: customerLng.value,
            fulfillment_type: null as string | null,
            delivery_address: deliveryAddress.value.trim(),
            customer_address: (customerAddress.value || deliveryAddress.value).trim(),
            customer_notes: customerNotes.value.trim(),
        }
        let res: { data?: unknown; message?: string; success?: boolean }
        if (hasMultipartUploads.value) {
            const formData = new FormData()
            formData.append('items', JSON.stringify(payload.items))
            formData.append('customer_latitude', String(payload.customer_latitude))
            formData.append('customer_longitude', String(payload.customer_longitude))
            if (payload.fulfillment_type) {
                formData.append('fulfillment_type', payload.fulfillment_type)
            }
            formData.append('delivery_address', payload.delivery_address)
            formData.append('customer_address', payload.customer_address)
            formData.append('customer_notes', payload.customer_notes)
            prescriptionFiles.value.forEach((image) => formData.append('prescription_images', image.file))
            validItems.value.forEach((item, index) => {
                item.imageFiles.forEach((image) => formData.append(`item_images_${index}`, image.file))
            })
            res = await submitMultipartRequest(formData)
        } else {
            res = await apiCall('POST', '/api/order-requests/customer', payload as unknown as Record<string, unknown>)
        }
        const resData = res.data as { request_number?: string } | null
        submittedNumber.value = resData?.request_number ?? ''
        submitShortfall.value = 0
        showPriorityModal.value = false
        showSuccess.value = true
        clearFormDraft()
        requestItems.value.forEach(cleanupItemImages)
        requestItems.value = [newItem()]
        prescriptionFiles.value.forEach(revokePrescriptionPreview)
        prescriptionFiles.value = []
        clearPrescriptionSession()
        resetPickerInput(prescriptionPicker)
        resetPickerInput(prescriptionReplacePicker)
        fulfillmentType.value = 'delivery'
        customerAddress.value = ''
        deliveryAddress.value = ''
        deliveryAddressSearch.value = ''
        clearDeliveryAddressSuggestions()
        customerNotes.value = ''
        customerLat.value = null
        customerLng.value = null
        locationMode.value = 'none'
        applySavedHomeLocation(savedHomeLocation.value, { force: true })
    } catch (err) {
        const e = err as ApiError
        if (e.status === 402) {
            submitShortfall.value = Number(e.data?.['shortfall'] ?? e.data?.['required_fee'] ?? requestFee.value)
            showToast(`Insufficient wallet balance for the GHS ${requestFee.value.toFixed(2)} Priority Search charge. Top up and try again.`, 'error')
        } else {
            showToast(e.message ?? 'Failed to submit', 'error')
        }
    }
    finally {
        uploadProgress.value = 0
        isSubmitting.value = false
    }
}

const openPriorityGate = (): void => {
    if (!canSubmit.value || isSubmitting.value) return
    submitShortfall.value = 0
    showPriorityModal.value = true
}

const confirmPriorityAndSubmit = async (): Promise<void> => {
    await submitRequest()
}

const openWalletTab = async (): Promise<void> => {
    await navigateTo({ path: '/customer', query: { tab: 'wallet' } })
}

watch(deliveryAddressSearch, (value) => {
    if (deliveryAutocompleteSuspend) {
        deliveryAutocompleteSuspend = false
        return
    }

    if (deliveryAutocompleteTimer) {
        clearTimeout(deliveryAutocompleteTimer)
        deliveryAutocompleteTimer = null
    }

    const trimmed = String(value || '').trim()
    if (!trimmed) {
        clearDeliveryAddressSuggestions()
        return
    }

    deliveryAutocompleteTimer = setTimeout(() => {
        fetchDeliveryAddressSuggestions(trimmed)
    }, 300)
})

const addItem = (): void => { requestItems.value.push(newItem()) }
const decrementQty = (item: RequestItem): void => {
    const current = Number(item?.quantity ?? 1)
    item.quantity = Math.max(1, current - 1)
}
const incrementQty = (item: RequestItem): void => {
    const current = Number(item?.quantity ?? 1)
    item.quantity = Math.max(1, current + 1)
}

const getCustomerStatus = (s: string): string => {
    if (s === 'in_transit' || s === 'out_for_delivery') return 'on the way'
    if (s === 'picked_up' || s === 'delivered') return 'completed'
    // Map legacy sourcing statuses to new names for display
    if (s === 'confirming_with_pharm' || s === 'composed') return 'sourcing'
    if (s === 'confirmed_in_pharm' || s === 'items_sourced' || s === 'confirmed') return 'payment_pending'
    if (s === 'awaiting_customer') return 'awaiting_input'
    return s ?? ''
}
const getStatusClasses = (status: string): string => {
    switch (status) {
        case 'paid': case 'verified': case 'preparing': return 'bg-green-100 text-green-700';
        case 'pending': case 'composing': return 'bg-[#efdbff] text-[#621fa4]';
        case 'sourcing': case 'searching': case 'confirming_with_pharm': case 'finding_pharmacist': return 'bg-[#f0f9ff] text-[#531dab]';
        case 'awaiting_input': case 'awaiting_customer': return 'bg-orange-100 text-orange-700';
        case 'payment_pending': case 'quote_available': return 'bg-blue-100 text-blue-700';
        case 'driver_assigned': case 'on the way': case 'in_transit': case 'out_for_delivery': return 'bg-indigo-100 text-indigo-700';
        case 'ready_for_pickup': return 'bg-teal-100 text-teal-700';
        case 'processing': return 'bg-yellow-100 text-yellow-700';
        case 'expired': return 'bg-amber-100 text-amber-700';
        case 'cancelled': case 'rejected': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}
const formatStatus = (s: string | undefined): string => getCustomerStatus(s ?? '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d: string | undefined): string => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
const riderWhatsAppNumber = (phone: string | undefined): string => {
    if (!phone) return ''
    const clean = String(phone).replace(/\D/g, '')
    if (clean.startsWith('233')) return clean
    if (clean.startsWith('0')) return '233' + clean.slice(1)
    return '233' + clean
}
const formatMoney = (v: number | string | null | undefined): string => Number(v ?? 0).toFixed(2)
const getRequestTotal = (req: OrderRequest): number | null => {
    const estimated = Number(req?.estimated_total)
    if (Number.isFinite(estimated) && estimated > 0) return estimated
    const itemsTotal = Number(req?.items_total)
    if (Number.isFinite(itemsTotal) && itemsTotal > 0) return itemsTotal
    return null
}
const getPrescriptionImageCount = (req: OrderRequest): number => Array.isArray(req?.prescription_images) ? req.prescription_images.length : 0
const shouldShowPrescriptionPreview = (req: OrderRequest): boolean => (Number(req?.item_count ?? 0) === 0) && getPrescriptionImageCount(req) > 0
const getRequestCardSummary = (req: OrderRequest): string => {
    if (shouldShowPrescriptionPreview(req)) {
        return 'Prescription attached'
    }

    const itemCount = Number(req?.item_count ?? 0)
    return itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : '-'
}
const getRequestContentCount = (req: OrderRequest): string => {
    if (shouldShowPrescriptionPreview(req)) {
        return `${getPrescriptionImageCount(req)} image${getPrescriptionImageCount(req) !== 1 ? 's' : ''}`
    }

    const itemCount = Number(req?.item_count ?? 0)
    if (itemCount > 0) return `${itemCount} item${itemCount === 1 ? '' : 's'}`
    return '-'
    // Dead code below preserved from original for diff traceability
    // return `${itemCount || '—'} item${itemCount === 1 ? '' : 's'}`
}
const getRequestStatus = (req: OrderRequest): string => {
    const rawStatus = getCustomerStatus(req?.status ?? '')
    if (payableStatuses.has(rawStatus) && getPayableAmount(req) <= 0) {
        return 'sourcing'
    }
    return rawStatus
}
const canCancelRequest = (req: OrderRequest | null): boolean => !!req && req.status === 'pending'
const clearRequestPaymentQuery = async (requestId: number | null = null): Promise<void> => {
    const nextQuery: Record<string, string | undefined> = { ...route.query as Record<string, string>, tab: 'requests' }
    delete nextQuery['reference']
    delete nextQuery['trxref']
    delete nextQuery['requestPayment']
    if (requestId) nextQuery['requestId'] = String(requestId)
    await router.replace({ query: nextQuery })
}
const loadPaymentOptions = async (requestId: number | string): Promise<void> => {
    if (!requestId) return
    if (paymentOptionsLoading.value[requestId]) return
    paymentOptionsLoading.value = { ...paymentOptionsLoading.value, [requestId]: true }
    try {
        const res = await apiCall('GET', `/api/order-requests/customer/${String(requestId)}/payment-options`)
        const resData = res.data as PaymentOptions
        paymentOptionsByRequest.value = { ...paymentOptionsByRequest.value, [requestId]: resData }
        const serverSelected = resData?.selected
        if (serverSelected && !selectedPaymentMethodByRequest.value[requestId]) {
            selectedPaymentMethodByRequest.value = {
                ...selectedPaymentMethodByRequest.value,
                [requestId]: serverSelected
            }
        }
        if (resData?.fee_applicable && !(requestId in applyFeeByRequest.value)) {
            applyFeeByRequest.value = { ...applyFeeByRequest.value, [requestId]: false }
        }
    } catch (err) {
        console.warn('Failed to load payment options', err)
    } finally {
        const next = { ...paymentOptionsLoading.value }
        delete next[requestId]
        paymentOptionsLoading.value = next
    }
}

const choosePaymentMethod = (requestId: number | string, method: string): void => {
    if (!requestId || !['pickup', 'delivery'].includes(method)) return
    const opts = paymentOptionsByRequest.value[requestId]
    if (method === 'pickup' && opts && !opts.pickup?.available) return
    selectedPaymentMethodByRequest.value = {
        ...selectedPaymentMethodByRequest.value,
        [requestId]: method
    }
}

const requiresMethodSelection = (request: OrderRequest | null): boolean => {
    if (!request) return false
    return !request.fulfillment_type
}

const canPayWithSelection = (request: OrderRequest | null): boolean => {
    if (!request) return false
    if (!requiresMethodSelection(request)) return true
    return Boolean(request.id != null && selectedPaymentMethodByRequest.value[request.id])
}

// Live total reflecting the chosen fulfillment method and fee preference.
// Returns null while the customer hasn't yet picked pickup/delivery (em-dash in UI).
const selectedMethodTotal = computed<number | null>(() => {
    const req = selectedRequest.value
    if (!req) return null
    const reqId = req.id
    if (reqId == null) return null
    const opts = paymentOptionsByRequest.value[reqId]
    if (!opts) return null

    // Fulfillment method: either already locked on the request or actively chosen by the customer
    const method = req.fulfillment_type ?? selectedPaymentMethodByRequest.value[reqId]
    // If method selection is still required but none chosen yet, show nothing
    if (requiresMethodSelection(req) && !selectedPaymentMethodByRequest.value[reqId]) return null

    const applyFee = applyFeeByRequest.value[reqId] !== false // default true
    if (method === 'pickup' && opts.pickup?.available) {
        const total = applyFee ? opts.pickup.total_fee_applied : opts.pickup.total
        return total != null ? Number(total) : null
    }
    if (method === 'delivery') {
        const total = applyFee ? opts.delivery?.total_fee_applied : opts.delivery?.total
        return total != null ? Number(total) : null
    }
    return null
})

const formatPickupReason = (reason: string | undefined): string => {
    switch (reason) {
        case 'multi_pharmacy': return 'Pickup is only available when one pharmacy fulfills the whole order'
        case 'closed': return 'The pharmacy is currently closed'
        case 'outside_buffer': return 'The pharmacy is closing too soon for pickup'
        case 'no_pharmacy': return 'No pharmacy is yet sourced'
        default: return 'Pickup is not available right now'
    }
}

const submitFulfillmentChoice = async (requestId: number | string, method: string): Promise<{ data?: unknown; message?: string }> => {
    const res = await apiCall('PUT', `/api/order-requests/customer/${String(requestId)}/fulfillment`, {
        fulfillment_type: method
    })
    if (selectedRequest.value?.id === requestId) {
        selectedRequest.value = {
            ...selectedRequest.value,
            fulfillment_type: method,
            status: 'payment_pending'
        }
    }
    return res
}

const payForRequest = async (id: number | string, method = 'wallet'): Promise<void> => {
    if (!id || payingRequest.value) return

    const request = selectedRequest.value
    if (requiresMethodSelection(request)) {
        const chosen = selectedPaymentMethodByRequest.value[id]
        if (!chosen) {
            showToast('Please select pickup or delivery first', 'error')
            return
        }
        try {
            await submitFulfillmentChoice(id, chosen)
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Could not save your fulfillment choice', 'error')
            return
        }
    }

    payingRequest.value = true
    payingMethod.value = method
    try {
        paymentShortfall.value = { requestId: null, amount: 0 }

        const opts = paymentOptionsByRequest.value[id]
        const feeApplicable = Boolean(opts?.fee_applicable)
        const applyFee = feeApplicable ? applyFeeByRequest.value[id] !== false : undefined
        const payBody = feeApplicable ? { apply_fee: applyFee } : undefined

        if (method === 'paystack') {
            const res = await apiCall('POST', `/api/order-requests/customer/${String(id)}/pay/paystack/initialize`, payBody as Record<string, unknown> | undefined ?? null)
            const resData = res.data as { authorization_url?: string } | null
            if (!resData?.authorization_url) {
                throw new Error('Paystack checkout could not be started')
            }
            window.location.assign(resData.authorization_url)
            return
        }

        const res = await apiCall('POST', `/api/order-requests/customer/${String(id)}/pay`, payBody as Record<string, unknown> | undefined ?? null)
        await fetchMyRequests({ silent: true })
        if (selectedRequest.value?.id === id) {
            await refreshSelectedRequest()
        }
        selectedRequest.value = null
        showPaymentSuccessAnim.value = true
        showToast(res.message ?? 'Payment completed successfully')
    } catch (err) {
        const e = err as ApiError
        if (method === 'wallet' && e.status === 402 && e.data) {
            const shortfall = Number(e.data['shortfall'] ?? 0)
            paymentShortfall.value = {
                requestId: id,
                amount: shortfall > 0 ? shortfall : Number(getPayableAmount(selectedRequest.value) ?? 0)
            }
            showToast(`Insufficient wallet balance. Top up GHS ${shortfall.toFixed(2)} to continue.`, 'error')
        } else {
            showToast(e.message ?? `Failed to start ${method === 'paystack' ? 'Paystack' : 'wallet'} payment`, 'error')
        }
    } finally {
        payingRequest.value = false
        payingMethod.value = ''
    }
}

const verifyReturnedPaystackRequestPayment = async (): Promise<void> => {
    const paymentMarker = String(route.query['requestPayment'] ?? '').trim().toLowerCase()
    const reference = String(route.query['reference'] ?? route.query['trxref'] ?? '').trim()
    const requestId = normalizeRequestId(route.query['requestId'] ?? props.initialRequestId)

    if (paymentMarker !== 'paystack' || !reference || !requestId || payingRequest.value) return

    payingRequest.value = true
    payingMethod.value = 'paystack'
    try {
        const res = await apiCall('POST', `/api/order-requests/customer/${requestId}/pay/paystack/verify`, {
            reference
        })
        await fetchWalletBalance()
        await fetchMyRequests({ silent: true })
        await openRequestById(requestId, { silent: true })
        selectedRequest.value = null
        showPaymentSuccessAnim.value = true
        showToast(res.message ?? 'Payment completed successfully')
    } catch (err) {
        await fetchWalletBalance()
        await fetchMyRequests({ silent: true })
        await openRequestById(requestId, { silent: true })
        showToast(err instanceof Error ? err.message : 'Failed to verify Paystack payment', 'error')
    } finally {
        await clearRequestPaymentQuery(requestId)
        payingRequest.value = false
        payingMethod.value = ''
    }
}

const respondToDecision = async (decision: RequestDecision, response: string): Promise<void> => {
    if (!selectedRequest.value?.id || !decision?.id || respondingDecisionId.value) return

    respondingDecisionId.value = decision.id
    try {
        const res = await apiCall('POST', `/api/order-requests/customer/${String(selectedRequest.value.id)}/decisions/${String(decision.id)}/respond`, {
            response,
            selected_items: response === 'approved' ? (decisionSelections.value[decision.id as string | number] ?? {}) : {}
        })
        showToast(res.message ?? (response === 'approved' ? 'Decision approved' : 'Decision declined'))
        await fetchMyRequests({ silent: true })
        await refreshSelectedRequest()
    } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to respond to request decision', 'error')
    } finally {
        respondingDecisionId.value = null
    }
}

const getDecisionContext = (decision: RequestDecision): string | null => {
    return decision?.payload?.summary?.decision_context ?? null
}

const getDecisionItems = (decision: RequestDecision): DecisionItem[] => {
    return Array.isArray(decision?.payload?.decision_items) ? decision.payload.decision_items : []
}

const syncDecisionSelections = (): void => {
    const pendingDecisions = Array.isArray(selectedRequest.value?.pending_decisions) ? selectedRequest.value!.pending_decisions! : []
    const nextState: Record<string | number, Record<string, string>> = {}

    pendingDecisions.forEach((decision) => {
        const decId = decision.id as string | number
        const existing = decisionSelections.value[decId] ?? {}
        const itemSelections: Record<string, string> = {}
        getDecisionItems(decision).forEach((item) => {
            const itemId = String(item.item_id)
            itemSelections[itemId] = existing[itemId] ?? item.default_choice ?? 'keep'
        })
        nextState[decId] = itemSelections
    })

    decisionSelections.value = nextState
}

const getDecisionItemChoices = (item: DecisionItem): Array<{ value: string; label: string }> => {
    if (item?.status === 'substitute_available' && item?.substitute_option) {
        return [
            { value: 'substitute', label: 'Use Alternative' },
            { value: 'remove', label: 'Remove Item' }
        ]
    }

    if (item?.status === 'unavailable') {
        return [
            { value: 'remove', label: 'Remove Item' }
        ]
    }

    return [
        { value: 'keep', label: 'Keep Item' },
        { value: 'remove', label: 'Remove Item' }
    ]
}

const getDecisionChoice = (decision: RequestDecision, item: DecisionItem): string => {
    const decId = decision?.id as string | number | undefined
    if (decId == null) return item?.default_choice ?? 'keep'
    return decisionSelections.value[decId]?.[String(item?.item_id)] ?? item?.default_choice ?? 'keep'
}

const setDecisionChoice = (decision: RequestDecision, item: DecisionItem, choice: string): void => {
    if (!decision?.id || !item?.item_id) return
    const decId = decision.id as string | number
    if (!decisionSelections.value[decId]) {
        decisionSelections.value[decId] = {}
    }
    decisionSelections.value[decId]![String(item.item_id)] = choice
}

const getDecisionPreviewTotal = (decision: RequestDecision): number => {
    return getDecisionItems(decision).reduce((sum, item) => {
        const choice = getDecisionChoice(decision, item)
        const quantity = Number(item.quantity ?? 0)

        if (choice === 'remove') return sum

        if (choice === 'substitute' && item.substitute_option?.marked_up_price != null) {
            return sum + (Number(item.substitute_option.marked_up_price) * quantity)
        }

        if (item.unit_price != null) {
            return sum + (Number(item.unit_price) * quantity)
        }

        return sum
    }, 0)
}

const getDecisionDistanceText = (item: DecisionItem | null | undefined): string => {
    if (!item) return ''
    const primaryDistance = Number(item.distance_km)
    if (Number.isFinite(primaryDistance) && primaryDistance > 0) {
        return `${primaryDistance.toFixed(1)} km away`
    }

    const distances = Array.isArray(item.source_distances_km)
        ? (item.source_distances_km as Array<number | string>)
            .map((distance) => Number(distance))
            .filter((distance) => Number.isFinite(distance) && distance > 0)
        : []

    if (distances.length) {
        const nearest = [...new Set(distances.map((distance) => Number(distance.toFixed(1))))].sort((a, b) => a - b)[0]
        return `${(nearest ?? 0).toFixed(1)} km away`
    }

    return ''
}

const getPrimaryDecisionSourceId = (item: DecisionItem): number | null => {
    const directId = Number(item?.source_pharmacy_id ?? 0)
    if (Number.isInteger(directId) && directId > 0) return directId

    if (Array.isArray(item?.source_pharmacy_ids)) {
        const fallback = (item.source_pharmacy_ids as Array<number | string>)
            .map((id) => Number(id))
            .find((id) => Number.isInteger(id) && id > 0)
        if (fallback != null) return fallback
    }

    return null
}

const getDecisionSourceMap = (decision: RequestDecision): Map<number, string> => {
    const items = getDecisionItems(decision)
    const orderedSourceIds: number[] = []
    const sourceSet = new Set<number>()
    const pushSourceId = (value: unknown): void => {
        const id = Number(value ?? 0)
        if (!Number.isInteger(id) || id <= 0) return
        if (sourceSet.has(id)) return
        sourceSet.add(id)
        orderedSourceIds.push(id)
    }

    // 1) Prioritize primary sources used by visible direct-available item rows.
    items.forEach((item) => {
        if (!isDecisionItemDirectlyAvailable(item)) return
        pushSourceId(getPrimaryDecisionSourceId(item))
    })

    // 2) Then include remaining fallback/substitute sources.
    items.forEach((item) => {
        pushSourceId(getPrimaryDecisionSourceId(item))
        const substituteId = Number(item?.substitute_option?.source_pharmacy_id ?? 0)
        pushSourceId(substituteId)
    })

    const map = new Map<number, string>()
    orderedSourceIds.forEach((id, index) => {
        map.set(id, `Source ${index + 1}`)
    })
    return map
}

const getDecisionSourceSummary = (decision: RequestDecision): { count: number; isSplit: boolean } => {
    const summaryCount = Number(decision?.payload?.summary?.source_pharmacy_count ?? 0)
    const map = getDecisionSourceMap(decision)
    const count = summaryCount > 0 ? summaryCount : map.size
    return {
        count,
        isSplit: count > 1
    }
}

const getDecisionHumanSummary = (decision: RequestDecision): string[] => {
    const items = getDecisionItems(decision)
    if (!items.length) return []

    const sourceSummary = getDecisionSourceSummary(decision)
    const decisionContext = getDecisionContext(decision)
    const availableCount = items.filter((item) => item?.status === 'available').length
    const substituteCount = items.filter((item) => item?.status === 'substitute_available').length
    const unavailableCount = items.filter((item) => item?.status === 'unavailable').length
    const lines: string[] = []
    const shouldIncludeSourceCountForAvailable = sourceSummary.count > 0
        && ['partial_availability', 'mixed_availability'].includes(decisionContext ?? '')

    if (availableCount > 0 && (sourceSummary.count > 1 || shouldIncludeSourceCountForAvailable)) {
        lines.push(
            `${availableCount} item${availableCount > 1 ? 's are' : ' is'} currently available from ${sourceSummary.count} nearby pharmac${sourceSummary.count === 1 ? 'y' : 'ies'}.`
        )
    } else if (availableCount > 0) {
        lines.push(`${availableCount} item${availableCount > 1 ? 's are' : ' is'} currently available.`)
    }

    if (substituteCount > 0) {
        lines.push(`${substituteCount} item${substituteCount > 1 ? 's have' : ' has'} alternative option${substituteCount > 1 ? 's' : ''} for you to review.`)
    }

    if (unavailableCount > 0) {
        lines.push(`${unavailableCount} item${unavailableCount > 1 ? 's are' : ' is'} currently unavailable.`)
    }

    if (!lines.length) {
        lines.push('Please review each item and confirm how you want to proceed.')
    }

    return lines
}

const getDecisionConciseSummary = (decision: RequestDecision): string => {
    const items = getDecisionItems(decision)
    if (!items.length) return ''

    const total = items.length
    const available = items.filter((item) => isDecisionItemDirectlyAvailable(item)).length
    const withSubstitute = items.filter((item) => item?.status === 'substitute_available' && item?.substitute_option).length
    const unavailable = items.filter((item) => item?.status === 'unavailable').length
    const sourceSummary = getDecisionSourceSummary(decision)

    const parts: string[] = []
    if (available > 0) {
        const sourcePart = sourceSummary.count > 1
            ? `from ${sourceSummary.count} nearby pharmacies`
            : 'from 1 nearby pharmacy'
        parts.push(`${available}/${total} item${total > 1 ? 's' : ''} available ${sourcePart}`)
    }
    if (withSubstitute > 0) {
        parts.push(`${withSubstitute} item${withSubstitute > 1 ? 's have' : ' has'} alternative options`)
    }
    if (unavailable > 0) {
        parts.push(`${unavailable} item${unavailable > 1 ? 's are' : ' is'} unavailable`)
    }

    if (!parts.length) return 'Please review the items below and choose how you want to continue.'
    return `${parts.join('. ')}.`
}

const isDecisionItemDirectlyAvailable = (item: DecisionItem | Record<string, unknown> = {}): boolean => {
    const status = String((item as DecisionItem)?.status ?? '').toLowerCase()
    if (status === 'unavailable' || status === 'substitute_available') return false
    if ((item as DecisionItem)?.unit_price != null) return true
    return ['available', 'ready_to_order', 'ordered', 'allocated', 'partially_allocated'].includes(status)
}

const shouldShowDecisionItemPrice = (item: DecisionItem | Record<string, unknown> = {}): boolean => {
    return isDecisionItemDirectlyAvailable(item) && (item as DecisionItem)?.unit_price != null
}

const getDecisionFlowHeadline = (decision: RequestDecision): string => {
    const items = getDecisionItems(decision)
    if (!items.length) return ''

    const available = items.filter((item) => isDecisionItemDirectlyAvailable(item)).length
    const withSubstitute = items.filter((item) => item?.status === 'substitute_available' && item?.substitute_option).length
    const unavailable = items.filter((item) => item?.status === 'unavailable').length
    const total = items.length
    const sourceSummary = getDecisionSourceSummary(decision)

    if (sourceSummary.count > 1 && withSubstitute > 0) {
        return `${available}/${total} items are available from ${sourceSummary.count} nearby pharmacies, and ${withSubstitute} item${withSubstitute > 1 ? 's have' : ' has'} alternative options to review.`
    }

    if (sourceSummary.count > 1 && unavailable > 0) {
        return `${available}/${total} items are available from ${sourceSummary.count} nearby pharmacies, and ${unavailable} item${unavailable > 1 ? 's are' : ' is'} not available right now.`
    }

    if (sourceSummary.count > 1) {
        return `Your request can be completed from ${sourceSummary.count} nearby pharmacies. Review each item below and confirm how you want to continue.`
    }

    if (withSubstitute > 0) {
        return `${available}/${total} items are available now. ${withSubstitute} item${withSubstitute > 1 ? 's have' : ' has'} an alternative for you to review.`
    }

    if (unavailable > 0) {
        return `${available}/${total} items are available now. ${unavailable} item${unavailable > 1 ? 's are' : ' is'} not available right now.`
    }

    return ''
}

const getDecisionItemSourceLabel = (decision: RequestDecision, item: DecisionItem): string => {
    const map = getDecisionSourceMap(decision)
    const primaryId = getPrimaryDecisionSourceId(item)
    return primaryId ? (map.get(primaryId) ?? '') : ''
}

const getDecisionItemRouteText = (decision: RequestDecision, item: DecisionItem): string => {
    if (!item || !isDecisionItemDirectlyAvailable(item)) return ''
    const sourceText = getDecisionItemSourceLabel(decision, item) || 'Nearby source'
    const distanceText = getDecisionDistanceText(item)
    if (sourceText && distanceText) return `${sourceText} - ${distanceText}`
    return sourceText || distanceText || ''
}

const getDecisionSubstituteSourceLabel = (decision: RequestDecision, item: DecisionItem): string => {
    const substituteId = Number(item?.substitute_option?.source_pharmacy_id ?? 0)
    if (!Number.isInteger(substituteId) || substituteId <= 0) return ''
    const map = getDecisionSourceMap(decision)
    const label = map.get(substituteId)
    return label ? `${label} (alternative)` : ''
}

const getDecisionSubstituteRouteText = (decision: RequestDecision, item: DecisionItem): string => {
    if (!item?.substitute_option) return ''
    const sourceText = getDecisionSubstituteSourceLabel(decision, item) || 'Nearby source (alternative)'
    const distance = Number(item.substitute_option.distance_km)
    const distanceText = Number.isFinite(distance) && distance > 0
        ? `${distance.toFixed(1)} km away`
        : ''
    if (sourceText && distanceText) return `${sourceText} - ${distanceText}`
    return sourceText || distanceText || ''
}

const getDecisionVariantClass = (decision: RequestDecision): string => {
    const context = getDecisionContext(decision)
    if (context === 'mixed_availability') return 'warning'
    if (context === 'partial_availability') return 'warning'
    if (context === 'split_fulfillment') return 'info'
    if (decision?.decision_type === 'substitute_approval') return 'success'
    if (decision?.decision_type === 'quantity_split') return 'info'
    return 'neutral'
}

const getDecisionEyebrow = (decision: RequestDecision): string => {
    const context = getDecisionContext(decision)
    if (context === 'mixed_availability') return 'Action Needed'
    if (context === 'partial_availability') return 'Partial Availability'
    if (context === 'split_fulfillment') return 'Split Fulfillment'
    if (decision?.decision_type === 'substitute_approval') return 'Alternative Approval'
    if (decision?.decision_type === 'quantity_split') return 'Quantity Split'
    return 'Customer Decision'
}

const getDecisionApproveLabel = (decision: RequestDecision): string => {
    const context = getDecisionContext(decision)
    if (context === 'mixed_availability') return 'Apply My Choices'
    if (context === 'partial_availability') return 'Continue with Available Items'
    if (context === 'split_fulfillment') return 'Continue with Split Order'
    if (decision?.decision_type === 'substitute_approval') return 'Approve Alternatives'
    if (decision?.decision_type === 'quantity_split') return 'Approve Split'
    return 'Approve'
}

const getDecisionDeclineLabel = (decision: RequestDecision): string => {
    const context = getDecisionContext(decision)
    if (context === 'mixed_availability') return 'Cancel Request'
    if (context === 'partial_availability') return 'Cancel Request'
    if (context === 'split_fulfillment') return 'Cancel Request'
    if (decision?.decision_type === 'substitute_approval') return 'Reject Alternatives'
    if (decision?.decision_type === 'quantity_split') return 'Reject Split'
    return 'Decline'
}

const pendingCancelRequestId = ref<number | string | null>(null)

const requestCancelConfirmation = (id: number | string): void => {
    if (!id || cancelingRequest.value) return
    pendingCancelRequestId.value = id
}

const performCancelRequest = async (): Promise<void> => {
    const id = pendingCancelRequestId.value
    if (!id || cancelingRequest.value) return

    cancelingRequest.value = true
    try {
        const res = await apiCall('PUT', `/api/order-requests/customer/${String(id)}/cancel`)
        pendingCancelRequestId.value = null
        showToast(res.message ?? 'Request cancelled')
        await fetchMyRequests({ silent: true })
        if (selectedRequest.value?.id === id) {
            await refreshSelectedRequest()
        }
    } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to cancel request', 'error')
    } finally {
        cancelingRequest.value = false
    }
}
const statusProgress = (s: string): number => (({
    // New lifecycle
    pending: 10,
    composing: 15,
    sourcing: 25,
    awaiting_input: 40,
    payment_pending: 50,
    paid: 65,
    preparing: 75,
    ready_for_pickup: 80,
    driver_assigned: 82,
    in_transit: 90,
    picked_up: 100,
    delivered: 100,
    returned: 100,
    expired: 100,
    cancelled: 100,
    // Legacy values mapped for backward compatibility
    processing: 25,
    confirming_with_pharm: 25,
    composed: 15,
    confirmed_in_pharm: 50,
    items_sourced: 50,
    awaiting_customer: 40,
    confirmed: 65,
    out_for_delivery: 90,
    logistics_pending: 70,
    driver_unavailable: 70,
    completed: 100
} as Record<string, number>)[s] ?? 10)
const showToast = (text: string, type = 'success'): void => { toast.value = { text, type }; setTimeout(() => { toast.value = null }, 4000) }

onMounted(async () => {
    await restorePrescriptionsFromSession()
    await loadSavedHomeLocation()
    await fetchRequestSettings()
    await fetchWalletBalance()
    if (isNewView.value && !props.initialRequestId) {
        applyHomepageRequestDraft(consumeHomepageRequestDraft())
        await consumeHomepagePrescriptionDraft()
        // Restore form auto-save draft if no homepage draft was applied
        restoreFormDraft()
    }
    if (isListView.value || props.initialRequestId) {
        await fetchMyRequests()
        await openRequestById(props.initialRequestId, { silent: true })
    }
    await verifyReturnedPaystackRequestPayment()

    pollTimer = setInterval(async () => {
        if (!isListView.value) return
        await fetchMyRequests({ silent: true })
        await refreshSelectedRequest()
    }, POLL_INTERVAL_MS)
})

watch(
    () => props.initialRequestId,
    async (nextId, prevId) => {
        if (!nextId || nextId === prevId) return
        await fetchMyRequests({ silent: true })
        await openRequestById(nextId, { silent: true })
    }
)

watch(
    () => `${String(route.query['requestPayment'] ?? '')}|${String(route.query['reference'] ?? route.query['trxref'] ?? '')}|${String(route.query['requestId'] ?? '')}`,
    async () => {
        await verifyReturnedPaystackRequestPayment()
    }
)

// Auto-save form draft when form fields change
watchEffect(() => {
    // Only setup auto-save in new view
    if (!isNewView.value) return

    // Access all form fields to track dependencies
    requestItems.value.map(i => `${i.product_name}|${i.requested_unit}|${i.quantity}`).join(';')
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    fulfillmentType.value
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    customerAddress.value
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    deliveryAddress.value
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    customerNotes.value
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    customerLat.value
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    customerLng.value
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    locationMode.value

    // Trigger debounced save
    debouncedSaveFormDraft()
})

onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)
    if (deliveryAutocompleteTimer) clearTimeout(deliveryAutocompleteTimer)
    prescriptionFiles.value.forEach(revokePrescriptionPreview)
    requestItems.value.forEach(cleanupItemImages)
})

defineExpose({ fetchMyRequests })

// Suppress unused-variable warnings for imported utils that are used in template
void isPaymentPendingRequest
</script>

<style scoped>
.order-requests {
    padding: 0.35rem 0 1rem;
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
    overflow-x: clip;
}

/* Heroicon SVG sizing */
.tab-svg {
    width: 18px;
    height: 18px;
    display: inline;
    vertical-align: middle;
}

.step-svg {
    width: 16px;
    height: 16px;
}

.rm-svg {
    width: 16px;
    height: 16px;
}

.add-svg {
    width: 16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
}

.prescription-svg {
    width: 24px;
    height: 24px;
    color: #3b82f6;
    margin-top: 2px;
    flex-shrink: 0;
}

.upload-svg {
    width: 16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
}

.loc-svg {
    width: 22px;
    height: 22px;
}

.location-check-svg {
    width: 24px;
    height: 24px;
    color: #22c55e;
    flex-shrink: 0;
}

.attach-svg {
    width: 16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
}

.info-svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.nav-svg {
    width: 16px;
    height: 16px;
    display: inline;
    vertical-align: middle;
}

.load-svg {
    width: 18px;
    height: 18px;
    display: inline;
    vertical-align: middle;
}

.empty-svg {
    width: 2rem;
    height: 2rem;
    color: #d1d5db;
    margin: 0 auto;
}

.meta-svg {
    width: 14px;
    height: 14px;
    display: inline;
    vertical-align: middle;
}

.close-svg {
    width: 20px;
    height: 20px;
}

.ful-svg {
    width: 24px;
    height: 24px;
}

.detail-svg {
    width: 18px;
    height: 18px;
    display: inline;
    vertical-align: middle;
    flex-shrink: 0;
}

.success-svg {
    width: 32px;
    height: 32px;
}

.request-arrow {
    width: 18px;
    height: 18px;
    color: #94a3b8;
    flex-shrink: 0;
}

/* Sub-tabs */
.sub-tabs {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1.5rem;
    padding: 0.4rem;
    background: linear-gradient(180deg, #fffdfd, #f7f2fb);
    border: 1px solid #eadff0;
    border-radius: 1.15rem;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
}

.sub-tabs::-webkit-scrollbar {
    display: none;
}

.sub-tab {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.5rem;
    padding: 0.95rem 1.15rem;
    background: transparent;
    border: none;
    color: #6b7280;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    border-radius: 0.95rem;
}

.sub-tab:hover {
    color: #6c24b3;
}

.sub-tab.active {
    color: #350062;
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(53, 0, 98, 0.08);
}

.badge {
    background: #efe4fb;
    color: #6c24b3;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.18rem 0.45rem;
    border-radius: 9999px;
    margin-left: 0.1rem;
}

/* Shell header */
.request-shell-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.35rem;
    padding-bottom: 1.1rem;
    border-bottom: 1px solid #ece4ef;
}

.request-shell-head.compact {
    margin-bottom: 1rem;
}

.new-request-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.95fr);
    gap: 1rem;
    margin-bottom: 1.4rem;
    padding: 1.2rem 1.25rem;
    border: 1px solid #ece2f2;
    border-radius: 22px;
    background:
        radial-gradient(circle at top right, rgba(177, 132, 228, 0.16), transparent 34%),
        linear-gradient(180deg, #fefcff 0%, #f8f3fb 100%);
}

.new-request-hero-copy {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    justify-content: center;
}

.new-request-title {
    margin: 0;
    font-size: 1.8rem;
    line-height: 1.08;
    font-weight: 700;
    color: #350062;
    max-width: 14ch;
}

.new-request-desc {
    margin: 0;
    max-width: 44rem;
    font-size: 0.94rem;
    line-height: 1.65;
    color: #6f5f7a;
}

.new-request-hero-panel {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
}

.hero-panel-item {
    padding: 0.9rem 1rem;
    border-radius: 18px;
    border: 1px solid #eadff0;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 10px 24px rgba(53, 0, 98, 0.04);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.hero-panel-item.muted {
    grid-column: 1 / -1;
    background: linear-gradient(180deg, #fcf8ff, #f7f0fb);
}

.hero-panel-item span {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #7b3dbd;
}

.hero-panel-item strong {
    font-size: 1.05rem;
    font-weight: 700;
    color: #2f1d43;
}

.shell-eyebrow {
    margin: 0 0 0.3rem;
    font-size: 0.68rem;
    font-weight: 800;
    color: #7b3dbd;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.shell-title {
    margin: 0;
    font-size: 1.6rem;
    line-height: 1.15;
    font-weight: 700;
    color: #350062;
}

.shell-copy {
    margin: 0.4rem 0 0;
    font-size: 0.92rem;
    line-height: 1.5;
    color: #6f5f7a;
    max-width: 40rem;
}

.shell-stats {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
}

.shell-pill {
    min-width: 5.25rem;
    padding: 0.8rem 0.9rem;
    border-radius: 1rem;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border: 1px solid #bfdbfe;
    color: #1e3a8a;
}

.shell-pill.muted {
    background: linear-gradient(135deg, #f8fafc, #eef2ff);
    border-color: #dbe4ee;
    color: #334155;
}

.shell-pill span {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.8;
}

.shell-pill strong {
    display: block;
    font-size: 1.05rem;
    font-weight: 800;
}

/* Step bar */
.step-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #0f766e, #2563eb);
    margin: 0 0 1.25rem 0;
    border-radius: 14px;
    box-shadow: 0 16px 30px rgba(37, 99, 235, 0.14);
}

.step-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.step-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.3s;
}

.step-item.active .step-dot,
.step-item.done .step-dot {
    background: white;
    color: #667eea;
    transform: scale(1.1);
}

.step-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
}

.step-item.active .step-label {
    color: white;
}

.step-line {
    width: 40px;
    height: 2px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 1px;
}

.step-line.filled {
    background: rgba(255, 255, 255, 0.8);
}

/* Step content */
.form-section,
.list-section {
    padding: 1.55rem 1.75rem 1.8rem;
    background: linear-gradient(180deg, #ffffff, #fcf9ff);
    border: 1px solid #eadff0;
    border-radius: 24px;
    box-shadow: 0 18px 40px rgba(53, 0, 98, 0.07);
}

.step-content {
    animation: fadeIn 0.2s ease;
}

.editor-section {
    margin-bottom: 1rem;
}

.editor-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
}

.editor-section-badge {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.8rem;
    border-radius: 999px;
    background: #f4ecfb;
    color: #6c24b3;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.04em;
}

.step-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #350062;
    margin: 0 0 0.25rem;
}

.step-desc {
    font-size: 0.93rem;
    color: #6f5f7a;
    margin: 0 0 1.4rem;
}

.search-lock-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    border: 1px solid #fde68a;
    background: linear-gradient(180deg, #fffbeb, #fef3c7);
}

.search-lock-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.search-lock-copy strong {
    font-size: 0.88rem;
    color: #92400e;
}

.search-lock-copy span {
    font-size: 0.79rem;
    line-height: 1.5;
    color: #b45309;
}

.editor-card {
    margin-bottom: 1rem;
    padding: 1.1rem 1.15rem;
    border: 1px solid #ebe1f0;
    border-radius: 20px;
    background: linear-gradient(180deg, #fffeff, #fbf7fd);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.editor-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.9rem;
}

.editor-card-head h4 {
    margin: 0.2rem 0 0;
    font-size: 1rem;
    line-height: 1.35;
    color: #2f1d43;
    font-weight: 700;
}

.editor-card-kicker {
    display: inline-flex;
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #7b3dbd;
}

.editor-card-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45rem 0.75rem;
    border-radius: 999px;
    background: #f5f0f8;
    color: #6f5f7a;
    font-size: 0.72rem;
    font-weight: 800;
}

.editor-card-status.ready {
    background: #e9f9ef;
    color: #1f8a45;
}

.request-builder-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(340px, 0.95fr);
    gap: 1rem;
    margin-top: 1rem;
    align-items: start;
}

.builder-card {
    padding: 1.2rem;
    border-radius: 20px;
    border: 1px solid #e4ddeb;
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(251, 247, 253, 0.98));
    box-shadow: 0 14px 32px rgba(53, 0, 98, 0.05);
}

.builder-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.1rem;
}

.builder-title {
    margin: 0;
    font-size: 1.06rem;
    font-weight: 700;
    color: #350062;
}

.builder-copy {
    margin: 0.35rem 0 0;
    font-size: 0.86rem;
    line-height: 1.55;
    color: #6f5f7a;
}

.review-card {
    position: sticky;
    top: 1.25rem;
    background:
        linear-gradient(180deg, rgba(252, 249, 255, 0.98), rgba(246, 241, 250, 0.98));
    overflow: hidden;
}

.request-submit-bar {
    margin-top: 0.5rem;
    padding: 1.05rem 1.15rem;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border: 1px solid #cbd5e1;
    background: linear-gradient(135deg, #0f172a, #1e293b 58%, #334155);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.14);
}

.request-submit-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.request-submit-copy strong {
    color: #f8fafc;
    font-size: 0.95rem;
    font-weight: 700;
}

.request-submit-copy span {
    color: rgba(226, 232, 240, 0.86);
    font-size: 0.8rem;
    line-height: 1.5;
}

.request-submit-btn {
    flex-shrink: 0;
    min-width: 240px;
    white-space: nowrap;
    background: linear-gradient(135deg, #2563eb, #4f46e5);
}

/* Items list */
.items-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.item-row {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    background: linear-gradient(180deg, #fcfbfd, #f7f3fa);
    border: 1px solid #e9e2ee;
    border-radius: 18px;
    padding: 0.9rem 1rem;
}

.item-main {
    flex: 1;
    min-width: 0;
}

.item-search-shell {
    background: #ffffff;
    border: 1px solid #dbe4f0;
    border-radius: 16px;
    padding: 0.9rem 1rem;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.item-search-shell.locked {
    background: #f8fafc;
    border-color: #e2e8f0;
}

.item-search-head {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    margin-bottom: 0.45rem;
}

.item-search-head strong {
    font-size: 0.8rem;
    color: #1e293b;
    letter-spacing: 0.02em;
}

.item-search-head span {
    font-size: 0.73rem;
    color: #64748b;
    line-height: 1.35;
}

.item-num {
    width: 28px;
    height: 28px;
    background: #e0e7ff;
    color: #4f46e5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.item-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.95rem;
    color: #111827;
    outline: none;
    font-weight: 600;
}

.item-input::placeholder {
    color: #94a3b8;
}

.input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f8fafc;
    border: 1px solid #dbe4f0;
    border-radius: 12px;
    padding: 0.75rem 0.85rem;
    position: relative;
}

.input-wrap .item-input {
    flex: 1;
    min-width: 0;
}

.search-chip {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.3rem 0.55rem;
    border-radius: 999px;
    background: #ede9fe;
    color: #5b34a5;
    font-size: 0.67rem;
    font-weight: 800;
    letter-spacing: 0.04em;
}

.search-chip.searching {
    background: #f0e6fa;
    color: #6c24b3;
}

.item-upload-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.55rem;
}

.item-upload-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #c4a8e8;
    background: #f7f0fb;
    color: #6c24b3;
    border-radius: 999px;
    width: 2.1rem;
    height: 2.1rem;
    flex-shrink: 0;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
}

.item-upload-count {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 1rem;
    height: 1rem;
    padding: 0 3px;
    background: #520094;
    color: #fff;
    border-radius: 999px;
    font-size: 0.6rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.item-upload-btn:hover {
    border-color: #350062;
    background: #ede0f5;
    color: #350062;
}

.item-upload-note {
    font-size: 0.75rem;
    color: #64748b;
}

.item-image-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 0.65rem;
}

.item-image-card {
    width: 92px;
    border: 1px solid #dbe4f0;
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
}

.item-image-preview {
    width: 100%;
    height: 72px;
    object-fit: cover;
    display: block;
}

.item-image-actions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.4rem;
}

.clickable-input-wrap {
    cursor: text;
    min-height: 3rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.item-search-icon {
    width: 1rem;
    height: 1rem;
    color: #64748b;
    flex-shrink: 0;
}

.search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 200;
    margin-top: 4px;
    max-height: 200px;
    overflow-y: auto;
}

.search-dropdown-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.65rem 0.8rem;
    border-bottom: 1px solid #eef2f7;
    background: #faf7fd;
}

.search-dropdown-head span {
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #7b3dbd;
}

.search-dropdown-head strong {
    font-size: 0.72rem;
    color: #5f6b7b;
    font-weight: 700;
}

.search-item {
    padding: 0.65rem 0.8rem;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.85rem;
}

.search-item:last-child {
    border-bottom: none;
}

.search-item:hover {
    background-color: #faf7fd;
}

.search-item-main {
    min-width: 0;
}

.search-item-side {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
}

.search-availability {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.45rem;
    border-radius: 999px;
    background: #e8f8ec;
    color: #1f8a45;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.04em;
}

.search-pick {
    font-size: 0.67rem;
    font-weight: 700;
    color: #5b34a5;
}

.search-item.loading {
    display: flex;
    align-items: center;
    color: #6b7280;
    font-size: 0.875rem;
}

.search-item.no-results {
    color: #6b7280;
    font-size: 0.875rem;
    font-style: italic;
    cursor: default;
}

.search-helper-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.55rem;
    flex-wrap: wrap;
}

.search-helper-note,
.search-helper-state {
    font-size: 0.72rem;
    line-height: 1.4;
}

.search-helper-note {
    color: #64748b;
}

.search-helper-state {
    color: #5b34a5;
    font-weight: 700;
}

.qty-picker {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 118px;
}

.qty-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
}

.qty-controls {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem;
    background: #ffffff;
    border: 1px solid #dbe4f0;
    border-radius: 12px;
}

.qty-btn {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 10px;
    background: #eef2ff;
    color: #4f46e5;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.qty-btn:hover:not(:disabled) {
    background: #e0e7ff;
    transform: translateY(-1px);
}

.qty-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.qty-svg {
    width: 1rem;
    height: 1rem;
}

.qty-input {
    width: 42px;
    text-align: center;
    border: none;
    background: transparent;
    padding: 0.25rem 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    -moz-appearance: textfield;
}

.qty-input:focus {
    outline: none;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.remove-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 1.1rem;
    opacity: 0.5;
    transition: opacity 0.2s;
}

.remove-btn:hover {
    opacity: 1;
}

.add-item-btn {
    width: 100%;
    padding: 0.625rem;
    border: 2px dashed #d1d5db;
    border-radius: 10px;
    background: none;
    color: #6b7280;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.add-item-btn:hover {
    border-color: #667eea;
    color: #667eea;
}

/* Prescription */
.prescription-box {
    padding: 1rem;
    background: linear-gradient(180deg, #eef6ff, #f7fbff);
    border: 1px solid #d3e4ff;
    border-radius: 18px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.75rem;
}

.prescription-icon {
    font-size: 1.5rem;
    color: #3b82f6;
    margin-top: 0.125rem;
}

.prescription-text {
    flex: 1;
}

.prescription-text strong {
    display: block;
    font-size: 0.875rem;
    color: #111827;
    margin-bottom: 0.125rem;
}

.prescription-text span {
    font-size: 0.8rem;
    color: #6b7280;
}

.upload-label {
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    color: #3b82f6;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    white-space: nowrap;
}

.prescription-preview-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
}

.prescription-preview-card {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #dbeafe;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
}

.prescription-preview-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
    background: #dbeafe;
}

.prescription-preview-copy {
    padding: 0.75rem 0.75rem 0.35rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.prescription-preview-copy strong {
    font-size: 0.8rem;
    color: #0f172a;
}

.prescription-preview-copy span {
    font-size: 0.72rem;
    color: #64748b;
    word-break: break-word;
}

.prescription-preview-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0 0.75rem 0.75rem;
}

.preview-action-btn {
    flex: 1;
    border: 1px solid #bfdbfe;
    background: #ffffff;
    color: #1d4ed8;
    border-radius: 999px;
    padding: 0.45rem 0.7rem;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
}

.preview-action-btn.danger {
    border-color: #fecaca;
    color: #b91c1c;
}

.upload-progress-card {
    width: 100%;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #bfdbfe;
    border-radius: 12px;
    padding: 0.85rem 1rem;
}

.upload-progress-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.8rem;
    color: #1e3a8a;
    margin-bottom: 0.55rem;
}

.upload-progress-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: #dbeafe;
    overflow: hidden;
}

.upload-progress-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #2563eb, #0ea5e9);
    transition: width 0.2s ease;
}

.hidden-input {
    display: none;
}

/* Location */
.location-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    margin-bottom: 0.9rem;
}

.location-btn.set {
    border-color: #86efac;
    background: #f0fdf4;
}

.concierge-shell .location-btn {
    border-color: #e5d9f5;
    background: #ffffff;
}

.concierge-shell .location-btn.set {
    border-color: #c4a8e8;
    background: #f7f0fb;
}

.concierge-shell .location-icon-wrap {
    background: #f0e6fa;
    color: #6c24b3;
}

.concierge-shell .location-icon-wrap.set {
    background: #e8d5fa;
    color: #350062;
}

.location-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #6b7280;
    flex-shrink: 0;
}

.location-icon-wrap.set {
    background: #dcfce7;
    color: #16a34a;
}

.location-text {
    flex: 1;
}

.location-text strong {
    display: block;
    font-size: 0.875rem;
    color: #111827;
}

.location-text span {
    font-size: 0.75rem;
    color: #6b7280;
}

.location-check {
    color: #22c55e;
    font-size: 1.5rem;
}

.location-help-card {
    margin: -0.25rem 0 1rem;
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
}

.location-help-card.error {
    background: #fff7ed;
    border-color: #fed7aa;
}

.location-help-copy {
    margin: 0;
    font-size: 0.8rem;
    color: #1e3a8a;
}

.location-help-card.error .location-help-copy {
    color: #9a3412;
}

.location-help-actions {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.7rem;
}

.location-help-btn {
    border: none;
    background: #350062;
    color: white;
    border-radius: 999px;
    padding: 0.5rem 0.9rem;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
}

.location-help-btn:hover {
    background: #520094;
}

.location-help-btn.secondary {
    background: white;
    color: #350062;
    border: 1px solid #ddd0ea;
}

.location-help-btn.secondary:hover {
    background: #f7f0fb;
    border-color: #350062;
}

.location-help-note {
    margin: 0.7rem 0 0;
    font-size: 0.75rem;
    color: #7c2d12;
    line-height: 1.5;
}

/* Form */
.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.375rem;
}

.optional {
    color: #9ca3af;
    font-weight: 400;
}

.form-textarea {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    font-size: 0.875rem;
    resize: none;
    transition: all 0.2s;
}

.form-textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.field-hint {
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: #6b7280;
}

/* Review */
.review-box {
    background: #f9fafb;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
}

.review-section {
    margin-bottom: 0.75rem;
}

.review-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.review-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.375rem 0;
    font-size: 0.875rem;
    color: #374151;
}

.review-qty {
    color: #9ca3af;
}

.review-item-images {
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 700;
}

.review-prescription-only {
    margin-top: 0.5rem;
    font-size: 0.88rem;
    line-height: 1.5;
    color: #4b5563;
}

.review-attach {
    font-size: 0.8rem;
    color: #3b82f6;
    margin-bottom: 0.75rem;
}

.review-meta {
    border-top: 1px solid #e5e7eb;
    padding-top: 0.75rem;
}

.review-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    padding: 0.25rem 0;
}

.review-row span:first-child {
    color: #6b7280;
}

.review-addr {
    text-align: right;
    max-width: 60%;
    color: #374151;
}

.fee-notice {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: #eef2ff;
    border-radius: 10px;
    align-items: flex-start;
}

.fee-notice i {
    color: #667eea;
    font-size: 1.25rem;
    margin-top: 0.125rem;
}

.fee-notice strong {
    display: block;
    font-size: 0.875rem;
    color: #111827;
}

.fee-notice span {
    font-size: 0.8rem;
    color: #6b7280;
}

.priority-note {
    background: linear-gradient(135deg, #eef2ff, #e0f2fe);
    border: 1px solid #c7d2fe;
}

.nav-back {
    background: none;
    border: none;
    color: #6b7280;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.nav-back:hover {
    color: #111827;
}

.nav-next {
    padding: 0.625rem 1.5rem;
    background: #520094;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: all 0.2s;
}

.nav-next:hover:not(:disabled) {
    background: #6c24b3;
}

.nav-next:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.nav-submit {
    padding: 0.75rem 2rem;
    background: #520094;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.nav-submit:hover:not(:disabled) {
    background: #6c24b3;
    box-shadow: 0 4px 14px rgba(82, 0, 148, 0.35);
}

.nav-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* Requests list */
.request-list-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 0.4rem;
    margin-bottom: 1rem;
    border-radius: 1.05rem;
    background: linear-gradient(180deg, #fffafd, #f7f2fb);
    border: 1px solid #eadff0;
}

.request-list-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.8rem 0.95rem;
    border: none;
    border-radius: 0.92rem;
    background: transparent;
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.request-list-tab.active {
    background: #ffffff;
    color: #350062;
    box-shadow: 0 10px 22px rgba(53, 0, 98, 0.07);
}

.request-list-count {
    min-width: 1.7rem;
    height: 1.7rem;
    padding: 0 0.4rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: #efe4fb;
    color: #6c24b3;
    font-size: 0.72rem;
    font-weight: 800;
}

.request-list-tab.active .request-list-count {
    background: #6c24b3;
    color: #ffffff;
}

.compact-empty {
    padding: 1.5rem 1rem;
    border-radius: 1rem;
    margin-bottom: 0.25rem;
}

.requests-list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.request-card {
    background: linear-gradient(180deg, #ffffff, #fcf9ff);
    border: 1px solid #eadff0;
    border-radius: 18px;
    padding: 1.1rem 1.2rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 10px 24px rgba(53, 0, 98, 0.05);
}

.request-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 32px rgba(53, 0, 98, 0.08);
}

.request-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.request-card-copy {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.65rem;
}

.request-card-copy p {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 600;
    color: #475569;
}

.request-prescription-preview {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.8rem 0.9rem;
    margin-bottom: 0.65rem;
    border-radius: 16px;
    background: linear-gradient(180deg, #f5eefb, #fcf9ff);
    border: 1px solid #eadff0;
}

.request-prescription-thumb-link {
    display: inline-flex;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #bfdbfe;
    background: #ffffff;
}

.request-prescription-thumb {
    width: 64px;
    height: 64px;
    object-fit: cover;
    display: block;
}

.request-prescription-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.request-prescription-copy strong {
    font-size: 0.82rem;
    color: #1e3a8a;
}

.request-prescription-copy span {
    font-size: 0.76rem;
    line-height: 1.45;
    color: #475569;
}

.request-num {
    font-size: 1rem;
    font-weight: 700;
    color: #350062;
}

.request-date {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-left: 0.5rem;
}

.request-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    row-gap: 0.35rem;
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
}

.request-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    padding: 0.3rem 0.55rem;
    border-radius: 9999px;
    background: #ffffff;
    border: 1px solid #ece4ef;
}

.request-meta i {
    margin-right: 0.125rem;
}

/* Progress bar */
.progress-bar {
    height: 3px;
    background: #f3f4f6;
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s;
}

.progress-fill.pending {
    background: #f59e0b;
}

.progress-fill.processing {
    background: #3b82f6;
}

.progress-fill.confirming_with_pharm {
    background: #3b82f6;
}

.progress-fill.confirmed_in_pharm {
    background: #22c55e;
}

.progress-fill.paid {
    background: #0ea5e9;
}

.progress-fill.logistics_pending {
    background: #3b82f6;
}

.progress-fill.driver_unavailable {
    background: #ef4444;
}

.progress-fill.ready_for_pickup {
    background: #f97316;
}

.progress-fill.picked_up {
    background: #22c55e;
}

.progress-fill.out_for_delivery {
    background: #6366f1;
}

.progress-fill.delivered {
    background: #22c55e;
}

.progress-fill.returned {
    background: #ef4444;
}

.progress-fill.items_sourced {
    background: #8b5cf6;
}

.progress-fill.awaiting_customer {
    background: #f97316;
}

.progress-fill.confirmed {
    background: #06b6d4;
}

.progress-fill.completed {
    background: #22c55e;
}

.progress-fill.cancelled {
    background: #ef4444;
}

/* Status badge */
.status-badge {
    padding: 0.2rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.status-badge.sm {
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
}

.status-badge.pending {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.processing {
    background: #dbeafe;
    color: #1e40af;
}

.status-badge.confirming_with_pharm {
    background: #efdbff;
    color: #520094;
}

.status-badge.confirmed_in_pharm {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
}

.status-badge.paid {
    background: #e0f2fe;
    color: #0c4a6e;
}

.status-badge.logistics_pending {
    background: #dbeafe;
    color: #1d4ed8;
}

.status-badge.driver_unavailable {
    background: #fee2e2;
    color: #991b1b;
}

.status-badge.ready_for_pickup {
    background: #ffedd5;
    color: #9a3412;
}

.status-badge.picked_up {
    background: #dcfce7;
    color: #166534;
}

.status-badge.out_for_delivery {
    background: #e0e7ff;
    color: #3730a3;
}

.status-badge.delivered {
    background: #dcfce7;
    color: #166534;
}

.status-badge.returned {
    background: #fee2e2;
    color: #991b1b;
}

.status-badge.items_sourced,
.status-badge.sourced {
    background: #ede9fe;
    color: #5b21b6;
}

.status-badge.awaiting_customer {
    background: #ffedd5;
    color: #9a3412;
}

.status-badge.confirmed {
    background: #cffafe;
    color: #155e75;
}

.status-badge.completed {
    background: #dcfce7;
    color: #166534;
}

.status-badge.cancelled {
    background: #fee2e2;
    color: #991b1b;
}

.status-badge.unavailable {
    background: #fee2e2;
    color: #991b1b;
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 0.75rem;
}

.modal-content {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 720px;
    max-height: calc(100dvh - 1.5rem);
    overflow: hidden;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
}

.priority-modal {
    max-width: 640px;
}

.modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #efdbff;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 2;
}

.modal-header h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.375rem 0;
}

.modal-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    color: #9ca3af;
    padding: 0.25rem;
}

.modal-close:hover {
    color: #374151;
}

.modal-body {
    padding: 1rem 1.25rem 1.25rem;
    overflow-y: auto;
}

.reimbursement-modal {
    max-width: 520px;
}

.reimbursement-icon {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
}

.reimbursement-summary {
    margin: 1rem 0 1.15rem;
    padding: 0.85rem 1rem;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    display: grid;
    gap: 0.55rem;
}

.reimbursement-summary div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.84rem;
    color: #475569;
}

.reimbursement-summary strong {
    color: #0f172a;
}

.reimbursement-summary .net {
    padding-top: 0.55rem;
    border-top: 1px solid #dbe4ee;
    font-weight: 700;
}

.priority-hero {
    padding: 1rem 1.1rem;
    border-radius: 14px;
    background: #520094;
    color: #ffffff;
    margin-bottom: 1rem;
}

.priority-kicker {
    margin: 0 0 0.45rem 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #dbb8ff;
}

.priority-copy {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.65;
    color: #f3e8ff;
}

.priority-points {
    display: grid;
    gap: 0.8rem;
}

.priority-point {
    display: grid;
    gap: 0.25rem;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    border: 1px solid #efdbff;
    background: #faf5ff;
}

.priority-point strong {
    font-size: 0.9rem;
    color: #1e1a22;
}

.priority-point span {
    font-size: 0.83rem;
    line-height: 1.6;
    color: #7d7484;
}

.priority-point.muted {
    background: #faf5ff;
    border-style: dashed;
}

.priority-shortfall {
    margin-top: 0.9rem;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    background: #fff7ed;
    border: 1px solid #fdba74;
    display: grid;
    gap: 0.2rem;
}

.priority-shortfall strong {
    font-size: 0.88rem;
    color: #9a3412;
}

.priority-shortfall span {
    font-size: 0.8rem;
    line-height: 1.55;
    color: #9a3412;
}

.priority-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #efdbff;
}

.priority-back {
    padding: 0.8rem 1rem;
    border-radius: 10px;
    border: 1px solid #efdbff;
    color: #520094;
}

.priority-back:hover {
    background: #f3e8ff;
    color: #3b006a;
}

.priority-submit {
    min-width: 220px;
}

.priority-topup {
    padding-inline: 1rem;
}

.detail-section {
    margin-bottom: 1.25rem;
}

.detail-prescription-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.detail-prescription-link {
    display: inline-flex;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #dbe4f0;
    background: #ffffff;
}

.detail-prescription-image {
    width: 118px;
    height: 118px;
    object-fit: cover;
    display: block;
}

.detail-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 0.5rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.75rem;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 0.375rem;
}

.detail-item strong {
    font-size: 0.875rem;
    color: #111827;
}

.item-qty {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-left: 0.5rem;
}

.detail-item-images {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.55rem;
}

.detail-item-image-link {
    display: inline-flex;
}

.detail-item-image {
    width: 58px;
    height: 58px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid #dbe4f0;
}

.item-price-info {
    text-align: right;
}

.item-price {
    font-weight: 700;
    font-size: 0.875rem;
    color: #111827;
    display: block;
}

.price-pending {
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
    display: block;
}

.rider-contact-card {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
.rider-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #111;
    margin: 0;
}
.rider-whatsapp-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #25D366;
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    align-self: flex-start;
    margin-top: 0.25rem;
}

.totals-box {
    background: #eef2ff;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1.25rem;
}

.total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    padding: 0.25rem 0;
}

.total-row.grand {
    font-weight: 700;
    font-size: 1rem;
    border-top: 1px solid #c7d2fe;
    padding-top: 0.5rem;
    margin-top: 0.375rem;
    color: #4f46e5;
}

.decision-panel {
    margin-bottom: 1rem;
    padding: 0.95rem 1rem;
    border-radius: 12px;
    border: 1px solid #fcd34d;
    background: #fffdf4;
}

.decision-card {
    display: grid;
    gap: 0.75rem;
    padding: 0.8rem 0;
    border-top: 1px solid rgba(251, 191, 36, 0.25);
}

.decision-card:first-of-type {
    border-top: none;
    padding-top: 0;
}

.decision-eyebrow {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 0.28rem 0.55rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.decision-eyebrow.warning {
    background: #fef3c7;
    color: #92400e;
}

.decision-eyebrow.info {
    background: #dbeafe;
    color: #1d4ed8;
}

.decision-eyebrow.success {
    background: #dcfce7;
    color: #166534;
}

.decision-eyebrow.neutral {
    background: #e2e8f0;
    color: #334155;
}

.decision-copy strong {
    display: block;
    font-size: 0.9rem;
    color: #111827;
    margin-bottom: 0.25rem;
}

.decision-copy p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.55;
    color: #475569;
}

.decision-human-summary {
    display: grid;
    gap: 0.3rem;
    padding: 0.55rem 0.7rem;
    border-radius: 10px;
    border: 1px solid #dbeafe;
    background: #f8fbff;
}

.decision-human-summary p {
    margin: 0;
    font-size: 0.78rem;
    color: #1e3a8a;
    line-height: 1.45;
}

.decision-flow-headline {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.55;
    color: #1f2937;
    font-weight: 600;
}

.decision-split-note {
    margin-top: 0.05rem;
    padding: 0.55rem 0.7rem;
    border-radius: 10px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1e3a8a;
    font-size: 0.78rem;
    font-weight: 500;
}

.decision-item-list {
    display: grid;
    gap: 0.8rem;
}

.decision-item-row {
    display: grid;
    gap: 0.7rem;
    padding: 0.85rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(226, 232, 240, 0.9);
}

.decision-item-copy {
    display: grid;
    gap: 0.2rem;
}

.decision-item-copy strong {
    font-size: 0.88rem;
    color: #0f172a;
}

.decision-item-meta {
    font-size: 0.78rem;
    color: #475569;
}

.decision-item-meta.unavailable {
    color: #b45309;
    font-weight: 700;
}

.decision-item-meta.source {
    color: #0f766e;
    font-weight: 700;
}

.decision-substitute {
    margin-top: 0.3rem;
    padding-top: 0.45rem;
    border-top: 1px dashed rgba(148, 163, 184, 0.5);
    display: grid;
    gap: 0.15rem;
}

.decision-item-meta.substitute-label {
    font-weight: 800;
    color: #0f766e;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.68rem;
}

.decision-item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.decision-item-btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #475569;
    border-radius: 999px;
    padding: 0.45rem 0.75rem;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
}

.decision-item-btn.active {
    border-color: #0f766e;
    background: #0f766e;
    color: #ffffff;
}

.decision-preview-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 0.9rem;
    border-radius: 12px;
    background: #ecfeff;
    border: 1px solid #a5f3fc;
    color: #0f172a;
    font-size: 0.82rem;
}

.decision-actions {
    display: flex;
    gap: 0.65rem;
}

.decision-btn {
    flex: 1;
    border-radius: 10px;
    padding: 0.7rem 0.9rem;
    font-weight: 700;
    font-size: 0.82rem;
    border: 1px solid transparent;
    cursor: pointer;
}

.decision-btn.primary {
    background: #0f766e;
    color: #ffffff;
}

.decision-btn.secondary {
    background: #ffffff;
    color: #475569;
    border-color: #cbd5e1;
}

.decision-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.feedback-card {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid #dbe4f0;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.feedback-head {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
    margin-bottom: 0.85rem;
}

.feedback-copy {
    margin: 0.3rem 0 0;
    color: #526173;
    font-size: 0.92rem;
}

.feedback-date {
    color: #7a8699;
    font-size: 0.8rem;
    white-space: nowrap;
}

.feedback-category {
    margin-bottom: 0.75rem;
}

.feedback-category-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.3rem;
}

.feedback-stars {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 0.25rem;
}

.feedback-star-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 999px;
    border: 1px solid #d7e0ec;
    background: #fff;
    color: #b7c2d0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.feedback-star-btn.active {
    background: #fff4d6;
    border-color: #f1c65d;
    color: #d99000;
}

.feedback-star-icon {
    width: 1.2rem;
    height: 1.2rem;
}

.feedback-textarea {
    margin-bottom: 0.85rem;
}

.feedback-actions {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
}

.feedback-saved-note {
    color: #526173;
    font-size: 0.9rem;
}

.feedback-submit-btn {
    width: auto;
    min-width: 12rem;
}

.payment-action {
    margin-bottom: 1rem;
}

.payment-method-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
}

.payment-total-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.65rem 0.85rem;
    margin-bottom: 0.7rem;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.92rem;
    font-weight: 600;
    color: #111827;
}

.payment-total-amount {
    font-size: 1.05rem;
    font-weight: 700;
    color: #4F217A;
    font-variant-numeric: tabular-nums;
}

.fulfillment-picker {
    margin-bottom: 0.85rem;
    padding: 0.85rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
}

.fulfillment-picker-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 700;
    color: #0f172a;
}

.fulfillment-picker-header p {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    color: #64748b;
}

.fulfillment-picker-loading {
    margin-top: 0.65rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8125rem;
    color: #64748b;
}

.fulfillment-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
    margin-top: 0.65rem;
}

@media (max-width: 480px) {
    .fulfillment-options { grid-template-columns: 1fr; }
}

.fulfillment-option {
    display: block;
    text-align: left;
    padding: 0.7rem 0.85rem;
    border-radius: 10px;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
}

.fulfillment-option-row {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
}

.fulfillment-option-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.fulfillment-option-icon svg {
    width: 20px;
    height: 20px;
}

.fulfillment-option-icon--pickup {
    background: #fef3c7;
    color: #92400e;
}

.fulfillment-option-icon--delivery {
    background: #e0e7ff;
    color: #4338ca;
}

.fulfillment-option-body {
    flex: 1 1 auto;
    min-width: 0;
}

.fulfillment-option:hover:not(:disabled) {
    border-color: #cbd5e1;
}

.fulfillment-option--selected {
    border-color: #4F217A;
    background: #f4e8fb;
}

.fulfillment-option--disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.fulfillment-option-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
}

.fulfillment-option-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: #0f172a;
}

.fulfillment-option-price {
    font-weight: 700;
    font-size: 0.9rem;
    color: #4F217A;
}

.fulfillment-option-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.15rem;
    margin-top: 0.3rem;
    font-size: 0.75rem;
    color: #475569;
}

.fulfillment-option-meta--muted {
    color: #94a3b8;
    font-style: italic;
}

.fee-credit-picker {
    margin-bottom: 0.75rem;
    padding: 0.75rem 0.85rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
}

.fee-credit-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.55rem;
}

.fee-credit-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: #0f172a;
}

.fee-credit-sub {
    font-size: 0.72rem;
    color: #64748b;
}

.fee-credit-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
}

.fee-credit-option {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    text-align: left;
    padding: 0.6rem 0.75rem;
    border-radius: 9px;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
}

.fee-credit-option:hover {
    border-color: #cbd5e1;
}

.fee-credit-option--selected {
    border-color: #4F217A;
    background: #f4e8fb;
}

.fee-credit-option-title {
    font-size: 0.825rem;
    font-weight: 700;
    color: #0f172a;
}

.fee-credit-option-sub {
    font-size: 0.72rem;
    color: #64748b;
}

.fee-credit-option--selected .fee-credit-option-title {
    color: #4F217A;
}

@media (max-width: 480px) {
    .fee-credit-options { grid-template-columns: 1fr; }
}

.pay-request-btn {
    width: 100%;
    border: none;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #a855f7, #7c3aed);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.secondary-pay-btn {
    background: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
}

.pay-request-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(124, 58, 237, 0.3);
}

.secondary-pay-btn:hover:not(:disabled) {
    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
}

.pay-request-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.pay-svg {
    width: 16px;
    height: 16px;
}

.payment-note {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: #6b7280;
}

.payment-shortfall {
    margin-top: 0.875rem;
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid #f3d7a3;
    background: linear-gradient(180deg, #fffaf0, #fff7e8);
    display: grid;
    gap: 0.9rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.payment-shortfall-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.85rem;
    align-items: start;
}

.payment-shortfall-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #f2d6a4;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.payment-shortfall-svg {
    width: 18px;
    height: 18px;
    color: #b45309;
}

.payment-shortfall-copy {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
}

.payment-shortfall strong {
    font-size: 0.92rem;
    color: #78350f;
}

.payment-shortfall span {
    font-size: 0.8rem;
    line-height: 1.5;
    color: #92400e;
}

.payment-shortfall-amount {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 92px;
    padding: 0.55rem 0.8rem;
    border-radius: 999px;
    background: #fff;
    border: 1px solid #f2d6a4;
    color: #92400e;
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
}

.payment-shortfall-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    padding-top: 0.15rem;
    border-top: 1px solid rgba(180, 83, 9, 0.12);
}

.payment-shortfall-note {
    max-width: 24rem;
}

.payment-topup-btn {
    width: fit-content;
    min-height: 40px;
    padding: 0.7rem 1rem;
    border-radius: 12px;
    background: #b45309;
    color: #fff;
    border: none;
    font-size: 0.82rem;
    font-weight: 800;
    box-shadow: 0 10px 20px rgba(180, 83, 9, 0.16);
}

.payment-topup-btn:hover {
    background: #9a3412;
}

@media (max-width: 640px) {
    .payment-method-grid {
        grid-template-columns: 1fr;
    }

    .payment-shortfall-head {
        grid-template-columns: auto 1fr;
    }

    .payment-shortfall-amount {
        grid-column: 1 / -1;
        justify-self: start;
    }

    .payment-shortfall-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .payment-topup-btn {
        width: 100%;
        justify-content: center;
    }
}

.cancel-action {
    margin-bottom: 1rem;
}

.cancel-request-btn {
    width: 100%;
    border: 1px solid #fca5a5;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    background: #fff1f2;
    color: #b91c1c;
    font-weight: 700;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.cancel-request-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(185, 28, 28, 0.12);
}

.cancel-request-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.fulfillment-section {
    margin-bottom: 1.25rem;
}

.fulfillment-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.fulfillment-btn {
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
}

.fulfillment-btn i {
    font-size: 1.5rem;
    color: #667eea;
    display: block;
    margin-bottom: 0.375rem;
}

.fulfillment-btn strong {
    display: block;
    font-size: 0.875rem;
    color: #111827;
}

.fulfillment-btn span {
    font-size: 0.75rem;
    color: #6b7280;
}

.fulfillment-btn.selected {
    border-color: #667eea;
    background: #eef2ff;
}

.fulfillment-btn:hover {
    border-color: #a5b4fc;
}

.detail-info {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
}

.detail-info i {
    color: #9ca3af;
    margin-top: 0.125rem;
}

/* Success modal */
.success-modal {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 380px;
    padding: 2rem;
    text-align: center;
}

.success-icon {
    width: 64px;
    height: 64px;
    background: #dcfce7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
}

.success-icon i {
    font-size: 2rem;
    color: #16a34a;
}

.success-modal h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
}

.success-modal p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 0.5rem;
}

.success-num {
    color: #374151;
    margin-bottom: 1.25rem !important;
}

.success-num strong {
    color: #4f46e5;
}

/* States */
.loading-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6b7280;
    font-size: 0.875rem;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
}

.empty-icon {
    font-size: 2.5rem;
    color: #d1d5db;
}

.empty-title {
    font-weight: 600;
    color: #374151;
    margin: 0.5rem 0 0.25rem;
}

.empty-desc {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 1rem;
}

/* Toast */
.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 640px) {
    .new-request-hero {
        grid-template-columns: 1fr;
        padding: 0.95rem;
        border-radius: 18px;
        margin-bottom: 1rem;
    }

    .new-request-title {
        font-size: 1.35rem;
        max-width: none;
    }

    .new-request-desc {
        font-size: 0.88rem;
        line-height: 1.55;
    }

    .new-request-hero-panel {
        grid-template-columns: 1fr;
    }

    .hero-panel-item,
    .hero-panel-item.muted {
        grid-column: auto;
    }

    .editor-section-head,
    .editor-card-head {
        flex-direction: column;
        align-items: stretch;
        gap: 0.6rem;
    }

    .editor-section-badge,
    .editor-card-status {
        align-self: flex-start;
    }

    .requests-list {
        gap: 0.45rem;
    }

    .request-shell-head {
        flex-direction: column;
        align-items: stretch;
        gap: 0.7rem;
    }

    .shell-title {
        font-size: 1.12rem;
    }

    .shell-stats {
        width: 100%;
    }

    .shell-pill {
        flex: 1;
        padding: 0.58rem 0.68rem;
    }

    .request-builder-grid {
        grid-template-columns: 1fr;
    }

    .step-desc {
        margin-bottom: 0.8rem;
    }

    .search-lock-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .search-lock-card .location-help-btn {
        width: 100%;
        justify-content: center;
    }

    .location-btn {
        align-items: flex-start;
        padding: 0.88rem;
    }

    .location-help-card {
        padding: 0.78rem 0.82rem;
    }

    .location-help-actions {
        flex-direction: column;
    }

    .location-help-btn {
        width: 100%;
        text-align: center;
    }

    .fulfillment-grid {
        grid-template-columns: 1fr;
    }

    .fulfillment-btn {
        text-align: left;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .fulfillment-btn strong,
    .fulfillment-btn span {
        display: block;
    }

    .item-row {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr) auto;
        grid-template-areas:
            "num main remove"
            "qty qty qty";
        gap: 0.6rem 0.5rem;
        padding: 0.68rem;
    }

    .item-num {
        grid-area: num;
    }

    .item-main {
        grid-area: main;
    }

    .qty-picker {
        grid-area: qty;
        min-width: 0;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0.55rem 0.65rem;
        border: 1px solid #dbe4f0;
        border-radius: 12px;
        background: #ffffff;
    }

    .qty-label {
        text-align: left;
        margin-right: 0.75rem;
    }

    .qty-controls {
        justify-content: flex-end;
        margin-left: auto;
    }

    .remove-btn {
        grid-area: remove;
        justify-self: end;
        align-self: start;
    }

    .add-item-btn,
    .upload-label {
        width: 100%;
        justify-content: center;
    }

    .prescription-box {
        padding: 0.88rem;
        gap: 0.6rem;
    }

    .prescription-text {
        width: 100%;
    }

    .prescription-preview-grid {
        grid-template-columns: 1fr;
    }

    .prescription-preview-actions {
        flex-direction: column;
    }

    .form-textarea {
        font-size: 0.95rem;
    }

    .review-box {
        padding: 0.88rem;
    }

    .review-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
    }

    .modal-overlay {
        align-items: flex-end;
        padding: 0;
    }

    .modal-content {
        max-width: none;
        width: 100%;
        max-height: 92dvh;
        border-radius: 16px 16px 0 0;
    }

    .modal-header,
    .modal-body {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .review-addr {
        max-width: none;
        text-align: left;
    }

    .toast {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
    }

    .nav-next,
    .nav-submit {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .builder-card {
        padding: 0.88rem;
    }

    .builder-card-head {
        margin-bottom: 0.75rem;
    }

    .editor-card {
        padding: 0.88rem;
        border-radius: 16px;
    }

    .review-card {
        position: static;
    }

    .request-submit-bar {
        flex-direction: column;
        align-items: stretch;
        padding: 0.85rem 0.9rem;
        border-radius: 13px;
    }

    .request-submit-btn {
        width: 100%;
        min-width: 0;
        justify-content: center;
    }

    .form-section,
    .list-section {
        padding: 0.88rem;
        border-radius: 13px;
    }

    .sub-tabs {
        padding: 0.24rem;
    }

    .request-list-tabs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.35rem;
        padding: 0.24rem;
    }

    .request-list-tab {
        min-width: 0;
        padding: 0.58rem 0.62rem;
        font-size: 0.76rem;
    }

    .request-list-count {
        min-width: 1.5rem;
        height: 1.5rem;
        font-size: 0.68rem;
    }

    .request-card {
        padding: 0.64rem 0.7rem;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
    }

    .request-header {
        gap: 0.45rem;
        margin-bottom: 0.25rem;
    }

    .request-header>div {
        min-width: 0;
    }

    .request-num {
        font-size: 0.86rem;
        display: block;
        line-height: 1.25;
    }

    .request-date {
        display: block;
        margin-left: 0;
        margin-top: 0.1rem;
        font-size: 0.69rem;
    }

    .request-card-copy {
        gap: 0.35rem;
        margin-bottom: 0.3rem;
    }

    .request-card-copy {
        align-items: flex-start;
        flex-direction: row;
    }

    .request-card-copy p {
        font-size: 0.73rem;
        line-height: 1.35;
        min-width: 0;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .request-arrow {
        flex-shrink: 0;
        width: 0.9rem;
        height: 0.9rem;
        margin-top: 0.1rem;
    }

    .request-prescription-preview {
        gap: 0.35rem;
        padding: 0.38rem 0.48rem;
        border-radius: 999px;
        margin-bottom: 0.35rem;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
    }

    .request-prescription-thumb-link {
        display: none;
    }

    .request-prescription-copy strong {
        font-size: 0.69rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #475569;
    }

    .request-prescription-copy span {
        font-size: 0.69rem;
        line-height: 1.2;
    }

    .request-meta {
        gap: 0.32rem;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: stretch;
        margin-bottom: 0;
    }

    .request-meta span:first-child {
        display: none;
    }

    .request-meta span {
        width: auto;
        justify-content: flex-start;
        min-width: 0;
        padding: 0.24rem 0.4rem;
        font-size: 0.68rem;
        line-height: 1.2;
        border-radius: 10px;
        background: #f8fafc;
    }

    .status-badge {
        font-size: 0.61rem;
        padding: 0.18rem 0.46rem;
        letter-spacing: 0.02em;
    }

    .progress-bar {
        display: none;
    }
}

@media (max-width: 420px) {
    .sub-tab {
        padding: 0.72rem 0.78rem;
        font-size: 0.79rem;
    }

    .step-title {
        font-size: 1.1rem;
    }

    .item-search-shell {
        padding: 0.7rem 0.75rem;
    }

    .input-wrap {
        padding: 0.7rem 0.75rem;
    }

    .qty-picker {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .qty-label {
        margin-right: 0;
    }

    .qty-controls {
        width: 100%;
        justify-content: space-between;
        margin-left: 0;
    }

    .request-submit-copy strong {
        font-size: 0.9rem;
    }

    .request-submit-copy span {
        font-size: 0.78rem;
    }

    .request-list-tab {
        padding: 0.56rem 0.54rem;
        font-size: 0.73rem;
    }

    .request-card {
        padding: 0.62rem 0.66rem;
    }

    .request-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .request-card-copy {
        align-items: flex-start;
    }

    .request-meta {
        grid-template-columns: 1fr;
    }

    .request-prescription-preview {
        align-items: flex-start;
        border-radius: 12px;
    }
}

/* ═══════════════════════════════════════════════════════════════
   CONCIERGE REDESIGN — new classes
   ═══════════════════════════════════════════════════════════════ */

/* ── Step fade-in animation ── */
@keyframes stepFadeUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.concierge-step {
    animation: stepFadeUp 0.3s ease both;
}

.concierge-step:nth-child(1) {
    animation-delay: 0.05s;
}

.concierge-step:nth-child(2) {
    animation-delay: 0.12s;
}

.concierge-step:nth-child(3) {
    animation-delay: 0.19s;
}

.concierge-step:nth-child(4) {
    animation-delay: 0.26s;
}

/* ── Concierge: strip double-card inside med-card ── */
.med-card .item-search-shell {
    background: transparent;
    border: none;
    padding: 0;
    box-shadow: none;
    border-radius: 0;
}

.med-card .input-wrap {
    background: #f4f4f5;
    border-color: #e4e4e7;
}

.med-card .input-wrap:focus-within {
    border-color: #4F217A;
    background: #faf5ff;
}

/* ── Concierge Shell ── */
.concierge-shell {
    padding: 0;
    max-width: 560px;
    margin: 0 auto;
    background: #f4f4f5;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
}

/* ── Concierge Header ── */
.concierge-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem 0.75rem;
    background: #ffffff;
    border-bottom: 1px solid #e4e4e7;
    position: sticky;
    top: 0;
    z-index: 10;
}

.list-header {
    background: #ffffff;
    border-bottom: 1px solid #e4e4e7;
    margin-bottom: 0;
}

.concierge-back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #350062;
    cursor: pointer;
    transition: background 0.15s;
}

.concierge-back-btn:hover {
    background: rgba(0, 0, 0, 0.06);
}

.concierge-back-svg {
    width: 20px;
    height: 20px;
}

.concierge-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: #4F217A;
    margin: 0;
    letter-spacing: -0.02em;
}

.concierge-help-ring {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid #e4e4e7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 700;
    color: #4F217A;
    background: #f4f4f5;
    cursor: default;
}

/* ── Concierge Steps Container ── */
.concierge-steps {
    flex: 1;
    padding: 0.25rem 1rem 12rem;
    display: flex;
    flex-direction: column;
}

/* ── Single Step Row ── */
.concierge-step {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #e4e4e7;
}

.concierge-step:last-of-type {
    border-bottom: none;
}

.step-num-circle {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #350062;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.1rem;
}

.concierge-step-body {
    flex: 1;
    min-width: 0;
}

.concierge-step-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #4F217A;
    margin: 0 0 0.85rem;
    letter-spacing: -0.02em;
}

/* ── Med Cards (Step 1) ── */
.med-card-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    margin-bottom: 0.75rem;
}

.med-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: #ffffff;
    border: 1px solid #e4e4e7;
    border-radius: 14px;
    padding: 0.8rem 0.85rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    transition: border-color 0.15s;
}

.med-icon-circle {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f0e6fa;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.15rem;
}

.med-icon-glyph {
    font-size: 20px;
    color: #6c24b3;
}

.med-card-body {
    flex: 1;
    min-width: 0;
}

/* When named: remove shell styling from search box */
.med-card--named .item-search-shell {
    background: transparent;
    border: none;
    padding: 0;
    box-shadow: none;
}

.med-card--named .item-search-head {
    display: none;
}

.med-card--named .item-input {
    font-size: 1rem;
    font-weight: 700;
    color: #1a0030;
    padding: 0;
    background: transparent;
}

/* Qty controls */
.med-qty-control {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: #f7f0fb;
    border-radius: 999px;
    padding: 0.25rem 0.45rem;
    margin-top: 0.2rem;
    transition: opacity 0.15s;
}

.med-qty-control.med-qty-hidden {
    opacity: 0;
    pointer-events: none;
}

.med-qty-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1.5px solid #ddd0ea;
    background: #ffffff;
    color: #350062;
    font-size: 1.1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    transition: background 0.15s;
    padding: 0;
}

.med-qty-btn:hover:not(:disabled) {
    background: #350062;
    color: #ffffff;
    border-color: #350062;
}

.med-qty-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.med-qty-input {
    width: 28px;
    text-align: center;
    border: none;
    background: transparent;
    font-size: 0.95rem;
    font-weight: 700;
    color: #350062;
    padding: 0;
    outline: none;
    -moz-appearance: textfield;
    appearance: textfield;
}

.med-qty-input::-webkit-outer-spin-button,
.med-qty-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
}

.med-remove-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.2rem;
    transition: background 0.15s, color 0.15s;
}

.med-remove-btn:hover {
    background: #fee2e2;
    color: #ef4444;
}

.add-med-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0;
    background: transparent;
    border: none;
    color: #6c24b3;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
}

.add-med-link:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.add-med-link:hover:not(:disabled) {
    color: #350062;
}

/* ── Prescription Choice Grid (Step 2) ── */
.prescription-choice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.prescription-choice-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    padding: 1.4rem 1rem;
    background: #ffffff;
    border: 1px solid #e5d9f5;
    border-radius: 14px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
    text-align: center;
    box-shadow: 0 2px 8px rgba(53, 0, 98, 0.05);
}

.prescription-choice-card:hover {
    border-color: #350062;
    box-shadow: 0 4px 12px rgba(53, 0, 98, 0.1);
}

.prx-choice-icon {
    width: 28px;
    height: 28px;
    color: #6c24b3;
}

.prescription-choice-card span {
    font-size: 0.85rem;
    font-weight: 700;
    color: #1a0030;
}

/* ── Fulfillment Choice Cards (Step 3) ── */
.fulfillment-choices {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    margin-bottom: 0.5rem;
}

.fulfillment-choice-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.1rem;
    background: #ffffff;
    border: 1.5px solid #e4e4e7;
    border-radius: 14px;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    width: 100%;
}

.fulfillment-choice-card.selected {
    border-color: #4F217A;
    box-shadow: 0 0 0 3px rgba(79, 33, 122, 0.1);
}

.fulfillment-choice-card:hover {
    border-color: #4F217A;
}

.fulfillment-choice-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f0e6fa;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.ful-choice-svg {
    width: 22px;
    height: 22px;
    color: #6c24b3;
}

.fulfillment-choice-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.fulfillment-choice-text strong {
    font-size: 0.97rem;
    font-weight: 700;
    color: #1a0030;
}

.fulfillment-choice-text span {
    font-size: 0.82rem;
    color: #6b6b7b;
}

/* ── Privacy Strip ── */
.privacy-strip {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    margin: 0.25rem 0 1.5rem;
    padding: 0.8rem 0.9rem;
    background: #ffffff;
    border: 1px solid #e4e4e7;
    border-radius: 12px;
    font-size: 0.78rem;
    line-height: 1.55;
    color: #71717a;
}

.privacy-icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    color: #6c24b3;
    margin-top: 1px;
}

/* ── Concierge Sticky Footer ── */
.concierge-footer {
    position: fixed;
    bottom: 5.75rem;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 560px;
    z-index: 30;
    background: #ffffff;
    border-top: 1px solid #e4e4e7;
    border-radius: 1rem 1rem 0 0;
    padding: 0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
}

.footer-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.footer-total-col {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.footer-total-label {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #71717a;
}

.footer-total-row {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
}

.footer-total-amount {
    font-size: 1.5rem;
    font-weight: 900;
    color: #18181b;
    line-height: 1;
}

.footer-fee-note {
    font-size: 0.78rem;
    color: #71717a;
}

.footer-count-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.15rem;
}

.footer-count-label {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #71717a;
}

.footer-count-value {
    font-size: 1.1rem;
    font-weight: 800;
    color: #18181b;
}

.footer-send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem 1.5rem;
    background: #18181b;
    color: #ffffff;
    font-size: 1.02rem;
    font-weight: 800;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
}

.footer-send-btn:hover:not(:disabled) {
    background: #27272a;
    transform: translateY(-1px);
}

.footer-send-btn:active:not(:disabled) {
    transform: translateY(0);
}

.footer-send-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
}

/* ── Detail Modal: purple header ── */
.modal-header--concierge {
    background: #350062;
    border-radius: 1rem 1rem 0 0;
    padding: 1.1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-header--concierge h3 {
    color: #ffffff;
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
}

.modal-header--concierge .status-badge {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
    border: none;
}

.modal-header--concierge .modal-close {
    color: rgba(255, 255, 255, 0.8);
}

.modal-header--concierge .modal-close:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
}

/* ── Mobile: detail modal as bottom-sheet ── */
@media (max-width: 640px) {
    .modal-content {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 1.5rem 1.5rem 0 0;
        max-height: 92vh;
        overflow-y: auto;
        margin: 0;
        transform: none;
        animation: slideUpSheet 0.25s ease;
    }

    .modal-header--concierge {
        border-radius: 1.5rem 1.5rem 0 0;
    }
}

@keyframes slideUpSheet {
    from {
        transform: translateY(40px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* ── Concierge: override outer order-requests background for new view ── */
.order-requests:has(.concierge-shell) {
    background: #f4f4f5;
    max-width: 100%;
}
</style>
