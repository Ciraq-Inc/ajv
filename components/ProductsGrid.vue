<!-- components/ProductsGrid.vue -->
<template>
  <div>
    <!-- Skeleton loading -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <div v-for="n in 8" :key="n" class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
        <div class="bg-gray-200 h-32 sm:h-36 w-full animate-pulse"></div>
        <div class="p-3 space-y-2 animate-pulse">
          <div class="bg-gray-200 rounded h-4 w-3/4"></div>
          <div class="bg-gray-200 rounded h-3 w-1/2"></div>
          <div class="flex gap-2 mt-3">
            <div class="bg-gray-200 rounded h-7 w-20"></div>
            <div class="bg-gray-200 rounded h-7 flex-1"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!sortedProducts.length" class="py-12 px-6 text-center bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 class="text-sm font-semibold text-gray-900">
        {{ searchQuery ? `No results for "${searchQuery}"` : 'No products available' }}
      </h3>
      <p class="mt-1 text-xs text-gray-500 mb-4">
        {{ searchQuery ? 'The pharmacy may not carry this item.' : 'This pharmacy has no products listed yet.' }}
      </p>
      <button v-if="searchQuery" @click="emit('requestProduct', searchQuery)"
        class="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-700 active:bg-gray-800 transition-colors shadow-sm">
        Request "{{ searchQuery }}"
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Products grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <div
        v-for="product in sortedProducts"
        :key="product.id"
        class="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200 overflow-hidden flex flex-col"
        :class="{ 'opacity-60': product.stockQty <= 0 }"
      >
        <!-- Image -->
        <div class="relative overflow-hidden bg-gray-50 cursor-zoom-in" @click="openLightbox(product)">
          <img
            :src="getImageURL(product)"
            :alt="product.brandName"
            loading="lazy"
            @error="handleImageError"
            class="w-full h-32 sm:h-36 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <!-- Low stock badge -->
          <div
            v-if="product.stockQty > 0 && product.stockQty <= 5"
            class="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm"
          >
            Only {{ product.stockQty }} left
          </div>
          <!-- Out of stock overlay -->
          <div
            v-if="product.stockQty <= 0"
            class="absolute inset-0 bg-white/60 flex items-center justify-center"
          >
            <span class="bg-white text-gray-500 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-gray-200">
              Out of stock
            </span>
          </div>
          <!-- Zoom hint -->
          <div class="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
            <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-lg p-1 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-2.5 sm:p-3 flex flex-col flex-1 gap-1.5">
          <h3 class="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {{ product.brandName }}
          </h3>
          <div v-if="!props.hidePrices" class="text-sm font-bold text-gray-900">
            GHS {{ formatPrice(product.sellingPrice) }}
            <span class="text-gray-400 text-xs font-normal ml-0.5">/ {{ product.unit || 'unit' }}</span>
          </div>
          <div v-else class="text-gray-400 text-xs italic">Price on request</div>

          <!-- Qty + Add button -->
          <div class="mt-auto pt-1 flex items-center gap-1.5">
            <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <button
                @click.stop="decreaseQuantity(product)"
                :disabled="product.quantity <= 1"
                class="px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors select-none leading-none"
                aria-label="Decrease quantity"
              >−</button>
              <span class="px-1.5 py-1 text-xs font-semibold text-gray-700 min-w-[1.75rem] text-center select-none">{{ product.quantity || 1 }}</span>
              <button
                @click.stop="increaseQuantity(product)"
                class="px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors select-none leading-none"
                aria-label="Increase quantity"
              >+</button>
            </div>
            <button
              @click.stop="handleAddToCart(product)"
              :disabled="product.stockQty <= 0 || !isProductActive(product)"
              :class="[
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 leading-none',
                product.stockQty <= 0 || !isProductActive(product)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : product.justAdded
                    ? 'add-btn text-white scale-95 shadow-sm'
                    : 'add-btn text-white shadow-sm'
              ]"
            >
              {{ product.justAdded ? '✓ Added' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lightbox-fade">
        <div
          v-if="lightboxProduct"
          class="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-4"
          @click="closeLightbox"
        >
          <div class="bg-white rounded-2xl overflow-hidden w-full max-w-xs shadow-2xl relative" @click.stop>
            <button
              @click="closeLightbox"
              class="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-1.5 text-gray-600 shadow-sm transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div class="bg-gray-50 h-56 flex items-center justify-center p-4">
              <img
                :src="getImageURL(lightboxProduct)"
                :alt="lightboxProduct.brandName"
                class="max-h-full max-w-full object-contain"
                @error="handleImageError"
              />
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 text-base leading-snug">{{ lightboxProduct.brandName }}</h3>
              <p v-if="lightboxProduct.dosage || lightboxProduct.strength" class="text-sm text-gray-500 mt-0.5">
                {{ [lightboxProduct.dosage, lightboxProduct.strength].filter(Boolean).join(' · ') }}
              </p>
              <p v-if="!props.hidePrices" class="text-xl font-bold text-gray-900 mt-2">
                GHS {{ formatPrice(lightboxProduct.sellingPrice) }}
                <span class="text-sm font-normal text-gray-400">/ {{ lightboxProduct.unit || 'unit' }}</span>
              </p>
              <div
                v-if="lightboxProduct.stockQty > 0 && lightboxProduct.stockQty <= 5"
                class="mt-2 inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Only {{ lightboxProduct.stockQty }} left
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useCartStore } from '~/stores/cart';
import { useRoute } from 'vue-router';

const emit = defineEmits(['itemAddedToCart', 'requestProduct']);

const props = defineProps({
  products: { type: Array, default: () => [] },
  searchQuery: { type: String, default: '' },
  hidePrices: { type: Boolean, default: false }
});

const route = useRoute();
const pharmacyStore = usePharmacyStore();
const cartStore = useCartStore();
const productItems = ref([]);
const loading = ref(true);
const isFetching = ref(false);
const lightboxProduct = ref(null);

const pharmacySlug = computed(() => route.params.pharmacy);

const isProductActive = (product) =>
  !(product?.isActive === false || product?.isActive === 0 || product?.isActive === '0');

const getImageURL = (product) => product?.productImageUrl || '/placeholder-med.svg';

const handleImageError = (event) => {
  event.target.src = '/placeholder-med.svg';
  event.target.onerror = null;
};

const openLightbox = (product) => { lightboxProduct.value = product; };
const closeLightbox = () => { lightboxProduct.value = null; };

const handleKeydown = (e) => { if (e.key === 'Escape') closeLightbox(); };

const initializeProductItems = () => {
  const sourceProducts = props.products && props.products.length > 0
    ? props.products
    : pharmacyStore.products;

  if (Array.isArray(sourceProducts)) {
    productItems.value = sourceProducts
      .filter(isProductActive)
      .map(product => ({ ...product, quantity: 1, justAdded: false }));
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown);

  if (isFetching.value) return;

  if (pharmacyStore.isLoading) {
    watch(() => pharmacyStore.isLoading, (newVal) => {
      if (!newVal) {
        loading.value = false;
        initializeProductItems();
      }
    });
  } else {
    try {
      if ((!pharmacyStore.products || pharmacyStore.products.length === 0) &&
        pharmacyStore.currentPharmacy && !isFetching.value) {
        isFetching.value = true;
        await pharmacyStore.fetchProducts();
      }
      initializeProductItems();
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      loading.value = false;
      isFetching.value = false;
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

watch(() => pharmacyStore.currentPharmacy, async (newPharmacy, oldPharmacy) => {
  if (newPharmacy && newPharmacy !== oldPharmacy && !isFetching.value) {
    loading.value = true;
    isFetching.value = true;
    try {
      await pharmacyStore.fetchProducts();
      initializeProductItems();
    } catch (error) {
      console.error('Error fetching products for pharmacy:', error);
    } finally {
      loading.value = false;
      isFetching.value = false;
    }
  }
});

const sortedProducts = computed(() => {
  const query = (props.searchQuery || '').trim().toLowerCase();
  let items = productItems.value;

  if (query) {
    items = items.filter(p =>
      isProductActive(p) && p.brandName?.toLowerCase().includes(query)
    );
  }

  return [...items].sort((a, b) => {
    const aIn = a.stockQty > 0;
    const bIn = b.stockQty > 0;
    if (aIn !== bIn) return aIn ? -1 : 1;
    return 0;
  });
});

watch(() => props.products, () => { initializeProductItems(); }, { deep: true });

const formatPrice = (price) => Number(price || 0).toFixed(2);

const increaseQuantity = (product) => { product.quantity = (product.quantity || 1) + 1; };
const decreaseQuantity = (product) => { if (product.quantity > 1) product.quantity -= 1; };

const handleAddToCart = (product) => {
  if (!isProductActive(product) || product.stockQty <= 0) return;

  cartStore.addToCart({
    id: product.id,
    name: product.brandName,
    price: product.sellingPrice,
    quantity: product.quantity || 1,
    image: product.productImageUrl,
    pharmacyId: pharmacyStore.currentPharmacy,
    unit: product.unit || 'unit'
  });

  product.justAdded = true;
  setTimeout(() => { product.justAdded = false; }, 1000);
  emit('itemAddedToCart', product);
};
</script>

<style scoped>
.add-btn {
  background-color: var(--shopfront-accent, #16a34a);
}
.add-btn:hover {
  filter: brightness(0.9);
}
.add-btn:active {
  filter: brightness(0.82);
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.18s ease;
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}
</style>
