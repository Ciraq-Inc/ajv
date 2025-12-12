// utils/paystack.js

/**
 * Load Paystack inline script
 * @returns {Promise<Object>} - Resolves with PaystackPop object when loaded
 */
export const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.PaystackPop) {
      resolve(window.PaystackPop)
      return
    }

    console.log('Loading Paystack script...')

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true

    script.onload = () => {
      if (window.PaystackPop) {
        resolve(window.PaystackPop)
      } else {
        reject(new Error('Paystack script failed to load'))
      }
    }

    script.onerror = () => {
      reject(new Error('Failed to load Paystack script'))
    }

    document.head.appendChild(script)
  })
}
