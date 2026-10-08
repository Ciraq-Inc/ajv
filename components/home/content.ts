export interface Faq {
  id: string
  question: string
  answer: string
}

export interface Stat {
  label: string
  value: string
}

export interface Step {
  title: string
  body: string
  image: string
  alt: string
}

export const FAQS: Faq[] = [
  {
    id: 'licensed',
    question: 'Are the pharmacies on MedsGh licensed?',
    answer:
      'Yes. Every pharmacy in our network is fully accredited by the Pharmacy Council of Ghana. We verify licenses and compliance records before onboarding any partner to ensure your safety.',
  },
  {
    id: 'prescriptions',
    question: 'How do you handle prescription medications?',
    answer:
      'For prescription-only medicines you are required to upload a clear photo or digital copy of a valid prescription. Our pharmacists review these documents before processing your order.',
  },
  {
    id: 'radius',
    question: 'What is the delivery radius?',
    answer:
      'We currently operate across all major cities in Ghana including Accra, Kumasi, Takoradi, and Tamale. We are expanding our partner network to reach more communities soon.',
  },
  {
    id: 'data',
    question: 'Is my personal and medical data safe?',
    answer:
      'All data is encrypted in transit and at rest. We are PCI-DSS compliant for payment data and follow Ghana Data Protection Act requirements for health information. Your prescription details are never shared with third parties.',
  },
]

export const STATS: Stat[] = [
  { label: 'Verified pharmacies', value: '210+' },
  { label: 'Avg. delivery', value: '45 min' },
  { label: 'Genuine medicines', value: '100%' },
  { label: 'Expert support', value: '24 / 7' },
]

export const STEPS: Step[] = [
  {
    title: 'Upload or list your meds',
    body: 'Securely upload a prescription photo or search our database for over-the-counter essentials.',
    image: '/request_med_image.png',
    alt: 'Person using a smartphone to search for medication',
  },
  {
    title: 'We source and verify',
    body: 'Our system checks stock across 210+ verified pharmacies to find the best price and availability.',
    image: '/pharmacist_picking_order.png',
    alt: 'Pharmacist picking and verifying a medication order',
  },
  {
    title: 'Confirm and receive',
    body: 'Pay securely, then track your order in real time. Most deliveries arrive within 45 minutes.',
    image: '/drug_delivery.png',
    alt: 'Delivery rider handing medication to a customer',
  },
]

export const SUPPORT_PHONE = '+233599368632'
export const SUPPORT_WHATSAPP = 'https://wa.me/+233599368632'

export interface HeroDraftItem {
  product_name: string
  requested_unit: string
  quantity: number
  prefer_clearance_only: boolean
}
