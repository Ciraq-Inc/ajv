<template>
    <div>
      <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 class="text-2xl font-bold mb-6 text-center">Access Control</h2>
          <form @submit.prevent="authenticate" class="space-y-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
                Username
              </label>
              <input 
                v-model="credentials.username"
                type="text" 
                id="username"
                required
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                Password
              </label>
              <input 
                v-model="credentials.password"
                type="password" 
                id="password"
                required
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter password"
              />
            </div>
            <div v-if="error" class="text-red-500 text-sm text-center">
              {{ error }}
            </div>
            <button 
              type="submit" 
              class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Login
            </button>
          </form>
        </div>
      </div>
      <slot v-else></slot>
    </div>
  </template>
  
  <script setup>
  const isAuthenticated = ref(false)
  const error = ref('')
  const config = useRuntimeConfig()
  
  const credentials = ref({
    username: '',
    password: ''
  })
  
  const authenticate = () => {
    const validUsername = String(config.public.accessControlUsername || '').trim()
    const validPassword = String(config.public.accessControlPassword || '')

    if (!validUsername || !validPassword) {
      error.value = 'Access control credentials are not configured.'
      isAuthenticated.value = false
      return
    }
  
    if (
      credentials.value.username === validUsername && 
      credentials.value.password === validPassword
    ) {
      isAuthenticated.value = true
      error.value = ''
    } else {
      error.value = 'Invalid credentials. Please try again.'
      isAuthenticated.value = false
    }
  }
  </script>
