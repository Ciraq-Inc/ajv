// SMS Campaign Status
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SENDING: 'sending',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
}

// SMS Recipient Status
export const RECIPIENT_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed'
}

// Billing Status
export const BILLING_STATUS = {
  UNBILLED: 'unbilled',
  BILLED: 'billed',
  BILLING_FAILED: 'billing_failed',
  REFUNDED: 'refunded'
}

// SMS Providers
export const SMS_PROVIDERS = {
  NALO: 'nalo',
  MNOTIFY: 'mnotify'
}

// SMS Providers List (for dropdowns and lookups)
export const SMS_PROVIDERS_LIST = [
  { value: 'nalo', name: 'Nalo Solutions' },
  { value: 'mnotify', name: 'MNotify' }
]

// Recipient Types
export const RECIPIENT_TYPES = {
  ALL: 'all',
  FILTERED: 'filtered',
  CUSTOM: 'custom'
}

// Log Types
export const LOG_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
}

// Issue Types
export const ISSUE_TYPES = {
  UNBILLED_SENT: 'unbilled_sent',
  BILLED_FAILED: 'billed_failed',
  BALANCE_MISMATCH: 'balance_mismatch',
  ORPHANED_TRANSACTION: 'orphaned_transaction'
}

// Issue Status
export const ISSUE_STATUS = {
  DETECTED: 'detected',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  AUTO_FIXED: 'auto_fixed'
}

// Dynamic Variables for Message Templates
export const DYNAMIC_VARIABLES = [
  { key: '[name]', label: 'Customer Name', description: 'Full customer name' },
  { key: '[customer_name]', label: 'Customer Name', description: 'Full customer name (alias)' },
  { key: '[fname]', label: 'First Name', description: 'Customer first name' },
  { key: '[lname]', label: 'Last Name', description: 'Customer last name' },
  { key: '[customer_code]', label: 'Customer Code', description: 'Customer ID/code' },
  { key: '[phone]', label: 'Phone Number', description: 'Customer phone number' },
  { key: '[email]', label: 'Email', description: 'Customer email address' },
  { key: '[city]', label: 'City', description: 'Customer city' },
  { key: '[customer_type]', label: 'Customer Type', description: 'retail or wholesale' }
]

// Status Badge Colors
export const STATUS_COLORS = {
  // Campaign Status Colors
  [CAMPAIGN_STATUS.DRAFT]: 'gray',
  [CAMPAIGN_STATUS.SENDING]: 'blue',
  [CAMPAIGN_STATUS.COMPLETED]: 'green',
  [CAMPAIGN_STATUS.PAUSED]: 'yellow',
  [CAMPAIGN_STATUS.CANCELLED]: 'red',
  [CAMPAIGN_STATUS.FAILED]: 'red',
  
  // Recipient Status Colors
  [RECIPIENT_STATUS.PENDING]: 'gray',
  [RECIPIENT_STATUS.SENT]: 'blue',
  [RECIPIENT_STATUS.DELIVERED]: 'green',
  [RECIPIENT_STATUS.FAILED]: 'red',
  
  // Billing Status Colors
  [BILLING_STATUS.UNBILLED]: 'gray',
  [BILLING_STATUS.BILLED]: 'green',
  [BILLING_STATUS.BILLING_FAILED]: 'red',
  [BILLING_STATUS.REFUNDED]: 'yellow',
  
  // Issue Status Colors
  [ISSUE_STATUS.DETECTED]: 'red',
  [ISSUE_STATUS.INVESTIGATING]: 'yellow',
  [ISSUE_STATUS.RESOLVED]: 'green',
  [ISSUE_STATUS.AUTO_FIXED]: 'blue'
}

// Helper function to get status label
export function getStatusLabel(status) {
  // Defensive: handle undefined/null and non-string inputs
  if (status === null || status === undefined) return 'Unknown'

  const str = String(status).trim()
  if (str.length === 0) return 'Unknown'

  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to get status color classes
export function getStatusColorClass(status) {
  const color = STATUS_COLORS[status] || 'gray'
  return {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300'
  }[color]
}

// Format phone number for display
export function formatPhoneNumber(phone) {
  if (!phone) return ''
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  // Format as +233 XX XXX XXXX
  if (cleaned.length === 12 && cleaned.startsWith('233')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  return phone
}

// Format currency
export function formatCurrency(amount, currency = 'GHS') {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date
export function formatDate(date, format = 'short') {
  if (!date) return '-'
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return d.toISOString()
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date) {
  if (!date) return '-'
  
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now - past) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(date, 'short')
}

// Calculate percentage
export function calculatePercentage(value, total) {
  if (!total || total === 0) return 0
  return Math.round((value / total) * 100)
}

// Format large numbers (e.g., 1.2K, 3.5M)
export function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// Validate message template variables
export function validateMessageTemplate(message) {
  const validVariables = DYNAMIC_VARIABLES.map(v => v.key)
  const usedVariables = message.match(/\[[\w_]+\]/g) || []
  const invalidVariables = usedVariables.filter(v => !validVariables.includes(v))
  
  return {
    isValid: invalidVariables.length === 0,
    invalidVariables,
    usedVariables: usedVariables.filter(v => validVariables.includes(v))
  }
}

// Replace variables in message template
export function replaceVariables(template, data) {
  let message = template
  
  DYNAMIC_VARIABLES.forEach(variable => {
    const key = variable.key.replace(/[\[\]]/g, '')
    const value = data[key] || data[variable.key] || ''
    message = message.replace(new RegExp(variable.key.replace(/[\[\]]/g, '\\$&'), 'g'), value)
  })
  
  return message
}

// Calculate message cost
export function calculateMessageCost(messageCount, pricePerSms = 0.05) {
  return messageCount * pricePerSms
}

// Get SMS length info
export function getSmsLengthInfo(message) {
  const length = message.length
  const singleSmsLength = 160
  const multiSmsLength = 153
  
  if (length === 0) {
    return {
      length: 0,
      parts: 0,
      remaining: singleSmsLength
    }
  }
  
  if (length <= singleSmsLength) {
    return {
      length,
      parts: 1,
      remaining: singleSmsLength - length
    }
  }
  
  const parts = Math.ceil(length / multiSmsLength)
  const remaining = (parts * multiSmsLength) - length
  
  return {
    length,
    parts,
    remaining
  }
}
