<template>
  <div class="min-h-screen bg-[#f6f1ff] text-slate-900">
    <div v-if="!authResolved" class="flex min-h-screen items-center justify-center bg-[#f6f1ff]">
      <div class="h-8 w-48 animate-pulse rounded-xl bg-slate-200"></div>
    </div>

    <div v-else class="relative overflow-hidden pb-20 pt-28 sm:pt-32">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-16 left-[-120px] h-72 w-72 rounded-full bg-[#c8a1ff]/45 blur-3xl"></div>
        <div class="absolute right-[-120px] top-16 h-80 w-80 rounded-full bg-[#b18af5]/40 blur-3xl"></div>
        <div class="absolute bottom-[-120px] left-1/3 h-64 w-64 rounded-full bg-[#8650d5]/25 blur-3xl"></div>
      </div>

      <div class="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <section class="rounded-[2rem] border border-[#ddccff] bg-white/88 p-6 shadow-[0_30px_90px_-55px_rgba(92,39,180,0.7)] backdrop-blur-xl lg:p-10">
          <div class="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p class="inline-flex items-center gap-2 rounded-full bg-[#f1e9ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f35cb]">
                <i class="ri-shield-check-line"></i>
                Request-to-Order Care Workflow
              </p>

              <h1 class="mt-4 text-4xl font-black leading-[0.95] text-slate-900 sm:text-5xl lg:text-6xl">
                Request any medicine,
                <span class="block text-[#6f35cb]">we verify before you pay.</span>
              </h1>

              <p class="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Customers send drug requests, our team confirms stock availability and final pricing with pharmacies, then we create a clear order for approval and delivery.
              </p>

              <div class="mt-7 flex flex-wrap items-center gap-3">
                <button
                  @click="openOrderFlow"
                  class="inline-flex items-center gap-2 rounded-full bg-[#6f35cb] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_34px_-16px_rgba(111,53,203,0.9)] transition hover:-translate-y-0.5 hover:bg-[#6029b4]"
                >
                  <i class="ri-capsule-line text-base"></i>
                  Send Drug Request
                </button>
                <button
                  @click="scrollToHowItWorks"
                  class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#6f35cb] hover:text-[#6f35cb]"
                >
                  <i class="ri-flow-chart text-base"></i>
                  See Workflow
                </button>
              </div>

              <div class="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
                <span class="inline-flex items-center gap-1"><i class="ri-store-2-line text-[#6f35cb]"></i>Licensed pharmacy sourcing</span>
                <span class="inline-flex items-center gap-1"><i class="ri-price-tag-3-line text-[#6f35cb]"></i>Transparent final pricing</span>
                <span class="inline-flex items-center gap-1"><i class="ri-truck-line text-[#6f35cb]"></i>Delivery or pickup</span>
              </div>
            </div>

            <div class="relative mx-auto flex w-full max-w-md items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1000&q=80"
                alt="Medicine packaging and capsules"
                class="h-[320px] w-full rounded-[2rem] object-cover shadow-[0_30px_60px_-26px_rgba(15,23,42,0.55)] sm:h-[380px]"
              />
              <div class="absolute -bottom-5 right-4 rounded-2xl border border-white/70 bg-white/95 px-4 py-2 text-xs font-bold text-slate-700 shadow-lg">
                <i class="ri-check-double-line mr-1 text-[#6f35cb]"></i>
                Stock + price confirmed before checkout
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-3 sm:p-5">
          <article class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Step 1</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">Customer submits request or prescription</p>
          </article>
          <article class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Step 2</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">Team confirms availability and marked-up price</p>
          </article>
          <article class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Step 3</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">Order is created for customer approval and fulfillment</p>
          </article>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-black text-slate-900 sm:text-2xl">What Customers Request</h2>
            <nuxt-link to="/drugs" class="text-sm font-semibold text-[#6f35cb] transition hover:text-[#6029b4]">Browse examples</nuxt-link>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article v-for="category in categories" :key="category.name" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f1e9ff] text-[#6f35cb]">
                <i :class="[category.icon, 'text-lg']"></i>
              </div>
              <h3 class="mt-3 text-sm font-bold text-slate-900">{{ category.name }}</h3>
              <p class="mt-1 text-xs text-slate-500">{{ category.description }}</p>
            </article>
          </div>
        </section>

        <section id="how-it-works" class="rounded-3xl border border-[#dbc6ff] bg-[#f8f3ff] p-5 sm:p-7">
          <h2 class="text-xl font-black text-slate-900 sm:text-2xl">How It Works</h2>
          <div class="mt-5 grid gap-4 md:grid-cols-3">
            <article v-for="step in steps" :key="step.title" class="rounded-2xl border border-[#e5d6ff] bg-white p-4">
              <div class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f1e9ff] text-[#6f35cb]">
                <i :class="[step.icon, 'text-base']"></i>
              </div>
              <h3 class="mt-3 text-sm font-bold text-slate-900">{{ step.title }}</h3>
              <p class="mt-1 text-xs leading-5 text-slate-600">{{ step.description }}</p>
            </article>
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-black text-slate-900 sm:text-2xl">What We Confirm Before Order Creation</h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article v-for="item in featuredProducts" :key="item.name" class="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:shadow-md">
              <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{{ item.category }}</p>
              <h3 class="mt-2 text-sm font-bold text-slate-900">{{ item.name }}</h3>
              <p class="mt-1 text-xs text-slate-500">{{ item.note }}</p>
              <div class="mt-4 flex items-center justify-between">
                <p class="text-sm font-black text-[#6f35cb]">{{ item.price }}</p>
                <span class="rounded-full bg-[#f1e9ff] px-2.5 py-1 text-[11px] font-semibold text-[#6f35cb]">Verified</span>
              </div>
            </article>
          </div>
        </section>

        <section id="support" class="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <article class="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 class="text-xl font-black text-slate-900 sm:text-2xl">What Customers Say</h2>
            <div class="mt-4 space-y-3">
              <blockquote v-for="testimonial in testimonials" :key="testimonial.name" class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-700">"{{ testimonial.quote }}"</p>
                <footer class="mt-2 text-xs font-semibold text-slate-500">{{ testimonial.name }}</footer>
              </blockquote>
            </div>
          </article>

          <article class="rounded-3xl border border-[#7f4ac8] bg-[#6f35cb] p-6 text-white">
            <h3 class="text-lg font-black">Need Help Right Now?</h3>
            <p class="mt-2 text-sm text-[#f3e9ff]">Call or chat with our team to submit requests, verify prescriptions, and get order status updates.</p>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://wa.me/+233552587974"
              class="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#6f35cb] transition hover:bg-[#f4edff]"
            >
              <i class="ri-whatsapp-line"></i>
              Chat on WhatsApp
            </a>
            <a href="tel:+233552587974" class="mt-3 block text-sm font-semibold text-white/90 underline underline-offset-4">(+233) 55-258-7974</a>
          </article>
        </section>
      </div>

      <div v-if="toast" class="fixed bottom-6 right-6 z-50 animate-fade-up">
        <div class="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg" :class="toast.type === 'error' ? 'bg-red-500' : 'bg-[#6f35cb]'">
          <i :class="toast.type === 'error' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'" class="text-lg"></i>
          {{ toast.text }}
        </div>
      </div>

      <Login :is-open="showLoginModal" @close="showLoginModal = false" @login-success="handleLoginSuccess" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import Login from '~/components/Login.vue'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const route = useRoute()

const authResolved = ref(false)
const showLoginModal = ref(false)
const toast = ref(null)

const categories = [
  { name: 'Prescription Medicines', description: 'Upload scripts or request specific prescription products.', icon: 'ri-file-paper-2-line' },
  { name: 'Chronic Care Refills', description: 'Maintenance requests for blood pressure and diabetes care.', icon: 'ri-heart-pulse-line' },
  { name: 'Urgent Family Needs', description: 'Fever, pain, and essential household medicine requests.', icon: 'ri-capsule-line' },
  { name: 'Wellness & Supplements', description: 'Daily vitamins and preventive care support products.', icon: 'ri-mental-health-line' },
]

const steps = [
  { title: '1. Submit Request', description: 'Customer sends requested drugs or prescription details.', icon: 'ri-file-list-3-line' },
  { title: '2. We Confirm With Pharmacies', description: 'Our team checks stock availability and final customer pricing.', icon: 'ri-store-2-line' },
  { title: '3. Order Is Created', description: 'Customer reviews the confirmed order, then chooses delivery or pickup.', icon: 'ri-checkbox-circle-line' },
]

const featuredProducts = [
  { category: 'Availability Check', name: 'Live Pharmacy Confirmation', note: 'We contact partner pharmacies on your behalf.', price: 'Real-time updates' },
  { category: 'Pricing Review', name: 'Marked-up Item Pricing', note: 'You see the confirmed customer price before payment.', price: 'No hidden fees' },
  { category: 'Fulfillment Option', name: 'Delivery or Pickup Plans', note: 'Select your preferred fulfillment method per order.', price: 'Flexible choice' },
  { category: 'Order Transparency', name: 'Status Tracking', note: 'Track pending, awaiting customer, confirmed, and delivered states.', price: 'Visible progress' },
]

const testimonials = [
  { name: 'Ama K., Accra', quote: 'I requested my prescription drugs once, and they confirmed stock and pricing before creating my order.' },
  { name: 'Kojo A., Tema', quote: 'The team handled pharmacy confirmation for me, and I only approved once everything was clear.' },
]

const showToast = (text, type = 'success') => {
  toast.value = { text, type }
  setTimeout(() => {
    toast.value = null
  }, 4000)
}

const openOrderFlow = () => {
  if (userStore.isLoggedIn) {
    navigateTo('/customer?tab=new')
    return
  }
  showLoginModal.value = true
}

const scrollToHowItWorks = () => {
  const target = document.getElementById('how-it-works')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  navigateTo('/#how-it-works')
}

const handlePrimaryAction = () => {
  if (userStore.isLoggedIn) {
    navigateTo('/customer?tab=new')
    return
  }
  showLoginModal.value = true
}

const handleLoginSuccess = async (payload = {}) => {
  showLoginModal.value = false
  if (payload.destination === 'new') {
    await navigateTo('/customer?tab=new')
    return
  }
  await navigateTo('/customer')
}

const handleLoggedOutNotice = async (flag) => {
  if (!flag) return
  showToast('You have been logged out.', 'success')
  await navigateTo({ path: '/', query: {} }, { replace: true })
}

const redirectLoggedInUsers = async () => {
  if (!userStore.isLoggedIn) return false
  await navigateTo('/customer', { replace: true })
  return true
}

onMounted(async () => {
  await userStore.checkAuthState()
  if (await redirectLoggedInUsers()) return
  authResolved.value = true
})

watch(() => route.query.logged_out, handleLoggedOutNotice, { immediate: true })
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
</style>
