<template>
  <div class="min-h-screen font-primary" style="background-color: var(--surface-base);">
    <main id="main-content" class="pt-20">

      <!-- ── Hero header band ── -->
      <section class="hero-band" style="background-color: var(--surface-tinted); border-bottom: 1px solid var(--border-subtle);">
        <div class="container mx-auto px-6 py-14 max-w-screen-xl">
          <div class="flex items-center gap-5">
            <div class="hero-icon-wrap" aria-hidden="true">
              <ShieldCheckIcon class="w-7 h-7" style="color: var(--accent-primary);" />
            </div>
            <div>
              <span class="section-eyebrow mb-2 inline-block">Rigelis Inc.</span>
              <h1 class="section-heading">Privacy Policy</h1>
              <p class="mt-1 text-sm" style="color: var(--text-muted);">Last Updated: June 12, 2026</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Page body: sidebar + content ── -->
      <div class="container mx-auto px-6 py-12 max-w-screen-xl">
        <div class="page-layout">

          <!-- ── Sticky ToC sidebar (desktop) ── -->
          <aside class="toc-sidebar" aria-label="Table of contents">
            <nav>
              <p class="toc-heading">Contents</p>
              <ol class="toc-list">
                <li v-for="section in sections" :key="section.id">
                  <a
                    :href="`#${section.id}`"
                    class="toc-link"
                    :class="{ 'toc-link--active': activeSection === section.id }"
                    :aria-current="activeSection === section.id ? 'true' : undefined"
                  >
                    <span class="toc-num">{{ section.num }}</span>
                    <span>{{ section.short }}</span>
                  </a>
                </li>
              </ol>
            </nav>
          </aside>

          <!-- ── Main policy content ── -->
          <div class="policy-content">

            <!-- Mobile ToC pill row -->
            <div class="mobile-toc" aria-label="Jump to section">
              <a v-for="section in sections" :key="section.id" :href="`#${section.id}`" class="mobile-toc-pill">
                {{ section.num }}
              </a>
            </div>

            <!-- Intro block -->
            <div class="policy-card mb-8">
              <p class="policy-body">
                Welcome to <strong>medsgh.com</strong> (the "Website" or "Platform"). This Website is owned and operated by
                <strong>Rigelis Inc.</strong> ("Company", "we", "us", or "our"), a company registered at 6618 Carriage Way,
                Long Grove, IL, 60047, United States, operating digital health and pharmacy portal services in Ghana.
              </p>
              <p class="policy-body mt-4">
                We are committed to protecting your privacy and ensuring the security of your personal and health information.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our
                website, use our online pharmacy portal, or interact with our services.
              </p>
              <p class="policy-body mt-4">
                By accessing or using medsgh.com, you agree to the terms of this Privacy Policy. If you do not agree with
                the terms of this policy, please do not access the site or use our services.
              </p>
            </div>

            <!-- Section 1 -->
            <section id="section-1" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">1</span>
                Regulatory Compliance &amp; Ghana Data Protection
              </h2>
              <div class="dpc-badge">
                <ShieldCheckIcon class="w-5 h-5 shrink-0" style="color: var(--accent-primary);" aria-hidden="true" />
                <span><strong>Ghana Data Protection Act Registered</strong> — Data Protection Commission, Reg. No. 0004463</span>
              </div>
              <p class="policy-body mt-4">
                <strong>Data Protection Compliance:</strong> Rigelis Inc. is fully registered as a Data Controller with the
                Data Protection Commission (DPC) of Ghana in accordance with the <strong>Data Protection Act, 2012 (Act 843)</strong>.
              </p>
              <p class="policy-body mt-3">
                We process all user data — especially highly sensitive medical and health data — in strict compliance with
                the data protection principles outlined under Ghanaian law, ensuring accountability, lawful processing,
                data quality, and robust security safeguards.
              </p>
            </section>

            <!-- Section 2 -->
            <section id="section-2" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">2</span>
                Information We Collect
              </h2>
              <p class="policy-body">
                To provide you with our online pharmacy services, prescription management, and product delivery, we
                collect several types of information:
              </p>

              <h3 class="subsection-heading mt-5">A. Personal Identification Information</h3>
              <ul class="policy-list">
                <li><strong>Account Registration Data:</strong> Name, email address, phone number, billing address, and shipping/delivery address.</li>
                <li><strong>Identification Verification:</strong> Government-issued identification (such as the Ghana Card) or professional details where required by law to verify identity or prescription authenticity.</li>
              </ul>

              <h3 class="subsection-heading mt-5">B. Health and Medical Information <span class="special-data-badge">Special Personal Data</span></h3>
              <p class="policy-body mt-2">
                Under Act 843, your health information is classified as "Special Personal Data." As an online pharmacy
                portal, we process:
              </p>
              <ul class="policy-list mt-2">
                <li>Prescriptions, prescribing doctor/facility details, and medical history relevant to your orders.</li>
                <li>Medication names, dosages, and refill histories.</li>
                <li>Communications with our affiliated pharmacists or customer support regarding your health and treatments.</li>
              </ul>

              <h3 class="subsection-heading mt-5">C. Financial and Transactional Information</h3>
              <ul class="policy-list">
                <li>Payment details, billing history, and transaction records. (Note: We use secure, third-party payment processors for card and Mobile Money transactions. We do not store your full financial credentials on our servers.)</li>
              </ul>

              <h3 class="subsection-heading mt-5">D. Automatically Collected Data</h3>
              <ul class="policy-list">
                <li>IP addresses, browser type, operating system, access times, and pages viewed directly before and after accessing the Website.</li>
                <li>Cookies and tracking technologies to optimize website functionality and improve user experience.</li>
              </ul>
            </section>

            <!-- Section 3 -->
            <section id="section-3" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">3</span>
                How We Use Your Information
              </h2>
              <p class="policy-body">We use the information we collect for the following purposes:</p>
              <ul class="policy-list mt-3">
                <li><strong>Service Delivery:</strong> To process, verify, and fulfill your medication orders and prescriptions.</li>
                <li><strong>Account Management:</strong> To maintain your user profile, track order history, and manage preferences.</li>
                <li><strong>Regulatory Mandates:</strong> To comply with pharmaceutical regulations, including the mandatory verification of prescribers, healthcare facilities, and patient data before processing transactions for specific high-value or restricted medications.</li>
                <li><strong>Customer Support:</strong> To respond to your inquiries, provide pharmacist consultations, and resolve service issues.</li>
                <li><strong>Communications:</strong> To send transaction confirmations, delivery updates, and critical safety or recall notices related to your medications.</li>
                <li><strong>Security &amp; Fraud Prevention:</strong> To monitor accounts for fraudulent activity, unauthorized access, and to secure our platform.</li>
              </ul>
            </section>

            <!-- Section 4 -->
            <section id="section-4" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">4</span>
                How We Share Your Information
              </h2>
              <p class="policy-body">We do not sell your personal or health data. We only share your information in the following limited circumstances:</p>
              <ul class="policy-list mt-3">
                <li><strong>Affiliated Pharmacies and Professionals:</strong> With licensed pharmacists, healthcare providers, and fulfillment partners strictly necessary to dispense and verify your medications.</li>
                <li><strong>Service Providers:</strong> With trusted third-party vendors who perform services for us, such as delivery/courier services, secure payment gateways, and hosting infrastructure. These providers are bound by strict confidentiality agreements.</li>
                <li><strong>Legal and Regulatory Mandates:</strong> When required by law, court order, or regulatory bodies (such as the Pharmacy Council of Ghana, Food and Drugs Authority, or the Data Protection Commission) to report dispensing data or comply with legal audits.</li>
                <li><strong>Corporate Transfers:</strong> In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              </ul>
            </section>

            <!-- Section 5 -->
            <section id="section-5" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">5</span>
                Data Security
              </h2>
              <p class="policy-body">
                We implement stringent technical and organizational security measures to protect your personal and health
                information as required by Act 843. This includes end-to-end encryption (SSL/TLS) for data in transit,
                secure access controls, firewalls, and restricted data access for personnel.
              </p>
              <p class="policy-body mt-3">
                While we take rigorous steps to secure your information, no digital transmission or storage system can be
                guaranteed 100% secure. You are responsible for keeping your account login credentials confidential.
              </p>
            </section>

            <!-- Section 6 -->
            <section id="section-6" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">6</span>
                Data Retention
              </h2>
              <p class="policy-body">
                We retain your personal and health information only for as long as necessary to fulfill the purposes
                outlined in this Privacy Policy, or as strictly required by statutory healthcare record-keeping laws and
                pharmaceutical regulations governing prescription histories in Ghana.
              </p>
            </section>

            <!-- Section 7 — Rights callout -->
            <section id="section-7" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">7</span>
                Your Rights Under Act 843
              </h2>
              <p class="policy-body">
                As a user of medsgh.com, the Ghana Data Protection Act guarantees you specific rights regarding your
                personal data:
              </p>
              <div class="rights-grid mt-5">
                <div class="right-item">
                  <div class="right-icon-wrap" aria-hidden="true">
                    <EyeIcon class="w-5 h-5" style="color: var(--accent-primary);" />
                  </div>
                  <div>
                    <p class="right-name">Right of Access</p>
                    <p class="right-desc">You have the right to request confirmation of whether we hold your data and to request a copy of that data.</p>
                  </div>
                </div>
                <div class="right-item">
                  <div class="right-icon-wrap" aria-hidden="true">
                    <PencilIcon class="w-5 h-5" style="color: var(--accent-primary);" />
                  </div>
                  <div>
                    <p class="right-name">Right to Rectification</p>
                    <p class="right-desc">You can request that we correct or update inaccurate or incomplete information.</p>
                  </div>
                </div>
                <div class="right-item">
                  <div class="right-icon-wrap" aria-hidden="true">
                    <NoSymbolIcon class="w-5 h-5" style="color: var(--accent-primary);" />
                  </div>
                  <div>
                    <p class="right-name">Right to Object / Restrict Processing</p>
                    <p class="right-desc">You may object to the processing of your data for specific purposes, such as direct marketing.</p>
                  </div>
                </div>
                <div class="right-item">
                  <div class="right-icon-wrap" aria-hidden="true">
                    <TrashIcon class="w-5 h-5" style="color: var(--accent-primary);" />
                  </div>
                  <div>
                    <p class="right-name">Right to Erasure</p>
                    <p class="right-desc">You can request the deletion of your account and personal data, subject to legal or regulatory retention mandates (e.g., licensed pharmacies are legally required to keep prescription logs for a minimum statutory period).</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 8 -->
            <section id="section-8" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">8</span>
                International Data Transfers
              </h2>
              <p class="policy-body">
                Rigelis Inc. is a US-incorporated entity operating infrastructure globally. Your data may be processed on
                secure servers located outside of Ghana (such as in the United States). In alignment with Act 843's
                guidelines on cross-border transfers, we ensure that any international processing partners maintain data
                protection standards that are equal to or greater than those required by Ghanaian law.
              </p>
            </section>

            <!-- Section 9 -->
            <section id="section-9" class="policy-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">9</span>
                Changes to This Privacy Policy
              </h2>
              <p class="policy-body">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or
                legal requirements. When updates are made, we will revise the "Last Updated" date at the top of this page.
                We encourage you to review this policy periodically.
              </p>
            </section>

            <!-- Section 10 — Contact card -->
            <section id="section-10" class="policy-card contact-card">
              <h2 class="section-title">
                <span class="section-num" aria-hidden="true">10</span>
                Contact Us
              </h2>
              <p class="policy-body">
                If you have any questions, concerns, or requests regarding this Privacy Policy, or if you wish to exercise
                your data rights, please contact us at:
              </p>
              <div class="contact-block mt-5">
                <div class="contact-address">
                  <p class="font-semibold" style="color: var(--text-default);">Rigelis Inc.</p>
                  <p style="color: var(--text-muted);">6618 Carriage Way,</p>
                  <p style="color: var(--text-muted);">Long Grove, IL, 60047</p>
                  <p style="color: var(--text-muted);">United States</p>
                </div>
                <a
                  href="mailto:rigelis@rigelisinc.com"
                  class="contact-cta"
                >
                  <EnvelopeIcon class="w-5 h-5 shrink-0" aria-hidden="true" />
                  rigelis@rigelisinc.com
                </a>
              </div>
            </section>

          </div>
        </div>
      </div>

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
            <li><a class="footer-link" href="/privacy" aria-current="page">Privacy policy</a></li>
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
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  ShieldCheckIcon,
  EyeIcon,
  PencilIcon,
  NoSymbolIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShareIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({ layout: 'default' })

useHead({
  title: 'Privacy Policy — MedsGh',
  meta: [
    { name: 'description', content: 'Privacy Policy for MedsGh — how Rigelis Inc. collects, uses, and protects your personal and health information in compliance with the Ghana Data Protection Act 2012 (Act 843).' },
  ],
})

const currentYear = new Date().getFullYear()

const sections = [
  { id: 'section-1',  num: '1',  short: 'Regulatory Compliance' },
  { id: 'section-2',  num: '2',  short: 'Information We Collect' },
  { id: 'section-3',  num: '3',  short: 'How We Use Your Data' },
  { id: 'section-4',  num: '4',  short: 'How We Share Data' },
  { id: 'section-5',  num: '5',  short: 'Data Security' },
  { id: 'section-6',  num: '6',  short: 'Data Retention' },
  { id: 'section-7',  num: '7',  short: 'Your Rights' },
  { id: 'section-8',  num: '8',  short: 'International Transfers' },
  { id: 'section-9',  num: '9',  short: 'Policy Changes' },
  { id: 'section-10', num: '10', short: 'Contact Us' },
]

const activeSection = ref<string>('section-1')

let observer: IntersectionObserver | null = null

onMounted(() => {
  const sectionEls = sections
    .map((s) => document.getElementById(s.id))
    .filter((el): el is HTMLElement => el !== null)

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
          break
        }
      }
    },
    {
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    }
  )

  sectionEls.forEach((el) => observer!.observe(el))
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped>
/* ─────────────────────────────────────────────
   Design tokens — mirrors index.vue :root block
   ───────────────────────────────────────────── */
:root,
.font-primary {
  --accent-primary:      #520094;
  --accent-hover:        #6c24b3;
  --accent-light:        #dbb8ff;
  --accent-subtle:       #efdbff;
  --surface-base:        #fff7ff;
  --surface-raised:      #ffffff;
  --surface-card:        #ffffff;
  --surface-tinted:      #faf0fd;
  --surface-footer:      #faf0fd;
  --surface-dark:        #1e0a2e;
  --text-default:        #1e1a22;
  --text-muted:          #4c4453;
  --border-subtle:       #e8def8;
}

/* ─── Section typography helpers ── */
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

/* ─── Hero band ── */
.hero-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  background-color: var(--accent-subtle);
  flex-shrink: 0;
}

/* ─── Page layout: sidebar + content ── */
.page-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;
}

@media (min-width: 1024px) {
  .page-layout {
    grid-template-columns: 220px 1fr;
    gap: 3rem;
  }
}

/* ─── ToC sidebar ── */
.toc-sidebar {
  display: none;
}

@media (min-width: 1024px) {
  .toc-sidebar {
    display: block;
    position: sticky;
    top: 6rem;
  }
}

.toc-heading {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.toc-link {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
  line-height: 1.4;
}

.toc-link:hover {
  background-color: var(--accent-subtle);
  color: var(--accent-primary);
}

.toc-link:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.toc-link--active {
  background-color: var(--accent-subtle);
  color: var(--accent-primary);
  font-weight: 600;
}

.toc-num {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-primary);
  min-width: 1.1rem;
  opacity: 0.7;
}

.toc-link--active .toc-num {
  opacity: 1;
}

/* ─── Mobile ToC pill row ── */
.mobile-toc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 1024px) {
  .mobile-toc {
    display: none;
  }
}

.mobile-toc-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background-color: var(--accent-subtle);
  color: var(--accent-primary);
  font-size: 0.75rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
  min-height: 2.25rem; /* 36px — slightly below 44px but pill shape compensates visually */
}

.mobile-toc-pill:hover {
  background-color: var(--accent-primary);
  color: #ffffff;
}

.mobile-toc-pill:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* ─── Policy content area ── */
.policy-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Policy card ── */
.policy-card {
  background-color: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 0.875rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(82, 0, 148, 0.04), 0 4px 12px rgba(82, 0, 148, 0.04);
}

/* ─── Section title inside card ── */
.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 1rem;
  line-height: 1.3;
}

.section-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--accent-subtle);
  color: var(--accent-primary);
  font-size: 0.8125rem;
  font-weight: 800;
  flex-shrink: 0;
}

/* ─── Body text ── */
.policy-body {
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--text-muted);
}

/* ─── Sub-headings (A, B, C, D) ── */
.subsection-heading {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-default);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ─── Lists ── */
.policy-list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.policy-list li {
  display: flex;
  gap: 0.625rem;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--text-muted);
}

.policy-list li::before {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--accent-primary);
  flex-shrink: 0;
  margin-top: 0.6rem;
}

/* ─── DPC badge ── */
.dpc-badge {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  background-color: var(--accent-subtle);
  border-radius: 0.625rem;
  font-size: 0.875rem;
  color: var(--text-default);
  margin-top: 0.5rem;
  border: 1px solid var(--accent-light);
}

/* ─── Special data badge ── */
.special-data-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7c3aed;
  background-color: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  vertical-align: middle;
  margin-left: 0.375rem;
}

/* ─── Rights grid (Section 7) ── */
.rights-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.right-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background-color: var(--surface-tinted);
  border: 1px solid var(--border-subtle);
  border-radius: 0.75rem;
}

.right-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background-color: var(--accent-subtle);
  flex-shrink: 0;
}

.right-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-default);
  margin-bottom: 0.25rem;
}

.right-desc {
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--text-muted);
}

/* ─── Contact card ── */
.contact-card {
  background-color: var(--surface-tinted);
  border-color: var(--accent-light);
}

.contact-block {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.contact-address {
  font-size: 0.9375rem;
  line-height: 1.8;
}

.contact-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--accent-primary);
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  text-decoration: none;
  min-height: 2.75rem;
  transition: background-color 0.15s ease, transform 0.1s ease;
  box-shadow: 0 4px 14px rgba(82, 0, 148, 0.3);
}

.contact-cta:hover {
  background-color: var(--accent-hover);
  transform: scale(1.02);
}

.contact-cta:active {
  transform: scale(0.98);
}

.contact-cta:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
}

/* ─── Footer ── */
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

.footer-link[aria-current="page"] {
  color: var(--accent-primary);
  font-weight: 600;
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

/* ─── Reduced-motion overrides ── */
@media (prefers-reduced-motion: reduce) {
  .contact-cta,
  .toc-link,
  .mobile-toc-pill,
  .social-btn,
  .footer-link {
    transition: none;
  }
}
</style>
