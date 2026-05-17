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
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider w-16">Image</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Name</th>
            <th v-if="!props.hidePrices" class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">
              Price</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Unit</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Stock Status</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Quantity</th>
            <th class="p-4 text-left text-sm font-medium text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50 transition-colors">
            <td class="p-3">
              <div class="h-10 w-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                <img v-if="product.productImageUrl" :src="product.productImageUrl" :alt="product.brandName"
                  class="h-full w-full object-cover" @error="handleImageError" />
                <svg v-else class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </td>
            <td class="p-3 text-sm font-medium text-gray-900">
              {{ product.brandName }}
            </td>
            <td v-if="!props.hidePrices" class="p-3 text-sm text-gray-900">
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
                {{ product.stockQty <= 0 ? 'Out of Stock' : 'In Stock' }} </span>
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
              <button @click="handleAddToCart(product)" :disabled="product.stockQty <= 0 || !isProductActive(product)" :class="[
                'px-4 py-2 text-sm rounded transition-all duration-300 ease-in-out text-white add-btn',
                {
                  'opacity-50 cursor-not-allowed': product.stockQty <= 0 || !isProductActive(product),
                  'scale-95': product.justAdded,
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

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useCartStore } from '~/stores/cart';
import { useRoute } from 'vue-router';

// Shape coming from the pharmacy store (camelCase hydrated from API)
interface PharmacyProduct {
  id: number;
  brandName: string;
  sellingPrice: number;
  stockQty: number;
  unit?: string;
  productImageUrl?: string;
  isActive?: boolean | number | string;
  [key: string]: unknown;
}

// Runtime display item — product with UI-only fields appended
interface ProductItem extends PharmacyProduct {
  quantity: number;
  justAdded: boolean;
}

// TODO: remove once stores/ are .ts
interface PharmacyStoreShape {
  isLoading: boolean;
  products: PharmacyProduct[];
  currentPharmacy: unknown;
  pharmacySlug: string;
  fetchProducts: () => Promise<void>;
}

// TODO: remove once stores/ are .ts
interface CartStoreShape {
  items: { id: number; quantity: number; [key: string]: unknown }[];
  addToCart: (item: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    pharmacyId: unknown;
    unit: string;
  }) => void;
}

const emit = defineEmits<{ itemAddedToCart: [product: ProductItem] }>();

const props = defineProps<{
  products?: PharmacyProduct[];
  searchQuery?: string;
  hidePrices?: boolean;
}>();

const route = useRoute();
const pharmacyStore = usePharmacyStore() as unknown as PharmacyStoreShape;
const cartStore = useCartStore() as unknown as CartStoreShape;
const productItems = ref<ProductItem[]>([]);

const isProductActive = (product: PharmacyProduct): boolean =>
  !(product.isActive === false || product.isActive === 0 || product.isActive === '0');

const handleImageError = (event: Event): void => {
  const target = event.target as HTMLImageElement;
  target.style.display = 'none';
};

// Add loading state
const loading = ref<boolean>(true);
const isFetching = ref<boolean>(false); // Prevent duplicate fetches

// Get pharmacy slug from route params
const pharmacySlug = computed<string | string[]>(() => route.params['pharmacy'] ?? '');

const initializeProductItems = (): void => {
  // Use passed products prop if available, otherwise fall back to store
  const sourceProducts: PharmacyProduct[] =
    props.products && props.products.length > 0
      ? props.products
      : pharmacyStore.products;

  if (Array.isArray(sourceProducts)) {
    productItems.value = sourceProducts
      .filter((product) => isProductActive(product))
      .map((product): ProductItem => ({
        ...product,
        quantity: 1,
        justAdded: false,
      }));
  }
};

// Fetch products if not already loaded
onMounted(async () => {
  if (isFetching.value) return; // Prevent duplicate fetches

  if (pharmacyStore.isLoading) {
    // If the main store is already loading, wait for it
    watch(() => pharmacyStore.isLoading, (newVal: boolean) => {
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
    } catch (err) {
      console.error('Error fetching products:', err);
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
    } catch (err) {
      console.error('Error fetching products for pharmacy:', err);
    } finally {
      loading.value = false;
      isFetching.value = false;
    }
  }
});

// Enhanced computed property with safety checks
const filteredProducts = computed<ProductItem[]>(() => {
  const query = props.searchQuery ?? '';

  // If no search query, return all productItems
  if (!query.trim()) {
    return productItems.value;
  }

  // Filter by search query
  return productItems.value.filter(product =>
    isProductActive(product) &&
    product.brandName &&
    product.brandName.toLowerCase().includes(query.toLowerCase())
  );
});

// Watch for changes in products prop
watch(() => props.products, () => {
  initializeProductItems();
}, { deep: true });

const formatPrice = (price: number | null | undefined): string => {
  return Number(price ?? 0).toFixed(2);
};

const increaseQuantity = (product: ProductItem): void => {
  product.quantity = (product.quantity ?? 1) + 1;
};

const decreaseQuantity = (product: ProductItem): void => {
  if (product.quantity > 1) {
    product.quantity -= 1;
  }
};

// Check if product is already in cart
const isProductInCart = (productId: number): boolean => {
  return cartStore.items.some(item => item['id'] === productId);
};

// Find product quantity in cart
const getCartQuantity = (productId: number): number => {
  const item = cartStore.items.find(item => item['id'] === productId);
  return item ? (item['quantity'] as number) : 0;
};

const handleAddToCart = (product: ProductItem): void => {
  if (!isProductActive(product) || product.stockQty <= 0) return;

  // Format the product data to match cart store expectations
  cartStore.addToCart({
    id: product.id,
    name: product.brandName,
    price: product.sellingPrice,
    quantity: product.quantity ?? 1,  // Use the quantity from UI
    image: product.productImageUrl,
    pharmacyId: pharmacyStore.currentPharmacy,
    unit: product.unit ?? 'unit',
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

<style scoped>
.add-btn {
  background-color: var(--shopfront-accent, #16a34a);
}
.add-btn:hover:not(:disabled) {
  filter: brightness(0.9);
}
.add-btn:active:not(:disabled) {
  filter: brightness(0.82);
}
</style>