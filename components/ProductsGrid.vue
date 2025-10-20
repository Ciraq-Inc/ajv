<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="p-8 text-center">
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

    <!-- Products grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <div v-for="product in filteredProducts" :key="product.id"
        class="bg-white rounded-lg shadow-md hover:shadow-lg p-2 md:p-4 transition-shadow duration-300 overflow-hidden">
        <div class="flex space-x-3">
          <!-- Image Section -->
          <div class="flex flex-col">
            <!-- Use product image or a placeholder with lazy loading -->
            <img 
              :src="getImageURL(product) || '/placeholder-med.svg'"
              :alt="product.brandName"
              loading="lazy"
              :onerror="handleImageError"
              class="w-[90px] h-[80px] rounded object-cover cursor-pointer" />
          </div>

          <!-- Content Section -->
          <div class="space-y-2 flex-grow">
            <h3 class="text-sm font-semibold text-gray-800">
              {{ product.brandName.length > 25 ? product.brandName.slice(0, 25) + '...' : product.brandName }}
            </h3>
            <!-- <h3 class="text-sm font-semibold text-gray-800">
              {{ product.uniqid }}
            </h3> -->

            <div class="text-xs text-gray-800 font-semibold flex justify-between">
              <div>
                GHS {{ formatPrice(product.sellingPrice) }}
                <span class="text-gray-500 text-xs ml-1">/ {{ product.unit || 'unit' }}</span>
              </div>
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
            </div>

            <!-- Add to Cart Section -->
            <div class="flex justify-end">
              <button @click="handleAddToCart(product)" :disabled="product.stockQty <= 0" :class="[
                'px-4 py-2 text-sm rounded transition-all duration-300 ease-in-out',
                product.stockQty <= 0 ? 'bg-gray-400 text-white cursor-not-allowed' :
                  product.justAdded ? 'bg-green-600 text-white transform scale-95 cursor-default' :
                    'bg-green-700 text-white hover:bg-green-600'
              ]">
                <i class="ri-shopping-cart-line text-xs mr-1"></i>
                {{ product.justAdded ? 'Added!' : 'Cart' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
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

// Memoized image URL cache to prevent unnecessary recalculations
const imageUrlCache = new Map();

const getImageURL = (product) => {
  if (!product || !product.uniqid || product.uniqid == 0) return '/placeholder-med.svg';
  
  // Check cache first
  const cacheKey = product.uniqid;
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey);
  }
  
  // Generate URL and cache it
  const imageUrl = `https://firebasestorage.googleapis.com/v0/b/referral-system-5cebe.appspot.com/o/masterproducts%2F${product.uniqid}.jpg?alt=media`;
  imageUrlCache.set(cacheKey, imageUrl);
  return imageUrl;
};

// Handle image load errors by falling back to placeholder
const handleImageError = (event) => {
  event.target.src = '/placeholder-med.svg';
  event.target.onerror = null; // Prevent infinite loop
};

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
    
    // Clear image cache when products change to free memory
    if (imageUrlCache.size > 100) {
      imageUrlCache.clear();
    }
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

const increaseQuantity = (product) => {
  product.quantity = (product.quantity || 1) + 1;
};

const decreaseQuantity = (product) => {
  if (product.quantity > 1) {
    product.quantity -= 1;
  }
};

const handleAddToCart = (product) => {
  if (product.stockQty <= 0) return;
  
  // Format the product data to match cart store expectations
  cartStore.addToCart({
    id: product.id,
    name: product.brandName,
    price: product.sellingPrice,
    quantity: product.quantity || 1,
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

// Helper function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatPrice = (price) => {
  return Number(price || 0).toFixed(2);
};
</script>