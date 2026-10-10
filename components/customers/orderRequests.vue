<template>
    <div class="order-requests">
        <!-- ====== NEW REQUEST FORM ====== -->
        <div v-if="isNewView" class="mx-auto w-full max-w-2xl space-y-8 pb-8 pt-2 font-body">

            <!-- Page Header -->
            <header>
                <h1 class="font-display text-3xl font-bold tracking-tight text-ink-900">What do you need?</h1>
                <p class="mt-2 text-base text-ink-600">List your medicines and we will find them at pharmacies near you.</p>
            </header>

            <div class="relative space-y-6">

                    <!-- Prescription: first, because it can stand on its own -->
                    <section aria-labelledby="request-rx-title" class="rounded-2xl bg-brand-50 p-5">
                        <h2 id="request-rx-title" class="font-display text-xl font-bold text-ink-900">Have a prescription?</h2>
                        <p class="mt-1 text-sm text-ink-600">Take a photo or upload it and skip the typing. You can add medicines too.</p>
                        <div class="mt-4 grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap">
                            <label class="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-700 px-3 text-sm sm:px-5 font-semibold text-white transition-colors focus-within:ring-2 focus-within:ring-brand-700 focus-within:ring-offset-2 hover:bg-brand-600">
                                <CameraIcon class="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                Take photo
                                <input ref="prescriptionPicker" type="file" accept="image/*" capture="environment" @change="onPrescriptionFilesSelected" class="sr-only" />
                            </label>
                            <label class="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-3 text-sm sm:px-5 font-semibold text-brand-700 ring-1 ring-brand-700/30 transition-colors focus-within:ring-2 focus-within:ring-brand-700 hover:bg-brand-100">
                                <ArrowUpTrayIcon class="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                Upload<span class="hidden sm:inline"> prescription</span>
                                <input type="file" accept="image/*" multiple @change="onPrescriptionFilesSelected" class="sr-only" />
                            </label>
                        </div>
                        <p v-if="prescriptionFileError" role="alert" class="mt-3 text-sm font-medium text-red-700">{{ prescriptionFileError }}</p>
                        <input ref="prescriptionReplacePicker" type="file" accept="image/*" @change="onReplacePrescriptionFile" class="hidden" />
                        <ul v-if="prescriptionFiles.length" class="mt-4 flex flex-wrap gap-3">
                            <li v-for="(preview, index) in prescriptionFiles" :key="preview.id"
                                class="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                                <img :src="preview.previewUrl" :alt="`Prescription photo ${index + 1}`" class="h-full w-full object-cover" />
                                <button type="button" @click="removePrescriptionFile(index)"
                                    :aria-label="`Remove prescription photo ${index + 1}`"
                                    class="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/80 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                                    <XMarkIcon class="h-4 w-4" aria-hidden="true" />
                                </button>
                            </li>
                        </ul>
                        <div v-if="isUploading" class="mt-4 flex items-center gap-3" role="status" aria-label="Uploading prescription">
                            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                                <span class="block h-full bg-brand-700 transition-all duration-300"
                                    :style="{ width: `${uploadProgress}%` }"></span>
                            </div>
                            <span class="text-sm font-semibold tabular-nums text-ink-900">{{ Math.round(uploadProgress) }}%</span>
                        </div>
                    </section>

                    <!-- Medications -->
                    <section aria-labelledby="request-meds-title" class="space-y-5">
                        <h2 id="request-meds-title" class="font-display text-xl font-bold text-ink-900">Medications</h2>

                        <ul class="space-y-6">
                            <li v-for="(item, index) in requestItems" :key="index" class="flex flex-col gap-3">
                                <div class="relative">
                                    <span class="pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 select-none items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white" aria-hidden="true">{{ index + 1 }}</span>
                                    <label :for="`request-medicine-${index}`" class="sr-only">Medication {{ index + 1 }}: name, brand or strength</label>
                                    <input v-model="item.product_name" type="text"
                                        :id="`request-medicine-${index}`"
                                        autocomplete="off"
                                        autocapitalize="words"
                                        inputmode="text"
                                        placeholder="Medicine name, brand, or strength"
                                        @input="debouncedSaveFormDraft()"
                                        :class="requestItems.length > 1 ? 'pr-14' : 'pr-4'"
                                        class="min-h-[56px] w-full rounded-lg border-2 border-transparent bg-ink-100 py-3 pl-14 text-base font-medium text-ink-900 placeholder-ink-500 transition-colors focus:border-brand-700 focus:bg-white focus:outline-none" />
                                    <button v-if="requestItems.length > 1" @click="removeRequestItem(index)"
                                        type="button" :aria-label="`Remove medication ${index + 1}`"
                                        class="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                        <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>

                                <!-- Unit + Qty -->
                                <div v-if="item.product_name.trim()" class="flex flex-wrap items-end gap-4">
                                    <div class="min-w-[9rem] flex-1">
                                        <label :for="`request-unit-${index}`" class="mb-1.5 block text-sm font-semibold text-ink-900">Unit</label>
                                        <div class="relative">
                                            <select v-model="item.requested_unit" :id="`request-unit-${index}`"
                                                class="min-h-[48px] w-full cursor-pointer appearance-none rounded-lg border-2 border-transparent bg-ink-100 px-4 pr-11 text-base font-medium text-ink-900 transition-colors focus:border-brand-700 focus:bg-white focus:outline-none">
                                                <option value="" class="bg-white text-base text-ink-900">Choose unit…</option>
                                                <option v-for="option in medicineUnitOptions" :key="option" :value="option" class="bg-white text-base text-ink-900">{{ option }}</option>
                                            </select>
                                            <ChevronDownIcon class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-600" aria-hidden="true" />
                                        </div>
                                    </div>

                                    <div>
                                        <label :for="`request-qty-${index}`" class="mb-1.5 block text-sm font-semibold text-ink-900">Quantity</label>
                                        <div class="flex items-center gap-1 rounded-full bg-ink-100 p-1">
                                            <button type="button" :aria-label="`Decrease quantity of ${item.product_name.trim()}`"
                                                class="flex h-11 w-11 items-center justify-center rounded-full text-xl font-medium text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-30 disabled:hover:bg-transparent"
                                                @click="decrementQty(item)" :disabled="Number(item.quantity || 1) <= 1"><span aria-hidden="true">−</span></button>
                                            <input v-model.number="item.quantity" :id="`request-qty-${index}`" type="number" min="1" inputmode="numeric" placeholder="1"
                                                class="h-11 w-12 appearance-none bg-transparent p-0 text-center text-base font-bold text-ink-900 focus:outline-none" />
                                            <button type="button" :aria-label="`Increase quantity of ${item.product_name.trim()}`"
                                                class="flex h-11 w-11 items-center justify-center rounded-full text-xl font-medium text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                                @click="incrementQty(item)"><span aria-hidden="true">+</span></button>
                                        </div>
                                    </div>
                                </div>

                                <label v-if="item.product_name.trim()"
                                    class="flex min-h-[44px] w-fit cursor-pointer select-none items-center gap-3">
                                    <input type="checkbox" v-model="item.prefer_clearance_only"
                                        @change="debouncedSaveFormDraft()"
                                        class="h-5 w-5 cursor-pointer rounded accent-brand-700" />
                                    <span class="text-sm font-medium text-ink-900">Clearance/discounted stock only</span>
                                </label>
                            </li>
                        </ul>

                        <div class="flex flex-wrap items-center gap-x-6">
                            <button @click="addItem" type="button"
                                class="inline-flex min-h-[44px] items-center gap-2 rounded-full pr-3 text-base font-semibold text-brand-700 underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                <PlusIcon class="h-5 w-5" aria-hidden="true" />
                                Add another medication
                            </button>
                            <button v-if="!showNotesField" @click="openNotesField" type="button"
                                class="inline-flex min-h-[44px] items-center gap-2 rounded-full pr-3 text-base font-semibold text-brand-700 underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                <ChatBubbleLeftEllipsisIcon class="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                Add note
                            </button>
                        </div>
                    </section>

                    <!-- Contact + notes -->
                    <section v-if="showNotesField" aria-labelledby="request-extras-title" class="space-y-5 border-t border-ink-100 pt-8">
                        <h2 id="request-extras-title" class="font-display text-xl font-bold text-ink-900">
                            Notes <span class="text-base font-medium text-ink-500">(optional)</span>
                        </h2>

                        <!-- Notes -->
                        <div v-if="showNotesField" class="flex items-start gap-3">
                            <label for="request-notes" class="sr-only">Notes for the pharmacy</label>
                            <textarea v-model="customerNotes" rows="3"
                                ref="notesTextarea"
                                id="request-notes"
                                inputmode="text"
                                autocapitalize="sentences"
                                placeholder="Notes — e.g. brand preference, dosage form..."
                                class="min-w-0 flex-1 resize-none rounded-lg border-2 border-transparent bg-ink-100 px-4 py-3 text-base font-medium text-ink-900 placeholder-ink-500 transition-colors focus:border-brand-700 focus:bg-white focus:outline-none"></textarea>
                            <button v-if="!customerNotes.trim()" @click="dismissNotesField" type="button" aria-label="Remove note"
                                class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </section>

                    <!-- Delivery address -->
                    <section aria-labelledby="request-address-title" class="space-y-4 border-t border-ink-100 pt-8">
                        <h2 id="request-address-title" class="font-display text-xl font-bold text-ink-900">Delivery address</h2>
                        <button @click="showAddressModal = true" type="button"
                            class="flex min-h-[64px] w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                            :class="customerLat && deliveryAddress.trim() ? 'bg-ink-100 hover:bg-ink-200' : 'border-2 border-amber-500 bg-amber-50 hover:bg-amber-100'">
                            <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                                :class="customerLat && deliveryAddress.trim() ? 'bg-brand-700 text-white' : 'bg-amber-200 text-amber-900'">
                                <MapPinIconSolid v-if="customerLat && deliveryAddress.trim()" class="h-5 w-5" aria-hidden="true" />
                                <MapPinIcon v-else class="h-5 w-5" aria-hidden="true" />
                            </span>
                            <span class="min-w-0 flex-1">
                                <template v-if="customerLat && deliveryAddress.trim()">
                                    <span class="block text-sm text-ink-600">Delivering to</span>
                                    <span class="mt-0.5 block truncate text-base font-semibold text-ink-900">{{ deliveryAddress }}</span>
                                </template>
                                <template v-else>
                                    <span class="block text-base font-semibold text-ink-900">Set delivery address</span>
                                    <span class="mt-0.5 block text-sm font-medium text-amber-900">Required to continue</span>
                                </template>
                            </span>
                            <ChevronRightIcon class="h-5 w-5 flex-shrink-0 text-ink-500" aria-hidden="true" />
                        </button>
                    </section>

                    <!-- Wallet gate overlay -->
                    <div v-if="!canSearchProducts && !walletGateDismissed" role="group" aria-label="Top up needed"
                        class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/90 px-6 text-center backdrop-blur-[2px]">
                        <button @click="walletGateDismissed = true" type="button"
                            class="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                            aria-label="Dismiss">
                            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                        </button>
                        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white">
                            <WalletIcon class="h-7 w-7" aria-hidden="true" />
                        </span>
                        <div>
                            <p class="font-display text-xl font-bold text-ink-900">Top up to continue</p>
                            <p class="mt-1 text-sm text-ink-600">GHS {{ requestFee.toFixed(2) }} needed · Balance: GHS {{ (walletBalance ?? 0).toFixed(2) }}</p>
                        </div>
                        <button @click="openWalletTab" type="button"
                            class="min-h-[48px] rounded-full bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                            Top Up Wallet
                        </button>
                        <button @click="walletGateDismissed = true" type="button"
                            class="min-h-[44px] px-3 text-sm font-semibold text-ink-900 underline underline-offset-2 hover:text-ink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                            Continue filling in my request
                        </button>
                    </div>
            </div>

            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-ink-600">Wallet balance</span>
                    <button @click="openWalletTab" type="button"
                        :aria-label="`Wallet balance GHS ${walletBalance.toFixed(2)}. Open wallet`"
                        class="min-h-[44px] rounded-full px-3 text-sm font-bold transition-colors hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                        :class="canSearchProducts ? 'text-brand-800' : 'text-amber-800'">
                        GHS {{ walletBalance.toFixed(2) }}
                    </button>
                </div>
                <button @click="openPriorityGate" :disabled="!canSubmit || isSubmitting" type="button"
                    :aria-describedby="sendWhy ? 'send-why' : undefined"
                    class="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand-700">
                    <ArrowPathIcon v-if="isSubmitting" class="h-5 w-5 animate-spin" aria-hidden="true" />
                    <template v-else>
                        <span>Send Request</span>
                        <span class="h-4 w-px bg-white/30" aria-hidden="true"></span>
                        <span class="text-sm font-medium opacity-80">{{ isProfessional ? 'Free · Pro' : firstRequestFree ? 'Free · first request' : requestFee > 0 ? `GHS ${requestFee.toFixed(2)}` : 'Free' }}</span>
                    </template>
                </button>
                <p v-if="sendWhy" id="send-why" class="text-center text-sm text-ink-600">{{ sendWhy }}</p>
            </div>
        </div>

        <!-- ====== REQUESTS LIST ====== -->
        <div v-if="isListView" class="mx-auto w-full max-w-2xl px-5 pb-12 pt-2 font-body">
            <h1 class="pb-5 font-display text-3xl font-bold text-ink-900">My requests</h1>

            <!-- Loading -->
            <div v-if="loadingRequests" role="status" aria-busy="true" class="space-y-3 py-2">
                <span class="sr-only">Loading your requests</span>
                <div v-for="n in 4" :key="`req-sk-${n}`" aria-hidden="true" class="flex items-center gap-4 rounded-2xl bg-ink-50 px-4 py-4">
                    <div class="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-ink-100"></div>
                    <div class="flex-1 space-y-2">
                        <div class="h-3 w-1/2 animate-pulse rounded bg-ink-100"></div>
                        <div class="h-2.5 w-1/3 animate-pulse rounded bg-ink-100"></div>
                    </div>
                    <div class="h-3 w-14 flex-shrink-0 animate-pulse rounded bg-ink-100"></div>
                </div>
            </div>

            <!-- Could not load: say so, do not pretend there are none -->
            <div v-else-if="loadFailed && !myRequests.length" role="alert" class="rounded-2xl bg-red-50 px-5 py-6 text-center">
                <ExclamationCircleIcon class="mx-auto h-8 w-8 text-red-700" aria-hidden="true" />
                <p class="mt-3 font-display text-xl font-bold text-ink-900">We could not load your requests</p>
                <p class="mt-1 text-base text-ink-600">Check your connection and try again. Your requests are safe.</p>
                <button @click="fetchMyRequests()" type="button"
                    class="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                    <ArrowPathIcon class="h-5 w-5" aria-hidden="true" />
                    Try again
                </button>
            </div>

            <!-- Empty -->
            <div v-else-if="myRequests.length === 0" class="flex flex-col items-center py-16 text-center">
                <span class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                    <InboxIcon class="h-7 w-7 text-brand-700" aria-hidden="true" />
                </span>
                <p class="mt-4 font-display text-xl font-bold text-ink-900">No requests yet</p>
                <p class="mt-1 max-w-[28ch] text-base text-ink-600">Send your first request and we will find your medicines.</p>
                <button @click="goToNewRequest" type="button"
                    class="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                    <PlusIcon class="h-5 w-5" aria-hidden="true" />
                    New request
                </button>
            </div>

            <div v-else class="space-y-3">
                <!-- New today -->
                <section v-if="showAttentionStrip" role="status" aria-live="polite" aria-label="New today" class="rounded-2xl bg-brand-50 px-3 py-3">
                    <p class="px-2 pb-1 text-sm font-semibold text-brand-700">New today</p>
                    <ul>
                        <li v-for="req in newItems.filter(r => reqStage(r) !== requestListTab)" :key="`attn-${req.id}`">
                            <button type="button" @click="requestListTab = reqStage(req); viewDetail(req)"
                                class="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                <span class="truncate text-base font-semibold text-ink-900">#{{ req.request_number }}</span>
                                <span class="flex-shrink-0 text-sm font-medium text-brand-700">
                                    {{ reqStage(req) === 'awaiting_payment'
                                        ? (requestPrice(req) ? `Pay GHS ${requestPrice(req)}` : 'Ready to pay')
                                        : reqStage(req) === 'awaiting_fulfilment' ? 'On the way' : 'Being sourced' }}
                                </span>
                            </button>
                        </li>
                    </ul>
                </section>

                <!-- Stages -->
                <section v-for="section in requestSections" :key="section.key" class="overflow-hidden rounded-2xl border border-ink-100 bg-white">
                    <h2>
                        <button type="button" :id="`requests-toggle-${section.key}`"
                            :aria-expanded="requestListTab === section.key"
                            :aria-controls="`requests-section-${section.key}`"
                            @click="toggleRequestSection(section.key)"
                            class="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700"
                            :class="requestListTab === section.key ? 'bg-ink-50' : ''">
                            <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                                :class="requestListTab === section.key ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-600'">
                                <component :is="section.icon" class="h-5 w-5" aria-hidden="true" />
                            </span>
                            <span class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                                <span class="text-base font-semibold text-ink-900">{{ section.title }}</span>
                                <span v-if="section.items.length" class="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-ink-100 px-2 text-sm font-semibold text-ink-900">{{ section.items.length }}</span>
                                <span v-if="tabHasNew[section.key as keyof typeof tabHasNew]" class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">New</span>
                                <span v-if="section.key === 'awaiting_payment' && awaitingPaymentTotal" class="text-sm text-ink-600">GHS {{ awaitingPaymentTotal }}</span>
                            </span>
                            <ChevronDownIcon class="h-5 w-5 flex-shrink-0 text-ink-600 transition-transform duration-200"
                                :class="requestListTab === section.key ? 'rotate-180' : ''" aria-hidden="true" />
                        </button>
                    </h2>
                    <div v-if="requestListTab === section.key" :id="`requests-section-${section.key}`" role="region"
                        :aria-labelledby="`requests-toggle-${section.key}`" class="border-t border-ink-100">
                        <p v-if="!section.items.length" class="px-4 py-6 text-center text-base text-ink-600">{{ section.empty }}</p>
                        <ul v-else class="divide-y divide-ink-100 px-1 py-1">
                            <li v-for="req in section.items" :key="req.id" class="flex items-center gap-1">
                                <button type="button" @click="viewDetail(req)"
                                    class="group flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                    <span class="min-w-0 flex-1">
                                        <span class="block truncate text-base font-semibold text-ink-900">{{ getRequestCardSummary(req) }}</span>
                                        <span class="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-600">
                                            <span>#{{ req.request_number }}</span>
                                            <span :class="requestAgeDays(req) > 7 ? 'font-semibold text-amber-800' : ''">{{ requestAgeLabel(req) }}</span>
                                            <span v-if="newItemIds.has(req.id)" class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">New</span>
                                        </span>
                                    </span>
                                    <span class="flex-shrink-0 text-right">
                                        <strong v-if="requestPrice(req)" class="block text-base font-bold tabular-nums text-ink-900">GHS {{ requestPrice(req) }}</strong>
                                        <span v-else class="block text-sm text-ink-600">Waiting for a price</span>
                                    </span>
                                    <ChevronRightIcon v-if="section.key !== 'awaiting_payment'" class="h-5 w-5 flex-shrink-0 text-ink-400 transition-colors group-hover:text-ink-900" aria-hidden="true" />
                                </button>
                                <button v-if="section.key === 'awaiting_payment'" type="button" @click="viewDetail(req)"
                                    :aria-label="requestPrice(req) ? `Pay GHS ${requestPrice(req)} for ${getRequestCardSummary(req)}` : `Pay for ${getRequestCardSummary(req)}`"
                                    class="mr-2 inline-flex min-h-[44px] flex-shrink-0 items-center rounded-full bg-brand-700 px-5 text-base font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                                    Pay
                                </button>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>

        <!-- ====== REQUEST DETAIL MODAL ====== -->
        <div v-if="selectedRequest" data-testid="request-detail-backdrop"
            class="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/50 sm:items-center sm:p-4"
            @click.self="selectedRequest = null">
            <div ref="detailDialogRef" role="dialog" aria-modal="true" aria-labelledby="request-detail-title"
                class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white font-body shadow-lift sm:rounded-3xl">
                <div data-testid="request-detail-header" class="flex items-start justify-between gap-3 px-6 pb-3 pt-6">
                    <div class="min-w-0">
                        <h2 id="request-detail-title" class="font-display text-2xl font-bold text-ink-900">Request #{{ selectedRequest.request_number }}</h2>
                        <div data-testid="request-detail-status" class="mt-1">
                            <span class="inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{{ formatStatus(getRequestStatus(selectedRequest)) }}</span>
                            <p class="mt-2 text-base text-ink-600">{{ getRequestSubtext(selectedRequest.status) }}</p>
                        </div>
                    </div>
                    <button @click="selectedRequest = null" type="button" aria-label="Close"
                        class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                        <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div class="px-6 pb-6 pt-2">
                    <!-- Items -->
                    <section v-if="selectedRequest.items?.length" aria-labelledby="request-items-title" class="mb-4">
                        <div class="flex items-center justify-between gap-3">
                            <h3 id="request-items-title" class="font-display text-lg font-bold text-ink-900">Items</h3>
                            <button v-if="canEditRequest(selectedRequest)" @click="startEditing(selectedRequest)" type="button"
                                class="inline-flex min-h-[44px] items-center gap-2 rounded-full pl-3 text-base font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                <PencilIcon class="h-5 w-5" aria-hidden="true" />
                                Edit items
                            </button>
                        </div>
                        <ul class="mt-1 divide-y divide-ink-100">
                            <li v-for="(item, itemIdx) in selectedRequest.items" :key="item.id ?? itemIdx" class="flex items-start justify-between gap-4 py-3">
                                <div class="min-w-0">
                                    <p class="text-base font-semibold text-ink-900">{{ item.product_name }}</p>
                                    <p class="text-sm text-ink-600">Qty {{ item.quantity }}<template v-if="item.item_status && !['pending', 'available'].includes(String(item.item_status))"> · <span class="capitalize">{{ String(item.item_status).replace(/_/g, ' ') }}</span></template></p>
                                </div>
                                <p v-if="item.marked_up_price" class="flex-shrink-0 text-base font-bold tabular-nums text-ink-900">GHS {{ parseFloat(String(item.marked_up_price)).toFixed(2) }}</p>
                                <p v-else class="flex-shrink-0 text-sm text-ink-600">Waiting for a price</p>
                            </li>
                        </ul>
                    </section>

                    <!-- How it is being received — always visible once locked -->
                    <div v-if="!requiresMethodSelection(selectedRequest) && !overrideMethodPickerFor[selectedRequest.id] && (selectedRequest.fulfillment_type === 'pickup' || selectedRequest.fulfillment_type === 'delivery')"
                        data-testid="fulfillment-method" class="mb-4 flex items-center gap-3 rounded-2xl bg-ink-50 px-4 py-2">
                        <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                            <BuildingStorefrontIcon v-if="selectedRequest.fulfillment_type === 'pickup'" class="h-5 w-5" aria-hidden="true" />
                            <TruckIcon v-else class="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p class="text-base font-semibold text-ink-900">{{ selectedRequest.fulfillment_type === 'pickup' ? 'Pickup' : 'Delivery' }}</p>
                        <button v-if="canPayRequest(selectedRequest)" type="button"
                            :aria-label="`Change ${selectedRequest.fulfillment_type === 'pickup' ? 'pickup' : 'delivery'} method`"
                            class="ml-auto min-h-[44px] rounded-full px-3 text-base font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                            @click="startChangingMethod(selectedRequest.id)">Change</button>
                    </div>

                    <!-- Delivery progress (paid → out_for_delivery, delivery orders only) -->
                    <div v-if="selectedRequest.fulfillment_type === 'delivery' && DELIVERY_PROGRESS_STATUSES.has(selectedRequest.status ?? '')"
                        data-testid="delivery-progress" class="mb-4 rounded-2xl bg-brand-50 px-4 py-4">
                        <p class="text-base font-semibold" :class="selectedRequest.status === 'driver_unavailable' ? 'text-amber-800' : 'text-ink-900'">
                            {{ getRequestSubtext(selectedRequest.status) }}
                        </p>
                        <ol class="mt-3 flex items-start gap-2">
                            <li v-for="(label, stepIdx) in ['Preparing', riderStepLabel, 'On the way']" :key="label"
                                class="flex flex-1 flex-col gap-1.5" :aria-current="deliveryStep === stepIdx + 1 ? 'step' : undefined">
                                <span class="h-1.5 rounded-full"
                                    :class="deliveryStep >= stepIdx + 1 ? (selectedRequest.status === 'driver_unavailable' ? 'bg-amber-600' : 'bg-brand-700') : 'bg-ink-200'"></span>
                                <span class="text-sm" :class="deliveryStep >= stepIdx + 1 ? 'font-semibold text-ink-900' : 'text-ink-600'">{{ label }}</span>
                            </li>
                        </ol>
                    </div>

                    <!-- Delivery could not be completed: an admin redelivers or refunds -->
                    <div v-if="selectedRequest.status === 'delivery_failed'" data-testid="delivery-failed" role="status"
                        class="mb-4 rounded-2xl bg-red-50 px-4 py-4">
                        <p class="text-base font-semibold text-red-700">We couldn't deliver your order</p>
                        <p class="mt-1 text-base text-ink-700">Our team will contact you shortly to arrange another delivery or a refund.</p>
                    </div>

                    <!-- Rider (shown when delivery is active and a rider is assigned) -->
                    <div v-if="selectedRequest.rider_phone && selectedRequest.status !== 'delivery_failed'" data-testid="rider-card" class="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-ink-50 px-4 py-3">
                        <div class="min-w-0">
                            <p class="text-sm text-ink-600">Your rider is on the way</p>
                            <p v-if="selectedRequest.rider_name" class="truncate text-lg font-bold text-ink-900">{{ selectedRequest.rider_name }}</p>
                        </div>
                        <div class="flex flex-shrink-0 gap-2">
                            <a :href="`tel:${selectedRequest.rider_phone}`" :aria-label="`Call ${selectedRequest.rider_name || 'rider'}`"
                                class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                                <PhoneIcon class="h-5 w-5" aria-hidden="true" />
                            </a>
                            <a :href="`https://wa.me/${riderWhatsAppNumber(selectedRequest.rider_phone)}`" target="_blank" rel="noopener noreferrer"
                                :aria-label="`WhatsApp ${selectedRequest.rider_name || 'rider'}`"
                                class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                                <ChatBubbleLeftEllipsisIcon class="h-5 w-5" aria-hidden="true" />
                            </a>
                        </div>
                    </div>

                    <!-- Delivery code: what the rider needs to hear before handing the order over -->
                    <div v-if="selectedRequest.delivery_code" data-testid="delivery-code" class="mb-4 rounded-2xl bg-brand-50 px-4 py-4">
                        <p class="text-sm text-ink-600">Your delivery code</p>
                        <p class="mt-1 text-4xl font-bold tracking-[0.3em] text-ink-900" aria-label="Delivery code">{{ selectedRequest.delivery_code }}</p>
                        <p class="mt-2 text-base text-ink-600">Give this code to the rider when your order arrives. Give it only to the rider, and only once you have your order.</p>
                    </div>

                    <!-- Pickup code: what the pharmacy needs to see before handing the order over -->
                    <div v-if="selectedRequest.pickup_code" data-testid="pickup-code" class="mb-4 rounded-2xl bg-brand-50 px-4 py-4">
                        <p class="text-sm text-ink-600">Your pickup code</p>
                        <p class="mt-1 text-4xl font-bold tracking-[0.3em] text-ink-900" aria-label="Pickup code">{{ selectedRequest.pickup_code }}</p>
                        <p class="mt-2 text-base text-ink-600">Show this code at the pharmacy when you collect your order. Show it only to the pharmacy, and only when you are there.</p>
                    </div>

                    <!-- Who the delivery is for, when it is someone else. Editable until a rider is assigned. -->
                    <div v-if="receiverCardShown(selectedRequest)" data-testid="receiver-card" class="mb-4 rounded-2xl bg-ink-50 px-4 py-4">
                        <template v-if="!editingReceiver && !selectedRequest.recipient_phone">
                            <p class="text-base font-semibold text-ink-900">Delivering to someone else?</p>
                            <p class="mt-1 text-sm text-ink-600">They only get the delivery code and the delivered or not-delivered notes. You still get every update.</p>
                            <button type="button" @click="startEditingReceiver"
                                class="mt-2 min-h-[44px] rounded-full px-3 text-base font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Add a receiver</button>
                        </template>
                        <template v-else-if="!editingReceiver">
                            <p class="text-sm text-ink-600">Delivering to</p>
                            <p class="text-lg font-bold text-ink-900">{{ selectedRequest.recipient_name }}</p>
                            <p class="mt-0.5 text-base text-ink-600">{{ selectedRequest.recipient_phone }}<template v-if="selectedRequest.recipient_email"> · {{ selectedRequest.recipient_email }}</template></p>
                            <p class="mt-2 text-sm text-ink-600">You still get every update. They only get the delivery code and the delivered or not-delivered notes.</p>
                            <p v-if="selectedRequest.recipient_locked" class="mt-2 text-sm text-ink-600">A rider is on this order, so the receiver can no longer be changed.</p>
                            <button v-else type="button" @click="startEditingReceiver"
                                class="mt-2 min-h-[44px] rounded-full px-3 text-base font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Change</button>
                        </template>
                        <form v-else class="space-y-3" @submit.prevent="saveReceiver">
                            <div>
                                <label for="detail-receiver-name" class="mb-1 block text-sm font-semibold text-ink-900">Their name</label>
                                <input v-model="detailReceiverName" id="detail-receiver-name" type="text" maxlength="100" autocomplete="off"
                                    class="min-h-[48px] w-full rounded-lg border-2 border-transparent bg-white px-4 py-3 text-base font-medium text-ink-900 focus:border-brand-700 focus:outline-none" />
                            </div>
                            <div>
                                <label for="detail-receiver-phone" class="mb-1 block text-sm font-semibold text-ink-900">Their phone number</label>
                                <input v-model="detailReceiverPhone" id="detail-receiver-phone" type="tel" inputmode="tel" autocomplete="off"
                                    class="min-h-[48px] w-full rounded-lg border-2 border-transparent bg-white px-4 py-3 text-base font-medium text-ink-900 focus:border-brand-700 focus:outline-none" />
                                <p v-if="detailReceiverForeign" class="mt-2 text-sm font-medium text-amber-900">{{ RECEIVER_FOREIGN_HINT }}</p>
                            </div>
                            <div>
                                <label for="detail-receiver-email" class="mb-1 block text-sm font-semibold text-ink-900">Their email <span class="font-medium text-ink-500">(optional)</span></label>
                                <input v-model="detailReceiverEmail" id="detail-receiver-email" type="email" inputmode="email" autocomplete="off"
                                    class="min-h-[48px] w-full rounded-lg border-2 border-transparent bg-white px-4 py-3 text-base font-medium text-ink-900 focus:border-brand-700 focus:outline-none" />
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <button type="submit" :disabled="savingReceiver"
                                    class="min-h-[44px] rounded-full bg-brand-700 px-5 text-base font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">Save</button>
                                <button type="button" :disabled="savingReceiver" @click="editingReceiver = false"
                                    class="min-h-[44px] rounded-full px-4 text-base font-semibold text-ink-900 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Cancel</button>
                                <button v-if="selectedRequest.recipient_phone" type="button" :disabled="savingReceiver" @click="removeReceiver"
                                    class="min-h-[44px] rounded-full px-4 text-base font-semibold text-ink-900 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Deliver to me instead</button>
                            </div>
                        </form>
                        <p v-if="receiverFormError" role="alert" class="mt-2 text-sm font-medium text-red-700">{{ receiverFormError }}</p>
                    </div>

                    <!-- Pickup location (revealed after payment for pickup orders) -->
                    <div v-if="selectedRequest.fulfillment_type === 'pickup' && selectedRequest.pharmacy?.name" data-testid="pickup-card" class="mb-4 rounded-2xl bg-ink-50 px-4 py-4">
                        <p class="text-sm text-ink-600">Pickup location</p>
                        <p class="text-lg font-bold text-ink-900">{{ selectedRequest.pharmacy.name }}</p>
                        <p v-if="selectedRequest.pharmacy.address" class="mt-0.5 text-base text-ink-600">{{ selectedRequest.pharmacy.address }}</p>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <a v-if="selectedRequest.pharmacy.phone" :href="`tel:${selectedRequest.pharmacy.phone}`"
                                class="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-700 px-4 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                                <PhoneIcon class="h-5 w-5" aria-hidden="true" />
                                Call
                            </a>
                            <a v-if="selectedRequest.pharmacy.phone" :href="`https://wa.me/${riderWhatsAppNumber(selectedRequest.pharmacy.phone)}`" target="_blank" rel="noopener noreferrer"
                                class="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                <ChatBubbleLeftEllipsisIcon class="h-5 w-5" aria-hidden="true" />
                                WhatsApp
                            </a>
                            <a v-if="pharmacyNavUrl(selectedRequest.pharmacy)" :href="pharmacyNavUrl(selectedRequest.pharmacy)" target="_blank" rel="noopener noreferrer"
                                class="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                <MapPinIcon class="h-5 w-5" aria-hidden="true" />
                                Navigate
                            </a>
                        </div>
                    </div>

                    <!-- Totals (hidden while pickup vs delivery is still being chosen — the
                         comparison cards below carry per-method totals) -->
                    <dl v-if="selectedRequest.estimated_total && !requiresMethodSelection(selectedRequest) && !paymentTotalShown(selectedRequest)" data-testid="request-totals" class="mb-4 space-y-2 rounded-2xl bg-ink-50 px-4 py-4">
                        <div class="flex justify-between text-base text-ink-600">
                            <dt>Items total</dt>
                            <dd class="tabular-nums">GHS {{ parseFloat(String(selectedRequest.items_total ?? 0)).toFixed(2) }}</dd>
                        </div>
                        <div v-if="selectedRequest.fulfillment_type === 'delivery' && selectedRequest.delivery_fee" class="flex justify-between text-base text-ink-600">
                            <dt>Delivery fee</dt>
                            <dd class="tabular-nums">GHS {{ parseFloat(String(selectedRequest.delivery_fee)).toFixed(2) }}</dd>
                        </div>
                        <div class="flex justify-between border-t border-ink-200 pt-2 text-lg font-bold text-ink-900">
                            <dt>Estimated total</dt>
                            <dd class="tabular-nums">GHS {{ parseFloat(String(selectedRequest.estimated_total)).toFixed(2) }}</dd>
                        </div>
                    </dl>

                    <div v-if="canLeaveFeedback(selectedRequest)" data-testid="feedback-card" class="mb-4 rounded-2xl bg-ink-50 px-4 py-4">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <h3 class="font-display text-lg font-bold text-ink-900">Your feedback</h3>
                                <p class="text-base text-ink-600">
                                    {{ selectedRequest.fulfillment_type === 'pickup' ? 'How was your pickup experience?' : 'How was your delivery experience?' }}
                                </p>
                            </div>
                            <span v-if="selectedRequest.feedback?.created_at" class="flex-shrink-0 text-sm text-ink-600">
                                {{ formatDate(selectedRequest.feedback?.created_at) }}
                            </span>
                        </div>

                        <div v-for="cat in feedbackCategories" :key="cat.key" class="mt-4">
                            <p class="text-base font-semibold text-ink-900">{{ cat.label }}</p>
                            <div class="mt-1 flex gap-1" role="radiogroup" :aria-label="`${cat.label} rating`">
                                <button v-for="star in 5" :key="`${cat.key}-${star}`" type="button" role="radio"
                                    :aria-checked="star === feedbackForm[cat.key] ? 'true' : 'false'"
                                    :aria-label="`${star} star${star > 1 ? 's' : ''}`"
                                    class="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                    @click="feedbackForm[cat.key] = star">
                                    <StarIcon class="h-7 w-7" :class="star <= feedbackForm[cat.key] ? 'text-brand-700' : 'text-ink-200'" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <textarea v-model="feedbackForm.notes" rows="3" maxlength="2000" aria-label="Tell us more about your experience"
                            class="mt-4 w-full rounded-2xl border-0 bg-white px-4 py-3 text-base text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-700"
                            placeholder="Optional: tell us what worked well or what felt difficult."></textarea>

                        <button type="button" :disabled="savingFeedback"
                            class="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-5 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:opacity-60"
                            @click="submitFeedback">
                            <ArrowPathIcon v-if="savingFeedback" class="h-5 w-5 animate-spin" aria-hidden="true" />
                            <span>{{ savingFeedback ? 'Saving...' : (selectedRequest.feedback ? 'Update Feedback' : 'Submit Feedback') }}</span>
                        </button>
                    </div>

                    <div v-if="selectedRequest.pending_decisions?.length" data-testid="decision-panel" class="mb-4 space-y-3">
                        <div v-for="(decision, decIdx) in selectedRequest.pending_decisions" :key="decision.id ?? decIdx"
                            data-testid="decision-card" class="rounded-2xl bg-brand-50 px-4 py-4">
                            <span class="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                                :class="getDecisionVariantClass(decision) === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-white text-brand-700'">{{
                                getDecisionEyebrow(decision) }}</span>
                            <h3 class="mt-2 font-display text-lg font-bold text-ink-900">{{ decision.title }}</h3>
                            <p class="text-base text-ink-600">{{ decision.message }}</p>
                            <p v-if="getDecisionConciseSummary(decision)" class="mt-2 text-base font-semibold text-ink-900">
                                {{ getDecisionConciseSummary(decision) }}
                            </p>

                            <ul v-if="getDecisionItems(decision).length" class="mt-3 space-y-3">
                                <li v-for="decisionItem in getDecisionItems(decision)"
                                    :key="`${decision.id}-${decisionItem.item_id}`" class="rounded-2xl bg-white px-4 py-3">
                                    <p class="text-base font-semibold text-ink-900">{{ decisionItem.product_name }}</p>
                                    <p class="text-sm text-ink-600">
                                        Qty {{ decisionItem.quantity }}
                                        <span v-if="shouldShowDecisionItemPrice(decisionItem)"> · GHS {{ formatMoney(decisionItem.unit_price) }} each</span>
                                    </p>
                                    <p v-if="getDecisionItemRouteText(decision, decisionItem)" class="text-sm text-ink-600">
                                        {{ getDecisionItemRouteText(decision, decisionItem) }}
                                    </p>
                                    <p v-if="decisionItem.status === 'unavailable'" class="text-sm font-semibold text-amber-800">
                                        Unavailable right now
                                    </p>
                                    <div v-if="decisionItem.substitute_option" class="mt-2 rounded-xl bg-ink-50 px-3 py-2">
                                        <p class="text-sm text-ink-600">Suggested alternative</p>
                                        <p class="text-base font-semibold text-ink-900">{{ decisionItem.substitute_option.name }}</p>
                                        <p v-if="decisionItem.substitute_option.marked_up_price !== null" class="text-sm text-ink-600">
                                            GHS {{ formatMoney(decisionItem.substitute_option.marked_up_price) }} each
                                        </p>
                                        <p v-if="getDecisionSubstituteRouteText(decision, decisionItem)" class="text-sm text-ink-600">
                                            {{ getDecisionSubstituteRouteText(decision, decisionItem) }}
                                        </p>
                                    </div>
                                    <div class="mt-3 flex flex-wrap gap-2">
                                        <button v-for="choice in getDecisionItemChoices(decisionItem)"
                                            :key="`${decision.id}-${decisionItem.item_id}-${choice.value}`"
                                            type="button" :aria-pressed="getDecisionChoice(decision, decisionItem) === choice.value ? 'true' : 'false'"
                                            class="min-h-[44px] rounded-full px-4 text-base font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                            :class="getDecisionChoice(decision, decisionItem) === choice.value ? 'bg-brand-700 text-white ring-brand-700' : 'bg-white text-brand-700 ring-brand-200 hover:bg-brand-50'"
                                            @click="setDecisionChoice(decision, decisionItem, choice.value)">
                                            {{ choice.label }}
                                        </button>
                                    </div>
                                </li>
                            </ul>
                            <p v-if="getDecisionItems(decision).length" class="mt-3 flex justify-between text-lg font-bold text-ink-900">
                                <span>Updated total</span>
                                <span class="tabular-nums">GHS {{ formatMoney(getDecisionPreviewTotal(decision)) }}</span>
                            </p>

                            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
                                <button type="button" :disabled="respondingDecisionId === decision.id"
                                    class="min-h-[44px] flex-1 rounded-full bg-white px-5 text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-60"
                                    @click="respondToDecision(decision, 'declined')">
                                    {{ getDecisionDeclineLabel(decision) }}
                                </button>
                                <button type="button" :disabled="respondingDecisionId === decision.id"
                                    class="min-h-[44px] flex-1 rounded-full bg-brand-700 px-5 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:opacity-60"
                                    @click="respondToDecision(decision, 'approved')">
                                    {{ respondingDecisionId === decision.id ? 'Saving...' : getDecisionApproveLabel(decision) }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="canPayRequest(selectedRequest) && !selectedRequest.pending_decisions?.length"
                        data-testid="request-payment" class="mt-6 space-y-5 border-t border-ink-100 pt-6">
                        <!-- Fulfilment picker: shown until a method is locked in -->
                        <div v-if="requiresMethodSelection(selectedRequest) || overrideMethodPickerFor[selectedRequest.id]">
                            <h3 id="request-method-title" class="font-display text-lg font-bold text-ink-900">How would you like to receive your order?</h3>

                            <div v-if="paymentOptionsLoading[selectedRequest.id]" role="status" class="mt-3 flex items-center gap-2 text-base text-ink-600">
                                <ArrowPathIcon class="h-5 w-5 animate-spin" aria-hidden="true" />
                                Loading your options
                            </div>

                            <template v-else-if="selectedPaymentOptions">
                                <div role="radiogroup" aria-labelledby="request-method-title" class="mt-3 space-y-3">
                                    <button type="button" role="radio"
                                        :aria-checked="selectedPaymentMethodByRequest[selectedRequest.id] === 'pickup'"
                                        :disabled="!selectedPaymentOptions?.pickup?.available"
                                        @click="choosePaymentMethod(selectedRequest.id, 'pickup')"
                                        class="flex min-h-[72px] w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:opacity-70"
                                        :class="selectedPaymentMethodByRequest[selectedRequest.id] === 'pickup' ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-ink-100 bg-white hover:bg-ink-50'">
                                        <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-900" aria-hidden="true">
                                            <BuildingStorefrontIcon class="h-5 w-5" />
                                        </span>
                                        <span class="min-w-0 flex-1">
                                            <span class="flex items-baseline justify-between gap-3">
                                                <span class="text-base font-semibold text-ink-900">Pickup</span>
                                                <span v-if="selectedPaymentOptions?.pickup?.available" class="text-base font-bold tabular-nums text-ink-900">GHS {{ Number(selectedPaymentOptions?.pickup?.total ?? 0).toFixed(2) }}</span>
                                            </span>
                                            <span v-if="selectedPaymentOptions?.pickup?.available && selectedPaymentOptions?.pickup?.pharmacy" class="mt-0.5 block text-sm text-ink-600">
                                                <template v-if="selectedPaymentOptions?.pickup?.pharmacy?.distance_km != null">{{ selectedPaymentOptions?.pickup?.pharmacy?.distance_km }} km away. </template>
                                                <template v-if="selectedPaymentOptions?.pickup?.pharmacy?.is_24_hours">Open 24 hours. </template>
                                                <template v-else-if="selectedPaymentOptions?.pickup?.pharmacy?.closes_at">Open until {{ selectedPaymentOptions?.pickup?.pharmacy?.closes_at }}. </template>
                                                We show you the pharmacy after you pay.
                                            </span>
                                            <span v-else-if="selectedPaymentOptions?.pickup?.unavailable_reason" class="mt-0.5 block text-sm text-ink-600">
                                                {{ formatPickupReason(selectedPaymentOptions?.pickup?.unavailable_reason) }}
                                            </span>
                                        </span>
                                    </button>

                                    <button type="button" role="radio"
                                        :aria-checked="selectedPaymentMethodByRequest[selectedRequest.id] === 'delivery'"
                                        @click="choosePaymentMethod(selectedRequest.id, 'delivery')"
                                        class="flex min-h-[72px] w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                        :class="selectedPaymentMethodByRequest[selectedRequest.id] === 'delivery' ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-ink-100 bg-white hover:bg-ink-50'">
                                        <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-900" aria-hidden="true">
                                            <TruckIcon class="h-5 w-5" />
                                        </span>
                                        <span class="min-w-0 flex-1">
                                            <span class="flex items-baseline justify-between gap-3">
                                                <span class="text-base font-semibold text-ink-900">Delivery</span>
                                                <span class="text-base font-bold tabular-nums text-ink-900">GHS {{ Number(deliveryDisplayTotal(selectedRequest) ?? 0).toFixed(2) }}</span>
                                            </span>
                                            <span class="mt-0.5 block text-sm text-ink-600">
                                                <template v-if="selectedDeliveryRate(selectedRequest)">via {{ selectedDeliveryRate(selectedRequest)?.provider_name }}, GHS {{ Number(selectedDeliveryRate(selectedRequest)?.amount ?? 0).toFixed(2) }}</template>
                                                <template v-else>Delivery fee GHS {{ Number(selectedPaymentOptions?.delivery?.fee ?? 0).toFixed(2) }}</template>
                                                <template v-if="selectedPaymentOptions?.delivery?.distance_km != null">. {{ selectedPaymentOptions?.delivery?.distance_km }} km</template>
                                                <template v-if="selectedDeliveryRate(selectedRequest)?.eta_minutes">. About {{ selectedDeliveryRate(selectedRequest)?.eta_minutes }} min</template>
                                                <template v-else-if="selectedPaymentOptions?.delivery?.eta_minutes">. About {{ selectedPaymentOptions?.delivery?.eta_minutes }} min</template>
                                            </span>
                                        </span>
                                    </button>
                                </div>

                                <div v-if="(selectedPaymentOptions?.delivery?.provider_rates?.length ?? 0) > 0" class="mt-4">
                                    <p id="request-rate-title" class="text-sm font-semibold text-ink-900">Choose delivery speed</p>
                                    <div role="radiogroup" aria-labelledby="request-rate-title" class="mt-2 space-y-2">
                                        <button v-for="rate in selectedPaymentOptions?.delivery?.provider_rates"
                                            :key="`${rate.provider_code}:${rate.service_level}`"
                                            type="button" role="radio"
                                            :aria-checked="selectedRateByRequest[selectedRequest.id] === `${rate.provider_code}:${rate.service_level}`"
                                            @click="chooseDeliveryRate(selectedRequest.id, rate)"
                                            class="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                            :class="selectedRateByRequest[selectedRequest.id] === `${rate.provider_code}:${rate.service_level}` ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-ink-100 bg-white hover:bg-ink-50'">
                                            <span class="min-w-0">
                                                <span class="block text-base font-semibold text-ink-900">{{ rate.provider_name }}{{ rate.service_level && rate.service_level !== 'standard' ? `, ${rate.service_level}` : '' }}</span>
                                                <span v-if="rate.eta_minutes" class="block text-sm text-ink-600">About {{ rate.eta_minutes }} min</span>
                                            </span>
                                            <span class="flex-shrink-0 text-base font-bold tabular-nums text-ink-900">GHS {{ Number(rate.amount ?? 0).toFixed(2) }}</span>
                                        </button>
                                    </div>
                                </div>
                            </template>

                            <p v-else role="alert" class="mt-3 text-base text-ink-600">We could not load your options. Close this and open the request again.</p>
                        </div>

                        <!-- Delivering to someone else: they only get the delivery texts; you get everything.
                             Asked here, with the delivery choice, because it only applies to a delivery. -->
                        <div v-if="receiverOffered(selectedRequest)" data-testid="payment-receiver" class="rounded-xl bg-ink-50 px-4 py-3">
                            <label for="payment-someone-else" class="flex min-h-[44px] cursor-pointer items-center gap-3">
                                <input v-model="deliverToSomeoneElse" id="payment-someone-else" type="checkbox"
                                    class="h-5 w-5 rounded border-ink-300 text-brand-700 focus:ring-brand-700" />
                                <span class="text-base font-semibold text-ink-900">Delivering to someone else?</span>
                            </label>
                            <div v-if="deliverToSomeoneElse" class="mt-3 space-y-4">
                                <p class="text-sm text-ink-600">
                                    You will still get every update. They only get a text with the delivery code, and a note when it is delivered or could not be delivered.
                                </p>
                                <div>
                                    <label for="payment-receiver-name" class="mb-2 block text-sm font-semibold text-ink-900">
                                        Their name <span class="text-red-700" aria-hidden="true">*</span>
                                    </label>
                                    <input v-model="receiverName" id="payment-receiver-name" type="text"
                                        autocomplete="off" maxlength="100"
                                        :aria-invalid="receiverError.name ? 'true' : 'false'"
                                        class="min-h-[48px] w-full rounded-lg border-2 border-transparent bg-white px-4 py-3 text-base font-medium text-ink-900 placeholder-ink-500 transition-colors focus:border-brand-700 focus:outline-none" />
                                    <p v-if="receiverError.name" id="payment-receiver-name-error" role="alert" class="mt-2 text-sm font-medium text-red-700">{{ receiverError.name }}</p>
                                </div>
                                <div>
                                    <label for="payment-receiver-phone" class="mb-2 block text-sm font-semibold text-ink-900">
                                        Their phone number <span class="text-red-700" aria-hidden="true">*</span>
                                    </label>
                                    <input v-model="receiverPhone" id="payment-receiver-phone" type="tel"
                                        inputmode="tel" autocomplete="off"
                                        placeholder="024 123 4567 or +44 7911 123456"
                                        :aria-invalid="receiverError.phone ? 'true' : 'false'"
                                        class="min-h-[48px] w-full rounded-lg border-2 border-transparent bg-white px-4 py-3 text-base font-medium text-ink-900 placeholder-ink-500 transition-colors focus:border-brand-700 focus:outline-none" />
                                    <p v-if="receiverError.phone" id="payment-receiver-phone-error" role="alert" class="mt-2 text-sm font-medium text-red-700">{{ receiverError.phone }}</p>
                                    <p v-if="receiverForeignNumber" id="payment-receiver-foreign-hint" class="mt-2 text-sm font-medium text-amber-900">{{ RECEIVER_FOREIGN_HINT }}</p>
                                </div>
                                <div>
                                    <label for="payment-receiver-email" class="mb-2 block text-sm font-semibold text-ink-900">
                                        Their email <span class="text-base font-medium text-ink-500">(optional)</span>
                                    </label>
                                    <input v-model="receiverEmail" id="payment-receiver-email" type="email"
                                        inputmode="email" autocomplete="off"
                                        :aria-invalid="receiverError.email ? 'true' : 'false'"
                                        class="min-h-[48px] w-full rounded-lg border-2 border-transparent bg-white px-4 py-3 text-base font-medium text-ink-900 placeholder-ink-500 transition-colors focus:border-brand-700 focus:outline-none" />
                                    <p v-if="receiverError.email" id="payment-receiver-email-error" role="alert" class="mt-2 text-sm font-medium text-red-700">{{ receiverError.email }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Contact number: only for delivery, and only when nobody else on the order has one -->
                        <div v-if="deliveryContactNeeded(selectedRequest)" data-testid="delivery-contact">
                            <label for="request-contact-phone" class="mb-2 block text-sm font-semibold text-ink-900">
                                Phone number we can reach you on
                                <span class="text-red-700" aria-hidden="true">*</span>
                            </label>
                            <input id="request-contact-phone" type="tel" inputmode="tel" autocomplete="tel"
                                :value="deliveryContactByRequest[selectedRequest.id] ?? ''"
                                @input="deliveryContactByRequest = { ...deliveryContactByRequest, [selectedRequest.id]: ($event.target as HTMLInputElement).value }"
                                placeholder="024 123 4567 or +44 7911 123456"
                                aria-describedby="request-contact-phone-help"
                                :aria-invalid="deliveryContactError(selectedRequest) ? 'true' : 'false'"
                                class="min-h-[48px] w-full rounded-lg border-2 border-transparent bg-ink-100 px-4 py-3 text-base font-medium text-ink-900 placeholder-ink-500 transition-colors focus:border-brand-700 focus:bg-white focus:outline-none" />
                            <p v-if="deliveryContactError(selectedRequest)" role="alert" class="mt-2 text-sm font-medium text-red-700">{{ deliveryContactError(selectedRequest) }}</p>
                            <p id="request-contact-phone-help" class="mt-2 text-sm text-ink-600">
                                This must be a number we can reach you on by call or WhatsApp about this delivery. Include the country code if it is not a Ghana number.
                            </p>
                        </div>

                        <!-- Search fee: keep it for later, or take it off this order -->
                        <div v-if="canPayWithSelection(selectedRequest) && selectedPaymentOptions?.fee_applicable">
                            <p id="request-fee-title" class="text-base font-semibold text-ink-900">GHS {{ parseFloat(String(selectedPaymentOptions?.request_fee ?? 0)).toFixed(2) }} search fee</p>
                            <div role="radiogroup" aria-labelledby="request-fee-title" class="mt-2 grid grid-cols-2 gap-2">
                                <button type="button" role="radio" :aria-checked="applyFeeByRequest[selectedRequest.id] === true"
                                    @click="setApplyFee(selectedRequest.id, true)"
                                    class="min-h-[56px] rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                    :class="applyFeeByRequest[selectedRequest.id] === true ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-ink-100 bg-white hover:bg-ink-50'">
                                    <span class="block text-base font-semibold text-ink-900">Apply to order</span>
                                    <span class="block text-sm text-ink-600">Pay less now</span>
                                </button>
                                <button type="button" role="radio" :aria-checked="applyFeeByRequest[selectedRequest.id] !== true"
                                    @click="setApplyFee(selectedRequest.id, false)"
                                    class="min-h-[56px] rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                                    :class="applyFeeByRequest[selectedRequest.id] !== true ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700' : 'border-ink-100 bg-white hover:bg-ink-50'">
                                    <span class="block text-base font-semibold text-ink-900">Return to wallet</span>
                                    <span class="block text-sm text-ink-600">Keep it for a later request</span>
                                </button>
                            </div>
                        </div>

                        <!-- Total -->
                        <div v-if="selectedMethodTotal != null" class="flex items-baseline justify-between rounded-2xl bg-ink-50 px-4 py-4">
                            <span class="text-base font-semibold text-ink-900">Total</span>
                            <span data-testid="payment-total" class="font-display text-2xl font-bold tabular-nums text-ink-900">GHS {{ selectedMethodTotal.toFixed(2) }}</span>
                        </div>
                        <p v-if="selectedDeliveryAmount != null" class="-mt-3 px-1 text-sm text-ink-600">Includes GHS {{ selectedDeliveryAmount.toFixed(2) }} delivery</p>

                        <!-- Pay -->
                        <div class="space-y-3">
                            <button type="button" @click="payForRequest(selectedRequest.id, 'wallet')"
                                :disabled="payingRequest || !!walletBlockReason"
                                :aria-describedby="walletBlockReason ? 'request-pay-reason' : undefined"
                                class="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                :class="walletShort ? 'border border-ink-200 bg-white text-ink-900 hover:bg-ink-50' : 'bg-brand-700 text-white hover:bg-brand-600'">
                                <ArrowPathIcon v-if="payingRequest && payingMethod === 'wallet'" class="h-5 w-5 animate-spin" aria-hidden="true" />
                                {{ payingRequest && payingMethod === 'wallet'
                                    ? 'Paying…'
                                    : selectedMethodTotal != null ? `Pay with wallet · GHS ${selectedMethodTotal.toFixed(2)}` : 'Pay with wallet' }}
                            </button>
                            <button type="button" @click="payForRequest(selectedRequest.id, 'paystack')"
                                :disabled="payingRequest || payNeedsChoice"
                                :aria-describedby="payNeedsChoice ? 'request-pay-reason' : undefined"
                                class="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                :class="walletShort ? 'bg-brand-700 text-white hover:bg-brand-600' : 'border border-ink-200 bg-white text-ink-900 hover:bg-ink-50'">
                                <ArrowPathIcon v-if="payingRequest && payingMethod === 'paystack'" class="h-5 w-5 animate-spin" aria-hidden="true" />
                                {{ payingRequest && payingMethod === 'paystack'
                                    ? 'Opening Paystack…'
                                    : paystackChargeTotal != null ? `Pay with card or mobile money · GHS ${paystackChargeTotal.toFixed(2)}` : 'Pay with card or mobile money' }}
                            </button>
                            <p v-if="paystackChargeTotal != null && selectedMethodTotal != null" class="text-center text-sm text-ink-600">
                                Includes GHS {{ (paystackChargeTotal - selectedMethodTotal).toFixed(2) }} Paystack processing fee
                            </p>
                            <p v-if="walletBlockReason" id="request-pay-reason" class="text-center text-sm text-ink-600">{{ walletBlockReason }}</p>
                            <button v-if="walletShort && !payNeedsChoice && paymentShortfall.requestId !== selectedRequest.id" type="button" @click="openWalletTab"
                                class="mx-auto flex min-h-[44px] items-center rounded-full px-4 text-base font-semibold text-brand-700 underline underline-offset-4 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                Top up wallet
                            </button>
                            <p role="status" class="sr-only">{{ payingRequest ? (payingMethod === 'paystack' ? 'Opening Paystack…' : 'Paying from your wallet…') : '' }}</p>
                            <p v-if="payError" role="alert" class="rounded-xl bg-red-50 px-4 py-3 text-base text-red-800">{{ payError }}</p>
                        </div>

                        <!-- The server said the wallet was short -->
                        <div v-if="paymentShortfall.requestId === selectedRequest.id && paymentShortfall.amount > 0"
                            role="alert" class="rounded-2xl bg-amber-50 px-4 py-4">
                            <p class="text-base font-semibold text-ink-900">Add GHS {{ paymentShortfall.amount.toFixed(2) }} to continue</p>
                            <p class="mt-1 text-base text-ink-600">Your wallet is short for this payment. Top up that amount, then pay from your wallet.</p>
                            <button type="button" @click="openWalletTab"
                                class="mt-3 inline-flex min-h-[48px] items-center rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                                Top up wallet
                            </button>
                        </div>
                    </div>
                    <p v-else-if="isPaymentPendingRequest(selectedRequest)" role="status" class="mt-6 rounded-2xl bg-ink-50 px-4 py-4 text-base text-ink-600">
                        We are confirming the price. Payment will appear here shortly.
                    </p>

                    <div v-if="canCancelRequest(selectedRequest)" class="mt-6 border-t border-ink-100 pt-4">
                        <button type="button" @click="requestCancelConfirmation(selectedRequest.id)"
                            :disabled="cancelingRequest || payingRequest"
                            class="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-base font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 disabled:opacity-50">
                            <ArrowPathIcon v-if="cancelingRequest" class="h-5 w-5 animate-spin" aria-hidden="true" />
                            <XMarkIcon v-else class="h-5 w-5" aria-hidden="true" />
                            {{ cancelingRequest ? 'Cancelling request…' : 'Cancel request' }}
                        </button>
                    </div>

                    <!-- Address -->
                    <div v-if="selectedRequest.customer_address || selectedRequest.delivery_address" data-testid="request-address"
                        class="mt-4 flex items-start gap-3 rounded-2xl bg-ink-50 px-4 py-3">
                        <MapPinIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" aria-hidden="true" />
                        <div class="min-w-0">
                            <p class="text-sm text-ink-600">Delivery address</p>
                            <p class="text-base font-semibold text-ink-900">{{ compactAddress(selectedRequest.customer_address ?? selectedRequest.delivery_address ?? '') }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>


        <!-- Address Modal -->
        <div v-if="showAddressModal" data-testid="address-backdrop"
            class="fixed inset-0 z-[70] flex items-end justify-center bg-ink-900/50 sm:items-center sm:p-4"
            @click.self="showAddressModal = false">
            <div ref="addressDialogRef" role="dialog" aria-modal="true" aria-labelledby="address-dialog-title"
                class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 font-body shadow-lift sm:rounded-3xl">
                <div class="mb-5 flex items-center justify-between gap-3">
                    <h2 id="address-dialog-title" class="font-display text-2xl font-bold text-ink-900">{{ customerLat && deliveryAddress.trim() ? 'Update address' : 'Delivery address' }}</h2>
                    <button @click="showAddressModal = false" type="button" aria-label="Close"
                        class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                        <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div class="space-y-5">
                    <!-- GPS -->
                    <div>
                        <button @click="getLocation" :disabled="gettingLocation" type="button"
                            class="flex min-h-[64px] w-full items-center gap-4 rounded-xl bg-ink-100 px-4 py-3 text-left transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-60">
                            <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
                                <ArrowPathIcon v-if="gettingLocation" class="h-5 w-5 animate-spin" aria-hidden="true" />
                                <MapPinIcon v-else class="h-5 w-5" aria-hidden="true" />
                            </span>
                            <span class="min-w-0 flex-1">
                                <span class="block text-base font-semibold text-ink-900">Use my current location</span>
                                <span class="mt-0.5 block text-sm text-ink-600">{{ gettingLocation ? 'Getting location…' : 'Detect where you are with GPS' }}</span>
                            </span>
                            <CheckCircleIconSolid v-if="customerLat" class="h-6 w-6 flex-shrink-0 text-brand-700" aria-label="Location set" />
                        </button>
                        <div v-if="locationIssue" role="alert" class="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <p class="text-sm font-semibold text-red-800">{{ locationIssue.message }}</p>
                            <p class="mt-1 text-sm text-red-800">{{ locationIssue.instructions }}</p>
                        </div>
                    </div>

                    <!-- Address search -->
                    <div>
                        <label for="delivery-address-search" class="mb-2 block text-sm font-semibold text-ink-900">Search for your address</label>
                        <div class="flex items-center gap-2 rounded-lg border-2 border-transparent bg-ink-100 px-4 transition-colors focus-within:border-brand-700 focus-within:bg-white">
                            <MagnifyingGlassIcon class="h-5 w-5 flex-shrink-0 text-ink-600" aria-hidden="true" />
                            <input v-model="deliveryAddressSearch" type="text"
                                id="delivery-address-search"
                                placeholder="Type an address or landmark"
                                role="combobox"
                                aria-autocomplete="list"
                                aria-controls="delivery-address-suggestions-modal"
                                :aria-expanded="deliveryAddressSuggestions.length > 0"
                                :aria-activedescendant="deliveryAddressActiveIndex >= 0 ? `delivery-address-modal-option-${deliveryAddressActiveIndex}` : ''"
                                autocomplete="street-address"
                                inputmode="text"
                                @keydown="onDeliveryAddressKeydown"
                                class="min-h-[48px] w-full bg-transparent text-base font-medium text-ink-900 outline-none placeholder:text-ink-500" />
                            <ArrowPathIcon v-if="deliveryAutocompleteLoading" class="h-5 w-5 flex-shrink-0 animate-spin text-ink-600" aria-hidden="true" />
                        </div>
                        <ul v-if="deliveryAddressSuggestions.length"
                            id="delivery-address-suggestions-modal"
                            role="listbox"
                            aria-label="Address suggestions"
                            class="m-0 mt-2 max-h-56 list-none overflow-y-auto overscroll-contain rounded-xl border border-ink-100 bg-white p-0">
                            <li v-for="(suggestion, idx) in deliveryAddressSuggestions"
                                :key="`${suggestion.display_name}-${idx}`"
                                :id="`delivery-address-modal-option-${idx}`"
                                role="option"
                                :aria-selected="deliveryAddressActiveIndex === idx"
                                class="min-h-[56px] cursor-pointer border-b border-ink-100 px-4 py-3 transition-colors last:border-b-0"
                                :class="deliveryAddressActiveIndex === idx ? 'bg-ink-100' : 'hover:bg-ink-50'"
                                @click="applyDeliveryAddressSuggestion(suggestion)"
                                @mouseenter="deliveryAddressActiveIndex = idx">
                                <p class="truncate text-base font-semibold text-ink-900">{{ formatSuggestionPrimary(String(suggestion.display_name ?? '')) }}</p>
                                <p class="mt-0.5 truncate text-sm text-ink-600">{{ formatSuggestionSecondary(String(suggestion.display_name ?? '')) || suggestion.type || '' }}</p>
                            </li>
                        </ul>
                    </div>

                    <!-- Delivery address text -->
                    <div>
                        <label for="delivery-address-text" class="mb-2 block text-sm font-semibold text-ink-900">Address and directions</label>
                        <textarea v-model="deliveryAddress" id="delivery-address-text" rows="3"
                            placeholder="e.g. Room 12, Kofi Mensah Hostel, University of Ghana, Legon"
                            aria-describedby="delivery-address-text-help"
                            autocomplete="street-address"
                            inputmode="text"
                            class="w-full resize-none rounded-lg border-2 border-transparent bg-ink-100 px-4 py-3 text-base font-medium text-ink-900 placeholder-ink-500 transition-colors focus:border-brand-700 focus:bg-white focus:outline-none"></textarea>
                        <p id="delivery-address-text-help" class="mt-2 text-sm text-ink-600">Add a building, room or landmark so the rider can find you.</p>
                    </div>

                    <div>
                        <button @click="showAddressModal = false" type="button"
                            :disabled="!customerLat || !deliveryAddress.trim()"
                            :aria-describedby="addressWhy ? 'address-why' : undefined"
                            class="min-h-[56px] w-full rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand-700">
                            Confirm Address
                        </button>
                        <p v-if="addressWhy" id="address-why" class="mt-3 text-center text-sm text-ink-600">{{ addressWhy }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Request sent -->
        <div v-if="showSuccess" data-testid="request-sent-backdrop"
            class="fixed inset-0 z-[80] flex items-end justify-center bg-ink-900/50 sm:items-center sm:p-4"
            @click.self="showSuccess = false">
            <div ref="successDialogRef" role="dialog" aria-modal="true" aria-labelledby="request-sent-title"
                class="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center font-body shadow-lift sm:rounded-3xl">
                <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <CheckBadgeIcon class="h-9 w-9" aria-hidden="true" />
                </span>
                <h2 id="request-sent-title" class="mt-4 font-display text-2xl font-bold text-ink-900">Request sent</h2>
                <p class="mt-2 text-base text-ink-600">We'll notify you once a pharmacist has looked at it.</p>
                <p v-if="submittedNumber" class="mt-2 text-base text-ink-600">Request <strong class="text-ink-900">#{{ submittedNumber }}</strong></p>
                <button type="button" @click="goToRequestHistory"
                    class="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brand-700 px-5 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">View my requests</button>
            </div>
        </div>

        <!-- Edit request -->
        <div v-if="editingRequest" data-testid="edit-request-backdrop"
            class="fixed inset-0 z-[80] flex items-end justify-center bg-ink-900/50 sm:items-center sm:p-4"
            @click.self="editingRequest = null">
            <div ref="editDialogRef" role="dialog" aria-modal="true" aria-labelledby="edit-request-title"
                class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 font-body shadow-lift sm:rounded-3xl">
                <div class="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <h2 id="edit-request-title" class="font-display text-2xl font-bold text-ink-900">Edit request</h2>
                        <p class="text-base text-ink-600">#{{ editingRequest.request_number }}</p>
                    </div>
                    <button type="button" aria-label="Close" @click="editingRequest = null"
                        class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                        <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                <ul class="space-y-3">
                    <li v-for="(item, idx) in editItems" :key="idx" class="rounded-2xl bg-ink-50 p-3">
                        <div class="flex items-center gap-3">
                            <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700" aria-hidden="true">{{ idx + 1 }}</span>
                            <input v-model="item.product_name" type="text" :aria-label="`Medicine ${idx + 1}`" placeholder="Medicine name or brand" autocomplete="off"
                                class="min-h-[44px] min-w-0 flex-1 rounded-xl border-0 bg-white px-3 text-base text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-700" />
                            <button v-if="editItems.length > 1" type="button" :aria-label="`Remove medicine ${idx + 1}`" @click="editItems.splice(idx, 1)"
                                class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                                <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                        <div class="mt-2 flex items-center gap-3 pl-11">
                            <select v-model="item.requested_unit" :aria-label="`Unit for medicine ${idx + 1}`"
                                class="min-h-[44px] min-w-0 flex-1 rounded-xl border-0 bg-white px-3 text-base text-ink-900 ring-1 ring-inset ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-700">
                                <option value="">Unit</option>
                                <option v-for="opt in medicineUnitOptions" :key="opt" :value="opt">{{ opt }}</option>
                            </select>
                            <div class="flex items-center gap-1">
                                <button type="button" :aria-label="`Decrease quantity of medicine ${idx + 1}`" @click="item.quantity = Math.max(1, item.quantity - 1)"
                                    class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">−</button>
                                <span class="w-8 text-center text-base font-semibold tabular-nums text-ink-900" aria-live="polite">{{ item.quantity }}</span>
                                <button type="button" :aria-label="`Increase quantity of medicine ${idx + 1}`" @click="item.quantity++"
                                    class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">+</button>
                            </div>
                        </div>
                    </li>
                </ul>
                <button type="button" @click="editItems.push({ product_name: '', requested_unit: '', quantity: 1 })"
                    class="mt-3 min-h-[44px] rounded-full px-3 text-base font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
                    + Add another item
                </button>

                <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" @click="editingRequest = null"
                        class="min-h-[44px] rounded-full bg-white px-5 text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">Cancel</button>
                    <button type="button" @click="saveEdit" :disabled="savingEdit"
                        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-brand-700 px-5 text-base font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:opacity-60">
                        <ArrowPathIcon v-if="savingEdit" class="h-5 w-5 animate-spin" aria-hidden="true" />
                        <span>{{ savingEdit ? 'Saving…' : 'Save changes' }}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Cancel request confirmation -->
        <ConfirmDialog
            :is-open="!!pendingCancelRequestId"
            title="Cancel this request?"
            message="We will stop working on this request. You can submit a new one anytime."
            confirm-text="Yes, cancel"
            cancel-text="Keep request"
            variant="danger"
            @close="pendingCancelRequestId = null"
            @confirm="performCancelRequest"
        />

        <!-- Toast -->
        <div v-if="toast" data-testid="toast" :role="toast.type === 'error' ? 'alert' : 'status'"
            class="fixed inset-x-4 bottom-6 z-[2000] mx-auto flex max-w-md items-center gap-3 rounded-2xl px-5 py-3 text-base font-semibold text-white shadow-lift sm:inset-x-auto sm:right-8"
            :class="toast.type === 'error' ? 'bg-red-700' : 'bg-brand-700'">
            <component :is="toast.type === 'error' ? ExcTriIcon : CheckCircleIcon" class="h-6 w-6 flex-shrink-0" aria-hidden="true" />
            {{ toast.text }}
        </div>

        <!-- Payment Success Animation Overlay -->
        <Transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-300 ease-in"
            leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
            <div v-if="showPaymentSuccessAnim" role="dialog" aria-modal="true" aria-labelledby="payment-success-title"
                class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50">
                <div
                    class="bg-white rounded-3xl p-8 max-w-[320px] w-full mx-4 shadow-lift flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div class="absolute inset-0 pointer-events-none">
                    </div>
                    <div class="w-24 h-24 mb-6 relative z-10 flex items-center justify-center">
                        <div
                            class="absolute inset-0 rounded-full bg-brand-50 scale-0 animate-[scaleIn_0.5s_ease-out_forwards]">
                        </div>
                        <div
                            class="absolute inset-0 rounded-full border-4 border-brand-700 scale-0 animate-[scaleIn_0.5s_ease-out_0.2s_forwards]">
                        </div>
                        <svg class="w-12 h-12 text-brand-700 relative z-20 stroke-dasharray-[100] stroke-dashoffset-[100] animate-[drawCheck_0.5s_ease-out_0.4s_forwards]"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 id="payment-success-title"
                        class="font-display text-2xl font-bold text-ink-900 mb-3 opacity-0 animate-[fadeUp_0.5s_ease-out_0.6s_forwards]">
                        Payment Successful!</h3>
                    <p
                        class="text-ink-600 text-base mb-8 font-medium leading-relaxed opacity-0 animate-[fadeUp_0.5s_ease-out_0.7s_forwards]">
                        Your order payment was successfully processed. Our pharmacists will fulfill your request
                        shortly.
                    </p>
                    <button @click="showPaymentSuccessAnim = false"
                        class="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold min-h-[44px] px-4 rounded-full transition-colors opacity-0 animate-[fadeUp_0.5s_ease-out_0.8s_forwards]">
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
import { useOrderStatus } from '~/composables/useOrderStatus'
import { formatCompactAddress } from '~/utils/addressFormat'
import { resolveContactPhoneInput } from '~/utils/contactPhoneInput'
import { resolveReceiverInput, isForeignReceiverPhone, RECEIVER_FOREIGN_HINT } from '~/utils/receiverInput'
import {
    PAYABLE_REQUEST_STATUSES as payableStatuses,
    getRequestTotalAmount as getPayableAmount,
    isPayableRequest as canPayRequest,
    isPaymentPendingRequest
} from '~/utils/requestPayment'
import {
    PlusCircleIcon, ClipboardDocumentListIcon as ClipDocList, CheckIcon, PlusIcon, XMarkIcon,
    CameraIcon, ArrowUpTrayIcon, MapPinIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon,
    PaperClipIcon, InformationCircleIcon, CubeIcon, CurrencyDollarIcon, TruckIcon, StarIcon,
    ChatBubbleLeftIcon, CheckBadgeIcon, MagnifyingGlassIcon,
    MinusSmallIcon, PlusSmallIcon, CreditCardIcon,
    ExclamationTriangleIcon as ExcTriIcon, ExclamationCircleIcon, CheckCircleIcon,
    ClockIcon, WalletIcon, InboxIcon, BeakerIcon, ChatBubbleLeftEllipsisIcon,
    BuildingStorefrontIcon, PhoneIcon, PencilIcon,
} from '@heroicons/vue/24/outline'
import { MapPinIcon as MapPinIconSolid, CheckCircleIcon as CheckCircleIconSolid, PaperAirplaneIcon as PaperAirplaneIconSolid } from '@heroicons/vue/24/solid'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import { useModalA11y } from '~/composables/useModalA11y'

// ─── Domain types ────────────────────────────────────────────────────────────

interface RequestItem {
    product_name: string;
    requested_unit: string;
    quantity: number;
    imageFiles: PrescriptionPreview[];
    prefer_clearance_only: boolean;
    product_id?: number | null;
    source_pharmacy_id?: number | null;
    unit_price?: number | null;
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
    first_item_name?: string;
    items?: OrderRequestItem[];
    prescription_images?: string[];
    pending_decisions?: RequestDecision[];
    feedback?: RequestFeedback;
    rider?: { phone?: string; [key: string]: unknown };
    rider_phone?: string;
    rider_name?: string;
    delivery_code?: string | null;
    pickup_code?: string | null;
    recipient_name?: string | null;
    recipient_phone?: string | null;
    recipient_email?: string | null;
    recipient_locked?: boolean;
    contact_phone?: string | null;
    customer_address?: string;
    delivery_address?: string;
    pharmacy?: { name?: string; address?: string; latitude?: number | string | null; longitude?: number | string | null; [key: string]: unknown };
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
        provider_rates?: Array<{
            provider_code?: string;
            provider_name?: string;
            service_level?: string;
            amount?: number | string | null;
            currency?: string;
            eta_minutes?: number | null;
            quoted_at?: string;
            valid_until?: string;
            [key: string]: unknown;
        }>;
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
}>();

const userStore = useUserStore() as unknown as UserStoreShape
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const apiBase = config.public['apiBase'] as string ?? ''
const orderRequestsService = createOrderRequestsService(useApi())
const { getRequestStage, getRequestSubtext } = useOrderStatus()
const reqStage = (req: OrderRequest) => getRequestStage(req.status ?? '')

const isNewView = computed<boolean>(() => props.defaultSubTab === 'new')
const isListView = computed<boolean>(() => props.defaultSubTab === 'list')
const isSubmitting = ref<boolean>(false)
const loadingRequests = ref<boolean>(props.defaultSubTab === 'list')
const loadFailed = ref<boolean>(false)
const gettingLocation = ref<boolean>(false)
const payingRequest = ref<boolean>(false)
const payingMethod = ref<string>('')
const payError = ref<string>('')
const cancelingRequest = ref<boolean>(false)
const toast = ref<{ text: string; type: string } | null>(null)
const showSuccess = ref<boolean>(false)
const showPaymentSuccessAnim = ref<boolean>(false)
const showPriorityModal = ref<boolean>(false)
const showAddressModal = ref<boolean>(false)
const detailDialogRef = ref<HTMLElement | null>(null)
const addressDialogRef = ref<HTMLElement | null>(null)
useModalA11y(addressDialogRef, () => showAddressModal.value, () => { showAddressModal.value = false })
const successDialogRef = ref<HTMLElement | null>(null)
const editDialogRef = ref<HTMLElement | null>(null)
useModalA11y(successDialogRef, () => showSuccess.value, () => { showSuccess.value = false })
const submittedNumber = ref<string>('')
const requestFee = ref<number>(5)
const requestRefundMinutes = ref<number>(30)
const firstRequestFree = ref<boolean>(false)
const isProfessional = ref<boolean>(false)
const paymentOptionsByRequest = ref<Record<string | number, PaymentOptions>>({})
const paymentOptionsLoading = ref<Record<string | number, boolean>>({})
const selectedPaymentMethodByRequest = ref<Record<string | number, string>>({})
const overrideMethodPickerFor = ref<Record<string | number, boolean>>({})
const applyFeeByRequest = ref<Record<string | number, boolean>>({})
// Provider rate selection (booking step 3): key `${provider_code}:${service_level}` per request.
const selectedRateByRequest = ref<Record<string | number, string>>({})
// Convenience accessor — avoids repeated index lookups that vue-tsc cannot narrow through v-else-if guards
const selectedPaymentOptions = computed<PaymentOptions | undefined>(
    () => selectedRequest.value != null ? paymentOptionsByRequest.value[selectedRequest.value.id] : undefined
)
const setApplyFee = (requestId: string | number, value: boolean): void => {
    applyFeeByRequest.value = { ...applyFeeByRequest.value, [requestId]: value }
}
const walletBalance = ref<number>(0)
const walletGateDismissed = ref<boolean>(false)
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
    imageFiles: [],
    prefer_clearance_only: false,
    product_id: null,
    source_pharmacy_id: null,
    unit_price: null
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
                quantity: item.quantity,
                prefer_clearance_only: item.prefer_clearance_only
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

        // Only restore if the user hasn't started typing.
        // customerLat and deliveryAddress are excluded: loadSavedHomeLocation() populates
        // them automatically from the user's profile before this function runs, so they
        // are not reliable signals that the user has interacted with the form.
        const hasSignificantContent = requestItems.value.some(item => item.product_name.trim()) ||
            customerNotes.value.trim()
        if (hasSignificantContent) return

        // Restore items
        const draftItems = draft['items']
        if (Array.isArray(draftItems) && draftItems.length > 0) {
            requestItems.value = (draftItems as Array<Record<string, unknown>>).map(item => ({
                ...newItem(),
                product_name: String(item['product_name'] ?? ''),
                requested_unit: String(item['requested_unit'] ?? ''),
                quantity: Math.max(1, Number(item['quantity'] ?? 1)),
                prefer_clearance_only: Boolean(item['prefer_clearance_only'])
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
    prefer_clearance_only: boolean;
    product_id?: number | null;
    source_pharmacy_id?: number | null;
    unit_price?: number | null;
}

const normalizeHomepageDraftItem = (item: unknown): NormalizedDraftItem | null => {
    const src = item as Record<string, unknown> | string | null | undefined
    const productName = String(typeof src === 'string' ? src : (src as Record<string, unknown> | null)?.['product_name'] ?? '').trim()
    if (!productName) return null

    const srcObj = typeof src === 'string' ? null : src as Record<string, unknown> | null
    const productId = Number(srcObj?.['product_id'] ?? 0) || null
    const sourcePharmacyId = Number(srcObj?.['source_pharmacy_id'] ?? 0) || null
    const unitPrice = srcObj?.['unit_price'] == null ? null : Number(srcObj['unit_price'])

    return {
        product_name: productName,
        requested_unit: String(srcObj?.['requested_unit'] ?? '').trim().toLowerCase(),
        quantity: Math.max(1, Number(srcObj?.['quantity'] ?? 1)),
        prefer_clearance_only: Boolean(srcObj?.['prefer_clearance_only']),
        product_id: productId,
        source_pharmacy_id: sourcePharmacyId,
        unit_price: unitPrice != null && unitPrice > 0 ? unitPrice : null
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
            quantity: item.quantity,
            prefer_clearance_only: item.prefer_clearance_only,
            product_id: item.product_id ?? null,
            source_pharmacy_id: item.source_pharmacy_id ?? null,
            unit_price: item.unit_price ?? null
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
// Riders and SMS need a phone number for a delivery. Accounts made with an email address have
// none, so the payment screen asks for one once delivery is chosen (not here, and not when the
// order goes to a receiver, who is the contact).
const deliveryContactByRequest = ref<Record<string, string>>({})
const deliveryContactNeeded = (request: OrderRequest | null): boolean => {
    if (!request || request.id == null) return false
    if (selectedPaymentMethodByRequest.value[request.id] !== 'delivery' && request.fulfillment_type !== 'delivery') return false
    if (request.recipient_phone || request.contact_phone) return false
    if (receiverOffered(request) && receiverResult.value.ok && receiverResult.value.receiver) return false
    return !userStore.currentUser?.phone
}
const deliveryContactResult = (request: OrderRequest | null) =>
    resolveContactPhoneInput({
        accountPhone: userStore.currentUser?.phone ?? null,
        typed: request?.id != null ? (deliveryContactByRequest.value[request.id] ?? '') : ''
    })
const deliveryContactError = (request: OrderRequest | null): string => {
    const typed = request?.id != null ? (deliveryContactByRequest.value[request.id] ?? '') : ''
    const result = deliveryContactResult(request)
    return typed.trim() && !result.ok ? result.message : ''
}
// Asked on the payment screen together with the delivery choice, so only while that choice is
// still open and delivery is the one picked. It is another person's details, so never saved as a draft.
const receiverOffered = (request: OrderRequest | null): boolean => {
    if (!request || request.id == null) return false
    return requiresMethodSelection(request) && selectedPaymentMethodByRequest.value[request.id] === 'delivery'
}
const deliverToSomeoneElse = ref<boolean>(false)
const receiverName = ref<string>('')
const receiverPhone = ref<string>('')
const receiverEmail = ref<string>('')
const receiverResult = computed(() =>
    resolveReceiverInput({
        enabled: deliverToSomeoneElse.value,
        accountPhone: userStore.currentUser?.phone ?? null,
        accountEmail: userStore.currentUser?.email ?? null,
        name: receiverName.value,
        phone: receiverPhone.value,
        email: receiverEmail.value,
    })
)
// An empty box is not an error yet: only say what is wrong with what was typed.
const receiverError = computed<{ name: string; phone: string; email: string }>(() => {
    const out = { name: '', phone: '', email: '' }
    const r = receiverResult.value
    if (r.ok) return out
    const typed = { name: receiverName.value, phone: receiverPhone.value, email: receiverEmail.value }
    if (typed[r.field].trim()) out[r.field] = r.message
    return out
})
const receiverForeignNumber = computed<boolean>(() => deliverToSomeoneElse.value && isForeignReceiverPhone(receiverPhone.value))
// Changing the receiver on a request that is already sent (allowed until a rider is assigned).
const editingReceiver = ref<boolean>(false)
const savingReceiver = ref<boolean>(false)
const receiverFormError = ref<string>('')
const detailReceiverName = ref<string>('')
const detailReceiverPhone = ref<string>('')
const detailReceiverEmail = ref<string>('')
const detailReceiverForeign = computed<boolean>(() => isForeignReceiverPhone(detailReceiverPhone.value))
// The card shows who the delivery is for. While the order can still be paid for it also lets the
// customer add (or drop) a receiver they did not name at the delivery step.
const receiverCardShown = (request: OrderRequest | null): boolean => {
    if (!request) return false
    if (request.recipient_phone && request.fulfillment_type !== 'pickup') return true
    return request.fulfillment_type === 'delivery' && canPayRequest(request) && !request.pending_decisions?.length && !request.recipient_locked
}
const startEditingReceiver = (): void => {
    detailReceiverName.value = String(selectedRequest.value?.recipient_name ?? '')
    detailReceiverPhone.value = String(selectedRequest.value?.recipient_phone ?? '')
    detailReceiverEmail.value = String(selectedRequest.value?.recipient_email ?? '')
    receiverFormError.value = ''
    editingReceiver.value = true
}
const saveReceiver = async (): Promise<void> => {
    const request = selectedRequest.value
    if (!request || savingReceiver.value) return
    const result = resolveReceiverInput({
        enabled: true,
        accountPhone: userStore.currentUser?.phone ?? null,
        accountEmail: userStore.currentUser?.email ?? null,
        name: detailReceiverName.value,
        phone: detailReceiverPhone.value,
        email: detailReceiverEmail.value,
    })
    if (!result.ok || !result.receiver) {
        receiverFormError.value = result.ok ? 'Enter their name and phone number.' : result.message
        return
    }
    savingReceiver.value = true
    receiverFormError.value = ''
    try {
        await apiCall('PUT', `/api/order-requests/customer/${String(request.id)}/recipient`, { ...result.receiver })
        selectedRequest.value = { ...request, ...result.receiver }
        editingReceiver.value = false
    } catch (err) {
        receiverFormError.value = err instanceof Error && err.message ? err.message : 'Could not change the receiver. Try again.'
        // 409 = a rider has since been assigned: nothing more to edit.
        if ((err as ApiError).status === 409) {
            selectedRequest.value = { ...request, recipient_locked: true }
            editingReceiver.value = false
        }
    } finally {
        savingReceiver.value = false
    }
}
const removeReceiver = async (): Promise<void> => {
    const request = selectedRequest.value
    if (!request || savingReceiver.value) return
    savingReceiver.value = true
    receiverFormError.value = ''
    try {
        await apiCall('PUT', `/api/order-requests/customer/${String(request.id)}/recipient`, {})
        selectedRequest.value = { ...request, recipient_name: null, recipient_phone: null, recipient_email: null }
        editingReceiver.value = false
    } catch (err) {
        receiverFormError.value = err instanceof Error && err.message ? err.message : 'Could not change the receiver. Try again.'
        if ((err as ApiError).status === 409) {
            selectedRequest.value = { ...request, recipient_locked: true }
            editingReceiver.value = false
        }
    } finally {
        savingReceiver.value = false
    }
}
const notesTextarea = ref<HTMLTextAreaElement | null>(null)
const showPrescriptionField = ref<boolean>(false)
const showNotesField = ref<boolean>(false)
const editingAddress = ref<boolean>(false)
const showAddressSearch = computed<boolean>(() => !customerLat.value || editingAddress.value)
const locationIssue = ref<LocationIssue | null>(null)
const uploadProgress = ref<number>(0)
const prescriptionFileError = ref<string>('')

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

// When the wallet balance updates (e.g. after topping up), reset the dismissed
// gate so the user sees feedback about whether the top-up was enough.
watch(walletBalance, () => {
    walletGateDismissed.value = false
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
    payError.value = ''
    if (req.id != null) void loadPaymentOptions(req.id)
})
// A half-edited receiver belongs to the request it was started on.
watch(() => selectedRequest.value?.id, () => {
    editingReceiver.value = false
    receiverFormError.value = ''
    deliverToSomeoneElse.value = false
    receiverName.value = ''
    receiverPhone.value = ''
    receiverEmail.value = ''
})
const SESSION_TAB_KEY = 'medsgh_request_list_tab'
const requestListTab = ref<string>(
  (process.client && sessionStorage.getItem(SESSION_TAB_KEY)) || 'processing'
)
// Persist user's tab choice within the session so auto-open doesn't override it.
watch(requestListTab, (tab) => {
  if (process.client) sessionStorage.setItem(SESSION_TAB_KEY, tab)
})

// ─── New today tracking ────────────────────────────────────────────────────
// A request is "new" for the entire calendar day it was created.

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

// Why Send is off, in plain words. Same order as canSubmit.
const sendWhy = computed<string>(() => {
    if (!validItems.value.length && !prescriptionFiles.value.length) return 'Add a medication or a prescription photo.'
    if (!customerLat.value || !deliveryAddress.value.trim()) return 'Set your delivery address.'
    if (!canSearchProducts.value) return 'Top up your wallet to send this request.'
    return ''
})

// Why Confirm is off in the address dialog, in plain words.
const addressWhy = computed<string>(() => {
    if (!deliveryAddress.value.trim() && !customerLat.value) return 'Search for your address, or use your current location.'
    if (!customerLat.value) return 'Pick a suggestion or use your location so we can find pharmacies near you.'
    if (!deliveryAddress.value.trim()) return 'Enter your delivery address.'
    return ''
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

const processingRequests = computed<OrderRequest[]>(() => myRequests.value.filter(r => reqStage(r) === 'processing'))
const awaitingPaymentRequests = computed<OrderRequest[]>(() => myRequests.value.filter(r => reqStage(r) === 'awaiting_payment'))
const awaitingFulfilmentRequests = computed<OrderRequest[]>(() => myRequests.value.filter(r => reqStage(r) === 'awaiting_fulfilment'))
const completedRequests = computed<OrderRequest[]>(() => myRequests.value.filter(r => reqStage(r) === 'complete'))
const requestPrice = (req: OrderRequest): string | null => {
    const amount = parseFloat(String(req.total_cost ?? req.estimated_total ?? 0))
    return amount > 0 ? amount.toFixed(2) : null
}
const requestSections = computed(() => [
    { key: 'awaiting_payment', title: 'Pay now', items: awaitingPaymentRequests.value, empty: 'Nothing to pay right now.', icon: ExclamationCircleIcon },
    { key: 'processing', title: 'Processing', items: processingRequests.value, empty: 'Nothing is being sourced right now.', icon: BeakerIcon },
    { key: 'awaiting_fulfilment', title: 'On the way', items: awaitingFulfilmentRequests.value, empty: 'Nothing is on the way right now.', icon: TruckIcon },
    { key: 'complete', title: 'Done', items: completedRequests.value, empty: 'No completed requests yet.', icon: CheckCircleIcon },
])
const toggleRequestSection = (key: string): void => {
    requestListTab.value = requestListTab.value === key ? '' : key
}
const newItems = computed<OrderRequest[]>(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return myRequests.value.filter(req => !!req.created_at && new Date(req.created_at) >= todayStart)
})
const newItemIds = computed<Set<string | number>>(() => new Set(newItems.value.map(r => r.id)))
const tabHasNew = computed(() => ({
    awaiting_payment: newItems.value.some(r => reqStage(r) === 'awaiting_payment'),
    processing: newItems.value.some(r => reqStage(r) === 'processing'),
    awaiting_fulfilment: newItems.value.some(r => reqStage(r) === 'awaiting_fulfilment'),
}))
const showAttentionStrip = computed(() => newItems.value.some(r => reqStage(r) !== requestListTab.value))
const awaitingPaymentTotal = computed<string>(() => {
    const total = awaitingPaymentRequests.value.reduce((sum, r) => {
        const amount = parseFloat(String(r.total_cost ?? r.estimated_total ?? 0))
        return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0)
    return total > 0 ? total.toFixed(2) : ''
})
const filteredRequests = computed<OrderRequest[]>(() => {
    const stageMap: Record<string, OrderRequest[]> = {
        processing: processingRequests.value,
        awaiting_payment: awaitingPaymentRequests.value,
        awaiting_fulfilment: awaitingFulfilmentRequests.value,
        complete: completedRequests.value,
    }
    return stageMap[requestListTab.value] ?? processingRequests.value
})

const buildLocationIssue = (message: string, instructions: string): LocationIssue => ({ message, instructions })

const formatSuggestionPrimary = (displayName: string): string => {
    const parts = displayName.split(',').map(p => p.trim()).filter(Boolean)
    return parts.slice(0, 3).join(', ')
}

const formatSuggestionSecondary = (displayName: string): string => {
    const parts = displayName.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length <= 3) return ''
    const tail = parts.slice(3).filter(p => !/^[A-Z]{2}-\d/.test(p))
    return tail.slice(-2).join(', ')
}

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
    editingAddress.value = false
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
        deliveryAutocompleteSuspend = true
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
        deliveryAutocompleteSuspend = true
        deliveryAddressSearch.value = deliveryAddress.value
    }
}

const isFeedbackEligibleStatus = (status: string | undefined): boolean =>
    ['completed', 'delivered', 'picked_up'].includes(getCustomerStatus(status ?? ''))

const feedbackCategories = computed(() => selectedRequest.value?.fulfillment_type === 'delivery'
    ? [{ key: 'rating_product', label: 'Product quality' }, { key: 'rating_delivery', label: 'Delivery quality' }, { key: 'rating_overall', label: 'Overall' }] as const
    : [{ key: 'rating_product', label: 'Product quality' }, { key: 'rating_service', label: 'Customer service' }] as const)

const canLeaveFeedback = (request: OrderRequest): boolean => isFeedbackEligibleStatus(request?.status)

const DELIVERY_PROGRESS_STATUSES = new Set(['paid','verified','preparing','logistics_pending','driver_unavailable','driver_assigned','out_for_delivery'])
const deliveryStep = computed((): 1 | 2 | 3 => {
    const s = selectedRequest.value?.status ?? ''
    if (s === 'out_for_delivery') return 3
    if (s === 'driver_assigned' || s === 'logistics_pending' || s === 'driver_unavailable') return 2
    return 1
})
// A claimed order goes driver_assigned, then logistics_pending while the rider collects it:
// both mean a rider is on it, so the label must not slide back to "Finding a rider".
const riderStepLabel = computed<string>(() => {
    const r = selectedRequest.value
    return r?.status === 'driver_assigned' || r?.rider_name ? 'Rider assigned' : 'Finding a rider'
})

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

const buildItemPayload = (item: RequestItem): {
    product_name: string;
    requested_unit: string | null;
    quantity: number;
    prefer_clearance_only: boolean;
    product_id?: number;
    source_pharmacy_id?: number;
    unit_price?: number;
} => ({
    product_name: item.product_name.trim(),
    requested_unit: String(item.requested_unit ?? '').trim().toLowerCase() || null,
    quantity: item.quantity || 1,
    prefer_clearance_only: item.prefer_clearance_only,
    ...(item.product_id ? { product_id: item.product_id } : {}),
    ...(item.source_pharmacy_id && item.unit_price ? {
        source_pharmacy_id: item.source_pharmacy_id,
        unit_price: item.unit_price
    } : {})
})

const resetPickerInput = (pickerRef: { value?: HTMLInputElement | null } | null): void => {
    if (pickerRef?.value) pickerRef.value.value = ''
}

const revokePrescriptionPreview = (image: PrescriptionPreview | undefined | null): void => {
    if (image?.previewUrl) {
        URL.revokeObjectURL(image.previewUrl)
    }
}

const validatePrescriptionFile = (file: File): string | null => {
    const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_BYTES) return 'File is too large (max 10 MB).'
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    if (!isImage && !isPdf) return 'Please upload an image or PDF.'
    return null
}

const appendPrescriptionFiles = async (files: FileList | File[]): Promise<void> => {
    const all = Array.from(files)
    // Validate each file first
    for (const file of all) {
        const err = validatePrescriptionFile(file)
        if (err) {
            prescriptionFileError.value = err
            return
        }
    }
    prescriptionFileError.value = ''
    const accepted = all.slice(0, Math.max(0, 6 - prescriptionFiles.value.length))
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
                    editingAddress.value = false
                    if (fulfillmentType.value === 'delivery') {
                        deliveryAddress.value = locationData.address
                        deliveryAutocompleteSuspend = true
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
        loadFailed.value = false
        const nextRequests = (res.data ?? []) as OrderRequest[]
        myRequests.value = nextRequests

        // Auto-open "Pay Now" tab on first load if the user hasn't chosen a tab
        // themselves (sessionStorage persists their last choice within the session).
        if (!sessionStorage.getItem(SESSION_TAB_KEY)) {
            const hasPayable = nextRequests.some(r => getRequestStage(r.status ?? '') === 'awaiting_payment')
            if (hasPayable) requestListTab.value = 'awaiting_payment'
        }

        // Keep open modal status/details in sync when admin updates a request.
        if (selectedRequest.value?.id != null) {
            const refreshed = nextRequests.find(r => r.id === selectedRequest.value!.id)
            if (refreshed) {
                selectedRequest.value = { ...selectedRequest.value, ...refreshed }
            }
        }
    } catch {
        if (!silent) loadFailed.value = true
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
            if ('recipient_name' in payload) {
                formData.append('recipient_name', payload.recipient_name)
                formData.append('recipient_phone', payload.recipient_phone)
                if (payload.recipient_email) formData.append('recipient_email', payload.recipient_email)
            }
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
    submitRequest()
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
const formatStatus = (s: string | undefined): string => getCustomerStatus(s ?? '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
const formatDate = (d: string | undefined): string => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
const requestAgeDays = (req: OrderRequest): number => {
    if (!req.created_at) return 0
    return Math.floor((Date.now() - new Date(req.created_at).getTime()) / 86400000)
}
const requestAgeLabel = (req: OrderRequest): string => {
    const days = requestAgeDays(req)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
}
const riderWhatsAppNumber = (phone: string | undefined): string => {
    if (!phone) return ''
    const clean = String(phone).replace(/\D/g, '')
    if (clean.startsWith('233')) return clean
    if (clean.startsWith('0')) return '233' + clean.slice(1)
    return '233' + clean
}
const pharmacyNavUrl = (pharmacy: OrderRequest['pharmacy']): string => {
    const lat = Number(pharmacy?.latitude)
    const lng = Number(pharmacy?.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    }
    if (pharmacy?.address) {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pharmacy.address)}`
    }
    return ''
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

    const firstName = req?.first_item_name?.trim() || req?.items?.[0]?.product_name?.trim()
    const itemCount = Number(req?.item_count ?? req?.items?.length ?? 0)

    if (!firstName) return itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : '-'
    const remaining = itemCount - 1
    return remaining > 0 ? `${firstName} +${remaining} more` : firstName
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
const canCancelRequest = (req: OrderRequest | null): boolean =>
    !!req && [
        'pending', 'processing', 'sourcing', 'awaiting_input', 'awaiting_customer',
        'awaiting_method_selection', 'payment_pending',
    ].includes(req.status ?? '')

const canEditRequest = (req: OrderRequest | null): boolean =>
    !!req && ['pending', 'processing'].includes(req.status ?? '')

interface EditItem { product_name: string; requested_unit: string; quantity: number }
const editingRequest = ref<OrderRequest | null>(null)
const editItems = ref<EditItem[]>([])
const savingEdit = ref<boolean>(false)
useModalA11y(detailDialogRef, () => !!selectedRequest.value && !editingRequest.value && !showAddressModal.value, () => { selectedRequest.value = null })
useModalA11y(editDialogRef, () => !!editingRequest.value, () => { editingRequest.value = null })

const startEditing = (req: OrderRequest): void => {
    editItems.value = (req.items ?? []).map(item => ({
        product_name: String(item.product_name ?? ''),
        requested_unit: String(item.requested_unit ?? ''),
        quantity: Math.max(1, Number(item.quantity ?? 1))
    }))
    if (editItems.value.length === 0) editItems.value.push({ product_name: '', requested_unit: '', quantity: 1 })
    editingRequest.value = req
}

const saveEdit = async (): Promise<void> => {
    const req = editingRequest.value
    if (!req || savingEdit.value) return
    const items = editItems.value.filter(i => i.product_name.trim())
    if (items.length === 0) { showToast('Add at least one item', 'error'); return }
    savingEdit.value = true
    try {
        await apiCall('PUT', `/api/order-requests/customer/${String(req.id)}`, { items })
        showToast('Request updated')
        editingRequest.value = null
        await fetchMyRequests({ silent: true })
        if (selectedRequest.value?.id === req.id) await refreshSelectedRequest()
    } catch (e) {
        showToast(e instanceof Error ? e.message : 'Failed to update request', 'error')
    } finally {
        savingEdit.value = false
    }
}

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

const startChangingMethod = (requestId: number | string) => {
    const currentMethod = selectedRequest.value?.fulfillment_type
    if (currentMethod) {
        selectedPaymentMethodByRequest.value = { ...selectedPaymentMethodByRequest.value, [requestId]: currentMethod }
    }
    overrideMethodPickerFor.value = { ...overrideMethodPickerFor.value, [requestId]: true }
}

const choosePaymentMethod = (requestId: number | string, method: string): void => {
    if (!requestId || !['pickup', 'delivery'].includes(method)) return
    const opts = paymentOptionsByRequest.value[requestId]
    if (method === 'pickup' && opts && !opts.pickup?.available) return
    selectedPaymentMethodByRequest.value = {
        ...selectedPaymentMethodByRequest.value,
        [requestId]: method
    }
    if (overrideMethodPickerFor.value[requestId]) {
        overrideMethodPickerFor.value = { ...overrideMethodPickerFor.value, [requestId]: false }
        const prevMethod = selectedRequest.value?.fulfillment_type
        const prevReceiver = selectedRequest.value
            ? { recipient_name: selectedRequest.value.recipient_name, recipient_phone: selectedRequest.value.recipient_phone, recipient_email: selectedRequest.value.recipient_email }
            : null
        if (selectedRequest.value?.id === requestId) {
            // The server drops the receiver when the order goes to pickup, so do the same here.
            const dropped = method === 'pickup' ? { recipient_name: null, recipient_phone: null, recipient_email: null } : {}
            selectedRequest.value = { ...selectedRequest.value, fulfillment_type: method, ...dropped }
        }
        submitFulfillmentChoice(requestId, method).catch(err => {
            showToast(err instanceof Error ? err.message : 'Could not update fulfillment choice', 'error')
            if (selectedRequest.value?.id === requestId) {
                selectedRequest.value = { ...selectedRequest.value, fulfillment_type: prevMethod ?? undefined, ...(prevReceiver ?? {}) }
            }
            overrideMethodPickerFor.value = { ...overrideMethodPickerFor.value, [requestId]: true }
        })
    }
}

const requiresMethodSelection = (request: OrderRequest | null): boolean => {
    if (!request) return false
    return !request.fulfillment_type
}

const canPayWithSelection = (request: OrderRequest | null): boolean => {
    if (!request) return false
    if (request.id != null && overrideMethodPickerFor.value[request.id]) return false
    if (deliveryContactNeeded(request) && !deliveryContactResult(request).ok) return false
    if (receiverOffered(request) && !receiverResult.value.ok) return false
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

    const applyFee = applyFeeByRequest.value[reqId] === true
    if (method === 'pickup' && opts.pickup?.available) {
        const total = applyFee ? opts.pickup.total_fee_applied : opts.pickup.total
        return total != null ? Number(total) : null
    }
    if (method === 'delivery') {
        const rate = selectedDeliveryRate(req)
        if (rate) {
            // Rate replaces the own-rider stored fee: items + provider amount.
            const itemsBase = Number(deliveryItemsBase(req, opts))
            const total = itemsBase + Number(rate.amount ?? 0) - (applyFee ? Number(opts.request_fee ?? 0) : 0)
            return Number(Math.max(0, total).toFixed(2))
        }
        const total = applyFee ? opts.delivery?.total_fee_applied : opts.delivery?.total
        return total != null ? Number(total) : null
    }
    return null
})
// The payment block's live total stands in for the estimate once it is on screen.
const paymentTotalShown = (request: OrderRequest | null): boolean =>
    !!request && canPayRequest(request) && !request.pending_decisions?.length && selectedMethodTotal.value != null
// What the chosen delivery costs, for the line under the total.
const selectedDeliveryAmount = computed<number | null>(() => {
    const req = selectedRequest.value
    if (!req || req.id == null || selectedMethodTotal.value == null) return null
    const method = req.fulfillment_type ?? selectedPaymentMethodByRequest.value[req.id]
    if (method !== 'delivery') return null
    const rate = selectedDeliveryRate(req)
    const amount = rate ? Number(rate.amount ?? 0) : Number(paymentOptionsByRequest.value[req.id]?.delivery?.fee ?? NaN)
    return Number.isFinite(amount) && amount > 0 ? amount : null
})
// Total charged via Paystack = order total + Paystack processing fee (1.95% + GHS 0.50)
const paystackChargeTotal = computed<number | null>(() => {
    const base = selectedMethodTotal.value
    if (base == null) return null
    const fee = Math.round((base * 0.0195 + 0.50) * 100) / 100
    return Math.round((base + fee) * 100) / 100
})

const payNeedsChoice = computed<boolean>(() => !!selectedRequest.value && !canPayWithSelection(selectedRequest.value))
const walletShort = computed<boolean>(() => !payNeedsChoice.value && selectedMethodTotal.value != null && walletBalance.value < selectedMethodTotal.value)
const walletBlockReason = computed<string>(() => {
    if (payNeedsChoice.value) return 'Choose pickup or delivery to see your total.'
    if (walletShort.value) return `Your wallet has GHS ${walletBalance.value.toFixed(2)}. Top up to pay with it.`
    return ''
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

// Items base for a provider-rate total: options subtotal, else request items_total.
const deliveryItemsBase = (req: OrderRequest | null, opts?: PaymentOptions): number => {
    if (!req) return 0
    const fromOpts = Number((opts as unknown as { subtotal?: number | string } | undefined)?.subtotal)
    if (Number.isFinite(fromOpts) && fromOpts > 0) return fromOpts
    return Number(req.items_total ?? 0)
}

// Currently selected provider rate for a request (null = own-rider stored fee).
const selectedDeliveryRate = (req: OrderRequest | null) => {
    if (!req || req.id == null) return null
    const key = selectedRateByRequest.value[req.id]
    if (!key) return null
    const rates = req.id != null ? paymentOptionsByRequest.value[req.id]?.delivery?.provider_rates : undefined
    return (rates ?? []).find((r) => `${r.provider_code}:${r.service_level ?? 'standard'}` === key) ?? null
}

// Delivery card headline: rate-aware total when a provider rate is picked.
const deliveryDisplayTotal = (req: OrderRequest | null): number | null => {
    if (!req || req.id == null) return null
    const opts = paymentOptionsByRequest.value[req.id]
    if (!opts) return null
    const applyFee = applyFeeByRequest.value[req.id] === true
    const rate = selectedDeliveryRate(req)
    if (rate) {
        const total = deliveryItemsBase(req, opts) + Number(rate.amount ?? 0) - (applyFee ? Number(opts.request_fee ?? 0) : 0)
        return Number(Math.max(0, total).toFixed(2))
    }
    const total = applyFee ? opts.delivery?.total_fee_applied : opts.delivery?.total
    return total != null ? Number(total) : null
}

const chooseDeliveryRate = (requestId: number | string, rate: { provider_code?: string; service_level?: string }): void => {
    if (!requestId) return
    selectedRateByRequest.value = {
        ...selectedRateByRequest.value,
        [requestId]: `${rate.provider_code}:${rate.service_level ?? 'standard'}`
    }
    // Picking a rate IS picking Delivery — select the method so totals + pay follow.
    if (selectedPaymentMethodByRequest.value[requestId] !== 'delivery') {
        choosePaymentMethod(requestId, 'delivery')
    }
}
const submitFulfillmentChoice = async (requestId: number | string, method: string): Promise<{ data?: unknown; message?: string }> => {
    const body: Record<string, unknown> = { fulfillment_type: method }
    if (method === 'delivery') {
        const rate = selectedRequest.value?.id === requestId ? selectedDeliveryRate(selectedRequest.value) : null
        if (rate) {
            body.provider_code = rate.provider_code
            body.service_level = rate.service_level ?? 'standard'
        }
        const contact = selectedRequest.value?.id === requestId ? deliveryContactResult(selectedRequest.value) : null
        if (contact?.ok && contact.phone) body.contact_phone = contact.phone
        const receiver = selectedRequest.value?.id === requestId && receiverOffered(selectedRequest.value) && receiverResult.value.ok
            ? receiverResult.value.receiver
            : null
        if (receiver) Object.assign(body, receiver)
    }
    const res = await apiCall('PUT', `/api/order-requests/customer/${String(requestId)}/fulfillment`, body)
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
    payError.value = ''

    const request = selectedRequest.value
    if (requiresMethodSelection(request)) {
        const chosen = selectedPaymentMethodByRequest.value[id]
        if (!chosen) {
            payError.value = 'Choose pickup or delivery first.'
            return
        }
        try {
            await submitFulfillmentChoice(id, chosen)
        } catch (err) {
            payError.value = err instanceof Error ? err.message : 'We could not save your choice. Please try again.'
            return
        }
    }

    payingRequest.value = true
    payingMethod.value = method
    try {
        paymentShortfall.value = { requestId: null, amount: 0 }

        const opts = paymentOptionsByRequest.value[id]
        const feeApplicable = Boolean(opts?.fee_applicable)
        const applyFee = feeApplicable ? applyFeeByRequest.value[id] === true : undefined
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
        } else {
            payError.value = e.message ?? `We could not start your ${method === 'paystack' ? 'card' : 'wallet'} payment. Nothing was charged. Please try again.`
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
        if (!props.initialRequestId && awaitingPaymentRequests.value.length > 0) {
            requestListTab.value = 'awaiting_payment'
        }
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
    // Flush any pending draft save immediately so a quick tab switch
    // (before the 1-second debounce fires) doesn't lose entered medications.
    if (isNewView.value) {
        if (formDraftSaveTimer) {
            clearTimeout(formDraftSaveTimer)
            formDraftSaveTimer = null
        }
        saveFormDraft()
    }
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
</style>
