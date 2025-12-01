<!-- pages/index.vue -->
<template>
  <div class="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <div class="container mx-auto px-4 h-full flex items-center">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full items-center">
        <!-- Left Side - Content -->
        <div class="space-y-6 lg:space-y-8">
          <div>
            <h1 class="text-3xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Need Meds? Get Them Delivered, <span class="text-indigo-600">Fast.</span>
            </h1>
            <p class="text-lg lg:text-xl text-gray-700 font-medium">
              Stop Driving Around. Check Inventory and Order from Pharmacies Near You.
            </p>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6 lg:p-8 border border-indigo-100">
            <p class="text-base lg:text-lg text-gray-700 leading-relaxed mb-4">
              Tired of calling every pharmacy only to find out they don't have what you need? 
              <span class="font-semibold text-indigo-600">The RigelOS Delivery Portal</span> is making life easier.
            </p>
            <div class="space-y-3">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <p class="text-gray-700 text-sm lg:text-base">Check what's in stock at all partner pharmacies nearby</p>
              </div>
              <div class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <p class="text-gray-700 text-sm lg:text-base">See it, buy it—right from your phone</p>
              </div>
              <div class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <p class="text-gray-700 text-sm lg:text-base">Get it dropped off quickly at your home or office</p>
              </div>
            </div>
            <p class="text-base text-gray-800 font-semibold mt-4 text-center">
              It's stress-free healthcare access!
            </p>
          </div>
        </div>

        <!-- Right Side - Sign Up -->
        <div>
          <div class="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 lg:p-8 text-white">
            <div class="text-center mb-6">
              <div class="inline-block bg-yellow-400 text-indigo-900 px-3 py-1 rounded-full font-bold text-xs mb-3">
                🚀 LAUNCH ALERT
              </div>
              <h2 class="text-2xl lg:text-3xl font-bold mb-3">
                Say Goodbye to Pharmacy Runs.
              </h2>
              <p class="text-sm lg:text-base text-indigo-100 leading-relaxed">
                We're busy signing up all our delivery riders and confirming the stock in your area. 
                We're almost ready to launch!
              </p>
            </div>

            <!-- Sign Up Form -->
            <div class="bg-white rounded-xl p-5 lg:p-6 shadow-lg">
              <h3 class="text-xl lg:text-2xl font-bold text-gray-900 text-center mb-1">
                Sign Up and Get Notified
              </h3>
              <p class="text-center text-gray-600 text-sm mb-4">
                Be the very first person we notify when delivery starts in your neighborhood!
              </p>
              
              <form @submit.prevent="handleSignUp" class="space-y-3">
                <div>
                  <label for="name" class="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    v-model="signUpForm.name"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label for="phone" class="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    v-model="signUpForm.phone"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div>
                  <label for="location" class="block text-xs font-medium text-gray-700 mb-1">Location/Area</label>
                  <input 
                    type="text" 
                    id="location" 
                    v-model="signUpForm.location"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm"
                    placeholder="Enter your neighborhood or area"
                  />
                </div>

                <button 
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <span v-if="!isSubmitting">🔔 Notify Me When You Launch!</span>
                  <span v-else>Submitting...</span>
                </button>
              </form>

              <div v-if="submitMessage" class="mt-3 p-3 rounded-lg text-sm" :class="submitSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ submitMessage }}
              </div>
            </div>
            
            <p class="text-indigo-100 text-xs text-center mt-4">
              Join hundreds of others who are already signed up and waiting for launch day!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const signUpForm = ref({
  name: '',
  phone: '',
  location: ''
});

const isSubmitting = ref(false);
const submitMessage = ref('');
const submitSuccess = ref(false);

const handleSignUp = async () => {
  isSubmitting.value = true;
  submitMessage.value = '';
  
  try {
    // TODO: Replace with actual API endpoint
    // const response = await $fetch('/api/launch-signup', {
    //   method: 'POST',
    //   body: signUpForm.value
    // });
    
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    submitSuccess.value = true;
    submitMessage.value = '🎉 Success! You\'re on the list. We\'ll notify you as soon as we launch in your area!';
    
    // Reset form
    signUpForm.value = {
      name: '',
      phone: '',
      location: ''
    };
  } catch (error) {
    submitSuccess.value = false;
    submitMessage.value = 'Something went wrong. Please try again.';
    console.error('Sign up error:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
