<template>
  <div class="container mx-auto px-4 py-8">
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
</template>

<script setup>
import { getDatabase, ref as dbRef, push } from 'firebase/database'
import { useImageUpload } from '@/composables/useImageUpload'

// Realtime Database setup
const db = getDatabase()
const drugsRef = dbRef(db, 'drugs')

// IMAGE UPLOAD
const { 
  imageFile, 
  imageUrl, 
  isUploading, 
  uploadProgress, 
  uploadError, 
  handleImageUpload, 
  resetUpload 
} = useImageUpload()

// DRUG REFERENCE
const drugForm = ref({
  name: '',
  expiryDate: '',
  image: null,
  imagePreview: null,
  price: null
})

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
      justAdded: false,
      image: imageUrl.value,
      createdAt: new Date().toISOString()
    }

    // Add to Realtime Database
    const newDrugRef = push(drugsRef, newDrug)

    // Reset form
    drugForm.value = {
      name: '',
      expiryDate: '',
      image: null,
      imagePreview: null,
      price: null
    }
    resetUpload()

    // Optionally show success message
    alert('Drug added successfully!')
  } catch (error) {
    console.error('Error adding drug:', error)
    alert('Failed to add drug. Please try again.')
  }
}
</script>