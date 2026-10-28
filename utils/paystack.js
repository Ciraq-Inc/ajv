// utils/paystack.js

let paystackScriptPromise = null

/**
 * Load Paystack inline script
 * @returns {Promise<Object>} - Resolves with PaystackPop object when loaded
 */
export const loadPaystackScript = () => {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop)
  if (paystackScriptPromise) return paystackScriptPromise

  paystackScriptPromise = new Promise((resolve, reject) => {
    console.log('Loading Paystack script...')

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true

    const clearHandlers = () => {
      script.onload = null
      script.onerror = null
    }

    const fail = (error) => {
      clearHandlers()
      script.remove()
      paystackScriptPromise = null
      reject(error)
    }

    script.onload = () => {
      if (window.PaystackPop) {
        clearHandlers()
        resolve(window.PaystackPop)
      } else {
        fail(new Error('Paystack script failed to load'))
      }
    }

    script.onerror = () => {
      fail(new Error('Failed to load Paystack script'))
    }

    document.head.appendChild(script)
  })

  return paystackScriptPromise
}
