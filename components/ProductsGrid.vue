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
    <div v-else-if="!filteredProducts.length" class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div class="mb-3 text-gray-400">
        <i class="ri-shopping-basket-line text-4xl"></i>
      </div>
      <h3 class="text-lg font-medium text-gray-900">No products available</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery ? 'Try adjusting your search query' : 'This pharmacy has no products listed yet' }}
      </p>
    </div>

    <!-- Products grid -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="product in filteredProducts" :key="product.id"
        class="overflow-hidden rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md md:p-4">
        <div class="flex gap-3">
          <!-- Image Section -->
          <div class="flex flex-col">
            <!-- Use product image or a placeholder with lazy loading -->
            <img 
              :src="getImageURL(product) || '/placeholder-med.svg'"
              :alt="product.brandName"
              loading="lazy"
              :onerror="handleImageError"
              class="h-[96px] w-[96px] rounded-2xl border border-slate-100 bg-slate-50 object-cover cursor-pointer" />
          </div>

          <!-- Content Section -->
          <div class="min-w-0 flex-grow">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-sm font-semibold leading-5 text-slate-900">
                {{ product.brandName.length > 42 ? product.brandName.slice(0, 42) + '...' : product.brandName }}
              </h3>
              <span :class="[
                'inline-flex shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium',
                product.stockQty <= 0
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              ]">
                {{ product.stockQty <= 0 ? 'Out' : 'In stock' }}
              </span>
            </div>

            <p v-if="product.masterName && product.masterName !== product.brandName" class="mt-1 truncate text-xs text-slate-500">
              {{ product.masterName }}
            </p>

            <div class="mt-4 flex items-end justify-between gap-3">
              <div>
                <div class="text-base font-semibold text-slate-900">
                  GHS {{ formatPrice(product.sellingPrice) }}
                </div>
                <span class="mt-1 block text-xs text-slate-500">per {{ product.unit || 'unit' }}</span>
              </div>

              <div class="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button @click="decreaseQuantity(product)" :disabled="product.quantity <= 1"
                  class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
                  -
                </button>
                <span class="min-w-[2rem] px-2 py-1 text-center text-xs font-semibold text-slate-700">
                  {{ product.quantity || 1 }}
                </span>
                <button @click="increaseQuantity(product)"
                  class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
                  +
                </button>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between gap-3">
              <p v-if="isProductInCart(product.id)" class="text-xs font-medium text-slate-500">
                In cart: {{ getCartQuantity(product.id) }}
              </p>
              <div v-else class="text-xs text-slate-400">
                Ready to add
              </div>

              <button @click="handleAddToCart(product)" :disabled="product.stockQty <= 0" :class="[
                'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out',
                product.stockQty <= 0 ? 'bg-gray-300 text-white cursor-not-allowed' :
                  product.justAdded ? 'bg-green-700 text-white transform scale-[0.98] cursor-default' :
                    'bg-green-600 text-white hover:bg-green-700'
              ]">
                <i class="ri-shopping-cart-line mr-1 text-xs"></i>
                {{ product.justAdded ? 'Added' : 'Add' }}
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

const isProductInCart = (productId) => {
  return cartStore.items.some(item => item.id === productId);
};

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
