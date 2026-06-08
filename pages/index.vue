<template>
  <div class="min-h-screen text-slate-900" style="background-color: var(--surface-base);">

    <!-- Toast notification -->
    <Transition
      enter-from-class="opacity-0 translate-y-[-8px]"
      enter-active-class="transition duration-200 ease-out"
      leave-to-class="opacity-0 translate-y-[-8px]"
      leave-active-class="transition duration-150 ease-in"
    >
      <div
        v-if="toast"
        role="alert"
        aria-live="polite"
        class="fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white max-w-sm"
        :style="toast.type === 'success' ? 'background-color: var(--accent-primary);' : 'background-color: #c0392b;'"
      >
        <ShieldCheckIcon v-if="toast.type === 'success'" class="w-4 h-4 shrink-0 opacity-90" />
        <XMarkIcon v-else class="w-4 h-4 shrink-0 opacity-90" />
        {{ toast.text }}
      </div>
    </Transition>

    <div class="font-primary" style="background-color: var(--surface-base);">
      <main style="background-color: var(--surface-base);" class="pt-20 pb-20 lg:pb-0">

        <!-- ── Hero ── -->
        <section class="relative min-h-[calc(100svh-80px)] flex items-end lg:items-center overflow-hidden pb-6 lg:pb-0">

          <!-- Background image -->
          <div class="absolute inset-0 z-0">
            <picture>
              <source media="(min-width: 1024px)" :srcset="heroOrderingImage" />
              <img
                src="/hero_image_mobile.png"
                alt=""
                role="presentation"
                class="w-full h-full object-cover object-top lg:object-center"
              />
            </picture>
            <!-- Mobile tint -->
            <div class="absolute inset-0 lg:hidden hero-overlay-mobile"></div>
            <!-- Desktop gradient -->
            <div class="absolute inset-0 hidden lg:block hero-overlay-desktop"></div>
          </div>

          <div class="container mx-auto px-8 relative z-10 flex items-center justify-center lg:justify-start pt-36 lg:pt-20 pb-8">
            <div class="w-full max-w-md">

              <!-- Loading state: skeleton while checkAuthState() resolves -->
              <div
                v-if="userStore.isLoading"
                aria-label="Loading sign-in form"
                class="overflow-hidden rounded-[2rem] shadow-[0_24px_40px_rgba(10,40,35,0.10)] animate-pulse"
                style="background-color: var(--surface-card);"
              >
                <div class="px-6 pt-5 pb-4 border-b" style="border-color: var(--border-subtle);">
                  <div class="h-4 w-20 rounded mb-2 skeleton-block"></div>
                  <div class="h-7 w-52 rounded-lg skeleton-block"></div>
                </div>
                <div class="px-6 py-5 space-y-4" style="background-color: var(--surface-raised);">
                  <div class="space-y-1.5">
                    <div class="h-3.5 w-28 rounded skeleton-block"></div>
                    <div class="h-11 rounded-xl skeleton-block"></div>
                  </div>
                  <div class="space-y-1.5">
                    <div class="h-3.5 w-24 rounded skeleton-block"></div>
                    <div class="h-11 rounded-xl skeleton-block"></div>
                  </div>
                  <div class="h-12 rounded-xl skeleton-cta"></div>
                </div>
              </div>

              <!-- Data state: login card -->
              <template v-else>
                <div class="mb-5 text-center lg:text-left animate-fade-up">
                  <span class="hero-eyebrow mb-3 inline-block">
                    Fast medication delivery &middot; Across Ghana
                  </span>
                  <h1 class="text-[2rem] lg:text-[2.5rem] font-bold leading-tight mb-2 text-white lg:text-[var(--text-default)] hero-text-shadow">
                    Order <span class="hero-accent">any medication</span> online.
                  </h1>
                  <p class="text-base leading-relaxed text-white/80 lg:text-[var(--text-muted)] hero-text-shadow">
                    From 210+ verified pharmacies across Ghana, delivered in about 45 minutes.
                  </p>
                </div>
                <Login inline @login-success="handleLoginSuccess" />
              </template>

            </div>
          </div>
        </section>

        <!-- ── Stats strip ── -->
        <section aria-label="Key figures" style="background-color: var(--surface-tinted);" class="py-14">
          <div class="container mx-auto px-8">
            <dl class="grid grid-cols-2 lg:grid-cols-4 gap-px stats-grid-bg rounded-2xl overflow-hidden shadow-sm">

              <div class="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center" style="background-color: var(--surface-card);">
                <div class="stat-icon-wrap mb-1">
                  <BuildingStorefrontIcon class="w-6 h-6 stat-icon" />
                </div>
                <dt class="text-[0.8rem] font-semibold uppercase tracking-wider" style="color: var(--text-muted);">Verified pharmacies</dt>
                <dd class="text-3xl font-bold" style="color: var(--text-default);">210+</dd>
              </div>

              <div class="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center" style="background-color: var(--surface-card);">
                <div class="stat-icon-wrap mb-1">
                  <BoltIcon class="w-6 h-6 stat-icon" />
                </div>
                <dt class="text-[0.8rem] font-semibold uppercase tracking-wider" style="color: var(--text-muted);">Avg. delivery</dt>
                <dd class="text-3xl font-bold" style="color: var(--text-default);">45 min</dd>
              </div>

              <div class="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center" style="background-color: var(--surface-card);">
                <div class="stat-icon-wrap mb-1">
                  <CheckBadgeIcon class="w-6 h-6 stat-icon" />
                </div>
                <dt class="text-[0.8rem] font-semibold uppercase tracking-wider" style="color: var(--text-muted);">Genuine medicines</dt>
                <dd class="text-3xl font-bold" style="color: var(--text-default);">100%</dd>
              </div>

              <div class="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center" style="background-color: var(--surface-card);">
                <div class="stat-icon-wrap mb-1">
                  <ChatBubbleLeftRightIcon class="w-6 h-6 stat-icon" />
                </div>
                <dt class="text-[0.8rem] font-semibold uppercase tracking-wider" style="color: var(--text-muted);">Expert support</dt>
                <dd class="text-3xl font-bold" style="color: var(--text-default);">24 / 7</dd>
              </div>

            </dl>
          </div>
        </section>

        <!-- ── How It Works ── -->
        <section id="how-it-works" style="background-color: var(--surface-base);" class="py-24 overflow-hidden">
          <div class="container mx-auto px-8">

            <div class="text-center mb-16">
              <span class="section-eyebrow">How it works</span>
              <h2 class="section-heading mt-3">Three steps to your door</h2>
              <p class="section-subheading mx-auto mt-4 max-w-xl">
                Get your prescriptions filled without leaving home — we handle the sourcing, verification, and delivery.
              </p>
            </div>

            <!-- Connector line (desktop only) -->
            <div class="relative grid md:grid-cols-3 gap-10 lg:gap-14">
              <div class="hidden md:block absolute top-[4.5rem] left-[calc(16.6%+2rem)] right-[calc(16.6%+2rem)] h-px step-connector" aria-hidden="true"></div>

              <!-- Step 1 -->
              <article class="group flex flex-col">
                <div class="relative mb-7 rounded-2xl overflow-hidden aspect-[4/5] shadow-md">
                  <img
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                    alt="Person using a smartphone to search for medication"
                    src="/request_med_image.png"
                  />
                  <div class="absolute inset-0 step-image-overlay"></div>
                  <div class="step-number" aria-hidden="true">1</div>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--text-default);">Upload or list your meds</h3>
                <p class="text-sm leading-relaxed" style="color: var(--text-muted);">
                  Securely upload a prescription photo or search our database for over-the-counter essentials.
                </p>
              </article>

              <!-- Step 2 -->
              <article class="group flex flex-col">
                <div class="relative mb-7 rounded-2xl overflow-hidden aspect-[4/5] shadow-md">
                  <img
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                    alt="Pharmacist picking and verifying a medication order"
                    src="/pharmacist_picking_order.png"
                  />
                  <div class="absolute inset-0 step-image-overlay"></div>
                  <div class="step-number" aria-hidden="true">2</div>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--text-default);">We source and verify</h3>
                <p class="text-sm leading-relaxed" style="color: var(--text-muted);">
                  Our system checks stock across 210+ verified pharmacies to find the best price and availability.
                </p>
              </article>

              <!-- Step 3 -->
              <article class="group flex flex-col">
                <div class="relative mb-7 rounded-2xl overflow-hidden aspect-[4/5] shadow-md">
                  <img
                    class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                    alt="Delivery rider handing medication to a customer"
                    src="/drug_delivery.png"
                  />
                  <div class="absolute inset-0 step-image-overlay"></div>
                  <div class="step-number" aria-hidden="true">3</div>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--text-default);">Confirm and receive</h3>
                <p class="text-sm leading-relaxed" style="color: var(--text-muted);">
                  Pay securely, then track your order in real time. Most deliveries arrive within 45 minutes.
                </p>
              </article>
            </div>

          </div>
        </section>

        <!-- ── Testimonials ── -->
        <section aria-label="Customer testimonials" style="background-color: var(--surface-tinted);" class="py-24">
          <div class="container mx-auto px-8">

            <div class="mb-12">
              <span class="section-eyebrow">Testimonials</span>
              <h2 class="section-heading mt-3">What patients are saying</h2>
            </div>

            <div class="grid md:grid-cols-3 gap-6">

              <!-- Testimonial 1 -->
              <figure class="testimonial-card">
                <div class="flex gap-0.5 mb-5" aria-label="5 out of 5 stars">
                  <StarIcon v-for="i in 5" :key="i" class="w-4 h-4 star-icon" aria-hidden="true" />
                </div>
                <blockquote class="text-base leading-relaxed mb-7 flex-1" style="color: var(--text-default);">
                  "I couldn't find my father's chronic medication anywhere in Kumasi. MedsGh found it in 15 minutes and delivered it the same hour. Real lifesavers."
                </blockquote>
                <figcaption class="flex items-center gap-3">
                  <div class="avatar" style="--avatar-bg: var(--avatar-a-bg); --avatar-fg: var(--avatar-a-fg);" aria-hidden="true">KA</div>
                  <div>
                    <div class="text-sm font-semibold" style="color: var(--text-default);">Kofi Adjei</div>
                    <div class="text-xs" style="color: var(--text-muted);">Verified patient</div>
                  </div>
                </figcaption>
              </figure>

              <!-- Testimonial 2 -->
              <figure class="testimonial-card">
                <div class="flex gap-0.5 mb-5" aria-label="5 out of 5 stars">
                  <StarIcon v-for="i in 5" :key="i" class="w-4 h-4 star-icon" aria-hidden="true" />
                </div>
                <blockquote class="text-base leading-relaxed mb-7 flex-1" style="color: var(--text-default);">
                  "The integration with my telehealth appointment was seamless. My meds were on their way before I even hung up the call."
                </blockquote>
                <figcaption class="flex items-center gap-3">
                  <div class="avatar" style="--avatar-bg: var(--avatar-b-bg); --avatar-fg: var(--avatar-b-fg);" aria-hidden="true">AM</div>
                  <div>
                    <div class="text-sm font-semibold" style="color: var(--text-default);">Ama Mensah</div>
                    <div class="text-xs" style="color: var(--text-muted);">Verified patient</div>
                  </div>
                </figcaption>
              </figure>

              <!-- Testimonial 3 -->
              <figure class="testimonial-card">
                <div class="flex gap-0.5 mb-5" aria-label="5 out of 5 stars">
                  <StarIcon v-for="i in 5" :key="i" class="w-4 h-4 star-icon" aria-hidden="true" />
                </div>
                <blockquote class="text-base leading-relaxed mb-7 flex-1" style="color: var(--text-default);">
                  "As a busy professional I don't have time to hop between pharmacies. MedsGh makes medication management effortless and I always know it's genuine stock."
                </blockquote>
                <figcaption class="flex items-center gap-3">
                  <div class="avatar" style="--avatar-bg: var(--avatar-c-bg); --avatar-fg: var(--avatar-c-fg);" aria-hidden="true">DO</div>
                  <div>
                    <div class="text-sm font-semibold" style="color: var(--text-default);">Dr. Owusu</div>
                    <div class="text-xs" style="color: var(--text-muted);">Healthcare provider</div>
                  </div>
                </figcaption>
              </figure>

            </div>
          </div>
        </section>

        <!-- ── Pharmacy Partner Section (hidden, reserved for future launch) ── -->
        <template v-if="false">
          <section id="for-pharmacies" class="py-20" style="background-color: var(--surface-dark);">
            <div class="container mx-auto px-8">
              <div class="grid lg:grid-cols-2 gap-16 items-center">

                <div>
                  <span class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6" style="border-color: var(--accent-border-dark); background-color: var(--surface-dark-raised); color: var(--accent-light);">
                    <BuildingStorefrontIcon class="w-[14px] h-[14px]" />
                    For Pharmacies
                  </span>
                  <h2 class="text-[2rem] lg:text-[2.5rem] font-semibold leading-[1.15] text-white mb-5">
                    Grow your pharmacy<br />with the MedsGh network.
                  </h2>
                  <p class="leading-relaxed mb-8 max-w-lg" style="color: var(--text-on-dark-muted);">
                    Join over 210 verified pharmacy partners already using MedsGh to reach thousands of patients across Ghana. No software to install, no upfront costs — just more orders.
                  </p>
                  <ul class="space-y-4 mb-10">
                    <li class="flex items-start gap-3">
                      <span class="shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center" style="background-color: var(--accent-primary);">
                        <ArrowTrendingUpIcon class="w-4 h-4 text-white" />
                      </span>
                      <div>
                        <p class="font-semibold text-white text-sm">More orders, zero effort</p>
                        <p class="text-xs mt-0.5" style="color: var(--text-on-dark-muted);">Receive verified patient requests directly — no marketing spend needed.</p>
                      </div>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center" style="background-color: var(--accent-primary);">
                        <CurrencyDollarIcon class="w-4 h-4 text-white" />
                      </span>
                      <div>
                        <p class="font-semibold text-white text-sm">Zero setup cost</p>
                        <p class="text-xs mt-0.5" style="color: var(--text-on-dark-muted);">Onboard for free. We only succeed when you succeed.</p>
                      </div>
                    </li>
                    <li class="flex items-start gap-3">
                      <span class="shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center" style="background-color: var(--accent-primary);">
                        <ChartBarIcon class="w-4 h-4 text-white" />
                      </span>
                      <div>
                        <p class="font-semibold text-white text-sm">Real-time analytics</p>
                        <p class="text-xs mt-0.5" style="color: var(--text-on-dark-muted);">Track orders, inventory demand, and patient trends from your dashboard.</p>
                      </div>
                    </li>
                  </ul>
                  <div class="flex flex-wrap gap-3">
                    <a href="mailto:support@medsgh.com?subject=Pharmacy+Partner+Application" class="partner-cta-primary">
                      <EnvelopeIcon class="w-[18px] h-[18px]" />
                      Apply to partner
                    </a>
                    <a href="tel:+233556637717" class="partner-cta-secondary">
                      <PhoneIcon class="w-[18px] h-[18px]" />
                      Call us
                    </a>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="partner-stat-card">
                    <div class="text-3xl font-bold text-white mb-1">210+</div>
                    <div class="text-sm font-medium" style="color: var(--text-on-dark-muted);">Partner pharmacies</div>
                    <BuildingStorefrontIcon class="w-6 h-6 mt-3 block" style="color: var(--accent-primary);" />
                  </div>
                  <div class="partner-stat-card">
                    <div class="text-3xl font-bold text-white mb-1">5 k+</div>
                    <div class="text-sm font-medium" style="color: var(--text-on-dark-muted);">Patients served</div>
                    <UserGroupIcon class="w-6 h-6 mt-3 block" style="color: var(--accent-primary);" />
                  </div>
                  <div class="partner-stat-card">
                    <div class="text-3xl font-bold text-white mb-1">45 min</div>
                    <div class="text-sm font-medium" style="color: var(--text-on-dark-muted);">Avg. fulfillment</div>
                    <BoltIcon class="w-6 h-6 mt-3 block" style="color: var(--accent-primary);" />
                  </div>
                  <div class="partner-stat-card">
                    <div class="text-3xl font-bold text-white mb-1">100%</div>
                    <div class="text-sm font-medium" style="color: var(--text-on-dark-muted);">Verified partners</div>
                    <CheckBadgeIcon class="w-6 h-6 mt-3 block" style="color: var(--accent-primary);" />
                  </div>
                </div>

              </div>
            </div>
          </section>
        </template>

        <!-- ── FAQ ── -->
        <section id="support" style="background-color: var(--surface-base);" class="py-24">
          <div class="container mx-auto px-8 max-w-3xl">

            <div class="text-center mb-12">
              <span class="section-eyebrow">FAQ</span>
              <h2 class="section-heading mt-3">You may be wondering</h2>
            </div>

            <div class="space-y-3">

              <details class="faq-item group" open>
                <summary class="faq-summary">
                  Are the pharmacies on MedsGh licensed?
                  <ChevronDownIcon class="w-5 h-5 shrink-0 faq-chevron transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <div class="faq-body">
                  Yes. Every pharmacy in our network is fully accredited by the Pharmacy Council of Ghana. We verify licenses and compliance records before onboarding any partner to ensure your safety.
                </div>
              </details>

              <details class="faq-item group">
                <summary class="faq-summary">
                  How do you handle prescription medications?
                  <ChevronDownIcon class="w-5 h-5 shrink-0 faq-chevron transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <div class="faq-body">
                  For prescription-only medicines you are required to upload a clear photo or digital copy of a valid prescription. Our pharmacists review these documents before processing your order.
                </div>
              </details>

              <details class="faq-item group">
                <summary class="faq-summary">
                  What is the delivery radius?
                  <ChevronDownIcon class="w-5 h-5 shrink-0 faq-chevron transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <div class="faq-body">
                  We currently operate across all major cities in Ghana including Accra, Kumasi, Takoradi, and Tamale. We are expanding our partner network to reach more communities soon.
                </div>
              </details>

              <details class="faq-item group">
                <summary class="faq-summary">
                  Is my personal and medical data safe?
                  <ChevronDownIcon class="w-5 h-5 shrink-0 faq-chevron transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <div class="faq-body">
                  All data is encrypted in transit and at rest. We are PCI-DSS compliant for payment data and follow Ghana Data Protection Act requirements for health information. Your prescription details are never shared with third parties.
                </div>
              </details>

            </div>
          </div>
        </section>

        <!-- ── Quality Badges ── -->
        <section aria-label="Certifications and compliance" style="background-color: var(--surface-tinted); border-color: var(--border-subtle);" class="py-12 border-t">
          <div class="container mx-auto px-8">
            <p class="text-center text-xs font-semibold uppercase tracking-widest mb-8" style="color: var(--text-muted);">Accreditations &amp; compliance</p>
            <div class="flex flex-wrap justify-center items-center gap-10">

              <div class="badge-item">
                <ShieldCheckIcon class="w-6 h-6 badge-icon" />
                <span class="badge-label">Pharmacy Council accredited</span>
              </div>

              <div class="badge-divider" aria-hidden="true"></div>

              <div class="badge-item">
                <CreditCardIcon class="w-6 h-6 badge-icon" />
                <span class="badge-label">PCI-DSS compliant</span>
              </div>

              <div class="badge-divider" aria-hidden="true"></div>

              <div class="badge-item">
                <HeartIcon class="w-6 h-6 badge-icon" />
                <span class="badge-label">G-Health certified</span>
              </div>

            </div>
          </div>
        </section>

      </main>

      <!-- ── Footer ── -->
      <footer style="background-color: var(--surface-footer); border-top: 1px solid var(--border-subtle);" class="w-full pt-14 pb-10 px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-10 max-w-screen-xl mx-auto mb-12">

          <!-- Brand column -->
          <div class="md:col-span-1">
            <div class="font-bold text-xl mb-4 footer-brand">MedsGh</div>
            <p class="text-sm leading-relaxed" style="color: var(--text-muted);">
              Connecting patients with verified pharmacies across Ghana for safe, fast medication delivery.
            </p>
          </div>

          <!-- Quick links -->
          <div>
            <h4 class="footer-heading">Quick links</h4>
            <ul class="space-y-2.5 text-sm">
              <li><a class="footer-link" href="#">Find a pharmacy</a></li>
              <li><a class="footer-link" href="#">Request medication</a></li>
              <li><a class="footer-link" href="#">Partner login</a></li>
              <li><a class="footer-link" href="#">Wellness resources</a></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h4 class="footer-heading">Legal</h4>
            <ul class="space-y-2.5 text-sm">
              <li><a class="footer-link" href="#">Privacy policy</a></li>
              <li><a class="footer-link" href="#">Terms of service</a></li>
              <li><a class="footer-link" href="#">Cookie settings</a></li>
              <li><a class="footer-link" href="#">Accessibility</a></li>
            </ul>
          </div>

          <!-- Connect -->
          <div>
            <h4 class="footer-heading">Contact</h4>
            <div class="flex gap-3 mb-5">
              <a
                href="mailto:rigelis@rigelisinc.com"
                aria-label="Email us"
                class="social-btn"
              >
                <EnvelopeIcon class="w-5 h-5" />
              </a>
              <a
                href="tel:+233556637717"
                aria-label="Call us"
                class="social-btn"
              >
                <PhoneIcon class="w-5 h-5" />
              </a>
              <a
                href="#"
                aria-label="Share"
                class="social-btn"
              >
                <ShareIcon class="w-5 h-5" />
              </a>
            </div>
            <p class="text-xs" style="color: var(--text-muted);">rigelis@rigelisinc.com</p>
          </div>

        </div>

        <!-- Footer bottom bar -->
        <div class="max-w-screen-xl mx-auto pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4" style="border-color: var(--border-subtle);">
          <p class="text-xs" style="color: var(--text-muted);">
            &copy; {{ currentYear }} MedsGh Digital Care. All rights reserved.
          </p>
          <div class="flex items-center gap-5">
            <img
              alt="Visa"
              class="h-5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-200"
              src="https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/card-logo-visa.svg"
            />
            <img
              alt="Mastercard"
              class="h-5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-200"
              src="https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/card-logo-mastercard.svg"
            />
            <img
              alt="MTN Mobile Money"
              class="h-5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-200"
              src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/mtn-mobile-logo-icon.svg"
            />
          </div>
        </div>
      </footer>

    </div>

    <!-- Modal login (triggered from hero CTA or unauthenticated order flow) -->
    <Login
      :is-open="showLoginModal"
      @close="showLoginModal = false"
      @login-success="handleLoginSuccess"
    />

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
/* ─────────────────────────────────────────────
   Palette — clinical precision + Ghanaian warmth
   Deep purple primary, warm neutral surfaces, amber star accent
   ───────────────────────────────────────────── */
:root,
.font-primary {
  /* Accent / brand */
  --accent-primary:       #520094;   /* deep purple */
  --accent-hover:         #6c24b3;   /* purple dark */
  --accent-light:         #dbb8ff;   /* purple tint */
  --accent-subtle:        #efdbff;   /* purple wash */
  --accent-border-dark:   #3d1a66;

  /* Surfaces */
  --surface-base:         #fff7ff;   /* very slightly warm white */
  --surface-raised:       #ffffff;
  --surface-card:         #ffffff;
  --surface-tinted:       #faf0fd;   /* purple-tinted section bg */
  --surface-footer:       #faf0fd;
  --surface-dark:         #1e0a2e;   /* deep purple dark — pharmacy section */
  --surface-dark-raised:  #2d1050;

  /* Text */
  --text-default:         #1e1a22;   /* near-black with purple tint */
  --text-muted:           #4c4453;   /* readable muted */
  --text-on-dark-muted:   #a390b8;

  /* Border */
  --border-subtle:        #e8def8;

  /* Avatar palette */
  --avatar-a-bg: #efdbff;
  --avatar-a-fg: #520094;
  --avatar-b-bg: #e8def8;
  --avatar-b-fg: #625b71;
  --avatar-c-bg: #ffdcbf;
  --avatar-c-fg: #552e00;

  /* Star rating */
  --star-color:           #d97706;   /* amber-600, WCAG AA on white */
}

/* ─── Hero headline ─────────────────────────── */
.hero-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-primary);
  padding: 0.3rem 0.875rem;
  background-color: var(--accent-subtle);
  border-radius: 999px;
}

@media (max-width: 1023px) {
  .hero-eyebrow {
    color: rgba(255, 255, 255, 0.9);
    background-color: rgba(255, 255, 255, 0.15);
  }

  .hero-text-shadow {
    text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55), 0 2px 4px rgba(0, 0, 0, 0.35);
  }
}

.hero-accent {
  color: var(--accent-primary);
}

@media (max-width: 1023px) {
  .hero-accent {
    color: inherit;
  }
}

/* ─── Hero overlays ─────────────────────────── */
.hero-overlay-mobile {
  background: linear-gradient(to top, rgba(20, 6, 32, 0.88) 0%, rgba(20, 6, 32, 0.60) 45%, rgba(20, 6, 32, 0.30) 75%, transparent 100%);
}

.hero-overlay-desktop {
  background: linear-gradient(to right, rgba(255, 247, 255, 0.97) 0%, rgba(255, 247, 255, 0.72) 42%, transparent 100%);
}

/* ─── Stats grid ────────────────────────────── */
.stats-grid-bg {
  background-color: var(--border-subtle);
}

.stat-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.875rem;
  background-color: var(--accent-subtle);
}

.stat-icon {
  color: var(--accent-primary);
}

/* ─── Section typography helpers ───────────── */
.section-eyebrow {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent-primary);
  padding: 0.25rem 0.75rem;
  background-color: var(--accent-subtle);
  border-radius: 999px;
}

.section-heading {
  font-size: clamp(1.6rem, 3.5vw, 2.25rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-default);
}

.section-subheading {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-muted);
}

/* ─── How It Works ──────────────────────────── */
.step-connector {
  background: linear-gradient(to right, transparent, var(--border-subtle), transparent);
}

.step-image-overlay {
  background: linear-gradient(to top, rgba(30, 10, 46, 0.45) 0%, transparent 55%);
}

.step-number {
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background-color: var(--accent-primary);
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(82, 0, 148, 0.35);
  letter-spacing: -0.01em;
}

/* ─── Testimonials ──────────────────────────── */
.testimonial-card {
  display: flex;
  flex-direction: column;
  background-color: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 1.25rem;
  padding: 2rem 1.75rem;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.testimonial-card:hover {
  box-shadow: 0 8px 24px rgba(82, 0, 148, 0.10);
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .testimonial-card {
    transition: none;
  }
  .testimonial-card:hover {
    transform: none;
  }
}

.star-icon {
  color: var(--star-color);
}

.avatar {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  border-radius: 50%;
  background-color: var(--avatar-bg);
  color: var(--avatar-fg);
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── FAQ accordion ─────────────────────────── */
.faq-item {
  background-color: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 0.875rem;
  overflow: hidden;
}

.faq-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-default);
  cursor: pointer;
  list-style: none;
  user-select: none;
  /* 44 px minimum tap target */
  min-height: 3rem;
}

.faq-summary::-webkit-details-marker {
  display: none;
}

.faq-summary:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
  border-radius: 0.875rem;
}

details[open] .faq-summary {
  border-bottom: 1px solid var(--border-subtle);
  color: var(--accent-primary);
}

.faq-chevron {
  color: var(--text-muted);
  flex-shrink: 0;
}

details[open] .faq-chevron {
  color: var(--accent-primary);
}

.faq-body {
  padding: 1.25rem 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--text-muted);
}

/* ─── Quality badges ────────────────────────── */
.badge-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.badge-icon {
  color: var(--accent-primary);
  flex-shrink: 0;
}

.badge-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.badge-divider {
  width: 1px;
  height: 2rem;
  background-color: var(--border-subtle);
}

@media (max-width: 640px) {
  .badge-divider {
    display: none;
  }
}

/* ─── Footer ────────────────────────────────── */
.footer-brand {
  color: var(--accent-primary);
}

.footer-heading {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-default);
  margin-bottom: 1rem;
}

.footer-link {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.footer-link:hover {
  color: var(--accent-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer-link:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background-color: var(--surface-raised);
  color: var(--accent-primary);
  border: 1px solid var(--border-subtle);
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.social-btn:hover {
  background-color: var(--accent-primary);
  color: #ffffff;
  border-color: var(--accent-primary);
}

.social-btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* ─── Skeleton loader ───────────────────────── */
.skeleton-block {
  background-color: #efdbff;
}

.skeleton-cta {
  background-color: #c8a0d8;
}

/* ─── Partner section (v-if="false") ───────── */
.partner-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  background-color: var(--accent-primary);
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
  text-decoration: none;
  transition: background-color 0.15s ease, transform 0.1s ease;
  box-shadow: 0 4px 14px rgba(82, 0, 148, 0.35);
  min-height: 2.75rem;
}

.partner-cta-primary:hover {
  background-color: var(--accent-hover);
  transform: scale(1.02);
}

.partner-cta-primary:active {
  transform: scale(0.98);
}

.partner-cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--accent-border-dark);
  background-color: var(--surface-dark-raised);
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--accent-light);
  text-decoration: none;
  transition: background-color 0.15s ease;
  min-height: 2.75rem;
}

.partner-cta-secondary:hover {
  background-color: #3d1a66;
}

.partner-stat-card {
  border-radius: 1rem;
  border: 1px solid var(--accent-border-dark);
  background-color: var(--surface-dark-raised);
  padding: 1.5rem;
}

/* ─── Reduced-motion overrides ──────────────── */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-fade-up {
    animation: none;
  }
}
</style>
