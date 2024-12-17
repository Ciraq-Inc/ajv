<template>
  <AccessControl>
    <div class="container mx-auto px-4 py-8">
      <!-- Tabs Navigation -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex -mb-px" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="activeTab = tab.value"
            :class="[
              activeTab === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Add Drug Form Tab -->
      <div v-if="activeTab === 'form'">
        <h1 class="text-3xl font-bold mb-6 text-center">Add New Drug</h1>
        
        <form @submit.prevent="submitDrug" class="max-w-lg mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="name">
              Drug Name
            </label>
            <input 
              v-model="drugForm.name" 
              id="name"
              type="text" 
              required
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter drug name"
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="expiryDate">
              Expiry Date
            </label>
            <input 
              v-model="drugForm.expiryDate" 
              id="expiryDate"
              type="date" 
              required
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="image">
              Drug Image
            </label>
            <input 
              @change="handleImageUpload"
              id="image"
              type="file" 
              accept="image/*"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            
            <div v-if="drugForm.imagePreview" class="mt-4">
              <img 
                :src="drugForm.imagePreview" 
                alt="Drug Preview" 
                class="max-w-full h-auto rounded"
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="price">
              Price (GHS)
            </label>
            <input 
              v-model.number="drugForm.price" 
              id="price"
              type="number" 
              step="0.01"
              required
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter price"
            />
          </div>

          <div class="flex items-center justify-between">
            <button 
              type="submit" 
              :disabled="isUploading"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {{ isUploading ? 'Uploading...' : 'Add Drug' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Drugs Table Tab -->
      <div v-else class="bg-white rounded-lg shadow-md overflow-x-auto">
        <!-- Search Input -->
        <div class="p-4 border-b">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search drugs..."
            class="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <table class="w-full">
          <thead class="bg-gray-600 border-b">
            <tr>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Name</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Price</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Expiry Date</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Created At</th>
              <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr 
              v-for="drug in filteredDrugs" 
              :key="drug.id" 
              class="hover:bg-gray-50 transition-colors"
            >
              <!-- Name Cell -->
              <td class="p-4 text-sm text-gray-900">
                <div v-if="editingId === drug.id" class="flex items-center space-x-2">
                  <input
                    v-model="editForm.name"
                    type="text"
                    class="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span v-else>{{ drug.name }}</span>
              </td>

              <!-- Price Cell -->
              <td class="p-4 text-sm text-gray-900">
                <div v-if="editingId === drug.id" class="flex items-center space-x-2">
                  <input
                    v-model.number="editForm.price"
                    type="number"
                    step="0.01"
                    class="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span v-else>GHS {{ drug.price }}</span>
              </td>

              <!-- Expiry Date Cell -->
              <td class="p-4 text-sm text-gray-900">
                <div v-if="editingId === drug.id" class="flex items-center space-x-2">
                  <input
                    v-model="editForm.expiryDate"
                    type="date"
                    class="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span v-else>{{ drug.expiryDate }}</span>
              </td>

              <!-- Created At Cell -->
              <td class="p-4 text-sm text-gray-900">
                {{ formatDate(drug.createdAt) }}
              </td>

              <!-- Actions Cell -->
              <td class="p-4 text-sm">
                <div class="flex items-center space-x-2">
                  <template v-if="editingId === drug.id">
                    <button 
                      @click="handleSave(drug.id)"
                      class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      Save
                    </button>
                    <button 
                      @click="cancelEdit"
                      class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </template>
                  <button 
                    v-else
                    @click="startEdit(drug)"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    @click="deleteDrug(drug.id)"
                    class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                  >
                    Delete
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

// Tabs Configuration
const tabs = [
  { name: 'Add Drug', value: 'form' },
  { name: 'Drugs List', value: 'table' }
]
const activeTab = ref('form')

// Database setup
const db = getDatabase()
const drugsRef = dbRef(db, 'drugs')

// Search and Drugs state
const searchQuery = ref('')
const drugs = ref([])

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

// Drug Form state
const drugForm = ref({
  name: '',
  expiryDate: '',
  image: null,
  imagePreview: null,
  price: null
})

// Fetch drugs data
onMounted(() => {
  onValue(drugsRef, (snapshot) => {
    const drugsData = snapshot.val()
    if (drugsData) {
      drugs.value = Object.entries(drugsData).map(([id, data]) => ({
        id,
        ...data
      }))
    }
  })
})

// Computed properties
const filteredDrugs = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return drugs.value.filter(drug => 
    drug.name.toLowerCase().includes(query)
  )
})

// Methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const submitDrug = async () => {
  try {
    // Validate form
    if (!drugForm.value.name ||
        !drugForm.value.expiryDate || !imageUrl.value || 
        !drugForm.value.price) {
      alert('Please fill in all fields')
      return
    }

    // Check expiry date
    const expiryDate = new Date(drugForm.value.expiryDate)
    if (expiryDate < new Date()) {
      alert('Drug cannot have an expired date')
      return
    }

    const newDrug = {
      name: drugForm.value.name,
      expiryDate: drugForm.value.expiryDate,
      price: drugForm.value.price,
      image: imageUrl.value,
      createdAt: new Date().toISOString()
    }

    // Add to Realtime Database
    await push(drugsRef, newDrug)

    // Reset form
    drugForm.value = {
      name: '',
      expiryDate: '',
      image: null,
      imagePreview: null,
      price: null
    }
    resetUpload()

    // Switch to table view and show success message
    activeTab.value = 'table'
    alert('Drug added successfully!')
  } catch (error) {
    console.error('Error adding drug:', error)
    alert('Failed to add drug. Please try again.')
  }
}

// Editing state
const editingId = ref(null)
const editForm = ref({
  name: '',
  price: 0,
  expiryDate: ''
})

// Edit methods
const startEdit = (drug) => {
  editingId.value = drug.id
  editForm.value = {
    name: drug.name,
    price: drug.price,
    expiryDate: drug.expiryDate
  }
}

const cancelEdit = () => {
  editingId.value = null
  editForm.value = {
    name: '',
    price: 0,
    expiryDate: ''
  }
}

const handleSave = async (drugId) => {
  try {
    // Validate form
    if (!editForm.value.name || !editForm.value.price || !editForm.value.expiryDate) {
      alert('Please fill in all fields')
      return
    }

    // Check expiry date
    const expiryDate = new Date(editForm.value.expiryDate)
    if (expiryDate < new Date()) {
      alert('Drug cannot have an expired date')
      return
    }

    // Update in Firebase
    const updates = {
      name: editForm.value.name,
      price: editForm.value.price,
      expiryDate: editForm.value.expiryDate,
      updatedAt: new Date().toISOString()
    }

    await update(dbRef(db, `drugs/${drugId}`), updates)
    
    // Reset edit state
    editingId.value = null
    editForm.value = {
      name: '',
      price: 0,
      expiryDate: ''
    }

    alert('Drug updated successfully!')
  } catch (error) {
    console.error('Error updating drug:', error)
    alert('Failed to update drug. Please try again.')
  }
}

const deleteDrug = async (drugId) => {
  if (!confirm('Are you sure you want to delete this drug?')) {
    return
  }

  try {
    await remove(dbRef(db, `drugs/${drugId}`))
    alert('Drug deleted successfully!')
  } catch (error) {
    console.error('Error deleting drug:', error)
    alert('Failed to delete drug. Please try again.')
  }
}
</script>