<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto bg-gradient-to-br from-white via-purple-50 to-purple-100">
    <!-- Background sparkle decorations -->
    <svg class="absolute top-10 left-12 w-6 h-6 text-purple-400 opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>
    <svg class="absolute top-1/4 right-16 w-10 h-10 text-purple-300 opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>
    <svg class="absolute bottom-20 left-1/4 w-8 h-8 text-fuchsia-300 opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>
    <svg class="absolute bottom-12 right-20 w-5 h-5 text-purple-200 opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>
    <svg class="absolute top-1/3 left-1/3 w-4 h-4 text-purple-300 opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
    </svg>

    <!-- Modal Container -->
    <div class="bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md mx-4 overflow-hidden">

      <!-- Modal Header -->
      <div class="bg-gradient-to-br from-[#2A1130] to-[#5A2468] text-white py-8 px-6 text-center relative overflow-hidden">
        <!-- Header background sparkle -->
        <svg class="absolute -top-4 -right-4 w-24 h-24 text-white opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
        </svg>
        <svg class="absolute -bottom-6 -left-6 w-28 h-28 text-fuchsia-300 opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
        </svg>

        <!-- Rig Mark logo -->
        <img src="/brand/rig-mark.svg" alt="Rigelis" class="w-16 h-16 mx-auto mb-4" />

        <h3 class="text-lg font-semibold tracking-wide">
          {{ currentView === 'login' ? 'Rigelis Admin Portal' : currentView === 'mfa' ? (mfaMethod === 'webauthn' ? 'Passkey Authentication' : 'Two-Factor Authentication') : 'Reset Password' }}
        </h3>
        <p class="text-purple-200 text-sm mt-1">
          {{ currentView === 'login' ? 'Sign in to access the admin dashboard' : currentView === 'mfa' ? (mfaMethod === 'webauthn' ? 'Authenticate with your registered passkey' : 'Verify your identity to continue') : 'Reset your admin password' }}
        </p>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ errorMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{{ successMessage }}</p>
            </div>
          </div>
        </div>

        <!-- MFA Step: WebAuthn passkey, TOTP, or SMS-OTP -->
        <div v-if="currentView === 'mfa'">

          <!-- WebAuthn passkey flow -->
          <template v-if="mfaMethod === 'webauthn'">
            <div class="mb-4 text-sm text-gray-600 bg-purple-50 border border-purple-100 p-3 rounded-lg">
              <p>Use your registered passkey (fingerprint, face, or security key) to continue.</p>
            </div>
            <div class="mt-6">
              <button type="button" @click="handleWebAuthnAuth" :disabled="isLoading"
                class="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                <span v-if="isLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying passkey...
                </span>
                <span v-else class="flex items-center gap-2">
                  <!-- Key icon -->
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  Use Passkey
                </span>
              </button>
            </div>
            <div class="mt-3 text-center">
              <button type="button" @click="showLoginForm" class="text-sm text-gray-500 hover:text-gray-700">Back to login</button>
            </div>
          </template>

          <!-- TOTP input -->
          <template v-else-if="mfaMethod === 'totp'">
            <div class="mb-3 text-sm text-gray-600 bg-purple-50 border border-purple-100 p-3 rounded-lg">
              <p>Enter the 6-digit code from your authenticator app.</p>
            </div>
            <div class="mb-4">
              <label for="totpCode" class="block text-sm font-medium text-gray-700 mb-1">Authenticator Code</label>
              <input
                v-model="mfaCode"
                type="text"
                id="totpCode"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                pattern="[0-9]{6}"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 tracking-widest text-center text-lg font-mono"
                placeholder="000000"
                :disabled="isLoading"
              />
            </div>
            <div class="mt-6">
              <button type="button" @click="handleMfaSubmit" :disabled="isLoading || mfaCode.length < 6"
                class="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors">
                <span v-if="isLoading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
                <span v-else>Verify Code</span>
              </button>
            </div>
            <div class="mt-3 text-center">
              <button type="button" @click="showLoginForm" class="text-sm text-gray-500 hover:text-gray-700">Back to login</button>
            </div>
          </template>

          <!-- SMS-OTP input (existing behaviour — placeholder; wired via adminStore SMS action) -->
          <template v-else>
            <div class="mb-3 text-sm text-gray-600 bg-purple-50 border border-purple-100 p-3 rounded-lg">
              <p>A verification code was sent to <strong>{{ mfaPhoneHint }}</strong>. Enter it below.</p>
            </div>
            <div class="mb-4">
              <label for="smsOtp" class="block text-sm font-medium text-gray-700 mb-1">SMS Verification Code</label>
              <input
                v-model="mfaCode"
                type="text"
                id="smsOtp"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                pattern="[0-9]{6}"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 tracking-widest text-center text-lg font-mono"
                placeholder="000000"
                :disabled="isLoading"
              />
            </div>
            <div class="mt-6">
              <button type="button" @click="handleMfaSubmit" :disabled="isLoading || mfaCode.length < 6"
                class="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors">
                <span v-if="isLoading">Verifying...</span>
                <span v-else>Verify Code</span>
              </button>
            </div>
            <div class="mt-3 text-center">
              <button type="button" @click="showLoginForm" class="text-sm text-gray-500 hover:text-gray-700">Back to login</button>
            </div>
          </template>
        </div>

        <!-- Login Form -->
        <form v-if="currentView === 'login'" @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input v-model="username" type="text" id="username"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="Enter your username" required :disabled="isLoading" />
          </div>

          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input v-model="password" type="password" id="password"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="Enter your password" required :disabled="isLoading" />
          </div>

          <div class="mt-6">
            <button type="submit" :disabled="isLoading"
              class="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors">
              <span v-if="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                Signing in...
              </span>
              <span v-else class="flex items-center gap-2">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50 5 L58 42 L95 50 L58 58 L50 95 L42 58 L5 50 L42 42 Z" />
                </svg>
                Sign In
              </span>
            </button>
          </div>
        </form>

        <!-- Password Reset Form -->
        <form v-else-if="currentView === 'reset'" @submit.prevent="handlePasswordReset">
          <div class="mb-4 text-sm text-gray-600 bg-purple-50 border border-purple-100 p-3 rounded-lg">
            <p>Enter your admin username or email to receive reset instructions</p>
          </div>

          <div class="mb-4">
            <label for="resetIdentifier" class="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
            <input v-model="resetIdentifier" type="text" id="resetIdentifier"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              placeholder="Enter your username or email" required :disabled="isLoading" />
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" @click="showLoginForm" :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Back to Login
            </button>
            <button type="submit" :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 flex items-center transition-colors">
              <span v-if="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                Sending...
              </span>
              <span v-else>Send Reset Instructions</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdminStore } from '~/stores/admin';

// Define layout
definePageMeta({
  layout: false, // No layout for login page
});

// TODO: remove once stores/ are .ts
interface AdminStoreShape {
  isAuthenticated: boolean;
  getDashboardRoute: string;
  getRole: string;
  login: (username: string, password: string) => Promise<{
    success: boolean;
    mfaRequired?: boolean;
    mfaMethod?: string;
    challengeId?: string;
    phoneHint?: string;
    message?: string;
  }>;
  getWebAuthnAuthOptions: (username: string) => Promise<{
    success: boolean;
    challenge_id?: string;
    options?: Record<string, unknown>;
    message?: string;
  } | null>;
  verifyWebAuthnAuth: (challengeId: string, assertion: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
  verifyMfaTotp: (opts: { challengeId: string; code: string }) => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (identifier: string) => Promise<{ success: boolean; message?: string }>;
}

const adminStore = useAdminStore() as unknown as AdminStoreShape;

// Form state
const currentView = ref<'login' | 'mfa' | 'reset'>('login');
const username = ref<string>('');
const password = ref<string>('');
const resetIdentifier = ref<string>('');
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');
const successMessage = ref<string>('');

// MFA state — populated when the login endpoint returns a 202 challenge.
const mfaMethod = ref<string>('sms');    // 'webauthn' | 'totp' | 'sms'
const mfaChallengeId = ref<string>('');
const mfaPhoneHint = ref<string>('');
const mfaCode = ref<string>('');
// Captured at login time so the WebAuthn flow can fetch options using the
// username without requiring a separate form field.
const pendingUsername = ref<string>('');

// Check if already logged in
onMounted(() => {
  if (adminStore.isAuthenticated) {
    void navigateTo('/admin/data');
  }
});

// Show reset password form
const showResetForm = (): void => {
  currentView.value = 'reset';
  errorMessage.value = '';
  successMessage.value = '';
  resetIdentifier.value = '';
};

// Show login form and clear all transient state
const showLoginForm = (): void => {
  currentView.value = 'login';
  errorMessage.value = '';
  successMessage.value = '';
  username.value = '';
  password.value = '';
  mfaCode.value = '';
  mfaChallengeId.value = '';
  mfaPhoneHint.value = '';
  pendingUsername.value = '';
};

// Shared redirect helper used after successful authentication.
const redirectAfterLogin = (): void => {
  const dashboardRoute = adminStore.getDashboardRoute;
  const message = adminStore.getRole === 'data_consumer'
    ? 'Logging into Data Consumer Portal...'
    : 'Logging into Admin Portal...';
  successMessage.value = message;

  setTimeout(() => {
    const intendedRoute = localStorage.getItem('adminIntendedRoute');
    if (intendedRoute) {
      localStorage.removeItem('adminIntendedRoute');
      void navigateTo(intendedRoute);
    } else {
      void navigateTo(dashboardRoute);
    }
  }, 1000);
};

// Handle login. The store returns one of three shapes:
//   { success: true }                — fully authenticated → redirect
//   { success: false, mfaRequired: true, mfaMethod, challengeId, phoneHint? }
//                                    — show MFA step
//   { success: false, message }      — bad credentials → show error
const handleLogin = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  try {
    const result = await adminStore.login(username.value, password.value);

    if (result.success) {
      redirectAfterLogin();
    } else if (result.mfaRequired) {
      // Stash challenge data and switch to the MFA view.
      mfaMethod.value = result.mfaMethod ?? 'sms';
      mfaChallengeId.value = result.challengeId ?? '';
      mfaPhoneHint.value = result.phoneHint ?? '';
      mfaCode.value = '';
      // Capture the username for the WebAuthn options request.
      pendingUsername.value = username.value;
      errorMessage.value = '';
      currentView.value = 'mfa';
    } else {
      errorMessage.value = result.message ?? 'Invalid credentials';
    }
  } catch (error) {
    errorMessage.value = 'An error occurred. Please try again.';
    console.error('Login error:', error);
  } finally {
    isLoading.value = false;
  }
};

// WebAuthn login completion.
//
// Threat note: navigator.credentials.get() enforces origin binding at the
// browser level before returning the assertion. An assertion obtained from a
// phishing domain will be rejected by the backend's expectedOrigin check.
// The two-step structure (options -> get -> verify) is required by the
// WebAuthn spec — there is no shortcut.
const handleWebAuthnAuth = async (): Promise<void> => {
  if (!pendingUsername.value) {
    errorMessage.value = 'Username not available. Please go back and log in again.';
    return;
  }
  errorMessage.value = '';
  isLoading.value = true;

  try {
    // Step 1: Fetch authentication options from the backend.
    const optionsResponse = await adminStore.getWebAuthnAuthOptions(pendingUsername.value);
    if (!optionsResponse || !optionsResponse.success) {
      errorMessage.value = optionsResponse?.message ?? 'Failed to get passkey options.';
      return;
    }

    const challengeId = optionsResponse.challenge_id ?? '';
    const options = optionsResponse.options as {
      challenge: string;
      allowCredentials?: Array<{ id: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };

    // Decode base64url challenge to ArrayBuffer for the browser API.
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      ...(options as unknown as PublicKeyCredentialRequestOptions),
      challenge: base64urlToBuffer(options.challenge),
      allowCredentials: (options.allowCredentials ?? []).map((c) => ({
        ...c,
        id: base64urlToBuffer(c.id),
        type: 'public-key' as const,
      })),
    };

    // Step 2: Invoke the platform authenticator.
    let credential: Credential | null;
    try {
      credential = await navigator.credentials.get({ publicKey: publicKeyOptions });
    } catch (browserErr) {
      const err = browserErr as DOMException;
      if (err.name === 'NotAllowedError') {
        errorMessage.value = 'Passkey prompt was dismissed. Please try again.';
      } else {
        errorMessage.value = err.message || 'Passkey authentication failed.';
      }
      return;
    }

    if (!credential) {
      errorMessage.value = 'No passkey credential returned. Please try again.';
      return;
    }

    // Step 3: Serialize the assertion for the backend.
    const pkCredential = credential as PublicKeyCredential;
    const authResponse = pkCredential.response as AuthenticatorAssertionResponse;
    const assertionResponse = {
      id: pkCredential.id,
      rawId: bufferToBase64url(pkCredential.rawId),
      type: pkCredential.type,
      response: {
        clientDataJSON: bufferToBase64url(authResponse.clientDataJSON),
        authenticatorData: bufferToBase64url(authResponse.authenticatorData),
        signature: bufferToBase64url(authResponse.signature),
        userHandle: authResponse.userHandle
          ? bufferToBase64url(authResponse.userHandle)
          : null,
      },
    };

    // Step 4: Verify on the backend, mint tokens.
    const result = await adminStore.verifyWebAuthnAuth(challengeId, assertionResponse);
    if (result.success) {
      redirectAfterLogin();
    } else {
      errorMessage.value = result.message ?? 'Passkey verification failed.';
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred. Please try again.';
    console.error('WebAuthn auth error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Utility: decode a base64url string to an ArrayBuffer.
const base64urlToBuffer = (base64url: string): ArrayBuffer => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
};

// Utility: encode an ArrayBuffer to a base64url string.
const bufferToBase64url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Verify the MFA code. For TOTP: POST /api/auth/mfa/totp/verify via the store.
// SMS OTP verification will be wired in a follow-up (Batch B Sprint 2 SMS path).
const handleMfaSubmit = async (): Promise<void> => {
  if (!mfaCode.value || mfaCode.value.length < 6) return;
  errorMessage.value = '';
  isLoading.value = true;

  try {
    let result: { success: boolean; message?: string };
    if (mfaMethod.value === 'totp') {
      result = await adminStore.verifyMfaTotp({
        challengeId: mfaChallengeId.value,
        code: mfaCode.value,
      });
    } else {
      // SMS path: placeholder — should call the SMS verify store action.
      // Kept consistent so this handler is the single branch point.
      result = { success: false, message: 'SMS MFA verify not yet wired in this UI.' };
    }

    if (result.success) {
      redirectAfterLogin();
    } else {
      errorMessage.value = result.message ?? 'Verification failed. Please try again.';
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred. Please try again.';
    console.error('MFA verify error:', error);
  } finally {
    isLoading.value = false;
  }
};

// Handle password reset
const handlePasswordReset = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  try {
    const result = await adminStore.requestPasswordReset(resetIdentifier.value);

    if (result.success) {
      successMessage.value = result.message ?? 'Reset instructions sent! Please check your email.';

      // Wait and return to login
      setTimeout(() => {
        showLoginForm();
      }, 3000);
    } else {
      errorMessage.value = result.message ?? 'Failed to send reset instructions';
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred. Please try again.';
    console.error('Password reset error:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
