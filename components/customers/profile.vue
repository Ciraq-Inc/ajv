<template>
  <div class="w-full pb-16 font-body">
    <div class="mx-auto max-w-3xl space-y-10 px-1 pt-8 sm:px-0">
      <!-- Who you are -->
      <header class="text-center">
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-ink-100 font-display text-3xl font-bold text-ink-900" aria-hidden="true">{{ profileInitials }}</div>
        <h1 class="mt-5 font-display text-3xl font-bold tracking-tight text-ink-900">{{ profileDisplayName }}</h1>
        <p class="mt-1 text-base text-ink-600">{{ formatPhoneNumber(userStore.userPhoneNumber) || 'No phone number' }}</p>

        <p v-if="isProfileLoading" role="status" class="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-ink-500">
          <ArrowPathIcon class="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading your profile…
        </p>
        <div v-else class="mx-auto mt-5 max-w-xs">
          <p class="text-sm font-semibold text-ink-900">{{ allDone ? 'Your profile is complete' : `${doneCount} of ${steps.length} steps done` }}</p>
          <div
            role="progressbar"
            aria-label="Profile completeness"
            :aria-valuenow="doneCount"
            aria-valuemin="0"
            :aria-valuemax="steps.length"
            class="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100"
          >
            <div class="h-full rounded-full bg-brand-700 transition-all duration-500" :style="{ width: `${(doneCount / steps.length) * 100}%` }"></div>
          </div>
        </div>
      </header>

      <!-- Success: announced politely, can be dismissed, goes away on its own -->
      <div
        v-if="updateSuccess"
        data-testid="save-success"
        role="status"
        class="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
      >
        <div class="flex items-center gap-3">
          <CheckCircleIcon class="h-[18px] w-[18px]" aria-hidden="true" />
          Profile updated successfully!
        </div>
        <button
          type="button"
          aria-label="Dismiss message"
          class="-my-2 -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50"
          @click="updateSuccess = false"
        >
          <XMarkIcon class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <!-- Error: announced at once, and stays until the customer tries again -->
      <div
        v-if="error"
        data-testid="save-error"
        role="alert"
        class="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
      >
        <ExclamationCircleIcon class="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
        {{ error }}
      </div>

      <!-- Jump to an area -->
      <nav aria-label="Account areas" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <a v-for="area in areas" :key="area.href" :href="area.href"
          class="flex min-h-[96px] flex-col justify-between rounded-xl bg-ink-100 p-4 text-base font-semibold text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900">
          <component :is="area.icon" class="h-7 w-7" aria-hidden="true" />
          {{ area.label }}
        </a>
      </nav>

      <!-- What is left to do -->
      <section v-if="!isProfileLoading && !allDone" aria-labelledby="sec-setup">
        <h2 id="sec-setup" class="font-display text-2xl font-bold text-ink-900">Finish setting up</h2>
        <ul data-testid="next-steps" class="mt-4 divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-100">
          <li v-for="step in steps" :key="step.id">
            <div v-if="step.done" class="flex min-h-[56px] items-center gap-4 px-4 py-3">
              <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
                <CheckCircleIcon class="h-4 w-4" aria-hidden="true" />
              </span>
              <span class="flex-1 text-base font-medium text-ink-900">{{ step.label }}</span>
              <span class="text-sm text-ink-500">Done</span>
            </div>
            <a v-else :href="`#${step.anchor}`"
              class="flex min-h-[56px] items-center gap-4 px-4 py-3 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink-900">
              <span class="h-7 w-7 flex-shrink-0 rounded-full border-2 border-ink-900" aria-hidden="true"></span>
              <span class="flex-1 text-base font-semibold text-ink-900">{{ step.label }}</span>
              <ChevronRightIcon class="h-5 w-5 text-ink-500" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>

      <!-- Editable details: one form, one save -->
      <form id="profile-form" class="space-y-10" @submit.prevent="saveProfile" novalidate>
        <!-- Personal details -->
        <section id="profile-personal" aria-labelledby="sec-personal" class="scroll-mt-6">
          <div>
            <h2 id="sec-personal" class="font-display text-2xl font-bold text-ink-900">Personal details</h2>
            <p class="mt-1 text-sm text-ink-500">The name your pharmacy and delivery rider will see.</p>
          </div>
          <div class="mt-5">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label for="fname" class="text-sm font-semibold text-ink-600">First name</label>
                <input v-model="profile.fname" type="text" id="fname" placeholder="e.g. Ama" required
                  autocomplete="given-name" autocapitalize="words" inputmode="text"
                  :aria-invalid="fnameError ? 'true' : undefined"
                  :aria-describedby="fnameError ? 'fname-error' : undefined"
                  :class="[fieldClass, fnameError ? errorFieldClass : '']" />
                <p v-if="fnameError" id="fname-error" role="alert" class="text-xs font-medium text-red-700">{{ fnameError }}</p>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="lname" class="text-sm font-semibold text-ink-600">Last name</label>
                <input v-model="profile.lname" type="text" id="lname" placeholder="e.g. Mensah" required
                  autocomplete="family-name" autocapitalize="words" inputmode="text"
                  :aria-invalid="lnameError ? 'true' : undefined"
                  :aria-describedby="lnameError ? 'lname-error' : undefined"
                  :class="[fieldClass, lnameError ? errorFieldClass : '']" />
                <p v-if="lnameError" id="lname-error" role="alert" class="text-xs font-medium text-red-700">{{ lnameError }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Email and sign-in -->
        <section id="profile-email" aria-labelledby="sec-email" class="scroll-mt-6 border-t border-ink-100 pt-10">
          <div>
            <h2 id="sec-email" class="font-display text-2xl font-bold text-ink-900">Email and sign-in</h2>
            <p class="mt-1 text-sm text-ink-500">Use your email for order updates and to sign in. Your phone number is how we recognise your account.</p>
          </div>
          <div class="mt-5 space-y-5">
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between gap-3">
                <label for="email" class="text-sm font-semibold text-ink-600">Email address</label>
                <span v-if="emailStatus === 'verified' && !emailIsChanged" data-testid="email-verified"
                  class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-800">
                  <CheckCircleIcon class="h-3.5 w-3.5" aria-hidden="true" /> Verified
                </span>
                <span v-else-if="emailStatus === 'unverified' && !emailIsChanged" data-testid="email-unverified"
                  class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                  <ExclamationCircleIcon class="h-3.5 w-3.5" aria-hidden="true" /> Not verified
                </span>
              </div>
              <input v-model="profile.email" type="email" id="email" placeholder="you@example.com"
                autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false"
                :aria-invalid="emailFieldError ? 'true' : undefined"
                :aria-describedby="emailFieldError ? 'email-error' : undefined"
                :class="[fieldClass, emailFieldError ? errorFieldClass : '']" />
              <p v-if="emailFieldError" id="email-error" role="alert" class="text-xs font-medium text-red-700">{{ emailFieldError }}</p>

              <div v-if="emailStatus === 'unverified' && !emailIsChanged" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p class="text-sm font-medium text-amber-900">
                  Verify this address to receive order updates by email and to sign in with it.
                </p>
                <button type="button" data-testid="resend-verification"
                  :disabled="resendBusy || resendCooldown > 0" @click="resendVerification"
                  class="mt-1 min-h-[44px] rounded text-sm font-bold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50 disabled:cursor-not-allowed disabled:text-ink-500 disabled:no-underline">
                  {{ resendBusy ? 'Sending…' : (resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send verification email') }}
                </button>
                <p v-if="resendMessage" role="alert" class="mt-1 text-xs font-medium text-red-700">{{ resendMessage }}</p>
              </div>
              <p v-if="emailNotice" role="status" data-testid="email-notice" class="text-sm font-medium text-brand-800">{{ emailNotice }}</p>
            </div>

            <!-- Current password: only when the email is being changed -->
            <div v-if="emailIsChanged" class="flex flex-col gap-1.5 rounded-xl border border-brand-100 bg-brand-50 p-4" data-testid="current-password-field">
              <label for="current-password" class="text-sm font-semibold text-ink-900">Current password</label>
              <input v-model="currentPassword" type="password" id="current-password" autocomplete="current-password"
                placeholder="Enter your current password"
                :aria-invalid="passwordError ? 'true' : undefined"
                aria-describedby="current-password-help"
                :class="[fieldClass, passwordError ? errorFieldClass : '']" />
              <p id="current-password-help" class="text-xs font-medium text-ink-500">Needed to change your email. We'll send a verification link to the new address.</p>
              <p v-if="passwordError" role="alert" class="text-xs font-medium text-red-700">{{ passwordError }}</p>
            </div>

            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between gap-3">
                <label for="phone" class="text-sm font-semibold text-ink-600">Phone number</label>
                <span id="phone-locked" class="inline-flex items-center gap-1 text-xs font-bold text-ink-500">
                  <LockClosedIcon class="h-3 w-3" aria-hidden="true" /> Locked
                </span>
              </div>
              <input :value="formatPhoneNumber(userStore.userPhoneNumber)" type="text" id="phone" disabled aria-describedby="phone-locked"
                class="min-h-[48px] cursor-not-allowed rounded-lg border-2 border-transparent bg-ink-100 px-4 py-3 text-base font-medium text-ink-500" />
            </div>
          </div>
        </section>

        <!-- Notifications -->
        <NotificationPreferences />

        <!-- Delivery address -->
        <section id="profile-address" aria-labelledby="sec-address" class="scroll-mt-6 border-t border-ink-100 pt-10">
          <div>
            <h2 id="sec-address" class="font-display text-2xl font-bold text-ink-900">Delivery address</h2>
            <p class="mt-1 text-sm text-ink-500">Used by default for delivery requests until you change it on the request screen.</p>
            <span
              class="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              :class="profile.address ? 'bg-brand-50 text-brand-800' : 'bg-amber-50 text-amber-800'"
            >
              <MapPinIcon class="h-3.5 w-3.5" aria-hidden="true" />
              {{ profile.address ? 'Location Saved' : 'Location Needed' }}
            </span>
          </div>
          <div class="mt-5 space-y-4">
            <div class="relative">
              <label for="profile-address-search" class="mb-1.5 block text-sm font-semibold text-ink-600">Search for your address</label>
              <div class="flex items-center gap-2 rounded-lg border-2 border-transparent bg-ink-100 px-3 py-0.5 focus-within:border-ink-900 focus-within:bg-white">
                <MagnifyingGlassIcon class="h-[18px] w-[18px] text-ink-500" aria-hidden="true" />
                <input
                  v-model="addressSearch"
                  id="profile-address-search"
                  type="text"
                  placeholder="Type an address, landmark, or area"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="profile-address-suggestions"
                  :aria-expanded="addressSuggestions.length > 0"
                  :aria-activedescendant="addressActiveIndex >= 0 ? `profile-address-option-${addressActiveIndex}` : ''"
                  autocomplete="street-address"
                  inputmode="text"
                  @keydown="onAddressKeydown"
                  class="min-h-[44px] w-full bg-transparent text-sm font-medium text-ink-900 outline-none placeholder:text-ink-500"
                />
                <ArrowPathIcon v-if="autocompleteLoading" class="h-[18px] w-[18px] animate-spin text-ink-500" aria-hidden="true" />
              </div>

              <ul
                v-if="addressSuggestions.length"
                id="profile-address-suggestions"
                role="listbox"
                aria-label="Address suggestions"
                class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 m-0 max-h-60 list-none overflow-hidden overflow-y-auto overscroll-contain rounded-xl border border-ink-200 bg-white p-0 shadow-lift"
              >
                <li class="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-ink-500" aria-hidden="true">
                  <span>Suggestions</span>
                  <span>{{ addressSuggestions.length }}</span>
                </li>
                <li
                  v-for="(suggestion, index) in addressSuggestions"
                  :key="`${suggestion.display_name}-${index}`"
                  :id="`profile-address-option-${index}`"
                  role="option"
                  :aria-selected="addressActiveIndex === index"
                  class="cursor-pointer border-b border-ink-100 transition-colors last:border-b-0"
                  :class="addressActiveIndex === index ? 'bg-brand-50' : 'hover:bg-ink-50'"
                  @click="applyAddressSuggestion(suggestion)"
                  @mouseenter="addressActiveIndex = index"
                >
                  <div class="px-4 py-3.5">
                    <p class="line-clamp-2 text-sm font-semibold text-ink-900">{{ suggestion.display_name }}</p>
                    <p class="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-ink-500">{{ suggestion.type || 'Address' }}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button type="button" :disabled="isLocating" @click="captureHomeLocation"
                class="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-ink-100 px-5 py-2 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 disabled:cursor-not-allowed disabled:opacity-60">
                <ArrowPathIcon v-if="isLocating" class="h-4 w-4 animate-spin" aria-hidden="true" />
                <MapPinIcon v-else class="h-4 w-4" aria-hidden="true" />
                <template v-if="isLocating">Finding GPS...</template>
                <template v-else-if="profile.latitude && profile.longitude">Update GPS</template>
                <template v-else>Set from GPS</template>
              </button>
              <button
                v-if="profile.address || (profile.latitude && profile.longitude)"
                type="button" :disabled="isLoading || isLocating"
                aria-label="Clear saved address"
                title="Clear saved address"
                class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 disabled:opacity-60"
                @click="clearHomeLocation">
                <TrashIcon class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div
              class="rounded-xl px-4 py-3"
              :class="profile.address ? 'border border-brand-100 bg-brand-50' : 'border border-dashed border-ink-200 bg-ink-50'"
            >
              <p class="flex items-center gap-2 text-sm font-bold" :class="profile.address ? 'text-brand-900' : 'text-ink-900'">
                <component :is="profile.address ? HomeIcon : InformationCircleIcon" class="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {{ profile.address ? 'Your saved address' : 'No Location Set' }}
              </p>
              <p class="mt-1 text-sm leading-relaxed" :class="profile.address ? 'text-brand-900' : 'text-ink-500'">
                {{ profile.address || 'Search above, or tap "Set from GPS" to use where you are now. Drivers use it to find you.' }}
              </p>
            </div>
          </div>
        </section>

        <!-- Unsaved changes: only here when there is something to save -->
        <div
          v-if="isDirty"
          data-testid="save-bar"
          aria-live="polite"
          class="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl bg-brand-700 p-4 text-white shadow-lift sm:flex-row sm:items-center sm:justify-between sm:pl-6"
        >
          <p class="flex items-center gap-2 text-sm font-semibold">
            <span class="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true"></span>
            You have unsaved changes
          </p>
          <div class="flex items-center gap-2">
            <button type="button" :disabled="isLoading" @click="discardChanges"
              class="min-h-[48px] flex-1 rounded-full bg-white/15 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60 sm:flex-none">
              Discard
            </button>
            <button type="submit" :disabled="isLoading"
              class="inline-flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-ink-900 transition-colors hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
              <ArrowPathIcon v-if="isLoading" class="h-4 w-4 animate-spin" aria-hidden="true" />
              {{ isLoading ? 'Saving Profile...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </form>

      <!-- Health professional verification -->
      <section id="profile-professional" aria-labelledby="sec-pro" class="scroll-mt-6 border-t border-ink-100 pt-10">
        <div>
          <h2 id="sec-pro" class="font-display text-2xl font-bold text-ink-900">Health professional verification</h2>
          <p class="mt-1 text-sm text-ink-500">Verified professionals get fee waivers on every request and can browse pharmacy stock directly.</p>
        </div>

        <div class="mt-5 overflow-hidden rounded-xl bg-ink-50">
          <!-- Status row (when application exists) -->
          <div v-if="profApplication && !profLoading" class="flex items-start gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
            <CheckBadgeIcon v-if="profStatus === 'approved'" class="h-6 w-6 flex-shrink-0 text-brand-700" aria-hidden="true" />
            <ClockIcon v-else-if="profStatus === 'pending'" class="h-6 w-6 flex-shrink-0 text-amber-700" aria-hidden="true" />
            <XCircleIcon v-else class="h-6 w-6 flex-shrink-0 text-red-700" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                :class="{
                  'bg-brand-50 text-brand-800': profStatus === 'approved',
                  'bg-amber-50 text-amber-800': profStatus === 'pending',
                  'bg-red-50 text-red-800': profStatus === 'rejected',
                }"
              >{{ profStatus === 'approved' ? 'Verified' : profStatus === 'pending' ? 'Under review' : profStatus === 'rejected' ? 'Not approved' : 'Not submitted' }}</span>
              <p v-if="profStatus === 'approved'" class="mt-1 text-sm capitalize text-ink-500">
                {{ profApplication?.profession_type }} · {{ profApplication?.license_number }}
              </p>
              <p v-else-if="profStatus === 'pending'" class="mt-1 text-sm text-ink-500">
                Your application is under review. We'll notify you once it's processed.
              </p>
              <p v-else-if="profStatus === 'rejected' && profApplication?.rejection_reason" class="mt-1 text-sm text-red-700">
                Reason: {{ profApplication?.rejection_reason }}
              </p>
            </div>
          </div>

          <!-- Approved: no form, just confirmation -->
          <p v-if="profStatus === 'approved'" class="px-5 py-4 text-sm text-ink-500 sm:px-6">
            Your professional status is active. Fee waivers and Browse Stock are enabled on your account.
          </p>

          <!-- SMS verification step: offered when the submitted PSGH ID matched our registry -->
          <div v-if="profStatus === 'pending' && verificationOptions?.available" class="border-b border-ink-100 bg-brand-50 px-5 py-4 sm:px-6">
            <p class="flex items-center gap-1.5 text-sm font-bold text-ink-900">
              <DevicePhoneMobileIcon class="h-4 w-4 text-brand-700" aria-hidden="true" />
              Skip the wait — verify instantly by SMS
            </p>
            <p class="mt-1 text-sm text-ink-500">
              Your PSGH ID matches our records. We can text a code to the phone number PSGH has on file for that ID to confirm it's you.
            </p>

            <div v-if="otpConfirmedMessage" role="status" class="mt-3 rounded-lg px-3 py-2 text-sm font-semibold" :class="otpAutoApproved ? 'border border-brand-100 bg-brand-50 text-brand-800' : 'border border-amber-100 bg-amber-50 text-amber-800'">
              {{ otpConfirmedMessage }}
            </div>

            <template v-else>
              <div v-if="otpError" data-testid="otp-error" role="alert" class="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                {{ otpError }}
              </div>

              <button v-if="!otpChallengeId" type="button" :disabled="otpSending" @click="sendVerificationOtp"
                class="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-700/30 bg-white px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/50 disabled:opacity-60">
                <ArrowPathIcon v-if="otpSending" class="h-4 w-4 animate-spin" aria-hidden="true" />
                {{ otpSending ? 'Sending code...' : 'Send verification code' }}
              </button>

              <div v-else class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <p class="text-sm font-semibold text-ink-500">Code sent to {{ otpPhoneHint }}.</p>
                <div class="flex items-center gap-2">
                  <input v-model="otpCode" type="text" inputmode="numeric" maxlength="6" placeholder="6-digit code"
                    aria-label="6-digit verification code" autocomplete="one-time-code"
                    class="min-h-[44px] w-36 rounded-xl border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-900 placeholder-ink-400 focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/25" />
                  <button type="button" :disabled="otpConfirming || otpCode.trim().length !== 6" @click="confirmVerificationOtp"
                    class="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                    <ArrowPathIcon v-if="otpConfirming" class="h-4 w-4 animate-spin" aria-hidden="true" />
                    {{ otpConfirming ? 'Confirming...' : 'Confirm' }}
                  </button>
                </div>
              </div>
            </template>
          </div>

          <!-- Application form (none or rejected state) -->
          <form v-if="showProfForm && !profLoading" @submit.prevent="submitProfessionalApplication" class="space-y-4 p-5 sm:p-6">
            <p v-if="profStatus === 'rejected'" class="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              Your previous application was rejected. You may submit a revised application below.
            </p>

            <div v-if="profError" data-testid="prof-error" role="alert" class="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              {{ profError }}
            </div>
            <div v-if="profSuccess" role="status" class="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
              Application submitted — we'll review it and let you know.
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label for="prof-type" class="text-sm font-semibold text-ink-600">Profession type <span class="text-red-700" aria-hidden="true">*</span></label>
                <div class="relative">
                  <select id="prof-type" v-model="profForm.profession_type" required
                    :class="[fieldClass, 'w-full cursor-pointer appearance-none pr-11']">
                    <option value="" class="bg-white text-base text-ink-900">Select profession</option>
                    <option value="doctor" class="bg-white text-base text-ink-900">Doctor</option>
                    <option value="pharmacist" class="bg-white text-base text-ink-900">Pharmacist</option>
                    <option value="nurse" class="bg-white text-base text-ink-900">Nurse / Midwife</option>
                    <option value="other" class="bg-white text-base text-ink-900">Other Licensed Health Worker</option>
                  </select>
                  <ChevronDownIcon class="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-600" aria-hidden="true" />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="prof-license" class="text-sm font-semibold text-ink-600">
                  {{ profForm.profession_type === 'pharmacist' ? 'PSGH ID' : 'License / Registration Number' }}
                  <span class="text-red-700" aria-hidden="true">*</span>
                </label>
                <input id="prof-license" v-model="profForm.license_number" type="text"
                  :placeholder="profForm.profession_type === 'pharmacist' ? 'e.g. 4775 (your PSGH membership ID)' : 'e.g. MDC-2024-12345'" required
                  :aria-describedby="profForm.profession_type === 'pharmacist' ? 'prof-license-help' : undefined"
                  :class="fieldClass" />
                <p v-if="profForm.profession_type === 'pharmacist'" id="prof-license-help" class="text-xs font-medium text-ink-500">
                  Matching this against the PSGH register lets us verify you instantly by SMS instead of waiting on manual review.
                </p>
              </div>
              <div class="flex flex-col gap-1.5 sm:col-span-2">
                <label for="prof-body" class="text-sm font-semibold text-ink-600">Issuing authority <span class="font-medium text-ink-500">(optional)</span></label>
                <input id="prof-body" v-model="profForm.license_body" type="text" placeholder="e.g. Ghana Medical and Dental Council" :class="fieldClass" />
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <button type="submit" :disabled="profSubmitting"
                class="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                <ArrowPathIcon v-if="profSubmitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
                {{ profSubmitting ? 'Submitting...' : (profStatus === 'rejected' ? 'Re-submit Application' : 'Apply for Professional Status') }}
              </button>
            </div>
          </form>

          <!-- Loading state -->
          <p v-if="profLoading" data-testid="prof-loading" role="status" class="flex items-center justify-center gap-2 px-6 py-6 text-sm font-medium text-ink-500">
            <ArrowPathIcon class="h-5 w-5 animate-spin" aria-hidden="true" />
            Checking your verification status…
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import { useUserStore } from '~/stores/user';
import {
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  HomeIcon,
  ArrowPathIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  IdentificationIcon,
  CheckBadgeIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'
import { createCustomerAuthService } from '~/services/customerAuth/customerAuthService'
import type { ProfessionalProfile, VerificationOptions } from '~/services/customerAuth/customerAuthService'
import { useApi } from '~/composables/useApi'
import { useProfileEmail } from '~/composables/useProfileEmail'
import NotificationPreferences from '~/components/customers/notificationPreferences.vue'
import phoneUtils from '~/utils/phone'

interface AddressSuggestion {
  display_name?: string;
  latitude?: string | number;
  longitude?: string | number;
  [key: string]: unknown;
}

interface ProfileData {
  fname?: string;
  lname?: string;
  email?: string;
  email_verified?: boolean;
  home_address?: string;
  address?: string;
  home_latitude?: number | null;
  home_longitude?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

// TODO: remove once stores/ are .ts
interface UserStoreShape {
  currentUser?: { fname?: string; lname?: string; email?: string; email_verified?: boolean; phone?: string };
  userPhoneNumber?: string;
  getProfile: () => Promise<ProfileData | null>;
  updateProfile: (data: {
    fname: string;
    lname: string;
    email: string;
    current_password?: string;
    home_address: string | null;
    home_latitude: number | null;
    home_longitude: number | null;
  }) => Promise<ProfileData | void>;
  sendEmailVerification: () => Promise<unknown>;
  autocompleteLocation: (query: string) => Promise<AddressSuggestion[]>;
  reverseGeocodeHomeLocation: (lat: number, lng: number) => Promise<{ address?: string }>;
}

const userStore = useUserStore() as unknown as UserStoreShape;
const api = useApi();
const profService = createCustomerAuthService(api);

// Email: verified badge + resend, and the current-password rule for changing it.
// Logic and wording live in useProfileEmail.ts.
const {
  status: emailStatus,
  currentPassword,
  passwordError,
  emailError: emailFieldError,
  notice: emailNotice,
  resendBusy,
  resendCooldown,
  resendMessage,
  load: loadEmailState,
  isChanged: isEmailChanged,
  prepare: prepareEmail,
  applySaved: applySavedEmail,
  explainFailure: explainEmailFailure,
  resend: resendVerification,
} = useProfileEmail({ sendVerification: () => userStore.sendEmailVerification() });

// State
const isLoading = ref<boolean>(false);
const isProfileLoading = ref<boolean>(true);

const errorFieldClass = '!border-red-500 !bg-red-50';

// Shared look for the text fields on this screen.
const fieldClass =
  'min-h-[48px] rounded-lg border-2 border-transparent bg-ink-100 px-4 py-3 text-base font-medium text-ink-900 placeholder-ink-500 transition-colors focus:border-ink-900 focus:bg-white focus:outline-none';
const isLocating = ref<boolean>(false);
const updateSuccess = ref<boolean>(false);
const error = ref<string | null>(null);
const addressSearch = ref<string>('');
const addressSuggestions = ref<AddressSuggestion[]>([]);
const addressActiveIndex = ref<number>(-1);
const autocompleteLoading = ref<boolean>(false);
let addressAutocompleteTimer: ReturnType<typeof setTimeout> | null = null;
let addressAutocompleteSuspend = false;

// Profile form
const profile = reactive<{
  fname: string;
  lname: string;
  email: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}>({
  fname: '',
  lname: '',
  email: '',
  address: '',
  latitude: null,
  longitude: null,
});

const emailIsChanged = computed<boolean>(() => isEmailChanged(profile.email));

// What is saved on the server right now: the starting point for "unsaved changes" and Discard.
const saved = reactive({ ...profile });
const snapshotSaved = (): void => { Object.assign(saved, profile); };

const isDirty = computed<boolean>(() =>
  profile.fname !== saved.fname ||
  profile.lname !== saved.lname ||
  profile.email !== saved.email ||
  profile.address !== saved.address ||
  profile.latitude !== saved.latitude ||
  profile.longitude !== saved.longitude,
);

// Required names, shown at their field.
const fnameError = ref<string>('');
const lnameError = ref<string>('');
watch(() => profile.fname, (v) => { if (v.trim()) fnameError.value = ''; });
watch(() => profile.lname, (v) => { if (v.trim()) lnameError.value = ''; });

// Setting the search box from code must not trigger a search (only typing should).
const setAddressSearch = (value: string): void => {
  if (addressSearch.value !== value) addressAutocompleteSuspend = true;
  addressSearch.value = value;
};

const discardChanges = (): void => {
  Object.assign(profile, saved);
  setAddressSearch(saved.address);
  clearAddressSuggestions();
  fnameError.value = '';
  lnameError.value = '';
  currentPassword.value = '';
  passwordError.value = '';
  error.value = null;
};

// Quick links to each area of this page.
const areas = [
  { label: 'Personal info', href: '#profile-personal', icon: UserIcon },
  { label: 'Sign-in and security', href: '#profile-email', icon: ShieldCheckIcon },
  { label: 'Delivery address', href: '#profile-address', icon: MapPinIcon },
  { label: 'Health professional', href: '#profile-professional', icon: BriefcaseIcon },
];

// Profile completeness: what is done, and what to do next.
const steps = computed(() => [
  { id: 'name', done: Boolean(profile.fname.trim() && profile.lname.trim()), label: 'Add your name', anchor: 'profile-personal' },
  {
    id: 'email',
    done: emailStatus.value === 'verified',
    label: emailStatus.value === 'none' ? 'Add your email' : 'Verify your email',
    anchor: 'profile-email',
  },
  { id: 'address', done: Boolean(profile.address), label: 'Save a home address', anchor: 'profile-address' },
]);
const doneCount = computed<number>(() => steps.value.filter((st) => st.done).length);
const nextSteps = computed(() => steps.value.filter((st) => !st.done));
const allDone = computed<boolean>(() => doneCount.value === steps.value.length);

const profileDisplayName = computed<string>(() => {
  const fullName = `${profile.fname} ${profile.lname}`.trim();
  return fullName || 'Customer Profile';
});

const profileInitials = computed<string>(() => {
  const initials = `${profile.fname[0] ?? ''}${profile.lname[0] ?? ''}`.toUpperCase();
  return initials || 'CP';
});

const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  return phoneUtils.formatForDisplay(phone) || phone;
};

// Load profile data
const loadProfile = async (): Promise<void> => {
  try {
    const profileData = await userStore.getProfile();
    if (profileData) {
      profile.fname = profileData.fname ?? userStore.currentUser?.fname ?? '';
      profile.lname = profileData.lname ?? userStore.currentUser?.lname ?? '';
      profile.email = profileData.email ?? userStore.currentUser?.email ?? '';
      loadEmailState({
        email: profile.email,
        email_verified: profileData.email_verified ?? userStore.currentUser?.email_verified,
      });
      profile.address = profileData.home_address ?? profileData.address ?? '';
      profile.latitude = profileData.home_latitude ?? profileData.latitude ?? null;
      profile.longitude = profileData.home_longitude ?? profileData.longitude ?? null;
      setAddressSearch(profile.address);
      snapshotSaved();
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  } finally {
    isProfileLoading.value = false;
  }
};

const clearAddressSuggestions = (): void => {
  addressSuggestions.value = [];
  addressActiveIndex.value = -1;
  autocompleteLoading.value = false;
};

const onAddressKeydown = (event: KeyboardEvent): void => {
  const count = addressSuggestions.value.length;
  if (!count) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    addressActiveIndex.value = (addressActiveIndex.value + 1) % count;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    addressActiveIndex.value = addressActiveIndex.value <= 0 ? count - 1 : addressActiveIndex.value - 1;
  } else if (event.key === 'Enter' && addressActiveIndex.value >= 0) {
    event.preventDefault();
    applyAddressSuggestion(addressSuggestions.value[addressActiveIndex.value]!);
  } else if (event.key === 'Escape') {
    clearAddressSuggestions();
  }
};

const fetchAddressSuggestions = async (query: string): Promise<void> => {
  const trimmed = String(query).trim();
  if (trimmed.length < 3) {
    clearAddressSuggestions();
    return;
  }

  try {
    autocompleteLoading.value = true;
    const suggestions = await userStore.autocompleteLocation(trimmed);
    addressSuggestions.value = suggestions;
    addressActiveIndex.value = addressSuggestions.value.length > 0 ? 0 : -1;
  } catch (err) {
    console.error('Autocomplete failed:', err);
    addressSuggestions.value = [];
  } finally {
    autocompleteLoading.value = false;
  }
};

const applyAddressSuggestion = (suggestion: AddressSuggestion): void => {
  profile.address = suggestion.display_name ?? '';
  profile.latitude = Number.isFinite(Number(suggestion.latitude)) ? Number(suggestion.latitude) : profile.latitude;
  profile.longitude = Number.isFinite(Number(suggestion.longitude)) ? Number(suggestion.longitude) : profile.longitude;
  setAddressSearch(profile.address);
  clearAddressSuggestions();
};

const reverseGeocode = (latitude: number, longitude: number) =>
  userStore.reverseGeocodeHomeLocation(latitude, longitude);

const captureHomeLocation = (): void => {
  if (!navigator.geolocation) {
    error.value = 'Location is not available in this browser';
    return;
  }

  isLocating.value = true;
  error.value = null;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const result = await reverseGeocode(latitude, longitude);
        profile.latitude = latitude;
        profile.longitude = longitude;
        profile.address = result.address ?? '';
        setAddressSearch(profile.address);
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to generate your home address';
      } finally {
        isLocating.value = false;
      }
    },
    (geoError) => {
      isLocating.value = false;
      if (geoError.code === geoError.PERMISSION_DENIED) {
        error.value = 'Location permission was denied. Allow location access and try again.';
        return;
      }
      error.value = 'Could not get your location right now. Check GPS and try again.';
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
};

const clearHomeLocation = (): void => {
  profile.address = '';
  profile.latitude = null;
  profile.longitude = null;
  setAddressSearch('');
  clearAddressSuggestions();
};

// Save profile
const saveProfile = async (): Promise<void> => {
  fnameError.value = profile.fname.trim() ? '' : 'Enter your first name.';
  lnameError.value = profile.lname.trim() ? '' : 'Enter your last name.';
  if (fnameError.value || lnameError.value) return;

  try {
    isLoading.value = true;
    error.value = null;

    // A changed email needs the current password; an unchanged one is sent as-is.
    const emailFields = prepareEmail(profile.email);
    if (!emailFields) return;
    const emailWasChanged = emailIsChanged.value;
    const wasVerified = emailStatus.value === 'verified';

    const saved = await userStore.updateProfile({
      fname: profile.fname,
      lname: profile.lname,
      ...emailFields,
      home_address: profile.address || null,
      home_latitude: profile.latitude,
      home_longitude: profile.longitude,
    });

    // Take the verified flag from the server. If a response ever omits it, an unchanged
    // address keeps its state and a changed one is, by definition, not yet verified.
    const savedProfile = (saved ?? {}) as ProfileData;
    applySavedEmail(
      {
        email: savedProfile.email ?? profile.email,
        email_verified: savedProfile.email_verified ?? (emailWasChanged ? false : wasVerified),
      },
      emailWasChanged,
    );

    snapshotSaved();
    updateSuccess.value = true;
    setTimeout(() => {
      updateSuccess.value = false;
    }, 3000);
  } catch (err) {
    // Wrong password / invalid email are shown at their own field; the rest in the banner.
    const banner = explainEmailFailure(err);
    error.value = banner || null;
  } finally {
    isLoading.value = false;
  }
};

// Professional verification state
const profApplication = ref<ProfessionalProfile | null>(null);
const profLoading = ref(false);
const profSubmitting = ref(false);
const profError = ref<string | null>(null);
const profSuccess = ref(false);
const profForm = reactive({
  profession_type: '' as '' | 'doctor' | 'pharmacist' | 'nurse' | 'other',
  license_number: '',
  license_body: '',
});

const profStatus = computed(() => profApplication.value?.status ?? null);
const showProfForm = computed(() => profStatus.value === null || profStatus.value === 'rejected');

// SMS verification state
const verificationOptions = ref<VerificationOptions | null>(null);
const otpSending = ref(false);
const otpConfirming = ref(false);
const otpChallengeId = ref<string | null>(null);
const otpPhoneHint = ref<string | null>(null);
const otpCode = ref('');
const otpError = ref<string | null>(null);
const otpConfirmedMessage = ref<string | null>(null);
const otpAutoApproved = ref(false);

const resetOtpState = () => {
  otpSending.value = false;
  otpConfirming.value = false;
  otpChallengeId.value = null;
  otpPhoneHint.value = null;
  otpCode.value = '';
  otpError.value = null;
  otpConfirmedMessage.value = null;
  otpAutoApproved.value = false;
};

const loadProfessionalApplication = async () => {
  profLoading.value = true;
  try {
    const res = await profService.getMyProfessionalApplication() as { data?: ProfessionalProfile | null };
    profApplication.value = res.data ?? null;
    if (profApplication.value) {
      profForm.profession_type = (profApplication.value.profession_type ?? '') as typeof profForm.profession_type;
      profForm.license_number = profApplication.value.license_number ?? '';
      profForm.license_body = profApplication.value.license_body ?? '';
      verificationOptions.value = profApplication.value.verification ?? null;
    } else {
      verificationOptions.value = null;
    }
  } catch {
    profApplication.value = null;
    verificationOptions.value = null;
  } finally {
    profLoading.value = false;
  }
};

const submitProfessionalApplication = async () => {
  if (!profForm.profession_type || !profForm.license_number.trim()) {
    profError.value = 'Profession type and license number are required.';
    return;
  }
  profSubmitting.value = true;
  profError.value = null;
  profSuccess.value = false;
  resetOtpState();
  try {
    await profService.applyForProfessional({
      profession_type: profForm.profession_type,
      license_number: profForm.license_number.trim(),
      license_body: profForm.license_body.trim() || null,
    });
    profSuccess.value = true;
    await loadProfessionalApplication();
  } catch (e: unknown) {
    profError.value = e instanceof Error ? e.message : 'Submission failed. Please try again.';
  } finally {
    profSubmitting.value = false;
  }
};

const sendVerificationOtp = async () => {
  otpSending.value = true;
  otpError.value = null;
  try {
    const res = await profService.sendProfessionalVerificationOtp() as { data?: { challenge_id: string; phone_hint: string | null } };
    otpChallengeId.value = res.data?.challenge_id ?? null;
    otpPhoneHint.value = res.data?.phone_hint ?? null;
  } catch (e: unknown) {
    otpError.value = e instanceof Error ? e.message : 'Could not send the verification code. Please try again.';
  } finally {
    otpSending.value = false;
  }
};

const confirmVerificationOtp = async () => {
  if (!otpChallengeId.value || otpCode.value.trim().length !== 6) return;
  otpConfirming.value = true;
  otpError.value = null;
  try {
    const res = await profService.confirmProfessionalVerificationOtp({
      challengeId: otpChallengeId.value,
      code: otpCode.value.trim(),
    }) as { data?: { auto_approved: boolean; message: string } };
    otpConfirmedMessage.value = res.data?.message ?? 'Verification complete.';
    otpAutoApproved.value = !!res.data?.auto_approved;
    if (otpAutoApproved.value) {
      await loadProfessionalApplication();
    }
  } catch (e: unknown) {
    otpError.value = e instanceof Error ? e.message : 'Invalid or expired code. Please try again.';
  } finally {
    otpConfirming.value = false;
  }
};

// Initialize
onMounted(() => {
  void loadProfile();
  void loadProfessionalApplication();
});

onUnmounted(() => {
  if (addressAutocompleteTimer) {
    clearTimeout(addressAutocompleteTimer);
    addressAutocompleteTimer = null;
  }
});

watch(addressSearch, (value) => {
  if (addressAutocompleteSuspend) {
    addressAutocompleteSuspend = false;
    return;
  }

  if (addressAutocompleteTimer) {
    clearTimeout(addressAutocompleteTimer);
    addressAutocompleteTimer = null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    clearAddressSuggestions();
    return;
  }

  addressAutocompleteTimer = setTimeout(() => {
    void fetchAddressSuggestions(trimmed);
  }, 300);
});
</script>

