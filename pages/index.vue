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
          <div class="container mx-auto px-8 relative z-10 flex items-center justify-center lg:justify-start pt-56 pb-8">
            <div class="w-full max-w-md">
              <!-- skeleton while checkAuthState() is resolving -->
              <div v-if="userStore.isLoading" class="overflow-hidden rounded-[2rem] bg-[#fff7ff] shadow-[0_24px_32px_rgba(30,26,34,0.06)] animate-pulse">
                <div class="px-6 pt-5 pb-4 border-b border-[#f0e6fa]">
                  <div class="h-7 w-44 bg-[#efdbff] rounded-lg"></div>
                </div>
                <div class="bg-white px-6 py-5 space-y-4">
                  <div class="space-y-1.5">
                    <div class="h-3.5 w-28 bg-[#f0e6fa] rounded"></div>
                    <div class="h-11 bg-[#f7f1ff] rounded-xl"></div>
                  </div>
                  <div class="space-y-1.5">
                    <div class="h-3.5 w-20 bg-[#f0e6fa] rounded"></div>
                    <div class="h-11 bg-[#f7f1ff] rounded-xl"></div>
                  </div>
                  <div class="h-12 bg-[#efdbff] rounded-xl"></div>
                </div>
              </div>
              <Login v-else inline @login-success="handleLoginSuccess" />
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
