import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import phoneUtils from '~/utils/phone'

// ── Boundaries: the user/pharmacy stores and the customer-auth HTTP service ──
const user = vi.hoisted(() => ({
  checkPhoneStatus: vi.fn(),
  login: vi.fn(),
  sendSetupOTP: vi.fn(),
  setupPassword: vi.fn(),
  register: vi.fn(),
  sendResetOTP: vi.fn(),
  resetPassword: vi.fn(),
  loginWithEmail: vi.fn(),
  requestEmailReset: vi.fn(),
  sendSignupEmailCode: vi.fn(),
  registerWithEmail: vi.fn(),
}))
const pharmacy = vi.hoisted(() => ({ pharmacyData: null as null | { name?: string }, currentPharmacy: null as unknown }))
const authService = vi.hoisted(() => ({ sendSetupOtp: vi.fn() }))
vi.mock('~/stores/user', () => ({ useUserStore: () => user }))
vi.mock('~/stores/pharmacy', () => ({ usePharmacyStore: () => pharmacy }))
vi.mock('~/services/customerAuth/customerAuthService', () => ({ createCustomerAuthService: () => authService }))

vi.stubGlobal('useApi', () => ({}))

import Login from '~/components/Login.vue'

const PHONE = '0244123456'
const E164 = '+233244123456'
const DISPLAY = phoneUtils.formatForDisplay(E164)
const PASSWORD = 'secret-pass'

class ApiError extends Error {
  status: number
  body?: Record<string, unknown>
  constructor(message: string, status: number, body?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.body = body
  }
}

let wrapper: ReturnType<typeof mount> | undefined
const mountLogin = async (props: Record<string, unknown> = { inline: true }) => {
  wrapper = mount(Login, { props, attachTo: document.body })
  await flushPromises()
  return wrapper
}
type W = ReturnType<typeof mount>

const typeId = async (w: W, text: string) => { await w.find('#identifier').setValue(text) }
const button = (w: W, text: string) => {
  const b = w.findAll('button').find(x => x.text().trim() === text)
  if (!b) throw new Error(`no button "${text}" in: ${w.findAll('button').map(x => x.text().trim()).join(' | ')}`)
  return b
}
const alertText = (w: W) => w.find('.bg-red-50[role="alert"]').text()
const hasAlert = (w: W) => w.find('.bg-red-50[role="alert"]').exists()
const submitBtn = (w: W) => w.find('form button[type="submit"]')
const submit = async (w: W) => { await w.find('form').trigger('submit'); await flushPromises() }
const fillOtp = async (w: W, code = '123456') => {
  const boxes = w.findAll('input[inputmode="numeric"]')
  for (let i = 0; i < code.length; i++) {
    await boxes[i].setValue(code[i])
    await boxes[i].trigger('input')
  }
  await flushPromises()
}
const signInWithPhone = async (w: W, phone = PHONE, password = PASSWORD) => {
  await typeId(w, phone)
  await w.find('#password').setValue(password)
  await submit(w)
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  pharmacy.pharmacyData = null
  pharmacy.currentPharmacy = null
  user.checkPhoneStatus.mockResolvedValue({ status: 'registered' })
  for (const fn of Object.values(user)) if (fn !== user.checkPhoneStatus) (fn as ReturnType<typeof vi.fn>).mockResolvedValue({})
  authService.sendSetupOtp.mockResolvedValue({ success: true })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  vi.restoreAllMocks()
})

// ───────────────────────────────────────────────────────────────────────────
describe('Login: presentation', () => {
  it('renders nothing when closed and not inline', async () => {
    const w = await mountLogin({ isOpen: false })
    expect(w.find('form').exists()).toBe(false)
  })

  it('as a modal it is a labelled dialog with a Close button and backdrop', async () => {
    const w = await mountLogin({ isOpen: true })
    const dialog = w.find('[role="dialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(w.find(`#${dialog.attributes('aria-labelledby')}`).text()).toBe('Sign in to MedsGh')
    expect(w.find('button[aria-label="Close"]').exists()).toBe(true)
  })

  it('inline it is a plain card: no dialog role and no Close button', async () => {
    const w = await mountLogin({ inline: true })
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(w.find('button[aria-label="Close"]').exists()).toBe(false)
  })

  it('opens on the sign-up view when asked to', async () => {
    const w = await mountLogin({ inline: true, initialView: 'signup' })
    expect(w.find('h3').text()).toBe('Create your account')
    expect(w.text()).toContain('Step 1 of 2')
  })

  it('opens on sign-in by default', async () => {
    const w = await mountLogin()
    expect(w.find('h3').text()).toBe('Sign in to MedsGh')
    expect(submitBtn(w).text()).toBe('Sign in')
  })

  it('shows and hides the password', async () => {
    const w = await mountLogin()
    expect(w.find('#password').attributes('type')).toBe('password')

    await w.find('button[aria-label="Show password"]').trigger('click')
    expect(w.find('#password').attributes('type')).toBe('text')

    await w.find('button[aria-label="Hide password"]').trigger('click')
    expect(w.find('#password').attributes('type')).toBe('password')
  })
})

describe('Login: closing the modal', () => {
  it('closes from the X, the backdrop and Escape', async () => {
    const w = await mountLogin({ isOpen: true })

    await w.find('button[aria-label="Close"]').trigger('click')
    await w.find('.backdrop-blur-sm').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()

    expect(w.emitted('close')).toHaveLength(3)
  })

  it('wipes what was typed shortly after closing, so the next visitor starts clean', async () => {
    vi.useFakeTimers()
    const w = await mountLogin({ isOpen: true })
    await typeId(w, PHONE)
    await w.find('#password').setValue(PASSWORD)

    await w.find('button[aria-label="Close"]').trigger('click')
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect((w.find('#identifier').element as HTMLInputElement).value).toBe('')
    expect((w.find('#password').element as HTMLInputElement).value).toBe('')
  })

  it('locks page scrolling while open and releases it on close', async () => {
    const w = await mountLogin({ isOpen: true })
    expect(document.body.style.overflow).toBe('hidden')

    await w.setProps({ isOpen: false })
    expect(document.body.style.overflow).toBe('')
  })
})

describe('Login: remembering the phone', () => {
  it('pre-fills the last phone number used', async () => {
    localStorage.setItem('lastPhoneNumber', PHONE)
    const w = await mountLogin()
    expect((w.find('#identifier').element as HTMLInputElement).value).toBe(PHONE)
  })

  it('pre-fills when a modal is opened later', async () => {
    const w = await mountLogin({ isOpen: false })
    localStorage.setItem('lastPhoneNumber', PHONE)
    await w.setProps({ isOpen: true })
    await flushPromises()

    expect((w.find('#identifier').element as HTMLInputElement).value).toBe(PHONE)
  })

  it('never overwrites something the customer already typed', async () => {
    const w = await mountLogin({ isOpen: false })
    await w.setProps({ isOpen: true })
    await typeId(w, '0200000000')
    localStorage.setItem('lastPhoneNumber', PHONE)
    await w.setProps({ isOpen: false })
    await w.setProps({ isOpen: true })

    expect((w.find('#identifier').element as HTMLInputElement).value).toBe('0200000000')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Login: the one box for phone or email', () => {
  it('keeps Sign in disabled until there is a phone and a password of 6+ characters', async () => {
    const w = await mountLogin()
    expect(submitBtn(w).attributes('disabled')).toBeDefined()

    await typeId(w, PHONE)
    await w.find('#password').setValue('12345')
    expect(submitBtn(w).attributes('disabled')).toBeDefined()

    await w.find('#password').setValue('123456')
    expect(submitBtn(w).attributes('disabled')).toBeUndefined()
  })

  it('explains why Sign in is disabled, and the explanation follows the missing field', async () => {
    const w = await mountLogin()
    const why = () => w.find('#signin-why')

    expect(why().text()).toMatch(/phone number or email/i)
    expect(submitBtn(w).attributes('aria-describedby')).toBe('signin-why')

    await typeId(w, PHONE)
    expect(why().text()).toMatch(/password/i)

    await w.find('#password').setValue('12345')
    expect(why().text()).toMatch(/at least 6/i)

    await w.find('#password').setValue('123456')
    expect(why().exists()).toBe(false)
    expect(submitBtn(w).attributes('aria-describedby')).toBeUndefined()
  })

  it('for an email, only needs a password (any length) to enable Sign in', async () => {
    const w = await mountLogin()
    await typeId(w, 'ama@example.com')
    await w.find('#password').setValue('x')
    expect(submitBtn(w).attributes('disabled')).toBeUndefined()
  })

  it('flags an unfinished-looking invalid Ghana number only once it is long enough', async () => {
    const w = await mountLogin()
    await typeId(w, '02441')
    expect(w.find('p[role="alert"]').exists()).toBe(false)

    await typeId(w, '0244123')
    expect(w.find('p[role="alert"]').exists()).toBe(false)

    await typeId(w, '024412345678')
    expect(w.find('p[role="alert"]').text()).toContain('Please enter a valid phone number.')
    expect(w.find('#identifier').attributes('aria-invalid')).toBe('true')
  })

  it('clears the error when the number becomes valid', async () => {
    const w = await mountLogin()
    await typeId(w, '024412345678')
    await typeId(w, PHONE)

    expect(w.find('p[role="alert"]').exists()).toBe(false)
    expect(w.find('#identifier').attributes('aria-invalid')).toBe('false')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Login: signing in with a phone', () => {
  it('checks the account, signs in with the E.164 number, and tells the parent', async () => {
    const w = await mountLogin()
    await signInWithPhone(w)

    expect(user.checkPhoneStatus).toHaveBeenCalledWith(E164)
    expect(user.login).toHaveBeenCalledWith(E164, PASSWORD)
    expect(w.emitted('login-success')).toEqual([[{ destination: 'new', action: 'login' }]])
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('accepts a number typed with spaces and the +233 prefix', async () => {
    const w = await mountLogin()
    await signInWithPhone(w, '+233 24 412 3456')

    expect(user.login).toHaveBeenCalledWith(E164, PASSWORD)
  })

  it('says the password is wrong, naming the number, without leaving the form', async () => {
    user.login.mockRejectedValue(new Error('401'))
    const w = await mountLogin()
    await signInWithPhone(w)

    expect(alertText(w)).toBe(`Wrong password for ${DISPLAY}. Try again or reset.`)
    expect(w.emitted('login-success')).toBeUndefined()
    expect(w.emitted('close')).toBeUndefined()
    expect(submitBtn(w).attributes('disabled')).toBeUndefined()
  })

  it('explains that no account exists for a new number and does not sign in or text anything', async () => {
    user.checkPhoneStatus.mockResolvedValue({ status: 'new_customer' })
    const w = await mountLogin()
    await signInWithPhone(w)

    expect(alertText(w)).toContain(`No account found for ${DISPLAY}`)
    expect(user.login).not.toHaveBeenCalled()
    expect(user.sendSetupOTP).not.toHaveBeenCalled()
  })

  it('shows a clear message for an unknown account status', async () => {
    user.checkPhoneStatus.mockResolvedValue({ status: 'weird' })
    const w = await mountLogin()
    await signInWithPhone(w)

    expect(alertText(w)).toBe('Unknown account status.')
    expect(user.login).not.toHaveBeenCalled()
  })

  it('shows the error when the status check itself fails', async () => {
    user.checkPhoneStatus.mockRejectedValue(new Error('Network down'))
    const w = await mountLogin()
    await signInWithPhone(w)

    expect(alertText(w)).toBe('Network down')
  })

  it('does nothing for an invalid number', async () => {
    const w = await mountLogin()
    await signInWithPhone(w, '024412345678')

    expect(user.checkPhoneStatus).not.toHaveBeenCalled()
  })

  it('shows progress and blocks a second submit while signing in', async () => {
    let finish!: (v: unknown) => void
    user.checkPhoneStatus.mockReturnValue(new Promise((res) => { finish = res }))
    const w = await mountLogin()
    await typeId(w, PHONE)
    await w.find('#password').setValue(PASSWORD)
    await w.find('form').trigger('submit')

    expect(submitBtn(w).text()).toContain('Signing in...')
    expect(submitBtn(w).attributes('disabled')).toBeDefined()

    finish({ status: 'new_customer' })
    await flushPromises()
    expect(submitBtn(w).text()).toBe('Sign in')
  })

  it('clears an old error when the customer tries again', async () => {
    user.login.mockRejectedValueOnce(new Error('401'))
    const w = await mountLogin()
    await signInWithPhone(w)
    expect(hasAlert(w)).toBe(true)

    await submit(w)
    expect(hasAlert(w)).toBe(false)
    expect(w.emitted('login-success')).toHaveLength(1)
  })
})

describe('Login: existing customer who never set a password', () => {
  const reachVerify = async () => {
    user.checkPhoneStatus.mockResolvedValue({ status: 'existing_customer_no_password' })
    const w = await mountLogin()
    await signInWithPhone(w)
    return w
  }

  it('texts a code and asks for it, without signing in', async () => {
    const w = await reachVerify()

    expect(user.sendSetupOTP).toHaveBeenCalledWith(E164)
    expect(user.login).not.toHaveBeenCalled()
    expect(w.text()).toContain('Quick verification')
    expect(w.text()).toContain(DISPLAY)
    expect(w.findAll('input[inputmode="numeric"]')).toHaveLength(6)
    expect(submitBtn(w).text()).toBe('Activate account')
  })

  it('needs all 6 digits before Activate is enabled', async () => {
    const w = await reachVerify()
    expect(submitBtn(w).attributes('disabled')).toBeDefined()

    await fillOtp(w, '12345')
    expect(submitBtn(w).attributes('disabled')).toBeDefined()

    await fillOtp(w, '123456')
    expect(submitBtn(w).attributes('disabled')).toBeUndefined()
  })

  it('activates with the code and the password already typed, then signs the customer in', async () => {
    const w = await reachVerify()
    await fillOtp(w, '482915')
    await submit(w)

    expect(user.setupPassword).toHaveBeenCalledWith(E164, '482915', PASSWORD)
    expect(w.emitted('login-success')).toEqual([[{ destination: 'new', action: 'setup' }]])
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('shows why activation failed and stays put', async () => {
    user.setupPassword.mockRejectedValue(new Error('Invalid code'))
    const w = await reachVerify()
    await fillOtp(w)
    await submit(w)

    expect(alertText(w)).toBe('Invalid code')
    expect(w.emitted('login-success')).toBeUndefined()
  })

  it('resends the code on request', async () => {
    const w = await reachVerify()
    user.sendSetupOTP.mockClear()
    await button(w, 'Resend code').trigger('click')
    await flushPromises()

    expect(user.sendSetupOTP).toHaveBeenCalledWith(E164)
  })

  it('reports a failed resend', async () => {
    const w = await reachVerify()
    user.sendSetupOTP.mockRejectedValue(new Error('SMS down'))
    await button(w, 'Resend code').trigger('click')
    await flushPromises()

    expect(alertText(w)).toBe('SMS down')
  })

  it('snaps back to plain sign-in if the customer edits the number', async () => {
    const w = await reachVerify()
    await fillOtp(w)
    await w.find('#identifier').trigger('input')

    expect(w.text()).not.toContain('Quick verification')
    expect(submitBtn(w).text()).toBe('Sign in')
  })
})

describe('Login: the six code boxes', () => {
  const openBoxes = async () => {
    user.checkPhoneStatus.mockResolvedValue({ status: 'existing_customer_no_password' })
    const w = await mountLogin()
    await signInWithPhone(w)
    return w
  }
  const boxes = (w: W) => w.findAll('input[inputmode="numeric"]')
  const values = (w: W) => boxes(w).map(b => (b.element as HTMLInputElement).value).join('')

  it('keeps only the last digit typed in a box and ignores letters', async () => {
    const w = await openBoxes()
    await boxes(w)[0].setValue('a')
    await boxes(w)[0].trigger('input')
    expect(values(w)).toBe('')

    await boxes(w)[0].setValue('79')
    await boxes(w)[0].trigger('input')
    expect(values(w)).toBe('9')
  })

  it('spreads a pasted code across the boxes, ignoring non-digits and extras', async () => {
    const w = await openBoxes()
    const event = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown }
    event.clipboardData = { getData: () => ' 12-34 56 789' }
    boxes(w)[0].element.dispatchEvent(event)
    await flushPromises()

    expect(values(w)).toBe('123456')
    expect(submitBtn(w).attributes('disabled')).toBeUndefined()
  })

  it('Backspace clears the box, or steps back and clears the previous one when already empty', async () => {
    const w = await openBoxes()
    await fillOtp(w, '123456')

    await boxes(w)[5].trigger('keydown', { key: 'Backspace' })
    expect(values(w)).toBe('12345')

    await boxes(w)[5].trigger('keydown', { key: 'Backspace' })
    expect(values(w)).toBe('1234')
  })

  it('arrow keys move focus between boxes', async () => {
    const w = await openBoxes()
    boxes(w)[2].element.focus()
    await boxes(w)[2].trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(boxes(w)[1].element)

    await boxes(w)[1].trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(boxes(w)[2].element)
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Login: signing in with an email', () => {
  it('signs in with the typed email and password', async () => {
    const w = await mountLogin()
    await typeId(w, '  ama@example.com ')
    await w.find('#password').setValue(PASSWORD)
    await submit(w)

    expect(user.loginWithEmail).toHaveBeenCalledWith('ama@example.com', PASSWORD)
    expect(user.checkPhoneStatus).not.toHaveBeenCalled()
    expect(w.emitted('login-success')).toEqual([[{ destination: 'new', action: 'login' }]])
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('refuses a refused sign-in with one uniform message', async () => {
    user.loginWithEmail.mockRejectedValue(new ApiError('nope', 401))
    const w = await mountLogin()
    await typeId(w, 'ama@example.com')
    await w.find('#password').setValue(PASSWORD)
    await submit(w)

    expect(alertText(w)).toContain('Incorrect email or password.')
    expect(w.emitted('login-success')).toBeUndefined()
  })

  it('asks for a valid address instead of calling the server', async () => {
    const w = await mountLogin()
    await typeId(w, 'ama@')
    await w.find('#password').setValue(PASSWORD)
    await submit(w)

    expect(user.loginWithEmail).not.toHaveBeenCalled()
    expect(w.find('p[role="alert"]').text()).toContain('Enter a valid email address')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Login: forgotten password', () => {
  const reset = async (w: W) => { await button(w, 'Forgot password?').trigger('click') }

  it('switches to the reset screen and back', async () => {
    const w = await mountLogin()
    await reset(w)
    expect(w.find('h3').text()).toBe('Reset your password')

    await button(w, 'Back to sign in').trigger('click')
    expect(w.find('h3').text()).toBe('Sign in to MedsGh')
  })

  it('for a phone: texts a code, then sets the new password with it', async () => {
    const w = await mountLogin()
    await reset(w)
    await typeId(w, PHONE)
    await button(w, 'Send reset code').trigger('click')
    await flushPromises()

    expect(user.sendResetOTP).toHaveBeenCalledWith(E164)
    expect(w.text()).toContain(`Code sent to ${DISPLAY}`)

    await fillOtp(w, '654321')
    await w.find('#resetPassword').setValue('brand-new-pw')
    await submit(w)

    expect(user.resetPassword).toHaveBeenCalledWith(E164, '654321', 'brand-new-pw')
    expect(w.text()).toContain('Password updated')
  })

  it('only enables Reset with a full code and a password of 6+ characters', async () => {
    const w = await mountLogin()
    await reset(w)
    await typeId(w, PHONE)
    await button(w, 'Send reset code').trigger('click')
    await flushPromises()

    const resetBtn = () => w.find('form button[type="submit"]')
    expect(resetBtn().attributes('disabled')).toBeDefined()

    await fillOtp(w, '654321')
    await w.find('#resetPassword').setValue('12345')
    expect(resetBtn().attributes('disabled')).toBeDefined()

    await w.find('#resetPassword').setValue('123456')
    expect(resetBtn().attributes('disabled')).toBeUndefined()
  })

  it('does not offer to text a code to a number outside Ghana, and says to use email', async () => {
    const w = await mountLogin()
    await reset(w)
    await typeId(w, '+14155550123')

    expect(button(w, 'Send reset code').attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Text codes only reach Ghana numbers')
  })

  it('reports a failure to send the code', async () => {
    user.sendResetOTP.mockRejectedValue(new Error('SMS down'))
    const w = await mountLogin()
    await reset(w)
    await typeId(w, PHONE)
    await button(w, 'Send reset code').trigger('click')
    await flushPromises()

    expect(alertText(w)).toBe('SMS down')
    expect(w.text()).not.toContain('Code sent to')
  })

  it('reports a failure to reset and keeps the form so the code can be retyped', async () => {
    user.resetPassword.mockRejectedValue(new Error('Code expired'))
    const w = await mountLogin()
    await reset(w)
    await typeId(w, PHONE)
    await button(w, 'Send reset code').trigger('click')
    await flushPromises()
    await fillOtp(w)
    await w.find('#resetPassword').setValue('brand-new-pw')
    await submit(w)

    expect(alertText(w)).toBe('Code expired')
    expect(w.text()).not.toContain('Password updated')
  })

  it('"Back to sign in" after success returns to a clean sign-in', async () => {
    const w = await mountLogin()
    await reset(w)
    await typeId(w, PHONE)
    await button(w, 'Send reset code').trigger('click')
    await flushPromises()
    await fillOtp(w)
    await w.find('#resetPassword').setValue('brand-new-pw')
    await submit(w)
    await button(w, 'Back to sign in').trigger('click')

    expect(w.find('h3').text()).toBe('Sign in to MedsGh')
    expect((w.find('#password').element as HTMLInputElement).value).toBe('')
  })

  it('for an email: sends a link, says where it went, and never reveals whether the account exists', async () => {
    const w = await mountLogin()
    await reset(w)
    await typeId(w, 'ama@example.com')
    await submit(w)

    expect(user.requestEmailReset).toHaveBeenCalledWith('ama@example.com')
    expect(user.sendResetOTP).not.toHaveBeenCalled()
    const panel = w.find('[data-testid="reset-by-email"]')
    expect(panel.text()).toContain('Check your email')
    expect(panel.text()).toContain('If an account exists for ama@example.com')
  })

  it('for an email: shows the server\'s refusal', async () => {
    user.requestEmailReset.mockRejectedValue(new ApiError('slow down', 429, { retry_after_seconds: 30 }))
    const w = await mountLogin()
    await reset(w)
    await typeId(w, 'ama@example.com')
    await submit(w)

    expect(w.find('[data-testid="reset-by-email"]').text()).toContain('Please wait 30 seconds')
  })

  it('for an email: lets the customer start over with a different address', async () => {
    const w = await mountLogin()
    await reset(w)
    await typeId(w, 'ama@example.com')
    await submit(w)
    await button(w, 'Use a different email').trigger('click')

    const panel = w.find('[data-testid="reset-by-email"]')
    expect(panel.text()).not.toContain('Check your email')
    // The server's per-address cooldown still applies to the form that comes back.
    expect(panel.find('button[type="submit"]').text()).toBe('Try again in 60s')
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('Login: creating an account', () => {
  const toSignup = async (w: W) => { await button(w, 'Create an account').trigger('click') }
  const goStep2Phone = async (w: W) => {
    await typeId(w, PHONE)
    await submit(w)
  }

  it('switches to sign-up carrying what was typed, and back again', async () => {
    const w = await mountLogin()
    await typeId(w, PHONE)
    await toSignup(w)

    expect(w.find('h3').text()).toBe('Create your account')
    expect((w.find('#identifier').element as HTMLInputElement).value).toBe(PHONE)

    await button(w, 'Sign in').trigger('click')
    expect(w.find('h3').text()).toBe('Sign in to MedsGh')
    expect((w.find('#identifier').element as HTMLInputElement).value).toBe(PHONE)
  })

  it('explains what will happen for a phone and for an email', async () => {
    const w = await mountLogin({ inline: true, initialView: 'signup' })
    await typeId(w, PHONE)
    expect(w.find('#identifierHint').text()).toContain(`text a 6-digit code to ${PHONE}`)
    expect(w.text()).toContain('order updates by text')

    await typeId(w, 'ama@example.com')
    expect(w.find('#identifierHint').text()).toContain('email a 6-digit code to ama@example.com')
    expect(w.text()).toContain('order updates by email')
  })

  it('cannot continue without a usable contact', async () => {
    const w = await mountLogin({ inline: true, initialView: 'signup' })
    expect(submitBtn(w).attributes('disabled')).toBeDefined()

    await typeId(w, '+14155550123')
    expect(submitBtn(w).attributes('disabled')).toBeDefined()
    expect(w.find('#identifierHint').text()).toContain('Type your email address instead')

    await typeId(w, PHONE)
    expect(submitBtn(w).attributes('disabled')).toBeUndefined()
  })

  describe('with a phone number', () => {
    it('texts a code and moves to step 2, naming the number', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)

      expect(authService.sendSetupOtp).toHaveBeenCalledWith({ phone: E164 })
      expect(w.text()).toContain('Step 2 of 2')
      expect(w.text()).toContain(`Code sent to ${DISPLAY}`)
    })

    it('shows the server\'s reason and stays on step 1 when the code cannot be sent', async () => {
      authService.sendSetupOtp.mockResolvedValue({ success: false, message: 'Number blocked' })
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)

      expect(alertText(w)).toBe('Number blocked')
      expect(w.text()).toContain('Step 1 of 2')
    })

    it('"Change" goes back to step 1 and forgets the code', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)
      await fillOtp(w)
      await button(w, 'Change').trigger('click')

      expect(w.text()).toContain('Step 1 of 2')
      expect(w.find('#identifier').exists()).toBe(true)
    })

    const completeStep2 = async (w: W) => {
      await w.find('#su-fname').setValue('Ama')
      await w.find('#su-lname').setValue('Mensah')
      await fillOtp(w, '135790')
      await w.find('#su-password').setValue('abcdef')
    }

    it('needs first name, last name, 6-digit code and a 6+ character password', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)
      const create = () => submitBtn(w)
      expect(create().attributes('disabled')).toBeDefined()

      await w.find('#su-fname').setValue('Ama')
      await w.find('#su-lname').setValue('Mensah')
      await fillOtp(w, '135790')
      await w.find('#su-password').setValue('abcde')
      expect(create().attributes('disabled')).toBeDefined()

      await w.find('#su-password').setValue('abcdef')
      expect(create().attributes('disabled')).toBeUndefined()
    })

    it('registers with the details, the phone in E.164 and no company when none is chosen', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)
      await completeStep2(w)
      await submit(w)

      expect(user.register).toHaveBeenCalledWith({
        company_id: undefined,
        fname: 'Ama',
        lname: 'Mensah',
        phone: E164,
        password: 'abcdef',
        otp: '135790',
      })
      expect(w.emitted('login-success')).toEqual([[{ destination: 'new', action: 'register' }]])
      expect(w.emitted('close')).toHaveLength(1)
    })

    it('registers the customer with the pharmacy they are browsing', async () => {
      pharmacy.currentPharmacy = 42
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)
      await completeStep2(w)
      await submit(w)

      expect(user.register.mock.calls[0][0].company_id).toBe(42)
    })

    it('names that pharmacy in the subtitle', async () => {
      pharmacy.pharmacyData = { name: 'Rigel Pharmacy' }
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)

      expect(w.text()).toContain('join Rigel Pharmacy')
    })

    it('shows why registration failed and keeps what was typed', async () => {
      user.register.mockRejectedValue(new Error('Wrong code'))
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)
      await completeStep2(w)
      await submit(w)

      expect(alertText(w)).toBe('Wrong code')
      expect((w.find('#su-fname').element as HTMLInputElement).value).toBe('Ama')
      expect(w.emitted('login-success')).toBeUndefined()
    })

    it('resends the text code', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Phone(w)
      authService.sendSetupOtp.mockClear()
      await button(w, 'Resend code').trigger('click')
      await flushPromises()

      expect(authService.sendSetupOtp).toHaveBeenCalledWith({ phone: E164 })
    })
  })

  describe('with an email', () => {
    const goStep2Email = async (w: W, address = 'ama@example.com') => {
      await typeId(w, address)
      await submit(w)
    }

    it('emails a code (not a text) and moves to step 2', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Email(w)

      expect(user.sendSignupEmailCode).toHaveBeenCalledWith('ama@example.com')
      expect(authService.sendSetupOtp).not.toHaveBeenCalled()
      expect(w.text()).toContain('Step 2 of 2')
      expect(w.text()).toContain('Code sent to ama@example.com')
      expect(w.text()).toContain('Check your spam folder')
    })

    it('stays on step 1 and shows the reason when the email cannot be sent', async () => {
      user.sendSignupEmailCode.mockRejectedValue(new ApiError('exists', 409, { code: 'ALREADY_REGISTERED' }))
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Email(w)

      expect(alertText(w)).toBe('This email already has an account. Sign in instead.')
      expect(w.text()).toContain('Step 1 of 2')
    })

    it('does not send a second email when the customer presses Change and continues with the same address', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Email(w)
      await button(w, 'Change').trigger('click')
      await submit(w)

      expect(user.sendSignupEmailCode).toHaveBeenCalledTimes(1)
      expect(w.text()).toContain('Step 2 of 2')
    })

    it('registers with the address the code was sent to', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Email(w)
      await w.find('#su-fname').setValue('Ama')
      await w.find('#su-lname').setValue('Mensah')
      await fillOtp(w, '246810')
      await w.find('#su-password').setValue('abcdef')
      await submit(w)

      expect(user.registerWithEmail).toHaveBeenCalledWith({
        company_id: undefined,
        fname: 'Ama',
        lname: 'Mensah',
        email: 'ama@example.com',
        otp: '246810',
        password: 'abcdef',
      })
      expect(user.register).not.toHaveBeenCalled()
      expect(w.emitted('login-success')).toEqual([[{ destination: 'new', action: 'register' }]])
    })

    it('clears the code boxes and says to request a new one after too many wrong guesses', async () => {
      user.registerWithEmail.mockRejectedValue(new ApiError('locked', 429))
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Email(w)
      await w.find('#su-fname').setValue('Ama')
      await w.find('#su-lname').setValue('Mensah')
      await fillOtp(w, '246810')
      await w.find('#su-password').setValue('abcdef')
      await submit(w)

      expect(alertText(w)).toBe('Too many incorrect attempts. Request a new code to continue.')
      const values = w.findAll('input[inputmode="numeric"]').map(b => (b.element as HTMLInputElement).value)
      expect(values.every(v => v === '')).toBe(true)
    })

    it('shows the server\'s words for a wrong code and keeps the code boxes', async () => {
      user.registerWithEmail.mockRejectedValue(new ApiError('bad', 400, { message: 'That code is wrong.' }))
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Email(w)
      await w.find('#su-fname').setValue('Ama')
      await w.find('#su-lname').setValue('Mensah')
      await fillOtp(w, '246810')
      await w.find('#su-password').setValue('abcdef')
      await submit(w)

      expect(alertText(w)).toBe('That code is wrong.')
    })

    it('holds the Resend button during the cooldown and shows the countdown', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await goStep2Email(w)

      const resend = w.findAll('button').find(b => b.text().startsWith('Resend code in'))!
      expect(resend.text()).toBe('Resend code in 60s')
      expect(resend.attributes('disabled')).toBeDefined()
    })

    it('carries a Ghana number into sign-up but blocks a foreign one from receiving a text', async () => {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await typeId(w, '+14155550123')
      await w.find('form').trigger('submit')
      await flushPromises()

      expect(authService.sendSetupOtp).not.toHaveBeenCalled()
      expect(user.sendSignupEmailCode).not.toHaveBeenCalled()
    })
  })
})

describe('Login: pharmacy restored from storage', () => {
  it('uses the pharmacy id saved in the browser when the store has none yet', async () => {
    ;(process as unknown as { client: boolean }).client = true
    localStorage.setItem('currentPharmacyId', '77')
    try {
      const w = await mountLogin({ inline: true, initialView: 'signup' })
      await typeId(w, PHONE)
      await submit(w)
      await w.find('#su-fname').setValue('Ama')
      await w.find('#su-lname').setValue('Mensah')
      await fillOtp(w, '135790')
      await w.find('#su-password').setValue('abcdef')
      await submit(w)

      expect(user.register.mock.calls[0][0].company_id).toBe('77')
    } finally {
      delete (process as unknown as { client?: boolean }).client
    }
  })
})
