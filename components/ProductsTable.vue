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
    <div v-else-if="!filteredProducts.length" class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div class="mb-3 text-gray-400">
        <i class="ri-shopping-basket-line text-4xl"></i>
      </div>
      <h3 class="text-lg font-medium text-gray-900">No products available</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery ? 'Try adjusting your search query' : 'This pharmacy has no products listed yet' }}
      </p>
    </div>
    
    <!-- Products table -->
    <div v-else class="w-full overflow-x-auto rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <table class="w-full min-w-full table-fixed">
        <thead class="border-b border-slate-200 bg-slate-100/90">
          <tr>
            <th class="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Product</th>
            <th class="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Price</th>
            <th class="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Unit</th>
            <th class="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Availability</th>
            <th class="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quantity</th>
            <th class="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr v-for="product in filteredProducts" :key="product.id" class="transition-colors hover:bg-slate-50/80">
            <td class="px-5 py-4">
              <div class="space-y-1">
                <p class="text-sm font-semibold text-slate-900">
                  {{ product.brandName }}
                </p>
                <p v-if="product.masterName && product.masterName !== product.brandName" class="truncate text-xs text-slate-500">
                  {{ product.masterName }}
                </p>
              </div>
            </td>
            <td class="px-4 py-4">
              <div class="text-sm font-semibold text-slate-900">
                GHS {{ formatPrice(product.sellingPrice) }}
              </div>
              <div class="mt-1 text-xs text-slate-500">
                Selling price
              </div>
            </td>
            <td class="px-4 py-4 text-sm text-slate-700">
              {{ product.unit || 'Unit' }}
            </td>
            <td class="px-4 py-4 text-sm">
              <span :class="[
                'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                product.stockQty <= 0
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              ]">
                {{ product.stockQty <= 0 ? 'Out of Stock' : 'In Stock' }}
              </span>
            </td>
            <td class="px-4 py-4">
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
            </td>
            <td class="px-5 py-4">
              <button @click="handleAddToCart(product)" 
                :disabled="product.stockQty <= 0"
                :class="[
                  'inline-flex min-w-[134px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out',
                  {
                    'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300': !product.justAdded,
                    'bg-green-700 text-white transform scale-[0.98] cursor-default': product.justAdded,
                    'cursor-not-allowed': product.stockQty <= 0
                  }
                ]">
                <i class="ri-shopping-cart-line mr-1 text-xs"></i>
                {{ product.justAdded ? 'Added' : 'Add to cart' }}
              </button>
              <p v-if="isProductInCart(product.id)" class="mt-2 text-xs text-slate-500">
                In cart: {{ getCartQuantity(product.id) }}
              </p>
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
