<template>
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
    <div
      v-for="drug in filteredDrugs"
      :key="drug.id"
      class="bg-white rounded-lg shadow-md hover:shadow-lg p-4 transition-shadow duration-300 overflow-hidden"
    >
      <div class="flex space-x-3">
        <!-- Image Section -->
        <div>
          <img
            :src="drug.image"
            :alt="drug.name"
            class="w-[90px] h-[80px] rounded object-cover cursor-pointer"
          />
          <div class="text-xs text-gray-600 mt-1 flex items-center">
            <Icon name="ph:clock" class="w-3 h-3 mr-1" />
            {{ drug.expiryDate }}
          </div>
        </div>

        <!-- Content Section -->
        <div class="space-y-2 flex-grow">
          <h3 class="text-base font-semibold text-gray-800 truncate">
            {{ drug.name }}
          </h3>

          <div class="text-xs text-gray-800 font-semibold flex justify-between">
            <div>
              GHS {{ drug.price }}
            </div>
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
          </div>

          <!-- Add to Cart Section -->
           <div class="flex justify-end">
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
        </div>
        </div>

      </div>
    </div>
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