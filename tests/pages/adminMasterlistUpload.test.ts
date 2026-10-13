import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// Uploading product images from the master list. The HTTP layer is the boundary. The single "Change"
// upload must go through the same authenticated client as everything else (the server now refuses
// anonymous uploads), and the bulk upload must say what it left out, what it skipped and why.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), request: vi.fn() }))

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useApi', () => http)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://api.test' } }))
vi.mock('~/composables/useApi', () => ({ useApi: () => http }))
vi.mock('~/stores/admin', () => ({ useAdminStore: () => ({ isSuperAdmin: true }) }))

import MasterlistPage from '~/pages/admin/masterlist.vue'

const stubs = { Teleport: true, Icon: true, NuxtLink: true, ClientOnly: true }
const product = () => ({ id: 5, product_description: 'Paracetamol', product_image_url: null })
const image = (name: string, size = 1000, type = 'image/jpeg') => {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}
const failure = (message: string, status: number) => Object.assign(new Error(message), { status })

let wrapper: ReturnType<typeof mount> | undefined
const open = async () => {
  wrapper = mount(MasterlistPage, { global: { stubs } })
  await flushPromises()
  return wrapper
}
const button = (label: RegExp) => (wrapper as ReturnType<typeof mount>).findAll('button').find((b) => label.test(b.text()))!
const pickFiles = async (files: File[]) => {
  const input = (wrapper as ReturnType<typeof mount>).find('input[type="file"][accept^="image"][multiple]')
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
}
const openBulk = async () => {
  await open()
  await button(/auto upload/i).trigger('click')
}
const uploaded = () => http.request.mock.calls.map(([, init]) => init.body as FormData)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  http.get.mockImplementation(async (url: string) =>
    url === '/api/master-products' ? { success: true, data: [product()], total: 1 } : { success: true, data: [] })
  http.request.mockResolvedValue({ success: true, imageUrl: 'https://cdn.test/new.jpg' })
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('masterlist: changing one product image', () => {
  it('sends the file through the authenticated client, not a bare XMLHttpRequest', async () => {
    const xhr = vi.fn()
    vi.stubGlobal('XMLHttpRequest', xhr)
    await open()
    await button(/^\s*upload\s*$/i).trigger('click')
    const input = (wrapper as ReturnType<typeof mount>).find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [image('p.jpg')], configurable: true })
    await input.trigger('change')

    await button(/upload image/i).trigger('click')
    await flushPromises()

    expect(xhr).not.toHaveBeenCalled()
    expect(http.request).toHaveBeenCalledWith('/api/master-products/upload-image', expect.objectContaining({ method: 'POST' }))
    const form = uploaded()[0]!
    expect(form.get('productId')).toBe('5')
    expect(form.get('forceUpdate')).toBeNull()
  })

  it('shows the server\'s reason when the upload is refused', async () => {
    http.request.mockRejectedValue(failure('Your role cannot change products', 403))
    await open()
    await button(/^\s*upload\s*$/i).trigger('click')
    const input = (wrapper as ReturnType<typeof mount>).find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [image('p.jpg')], configurable: true })
    await input.trigger('change')

    await button(/upload image/i).trigger('click')
    await flushPromises()

    expect((wrapper as ReturnType<typeof mount>).text()).toContain('Your role cannot change products')
  })
})

describe('masterlist: bulk image upload', () => {
  it('says which chosen files were left out and why', async () => {
    await openBulk()

    await pickFiles([
      image('101.jpg'),
      image('notes.jpg'),
      image('102.gif', 1000, 'image/gif'),
      image('103.jpg', 6 * 1024 * 1024),
    ])

    const text = (wrapper as ReturnType<typeof mount>).text()
    expect(text).toContain('3 files were left out')
    expect(text).toContain('notes.jpg')
    expect(text).toContain('102.gif')
    expect(text).toContain('103.jpg')
  })

  it('keeps one image per product when two files name the same product', async () => {
    await openBulk()

    await pickFiles([image('101.jpg'), image('101.png', 1000, 'image/png')])

    const text = (wrapper as ReturnType<typeof mount>).text()
    expect(text).toContain('Upload 1 Images')
    expect(text).toContain('101.png')
  })

  it('sends forceUpdate as chosen, and counts a product that already has an image as skipped', async () => {
    http.request.mockResolvedValue({ success: false, skipped: true, error: 'Product already has an image' })
    await openBulk()
    await pickFiles([image('101.jpg')])

    await button(/upload 1 images/i).trigger('click')
    await flushPromises()

    expect(uploaded()[0]!.get('forceUpdate')).toBe('false')
    const text = (wrapper as ReturnType<typeof mount>).text()
    expect(text).toContain('Product already has an image')
    expect(text).toMatch(/0\s*Uploaded/)
  })

  it('treats an unknown product as skipped and any other failure as failed', async () => {
    http.request
      .mockRejectedValueOnce(failure('Product not found', 404))
      .mockRejectedValueOnce(failure('Storage service not configured', 500))
    await openBulk()
    await pickFiles([image('101.jpg'), image('102.jpg')])

    await button(/upload 2 images/i).trigger('click')
    await flushPromises()

    const text = (wrapper as ReturnType<typeof mount>).text()
    expect(text).toContain('Product not found in database')
    expect(text).toContain('Storage service not configured')
    expect(text).toContain('Processed 2 images: 0 uploaded, 1 failed, 1 skipped')
  })

  it('does not call the upload a failure when the list refresh afterwards fails', async () => {
    await openBulk()
    await pickFiles([image('101.jpg')])
    http.get.mockRejectedValue(new Error('refresh dropped'))

    await button(/upload 1 images/i).trigger('click')
    await flushPromises()

    const text = (wrapper as ReturnType<typeof mount>).text()
    expect(text).toContain('Processed 1 images: 1 uploaded')
    expect(text).not.toContain('Bulk upload failed')
  })
})
