<template>
    <Navbar />
  <div class="bg-grey h-screen">
    <div class="px-4 py-8">
      <!-- Header -->
      <div class="text-center my-8">
        <h2 class="h2 mb-2">AJV Pharmacy Wholesale</h2>
        <p class="text-gray-600">Find your medications</p>
      </div>

      <!-- Search Bar -->
      <div class="max-w-2xl mx-auto mb-12">
        <div class="relative">
          <span
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
          <input
            type="search"
            v-model="searchQuery"
            class="w-full pl-12 h-14 text-lg rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Search medications..."
          />
        </div>
      </div>

        <!-- Drug Grid -->
        <div>
          <DrugCard :searchQuery="searchQuery" />
        </div>

    </div>
  </div>
</template>


<script setup>

const searchQuery = ref('')

</script>