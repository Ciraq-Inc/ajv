import { loadPaystackScript } from '~/utils/paystack'

interface PaystackMetadata {
  [key: string]: unknown
}

interface PaystackPaymentData {
  amount: number
  email: string
  reference: string
  metadata?: PaystackMetadata
}

interface PaystackResponse {
  reference: string
  status: string
  trans: string
  transaction: string
  [key: string]: unknown
}

interface PaystackHandler {
  openIframe: () => void
}

interface PaystackSetupOptions {
  key: string
  email: string
  amount: number
  ref: string
  metadata?: PaystackMetadata
  currency: string
  channels: string[]
  onClose: () => void
  callback: (response: PaystackResponse) => void
}

interface PaystackPop {
  setup: (options: PaystackSetupOptions) => PaystackHandler
}

interface VerifyResult {
  status: 'success' | 'error'
  data?: unknown
  message?: string
}

export const usePaystack = () => {
  const config = useRuntimeConfig()

  /**
   * Initialize Paystack payment popup
   */
  const initializePayment = async (
    { amount, email, reference, metadata }: PaystackPaymentData,
    onSuccess?: (response: PaystackResponse) => void,
    onClose?: () => void
  ): Promise<{ success: true }> => {
    try {
      console.log('=== Paystack Payment Initialization ===')
      console.log('Config available:', !!config)
      console.log('Public config:', config.public)

      console.log('Loading Paystack script...')
      const PaystackPop = (await loadPaystackScript()) as PaystackPop
      console.log('Paystack script loaded successfully')

      const publicKey = config.public.paystackPublicKey as string
      console.log('Paystack Public Key:', publicKey ? `${publicKey.substring(0, 15)}...` : 'NOT FOUND')

      if (!publicKey || publicKey === 'pk_test_default') {
        throw new Error(
          'Paystack public key not configured. Please set PAYSTACK_PUBLIC_KEY in .env file and restart the server.'
        )
      }

      console.log('Setting up Paystack popup with:', {
        key: publicKey.substring(0, 15) + '...',
        email,
        amount,
        reference,
        metadata,
      })

      const baseOptions: PaystackSetupOptions = {
        key: publicKey,
        email,
        amount,
        ref: reference,
        currency: 'GHS',
        channels: ['card', 'bank', 'ussd', 'mobile_money'],
        onClose: () => {
          console.log('Payment popup closed by user')
          onClose?.()
        },
        callback: (response: PaystackResponse) => {
          console.log('Payment successful! Response:', response)
          onSuccess?.(response)
        },
      }
      if (metadata !== undefined) baseOptions.metadata = metadata
      const handler = PaystackPop.setup(baseOptions)

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
   * Note: this calls the Paystack API directly using the secret key exposed
   * via runtimeConfig.public — this is intentional per the existing JS code
   * and noted as a legacy pattern.
   */
  const verifyPayment = async (reference: string): Promise<VerifyResult> => {
    try {
      const secretKey = config.public.paystackSecretKey2 as string

      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        }
      )

      const data = (await response.json()) as { status: boolean; data: unknown }
      console.log('Payment verification data:', data)

      if (data.status) {
        return {
          status: 'success',
          data: data.data,
        }
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        status: 'error',
        message: (error as Error).message || 'Payment verification failed',
      }
    }
  }

  return {
    initializePayment,
    verifyPayment,
  }
}
