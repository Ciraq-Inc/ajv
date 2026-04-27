<template>
  <div class="w-full pb-12">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 mb-4">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div>
                <h1 class="text-lg font-bold text-zinc-900 tracking-tight">Profile Information</h1>
                <p class="text-xs text-zinc-500 font-medium mt-0.5">Update personal details and saved locations</p>
            </div>
        </div>
    </header>

    <div class="max-w-3xl">
      <!-- Success Alert -->
      <div v-if="updateSuccess" class="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 mb-5 text-sm font-semibold shadow-sm">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[18px]">check_circle</span>
          Profile updated successfully!
        </div>
        <button @click="updateSuccess = false" class="text-emerald-500 hover:text-emerald-700">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-5 text-sm font-semibold shadow-sm">
        <span class="material-symbols-outlined text-[18px]">error</span>
        {{ error }}
      </div>

      <!-- Summary card -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-zinc-200 bg-white shadow-sm px-5 py-5 mb-5 items-start">
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <div class="w-14 h-14 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-900 font-black flex items-center justify-center text-lg flex-shrink-0 shadow-sm">{{ profileInitials }}</div>
          <div class="min-w-0">
            <p class="text-lg font-bold text-zinc-900 leading-tight truncate">{{ profileDisplayName }}</p>
            <p class="text-sm font-semibold text-zinc-500 mt-0.5 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">phone_iphone</span>
              {{ formatPhoneNumber(userStore.userPhoneNumber) || 'No phone number' }}
            </p>
          </div>
        </div>
        <div class="flex-shrink-0">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]"
            :class="profile.address ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'"
          >
            <span class="material-symbols-outlined text-[14px]">{{ profile.address ? 'my_location' : 'location_off' }}</span>
            {{ profile.address ? 'Location Saved' : 'Location Needed' }}
          </span>
        </div>
      </div>

      <!-- Profile Form -->
      <div class="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <form @submit.prevent="saveProfile">
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <!-- First Name -->
              <div class="flex flex-col gap-1.5">
                <label for="fname" class="text-sm font-semibold text-zinc-700">First Name</label>
                <input v-model="profile.fname" type="text" id="fname" placeholder="Enter first name" required
                  class="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 font-semibold text-zinc-900 transition-shadow" />
              </div>

              <!-- Last Name -->
              <div class="flex flex-col gap-1.5">
                <label for="lname" class="text-sm font-semibold text-zinc-700">Last Name</label>
                <input v-model="profile.lname" type="text" id="lname" placeholder="Enter last name" required
                  class="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 font-semibold text-zinc-900 transition-shadow" />
              </div>

              <!-- Email -->
              <div class="flex flex-col gap-1.5">
                <label for="email" class="text-sm font-semibold text-zinc-700">Email Address</label>
                <input v-model="profile.email" type="email" id="email" placeholder="Enter email address"
                  class="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40 font-semibold text-zinc-900 transition-shadow" />
              </div>

              <!-- Phone (Read-only) -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label for="phone" class="text-sm font-semibold text-zinc-700">Phone Number</label>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Locked</span>
                </div>
                <input :value="formatPhoneNumber(userStore.userPhoneNumber)" type="text" id="phone" disabled
                  class="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-500 cursor-not-allowed" />
              </div>
            </div>
          </div>

          <!-- Home Location section separated by border -->
          <div class="border-t border-zinc-200 bg-zinc-50/50 p-6">
            <div class="flex flex-col gap-3">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">home</span>
                    Saved Home Address
                  </p>
                  <p class="text-xs font-medium text-zinc-500 mt-1">Used by default for delivery requests until you manually change it on the request screen.</p>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" :disabled="isLocating" @click="captureHomeLocation"
                    class="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    <span v-if="isLocating" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    <span v-else class="material-symbols-outlined text-[16px]">my_location</span>
                    <template v-if="isLocating">Finding GPS...</template>
                    <template v-else-if="profile.latitude && profile.longitude">Update GPS</template>
                    <template v-else>Set from GPS</template>
                  </button>
                  <button
                    v-if="profile.address || (profile.latitude && profile.longitude)"
                    type="button" :disabled="isLoading || isLocating"
                    @click="clearHomeLocation"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-60"
                    title="Clear location">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              <div class="relative">
                <label class="block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 mb-2">Search address</label>
                <div class="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-[#4F217A]/40 focus-within:ring-2 focus-within:ring-[#4F217A]/10">
                  <span class="material-symbols-outlined text-[18px] text-zinc-400">search</span>
                  <input
                    v-model="addressSearch"
                    type="text"
                    placeholder="Type an address, landmark, or area"
                    class="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                  <span v-if="autocompleteLoading" class="material-symbols-outlined text-[18px] text-zinc-400 animate-spin">sync</span>
                </div>

                <div
                  v-if="addressSuggestions.length"
                  class="absolute left-0 right-0 top-[calc(100%+0.65rem)] z-20 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl max-h-60 overflow-y-auto overscroll-contain"
                >
                  <div class="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">
                    <span>Suggestions</span>
                    <span>{{ addressSuggestions.length }}</span>
                  </div>
                  <button
                    v-for="(suggestion, index) in addressSuggestions"
                    :key="`${suggestion.display_name}-${index}`"
                    type="button"
                    class="w-full border-b border-zinc-100 px-4 py-3.5 text-left last:border-b-0 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                    @click="applyAddressSuggestion(suggestion)"
                  >
                    <p class="text-sm font-semibold text-zinc-900 line-clamp-2">{{ suggestion.display_name }}</p>
                    <p class="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">{{ suggestion.type || 'Address' }}</p>
                  </button>
                </div>
              </div>

              <div
                class="rounded-xl px-4 py-3 text-sm transition-colors mt-2"
                :class="profile.address ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-zinc-200'"
              >
                <p class="font-bold border-b pb-2 mb-2" :class="profile.address ? 'text-emerald-800 border-emerald-100/50' : 'text-zinc-800 border-zinc-100'">
                  {{ profile.address ? 'Location Successfully Saved' : 'No Location Set' }}
                </p>
                <div class="flex items-start gap-2">
                  <span class="material-symbols-outlined text-[16px] mt-0.5" :class="profile.address ? 'text-emerald-500' : 'text-zinc-400'">
                    {{ profile.address ? 'check_circle' : 'info' }}
                  </span>
                  <p class="text-xs font-medium leading-relaxed" :class="profile.address ? 'text-emerald-700' : 'text-zinc-500'">
                    {{ profile.address || 'Tap "Set from GPS" above to automatically link your current physical coordinates. We rely on GPS logic for optimal driver assignment.' }}
                  </p>
                </div>
                
                <div v-if="profile.latitude && profile.longitude" class="flex gap-4 mt-3 pt-2 border-t border-emerald-100/50 text-[10px] font-black uppercase tracking-widest" :class="profile.address ? 'text-emerald-600/70' : 'text-zinc-400'">
                  <span>Lat: {{ Number(profile.latitude).toFixed(6) }}</span>
                  <span>Lng: {{ Number(profile.longitude).toFixed(6) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="border-t border-zinc-200 bg-white p-5 flex justify-end">
            <button type="submit" :disabled="isLoading"
              class="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white py-2.5 px-6 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
              <span v-if="isLoading" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
              {{ isLoading ? 'Saving Profile...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Change Password Section -->
    <!-- <div class="card" style="margin-top: 24px;">
      <div class="section-header">
        <h3>Change Password</h3>
        <p class="section-description">Update your account password</p>
      </div>

      <div v-if="passwordSuccess" class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Password changed successfully!</span>
      </div>

      <form @submit.prevent="changePassword">
        <div class="form-group">
          <label for="currentPassword">Current Password</label>
          <input v-model="passwordForm.currentPassword" type="password" id="currentPassword" class="form-input"
            placeholder="Enter current password" required />
        </div>

        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input v-model="passwordForm.newPassword" type="password" id="newPassword" class="form-input"
            placeholder="Enter new password" required minlength="6" />
          <p class="field-hint">Password must be at least 6 characters</p>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input v-model="passwordForm.confirmPassword" type="password" id="confirmPassword" class="form-input"
            placeholder="Confirm new password" required />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-secondary" :disabled="isChangingPassword">
            <svg v-if="isChangingPassword" class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <span v-else>Change Password</span>
          </button>
        </div>
      </form>
    </div> -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();
const config = useRuntimeConfig();

// State
const isLoading = ref(false);
const isChangingPassword = ref(false);
const isLocating = ref(false);
const updateSuccess = ref(false);
const passwordSuccess = ref(false);
const error = ref(null);
const addressSearch = ref('');
const addressSuggestions = ref([]);
const autocompleteLoading = ref(false);
let addressAutocompleteTimer = null;
let addressAutocompleteSuspend = false;

// Profile form
const profile = reactive({
  fname: '',
  lname: '',
  email: '',
  address: '',
  latitude: null,
  longitude: null
});

const profileDisplayName = computed(() => {
  const fullName = `${profile.fname || ''} ${profile.lname || ''}`.trim();
  return fullName || 'Customer Profile';
});

const profileInitials = computed(() => {
  const initials = `${(profile.fname || '')[0] || ''}${(profile.lname || '')[0] || ''}`.toUpperCase();
  return initials || 'CP';
});

// Password form
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Format phone number
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let formatted = phone;
  if (formatted.startsWith('233')) {
    formatted = '+233 ' + formatted.substring(3, 5) + ' ' + formatted.substring(5, 8) + ' ' + formatted.substring(8);
  } else if (formatted.startsWith('+233')) {
    formatted = '+233 ' + formatted.substring(4, 6) + ' ' + formatted.substring(6, 9) + ' ' + formatted.substring(9);
  }
  return formatted;
};

// Load profile data
const loadProfile = async () => {
  try {
    const profileData = await userStore.getProfile();
    if (profileData) {
      profile.fname = profileData?.fname || userStore.currentUser?.fname || '';
      profile.lname = profileData?.lname || userStore.currentUser?.lname || '';
      profile.email = profileData?.email || userStore.currentUser?.email || '';
      profile.address = profileData?.home_address || profileData?.address || '';
      profile.latitude = profileData?.home_latitude ?? profileData?.latitude ?? null;
      profile.longitude = profileData?.home_longitude ?? profileData?.longitude ?? null;
      addressSearch.value = profile.address || '';
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
};

const clearAddressSuggestions = () => {
  addressSuggestions.value = [];
  autocompleteLoading.value = false;
};

const fetchAddressSuggestions = async (query) => {
  const trimmed = String(query || '').trim();
  if (trimmed.length < 3) {
    clearAddressSuggestions();
    return;
  }

  try {
    autocompleteLoading.value = true;
    const response = await fetch(`${config.public.apiBase}/api/auth/customer/autocomplete-location?q=${encodeURIComponent(trimmed)}&limit=5`, {
      headers: {
        Authorization: `Bearer ${userStore.customerAuthToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to load address suggestions');
    }
    addressSuggestions.value = Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('Autocomplete failed:', err);
    addressSuggestions.value = [];
  } finally {
    autocompleteLoading.value = false;
  }
};

const applyAddressSuggestion = (suggestion) => {
  profile.address = suggestion.display_name || '';
  profile.latitude = Number.isFinite(Number(suggestion.latitude)) ? Number(suggestion.latitude) : profile.latitude;
  profile.longitude = Number.isFinite(Number(suggestion.longitude)) ? Number(suggestion.longitude) : profile.longitude;
  addressAutocompleteSuspend = true;
  addressSearch.value = profile.address;
  clearAddressSuggestions();
};

const reverseGeocode = async (latitude, longitude) => {
  const response = await fetch(`${config.public.apiBase}/api/auth/customer/reverse-geocode?lat=${latitude}&lng=${longitude}`, {
    headers: {
      'Authorization': `Bearer ${userStore.customerAuthToken}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to look up your address');
  }
  return data.data;
};

const captureHomeLocation = () => {
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
        profile.address = result.address || '';
        addressSearch.value = profile.address;
      } catch (err) {
        error.value = err.message || 'Failed to generate your home address';
      } finally {
        isLocating.value = false;
      }
    },
    (geoError) => {
      isLocating.value = false;
      if (geoError?.code === geoError.PERMISSION_DENIED) {
        error.value = 'Location permission was denied. Allow location access and try again.';
        return;
      }
      error.value = 'Could not get your location right now. Check GPS and try again.';
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
};

const clearHomeLocation = () => {
  profile.address = '';
  profile.latitude = null;
  profile.longitude = null;
  addressSearch.value = '';
  clearAddressSuggestions();
};

// Save profile
const saveProfile = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    await userStore.updateProfile({
      fname: profile.fname,
      lname: profile.lname,
      email: profile.email,
      home_address: profile.address || null,
      home_latitude: profile.latitude,
      home_longitude: profile.longitude
    });

    updateSuccess.value = true;
    setTimeout(() => {
      updateSuccess.value = false;
    }, 3000);
  } catch (err) {
    error.value = err.message || 'Failed to update profile';
    setTimeout(() => {
      error.value = null;
    }, 5000);
  } finally {
    isLoading.value = false;
  }
};

// Change password
const changePassword = async () => {
  try {
    error.value = null;

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error.value = 'New passwords do not match';
      setTimeout(() => {
        error.value = null;
      }, 5000);
      return;
    }

    isChangingPassword.value = true;

    await userStore.changePassword(passwordForm.currentPassword, passwordForm.newPassword);

    passwordSuccess.value = true;
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';

    setTimeout(() => {
      passwordSuccess.value = false;
    }, 3000);
  } catch (err) {
    error.value = err.message || 'Failed to change password';
    setTimeout(() => {
      error.value = null;
    }, 5000);
  } finally {
    isChangingPassword.value = false;
  }
};

// Initialize
onMounted(() => {
  loadProfile();
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

  const trimmed = String(value || '').trim();
  if (!trimmed) {
    clearAddressSuggestions();
    return;
  }

  addressAutocompleteTimer = setTimeout(() => {
    fetchAddressSuggestions(trimmed);
  }, 300);
});
</script>

