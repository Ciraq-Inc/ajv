<!-- components/ProductsGrid.vue -->
<template>
  <div>
    <!-- Skeleton loading -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      <div v-for="n in 8" :key="n" class="bg-white rounded-3xl overflow-hidden shadow-md">
        <div class="bg-gray-100 h-36 sm:h-44 w-full skeleton-shimmer"></div>
        <div class="p-3 space-y-2.5">
          <div class="bg-gray-100 rounded-lg h-4 w-3/4 skeleton-shimmer"></div>
          <div class="bg-gray-100 rounded-lg h-3 w-1/3 skeleton-shimmer"></div>
          <div class="mt-3 bg-gray-100 rounded-full h-9 w-full skeleton-shimmer"></div>
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
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      <div
        v-for="product in sortedProducts"
        :key="product.id"
        class="group bg-white rounded-3xl shadow-md overflow-hidden flex flex-col product-card"
        :class="{ 'opacity-60': product.stockQty <= 0 }"
      >
        <!-- Image area — white when a photo is shown, tinted shelf plate otherwise -->
        <div
          class="relative overflow-hidden card-media-tile flex-shrink-0 h-36 sm:h-44 p-3"
          :class="hasImage(product) ? 'cursor-zoom-in' : 'card-media-tile--accent'"
          @click="hasImage(product) && openLightbox(product)"
        >
          <img
            v-if="hasImage(product)"
            :src="product.productImageUrl"
            :alt="product.brandName"
            loading="lazy"
            @error="handleCardImageError(product)"
            class="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
          />
          <!-- Low stock ribbon -->
          <div
            v-if="product.stockQty > 0 && product.stockQty <= 5"
            class="stock-ribbon"
          >
            {{ product.stockQty }} left
          </div>
          <!-- Out of stock overlay -->
          <div
            v-if="product.stockQty <= 0"
            class="absolute inset-0 bg-white/65 flex items-center justify-center"
          >
            <span class="bg-white text-gray-500 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm border border-gray-200">
              Out of stock
            </span>
          </div>
          <!-- Zoom hint -->
          <div class="absolute bottom-2 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div class="bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-3 flex flex-col flex-1 gap-2">
          <!-- Product name — two lines max -->
          <h3 class="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {{ product.brandName }}
          </h3>

          <!-- Price row -->
          <div class="flex items-baseline gap-1.5">
            <template v-if="!props.hidePrices">
              <span class="text-lg font-extrabold text-gray-900 tracking-tight">GHS {{ formatPrice(product.sellingPrice) }}</span>
              <span class="text-gray-400 text-xs font-medium">/ {{ product.unit || 'unit' }}</span>
            </template>
            <span v-else class="text-gray-400 text-xs italic">To be priced</span>
          </div>

          <!-- Spacer pushes controls to card bottom -->
          <div class="flex-1"></div>

          <!-- Qty stepper + Add to cart, side by side -->
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1 flex-shrink-0">
              <button
                @click.stop="decreaseQuantity(product)"
                :disabled="product.quantity <= 1"
                class="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:text-gray-700 disabled:opacity-30 transition-colors select-none"
                aria-label="Decrease quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
                </svg>
              </button>
              <span class="w-6 text-center text-sm font-semibold text-gray-700 select-none">{{ product.quantity || 1 }}</span>
              <button
                @click.stop="increaseQuantity(product)"
                class="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:text-gray-700 transition-colors select-none"
                aria-label="Increase quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <!-- Add to cart -->
            <button
              @click.stop="handleAddToCart(product)"
              :disabled="product.stockQty <= 0 || !isProductActive(product)"
              :class="[
                'flex-1 h-9 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-full transition-all duration-200',
                product.stockQty <= 0 || !isProductActive(product)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : product.justAdded
                    ? 'add-btn text-white shadow-sm'
                    : 'add-btn text-white shadow-sm hover:-translate-y-px'
              ]"
              :aria-label="product.justAdded ? 'Added to cart' : 'Add to cart'"
            >
              <svg v-if="product.justAdded" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class="hidden sm:inline truncate">{{ product.justAdded ? 'Added' : 'Add' }}</span>
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
                v-if="lightboxProduct.productImageUrl"
                :src="lightboxProduct.productImageUrl"
                :alt="lightboxProduct.brandName"
                class="max-h-full max-w-full object-contain"
                @error="handleLightboxImageError"
              />
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 text-base leading-snug">{{ lightboxProduct.brandName }}</h3>
              <p v-if="lightboxProduct.dosage || lightboxProduct.strength" class="text-sm text-gray-500 mt-0.5">
                {{ [lightboxProduct.dosage, lightboxProduct.strength].filter(Boolean).join(' · ') }}
              </p>
              <p v-if="!props.hidePrices" class="text-xl font-bold text-gray-900 mt-2">
                GHS {{ formatPrice(lightboxProduct.sellingPrice) }}
                <span class="text-sm font-normal text-gray-500">/ {{ lightboxProduct.unit || 'unit' }}</span>
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

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { usePharmacyStore } from '~/stores/pharmacy';
import { useCartStore } from '~/stores/cart';
import { useRoute } from 'vue-router';

interface PharmacyProduct {
  id: number;
  brandName: string;
  sellingPrice: number;
  stockQty: number;
  unit?: string;
  productImageUrl?: string;
  isActive?: boolean | number | string;
  dosage?: string;
  strength?: string;
  [key: string]: unknown;
}

interface ProductItem extends PharmacyProduct {
  quantity: number;
  justAdded: boolean;
  imageFailed: boolean;
}

// TODO: remove once stores/ are .ts
interface PharmacyStoreShape {
  isLoading: boolean;
  products: PharmacyProduct[];
  currentPharmacy: unknown;
  fetchProducts: () => Promise<void>;
}

// TODO: remove once stores/ are .ts
interface CartStoreShape {
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

const emit = defineEmits<{
  itemAddedToCart: [product: ProductItem];
  requestProduct: [query: string];
}>();

const props = defineProps<{
  products?: PharmacyProduct[];
  searchQuery?: string;
  hidePrices?: boolean;
}>();

const route = useRoute();
const pharmacyStore = usePharmacyStore() as unknown as PharmacyStoreShape;
const cartStore = useCartStore() as unknown as CartStoreShape;
const productItems = ref<ProductItem[]>([]);
const loading = ref<boolean>(true);
const isFetching = ref<boolean>(false);
const lightboxProduct = ref<ProductItem | null>(null);

const pharmacySlug = computed<string | string[]>(() => route.params['pharmacy'] ?? '');

const isProductActive = (product: PharmacyProduct): boolean =>
  !(product.isActive === false || product.isActive === 0 || product.isActive === '0');

const hasImage = (product: ProductItem): boolean =>
  Boolean(product.productImageUrl) && !product.imageFailed;

const handleCardImageError = (product: ProductItem): void => {
  product.imageFailed = true;
};

const handleLightboxImageError = (event: Event): void => {
  const target = event.target as HTMLImageElement;
  target.style.display = 'none';
  target.onerror = null;
};

const openLightbox = (product: ProductItem): void => { lightboxProduct.value = product; };
const closeLightbox = (): void => { lightboxProduct.value = null; };

const handleKeydown = (e: KeyboardEvent): void => { if (e.key === 'Escape') closeLightbox(); };

const initializeProductItems = (): void => {
  const sourceProducts: PharmacyProduct[] =
    props.products && props.products.length > 0
      ? props.products
      : pharmacyStore.products;

  if (Array.isArray(sourceProducts)) {
    productItems.value = sourceProducts
      .filter(isProductActive)
      .map((product): ProductItem => ({ ...product, quantity: 1, justAdded: false, imageFailed: false }));
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown);

  if (isFetching.value) return;

  if (pharmacyStore.isLoading) {
    watch(() => pharmacyStore.isLoading, (newVal: boolean) => {
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
    } catch (err) {
      console.error('Error fetching products:', err);
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
    } catch (err) {
      console.error('Error fetching products for pharmacy:', err);
    } finally {
      loading.value = false;
      isFetching.value = false;
    }
  }
});

const sortedProducts = computed<ProductItem[]>(() => {
  const query = (props.searchQuery ?? '').trim().toLowerCase();
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

const formatPrice = (price: number | null | undefined): string =>
  Number(price ?? 0).toFixed(2);

const increaseQuantity = (product: ProductItem): void => {
  product.quantity = (product.quantity ?? 1) + 1;
};
const decreaseQuantity = (product: ProductItem): void => {
  if (product.quantity > 1) product.quantity -= 1;
};

const handleAddToCart = (product: ProductItem): void => {
  if (!isProductActive(product) || product.stockQty <= 0) return;

  cartStore.addToCart({
    id: product.id,
    name: product.brandName,
    price: product.sellingPrice,
    quantity: product.quantity ?? 1,
    ...(product.productImageUrl != null && { image: product.productImageUrl }),
    pharmacyId: pharmacyStore.currentPharmacy,
    unit: product.unit ?? 'unit',
  });

  product.justAdded = true;
  setTimeout(() => { product.justAdded = false; }, 1000);
  emit('itemAddedToCart', product);
};
</script>

<style scoped>
/* ── Product card hover lift ─────────────────────────────────── */
.product-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.product-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .product-card:hover { transform: none; }
}

/* ── Shelf-tile media plate ──────────────────────────────────── */
.card-media-tile {
  background: #ffffff;
}
.card-media-tile--accent {
  background: linear-gradient(
    160deg,
    var(--shopfront-accent-soft, rgba(79, 70, 229, 0.08)),
    color-mix(in srgb, var(--shopfront-accent, #4f46e5) 14%, #ffffff)
  );
}

/* ── Low stock ribbon ─────────────────────────────────────────── */
.stock-ribbon {
  position: absolute;
  top: 10px;
  left: -6px;
  background: #f59e0b;
  color: #422006;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.02em;
  padding: 3px 10px 3px 14px;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.stock-ribbon::after {
  content: "";
  position: absolute;
  left: 0;
  top: 100%;
  border-width: 5px 6px 0 0;
  border-style: solid;
  border-color: #92400e transparent transparent transparent;
}

/* ── Add to cart button ──────────────────────────────────────── */
.add-btn {
  background-color: var(--shopfront-accent, #4f46e5);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--shopfront-accent, #4f46e5) 25%, transparent);
}
.add-btn:hover {
  box-shadow: 0 8px 18px color-mix(in srgb, var(--shopfront-accent, #4f46e5) 40%, transparent);
}
.add-btn:active {
  filter: brightness(0.9);
  transform: translateY(0) !important;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--shopfront-accent, #4f46e5) 25%, transparent);
}

/* ── Skeleton shimmer ────────────────────────────────────────── */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.skeleton-shimmer {
  background-image: linear-gradient(
    90deg,
    #f1f5f9 0%,
    #e8edf3 40%,
    #f1f5f9 80%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer { animation: none; background-color: #f1f5f9; }
}

/* ── Lightbox transition ─────────────────────────────────────── */
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.18s ease;
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}
</style>
