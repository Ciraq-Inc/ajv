<template>
  <div class="max-w-3xl">
    <!-- Header -->
    <div class="mb-6">
      <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5d4679]">Profile</p>
      <h2 class="text-[1.8rem] font-black uppercase tracking-[-0.07em] text-[#4F217A] mt-0.5">Profile Information</h2>
      <p class="text-sm font-medium text-zinc-600 mt-1">Update your personal information and saved home location.</p>
    </div>

    <!-- Success Alert -->
    <div v-if="updateSuccess" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#e7f7ea] border border-[#b6e8c2] text-[#166534] mb-5 text-sm font-semibold">
      <span class="material-symbols-outlined text-[18px]">check_circle</span>
      Profile updated successfully!
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-5 text-sm font-semibold">
      <span class="material-symbols-outlined text-[18px]">error</span>
      {{ error }}
    </div>

    <!-- Summary card -->
    <div class="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white shadow-sm px-5 py-4 mb-4">
      <div class="w-14 h-14 bg-zinc-900 rounded-xl text-white font-bold flex items-center justify-center text-lg flex-shrink-0">{{ profileInitials }}</div>
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-zinc-900 leading-tight">{{ profileDisplayName }}</p>
        <p class="text-sm text-zinc-500 mt-0.5">{{ formatPhoneNumber(userStore.userPhoneNumber) || 'No phone number' }}</p>
      </div>
      <span
        class="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] flex-shrink-0"
        :class="profile.address ? 'bg-[#e7f7ea] text-[#228847]' : 'bg-amber-50 text-amber-700'"
      >
        {{ profile.address ? 'Location saved' : 'Location needed' }}
      </span>
    </div>

    <!-- Profile Form -->
    <div class="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
      <form @submit.prevent="saveProfile">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <!-- First Name -->
          <div class="flex flex-col gap-1.5">
            <label for="fname" class="text-sm font-semibold text-zinc-700">First Name</label>
            <input v-model="profile.fname" type="text" id="fname" placeholder="Enter first name" required
              class="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40" />
          </div>

          <!-- Last Name -->
          <div class="flex flex-col gap-1.5">
            <label for="lname" class="text-sm font-semibold text-zinc-700">Last Name</label>
            <input v-model="profile.lname" type="text" id="lname" placeholder="Enter last name" required
              class="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40" />
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-sm font-semibold text-zinc-700">Email Address</label>
            <input v-model="profile.email" type="email" id="email" placeholder="Enter email address"
              class="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F217A]/20 focus:border-[#4F217A]/40" />
          </div>

          <!-- Phone (Read-only) -->
          <div class="flex flex-col gap-1.5">
            <label for="phone" class="text-sm font-semibold text-zinc-700">Phone Number</label>
            <input :value="formatPhoneNumber(userStore.userPhoneNumber)" type="text" id="phone" disabled
              class="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-400 cursor-not-allowed" />
            <p class="text-xs text-zinc-400">Phone number cannot be changed</p>
          </div>
        </div>

        <!-- Home Location -->
        <div class="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 mb-5">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <p class="text-sm font-semibold text-zinc-900">Home Address</p>
              <p class="text-xs text-zinc-500 mt-0.5">Used by default for delivery requests until you change it for a specific request.</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" :disabled="isLocating" @click="captureHomeLocation"
                class="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                <span v-if="isLocating" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span v-else class="material-symbols-outlined text-[16px]">my_location</span>
                {{ isLocating ? 'Finding...' : (profile.latitude && profile.longitude ? 'Update Location' : 'Set From GPS') }}
              </button>
              <button
                v-if="profile.latitude || profile.longitude || profile.address"
                type="button" :disabled="isLoading || isLocating"
                @click="clearHomeLocation"
                class="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60">
                Clear
              </button>
            </div>
          </div>

          <div
            class="rounded-lg px-4 py-3 text-sm"
            :class="profile.address ? 'bg-[#eef9f1] border border-[#c6e8d0]' : 'bg-white border border-zinc-200'"
          >
            <p class="font-semibold" :class="profile.address ? 'text-[#166534]' : 'text-zinc-700'">
              {{ profile.address ? 'Home location saved' : 'No home location saved yet' }}
            </p>
            <p class="mt-1 text-xs" :class="profile.address ? 'text-[#1f8a45]' : 'text-zinc-500'">
              {{ profile.address || 'Set your current location once and we will use it for future delivery requests.' }}
            </p>
            <div v-if="profile.latitude && profile.longitude" class="flex gap-4 mt-1.5 text-[11px] font-semibold text-zinc-400">
              <span>Lat: {{ Number(profile.latitude).toFixed(6) }}</span>
              <span>Lng: {{ Number(profile.longitude).toFixed(6) }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button type="submit" :disabled="isLoading"
            class="inline-flex items-center gap-2 bg-zinc-900 text-white py-3 px-6 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <span v-if="isLoading" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
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
import { ref, reactive, onMounted, computed } from 'vue';
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
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
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
</script>

