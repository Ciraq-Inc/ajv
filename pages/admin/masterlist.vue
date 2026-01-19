<template>
  <div class="container mx-auto p-4">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-2xl font-bold text-gray-800">Master Products Catalog</h1>
          <p class="text-gray-600 mt-1">Manage master product database and upload product images</p>
        </div>

        <div class="flex items-center space-x-3">
          <div class="text-sm text-gray-600">
            <span class="font-semibold text-indigo-600">{{ formatNumber(stats?.total_master_products || 0) }}</span>
            Total Products
          </div>

          <button @click="openAutoUploadModal" :disabled="loading || autoUploading"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Auto Upload
          </button>

          <button @click="refreshData" :disabled="loading"
            class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors duration-200 flex items-center disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" :class="['h-5 w-5 mr-1.5', loading ? 'animate-spin' : '']"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Products</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatNumber(stats?.total_master_products || 0) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">With Images</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatNumber(stats?.products_with_images || 0) }}</p>
            <p class="text-xs text-green-600 mt-1">{{ imagePercentage }}% complete</p>
          </div>
        </div>
      </div>

      <!-- <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-purple-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Linked Products</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatNumber(stats?.total_linked_products || 0) }}</p>
            <p class="text-xs text-gray-500 mt-1">Across all pharmacies</p>
          </div>
        </div>
      </div> -->
    </div>

    <!-- Filter and Search Section -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" id="search" v-model="searchQuery" @input="debouncedSearch"
              placeholder="Search by product name, strength, or unit..."
              class="pl-10 px-4 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>

        <div class="w-full sm:w-48">
          <label for="image-filter" class="block text-sm font-medium text-gray-700 mb-1">Image Status</label>
          <select id="image-filter" v-model="filterImageStatus" @change="loadProducts"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
            <option value="all">All Products</option>
            <option value="with-image">With Image</option>
            <option value="without-image">Without Image</option>
          </select>
        </div>

        <div class="w-full sm:w-48">
          <label for="page-size" class="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
          <select id="page-size" v-model="pageSize" @change="loadProducts"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
            <option :value="25">25 per page</option>
            <option :value="50">50 per page</option>
            <option :value="100">100 per page</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
    </div>

    <!-- Products Table -->
    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Strength
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <!-- <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Linked
              </th> -->
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="products.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                No products found
              </td>
            </tr>
            <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div
                  class="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                  <img v-if="product.product_image_url" :src="product.product_image_url"
                    :alt="product.product_description" class="h-full w-full object-cover" @error="handleImageError" />
                  <svg v-else class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ product.product_description }}</div>
                <div class="text-sm text-gray-500">ID: {{ product.id }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ product.strength || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ product.unit || '-' }}</div>
              </td>
              <!-- <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {{ product.linked_count || 0 }}
                </span>
              </td> -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button @click="openUploadModal(product)" :disabled="uploadingProductId === product.id"
                    class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center disabled:opacity-50">
                    <svg v-if="uploadingProductId === product.id" class="animate-spin h-4 w-4 mr-1" fill="none"
                      viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                      </path>
                    </svg>
                    <svg v-else class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {{ product.product_image_url ? 'Change' : 'Upload' }}
                  </button>
                  <button v-if="product.product_image_url" @click="removeImage(product)"
                    :disabled="uploadingProductId === product.id"
                    class="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center disabled:opacity-50">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="products.length > 0" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalProducts) }} of
            {{ totalProducts }} products
          </div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button v-for="page in paginationPages" :key="page" @click="changePage(page)" :class="[
              'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
              currentPage === page
                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            ]">
              {{ page }}
            </button>
            <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Upload Product Image</h3>
          <button @click="closeUploadModal" class="text-gray-400 hover:text-gray-600">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6">
          <div class="mb-4">
            <p class="font-medium text-gray-900">{{ selectedProduct?.product_description }}</p>
            <p class="text-sm text-gray-500">{{ selectedProduct?.strength }} - {{ selectedProduct?.unit }}</p>
          </div>

          <!-- Current Image Preview -->
          <div v-if="selectedProduct?.product_image_url" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Current Image:</label>
            <div
              class="w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <img :src="selectedProduct.product_image_url" alt="Current image"
                class="max-h-full max-w-full object-contain" />
            </div>
          </div>

          <!-- File Upload -->
          <div class="mb-4">
            <label for="imageFile" class="block text-sm font-medium text-gray-700 mb-2">Select New Image:</label>
            <input id="imageFile" ref="fileInput" type="file" accept="image/*" @change="handleFileSelect"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            <p class="mt-1 text-xs text-gray-500">Accepted formats: JPG, PNG, WebP (Max 5MB)</p>
          </div>

          <!-- Image Preview -->
          <div v-if="previewUrl" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Preview:</label>
            <div
              class="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <img :src="previewUrl" alt="Preview" class="max-h-full max-w-full object-contain" />
            </div>
          </div>

          <!-- Upload Progress -->
          <div v-if="uploading" class="mb-4">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p class="text-sm text-center text-gray-600 mt-2">{{ uploadProgress }}%</p>
          </div>

          <!-- Error Message -->
          <div v-if="uploadError" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-red-800">{{ uploadError }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button @click="closeUploadModal" :disabled="uploading"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button @click="uploadImage" :disabled="!selectedFile || uploading"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center">
            <svg v-if="uploading" class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            {{ uploading ? 'Uploading...' : 'Upload Image' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Auto Upload Modal -->
    <div v-if="showAutoUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Auto Upload Product Images</h3>
          <button @click="closeAutoUploadModal" :disabled="autoUploading"
            class="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="!autoUploadResults" class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p class="text-sm text-blue-800">
                <strong>Note:</strong> This will upload images from the specified folder on the server.
                Images should be named as <code class="bg-blue-100 px-1 rounded">{productId}.jpg</code>
              </p>
            </div>

            <div>
              <label for="folderPath" class="block text-sm font-medium text-gray-700 mb-1">Folder Path</label>
              <input type="text" id="folderPath" v-model="folderPath"
                placeholder="C:\Users\r\Desktop\Directory\masterproducts"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
              <p class="mt-1 text-xs text-gray-500">Enter the full path to the folder containing product images on the
                server</p>
            </div>

            <div class="flex items-center">
              <input type="checkbox" id="forceUpdate" v-model="forceUpdate"
                class="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
              <label for="forceUpdate" class="ml-2 text-sm text-gray-700">Force update (overwrite existing
                images)</label>
            </div>
          </div>

          <!-- Upload Progress -->
          <div v-if="autoUploading" class="space-y-4">
            <div class="flex items-center justify-center py-8">
              <svg class="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
            </div>
            <p class="text-center text-gray-600">Uploading images... This may take a while.</p>
          </div>

          <!-- Results -->
          <div v-if="autoUploadResults" class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-green-600">{{ autoUploadResults.summary.uploaded }}</p>
                <p class="text-sm text-green-700">Uploaded</p>
              </div>
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-yellow-600">{{ autoUploadResults.summary.skipped }}</p>
                <p class="text-sm text-yellow-700">Skipped</p>
              </div>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-red-600">{{ autoUploadResults.summary.failed }}</p>
                <p class="text-sm text-red-700">Failed</p>
              </div>
            </div>

            <p class="text-sm text-gray-600 text-center">{{ autoUploadResults.message }}</p>

            <!-- Failed Items -->
            <div v-if="autoUploadResults.results.failed.length > 0" class="mt-4">
              <h4 class="font-medium text-red-700 mb-2">Failed Uploads:</h4>
              <div class="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3">
                <p v-for="item in autoUploadResults.results.failed" :key="item.productId" class="text-sm text-red-800">
                  {{ item.fileName }}: {{ item.error }}
                </p>
              </div>
            </div>

            <!-- Skipped Items -->
            <div v-if="autoUploadResults.results.skipped.length > 0" class="mt-4">
              <details class="cursor-pointer">
                <summary class="font-medium text-yellow-700 mb-2">Skipped Items ({{
                  autoUploadResults.results.skipped.length }})</summary>
                <div class="max-h-32 overflow-y-auto bg-yellow-50 rounded-lg p-3 mt-2">
                  <p v-for="item in autoUploadResults.results.skipped" :key="item.productId"
                    class="text-sm text-yellow-800">
                    {{ item.fileName }}: {{ item.reason }}
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button @click="closeAutoUploadModal" :disabled="autoUploading"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {{ autoUploadResults ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="!autoUploadResults" @click="startAutoUpload" :disabled="autoUploading"
            class="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center">
            <svg v-if="autoUploading" class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            {{ autoUploading ? 'Uploading...' : 'Start Upload' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '~/composables/useApi';

definePageMeta({
  middleware: 'admin-auth',
  layout: 'admin-layout'
});

const api = useApi();

// State
const loading = ref(false);
const products = ref([]);
const stats = ref(null);
const searchQuery = ref('');
const filterImageStatus = ref('all');
const currentPage = ref(1);
const pageSize = ref(50);
const totalProducts = ref(0);
const totalPages = ref(0);

// Upload Modal State
const showUploadModal = ref(false);
const selectedProduct = ref(null);
const selectedFile = ref(null);
const previewUrl = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref(null);
const uploadingProductId = ref(null);
const fileInput = ref(null);

// Auto Upload State
const showAutoUploadModal = ref(false);
const autoUploading = ref(false);
const autoUploadResults = ref(null);
const forceUpdate = ref(false);
const folderPath = ref('C:\\Users\\r\\Desktop\\Directory\\masterproducts');

// Computed
const imagePercentage = computed(() => {
  if (!stats.value || !stats.value.total_master_products) return 0;
  const withImages = stats.value.products_with_images || 0;
  return Math.round((withImages / stats.value.total_master_products) * 100);
});

const paginationPages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Methods
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0);
};

const loadStats = async () => {
  try {
    const response = await api.get('/api/master-products/stats');
    if (response.success) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

const loadProducts = async () => {
  try {
    loading.value = true;
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      imageStatus: filterImageStatus.value
    };

    const response = await api.get('/api/master-products', { params });

    if (response.success) {
      products.value = response.data;
      totalProducts.value = response.total || response.data.length;
      totalPages.value = Math.ceil(totalProducts.value / pageSize.value);
    }
  } catch (error) {
    console.error('Error loading products:', error);
  } finally {
    loading.value = false;
  }
};

let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadProducts();
  }, 500);
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadProducts();
  }
};

const refreshData = async () => {
  await Promise.all([loadStats(), loadProducts()]);
};

// Image Upload Methods
const openUploadModal = (product) => {
  selectedProduct.value = product;
  showUploadModal.value = true;
  uploadError.value = null;
  previewUrl.value = null;
  selectedFile.value = null;
};

const closeUploadModal = () => {
  showUploadModal.value = false;
  selectedProduct.value = null;
  selectedFile.value = null;
  previewUrl.value = null;
  uploadError.value = null;
  uploadProgress.value = 0;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      uploadError.value = 'File size must be less than 5MB';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      uploadError.value = 'Please select a valid image file';
      return;
    }

    selectedFile.value = file;
    uploadError.value = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const uploadImage = async () => {
  if (!selectedFile.value || !selectedProduct.value) return;

  try {
    uploading.value = true;
    uploadingProductId.value = selectedProduct.value.id;
    uploadError.value = null;
    uploadProgress.value = 0;

    // Create FormData
    const formData = new FormData();
    formData.append('image', selectedFile.value);
    formData.append('productId', selectedProduct.value.id);
    formData.append('productName', selectedProduct.value.product_description);

    // Use native fetch for FormData upload (don't set Content-Type, let browser handle it)
    const config = useRuntimeConfig();
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded * 100) / e.total);
      }
    });

    // Handle completion
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText || 'Upload failed'));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
    });

    // Send request
    xhr.open('POST', `${config.public.apiBase}/api/master-products/upload-image`);
    xhr.send(formData);

    const response = await uploadPromise;

    if (response.success) {
      // Update product in list
      const productIndex = products.value.findIndex(p => p.id === selectedProduct.value.id);
      if (productIndex !== -1) {
        products.value[productIndex].product_image_url = response.imageUrl;
      }

      // Refresh stats
      await loadStats();

      // Close modal
      closeUploadModal();

      // Show success message (you can add a toast notification here)
      alert('Image uploaded successfully!');
    } else {
      uploadError.value = response.error || 'Upload failed';
    }
  } catch (error) {
    console.error('Upload error:', error);
    uploadError.value = error.message || 'Failed to upload image';
  } finally {
    uploading.value = false;
    uploadingProductId.value = null;
  }
};

const removeImage = async (product) => {
  if (!confirm('Are you sure you want to remove this image?')) return;

  try {
    uploadingProductId.value = product.id;
    const response = await api.post('/api/master-products/remove-image', {
      productId: product.id,
      imageUrl: product.product_image_url
    });

    if (response.success) {
      // Update product in list
      const productIndex = products.value.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        products.value[productIndex].product_image_url = null;
      }

      // Refresh stats
      await loadStats();

      alert('Image removed successfully!');
    } else {
      alert('Failed to remove image: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Remove error:', error);
    alert('Failed to remove image');
  } finally {
    uploadingProductId.value = null;
  }
};

// Auto Upload Methods
const openAutoUploadModal = () => {
  showAutoUploadModal.value = true;
  autoUploadResults.value = null;
  forceUpdate.value = false;
};

const closeAutoUploadModal = () => {
  if (autoUploading.value) return;
  showAutoUploadModal.value = false;
  autoUploadResults.value = null;

  // Refresh data if uploads were made
  if (autoUploadResults.value?.summary?.uploaded > 0) {
    refreshData();
  }
};

const startAutoUpload = async () => {
  try {
    autoUploading.value = true;

    const response = await api.post('/api/master-products/auto-upload-from-folder', {
      forceUpdate: forceUpdate.value,
      folderPath: folderPath.value
    });

    if (response.success) {
      autoUploadResults.value = response;
      // Refresh stats after upload
      await loadStats();
      await loadProducts();
    } else {
      alert('Auto upload failed: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Auto upload error:', error);
    alert('Auto upload failed: ' + (error.message || 'Network error'));
  } finally {
    autoUploading.value = false;
  }
};

const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect fill="%23ddd" width="60" height="60"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
};

onMounted(async () => {
  await Promise.all([loadStats(), loadProducts()]);
});

</script>
<style scoped>
.animate-spin {
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
</style>
