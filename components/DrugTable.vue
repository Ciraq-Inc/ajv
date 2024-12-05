<template>
    <div class="bg-white rounded-lg shadow-md overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-600 border-b">
          <tr>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Name</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Price</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Expiry Date</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Quantity</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr 
            v-for="drug in filteredDrugs" 
            :key="drug.id" 
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="p-3 text-sm font-medium text-gray-900">
              {{ drug.name }}
            </td>
            <td class="p-3 text-sm text-gray-900">
              GHS {{ drug.price }}
            </td>
            <td class="p-3 text-sm text-gray-900">
              {{ drug.expiryDate }}
            </td>
            <td class="p-3">
              <div class="flex items-center">
                <button 
                  @click="decreaseQuantity(drug)"
                  :disabled="drug.quantity <= 1"
                  class="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-l disabled:opacity-50"
                >
                  -
                </button>
                <span class="bg-gray-100 px-2 py-1 text-xs">
                  {{ drug.quantity || 1 }}
                </span>
                <button 
                  @click="increaseQuantity(drug)"
                  class="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-r disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </td>
            <td class="p-3">
              <button 
                @click="handleAddToCart(drug)"
                :class="[
                  'px-4 py-2 text-sm rounded transition-all duration-300 ease-in-out',
                  {
                    'bg-green-500 text-white hover:bg-blue-600 disabled:bg-gray-400': !drug.justAdded,
                    'bg-green-700 text-white transform scale-95 cursor-default': drug.justAdded
                  }
                ]"
              >
                <i class="ri-shopping-cart-line text-xs mr-1"></i>
                {{ drug.justAdded ? 'Added!' : 'Add to cart' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { getDatabase, ref as dbRef, onValue } from 'firebase/database'
  import { useCartStore } from '/stores/cart.js';
  
  const { addToCart } = useCartStore();
  
  const props = defineProps({
    searchQuery: {
      type: String,
      default: ''
    }
  })
  
  // Realtime Database Setup
  const db = getDatabase();
  const drugsRef = dbRef(db, 'drugs')
  
  // Drugs state
  const drugs = ref([]);
  
  // Fetching Drugs
  onMounted(() => {
    onValue(drugsRef, (snapshot) => {
      const drugsData = snapshot.val()
      if (drugsData) {
        drugs.value = Object.keys(drugsData).map(key => ({
          id: key,
          quantity: 1,
          ...drugsData[key]
        }))
      }
    })
  })
  
  const filteredDrugs = computed(() => {
    const query = props.searchQuery || '';
    return drugs.value.filter(drug => 
      drug.name.toLowerCase().includes(query.toLowerCase())
    )
  })
  
  const increaseQuantity = (drug) => {
      drug.quantity = (drug.quantity || 1) + 1;
  };
  
  const decreaseQuantity = (drug) => {
    if (drug.quantity > 1) {
      drug.quantity -= 1;
    }
  };
  
  const handleAddToCart = (drug) => {
      addToCart({...drug});
      
      // Set justAdded to true
      drug.justAdded = true;
      
      // Reset justAdded after 2 seconds
      setTimeout(() => {
        drug.justAdded = false;
      }, 2000);
  }
  </script>