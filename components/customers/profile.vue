<template>
  <div class="profile-component">
    <div class="section-header">
      <h2>Profile Information</h2>
      <p class="section-description">Update your personal information and password</p>
    </div>

    <!-- Success Alert -->
    <div v-if="updateSuccess" class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>Profile updated successfully!</span>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Profile Form -->
    <div class="card">
      <form @submit.prevent="saveProfile">
        <div class="form-grid">
          <!-- First Name -->
          <div class="form-group">
            <label for="fname">First Name</label>
            <input v-model="profile.fname" type="text" id="fname" class="form-input" placeholder="Enter first name"
              required />
          </div>

          <!-- Last Name -->
          <div class="form-group">
            <label for="lname">Last Name</label>
            <input v-model="profile.lname" type="text" id="lname" class="form-input" placeholder="Enter last name"
              required />
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email Address</label>
            <input v-model="profile.email" type="email" id="email" class="form-input" placeholder="Enter email address" />
          </div>

          <!-- Phone (Read-only) -->
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input :value="formatPhoneNumber(userStore.userPhoneNumber)" type="text" id="phone" class="form-input"
              disabled />
            <p class="field-hint">Phone number cannot be changed</p>
          </div>
        </div>

        <!-- Address -->
        <div class="form-group">
          <label for="address">Delivery Address</label>
          <textarea v-model="profile.address" id="address" rows="3" class="form-input"
            placeholder="Enter your delivery address"></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <svg v-if="isLoading" class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <span v-else>Save Changes</span>
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
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';

const userStore = useUserStore();

// State
const isLoading = ref(false);
const isChangingPassword = ref(false);
const updateSuccess = ref(false);
const passwordSuccess = ref(false);
const error = ref(null);

// Profile form
const profile = reactive({
  fname: '',
  lname: '',
  email: '',
  address: ''
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
      profile.address = profileData?.address || '';
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
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
      address: profile.address
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

<style scoped>
.profile-component {
  max-width: 800px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2,
.section-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.section-description {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.alert-success {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
}

.alert-error {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-input {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.field-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: #8b5cf6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 16px;
  }
}
</style>
