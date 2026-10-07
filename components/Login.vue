<template>
  <div
    v-if="inline || isOpen"
    :class="!inline ? 'fixed inset-0 z-50 overflow-y-auto' : ''"
    :role="!inline ? 'dialog' : undefined"
    :aria-modal="!inline ? 'true' : undefined"
    :aria-labelledby="!inline ? 'login-dialog-title' : undefined"
    ref="dialogRef"
    :tabindex="!inline ? -1 : undefined"
  >
    <!-- Backdrop (modal only) -->
    <div
      v-if="!inline"
      class="fixed inset-0 bg-[#1e1a22]/60 backdrop-blur-sm"
      @click="closeModal"
    ></div>

    <div
      style="font-family: 'Manrope', sans-serif;"
      :class="!inline ? 'min-h-full flex items-center justify-center p-4 sm:p-6' : ''"
    >
      <!-- Card -->
      <div
        :class="[
          'w-full max-w-lg overflow-hidden rounded-3xl bg-[#fff7ff]',
          !inline
            ? 'relative z-10 shadow-[0_32px_64px_-8px_rgba(30,26,34,0.22),0_0_0_1px_rgba(82,0,148,0.06)]'
            : 'shadow-[0_20px_48px_-8px_rgba(30,26,34,0.18),0_0_0_1px_rgba(82,0,148,0.08)]'
        ]"
      >
        <!-- Header -->
        <div class="relative px-7 pt-6 pb-5 border-b border-[#ede4f6]">
          <!-- Close button (modal only) -->
          <button
            v-if="!inline"
            type="button"
            @click="closeModal"
            class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f2eaf9] text-[#7d7484] transition hover:bg-[#e5d2f6] hover:text-[#520094] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/50"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div :class="!inline ? 'pr-10' : ''">
            <h3
              :id="!inline ? 'login-dialog-title' : undefined"
              class="text-[1.375rem] font-bold tracking-tight text-[#1e1a22] leading-tight"
            >{{ stepTitle }}</h3>
            <p class="mt-1 text-sm text-[#4c4453] leading-snug">{{ stepSubtitle }}</p>
          </div>

          <!-- Signup step indicator (step 2 only) -->
          <div
            v-if="view === 'signup' && signupOtpSent"
            class="mt-4 flex items-center gap-2"
            aria-label="Step 2 of 2"
          >
            <div class="h-1.5 w-8 rounded-full bg-[#520094]"></div>
            <div class="h-1.5 w-8 rounded-full bg-[#520094]"></div>
            <span class="ml-1 text-[11px] font-semibold text-[#520094] tracking-wide">Step 2 of 2</span>
          </div>
          <div
            v-else-if="view === 'signup' && !signupOtpSent"
            class="mt-4 flex items-center gap-2"
            aria-label="Step 1 of 2"
          >
            <div class="h-1.5 w-8 rounded-full bg-[#520094]"></div>
            <div class="h-1.5 w-8 rounded-full bg-[#e8def8]"></div>
            <span class="ml-1 text-[11px] font-semibold text-[#7d7484] tracking-wide">Step 1 of 2</span>
          </div>
        </div>

        <!-- Body -->
        <div class="bg-white px-7 py-6">

          <!-- Error banner — slim -->
          <div
            v-if="errorMessage"
            class="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            role="alert"
          >
            <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm text-red-700 leading-snug">{{ errorMessage }}</p>
          </div>

          <!-- ══════════════════════════════════════════════════════════════ -->
          <!-- Sign in (unified single screen)                               -->
          <!-- ══════════════════════════════════════════════════════════════ -->
          <div v-if="view === 'login' && currentStep === 'signin'">
            <form @submit.prevent="onSignInSubmit" novalidate>

              <!-- One box for a phone number or an email -->
              <div class="mb-4">
                <label for="identifier" class="mb-1.5 block text-sm font-semibold text-[#1e1a22]">Phone number or email</label>
                <input
                  v-model="identifier"
                  type="text"
                  id="identifier"
                  inputmode="email"
                  autocomplete="username"
                  autocapitalize="none"
                  spellcheck="false"
                  class="w-full rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 text-sm text-[#1e1a22] placeholder-[#a090b0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow disabled:opacity-60"
                  placeholder="024 123 4567 or you@example.com"
                  aria-describedby="identifierHint"
                  :aria-invalid="(identifierError || loginEmailError || signupEmailError) ? 'true' : 'false'"
                  @input="onIdentifierInput"
                >
                <p v-if="identifierError" class="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <svg class="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                  {{ identifierError }}
                </p>
                <p
                  id="identifierHint"
                  v-if="identifierHint"
                  class="mt-1.5 text-xs leading-relaxed"
                  :class="identifierHint.tone === 'note' ? 'rounded-xl border border-[#e4d0f8] bg-[#f5eeff] px-3 py-2 text-[#4c4453]' : 'text-[#7d7484]'"
                  role="status"
                >{{ identifierHint.text }}</p>
              </div>

              <!-- Password field -->
              <div class="mb-3">
                <label for="password" class="mb-1.5 block text-sm font-semibold text-[#1e1a22]">Password</label>
                <div class="relative">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    id="password"
                    class="w-full rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 pr-11 text-sm text-[#1e1a22] placeholder-[#a090b0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow"
                    placeholder="Enter your password"
                    required
                    minlength="6"
                    autocomplete="current-password"
                  >
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-[#7d7484] hover:text-[#520094] hover:bg-[#f2eaf9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/40"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <EyeSlashIcon v-if="showPassword" class="w-4 h-4" aria-hidden="true" />
                    <EyeIcon v-else class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <!-- Remember + forgot -->
              <div class="mb-5 flex items-center justify-between gap-3">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="remember-me"
                    v-model="rememberMe"
                    type="checkbox"
                    class="h-4 w-4 rounded border-[#cec2d5] bg-white text-[#520094] focus:ring-[#520094]"
                  >
                  <span class="text-sm text-[#4c4453]">Keep me signed in</span>
                </label>
                <button
                  type="button"
                  @click="forgotPassword"
                  class="text-sm font-semibold text-[#520094] hover:text-[#6c24b3] focus:outline-none focus-visible:underline"
                >
                  Forgot password?
                </button>
              </div>

              <!-- Reveal: verify (existing customer, no password set) -->
              <Transition
                enter-from-class="opacity-0 -translate-y-3"
                enter-active-class="transition duration-250 ease-out"
                leave-to-class="opacity-0 -translate-y-3"
                leave-active-class="transition duration-150 ease-in"
              >
                <div v-if="mode === 'verify'" class="mb-5 rounded-2xl bg-[#f7eeff] border border-[#e4d0f8] p-4">
                  <p class="text-sm font-semibold text-[#1e1a22]">Quick verification</p>
                  <p class="mt-1 text-xs text-[#4c4453] leading-relaxed">
                    We sent a 6-digit code to <strong class="text-[#1e1a22]">{{ formattedPhoneNumber }}</strong> to confirm it's you.
                  </p>
                  <div class="mt-4">
                    <label class="block text-xs font-semibold text-[#4c4453] mb-2">Verification code</label>
                    <!-- 6-box OTP input -->
                    <div class="flex gap-2" role="group" aria-label="6-digit verification code">
                      <input
                        v-for="(_, idx) in otpDigits"
                        :key="'verify-' + idx"
                        :ref="el => { if (el) otpRefs[idx] = el as HTMLInputElement }"
                        v-model="otpDigits[idx]"
                        type="text"
                        inputmode="numeric"
                        maxlength="1"
                        pattern="[0-9]"
                        :aria-label="`Digit ${idx + 1}`"
                        class="h-11 w-10 flex-1 rounded-xl border border-[#ddd0eb] bg-white text-center text-base font-bold text-[#1e1a22] shadow-[0_1px_3px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#520094] focus:ring-2 focus:ring-[#520094]/20 transition-shadow caret-transparent"
                        @input="handleOtpInput($event, idx)"
                        @keydown="handleOtpKeydown($event, idx)"
                        @paste.prevent="handleOtpPaste($event)"
                        autocomplete="one-time-code"
                      >
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="resendVerifyOTP"
                    :disabled="isLoading"
                    class="mt-3 text-xs font-semibold text-[#520094] hover:text-[#6c24b3] disabled:opacity-50 focus:outline-none focus-visible:underline"
                  >
                    Resend code
                  </button>
                </div>
              </Transition>

              <!-- Reveal: register (new customer — auto-detected path) -->
              <Transition
                enter-from-class="opacity-0 -translate-y-3"
                enter-active-class="transition duration-250 ease-out"
                leave-to-class="opacity-0 -translate-y-3"
                leave-active-class="transition duration-150 ease-in"
              >
                <div v-if="mode === 'register'" class="mb-5 rounded-2xl bg-[#f7eeff] border border-[#e4d0f8] p-4 space-y-4">
                  <div>
                    <p class="text-sm font-semibold text-[#1e1a22]">Almost there</p>
                    <p class="mt-1 text-xs text-[#4c4453] leading-relaxed">
                      A couple more details and we'll create your account for <strong class="text-[#1e1a22]">{{ formattedPhoneNumber }}</strong>.
                    </p>
                    <div
                      v-if="registrationCompany"
                      class="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#ddd0eb] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#520094]"
                    >
                      <svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
                      {{ registrationCompany }}
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label for="fname" class="block text-xs font-semibold text-[#4c4453] mb-1.5">First name</label>
                      <input v-model="firstName" type="text" id="fname"
                        class="w-full rounded-xl border border-[#ddd0eb] bg-white px-3 py-2.5 text-sm text-[#1e1a22] placeholder-[#a090b0] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow"
                        placeholder="John" required autocomplete="given-name">
                    </div>
                    <div>
                      <label for="lname" class="block text-xs font-semibold text-[#4c4453] mb-1.5">Last name</label>
                      <input v-model="lastName" type="text" id="lname"
                        class="w-full rounded-xl border border-[#ddd0eb] bg-white px-3 py-2.5 text-sm text-[#1e1a22] placeholder-[#a090b0] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow"
                        placeholder="Doe" required autocomplete="family-name">
                    </div>
                  </div>

                  <div>
                    <label for="email" class="block text-xs font-semibold text-[#4c4453] mb-1.5">Email <span class="font-normal text-[#7d7484]">(optional)</span></label>
                    <input v-model="email" type="email" id="email"
                      class="w-full rounded-xl border border-[#ddd0eb] bg-white px-3 py-2.5 text-sm text-[#1e1a22] placeholder-[#a090b0] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow"
                      placeholder="john@example.com" autocomplete="email">
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-[#4c4453] mb-2">Verification code</label>
                    <div class="flex gap-2" role="group" aria-label="6-digit verification code">
                      <input
                        v-for="(_, idx) in otpDigits"
                        :key="'register-' + idx"
                        :ref="el => { if (el) otpRefs[idx] = el as HTMLInputElement }"
                        v-model="otpDigits[idx]"
                        type="text"
                        inputmode="numeric"
                        maxlength="1"
                        pattern="[0-9]"
                        :aria-label="`Digit ${idx + 1}`"
                        class="h-11 w-10 flex-1 rounded-xl border border-[#ddd0eb] bg-white text-center text-base font-bold text-[#1e1a22] shadow-[0_1px_3px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#520094] focus:ring-2 focus:ring-[#520094]/20 transition-shadow caret-transparent"
                        @input="handleOtpInput($event, idx)"
                        @keydown="handleOtpKeydown($event, idx)"
                        @paste.prevent="handleOtpPaste($event)"
                        autocomplete="one-time-code"
                      >
                    </div>
                    <button
                      type="button"
                      @click="resendRegisterOTP"
                      :disabled="isLoading"
                      class="mt-2 text-xs font-semibold text-[#520094] hover:text-[#6c24b3] disabled:opacity-50 focus:outline-none focus-visible:underline"
                    >
                      Resend code
                    </button>
                  </div>

                  <label class="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      id="ageVerification"
                      v-model="isOver18"
                      type="checkbox"
                      class="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[#cec2d5] bg-white text-[#520094] focus:ring-[#520094]"
                      required
                    >
                    <span class="text-xs text-[#4c4453] leading-relaxed">
                      I confirm I am 18 years or older <span class="text-red-500">*</span>
                    </span>
                  </label>
                </div>
              </Transition>

              <!-- Primary action button -->
              <button
                type="submit"
                :disabled="isLoading || !canSubmit"
                class="w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(82,0,148,0.55)] transition hover:bg-[#6c24b3] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/60 focus-visible:ring-offset-2"
              >
                <span v-if="isLoading" class="flex items-center justify-center gap-2">
                  <!-- Spinner -->
                  <svg class="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ submittingLabel }}
                </span>
                <span v-else>{{ submitLabel }}</span>
              </button>

              <!-- Switch to signup -->
              <p class="mt-5 text-center text-sm text-[#7d7484]">
                New to MedsGh?
                <button
                  type="button"
                  @click="goToSignup"
                  class="font-bold text-[#520094] hover:text-[#6c24b3] focus:outline-none focus-visible:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          </div>

          <!-- ══════════════════════════════════════════════════════════════ -->
          <!-- Reset password                                                -->
          <!-- ══════════════════════════════════════════════════════════════ -->
          <div v-else-if="view === 'login' && currentStep === 'reset'">

            <!-- Inline success panel (replaces alert()) -->
            <Transition
              enter-from-class="opacity-0 scale-95"
              enter-active-class="transition duration-300 ease-out"
            >
              <div v-if="resetSuccess" class="text-center py-4">
                <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200">
                  <svg class="h-7 w-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <h4 class="text-base font-bold text-[#1e1a22]">Password updated</h4>
                <p class="mt-1 text-sm text-[#4c4453]">You can now sign in with your new password.</p>
                <button
                  type="button"
                  @click="goToLogin"
                  class="mt-5 w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(82,0,148,0.55)] transition hover:bg-[#6c24b3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/60 focus-visible:ring-offset-2"
                >
                  Back to sign in
                </button>
              </div>
            </Transition>

            <div v-if="!resetSuccess && !otpSent && !resetEmailSent">
              <!-- One box for a phone number or an email -->
              <div class="mb-4">
                <label for="identifier" class="mb-1.5 block text-sm font-semibold text-[#1e1a22]">Phone number or email</label>
                <input
                  v-model="identifier"
                  type="text"
                  id="identifier"
                  inputmode="email"
                  autocomplete="username"
                  autocapitalize="none"
                  spellcheck="false"
                  class="w-full rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 text-sm text-[#1e1a22] placeholder-[#a090b0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow disabled:opacity-60"
                  placeholder="024 123 4567 or you@example.com"
                  aria-describedby="identifierHint"
                  :aria-invalid="(identifierError || loginEmailError || signupEmailError) ? 'true' : 'false'"
                  @input="onIdentifierInput"
                >
                <p v-if="identifierError" class="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <svg class="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                  {{ identifierError }}
                </p>
                <p
                  id="identifierHint"
                  v-if="identifierHint"
                  class="mt-1.5 text-xs leading-relaxed"
                  :class="identifierHint.tone === 'note' ? 'rounded-xl border border-[#e4d0f8] bg-[#f5eeff] px-3 py-2 text-[#4c4453]' : 'text-[#7d7484]'"
                  role="status"
                >{{ identifierHint.text }}</p>
              </div>
            </div>

            <!-- Reset by emailed link -->
            <div v-if="!resetSuccess && resetMethod === 'email'" data-testid="reset-by-email">
              <div v-if="!resetEmailSent">
                <form @submit.prevent="sendResetLink" novalidate>
                  <div v-if="resetEmailError || resetEmailMessage" class="mb-5">
                    <p v-if="resetEmailMessage" role="alert" class="mt-2 text-sm text-red-700">{{ resetEmailMessage }}</p>
                  </div>
                  <button
                    type="submit"
                    :disabled="resetEmailBusy || resetEmailCooldown > 0"
                    class="w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(82,0,148,0.55)] transition hover:bg-[#6c24b3] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/60 focus-visible:ring-offset-2"
                  >
                    {{ resetEmailBusy ? 'Sending…' : (resetEmailCooldown > 0 ? `Try again in ${resetEmailCooldown}s` : 'Send reset link') }}
                  </button>
                </form>
              </div>

              <div v-else role="status" class="text-center py-2">
                <h4 class="text-base font-bold text-[#1e1a22]">Check your email</h4>
                <p class="mt-2 text-sm text-[#4c4453]">
                  If an account exists for <strong>{{ resetEmailSentTo }}</strong>, we've sent a link to reset your password.
                  It works once and expires soon. Only verified email addresses get a link, so if nothing arrives, reset with your phone number instead.
                </p>
                <p v-if="resetEmailMessage" role="alert" class="mt-2 text-sm text-red-700">{{ resetEmailMessage }}</p>
                <div class="mt-4 flex gap-3">
                  <button
                    type="button"
                    @click="resetEmailStartOver"
                    class="flex-1 rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 text-sm font-semibold text-[#4c4453] hover:bg-[#f5eeff] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/40"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    @click="sendResetLink"
                    :disabled="resetEmailBusy || resetEmailCooldown > 0"
                    class="flex-1 rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 text-sm font-semibold text-[#520094] hover:bg-[#f5eeff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/40"
                  >
                    {{ resetEmailCooldown > 0 ? `Resend in ${resetEmailCooldown}s` : 'Resend link' }}
                  </button>
                </div>
              </div>
            </div>

            <form v-if="!resetSuccess && resetMethod === 'phone'" @submit.prevent="handleResetPassword" novalidate>
              <div v-if="otpSent" class="mb-4 flex items-center gap-2 rounded-2xl bg-[#f5eeff] border border-[#e4d0f8] px-4 py-3 text-xs text-[#4c4453]">
                <svg class="h-4 w-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                Code sent to <strong class="text-[#1e1a22] ml-0.5">{{ formattedPhoneNumber }}</strong>
              </div>

              <!-- Step 1: Send OTP -->
              <div v-if="!otpSent" class="mb-4">
                <button
                  type="button"
                  @click="sendResetOTP"
                  :disabled="isLoading || !phoneNumber || identifierKind === 'foreign_phone'"
                  class="w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(82,0,148,0.55)] transition hover:bg-[#6c24b3] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/60 focus-visible:ring-offset-2"
                >
                  <span v-if="isLoading" class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending code…
                  </span>
                  <span v-else>Send reset code</span>
                </button>
              </div>

              <!-- Step 2: OTP + new password -->
              <div v-if="otpSent" class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-[#1e1a22] mb-2">Verification code</label>
                  <div class="flex gap-2" role="group" aria-label="6-digit verification code">
                    <input
                      v-for="(_, idx) in otpDigits"
                      :key="'reset-' + idx"
                      :ref="el => { if (el) otpRefs[idx] = el as HTMLInputElement }"
                      v-model="otpDigits[idx]"
                      type="text"
                      inputmode="numeric"
                      maxlength="1"
                      pattern="[0-9]"
                      :aria-label="`Digit ${idx + 1}`"
                      class="h-12 w-10 flex-1 rounded-xl border border-[#ddd0eb] bg-white text-center text-base font-bold text-[#1e1a22] shadow-[0_1px_3px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#520094] focus:ring-2 focus:ring-[#520094]/20 transition-shadow caret-transparent"
                      @input="handleOtpInput($event, idx)"
                      @keydown="handleOtpKeydown($event, idx)"
                      @paste.prevent="handleOtpPaste($event)"
                      autocomplete="one-time-code"
                    >
                  </div>
                  <button
                    type="button"
                    @click="sendResetOTP"
                    :disabled="isLoading"
                    class="mt-3 text-xs font-semibold text-[#520094] hover:text-[#6c24b3] disabled:opacity-50 focus:outline-none focus-visible:underline"
                  >
                    Resend code
                  </button>
                </div>

                <div>
                  <label for="resetPassword" class="block text-sm font-semibold text-[#1e1a22] mb-1.5">New password</label>
                  <div class="relative">
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      id="resetPassword"
                      class="w-full rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 pr-11 text-sm text-[#1e1a22] placeholder-[#a090b0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow"
                      placeholder="Min. 6 characters"
                      required
                      minlength="6"
                      autocomplete="new-password"
                    >
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-[#7d7484] hover:text-[#520094] hover:bg-[#f2eaf9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/40"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    >
                      <EyeSlashIcon v-if="showPassword" class="w-4 h-4" aria-hidden="true" />
                      <EyeIcon v-else class="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div class="flex gap-3 pt-1">
                  <button
                    type="button"
                    @click="backToSignIn"
                    class="flex-1 rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3.5 text-sm font-semibold text-[#4c4453] hover:bg-[#f5eeff] hover:border-[#c9aff0] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isLoading || otp.length !== 6 || password.length < 6"
                    class="flex-1 rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(82,0,148,0.55)] transition hover:bg-[#6c24b3] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/60 focus-visible:ring-offset-2"
                  >
                    <span v-if="isLoading" class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting…
                    </span>
                    <span v-else>Reset password</span>
                  </button>
                </div>
              </div>
            </form>

            <div v-if="!resetSuccess && resetMethod === 'phone' && !otpSent" class="mt-3 text-center">
              <button
                type="button"
                @click="backToSignIn"
                class="text-sm text-[#7d7484] hover:text-[#520094] focus:outline-none focus-visible:underline"
              >
                Back to sign in
              </button>
            </div>
            <div v-if="!resetSuccess && resetMethod === 'email'" class="mt-3 text-center">
              <button
                type="button"
                @click="backToSignIn"
                class="text-sm text-[#7d7484] hover:text-[#520094] focus:outline-none focus-visible:underline"
              >
                Back to sign in
              </button>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════════════ -->
          <!-- Sign up (explicit new-user path)                              -->
          <!-- ══════════════════════════════════════════════════════════════ -->
          <div v-else-if="view === 'signup'">

            <!-- Step 1: phone or email, then send a code -->
            <form v-if="!signupOtpSent" @submit.prevent="continueSignup" novalidate>
              <!-- One box for a phone number or an email -->
              <div class="mb-4">
                <label for="identifier" class="mb-1.5 block text-sm font-semibold text-[#1e1a22]">Phone number or email</label>
                <input
                  v-model="identifier"
                  type="text"
                  id="identifier"
                  inputmode="email"
                  autocomplete="username"
                  autocapitalize="none"
                  spellcheck="false"
                  class="w-full rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 text-sm text-[#1e1a22] placeholder-[#a090b0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow disabled:opacity-60"
                  placeholder="024 123 4567 or you@example.com"
                  aria-describedby="identifierHint"
                  :aria-invalid="(identifierError || loginEmailError || signupEmailError) ? 'true' : 'false'"
                  @input="onIdentifierInput"
                >
                <p v-if="identifierError" class="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <svg class="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                  {{ identifierError }}
                </p>
                <p
                  id="identifierHint"
                  v-if="identifierHint"
                  class="mt-1.5 text-xs leading-relaxed"
                  :class="identifierHint.tone === 'note' ? 'rounded-xl border border-[#e4d0f8] bg-[#f5eeff] px-3 py-2 text-[#4c4453]' : 'text-[#7d7484]'"
                  role="status"
                >{{ identifierHint.text }}</p>
              </div>

              <button
                type="submit"
                :disabled="!signupStep1Ready"
                class="w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(82,0,148,0.55)] transition hover:bg-[#6c24b3] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/60 focus-visible:ring-offset-2"
              >
                <span v-if="isLoading" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending code…
                </span>
                <span v-else-if="signupMethod === 'email' && signupEmailWaitsForOtherAddress">Wait {{ signupEmailCooldown }}s to send again</span>
                <span v-else>Send code</span>
              </button>

              <p class="mt-3 text-center text-xs leading-relaxed text-[#7d7484]">
                By continuing you agree to our
                <a href="/privacy" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-[#520094]">Privacy Policy</a>
                and to receive order updates{{ signupUpdatesChannel }}, and confirm you are 18 or older.
              </p>
            </form>

            <!-- Step 2: Details + submit -->
            <form v-else @submit.prevent="submitSignup" class="space-y-4" novalidate>
              <!-- Phone confirmation pill -->
              <div class="flex items-center justify-between rounded-2xl bg-[#f5eeff] border border-[#e4d0f8] px-4 py-3">
                <div class="flex items-center gap-2 text-xs text-[#4c4453]">
                  <svg class="h-4 w-4 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
                  Code sent to <strong class="text-[#1e1a22] ml-0.5 break-all">{{ signupMethod === 'email' ? signupEmailSentTo : formattedPhoneNumber }}</strong>
                </div>
                <button
                  type="button"
                  @click="changeSignupContact"
                  class="text-xs font-semibold text-[#520094] hover:text-[#6c24b3] focus:outline-none focus-visible:underline"
                >
                  Change
                </button>
              </div>

              <!-- Name row -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="su-fname" class="block text-sm font-semibold text-[#1e1a22] mb-1.5">First name <span class="text-red-500">*</span></label>
                  <input v-model="firstName" type="text" id="su-fname"
                    class="w-full rounded-xl border border-[#ddd0eb] bg-white px-3 py-2.5 text-sm text-[#1e1a22] placeholder-[#a090b0] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow"
                    placeholder="John" required autocomplete="given-name">
                </div>
                <div>
                  <label for="su-lname" class="block text-sm font-semibold text-[#1e1a22] mb-1.5">Last name <span class="text-red-500">*</span></label>
                  <input v-model="lastName" type="text" id="su-lname"
                    class="w-full rounded-xl border border-[#ddd0eb] bg-white px-3 py-2.5 text-sm text-[#1e1a22] placeholder-[#a090b0] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow"
                    placeholder="Doe" required autocomplete="family-name">
                </div>
              </div>

              <!-- OTP boxes -->
              <div>
                <label class="block text-sm font-semibold text-[#1e1a22] mb-2">Verification code <span class="text-red-500">*</span></label>
                <div class="flex gap-2" role="group" aria-label="6-digit verification code">
                  <input
                    v-for="(_, idx) in otpDigits"
                    :key="'signup-' + idx"
                    :ref="el => { if (el) otpRefs[idx] = el as HTMLInputElement }"
                    v-model="otpDigits[idx]"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    pattern="[0-9]"
                    :aria-label="`Digit ${idx + 1}`"
                    class="h-12 w-10 flex-1 rounded-xl border border-[#ddd0eb] bg-white text-center text-base font-bold text-[#1e1a22] shadow-[0_1px_3px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#520094] focus:ring-2 focus:ring-[#520094]/20 transition-shadow caret-transparent"
                    @input="handleOtpInput($event, idx)"
                    @keydown="handleOtpKeydown($event, idx)"
                    @paste.prevent="handleOtpPaste($event)"
                    autocomplete="one-time-code"
                  >
                </div>
                <p v-if="signupMethod === 'email'" class="mt-2 text-xs text-[#7d7484]">
                  Can't find it? Check your spam folder.
                </p>
                <button
                  type="button"
                  @click="resendSignupCode"
                  :disabled="isLoading || (signupMethod === 'email' && signupEmailCooldown > 0)"
                  class="mt-2 text-xs font-semibold text-[#520094] hover:text-[#6c24b3] disabled:opacity-50 focus:outline-none focus-visible:underline"
                >
                  {{ signupMethod === 'email' && signupEmailCooldown > 0 ? `Resend code in ${signupEmailCooldown}s` : 'Resend code' }}
                </button>
              </div>

              <!-- Password -->
              <div>
                <label for="su-password" class="block text-sm font-semibold text-[#1e1a22] mb-1.5">Create a password <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    id="su-password"
                    class="w-full rounded-2xl border border-[#ddd0eb] bg-white px-4 py-3 pr-11 text-sm text-[#1e1a22] placeholder-[#a090b0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] focus:outline-none focus:border-[#520094]/50 focus:ring-2 focus:ring-[#520094]/15 transition-shadow"
                    placeholder="Min. 6 characters"
                    required
                    minlength="6"
                    autocomplete="new-password"
                  >
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-[#7d7484] hover:text-[#520094] hover:bg-[#f2eaf9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/40"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <EyeSlashIcon v-if="showPassword" class="w-4 h-4" aria-hidden="true" />
                    <EyeIcon v-else class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                :disabled="isLoading || !canSignupSubmit"
                class="w-full rounded-2xl bg-[#520094] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(82,0,148,0.55)] transition hover:bg-[#6c24b3] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#520094]/60 focus-visible:ring-offset-2"
              >
                <span v-if="isLoading" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating your account…
                </span>
                <span v-else>Create account</span>
              </button>
            </form>

            <!-- Switch to login -->
            <p class="mt-5 text-center text-sm text-[#7d7484]">
              Already have an account?
              <button
                type="button"
                @click="signInInstead"
                class="font-bold text-[#520094] hover:text-[#6c24b3] focus:outline-none focus-visible:underline"
              >
                Sign in
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';
import { useUserStore } from '~/stores/user';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useModalA11y } from '~/composables/useModalA11y';
import { useEmailSignIn, useEmailReset, signInReady } from '~/composables/useEmailSignIn';
import { createCustomerAuthService } from '~/services/customerAuth/customerAuthService';
import phoneUtils from '~/utils/phone';
import { describeEmailAuthError } from '~/utils/emailAuthMessages';
import { classifyIdentifier, describeIdentifier, type IdentifierPurpose } from '~/utils/contactIdentifier';

type LoginStep = 'signin' | 'reset';
type LoginMode = 'login' | 'verify' | 'register';
type LoginView = 'login' | 'signup';

interface LoginSuccessPayload {
  destination: string;
  action: string;
}

// TODO: remove once stores/ are .ts
interface UserStoreShape {
  formatPhoneNumber: (phone: string) => string;
  checkPhoneStatus: (phone: string) => Promise<{ status: string }>;
  login: (phone: string, password: string) => Promise<void>;
  sendSetupOTP: (phone: string) => Promise<void>;
  setupPassword: (phone: string, otp: string, password: string) => Promise<void>;
  register: (payload: {
    company_id?: unknown;
    fname: string;
    lname: string;
    phone: string;
    password: string;
    email?: string;
    otp: string;
  }) => Promise<void>;
  sendResetOTP: (phone: string) => Promise<void>;
  resetPassword: (phone: string, otp: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<unknown>;
  requestEmailReset: (email: string) => Promise<unknown>;
  sendSignupEmailCode: (email: string) => Promise<unknown>;
  registerWithEmail: (payload: {
    company_id?: unknown;
    fname: string;
    lname: string;
    email: string;
    otp: string;
    password: string;
  }) => Promise<unknown>;
}

// TODO: remove once stores/ are .ts
interface PharmacyStoreShape {
  pharmacyData: { name?: string } | null;
  currentPharmacy: unknown;
}

const props = defineProps<{ isOpen?: boolean; inline?: boolean; initialView?: 'login' | 'signup' }>();

const emit = defineEmits<{
  close: [];
  'login-success': [payload: LoginSuccessPayload];
}>();

const userStore = useUserStore() as unknown as UserStoreShape;
const pharmacyStore = usePharmacyStore() as unknown as PharmacyStoreShape;
const customerAuthService = createCustomerAuthService(useApi());

// Focus trap, ESC-to-close, restore focus to invoker (WAI-ARIA dialog pattern).
const dialogRef = ref<HTMLElement | null>(null);
useModalA11y(dialogRef, () => props.isOpen ?? false, () => emit('close'));

// State
const view = ref<LoginView>(props.initialView ?? 'login');
const currentStep = ref<LoginStep>('signin');
const mode = ref<LoginMode>('login');
const phoneNumber = ref<string>('');
const selectedCountry = ref<string>('GH');
const password = ref<string>('');
const confirmPassword = ref<string>('');
const otp = ref<string>('');
const firstName = ref<string>('');
const lastName = ref<string>('');
const email = ref<string>('');
const gender = ref<string>('');
const isOver18 = ref<boolean>(false);
const otpSent = ref<boolean>(false);
const signupOtpSent = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');
const phoneNumberError = ref<string>('');
const rememberMe = ref<boolean>(true);
const showPassword = ref<boolean>(false);
const resetSuccess = ref<boolean>(false);

// Email as an alternative to phone: sign in with a VERIFIED email + password, and
// reset a password by emailed link. Logic and wording live in useEmailSignIn.ts.
type ContactMethod = 'phone' | 'email';
// One box serves sign-in, sign-up and reset. What was typed decides the path.
const identifier = ref<string>('');
const identifierKind = computed(() => classifyIdentifier(identifier.value).kind);
const methodOf = (): ContactMethod => (identifierKind.value === 'email' ? 'email' : 'phone');
const signInMethod = computed<ContactMethod>(methodOf);
const resetMethod = computed<ContactMethod>(methodOf);
const {
  email: loginEmail,
  emailError: loginEmailError,
  errorMessage: loginEmailMessage,
  submit: submitEmailSignIn,
} = useEmailSignIn({ login: (e, p) => userStore.loginWithEmail(e, p) });
const {
  email: resetEmail,
  emailError: resetEmailError,
  errorMessage: resetEmailMessage,
  busy: resetEmailBusy,
  sent: resetEmailSent,
  sentTo: resetEmailSentTo,
  cooldown: resetEmailCooldown,
  send: sendResetLink,
  startOver: resetEmailStartOver,
} = useEmailReset({ request: (e) => userStore.requestEmailReset(e) });

// The emailed sign-up code uses the same request/cooldown machinery as the reset link.
const signupMethod = computed<ContactMethod>(methodOf);
// Names where order updates will arrive once we know: a Ghana number gets texts, an email gets emails.
const signupUpdatesChannel = computed(() => {
  const kind = identifierKind.value;
  if (kind === 'email') return ' by email';
  if (kind === 'ghana_phone') return ' by text';
  return '';
});
const {
  email: signupEmail,
  emailError: signupEmailError,
  errorMessage: signupEmailMessage,
  busy: signupEmailBusy,
  sent: signupEmailSent,
  sentTo: signupEmailSentTo,
  cooldown: signupEmailCooldown,
  send: sendSignupEmail,
  startOver: signupEmailStartOver,
} = useEmailReset({ request: (e) => userStore.sendSignupEmailCode(e), context: 'signupCode' });

// Mirror the box into the fields the sign-in, sign-up and reset flows read. Synchronous, so a
// view change that clears and restores the box can never leave them behind.
watch(identifier, (typed) => {
  const { kind, value } = classifyIdentifier(typed);
  const email = kind === 'email' ? value : '';
  loginEmail.value = email;
  resetEmail.value = email;
  signupEmail.value = email;
  loginEmailError.value = '';
  resetEmailError.value = '';
  signupEmailError.value = '';
  selectedCountry.value = 'GH';
  phoneNumber.value = kind === 'ghana_phone' || kind === 'foreign_phone' ? value : '';
  if (phoneNumber.value) validatePhoneNumber(); else phoneNumberError.value = '';
}, { flush: 'sync' });

const identifierPurpose = computed<IdentifierPurpose>(() =>
  view.value === 'signup' ? 'signup' : currentStep.value === 'reset' ? 'reset' : 'signin'
);
const identifierHint = computed(() =>
  describeIdentifier(identifierKind.value, identifierPurpose.value, identifier.value.trim())
);
// Whichever error applies to what is typed: a bad number, or a bad email after a send attempt.
const identifierError = computed<string>(() => {
  // A number is only called wrong once it is long enough to be finished, and a number from
  // another country already has its own note.
  const digits = phoneNumber.value.replace(/\D/g, '').length;
  const phoneError = identifierKind.value === 'ghana_phone' && digits >= 9 ? phoneNumberError.value : '';
  return phoneError || loginEmailError.value || signupEmailError.value || resetEmailError.value;
});

// OTP digit boxes — 6 individual single-char slots kept in sync with otp ref
const otpDigits = ref<string[]>(['', '', '', '', '', '']);
const otpRefs = ref<HTMLInputElement[]>([]);

// Keep the `otp` string ref (used by all business logic) in sync with the digit array
watch(otpDigits, (digits) => {
  otp.value = digits.join('');
}, { deep: true });

const handleOtpInput = (event: Event, idx: number): void => {
  const input = event.target as HTMLInputElement;
  const val = input.value.replace(/\D/g, '').slice(-1);
  otpDigits.value[idx] = val;
  if (val && idx < 5) {
    nextTick(() => otpRefs.value[idx + 1]?.focus());
  }
};

const handleOtpKeydown = (event: KeyboardEvent, idx: number): void => {
  if (event.key === 'Backspace') {
    if (otpDigits.value[idx]) {
      otpDigits.value[idx] = '';
    } else if (idx > 0) {
      otpDigits.value[idx - 1] = '';
      nextTick(() => otpRefs.value[idx - 1]?.focus());
    }
    event.preventDefault();
  } else if (event.key === 'ArrowLeft' && idx > 0) {
    otpRefs.value[idx - 1]?.focus();
  } else if (event.key === 'ArrowRight' && idx < 5) {
    otpRefs.value[idx + 1]?.focus();
  }
};

const handleOtpPaste = (event: ClipboardEvent): void => {
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
  if (!pasted) return;
  const digits = pasted.split('');
  for (let i = 0; i < 6; i++) {
    otpDigits.value[i] = digits[i] ?? '';
  }
  nextTick(() => {
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.value[focusIdx]?.focus();
  });
};

const clearOtp = (): void => {
  otpDigits.value = ['', '', '', '', '', ''];
  otp.value = '';
};

const registrationCompany = computed<string | null>(() => pharmacyStore.pharmacyData?.name ?? null);

const stepTitle = computed<string>(() => {
  if (view.value === 'signup') {
    return signupOtpSent.value ? 'Almost there' : 'Create your account';
  }
  if (currentStep.value === 'reset') return 'Reset your password';
  if (mode.value === 'verify') return 'Quick verification';
  if (mode.value === 'register') return 'Create your account';
  return 'Sign in to MedsGh';
});

const stepSubtitle = computed<string>(() => {
  if (view.value === 'signup') {
    if (signupOtpSent.value) {
      return registrationCompany.value
        ? `Fill in your details and join ${registrationCompany.value}.`
        : 'Fill in a few details and you\'re in.';
    }
    return 'Use your phone number or your email. We\'ll send a code.';
  }
  if (currentStep.value === 'reset') {
    if (otpSent.value) return 'Enter the code and choose a new password.';
    return "Enter your phone number or email and we'll help you set a new password.";
  }
  if (mode.value === 'verify') return "Confirm the code we sent and we'll activate your account.";
  if (mode.value === 'register') {
    return registrationCompany.value
      ? `Registering with ${registrationCompany.value}. Orders will be available there right after signup.`
      : "A couple more details and you're in.";
  }
  return '';
});

const submitLabel = computed<string>(() => {
  if (mode.value === 'verify') return 'Activate account';
  if (mode.value === 'register') return 'Create account';
  return 'Sign in';
});

const submittingLabel = computed<string>(() => {
  if (mode.value === 'verify') return 'Activating...';
  if (mode.value === 'register') return 'Creating...';
  return 'Signing in...';
});

const canSubmit = computed<boolean>(() => {
  if (mode.value === 'login') {
    return signInReady(signInMethod.value, {
      phone: phoneNumber.value,
      email: loginEmail.value,
      password: password.value,
    });
  }
  if (mode.value === 'verify') {
    return Boolean(otp.value) && otp.value.length === 6;
  }
  if (mode.value === 'register') {
    return Boolean(otp.value) && otp.value.length === 6
      && Boolean(firstName.value) && Boolean(lastName.value)
      && isOver18.value;
  }
  return false;
});

const canSignupSubmit = computed<boolean>(() =>
  signupOtpSent.value &&
  Boolean(firstName.value.trim()) && Boolean(lastName.value.trim()) &&
  otp.value.length === 6 &&
  password.value.length >= 6
);

// A second address cannot be asked for while the first one's cooldown runs.
const signupEmailWaitsForOtherAddress = computed<boolean>(() =>
  signupEmailCooldown.value > 0 && signupEmail.value.trim() !== signupEmailSentTo.value
);

const signupStep1Ready = computed<boolean>(() => {
  if (isLoading.value) return false;
  if (identifierKind.value === 'email') {
    return !signupEmailBusy.value && !signupEmailWaitsForOtherAddress.value;
  }
  // A number from outside Ghana cannot be texted; it is told to use email instead.
  return identifierKind.value === 'ghana_phone' && Boolean(phoneNumber.value) && !phoneNumberError.value;
});

const resolveCurrentPharmacyId = (): unknown => {
  if (pharmacyStore.currentPharmacy) {
    return pharmacyStore.currentPharmacy;
  }

  if (process.client) {
    try {
      const savedPharmacyId = localStorage.getItem('currentPharmacyId');
      if (savedPharmacyId) {
        (pharmacyStore as { currentPharmacy: unknown }).currentPharmacy = savedPharmacyId;
        return savedPharmacyId;
      }
    } catch (err) {
      console.error('Failed to restore pharmacy ID:', err);
    }
  }

  return null;
};

const phoneE164 = computed<string>(() =>
  phoneUtils.formatToE164(phoneNumber.value, selectedCountry.value)
);

const formattedPhoneNumber = computed<string>(() =>
  phoneE164.value ? phoneUtils.formatForDisplay(phoneE164.value) : phoneNumber.value
);

const validatePhoneNumber = (): boolean => {
  if (!phoneNumber.value.replace(/\D/g, '')) {
    phoneNumberError.value = '';
    return false;
  }
  if (phoneUtils.isValidPhone(phoneNumber.value, selectedCountry.value)) {
    phoneNumberError.value = '';
    return true;
  }
  phoneNumberError.value = 'Please enter a valid phone number.';
  return false;
};

// If user edits phone after a reveal, snap back to login mode
const onIdentifierInput = (): void => {
  if (mode.value !== 'login') {
    mode.value = 'login';
    clearOtp();
    otpSent.value = false;
    firstName.value = '';
    lastName.value = '';
    email.value = '';
    isOver18.value = false;
    errorMessage.value = '';
  }
};

// ── View navigation ──────────────────────────────────────────────────────────

const resetSignupContact = (): void => {
  signupEmailError.value = '';
  signupEmailStartOver();
};

const resetSharedFields = (): void => {
  resetSignupContact();
  identifier.value = '';
  phoneNumber.value = '';
  selectedCountry.value = 'GH';
  password.value = '';
  confirmPassword.value = '';
  clearOtp();
  firstName.value = '';
  lastName.value = '';
  email.value = '';
  isOver18.value = false;
  errorMessage.value = '';
  phoneNumberError.value = '';
};

const goToSignup = (): void => {
  // What they typed on the sign-in screen comes with them.
  const carried = identifier.value;
  view.value = 'signup';
  signupOtpSent.value = false;
  resetSharedFields();
  identifier.value = carried;
};

const goToLogin = (): void => {
  showPassword.value = false;
  view.value = 'login';
  currentStep.value = 'signin';
  mode.value = 'login';
  signupOtpSent.value = false;
  otpSent.value = false;
  resetSuccess.value = false;
  resetSharedFields();
};

// ── Signup flow ──────────────────────────────────────────────────────────────

const continueSignup = async (): Promise<void> => {
  if (!signupStep1Ready.value) return;
  if (signupMethod.value === 'email') await requestSignupEmailCode();
  else await sendSignupOTP();
};

const requestSignupEmailCode = async (): Promise<void> => {
  errorMessage.value = '';
  const address = signupEmail.value.trim();
  // Already sent to this address (they pressed Change by mistake): that code still works.
  if (signupEmailSent.value && address === signupEmailSentTo.value) {
    signupOtpSent.value = true;
    return;
  }
  isLoading.value = true;
  try {
    await sendSignupEmail();
  } finally {
    isLoading.value = false;
  }
  if (signupEmailSent.value && signupEmailSentTo.value === address) {
    signupOtpSent.value = true;
    clearOtp();
  } else {
    errorMessage.value = signupEmailMessage.value;
  }
};

const resendSignupCode = async (): Promise<void> => {
  if (signupMethod.value !== 'email') return sendSignupOTP();
  errorMessage.value = '';
  isLoading.value = true;
  try {
    await sendSignupEmail();
  } finally {
    isLoading.value = false;
  }
  if (signupEmailMessage.value) errorMessage.value = signupEmailMessage.value;
  else clearOtp();
};

const changeSignupContact = (): void => {
  signupOtpSent.value = false;
  clearOtp();
  errorMessage.value = '';
};

// "Already have an account? Sign in": what they typed comes along.
const signInInstead = (): void => {
  const carried = identifier.value;
  goToLogin();
  identifier.value = carried;
};

const sendSignupOTP = async (): Promise<void> => {
  if (!validatePhoneNumber()) return;
  errorMessage.value = '';
  isLoading.value = true;
  try {
    const data = await customerAuthService.sendSetupOtp({
      phone: phoneE164.value,
    }) as { success: boolean; message?: string };
    if (!data.success) throw new Error(data.message ?? 'Failed to send verification code');
    signupOtpSent.value = true;
    clearOtp();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to send code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const submitSignup = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;
  if (signupMethod.value === 'email') {
    try {
      await userStore.registerWithEmail({
        company_id: resolveCurrentPharmacyId() ?? undefined,
        fname: firstName.value,
        lname: lastName.value,
        email: signupEmailSentTo.value,
        otp: otp.value,
        password: password.value,
      });
      emit('login-success', { destination: 'new', action: 'register' });
      closeModal();
    } catch (err) {
      const described = describeEmailAuthError(err, 'signup');
      errorMessage.value = described.message;
      if (described.kind === 'code_locked') {
        // The code is destroyed after too many guesses; start the boxes over.
        clearOtp();
        nextTick(() => otpRefs.value[0]?.focus());
      }
    } finally {
      isLoading.value = false;
    }
    return;
  }
  try {
    await userStore.register({
      company_id: resolveCurrentPharmacyId() ?? undefined,
      fname: firstName.value,
      lname: lastName.value,
      phone: phoneE164.value,
      password: password.value,
      otp: otp.value,
    });
    emit('login-success', { destination: 'new', action: 'register' });
    closeModal();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// ── Login flow (unchanged) ───────────────────────────────────────────────────

// Send registration OTP via the service layer.
const sendNewCustomerOTP = async (): Promise<void> => {
  const data = await customerAuthService.sendSetupOtp({
    phone: phoneE164.value,
  }) as { success: boolean; message?: string };
  if (!data.success) throw new Error(data.message ?? 'Failed to send verification code');
};

// Unified submit dispatcher
const onSignInSubmit = async (): Promise<void> => {
  if (mode.value === 'login') return submitLogin();
  if (mode.value === 'verify') return submitVerify();
  if (mode.value === 'register') return submitRegister();
};

// Path A: phone + password submitted. Decide what to do.
const submitLogin = async (): Promise<void> => {
  if (signInMethod.value === 'email') return submitEmailLogin();
  if (!validatePhoneNumber()) return;
  if (!password.value || password.value.length < 6) {
    errorMessage.value = 'Enter your password (min. 6 characters).';
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;

  try {
    const result = await userStore.checkPhoneStatus(phoneE164.value);

    if (result.status === 'registered') {
      try {
        await userStore.login(phoneE164.value, password.value);
        emit('login-success', { destination: 'new', action: 'login' });
        closeModal();
      } catch (loginErr) {
        console.error('Login error:', loginErr);
        errorMessage.value = `Wrong password for ${formattedPhoneNumber.value}. Try again or reset.`;
      }
      return;
    }

    if (result.status === 'existing_customer_no_password') {
      await userStore.sendSetupOTP(phoneE164.value);
      otpSent.value = true;
      mode.value = 'verify';
      return;
    }

    if (result.status === 'new_customer') {
      errorMessage.value = `No account found for ${formattedPhoneNumber.value}. Check the number, or create a new account below.`;
      return;
    }

    throw new Error('Unknown account status.');
  } catch (err) {
    console.error('Sign-in error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Path A': email + password. Only verified emails can sign in; the refusal wording is
// deliberately the same for an unknown, unverified or wrong email (see useEmailSignIn).
const submitEmailLogin = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    const signedIn = await submitEmailSignIn(password.value);
    if (signedIn) {
      emit('login-success', { destination: 'new', action: 'login' });
      closeModal();
    } else {
      errorMessage.value = loginEmailMessage.value;
    }
  } finally {
    isLoading.value = false;
  }
};

// Path B: existing customer activates with OTP; reuse already-typed password.
const submitVerify = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await userStore.setupPassword(phoneE164.value, otp.value, password.value);
    emit('login-success', { destination: 'new', action: 'setup' });
    closeModal();
  } catch (err) {
    console.error('Activate account error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to activate account. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Path C: new customer registers via auto-detect; reuse already-typed password.
const submitRegister = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const companyId = resolveCurrentPharmacyId();

    await userStore.register({
      company_id: companyId ?? undefined,
      fname: firstName.value,
      lname: lastName.value,
      phone: phoneE164.value,
      password: password.value,
      email: email.value,
      otp: otp.value,
    });

    emit('login-success', { destination: 'new', action: 'register' });
    closeModal();
  } catch (err) {
    console.error('Registration error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const resendVerifyOTP = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    await userStore.sendSetupOTP(phoneE164.value);
  } catch (err) {
    console.error('Resend verify OTP error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const resendRegisterOTP = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    await sendNewCustomerOTP();
  } catch (err) {
    console.error('Resend register OTP error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const forgotPassword = (): void => {
  showPassword.value = false;
  resetEmailStartOver();
  currentStep.value = 'reset';
  mode.value = 'login';
  otpSent.value = false;
  clearOtp();
  password.value = '';
  confirmPassword.value = '';
  errorMessage.value = '';
  resetSuccess.value = false;
};

const sendResetOTP = async (): Promise<void> => {
  if (!validatePhoneNumber()) return;
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await userStore.sendResetOTP(phoneE164.value);
    otpSent.value = true;
  } catch (err) {
    console.error('Error sending reset OTP:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to send reset code. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleResetPassword = async (): Promise<void> => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await userStore.resetPassword(phoneE164.value, otp.value, password.value);

    errorMessage.value = '';
    confirmPassword.value = '';
    clearOtp();
    resetSuccess.value = true;
  } catch (err) {
    console.error('Reset password error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const backToSignIn = (): void => {
  showPassword.value = false;
  resetEmailStartOver();
  currentStep.value = 'signin';
  mode.value = 'login';
  password.value = '';
  confirmPassword.value = '';
  clearOtp();
  firstName.value = '';
  lastName.value = '';
  gender.value = '';
  isOver18.value = false;
  otpSent.value = false;
  errorMessage.value = '';
  resetSuccess.value = false;
};

const closeModal = (): void => {
  emit('close');
  setTimeout(() => {
    view.value = 'login';
    currentStep.value = 'signin';
    mode.value = 'login';
    signupOtpSent.value = false;
    resetSignupContact();
    identifier.value = '';
    resetEmailStartOver();
    password.value = '';
    confirmPassword.value = '';
    clearOtp();
    firstName.value = '';
    lastName.value = '';
    email.value = '';
    gender.value = '';
    isOver18.value = false;
    otpSent.value = false;
    errorMessage.value = '';
    phoneNumberError.value = '';
    resetSuccess.value = false;
  }, 300);
};

const tryToRestorePhone = (): void => {
  if (typeof localStorage !== 'undefined') {
    const savedPhone = localStorage.getItem('lastPhoneNumber');
    if (savedPhone && !identifier.value) identifier.value = savedPhone;
  }
};

onMounted(() => {
  if (props.isOpen || props.inline) {
    tryToRestorePhone();
  }
});

watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    tryToRestorePhone();
  }
});

// Scroll first OTP box into view when the verify panel activates.
watch(mode, async (newMode) => {
  if (newMode === 'verify' || newMode === 'register') {
    await nextTick();
    otpRefs.value[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    otpRefs.value[0]?.focus();
  }
});
</script>
