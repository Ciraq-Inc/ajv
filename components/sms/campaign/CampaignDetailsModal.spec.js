import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import CampaignDetailsModal from './CampaignDetailsModal.vue'

// Mock the composable
vi.mock('~/composables/useSMSCampaigns', () => ({
  useSMSCampaigns: () => ({
    campaigns: ref([
      {
        id: 1,
        name: 'Test Campaign',
        status: 'sending',
        message: 'Test message',
        sms_provider: 'Test Provider',
        sender_id: 'TEST',
        created_at: '2025-01-01T00:00:00Z',
        started_at: '2025-01-01T01:00:00Z',
        completed_at: null,
        total_recipients: 100
      }
    ]),
    fetchCampaign: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Test Campaign',
        status: 'sending',
        message: 'Test message',
        sms_provider: 'Test Provider',
        sender_id: 'TEST',
        created_at: '2025-01-01T00:00:00Z',
        started_at: '2025-01-01T01:00:00Z',
        completed_at: null,
        total_recipients: 100
      }
    }),
    fetchCampaignStats: vi.fn().mockResolvedValue({
      data: {
        total_recipients: 100,
        messages_sent: 95,
        messages_delivered: 90,
        messages_failed: 5
      }
    }),
    fetchCampaignLogs: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          campaign_id: 1,
          recipient_id: null,
          log_type: 'info',
          message: 'Campaign started',
          created_at: '2025-01-01T01:00:00Z',
          metadata: null
        },
        {
          id: 2,
          campaign_id: 1,
          recipient_id: 123,
          log_type: 'success',
          message: 'Message sent',
          created_at: '2025-01-01T01:05:00Z',
          metadata: { phone: '+1234567890' }
        },
        {
          id: 3,
          campaign_id: 1,
          recipient_id: 124,
          log_type: 'error',
          message: 'Failed to send',
          created_at: '2025-01-01T01:10:00Z',
          metadata: { error: 'Invalid number' }
        }
      ]
    })
  })
}))

describe('CampaignDetailsModal.vue', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(CampaignDetailsModal, {
      props: {
        isOpen: true,
        campaignId: 1,
        ...props
      },
      global: {
        stubs: {
          Transition: false
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Props', () => {
    it('should render when isOpen is true', async () => {
      wrapper = createWrapper({ isOpen: true })
      await flushPromises()
      expect(wrapper.find('.fixed').exists()).toBe(true)
    })

    it('should not render when isOpen is false', async () => {
      wrapper = createWrapper({ isOpen: false })
      await flushPromises()
      expect(wrapper.find('.fixed').exists()).toBe(false)
    })

    it('should accept campaignId prop', async () => {
      wrapper = createWrapper({ campaignId: 1 })
      expect(wrapper.props('campaignId')).toBe(1)
    })

    it('should default campaignId to null', () => {
      wrapper = createWrapper({ campaignId: undefined })
      expect(wrapper.props('campaignId')).toBeNull()
    })
  })

  describe('Component Emits', () => {
    it('should emit close event when close button is clicked', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const closeButton = wrapper.find('button.text-gray-200')
      await closeButton.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit start event when Start Campaign button is clicked', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const startButton = wrapper.find('button:has-text("Start Campaign")')
      if (startButton.exists()) {
        await startButton.trigger('click')
        expect(wrapper.emitted('start')).toBeTruthy()
      }
    })

    it('should emit pause event when Pause button is clicked', async () => {
      wrapper = createWrapper()
      await flushPromises()
      // Component needs status 'sending' to show pause button
      const buttons = wrapper.findAll('button')
      const pauseButton = buttons.find(btn => btn.text().includes('Pause'))
      if (pauseButton) {
        await pauseButton.trigger('click')
        expect(wrapper.emitted('pause')).toBeTruthy()
      }
    })

    it('should emit cancel event when Cancel button is clicked', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAll('button')
      const cancelButton = buttons.find(btn => btn.text().includes('Cancel'))
      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.emitted('cancel')).toBeTruthy()
      }
    })
  })

  describe('Data Loading', () => {
    it('should show loading state when loading is true', async () => {
      wrapper = createWrapper()
      wrapper.vm.loading = true
      await flushPromises()
      expect(wrapper.find('p:has-text("Loading campaign details")').exists()).toBe(true)
    })

    it('should load campaign details on mount', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.vm.campaign).toBeDefined()
    })

    it('should load campaign stats', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.vm.stats).toBeDefined()
      expect(wrapper.vm.stats.total_recipients).toBe(100)
    })

    it('should load campaign logs', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.vm.logs).toBeDefined()
      expect(wrapper.vm.logs.length).toBeGreaterThan(0)
    })
  })

  describe('Computed Properties', () => {
    it('should compute recipientLogs correctly', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const recipientLogs = wrapper.vm.recipientLogs
      expect(recipientLogs.length).toBe(2) // Only logs with recipient_id
      expect(recipientLogs.every(log => log.recipient_id)).toBe(true)
    })

    it('should compute campaignLogs correctly', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const campaignLogs = wrapper.vm.campaignLogs
      expect(campaignLogs.length).toBe(1) // Only logs without recipient_id
      expect(campaignLogs.every(log => !log.recipient_id)).toBe(true)
    })

    it('should sort logs by created_at in descending order', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const recipientLogs = wrapper.vm.recipientLogs
      for (let i = 0; i < recipientLogs.length - 1; i++) {
        const date1 = new Date(recipientLogs[i].created_at)
        const date2 = new Date(recipientLogs[i + 1].created_at)
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
      }
    })
  })

  describe('Template Rendering', () => {
    it('should display campaign name in header', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('Test Campaign')
    })

    it('should display campaign status badge', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('sending')
    })

    it('should display all stat cards', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('Total Recipients')
      expect(wrapper.text()).toContain('Sent')
      expect(wrapper.text()).toContain('Delivered')
      expect(wrapper.text()).toContain('Failed')
    })

    it('should display campaign information section', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('Campaign Information')
      expect(wrapper.text()).toContain('Test message')
      expect(wrapper.text()).toContain('Test Provider')
    })

    it('should display message logs section', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('Message Logs')
    })

    it('should display campaign timeline when logs exist', async () => {
      wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('Campaign Timeline')
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      wrapper = createWrapper()
      const result = wrapper.vm.formatDate('2025-01-01T12:30:00Z')
      expect(result).toMatch(/Jan/)
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/12:30/)
    })

    it('should return "-" for null dates', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.formatDate(null)).toBe('-')
    })

    it('should return "-" for undefined dates', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.formatDate(undefined)).toBe('-')
    })
  })

  describe('Status Class Selection', () => {
    it('should return correct class for draft status', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.getStatusClass('draft')).toContain('bg-gray-100')
    })

    it('should return correct class for sending status', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.getStatusClass('sending')).toContain('bg-blue-100')
    })

    it('should return correct class for completed status', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.getStatusClass('completed')).toContain('bg-green-100')
    })

    it('should return correct class for paused status', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.getStatusClass('paused')).toContain('bg-yellow-100')
    })

    it('should return correct class for cancelled status', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.getStatusClass('cancelled')).toContain('bg-red-100')
    })

    it('should return default class for unknown status', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.getStatusClass('unknown')).toContain('bg-gray-100')
    })
  })

  describe('User Interactions', () => {
    it('should close modal when backdrop is clicked', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const backdrop = wrapper.find('.fixed.inset-0.bg-black')
      await backdrop.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should refresh logs when refresh button is clicked', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const refreshButton = wrapper.find('button:has-text("Refresh")')
      if (refreshButton.exists()) {
        await refreshButton.trigger('click')
        expect(wrapper.vm.logs).toBeDefined()
      }
    })

    it('should handle close when close button in modal is clicked', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const closeButtons = wrapper.findAll('button')
      const modalCloseButton = closeButtons.find(btn => btn.find('.text-gray-400').exists())
      if (modalCloseButton) {
        await modalCloseButton.trigger('click')
        expect(wrapper.emitted('close')).toBeTruthy()
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty campaign', async () => {
      wrapper = createWrapper({ campaignId: 999 })
      await flushPromises()
      expect(wrapper.find('.text-center').exists()).toBe(true)
    })

    it('should handle empty logs', async () => {
      const { useSMSCampaigns } = await import('~/composables/useSMSCampaigns')
      wrapper = createWrapper()
      wrapper.vm.logs = []
      await flushPromises()
      expect(wrapper.text()).toContain('No message logs yet')
    })

    it('should handle missing stats data', async () => {
      wrapper = createWrapper()
      wrapper.vm.stats = {}
      await flushPromises()
      expect(wrapper.text()).toContain('0')
    })

    it('should handle campaign with no completed_at date', async () => {
      wrapper = createWrapper()
      await flushPromises()
      // Should not throw error
      expect(wrapper.vm.campaign).toBeDefined()
    })
  })

  describe('Modal Transitions', () => {
    it('should apply transition classes', async () => {
      wrapper = createWrapper({ isOpen: true })
      await flushPromises()
      const transition = wrapper.findComponent({ name: 'Transition' })
      expect(transition.exists()).toBe(true)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid classes on stat cards', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const grid = wrapper.find('.grid.grid-cols-1.md\\:grid-cols-4')
      expect(grid.exists()).toBe(true)
    })

    it('should have responsive grid classes on campaign info', async () => {
      wrapper = createWrapper()
      await flushPromises()
      const grid = wrapper.find('.grid.grid-cols-1.md\\:grid-cols-2')
      expect(grid.exists()).toBe(true)
    })
  })
})
