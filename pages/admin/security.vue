<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Account Security</h1>
      <p class="text-sm text-gray-500 mt-1">Manage passkeys and two-factor authentication for your super_admin account.</p>
    </div>

    <!-- Access guard: only super_admin sees this page -->
    <div v-if="!isSuperAdmin" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
      Passkey management is available for super_admin accounts only.
    </div>

    <template v-else>
      <!-- Login flow status banner -->
      <div
        :class="credentials.length > 0
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-blue-50 border-blue-200 text-blue-800'"
        class="border rounded-xl px-5 py-4 mb-5 flex items-start gap-3"
      >
        <svg class="w-5 h-5 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path v-if="credentials.length > 0" stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div class="text-sm">
          <p v-if="credentials.length > 0" class="font-semibold mb-0.5">Passkey active — your login is upgraded</p>
          <p v-else class="font-semibold mb-0.5">Your current login uses SMS verification</p>
          <p v-if="credentials.length > 0">
            Your next login will ask for your <strong>device PIN, fingerprint, or face</strong> instead of an SMS code.
            No signal required, and no SMS code to wait for.
          </p>
          <p v-else>
            After each password you enter, we send a 6-digit code to your registered phone.
            Add a passkey below to replace that step with a faster, more secure device unlock.
          </p>
        </div>
      </div>

      <!-- Passkey registration section -->
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div class="px-6 py-5 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-gray-900">Passkeys</h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Optional upgrade — replaces SMS codes with your device's built-in unlock (fingerprint, PIN, or face).
              </p>
            </div>
            <button
              @click="startRegistration"
              :disabled="registering"
              class="px-4 py-2 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 transition-colors"
            >
              {{ registering ? 'Registering...' : 'Add Passkey' }}
            </button>
          </div>
        </div>

        <!-- Registration feedback -->
        <div v-if="registrationError" class="mx-6 mt-4 bg-red-50 border-l-4 border-red-400 p-3 rounded text-red-700 text-sm">
          {{ registrationError }}
        </div>
        <div v-if="registrationSuccess" class="mx-6 mt-4 bg-green-50 border-l-4 border-green-400 p-3 rounded text-green-700 text-sm">
          {{ registrationSuccess }}
        </div>

        <!-- Friendly name input (shown while registering) -->
        <div v-if="awaitingFriendlyName" class="px-6 py-4 border-t border-gray-100">
          <label class="block text-sm font-medium text-gray-700 mb-1">Passkey name (optional)</label>
          <div class="flex gap-2">
            <input
              v-model="friendlyName"
              type="text"
              maxlength="128"
              placeholder="e.g. YubiKey 5, MacBook Touch ID"
              class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
            <button
              @click="confirmRegistration"
              :disabled="confirming"
              class="px-4 py-2 text-sm font-medium text-white bg-[#5A2468] hover:bg-[#4A1A55] rounded-lg disabled:opacity-50 transition-colors"
            >
              {{ confirming ? 'Saving...' : 'Save' }}
            </button>
            <button
              @click="cancelRegistration"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Credential list -->
        <div class="divide-y divide-gray-100">
          <div v-if="loadingCredentials" class="px-6 py-4 text-sm text-gray-500">
            Loading passkeys...
          </div>

          <!-- Empty state with benefits -->
          <div v-else-if="credentials.length === 0" class="px-6 py-5">
            <p class="text-sm text-gray-500 mb-4">No passkeys registered yet.</p>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-gray-50 rounded-lg px-3 py-3 text-center">
                <p class="text-xs font-semibold text-gray-700 mb-0.5">No SMS wait</p>
                <p class="text-xs text-gray-500">Instant unlock — no code to receive or type</p>
              </div>
              <div class="bg-gray-50 rounded-lg px-3 py-3 text-center">
                <p class="text-xs font-semibold text-gray-700 mb-0.5">Works offline</p>
                <p class="text-xs text-gray-500">No signal needed — the key lives on your device</p>
              </div>
              <div class="bg-gray-50 rounded-lg px-3 py-3 text-center">
                <p class="text-xs font-semibold text-gray-700 mb-0.5">Phishing-proof</p>
                <p class="text-xs text-gray-500">Only works on the real portal — fakes can't steal it</p>
              </div>
            </div>
          </div>

          <div
            v-for="cred in credentials"
            :key="cred.id"
            class="px-6 py-4 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <!-- Key icon -->
              <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ cred.friendlyName || 'Unnamed passkey' }}</p>
                <p class="text-xs text-gray-500">
                  Added {{ formatDate(cred.createdAt) }}
                  <template v-if="cred.lastUsedAt"> &middot; Last used {{ formatDate(cred.lastUsedAt) }}</template>
                  <template v-if="cred.transports && cred.transports.length"> &middot; {{ cred.transports.join(', ') }}</template>
                </p>
              </div>
            </div>
            <button
              @click="removeCredential(cred.id)"
              :disabled="removingId === cred.id"
              class="text-sm text-red-600 hover:text-red-800 disabled:opacity-40 transition-colors"
            >
              {{ removingId === cred.id ? 'Removing...' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer note -->
      <div class="text-xs text-gray-400 mt-2 space-y-1">
        <p>Passkeys are bound to this browser and device. If you remove all passkeys, login falls back to SMS verification.</p>
        <p>Register passkeys on each device you log in from — they do not sync across devices automatically.</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '~/stores/admin';

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout',
});

interface Credential {
  id: string | number;
  friendlyName?: string;
  createdAt?: string;
  lastUsedAt?: string;
  transports?: string[];
}

// TODO: remove once stores/ are .ts
interface AdminStoreShape {
  isSuperAdmin: boolean;
  listWebAuthnCredentials: () => Promise<{ credentials?: Credential[] }>;
  getWebAuthnRegistrationOptions: () => Promise<{
    success: boolean;
    challenge_id?: string;
    options?: {
      challenge: string;
      user: { id: string | ArrayBuffer; [key: string]: unknown };
      excludeCredentials?: Array<{ id: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };
    message?: string;
  } | null>;
  verifyWebAuthnRegistration: (
    challengeId: string,
    attestation: Record<string, unknown>,
    name: string | null
  ) => Promise<{ success: boolean; message?: string }>;
  deleteWebAuthnCredential: (id: string | number) => Promise<{ success: boolean }>;
}

const adminStore = useAdminStore() as unknown as AdminStoreShape;

const isSuperAdmin = computed<boolean>(() => adminStore.isSuperAdmin);

// Credential list state
const credentials = ref<Credential[]>([]);
const loadingCredentials = ref<boolean>(false);

// Registration state
const registering = ref<boolean>(false);   // true while browser prompt is open (disables Add Passkey)
const confirming = ref<boolean>(false);    // true while POST /register/verify is in flight (disables Save)
const registrationError = ref<string>('');
const registrationSuccess = ref<string>('');
const awaitingFriendlyName = ref<boolean>(false);
const friendlyName = ref<string>('');
// Stash the pending attestation so the user can name it before we POST.
const pendingChallengeId = ref<string>('');
const pendingAttestation = ref<Record<string, unknown> | null>(null);

// Remove state
const removingId = ref<string | number | null>(null);

onMounted(async () => {
  if (isSuperAdmin.value) {
    await loadCredentials();
  }
});

const loadCredentials = async (): Promise<void> => {
  loadingCredentials.value = true;
  try {
    const data = await adminStore.listWebAuthnCredentials();
    credentials.value = data.credentials ?? [];
  } catch (err) {
    console.error('Failed to load passkeys:', err instanceof Error ? err.message : String(err));
  } finally {
    loadingCredentials.value = false;
  }
};

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

// Step 1: Fetch registration options, invoke the browser API, stash the result.
const startRegistration = async (): Promise<void> => {
  registrationError.value = '';
  registrationSuccess.value = '';
  awaitingFriendlyName.value = false;
  friendlyName.value = '';
  pendingAttestation.value = null;
  registering.value = true;

  try {
    // Get registration options from the backend.
    const optionsResponse = await adminStore.getWebAuthnRegistrationOptions();
    if (!optionsResponse || !optionsResponse.success) {
      registrationError.value = optionsResponse?.message ?? 'Failed to get registration options.';
      return;
    }

    const { challenge_id: challengeId, options } = optionsResponse;
    if (!challengeId || !options) {
      registrationError.value = 'Invalid registration options returned.';
      return;
    }
    pendingChallengeId.value = challengeId;

    // Decode base64url fields to ArrayBuffers for the browser API.
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      ...(options as unknown as PublicKeyCredentialCreationOptions),
      challenge: base64urlToBuffer(options.challenge as string),
      user: {
        ...(options.user as unknown as PublicKeyCredentialUserEntity),
        id: base64urlToBuffer(
          typeof options.user['id'] === 'string'
            ? options.user['id']
            : bufferToBase64url(options.user['id'] as ArrayBuffer)
        ),
      },
      excludeCredentials: ((options.excludeCredentials ?? []) as Array<{ id: string; [key: string]: unknown }>).map((c) => ({
        ...(c as unknown as PublicKeyCredentialDescriptor),
        id: base64urlToBuffer(c['id'] as string),
      })),
    };

    // Invoke the platform authenticator.
    let credential: Credential | null = null;
    try {
      const result = await navigator.credentials.create({ publicKey: publicKeyOptions });
      credential = result as unknown as Credential | null;
    } catch (browserErr) {
      const err = browserErr as DOMException;
      if (err.name === 'NotAllowedError') {
        registrationError.value = 'Passkey prompt was dismissed. Please try again.';
      } else if (err.name === 'InvalidStateError') {
        registrationError.value = 'This authenticator is already registered.';
      } else {
        registrationError.value = err.message || 'Passkey creation failed.';
      }
      return;
    }

    if (!credential) {
      registrationError.value = 'No credential returned. Please try again.';
      return;
    }

    // Serialize to JSON-safe shape. Cast through unknown since we typed
    // credential as Credential for the remove-list, but here it is a
    // PublicKeyCredential from the browser API.
    const pkCred = credential as unknown as PublicKeyCredential;
    const attestationResponse = pkCred.response as AuthenticatorAttestationResponse;
    pendingAttestation.value = {
      id: pkCred.id,
      rawId: bufferToBase64url(pkCred.rawId),
      type: pkCred.type,
      response: {
        clientDataJSON: bufferToBase64url(attestationResponse.clientDataJSON),
        attestationObject: bufferToBase64url(attestationResponse.attestationObject),
        transports: typeof attestationResponse.getTransports === 'function'
          ? attestationResponse.getTransports()
          : [],
      },
    };

    // Show friendly name input before persisting.
    awaitingFriendlyName.value = true;
  } catch (err) {
    registrationError.value = err instanceof Error ? err.message : 'An error occurred. Please try again.';
    console.error('WebAuthn registration error:', err);
  } finally {
    // Keep registering=true while awaitingFriendlyName to disable the Add Passkey button.
    if (!awaitingFriendlyName.value) {
      registering.value = false;
    }
  }
};

// Step 2: User has (optionally) typed a name — submit to the backend.
const confirmRegistration = async (): Promise<void> => {
  if (!pendingAttestation.value || !pendingChallengeId.value) return;
  confirming.value = true;
  registrationError.value = '';

  try {
    const data = await adminStore.verifyWebAuthnRegistration(
      pendingChallengeId.value,
      pendingAttestation.value,
      friendlyName.value.trim() || null
    );

    if (data && data.success) {
      registrationSuccess.value = 'Passkey registered successfully.';
      awaitingFriendlyName.value = false;
      pendingAttestation.value = null;
      pendingChallengeId.value = '';
      friendlyName.value = '';
      await loadCredentials();
      setTimeout(() => { registrationSuccess.value = ''; }, 4000);
    } else {
      registrationError.value = (data && data.message) ?? 'Registration failed.';
    }
  } catch (err) {
    registrationError.value = err instanceof Error ? err.message : 'Registration failed.';
  } finally {
    confirming.value = false;
    registering.value = false;
  }
};

const cancelRegistration = (): void => {
  awaitingFriendlyName.value = false;
  pendingAttestation.value = null;
  pendingChallengeId.value = '';
  friendlyName.value = '';
  registering.value = false;
};

// ---------------------------------------------------------------------------
// Removal
// ---------------------------------------------------------------------------

const removeCredential = async (id: string | number): Promise<void> => {
  if (!confirm('Remove this passkey? You will no longer be able to use it to sign in.')) return;
  removingId.value = id;
  try {
    const data = await adminStore.deleteWebAuthnCredential(id);
    if (data && data.success) {
      credentials.value = credentials.value.filter((c) => c.id !== id);
    }
  } catch (err) {
    console.error('Failed to remove passkey:', err instanceof Error ? err.message : String(err));
  } finally {
    removingId.value = null;
  }
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return dateStr;
  }
};

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

const bufferToBase64url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};
</script>
