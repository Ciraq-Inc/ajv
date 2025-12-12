import { loadPaystackScript } from '~/utils/paystack'

export const usePaystack = () => {
  const config = useRuntimeConfig()

  /**
   * Initialize Paystack payment popup
   * @param {Object} paymentData - Payment initialization data
   * @param {number} paymentData.amount - Amount in pesewas (smallest currency unit)
   * @param {string} paymentData.email - Customer email
   * @param {string} paymentData.reference - Unique payment reference
   * @param {Object} paymentData.metadata - Additional metadata
   * @param {Function} onSuccess - Callback on successful payment
   * @param {Function} onClose - Callback when popup is closed
   * @returns {Promise} - Resolves when payment is initialized
   */
  const initializePayment = async ({ amount, email, reference, metadata }, onSuccess, onClose) => {
    try {
      console.log('=== Paystack Payment Initialization ===')
      console.log('Config available:', !!config)
      console.log('Public config:', config.public)
      
      // Load Paystack script
      console.log('Loading Paystack script...')
      const PaystackPop = await loadPaystackScript()
      console.log('Paystack script loaded successfully')

      // Get public key from runtime config
      const publicKey = config.public.paystackPublicKey
      console.log('Paystack Public Key:', publicKey ? `${publicKey.substring(0, 15)}...` : 'NOT FOUND')

      if (!publicKey || publicKey === 'pk_test_default') {
        throw new Error('Paystack public key not configured. Please set PAYSTACK_PUBLIC_KEY in .env file and restart the server.')
      }

      console.log('Setting up Paystack popup with:', {
        key: publicKey.substring(0, 15) + '...',
        email,
        amount,
        reference,
        metadata
      })

      // Initialize Paystack popup
      // According to Paystack docs: https://paystack.com/docs/payments/accept-payments/#collect-customer-information
      const handler = PaystackPop.setup({
        key: publicKey,
        email,
        amount,
        ref: reference,
        metadata,
        currency: 'GHS', // Ghana Cedis - IMPORTANT for channel availability
        channels: ['card', 'bank', 'ussd', 'mobile_money'], // Explicitly specify available channels
        onClose: () => {
          console.log('Payment popup closed by user')
          if (onClose) onClose()
        },
        callback: (response) => {
          console.log('Payment successful! Response:', response)
          if (onSuccess) onSuccess(response)
        }
      })

      // Open payment popup
      console.log('Opening Paystack payment popup...')
      handler.openIframe()

      return { success: true }
    } catch (error) {
      console.error('Error initializing Paystack payment:', error)
      throw error
    }
  }

  /**
   * Verify payment status (client-side verification)
   * @param {string} reference - Payment reference to verify
   * @returns {Object} - Verification result
   */
  const verifyPayment = async (reference) => {
    try {
      // Get your secret key from runtime config
      const secretKey = config.public.paystackSecretKey2

      // Verify the transaction
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`
          }
        }
      )

      const data = await response.json()
      console.log('Payment verification data:', data)

      if (data.status) {
        return {
          status: 'success',
          data: data.data
        }
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification error:', error)

      return {
        status: 'error',
        message: error.message || 'Payment verification failed'
      }
    }
  }

  return {
    initializePayment,
    verifyPayment
  }
}
