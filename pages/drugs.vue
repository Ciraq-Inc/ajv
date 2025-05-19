<template>
  <AccessControl>
    <div class="container mx-auto px-4 py-8">
      <!-- Display current pharmacy info -->
      <div v-if="pharmacyData" class="mb-6 p-4 bg-blue-50 rounded-lg">
        <h1 class="text-xl font-semibold">
          Managing Inventory for: {{ pharmacyData.name }}
        </h1>
        <p class="text-sm text-gray-600">{{ pharmacyData.location }}</p>
      </div>

      <!-- Tabs Navigation -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex -mb-px" aria-label="Tabs">
          <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value" :class="[
            activeTab === tab.value
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm'
          ]">
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Add Product Form Tab -->
      <div v-if="activeTab === 'form'">
        <h1 class="text-3xl font-bold mb-6 text-center">Add New Product</h1>

        <form @submit.prevent="submitProduct" class="max-w-lg mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="brandName">
              Product Name
            </label>
            <input v-model="productForm.brandName" id="brandName" type="text" required
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter product name" />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="unit">
              Unit
            </label>
            <input v-model="productForm.unit" id="unit" type="text" required
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., TABLET, BOTTLE, PACK" />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="image">
              Product Image
            </label>
            <input @change="handleImageUpload" id="image" type="file" accept="image/*"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />

            <div v-if="productForm.imagePreview" class="mt-4">
              <img :src="productForm.imagePreview" alt="Product Preview" class="max-w-full h-auto rounded" />
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="sellingPrice">
              Price (GHS)
            </label>
            <input v-model.number="productForm.sellingPrice" id="sellingPrice" type="number" step="0.01" required
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter price" />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="stockQty">
              Stock Quantity
            </label>
            <input v-model.number="productForm.stockQty" id="stockQty" type="number" required min="0" step="1"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter quantity in stock" />
          </div>

          <div class="flex items-center justify-between">
            <button type="submit" :disabled="isUploading || !currentPharmacy"
              class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50">
              {{ isUploading ? 'Uploading...' : 'Add Product' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Products Table Tab -->
      <div v-else class="bg-white rounded-lg shadow-md overflow-x-auto">
        <!-- Search Input -->
        <div class="p-4 border-b">
          <input v-model="searchQuery" type="text" placeholder="Search products..."
            class="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <table class="w-full">
          <thead class="bg-gray-600 border-b">
            <tr>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Name</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Price</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Unit</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Stock</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Last Updated</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50 transition-colors">
              <!-- Name Cell -->
              <td class="p-4 text-sm text-gray-900">
                <div v-if="editingId === product.id" class="flex items-center space-x-2">
                  <input v-model="editForm.brandName" type="text"
                    class="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <span v-else>{{ product.brandName }}</span>
              </td>

              <!-- Price Cell -->
              <td class="p-4 text-sm text-gray-900">
                <div v-if="editingId === product.id" class="flex items-center space-x-2">
                  <input v-model.number="editForm.sellingPrice" type="number" step="0.01"
                    class="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <span v-else>GHS {{ product.sellingPrice }}</span>
              </td>

              <!-- Unit Cell -->
              <td class="p-4 text-sm text-gray-900">
                <div v-if="editingId === product.id" class="flex items-center space-x-2">
                  <input v-model="editForm.unit" type="text"
                    class="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <span v-else>{{ product.unit }}</span>
              </td>

              <!-- Stock Status Cell -->
              <td class="p-4 text-sm text-gray-900">
                <div v-if="editingId === product.id" class="flex items-center space-x-2">
                  <input v-model.number="editForm.stockQty" type="number" min="0" step="1"
                    class="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div v-else class="flex items-center space-x-2">
                  <span :class="[
                    'px-2 py-1 text-xs rounded-full',
                    product.stockQty <= 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  ]">
                    {{ product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of Stock' }}
                  </span>
                </div>
              </td>

              <!-- Last Updated Cell -->
              <td class="p-4 text-sm text-gray-900">
                {{ formatDate(product.lastUpdated) }}
              </td>

              <!-- Actions Cell -->
              <td class="p-4 text-sm">
                <div class="flex items-center space-x-2">
                  <template v-if="editingId === product.id">
                    <button @click="handleSave(product.id)"
                      class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors">
                      Save
                    </button>
                    <button @click="cancelEdit"
                      class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors">
                      Cancel
                    </button>
                  </template>
                  <button v-else @click="startEdit(product)"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors">
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AccessControl>
</template>

<script setup>
import { getDatabase, ref as dbRef, push, onValue, update, remove } from 'firebase/database'
import { useImageUpload } from '@/composables/useImageUpload'
import { usePharmacyStore } from '~/stores/pharmacy'

// Get pharmacy store
const pharmacyStore = usePharmacyStore()
const currentPharmacy = computed(() => pharmacyStore.currentPharmacy)
const pharmacyData = computed(() => pharmacyStore.pharmacyData)
const products = computed(() => pharmacyStore.products)

// Tabs Configuration
const tabs = [
  { name: 'Add Product', value: 'form' },
  { name: 'Products List', value: 'table' }
]
const activeTab = ref('form')

// Database setup
const db = getDatabase()

// Search state
const searchQuery = ref('')

// Image Upload Setup
const {
  imageFile,
  imageUrl,
  isUploading,
  uploadProgress,
  uploadError,
  handleImageUpload,
  resetUpload
} = useImageUpload()

// Product Form state
const productForm = ref({
  brandName: '',
  unit: '',
  imagePreview: null,
  sellingPrice: null,
  stockQty: 0
})

// Computed properties
const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(product =>
    product.brandName.toLowerCase().includes(query)
  )
})

// Methods
const formatDate = (dateString) => {
  const date = dateString ? new Date(dateString) : new Date()
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Submit Form
const submitProduct = async () => {
  try {
    // Validate form
    if (!productForm.value.brandName ||
      !productForm.value.unit ||
      !productForm.value.sellingPrice) {
      alert('Please fill in all required fields')
      return
    }

    if (!currentPharmacy.value) {
      alert('No pharmacy selected. Please select a pharmacy first.')
      return
    }

    const newProduct = {
      brandName: productForm.value.brandName,
      unit: productForm.value.unit,
      sellingPrice: productForm.value.sellingPrice,
      stockQty: productForm.value.stockQty || 0,
      lastUpdated: new Date().toISOString()
    }

    // Add image if available
    if (imageUrl.value) {
      newProduct.imageUrl = imageUrl.value
    }

    // Add to Realtime Database under the current pharmacy's products
    const productsRef = dbRef(db, `${currentPharmacy.value}/products`)
    await push(productsRef, newProduct)

    // Reset form
    productForm.value = {
      brandName: '',
      unit: '',
      imagePreview: null,
      sellingPrice: null,
      stockQty: 0
    }
    resetUpload()

    // Switch to table view and show success message
    activeTab.value = 'table'
    alert('Product added successfully!')
  } catch (error) {
    console.error('Error adding product:', error)
    alert('Failed to add product. Please try again.')
  }
}

// Editing state
const editingId = ref(null)
const editForm = ref({
  brandName: '',
  sellingPrice: 0,
  unit: '',
  stockQty: 0
})

// Edit methods
const startEdit = (product) => {
  editingId.value = product.id
  editForm.value = {
    brandName: product.brandName,
    sellingPrice: product.sellingPrice,
    unit: product.unit,
    stockQty: product.stockQty || 0
  }
}

const cancelEdit = () => {
  editingId.value = null
  editForm.value = {
    brandName: '',
    sellingPrice: 0,
    unit: '',
    stockQty: 0
  }
}

const handleSave = async (productId) => {
  try {
    // Validate form
    if (!editForm.value.brandName || !editForm.value.sellingPrice || !editForm.value.unit) {
      alert('Please fill in all required fields')
      return
    }

    if (!currentPharmacy.value) {
      alert('No pharmacy selected. Please select a pharmacy first.')
      return
    }

    // Update in Firebase
    const updates = {
      brandName: editForm.value.brandName,
      sellingPrice: editForm.value.sellingPrice,
      unit: editForm.value.unit,
      stockQty: editForm.value.stockQty,
      lastUpdated: new Date().toISOString()
    }

    await update(dbRef(db, `${currentPharmacy.value}/products/${productId}`), updates)

    // Reset edit state
    editingId.value = null
    editForm.value = {
      brandName: '',
      sellingPrice: 0,
      unit: '',
      stockQty: 0
    }

    alert('Product updated successfully!')
  } catch (error) {
    console.error('Error updating product:', error)
    alert('Failed to update product. Please try again.')
  }
}
</script>