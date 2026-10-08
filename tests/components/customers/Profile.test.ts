import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

// ── Boundaries: the user store and the customer-auth HTTP service ───────────
const user = vi.hoisted(() => ({
  userPhoneNumber: '+233244123456',
  currentUser: { fname: 'Fallback', lname: 'Person', email: 'fallback@example.com', email_verified: false },
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
  autocompleteLocation: vi.fn(),
  reverseGeocodeHomeLocation: vi.fn(),
}))
const authService = vi.hoisted(() => ({
  getMyProfessionalApplication: vi.fn(),
  applyForProfessional: vi.fn(),
  sendProfessionalVerificationOtp: vi.fn(),
  confirmProfessionalVerificationOtp: vi.fn(),
}))
vi.mock('~/stores/user', () => ({ useUserStore: () => user }))
vi.mock('~/services/customerAuth/customerAuthService', () => ({ createCustomerAuthService: () => authService }))
vi.mock('~/composables/useApi', () => ({ useApi: () => ({}) }))

import Profile from '~/components/customers/profile.vue'

const PROFILE = {
  fname: 'Ama',
  lname: 'Mensah',
  email: 'ama@example.com',
  email_verified: true,
  home_address: '12 Oak St, Accra',
  home_latitude: 5.6,
  home_longitude: -0.18,
}

type W = ReturnType<typeof mount>
let wrapper: W | undefined
const mountProfile = async () => {
  wrapper = mount(Profile, { attachTo: document.body })
  await flushPromises()
  return wrapper
}
const button = (w: W, text: string) => {
  const b = w.findAll('button').find(x => x.text().trim() === text)
  if (!b) throw new Error(`no button "${text}" in: ${w.findAll('button').map(x => x.text().trim()).join(' | ')}`)
  return b
}
const hasButton = (w: W, text: string) => w.findAll('button').some(x => x.text().trim() === text)
const save = async (w: W) => { await w.findAll('form')[0].trigger('submit'); await flushPromises() }
const input = (w: W, id: string) => w.find(`#${id}`).element as HTMLInputElement

const stubGeolocation = (impl: (ok: (p: unknown) => void, fail: (e: unknown) => void) => void) => {
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: vi.fn(impl) }, configurable: true })
}

beforeEach(() => {
  vi.clearAllMocks()
  user.getProfile.mockResolvedValue({ ...PROFILE })
  user.updateProfile.mockResolvedValue({ ...PROFILE })
  user.sendEmailVerification.mockResolvedValue({ status: 'sent' })
  user.autocompleteLocation.mockResolvedValue([])
  user.reverseGeocodeHomeLocation.mockResolvedValue({ address: 'Osu, Accra' })
  authService.getMyProfessionalApplication.mockResolvedValue({ data: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: showing the saved details', () => {
  it('fills the form from the saved profile and shows the name, initials and phone', async () => {
    const w = await mountProfile()

    expect(input(w, 'fname').value).toBe('Ama')
    expect(input(w, 'lname').value).toBe('Mensah')
    expect(input(w, 'email').value).toBe('ama@example.com')
    expect(w.text()).toContain('Ama Mensah')
    expect(w.text()).toContain('AM')
    expect(input(w, 'phone').value).toMatch(/244 123 456|0244 123 456|\+233/)
  })

  it('falls back to the signed-in user for fields the profile leaves out', async () => {
    user.getProfile.mockResolvedValue({ home_address: '' })
    const w = await mountProfile()

    expect(input(w, 'fname').value).toBe('Fallback')
    expect(input(w, 'email').value).toBe('fallback@example.com')
  })

  it('never lets the customer edit their phone number', async () => {
    const w = await mountProfile()
    expect(w.find('#phone').attributes('disabled')).toBeDefined()
  })

  it('says whether a home location is saved', async () => {
    const w = await mountProfile()
    expect(w.text()).toContain('Location Saved')
    expect(w.text()).toContain('12 Oak St, Accra')

    user.getProfile.mockResolvedValue({ ...PROFILE, home_address: '', home_latitude: null, home_longitude: null })
    wrapper!.unmount()
    const empty = await mountProfile()
    expect(empty.text()).toContain('Location Needed')
    expect(empty.text()).toContain('No Location Set')
  })

  it('tells the customer their profile is loading, in words, until it arrives', async () => {
    let finish!: (v: unknown) => void
    user.getProfile.mockReturnValue(new Promise((res) => { finish = res }))
    const w = await mountProfile()

    expect(w.find('[role="status"]').text()).toMatch(/loading your profile/i)

    finish({ ...PROFILE })
    await flushPromises()
    expect(w.text()).not.toMatch(/loading your profile/i)
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: layout and what to do next', () => {
  it('is organised into clearly named sections', async () => {
    const w = await mountProfile()
    const headings = w.findAll('h2').map(h => h.text())

    expect(headings).toEqual(expect.arrayContaining([
      'Personal details',
      'Email and sign-in',
      'Delivery address',
      'Health professional verification',
    ]))
  })

  it('shows how complete the profile is, as a progress bar with a number', async () => {
    const w = await mountProfile()
    const bar = w.find('[role="progressbar"]')

    expect(bar.attributes('aria-valuenow')).toBe('3')
    expect(bar.attributes('aria-valuemax')).toBe('3')
    expect(w.text()).toContain('Your profile is complete')
  })

  it('names the next steps when something is missing', async () => {
    user.getProfile.mockResolvedValue({ ...PROFILE, email_verified: false, home_address: '', home_latitude: null, home_longitude: null })
    const w = await mountProfile()

    expect(w.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
    expect(w.text()).toContain('1 of 3 steps done')
    expect(w.find('[data-testid="next-steps"]').text()).toContain('Verify your email')
    expect(w.find('[data-testid="next-steps"]').text()).toContain('Save a home address')
  })

  it('asks for an email when there is none', async () => {
    user.getProfile.mockResolvedValue({ ...PROFILE, email: '', email_verified: false })
    user.currentUser.email = ''
    const w = await mountProfile()
    user.currentUser.email = 'fallback@example.com'

    expect(w.find('[data-testid="next-steps"]').text()).toContain('Add your email')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: account areas and setup checklist', () => {
  it('offers a jump link to each area of the profile', async () => {
    const w = await mountProfile()
    const nav = w.find('nav[aria-label="Account areas"]')
    const links = nav.findAll('a').map(a => [a.text(), a.attributes('href')])

    expect(links).toEqual([
      ['Personal info', '#profile-personal'],
      ['Sign-in and security', '#profile-email'],
      ['Delivery address', '#profile-address'],
      ['Health professional', '#profile-professional'],
    ])
    for (const [, href] of links) {
      expect(w.find(href as string).exists()).toBe(true)
    }
  })

  it('titles the checklist "Finish setting up" and ticks off finished steps', async () => {
    user.getProfile.mockResolvedValue({ ...PROFILE, email_verified: false })
    const w = await mountProfile()
    const list = w.find('[data-testid="next-steps"]')

    expect(w.text()).toContain('Finish setting up')
    const done = list.findAll('li').filter(li => li.text().includes('Done'))
    expect(done).toHaveLength(2)
    expect(list.text()).toContain('Verify your email')
  })

  it('hides the checklist once everything is done', async () => {
    const w = await mountProfile()

    expect(w.text()).not.toContain('Finish setting up')
    expect(w.find('[data-testid="next-steps"]').exists()).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: unsaved changes', () => {
  const bar = (w: W) => w.find('[data-testid="save-bar"]')

  it('shows no save bar until something is changed', async () => {
    const w = await mountProfile()
    expect(bar(w).exists()).toBe(false)
  })

  it('shows a save bar, announced politely, as soon as a field is edited', async () => {
    const w = await mountProfile()
    await w.find('#fname').setValue('Abena')

    expect(bar(w).exists()).toBe(true)
    expect(bar(w).attributes('aria-live')).toBe('polite')
    expect(bar(w).text()).toContain('You have unsaved changes')
  })

  it('hides the bar again if the edit is typed back to what was saved', async () => {
    const w = await mountProfile()
    await w.find('#fname').setValue('Abena')
    await w.find('#fname').setValue('Ama')

    expect(bar(w).exists()).toBe(false)
  })

  it('Discard puts everything back as it was saved', async () => {
    const w = await mountProfile()
    await w.find('#fname').setValue('Abena')
    await w.find('#email').setValue('other@example.com')
    await w.find('#current-password').setValue('pw')
    await button(w, 'Discard').trigger('click')

    expect(input(w, 'fname').value).toBe('Ama')
    expect(input(w, 'email').value).toBe('ama@example.com')
    expect(w.find('[data-testid="current-password-field"]').exists()).toBe(false)
    expect(bar(w).exists()).toBe(false)
  })

  it('treats a cleared home address as a change, and Discard brings it back', async () => {
    const w = await mountProfile()
    await w.find('button[aria-label="Clear saved address"]').trigger('click')
    expect(bar(w).exists()).toBe(true)

    await button(w, 'Discard').trigger('click')
    expect(w.text()).toContain('Location Saved')
    expect(input(w, 'profile-address-search').value).toBe('12 Oak St, Accra')
  })

  it('goes away after a successful save, which becomes the new starting point', async () => {
    const w = await mountProfile()
    await w.find('#fname').setValue('Abena')
    user.updateProfile.mockResolvedValue({ ...PROFILE, fname: 'Abena' })
    await save(w)

    expect(bar(w).exists()).toBe(false)
    await w.find('#fname').setValue('Esi')
    await button(w, 'Discard').trigger('click')
    expect(input(w, 'fname').value).toBe('Abena')
  })

  it('stays when the save fails, so nothing typed is lost', async () => {
    user.updateProfile.mockRejectedValue(new Error('Server error'))
    const w = await mountProfile()
    await w.find('#fname').setValue('Abena')
    await save(w)

    expect(bar(w).exists()).toBe(true)
    expect(input(w, 'fname').value).toBe('Abena')
  })

  it('does not go looking for suggestions just because the saved address was loaded or restored', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = await mountProfile()
    vi.advanceTimersByTime(1000)
    await flushPromises()
    expect(user.autocompleteLocation).not.toHaveBeenCalled()

    await w.find('button[aria-label="Clear saved address"]').trigger('click')
    await button(w, 'Discard').trigger('click')
    vi.advanceTimersByTime(1000)
    await flushPromises()
    expect(user.autocompleteLocation).not.toHaveBeenCalled()
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: required names', () => {
  it('will not save a blank first name, and says so at the field', async () => {
    const w = await mountProfile()
    await w.find('#fname').setValue('   ')
    await save(w)

    expect(user.updateProfile).not.toHaveBeenCalled()
    expect(w.find('#fname').attributes('aria-invalid')).toBe('true')
    expect(w.find('#fname-error').text()).toBe('Enter your first name.')
    expect(w.find('#fname').attributes('aria-describedby')).toContain('fname-error')
  })

  it('does the same for the last name, and clears the message once it is fixed', async () => {
    const w = await mountProfile()
    await w.find('#lname').setValue('')
    await save(w)
    expect(w.find('#lname-error').text()).toBe('Enter your last name.')

    await w.find('#lname').setValue('Mensah')
    expect(w.find('#lname-error').exists()).toBe(false)
    expect(w.find('#lname').attributes('aria-invalid')).toBeUndefined()
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: saving', () => {
  it('sends the edited details, with the saved home location', async () => {
    const w = await mountProfile()
    await w.find('#fname').setValue('Abena')
    await save(w)

    expect(user.updateProfile).toHaveBeenCalledWith({
      fname: 'Abena',
      lname: 'Mensah',
      email: 'ama@example.com',
      home_address: '12 Oak St, Accra',
      home_latitude: 5.6,
      home_longitude: -0.18,
    })
  })

  it('confirms the save as a status message that can be dismissed, then it goes away by itself', async () => {
    const w = await mountProfile()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await save(w)

    const ok = w.find('[data-testid="save-success"]')
    expect(ok.attributes('role')).toBe('status')
    expect(ok.text()).toContain('Profile updated')

    await ok.find('button[aria-label="Dismiss message"]').trigger('click')
    expect(w.find('[data-testid="save-success"]').exists()).toBe(false)

    await save(w)
    expect(w.find('[data-testid="save-success"]').exists()).toBe(true)
    vi.advanceTimersByTime(3000)
    await w.vm.$nextTick()
    expect(w.find('[data-testid="save-success"]').exists()).toBe(false)
  })

  it('disables the button and says "Saving" while it works', async () => {
    let finish!: (v: unknown) => void
    user.updateProfile.mockReturnValue(new Promise((res) => { finish = res }))
    const w = await mountProfile()
    await w.find('#fname').setValue('Abena')
    await w.findAll('form')[0].trigger('submit')

    const btn = w.find('[data-testid="save-bar"] button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toContain('Saving')

    finish({ ...PROFILE })
    await flushPromises()
    expect(w.find('[data-testid="save-bar"]').exists()).toBe(false) // saved: nothing left to save
  })

  it('shows a failed save as an alert, and keeps it until the customer acts', async () => {
    user.updateProfile.mockRejectedValue(new Error('Something went wrong on our side'))
    const w = await mountProfile()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await save(w)

    const err = w.find('[data-testid="save-error"]')
    expect(err.attributes('role')).toBe('alert')
    expect(err.text()).toContain('Something went wrong')

    vi.advanceTimersByTime(30000)
    await w.vm.$nextTick()
    expect(w.find('[data-testid="save-error"]').exists()).toBe(true) // errors are not timed out

    user.updateProfile.mockResolvedValue({ ...PROFILE })
    await save(w)
    expect(w.find('[data-testid="save-error"]').exists()).toBe(false)
  })

  it('sends no home address when the location was cleared', async () => {
    const w = await mountProfile()
    await w.find('button[aria-label="Clear saved address"]').trigger('click')
    await save(w)

    expect(user.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      home_address: null, home_latitude: null, home_longitude: null,
    }))
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: email', () => {
  it('marks a verified address as verified', async () => {
    const w = await mountProfile()
    expect(w.find('[data-testid="email-verified"]').exists()).toBe(true)
    expect(w.find('[data-testid="email-unverified"]').exists()).toBe(false)
  })

  it('offers to send a verification email for an unverified address', async () => {
    user.getProfile.mockResolvedValue({ ...PROFILE, email_verified: false })
    const w = await mountProfile()

    expect(w.find('[data-testid="email-unverified"]').text()).toContain('Not verified')
    await w.find('[data-testid="resend-verification"]').trigger('click')
    await flushPromises()

    expect(user.sendEmailVerification).toHaveBeenCalledTimes(1)
    expect(w.find('[data-testid="email-notice"]').text()).toContain('ama@example.com')
    // the button explains itself while it is waiting
    expect(w.find('[data-testid="resend-verification"]').text()).toMatch(/Resend in \d+s/)
    expect(w.find('[data-testid="resend-verification"]').attributes('disabled')).toBeDefined()
  })

  it('asks for the current password only when the email is being changed', async () => {
    const w = await mountProfile()
    expect(w.find('[data-testid="current-password-field"]').exists()).toBe(false)

    await w.find('#email').setValue('new@example.com')
    expect(w.find('[data-testid="current-password-field"]').exists()).toBe(true)
    expect(w.find('label[for="current-password"]').exists()).toBe(true)
  })

  it('does not save a changed email without the password, and says why at the field', async () => {
    const w = await mountProfile()
    await w.find('#email').setValue('new@example.com')
    await save(w)

    expect(user.updateProfile).not.toHaveBeenCalled()
    expect(w.find('[data-testid="current-password-field"] [role="alert"]').text()).toMatch(/current password/i)
    expect(w.find('#current-password').attributes('aria-invalid')).toBe('true')
  })

  it('saves a changed email together with the current password, and says a link was sent', async () => {
    user.updateProfile.mockResolvedValue({ ...PROFILE, email: 'new@example.com', email_verified: false })
    const w = await mountProfile()
    await w.find('#email').setValue('new@example.com')
    await w.find('#current-password').setValue('my-password')
    await save(w)

    expect(user.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@example.com', current_password: 'my-password',
    }))
    expect(w.find('[data-testid="email-notice"]').text()).toContain('new@example.com')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: home address search', () => {
  const type = async (w: W, text: string) => {
    await w.find('#profile-address-search').setValue(text)
    vi.advanceTimersByTime(300)
    await flushPromises()
  }
  const SUGGESTIONS = [
    { display_name: 'Oak Street, Osu, Accra', latitude: '5.55', longitude: '-0.18', type: 'road' },
    { display_name: 'Oak Hotel, Kumasi', latitude: '6.69', longitude: '-1.62' },
  ]

  it('searches after a short pause, and not for fewer than 3 characters', async () => {
    const w = await mountProfile()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    await type(w, 'Oa')
    expect(user.autocompleteLocation).not.toHaveBeenCalled()

    await type(w, 'Oak')
    expect(user.autocompleteLocation).toHaveBeenCalledWith('Oak')
  })

  it('lists suggestions as an accessible listbox', async () => {
    user.autocompleteLocation.mockResolvedValue(SUGGESTIONS)
    const w = await mountProfile()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await type(w, 'Oak')

    const options = w.findAll('[role="option"]')
    expect(options).toHaveLength(2)
    expect(w.find('[role="listbox"]').attributes('aria-label')).toBe('Address suggestions')
    expect(options[0].text()).toContain('Oak Street, Osu, Accra')
    expect(w.find('#profile-address-search').attributes('aria-expanded')).toBe('true')
  })

  it('picks a suggestion with the mouse and saves its coordinates', async () => {
    user.autocompleteLocation.mockResolvedValue(SUGGESTIONS)
    const w = await mountProfile()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await type(w, 'Oak')
    await w.findAll('[role="option"]')[1].trigger('click')
    await save(w)

    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(user.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      home_address: 'Oak Hotel, Kumasi', home_latitude: 6.69, home_longitude: -1.62,
    }))
  })

  it('works from the keyboard: arrows move, Enter picks, Escape closes', async () => {
    user.autocompleteLocation.mockResolvedValue(SUGGESTIONS)
    const w = await mountProfile()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await type(w, 'Oak')
    const field = w.find('#profile-address-search')

    expect(w.findAll('[role="option"]')[0].attributes('aria-selected')).toBe('true')
    await field.trigger('keydown', { key: 'ArrowDown' })
    expect(w.findAll('[role="option"]')[1].attributes('aria-selected')).toBe('true')
    expect(field.attributes('aria-activedescendant')).toBe('profile-address-option-1')

    await field.trigger('keydown', { key: 'Enter' })
    expect(input(w, 'profile-address-search').value).toBe('Oak Hotel, Kumasi')

    await type(w, 'Oak St')
    await field.trigger('keydown', { key: 'Escape' })
    expect(w.find('[role="listbox"]').exists()).toBe(false)
  })

  it('does not search again for the address it has just filled in', async () => {
    user.autocompleteLocation.mockResolvedValue(SUGGESTIONS)
    const w = await mountProfile()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await type(w, 'Oak')
    await w.findAll('[role="option"]')[0].trigger('click')
    user.autocompleteLocation.mockClear()
    vi.advanceTimersByTime(1000)
    await flushPromises()

    expect(user.autocompleteLocation).not.toHaveBeenCalled()
  })

  it('quietly shows no suggestions when the search service fails', async () => {
    user.autocompleteLocation.mockRejectedValue(new Error('down'))
    const w = await mountProfile()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await type(w, 'Oak')

    expect(w.find('[role="listbox"]').exists()).toBe(false)
  })

  it('has a Clear button with a name, which empties the address and the search box', async () => {
    const w = await mountProfile()
    const clear = w.find('button[aria-label="Clear saved address"]')
    expect(clear.exists()).toBe(true)

    await clear.trigger('click')
    expect(input(w, 'profile-address-search').value).toBe('')
    expect(w.text()).toContain('Location Needed')
    expect(w.find('button[aria-label="Clear saved address"]').exists()).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: setting the home location from GPS', () => {
  it('fills the address from the phone\'s position', async () => {
    stubGeolocation(ok => ok({ coords: { latitude: 5.56, longitude: -0.17 } }))
    const w = await mountProfile()
    await button(w, 'Update GPS').trigger('click')
    await flushPromises()

    expect(user.reverseGeocodeHomeLocation).toHaveBeenCalledWith(5.56, -0.17)
    expect(input(w, 'profile-address-search').value).toBe('Osu, Accra')
    expect(w.text()).toContain('Osu, Accra')
  })

  it('says "Set from GPS" when there are no coordinates yet', async () => {
    user.getProfile.mockResolvedValue({ ...PROFILE, home_address: '', home_latitude: null, home_longitude: null })
    const w = await mountProfile()
    expect(hasButton(w, 'Set from GPS')).toBe(true)
  })

  it('says "Finding GPS..." and disables the button while it looks', async () => {
    stubGeolocation(() => { /* never answers */ })
    const w = await mountProfile()
    await button(w, 'Update GPS').trigger('click')

    const btn = button(w, 'Finding GPS...')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('explains a denied permission and how to fix it', async () => {
    stubGeolocation((_ok, fail) => fail({ code: 1, PERMISSION_DENIED: 1 }))
    const w = await mountProfile()
    await button(w, 'Update GPS').trigger('click')
    await flushPromises()

    expect(w.find('[data-testid="save-error"]').text()).toMatch(/permission was denied.*try again/i)
  })

  it('explains other GPS failures', async () => {
    stubGeolocation((_ok, fail) => fail({ code: 2, PERMISSION_DENIED: 1 }))
    const w = await mountProfile()
    await button(w, 'Update GPS').trigger('click')
    await flushPromises()

    expect(w.find('[data-testid="save-error"]').text()).toMatch(/could not get your location/i)
  })

  it('says so when the browser has no location support', async () => {
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true })
    const w = await mountProfile()
    await button(w, 'Update GPS').trigger('click')

    expect(w.find('[data-testid="save-error"]').text()).toContain('Location is not available')
  })

  it('shows why the address could not be worked out', async () => {
    stubGeolocation(ok => ok({ coords: { latitude: 1, longitude: 2 } }))
    user.reverseGeocodeHomeLocation.mockRejectedValue(new Error('No address found here'))
    const w = await mountProfile()
    await button(w, 'Update GPS').trigger('click')
    await flushPromises()

    expect(w.find('[data-testid="save-error"]').text()).toContain('No address found here')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: health professional verification', () => {
  const fillAndSubmit = async (w: W) => {
    await w.find('#prof-type').setValue('doctor')
    await w.find('#prof-license').setValue(' MDC-2024-1 ')
    await w.findAll('form')[1].trigger('submit')
    await flushPromises()
  }

  it('offers the application form to someone who has not applied', async () => {
    const w = await mountProfile()
    expect(hasButton(w, 'Apply for Professional Status')).toBe(true)
  })

  it('labels each application field so assistive technology can name it', async () => {
    const w = await mountProfile()
    for (const id of ['prof-type', 'prof-license', 'prof-body']) {
      expect(w.find(`label[for="${id}"]`).exists(), `label for #${id}`).toBe(true)
      expect(w.find(`#${id}`).exists(), `#${id}`).toBe(true)
    }
  })

  it('asks for the licence number by its right name for pharmacists', async () => {
    const w = await mountProfile()
    await w.find('#prof-type').setValue('pharmacist')

    expect(w.find('label[for="prof-license"]').text()).toContain('PSGH ID')
    expect(w.text()).toContain('verify you instantly by SMS')
  })

  it('will not submit without a profession and licence number, and says so', async () => {
    const w = await mountProfile()
    await w.findAll('form')[1].trigger('submit')

    expect(authService.applyForProfessional).not.toHaveBeenCalled()
    expect(w.text()).toContain('Profession type and license number are required.')
  })

  it('submits the trimmed application, then shows it as under review', async () => {
    authService.applyForProfessional.mockResolvedValue({})
    authService.getMyProfessionalApplication
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { status: 'pending', profession_type: 'doctor', license_number: 'MDC-2024-1' } })
    const w = await mountProfile()
    await fillAndSubmit(w)

    expect(authService.applyForProfessional).toHaveBeenCalledWith({
      profession_type: 'doctor', license_number: 'MDC-2024-1', license_body: null,
    })
    expect(w.text()).toContain('Under review')
    expect(w.text()).toContain('under review')
  })

  it('shows why a submission failed', async () => {
    authService.applyForProfessional.mockRejectedValue(new Error('That licence is already registered'))
    const w = await mountProfile()
    await fillAndSubmit(w)

    expect(w.find('[data-testid="prof-error"]').attributes('role')).toBe('alert')
    expect(w.find('[data-testid="prof-error"]').text()).toContain('already registered')
  })

  it('shows an approved professional their status and hides the form', async () => {
    authService.getMyProfessionalApplication.mockResolvedValue({ data: { status: 'approved', profession_type: 'pharmacist', license_number: '4775' } })
    const w = await mountProfile()

    expect(w.text()).toContain('Verified')
    expect(w.text()).toContain('4775')
    expect(w.text()).toContain('Your professional status is active')
    expect(hasButton(w, 'Apply for Professional Status')).toBe(false)
  })

  it('tells a rejected applicant the reason, and lets them re-submit', async () => {
    authService.getMyProfessionalApplication.mockResolvedValue({ data: { status: 'rejected', rejection_reason: 'Licence number unreadable', profession_type: 'nurse', license_number: 'N-1' } })
    const w = await mountProfile()

    expect(w.text()).toContain('Not approved')
    expect(w.text()).toContain('Licence number unreadable')
    expect(hasButton(w, 'Re-submit Application')).toBe(true)
    expect(input(w, 'prof-license').value).toBe('N-1')
  })

  it('shows a loading state while it checks the application', async () => {
    let finish!: (v: unknown) => void
    authService.getMyProfessionalApplication.mockReturnValue(new Promise((res) => { finish = res }))
    const w = await mountProfile()

    expect(w.find('[data-testid="prof-loading"]').text()).toMatch(/checking/i)
    finish({ data: null })
    await flushPromises()
    expect(w.find('[data-testid="prof-loading"]').exists()).toBe(false)
  })

  describe('instant verification by SMS', () => {
    const PENDING = { data: { status: 'pending', profession_type: 'pharmacist', license_number: '4775', verification: { available: true } } }

    it('is offered only when the register matched', async () => {
      authService.getMyProfessionalApplication.mockResolvedValue({ data: { ...PENDING.data, verification: { available: false } } })
      const w = await mountProfile()
      expect(hasButton(w, 'Send verification code')).toBe(false)
    })

    it('sends a code, then confirms it, and says the outcome', async () => {
      authService.getMyProfessionalApplication.mockResolvedValue(PENDING)
      authService.sendProfessionalVerificationOtp.mockResolvedValue({ data: { challenge_id: 'c1', phone_hint: '•••• 1234' } })
      authService.confirmProfessionalVerificationOtp.mockResolvedValue({ data: { auto_approved: false, message: 'Code accepted. A reviewer will finish up.' } })
      const w = await mountProfile()

      await button(w, 'Send verification code').trigger('click')
      await flushPromises()
      expect(w.text()).toContain('Code sent to •••• 1234')

      const code = w.find('input[aria-label="6-digit verification code"]')
      expect(code.exists()).toBe(true)
      expect(button(w, 'Confirm').attributes('disabled')).toBeDefined()

      await code.setValue('12345')
      expect(button(w, 'Confirm').attributes('disabled')).toBeDefined()
      await code.setValue('123456')
      await button(w, 'Confirm').trigger('click')
      await flushPromises()

      expect(authService.confirmProfessionalVerificationOtp).toHaveBeenCalledWith({ challengeId: 'c1', code: '123456' })
      expect(w.text()).toContain('A reviewer will finish up')
    })

    it('reloads the application when the code auto-approves it', async () => {
      authService.getMyProfessionalApplication
        .mockResolvedValueOnce(PENDING)
        .mockResolvedValue({ data: { status: 'approved', profession_type: 'pharmacist', license_number: '4775' } })
      authService.sendProfessionalVerificationOtp.mockResolvedValue({ data: { challenge_id: 'c1', phone_hint: null } })
      authService.confirmProfessionalVerificationOtp.mockResolvedValue({ data: { auto_approved: true, message: 'You are verified.' } })
      const w = await mountProfile()

      await button(w, 'Send verification code').trigger('click')
      await flushPromises()
      await w.find('input[aria-label="6-digit verification code"]').setValue('123456')
      await button(w, 'Confirm').trigger('click')
      await flushPromises()

      expect(w.text()).toContain('Your professional status is active')
    })

    it('shows a failed send or a wrong code as an alert', async () => {
      authService.getMyProfessionalApplication.mockResolvedValue(PENDING)
      authService.sendProfessionalVerificationOtp.mockRejectedValue(new Error('SMS is unavailable right now'))
      const w = await mountProfile()
      await button(w, 'Send verification code').trigger('click')
      await flushPromises()

      expect(w.find('[data-testid="otp-error"]').attributes('role')).toBe('alert')
      expect(w.find('[data-testid="otp-error"]').text()).toContain('SMS is unavailable')
    })
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Profile: profession picker', () => {
  it('looks like the other fields: own arrow, same fill, readable options', async () => {
    const w = await mountProfile()
    const select = w.find('#prof-type')
    const classes = select.classes()

    expect(classes).toContain('appearance-none')
    expect(classes).toContain('bg-ink-100')
    expect(classes).not.toContain('bg-white')
    expect(select.element.parentElement?.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    for (const option of select.findAll('option')) {
      expect(option.classes()).toContain('text-ink-900')
    }
  })
})
