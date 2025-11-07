<!-- components/ProductsTable.vue -->
<template>
  <div>
    <!-- Loading state - only show if pharmacy store is not loading -->
    <div v-if="loading && !pharmacyStore.isLoading" class="p-8 text-center">
      <div class="animate-pulse flex justify-center">
        <div class="h-6 w-6 bg-blue-500 rounded-full"></div>
      </div>
      <p class="mt-2 text-gray-600">Loading products...</p>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!filteredProducts.length" class="p-8 text-center bg-white rounded-lg shadow-md">
      <div class="mb-3 text-gray-400">
        <i class="ri-shopping-basket-line text-4xl"></i>
      </div>
      <h3 class="text-lg font-medium text-gray-900">No products available</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery ? 'Try adjusting your search query' : 'This pharmacy has no products listed yet' }}
      </p>
    </div>
    
    <!-- Products table -->
    <div v-else class="bg-white rounded-lg shadow-md overflow-x-auto w-full">
      <table class="w-full min-w-full table-fixed">
        <thead class="bg-gray-600 border-b">
          <tr>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Name</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Price</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Unit</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Stock Status</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Quantity</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50 transition-colors">
            <td class="p-3 text-sm font-medium text-gray-900">
              {{ product.brandName }}
            </td>
            <td class="p-3 text-sm text-gray-900">
              GHS {{ formatPrice(product.sellingPrice) }}
            </td>
            <td class="p-3 text-sm text-gray-900">
              {{ product.unit || 'Unit' }}
            </td>
            <td class="p-3 text-sm">
              <span :class="[
                'px-2 py-1 text-xs rounded-full',
                product.stockQty <= 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              ]">
                {{ product.stockQty <= 0 ? 'Out of Stock' : 'In Stock' }}
              </span>
            </td>
            <td class="p-3">
              <div class="flex items-center">
                <button @click="decreaseQuantity(product)" :disabled="product.quantity <= 1"
                  class="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-l disabled:opacity-50">
                  -
                </button>
                <span class="bg-gray-100 px-2 py-1 text-xs">
                  {{ product.quantity || 1 }}
                </span>
                <button @click="increaseQuantity(product)"
                  class="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded-r disabled:opacity-50">
                  +
                </button>
              </div>
            </td>
            <td class="p-3">
              <button @click="handleAddToCart(product)" 
                :disabled="product.stockQty <= 0"
                :class="[
                  'px-4 py-2 text-sm rounded transition-all duration-300 ease-in-out',
                  {
                    'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400': !product.justAdded,
                    'bg-green-700 text-white transform scale-95 cursor-default': product.justAdded,
                    'cursor-not-allowed': product.stockQty <= 0
                  }
                ]">
                <i class="ri-shopping-cart-line text-xs mr-1"></i>
                {{ product.justAdded ? 'Added!' : 'Add to cart' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useCartStore } from '~/stores/cart';
import { useRoute } from 'vue-router';

const emit = defineEmits(['itemAddedToCart']);

const props = defineProps({
  products: {
    type: Array,
    default: () => []
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

const route = useRoute();
const pharmacyStore = usePharmacyStore();
const cartStore = useCartStore();
const productItems = ref([]);

// Add loading state
const loading = ref(true);
const isFetching = ref(false); // Prevent duplicate fetches

// Get pharmacy slug from route params
const pharmacySlug = computed(() => route.params.pharmacy);

const initializeProductItems = () => {
  // Use passed products prop if available, otherwise fall back to store
  const sourceProducts = props.products && props.products.length > 0 
    ? props.products 
    : pharmacyStore.products;
    
  if (Array.isArray(sourceProducts)) {
    productItems.value = sourceProducts.map(product => ({
      ...product,
      quantity: 1,
      justAdded: false
    }));
  }
};

// Fetch products if not already loaded
onMounted(async () => {
  if (isFetching.value) return; // Prevent duplicate fetches
  
  if (pharmacyStore.isLoading) {
    // If the main store is already loading, wait for it
    watch(() => pharmacyStore.isLoading, (newVal) => {
      if (!newVal) {
        loading.value = false;
        // Initialize productItems when pharmacy store finishes loading
        initializeProductItems();
      }
    });
  } else {
    try {
      // If products aren't loaded yet and we're not already loading, fetch them
      if ((!pharmacyStore.products || pharmacyStore.products.length === 0) && 
          pharmacyStore.currentPharmacy && !isFetching.value) {

        isFetching.value = true;
        // Call the explicit fetchProducts method
        await pharmacyStore.fetchProducts();
      }
      // Initialize productItems
      initializeProductItems();
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      loading.value = false;
      isFetching.value = false;
    }
  }
});


// Watch for changes in the pharmacy route parameter
watch(() => pharmacySlug.value, async (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    if (pharmacyStore.pharmacySlug !== newSlug) {
      // Handle slug change in store if needed
      // This would usually be handled by middleware
    }
  }
});

// Watch for changes in the current pharmacy
watch(() => pharmacyStore.currentPharmacy, async (newPharmacy, oldPharmacy) => {
  if (newPharmacy && newPharmacy !== oldPharmacy && !isFetching.value) {
    loading.value = true;
    isFetching.value = true;
    try {
      // Explicitly fetch products when pharmacy changes
      await pharmacyStore.fetchProducts();
      // Reinitialize productItems
      initializeProductItems();
    } catch (error) {
      console.error('Error fetching products for pharmacy:', error);
    } finally {
      loading.value = false;
      isFetching.value = false;
    }
  }
});

// Enhanced computed property with safety checks
const filteredProducts = computed(() => {
  const query = props.searchQuery || '';
  
  // If no search query, return all productItems
  if (!query.trim()) {
    return productItems.value;
  }
  
  // Filter by search query
  return productItems.value.filter(product => 
    product.brandName && 
    product.brandName.toLowerCase().includes(query.toLowerCase())
  );
});

// Watch for changes in products prop
watch(() => props.products, () => {
  initializeProductItems();
}, { deep: true });

const formatPrice = (price) => {
  return Number(price || 0).toFixed(2);
};

const increaseQuantity = (product) => {
  product.quantity = (product.quantity || 1) + 1;
};

const decreaseQuantity = (product) => {
  if (product.quantity > 1) {
    product.quantity -= 1;
  }
};

// Check if product is already in cart
const isProductInCart = (productId) => {
  return cartStore.items.some(item => item.id === productId);
};

// Find product quantity in cart
const getCartQuantity = (productId) => {
  const item = cartStore.items.find(item => item.id === productId);
  return item ? item.quantity : 0;
};

const handleAddToCart = (product) => {
  if (product.stockQty <= 0) return;
  
  // Format the product data to match cart store expectations
  cartStore.addToCart({
    id: product.id,
    name: product.brandName,
    price: product.sellingPrice,
    quantity: product.quantity || 1,  // Use the quantity from UI
    image: product.imageUrl,
    pharmacyId: pharmacyStore.currentPharmacy,
    unit: product.unit || 'unit'
  });
  
  // Set justAdded to true
  product.justAdded = true;
  
  // Reset justAdded after 2 seconds
  setTimeout(() => {
    product.justAdded = false;
  }, 1000);

  emit('itemAddedToCart', product);
};
</script>