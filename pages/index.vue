<template>
  <div class="min-h-screen bg-[#f6f1ff] text-slate-900">
    <Transition enter-from-class="opacity-0 translate-y-2" enter-active-class="transition duration-200" leave-to-class="opacity-0 translate-y-2" leave-active-class="transition duration-200">
      <div v-if="toast" class="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white" :class="toast.type === 'success' ? 'bg-[#520094]' : 'bg-red-600'">
        {{ toast.text }}
      </div>
    </Transition>

    <div class="font-primary bg-[#fff7ff]">
      <main class="pt-20 bg-[#fff7ff] pb-20 lg:pb-0">
        <!-- Hero Section -->
        <section class="relative min-h-[calc(100svh-80px)] flex items-end lg:items-center overflow-hidden pb-6 lg:pb-0">
          <!-- Background Image -->
          <div class="absolute inset-0 z-0">
            <picture>
              <source media="(min-width: 1024px)" :srcset="heroOrderingImage" />
              <img src="/hero_image_mobile.png" alt="" class="w-full h-full object-cover object-top lg:object-center" />
            </picture>
            <div class="absolute inset-0 bg-[#fff7ff]/20 lg:hidden"></div>
            <div class="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#fff7ff]/95 via-[#fff7ff]/40 to-transparent"></div>
          </div>
          <div class="container mx-auto px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div class="max-w-2xl bg-white/75 backdrop-blur-md rounded-3xl p-5 lg:bg-transparent lg:backdrop-blur-none lg:rounded-none lg:p-0">
              <h1 class="text-[1.75rem] sm:text-[2.75rem] lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-[#520094] mb-3 lg:mb-6">
                Find any medication, <span class="text-[#520094]">anywhere.</span>
              </h1>
              <p class="text-sm text-[#4c4453] mb-5 font-medium leading-relaxed lg:hidden">
                Get any medication delivered in 45 minutes.
              </p>
              <p class="hidden lg:block text-[1rem] text-[#4c4453] mb-10 font-medium leading-relaxed">
                Expert care, delivered. Connecting you to over 210+ verified pharmacies across Ghana for seamless healthcare access.
              </p>
              <!-- Mobile-only CTA -->
              <button
                type="button"
                @click="openOrderFlow([])"
                class="lg:hidden w-full flex items-center justify-center gap-2 rounded-full bg-[#520094] hover:bg-[#6c24b3] px-8 py-3.5 text-white font-bold text-base shadow-lg shadow-[#520094]/30 transition-all active:scale-95 mb-4"
              >
                <BeakerIcon class="w-[22px] h-[22px]" />
                Request medication
              </button>

              <!-- Search & CTA (desktop only) -->
              <div class="hidden lg:flex flex-col space-y-4 max-w-lg">
                <form class="space-y-4" @submit.prevent="submitHomepageSearch">
                  <!-- Unified Input Bar -->
                  <div class="relative flex flex-row items-center bg-white rounded-[2.5rem] p-1.5 border border-[#ead6fd] shadow-[0_8px_30px_rgb(82,0,148,0.12)] transition-all duration-200 focus-within:ring-4 focus-within:ring-[#520094]/10 focus-within:shadow-[0_10px_40px_rgb(82,0,148,0.2)] focus-within:-translate-y-0.5">
                    <!-- Main Input Area -->
                    <div class="relative flex-1 min-w-0 flex items-center">
                      <label for="medicine-search" class="sr-only">Medicine name</label>
                      <MagnifyingGlassIcon class="w-6 h-6 shrink-0 text-[#cbb5e1] pl-3 pr-1" />
                      <input
                        id="medicine-search"
                        v-model="homepageSearchTerm"
                        class="w-full bg-transparent border-none py-3 text-[#1e1a22] focus:ring-0 placeholder:text-[#d3c2e1] outline-none font-semibold text-[14px] md:text-[15px] pr-2"
                        placeholder="Type the medicine you need..."
                        type="text"
                      />
                    </div>

                    <!-- Divider -->
                    <div class="w-px h-8 bg-gradient-to-b from-transparent via-[#ead6fd] to-transparent mx-1.5 opacity-80 shrink-0"></div>

                    <!-- Right Controls: Unit & Submit -->
                    <div class="flex items-center gap-1.5 pr-1 shrink-0">
                      <div class="w-[90px] md:w-[110px] relative h-[44px]">
                        <label for="medicine-unit" class="sr-only">Quantity and unit</label>
                        <select
                          id="medicine-unit"
                          v-model="homepageRequestedUnit"
                          class="w-full h-full rounded-[2rem] border-2 border-transparent hover:border-[#ead6fd] focus:border-[#cbb5e1] bg-[#fbf5ff] pl-3 pr-8 py-0 text-[13px] font-semibold text-[#520094] outline-none transition-all duration-200 focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23520094%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_10px_center] bg-no-repeat cursor-pointer"
                        >
                          <option value="" class="text-[#a890bd] font-semibold">Unit</option>
                          <option v-for="option in medicineUnitOptions" :key="option" :value="option" class="font-semibold text-[#1e1a22]">{{ option }}</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        @click="addHomepageCurrentItem"
                        :disabled="!homepageSearchTerm.trim()"
                        class="h-[44px] flex-shrink-0 inline-flex items-center justify-center gap-1 rounded-[2rem] bg-gradient-to-r from-[#6c24b3] to-[#520094] pl-4 pr-5 text-[13px] font-bold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#520094]/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:from-[#efe2ff] disabled:to-[#efe2ff] disabled:text-[#cbb5e1] disabled:shadow-none disabled:transform-none"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <!-- hidden file input -->
                  <input
                    ref="homepageImagePicker"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onHomepagePrescriptionImageSelected"
                  />

                  <!-- "or upload prescription" divider + button -->
                  <div class="flex items-center gap-3">
                    <div class="flex-1 h-px bg-[#ead6fd]"></div>
                    <span class="text-xs font-semibold text-[#c4abde] uppercase tracking-widest">or</span>
                    <div class="flex-1 h-px bg-[#ead6fd]"></div>
                  </div>
                  <button
                    type="button"
                    @click="homepageImagePicker?.click()"
                    class="w-full flex items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-[#d4b0f7] bg-white py-3.5 text-[14px] font-semibold text-[#520094] transition hover:border-[#b98ae0] hover:bg-[#faf5ff]"
                  >
                    <ArrowUpTrayIcon class="w-5 h-5" />
                    Upload prescription image
                  </button>

                  <div v-if="homepagePrescriptionImagePreview" class="flex items-center gap-3 rounded-2xl border border-[#d9bcfa] bg-white px-3 py-2.5 shadow-sm">
                    <img :src="homepagePrescriptionImagePreview" alt="Prescription preview" class="h-12 w-12 rounded-xl object-cover flex-shrink-0 border border-[#efdbff]" />
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-[#1e1a22] truncate">{{ homepagePrescriptionImage?.name }}</p>
                      <p class="text-[11px] text-[#7d7484] mt-0.5">Prescription · {{ homepagePrescriptionImage ? (homepagePrescriptionImage.size / 1024).toFixed(0) + ' KB' : '' }}</p>
                    </div>
                    <button type="button" @click="removeHomepagePrescriptionImage" class="flex-shrink-0 h-8 w-8 rounded-full bg-[#f3e8ff] text-[#520094] flex items-center justify-center hover:bg-[#e9d5ff] transition-colors" aria-label="Remove prescription image">
                      <XMarkIcon class="w-4 h-4" />
                    </button>
                  </div>

                  <div v-if="homepageSelectedItems.length" class="rounded-[1.75rem] border border-[#d9bcfa] bg-gradient-to-br from-white via-[#fff8ff] to-[#f8edff] px-4 py-4 shadow-[0_24px_55px_-28px_rgba(82,0,148,0.42)] ring-1 ring-[#f3e3ff]">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-start gap-3">
                        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#520094] text-white shadow-[0_14px_30px_-18px_rgba(82,0,148,0.7)]">
                          <BeakerIcon class="w-5 h-5" />
                        </div>
                        <div>
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-bold text-[#1e1a22]">Request list</p>
                            <span class="inline-flex min-w-[1.8rem] items-center justify-center rounded-full bg-[#520094] px-2 py-1 text-[11px] font-extrabold text-white">
                              {{ homepageSelectedItems.length }}
                            </span>
                          </div>
                          <p class="mt-1 text-xs font-medium text-[#655b6d]">{{ homepageSelectedItems.length }} product<span v-if="homepageSelectedItems.length !== 1">s</span> selected · {{ homepageSelectedQuantity }} unit<span v-if="homepageSelectedQuantity !== 1">s</span> queued</p>
                        </div>
                      </div>
                      <button type="button" @click="clearHomepageSelectedItems" class="inline-flex items-center gap-1 rounded-full border border-[#e4ccfb] bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#520094] transition hover:border-[#d4b0f7] hover:bg-[#faf3ff]">
                        <TrashIcon class="w-3.5 h-3.5" />
                        Clear
                      </button>
                    </div>
                    <div class="mt-4 flex flex-wrap gap-2.5">
                      <div
                        v-for="(item, index) in homepageSelectedItems"
                        :key="`${item.product_name}-${item.requested_unit || 'none'}-${index}`"
                        class="inline-flex items-center gap-2 rounded-full border border-[#ead6fd] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1e1a22] shadow-[0_10px_26px_-22px_rgba(82,0,148,0.55)]"
                      >
                        <span>{{ item.product_name }}</span>
                        <span v-if="item.requested_unit" class="rounded-full bg-[#faf5ff] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#6f35ad]">{{ item.requested_unit }}</span>
                        <div class="inline-flex items-center rounded-full border border-[#ead6fd] bg-[#faf5ff] p-1">
                          <button
                            type="button"
                            @click="decreaseHomepageSelectedItemQuantity(index)"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#520094] transition hover:bg-[#efdbff]"
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon class="w-4 h-4" />
                          </button>
                          <span class="min-w-[2rem] text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f35ad]">Qty {{ item.quantity }}</span>
                          <button
                            type="button"
                            @click="increaseHomepageSelectedItemQuantity(index)"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#520094] transition hover:bg-[#efdbff]"
                            aria-label="Increase quantity"
                          >
                            <PlusIcon class="w-4 h-4" />
                          </button>
                        </div>
                        <button type="button" @click="removeHomepageSelectedItem(index)" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#efdbff] text-[#520094] transition hover:bg-[#e5cffc]" :aria-label="`Remove ${item.product_name}`">
                          <XMarkIcon class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button class="w-full md:w-fit px-10 py-5 bg-[#520094] hover:bg-[#6c24b3] text-white rounded-full font-semibold text-lg shadow-lg shadow-[#520094]/20 transition-all active:scale-95" type="submit">
                    Request medication<span v-if="homepageSelectedQuantity"> ({{ homepageSelectedQuantity }})</span>
                  </button>
                </form>
              </div>
              <!-- Trust Bar -->
              <div class="mt-12 flex items-center gap-4">
                <div class="flex -space-x-3">
                  <div class="w-10 h-10 rounded-full border-2 border-[#fff7ff] bg-[#efdbff] flex items-center justify-center text-[10px] font-bold text-[#520094]">AK</div>
                  <div class="w-10 h-10 rounded-full border-2 border-[#fff7ff] bg-[#e8def8] flex items-center justify-center text-[10px] font-bold text-[#625b71]">KA</div>
                  <div class="w-10 h-10 rounded-full border-2 border-[#fff7ff] bg-[#dbb8ff] flex items-center justify-center text-[10px] font-bold text-[#6c24b3]">AO</div>
                </div>
                <p class="text-sm font-semibold text-[#4c4453]">Secure &amp; trusted by 5,000+ Ghanaians</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Stats -->
        <section class="bg-[#faf0fd] py-16">
          <div class="container mx-auto px-8">
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div class="bg-white p-8 rounded-lg flex items-center gap-6">
                <div class="w-14 h-14 bg-[#efdbff] rounded-2xl flex items-center justify-center text-[#520094]">
                  <BuildingStorefrontIcon class="w-7 h-7" />
                </div>
                <div>
                  <div class="text-2xl font-bold text-[#1e1a22]">210+</div>
                  <div class="text-sm text-[#4c4453] font-medium">Verified pharmacies</div>
                </div>
              </div>
              <div class="bg-white p-8 rounded-lg flex items-center gap-6">
                <div class="w-14 h-14 bg-[#e8def8] rounded-2xl flex items-center justify-center text-[#625b71]">
                  <BoltIcon class="w-7 h-7" />
                </div>
                <div>
                  <div class="text-2xl font-bold text-[#1e1a22]">45min</div>
                  <div class="text-sm text-[#4c4453] font-medium">Avg. delivery time</div>
                </div>
              </div>
              <div class="bg-white p-8 rounded-lg flex items-center gap-6">
                <div class="w-14 h-14 bg-[#ffdcbf] rounded-2xl flex items-center justify-center text-[#552e00]">
                  <CheckBadgeIcon class="w-7 h-7" />
                </div>
                <div>
                  <div class="text-2xl font-bold text-[#1e1a22]">100%</div>
                  <div class="text-sm text-[#4c4453] font-medium">Genuine meds</div>
                </div>
              </div>
              <div class="bg-white p-8 rounded-lg flex items-center gap-6">
                <div class="w-14 h-14 bg-[#dbb8ff] rounded-2xl flex items-center justify-center text-[#6c24b3]">
                  <ChatBubbleLeftRightIcon class="w-7 h-7" />
                </div>
                <div>
                  <div class="text-2xl font-bold text-[#1e1a22]">24/7</div>
                  <div class="text-sm text-[#4c4453] font-medium">Expert support</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Coverage Strip -->
        <div class="bg-[#520094] py-2.5">
          <div class="container mx-auto px-8">
            <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-white text-sm font-medium">
              <span class="flex items-center gap-1.5">
                <MapPinIcon class="w-[18px] h-[18px] text-[#dbb8ff]" />
                Accra
              </span>
              <span class="text-[#dbb8ff] select-none" aria-hidden="true">·</span>
              <span class="flex items-center gap-1.5">
                <MapPinIcon class="w-[18px] h-[18px] text-[#dbb8ff]" />
                Kumasi
              </span>
              <span class="text-[#dbb8ff] select-none" aria-hidden="true">·</span>
              <span class="flex items-center gap-1.5">
                <MapPinIcon class="w-[18px] h-[18px] text-[#dbb8ff]" />
                Takoradi
              </span>
              <span class="text-[#dbb8ff] select-none" aria-hidden="true">·</span>
              <span class="flex items-center gap-1.5">
                <MapPinIcon class="w-[18px] h-[18px] text-[#dbb8ff]" />
                Tamale
              </span>
              <span class="text-[#dbb8ff] select-none mx-2" aria-hidden="true">|</span>
              <span class="text-[#dbb8ff] text-xs font-semibold tracking-wide">More cities coming soon</span>
            </div>
          </div>
        </div>

        <!-- How It Works -->
        <section id="how-it-works" class="py-24 bg-[#fff7ff] overflow-hidden">
          <div class="container mx-auto px-8">
            <div class="text-center mb-20">
              <h2 class="text-[2.5rem] font-semibold text-[#1e1a22] mb-4">How it works</h2>
              <p class="text-[#4c4453] max-w-xl mx-auto">Get your prescriptions filled in three simple steps without leaving your home.</p>
            </div>
            <div class="grid md:grid-cols-3 gap-12 relative">
              <!-- Step 1 -->
              <div class="group">
                <div class="relative mb-8 rounded-lg overflow-hidden h-[400px]">
                  <img class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" alt="Person using a smartphone to search for medication" src="/request_med_image.png" />
                  <div class="absolute top-6 left-6 w-12 h-12 bg-[#520094] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">1</div>
                </div>
                <h3 class="text-xl font-semibold text-[#1e1a22] mb-3">Upload or list</h3>
                <p class="text-[#4c4453] leading-relaxed">Securely upload your prescription or search for over-the-counter essentials from our database.</p>
              </div>
              <!-- Step 2 -->
              <div class="group">
                <div class="relative mb-8 rounded-lg overflow-hidden h-[400px]">
                  <img class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" alt="Pharmacist picking and verifying a medication order" src="/pharmacist_picking_order.png" />
                  <div class="absolute top-6 left-6 w-12 h-12 bg-[#520094] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">2</div>
                </div>
                <h3 class="text-xl font-semibold text-[#1e1a22] mb-3">We source and verify</h3>
                <p class="text-[#4c4453] leading-relaxed">Our system checks stock across 210+ verified pharmacies to find the best price and availability.</p>
              </div>
              <!-- Step 3 -->
              <div class="group">
                <div class="relative mb-8 rounded-lg overflow-hidden h-[400px]">
                  <img class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" alt="Delivery rider handing medication to a customer" src="/drug_delivery.png" />
                  <div class="absolute top-6 left-6 w-12 h-12 bg-[#520094] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">3</div>
                </div>
                <h3 class="text-xl font-semibold text-[#1e1a22] mb-3">Confirm and receive</h3>
                <p class="text-[#4c4453] leading-relaxed">Confirm your order with a secure payment and have it delivered to your doorstep in under 45 minutes.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Testimonials -->
        <section class="py-24 bg-[#f4ebf7]">
          <div class="container mx-auto px-8">
            <h2 class="text-3xl font-semibold text-[#1e1a22] mb-12">What customers are saying</h2>
            <div class="grid md:grid-cols-3 gap-8">
              <!-- Testimonial 1 -->
              <div class="bg-white p-10 rounded-lg">
                <div class="flex gap-1 mb-6 text-[#E8A33A]">
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                </div>
                <p class="text-[#1e1a22] text-lg leading-relaxed italic mb-8">"I couldn't find my father's chronic medication anywhere in Kumasi. MedsGh found it in 15 minutes and delivered it the same hour. Lifesavers!"</p>
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-[#efdbff] flex items-center justify-center font-bold text-[#520094]">KA</div>
                  <div>
                    <div class="font-bold text-[#1e1a22]">Kofi Adjei</div>
                    <div class="text-sm text-[#7d7484]">Verified patient</div>
                  </div>
                </div>
              </div>
              <!-- Testimonial 2 -->
              <div class="bg-white p-10 rounded-lg">
                <div class="flex gap-1 mb-6 text-[#E8A33A]">
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                </div>
                <p class="text-[#1e1a22] text-lg leading-relaxed italic mb-8">"The telehealth integration is seamless. Had a consultation and my meds were on their way before I even hung up the call. Amazing service."</p>
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-[#e8def8] flex items-center justify-center font-bold text-[#625b71]">AM</div>
                  <div>
                    <div class="font-bold text-[#1e1a22]">Ama Mensah</div>
                    <div class="text-sm text-[#7d7484]">Verified patient</div>
                  </div>
                </div>
              </div>
              <!-- Testimonial 3 -->
              <div class="bg-white p-10 rounded-lg">
                <div class="flex gap-1 mb-6 text-[#E8A33A]">
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                  <StarIcon class="w-5 h-5" />
                </div>
                <p class="text-[#1e1a22] text-lg leading-relaxed italic mb-8">"As a busy professional, I don't have time to hop from pharmacy to pharmacy. MedsGh makes medication management effortless and secure."</p>
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-[#ffdcbf] flex items-center justify-center font-bold text-[#552e00]">DO</div>
                  <div>
                    <div class="font-bold text-[#1e1a22]">Dr. Owusu</div>
                    <div class="text-sm text-[#7d7484]">Healthcare provider</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Pharmacy Partner Section -->
        <template v-if="false">
        <section id="for-pharmacies" class="py-20 bg-[#1e0a2e]">
          <div class="container mx-auto px-8">
            <div class="grid lg:grid-cols-2 gap-16 items-center">

              <!-- Left Column -->
              <div>
                <span class="inline-flex items-center gap-2 rounded-full border border-[#5c2d8a] bg-[#2d1050] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#dbb8ff] mb-6">
                  <BuildingStorefrontIcon class="w-[14px] h-[14px]" />
                  For Pharmacies
                </span>

                <h2 class="text-[2rem] lg:text-[2.5rem] font-semibold leading-[1.15] text-white mb-5">
                  Grow your pharmacy<br />with the MedsGh network.
                </h2>
                <p class="text-[#c4b0d8] leading-relaxed mb-8 max-w-lg">
                  Join over 210 verified pharmacy partners already using MedsGh to reach thousands of patients across Ghana. No software to install, no upfront costs — just more orders.
                </p>

                <ul class="space-y-4 mb-10">
                  <li class="flex items-start gap-3">
                    <span class="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[#520094] flex items-center justify-center">
                      <ArrowTrendingUpIcon class="w-4 h-4 text-white" />
                    </span>
                    <div>
                      <p class="font-semibold text-white text-sm">More orders, zero effort</p>
                      <p class="text-[#a390b8] text-xs mt-0.5">Receive verified patient requests directly — no marketing spend needed.</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[#520094] flex items-center justify-center">
                      <CurrencyDollarIcon class="w-4 h-4 text-white" />
                    </span>
                    <div>
                      <p class="font-semibold text-white text-sm">Zero setup cost</p>
                      <p class="text-[#a390b8] text-xs mt-0.5">Onboard for free. We only succeed when you succeed.</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <span class="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[#520094] flex items-center justify-center">
                      <ChartBarIcon class="w-4 h-4 text-white" />
                    </span>
                    <div>
                      <p class="font-semibold text-white text-sm">Real-time analytics</p>
                      <p class="text-[#a390b8] text-xs mt-0.5">Track orders, inventory demand, and patient trends from your dashboard.</p>
                    </div>
                  </li>
                </ul>

                <div class="flex flex-wrap gap-3">
                  <a
                    href="mailto:support@medsgh.com?subject=Pharmacy+Partner+Application"
                    class="inline-flex items-center gap-2 rounded-full bg-[#520094] hover:bg-[#6c24b3] px-6 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-[#520094]/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <EnvelopeIcon class="w-[18px] h-[18px]" />
                    Apply to Partner
                  </a>
                  <a
                    href="tel:+233556637717"
                    class="inline-flex items-center gap-2 rounded-full border border-[#5c2d8a] bg-[#2d1050] hover:bg-[#3d1a66] px-6 py-3 text-sm font-bold text-[#dbb8ff] transition-all"
                  >
                    <PhoneIcon class="w-[18px] h-[18px]" />
                    Call Us
                  </a>
                </div>
              </div>

              <!-- Right Column: Stat Cards -->
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-2xl border border-[#3d1a66] bg-[#2a0f45] p-6">
                  <div class="text-3xl font-bold text-white mb-1">210+</div>
                  <div class="text-sm text-[#a390b8] font-medium">Partner pharmacies</div>
                  <BuildingStorefrontIcon class="w-6 h-6 text-[#520094] mt-3 block" />
                </div>
                <div class="rounded-2xl border border-[#3d1a66] bg-[#2a0f45] p-6">
                  <div class="text-3xl font-bold text-white mb-1">5k+</div>
                  <div class="text-sm text-[#a390b8] font-medium">Patients served</div>
                  <UserGroupIcon class="w-6 h-6 text-[#520094] mt-3 block" />
                </div>
                <div class="rounded-2xl border border-[#3d1a66] bg-[#2a0f45] p-6">
                  <div class="text-3xl font-bold text-white mb-1">45min</div>
                  <div class="text-sm text-[#a390b8] font-medium">Avg. fulfillment</div>
                  <BoltIcon class="w-6 h-6 text-[#520094] mt-3 block" />
                </div>
                <div class="rounded-2xl border border-[#3d1a66] bg-[#2a0f45] p-6">
                  <div class="text-3xl font-bold text-white mb-1">100%</div>
                  <div class="text-sm text-[#a390b8] font-medium">Verified partners</div>
                  <CheckBadgeIcon class="w-6 h-6 text-[#520094] mt-3 block" />
                </div>
              </div>

            </div>
          </div>
        </section>
        </template>

        <!-- FAQ Section -->
        <section id="support" class="py-24 bg-[#fff7ff]">
          <div class="container mx-auto px-8 max-w-4xl">
            <h2 class="text-[2.5rem] font-semibold text-[#1e1a22] mb-12 text-center">You may be wondering</h2>
            <div class="space-y-4">
              <details class="group bg-[#faf0fd] rounded-lg p-6 cursor-pointer" open>
                <summary class="flex items-center justify-between font-bold text-lg text-[#1e1a22] list-none">
                  Are the pharmacies on MedsGh licensed?
                  <ChevronDownIcon class="w-5 h-5 transition group-open:rotate-180" />
                </summary>
                <p class="mt-4 text-[#4c4453] leading-relaxed">
                  Yes, every pharmacy in our network is fully accredited by the Pharmacy Council of Ghana. We strictly verify licenses and compliance records before onboarding any partner to ensure your safety.
                </p>
              </details>
              <details class="group bg-[#faf0fd] rounded-lg p-6 cursor-pointer">
                <summary class="flex items-center justify-between font-bold text-lg text-[#1e1a22] list-none">
                  How do you handle prescription medications?
                  <ChevronDownIcon class="w-5 h-5 transition group-open:rotate-180" />
                </summary>
                <p class="mt-4 text-[#4c4453] leading-relaxed">
                  For prescription-only medicines, you are required to upload a clear photo or digital copy of a valid prescription. Our pharmacists verify these documents before processing your order.
                </p>
              </details>
              <details class="group bg-[#faf0fd] rounded-lg p-6 cursor-pointer">
                <summary class="flex items-center justify-between font-bold text-lg text-[#1e1a22] list-none">
                  What is the delivery radius?
                  <ChevronDownIcon class="w-5 h-5 transition group-open:rotate-180" />
                </summary>
                <p class="mt-4 text-[#4c4453] leading-relaxed">
                  We currently operate across all major cities in Ghana, including Accra, Kumasi, Takoradi, and Tamale. We are rapidly expanding our partner network to reach more rural areas soon.
                </p>
              </details>
            </div>
          </div>
        </section>

        <!-- Quality Badges -->
        <section class="py-12 bg-[#faf0fd]">
          <div class="container mx-auto px-8">
            <div class="flex flex-wrap justify-center items-center gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              <div class="flex items-center gap-3">
                <ShieldCheckIcon class="w-7 h-7 text-[#520094]" />
                <span class="font-semibold text-[#1e1a22] text-sm uppercase tracking-wider">Pharmacy Council accredited member</span>
              </div>
              <div class="flex items-center gap-3">
                <CreditCardIcon class="w-7 h-7 text-[#520094]" />
                <span class="font-semibold text-[#1e1a22] text-sm uppercase tracking-wider">PCI-DSS compliant</span>
              </div>
              <div class="flex items-center gap-3">
                <HeartIcon class="w-7 h-7 text-[#520094]" />
                <span class="font-semibold text-[#1e1a22] text-sm uppercase tracking-wider">G-Health certified</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Mobile Sticky CTA -->
        <div class="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-[#ead6fd] bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-8px_30px_rgba(82,0,148,0.10)]">
          <div class="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div class="min-w-0">
              <p class="text-sm font-bold text-[#520094] leading-none">MedsGh</p>
              <p class="text-[11px] text-[#7d7484] font-medium mt-0.5 truncate">210+ pharmacies · 45min delivery</p>
            </div>
            <button
              type="button"
              @click="openOrderFlow([])"
              class="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-[#520094] hover:bg-[#6c24b3] px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-[#520094]/30 active:scale-95"
            >
              <BeakerIcon class="w-[18px] h-[18px]" />
              Request Meds
            </button>
          </div>
        </div>
      </main>

      <footer class="bg-[#faf0fd] w-full py-12 px-8 border-t border-[#cec2d5]/15">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-screen-2xl mx-auto">
          <div class="col-span-1 md:col-span-1">
            <div class="text-lg font-bold text-[#520094] mb-4">MedsGh</div>
            <p class="text-slate-500 text-sm leading-relaxed">
              Pioneering digital healthcare access in Ghana. Connecting patients with verified pharmacies for a healthier tomorrow.
            </p>
          </div>
          <div class="col-span-1">
            <h4 class="font-bold text-[#520094] mb-4 text-sm">Quick links</h4>
            <ul class="space-y-3 text-sm">
              <li><a class="text-slate-500 hover:text-[#6c24b3] underline-offset-4 hover:underline transition-opacity" href="#">Find a pharmacy</a></li>
              <li><a class="text-slate-500 hover:text-[#6c24b3] underline-offset-4 hover:underline transition-opacity" href="#">Request meds</a></li>
              <li><a class="text-slate-500 hover:text-[#6c24b3] underline-offset-4 hover:underline transition-opacity" href="#">Partner login</a></li>
              <li><a class="text-slate-500 hover:text-[#6c24b3] underline-offset-4 hover:underline transition-opacity" href="#">Wellness blog</a></li>
            </ul>
          </div>
          <div class="col-span-1">
            <h4 class="font-bold text-[#520094] mb-4 text-sm">Legal</h4>
            <ul class="space-y-3 text-sm">
              <li><a class="text-slate-500 hover:text-[#6c24b3] underline-offset-4 hover:underline transition-opacity" href="#">Privacy policy</a></li>
              <li><a class="text-slate-500 hover:text-[#6c24b3] underline-offset-4 hover:underline transition-opacity" href="#">Terms of service</a></li>
              <li><a class="text-slate-500 hover:text-[#6c24b3] underline-offset-4 hover:underline transition-opacity" href="#">Cookie settings</a></li>
              <li><a class="text-slate-500 hover:text-[#6c24b3] underline-offset-4 hover:underline transition-opacity" href="#">Accessibility</a></li>
            </ul>
          </div>
          <div class="col-span-1">
            <h4 class="font-bold text-[#520094] mb-4 text-sm">Connect</h4>
            <div class="flex gap-4 mb-6">
              <button class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#520094] shadow-sm hover:bg-[#520094] hover:text-white transition-all">
                <EnvelopeIcon class="w-5 h-5" />
              </button>
              <button class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#520094] shadow-sm hover:bg-[#520094] hover:text-white transition-all">
                <ShareIcon class="w-5 h-5" />
              </button>
              <button class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#520094] shadow-sm hover:bg-[#520094] hover:text-white transition-all">
                <PhoneIcon class="w-5 h-5" />
              </button>
            </div>
            <p class="text-xs text-slate-500">Contact us: rigelis@rigelisinc.com</p>
          </div>
        </div>
        <div class="mt-12 pt-8 border-t border-[#cec2d5]/15 max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-slate-500 text-sm">© {{ currentYear }} MedsGh Digital Care. All rights reserved.</p>
          <div class="flex items-center gap-6">
            <img alt="Visa" class="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" :src="'https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/card-logo-visa.svg'" />
            <img alt="Mastercard" class="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" :src="'https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/card-logo-mastercard.svg'" />
            <img alt="MTN Mobile Money" class="h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" :src="'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/mtn-mobile-logo-icon.svg'" />
          </div>
        </div>
      </footer>
    </div>

    <Login :is-open="showLoginModal" @close="showLoginModal = false" @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Login from '~/components/Login.vue'
import { useUserStore } from '~/stores/user'
import {
  BeakerIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  HeartIcon,
  ShareIcon,
} from '@heroicons/vue/24/outline'
import {
  StarIcon,
  CheckBadgeIcon,
} from '@heroicons/vue/24/solid'

interface DraftItem {
  product_name: string;
  requested_unit: string;
  quantity: number;
}

interface LoginPayload {
  destination?: string;
  [key: string]: unknown;
}

const userStore = useUserStore()
const route = useRoute()
const heroOrderingImage = '/Gemini_Generated_Image_y204fby204fby204.png'
const currentYear = new Date().getFullYear()

const showLoginModal = ref<boolean>(false)
const toast = ref<{ text: string; type: string } | null>(null)
const homepageSearchTerm = ref<string>('')
const homepageRequestedUnit = ref<string>('')
const homepageSelectedItems = ref<DraftItem[]>([])
const homepageImagePicker = ref<HTMLInputElement | null>(null)
const homepagePrescriptionImage = ref<File | null>(null)
const homepagePrescriptionImagePreview = ref<string | null>(null)

const HOMEPAGE_PRESCRIPTION_DRAFT_KEY = 'medsgh_homepage_prescription_image'

const onHomepagePrescriptionImageSelected = (e: Event): void => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (homepagePrescriptionImagePreview.value) URL.revokeObjectURL(homepagePrescriptionImagePreview.value)
  homepagePrescriptionImage.value = file
  homepagePrescriptionImagePreview.value = URL.createObjectURL(file)

  const reader = new FileReader()
  reader.onload = (ev) => {
    if (!process.client) return
    sessionStorage.setItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY, JSON.stringify({
      name: file.name,
      type: file.type,
      data: ev.target?.result,
    }))
  }
  reader.readAsDataURL(file)
}

const removeHomepagePrescriptionImage = (): void => {
  if (homepagePrescriptionImagePreview.value) URL.revokeObjectURL(homepagePrescriptionImagePreview.value)
  homepagePrescriptionImage.value = null
  homepagePrescriptionImagePreview.value = null
  if (homepageImagePicker.value) homepageImagePicker.value.value = ''
  if (process.client) sessionStorage.removeItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY)
}

const homepageSelectedQuantity = computed<number>(() => homepageSelectedItems.value.reduce((total, item) => {
  return total + Math.max(1, Number(item?.quantity ?? 1))
}, 0))

const HOMEPAGE_REQUEST_DRAFT_KEY = 'medsgh_homepage_request_draft'
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
  'other',
]

const showToast = (text: string, type = 'success'): void => {
  toast.value = { text, type }
  setTimeout(() => {
    toast.value = null
  }, 4000)
}

const normalizeHomepageDraftItem = (item: unknown): DraftItem | null => {
  const productName = String(
    typeof item === 'string' ? item : (item as Record<string, unknown>)?.['product_name'] ?? ''
  ).trim()
  if (!productName) return null

  const obj = item as Record<string, unknown> | null
  return {
    product_name: productName,
    requested_unit: String(obj?.['requested_unit'] ?? '').trim().toLowerCase(),
    quantity: Math.max(1, Number(obj?.['quantity'] ?? 1)),
  }
}

const persistHomepageRequestDraft = (items: DraftItem[] = []): void => {
  if (!process.client) return
  const normalizedItems = items
    .map(normalizeHomepageDraftItem)
    .filter((x): x is DraftItem => x !== null)

  if (!normalizedItems.length) {
    sessionStorage.removeItem(HOMEPAGE_REQUEST_DRAFT_KEY)
    return
  }

  sessionStorage.setItem(HOMEPAGE_REQUEST_DRAFT_KEY, JSON.stringify({
    items: normalizedItems,
    source: 'homepage-search',
  }))
}

const hasHomepageRequestDraft = (): boolean => {
  if (!process.client) return false
  return homepageSelectedItems.value.length > 0
    || Boolean(sessionStorage.getItem(HOMEPAGE_REQUEST_DRAFT_KEY))
    || Boolean(sessionStorage.getItem(HOMEPAGE_PRESCRIPTION_DRAFT_KEY))
}

const syncHomepageDraftItems = (): void => {
  persistHomepageRequestDraft(homepageSelectedItems.value)
}

const addHomepageSelectedItem = (item: unknown): boolean => {
  const normalized = normalizeHomepageDraftItem(item)
  if (!normalized) return false

  const existingIndex = homepageSelectedItems.value.findIndex((entry) =>
    entry.product_name.trim().toLowerCase() === normalized.product_name.trim().toLowerCase()
    && String(entry.requested_unit ?? '').trim().toLowerCase() === String(normalized.requested_unit ?? '').trim().toLowerCase()
  )

  if (existingIndex >= 0) {
    homepageSelectedItems.value = homepageSelectedItems.value.map((entry, index) => (
      index === existingIndex
        ? { ...entry, quantity: Math.max(1, Number(entry.quantity ?? 1)) + Math.max(1, Number(normalized.quantity ?? 1)) }
        : entry
    ))
    syncHomepageDraftItems()
    return true
  }

  homepageSelectedItems.value = [...homepageSelectedItems.value, normalized]
  syncHomepageDraftItems()
  return true
}

const addHomepageCurrentItem = (): void => {
  const added = addHomepageSelectedItem({
    product_name: homepageSearchTerm.value,
    requested_unit: homepageRequestedUnit.value,
    quantity: 1,
  })

  if (!added) return

  homepageSearchTerm.value = ''
  homepageRequestedUnit.value = ''
}

const updateHomepageSelectedItemQuantity = (index: number, nextQuantity: number): void => {
  const parsedQuantity = Math.max(1, Number(nextQuantity ?? 1))
  homepageSelectedItems.value = homepageSelectedItems.value.map((item, itemIndex) => (
    itemIndex === index
      ? { ...item, quantity: parsedQuantity }
      : item
  ))
  syncHomepageDraftItems()
}

const increaseHomepageSelectedItemQuantity = (index: number): void => {
  const item = homepageSelectedItems.value[index]
  if (!item) return
  updateHomepageSelectedItemQuantity(index, Number(item.quantity ?? 1) + 1)
}

const decreaseHomepageSelectedItemQuantity = (index: number): void => {
  const item = homepageSelectedItems.value[index]
  if (!item) return
  updateHomepageSelectedItemQuantity(index, Math.max(1, Number(item.quantity ?? 1) - 1))
}

const removeHomepageSelectedItem = (index: number): void => {
  homepageSelectedItems.value = homepageSelectedItems.value.filter((_, itemIndex) => itemIndex !== index)
  syncHomepageDraftItems()
}

const clearHomepageSelectedItems = (): void => {
  homepageSelectedItems.value = []
  syncHomepageDraftItems()
}

const openOrderFlow = (draftItems: DraftItem[] = []): void => {
  persistHomepageRequestDraft(draftItems)
  if (userStore.isLoggedIn) {
    void navigateTo('/customer?tab=new')
    return
  }
  showLoginModal.value = true
}

const submitHomepageSearch = (): void => {
  const query = homepageSearchTerm.value.trim()
  if (query) {
    addHomepageCurrentItem()
  }
  openOrderFlow(homepageSelectedItems.value)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const scrollToHowItWorks = (): void => {
  const target = document.getElementById('how-it-works')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  void navigateTo('/#how-it-works')
}

const handleLoginSuccess = async (payload: LoginPayload | { destination: string; action: string } = {}): Promise<void> => {
  showLoginModal.value = false
  if (payload.destination === 'new' || hasHomepageRequestDraft()) {
    await navigateTo('/customer?tab=new')
    return
  }
  await navigateTo('/customer')
}

const handleLoggedOutNotice = async (flag: unknown): Promise<void> => {
  if (!flag) return
  showToast('You have been logged out.', 'success')
  await navigateTo({ path: '/', query: {} }, { replace: true })
}

const redirectLoggedInUsers = async (): Promise<boolean> => {
  if (!userStore.isLoggedIn) return false
  if (hasHomepageRequestDraft()) {
    await navigateTo('/customer?tab=new', { replace: true })
    return true
  }
  await navigateTo('/customer', { replace: true })
  return true
}

onMounted(async () => {
  await (userStore as unknown as { checkAuthState: () => Promise<void> }).checkAuthState()
  await redirectLoggedInUsers()
})

watch(() => route.query['logged_out'], handleLoggedOutNotice, { immediate: true })
watch(
  () => userStore.isLoggedIn,
  async (isLoggedIn) => {
    if (!isLoggedIn) return
    await redirectLoggedInUsers()
  }
)
</script>

<style scoped>
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.4s ease-out;
}

details summary::-webkit-details-marker {
  display: none;
}
</style>
