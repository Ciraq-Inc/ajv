<template>
  <div class="w-full pb-12 font-body">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 pb-4 pt-4">
      <h1 class="font-display text-2xl font-bold text-ink-900">Your Orders</h1>
      <span v-if="mergedItems.length > 0"
        class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold tabular-nums text-brand-700">
        {{ mergedItems.length }}
      </span>
    </div>

    <!-- Status filter chips -->
    <div class="no-scrollbar mb-4 overflow-x-auto px-5">
      <div class="inline-flex gap-2" role="group" aria-label="Filter orders">
        <button v-for="f in statusFilters" :key="f.value" type="button"
          :aria-pressed="selectedStatus === f.value ? 'true' : 'false'"
          @click="selectedStatus = f.value"
          class="min-h-[44px] whitespace-nowrap rounded-full px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          :class="selectedStatus === f.value ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'">
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3 px-5" role="status" aria-busy="true">
      <span class="sr-only">Fetching your orders…</span>
      <div v-for="n in 4" :key="n" class="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-lift" aria-hidden="true">
        <div class="h-10 w-10 shrink-0 animate-pulse rounded-full bg-ink-100"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 animate-pulse rounded bg-ink-100" :style="{ width: n % 2 === 0 ? '50%' : '42%' }"></div>
          <div class="h-3 animate-pulse rounded bg-ink-100" :style="{ width: n % 3 === 0 ? '30%' : '38%' }"></div>
        </div>
        <div class="h-4 w-14 shrink-0 animate-pulse rounded bg-ink-100"></div>
      </div>
    </div>

    <!-- Error + retry -->
    <div v-else-if="hasLoadError" class="px-5">
      <div role="alert" class="flex flex-col items-center rounded-3xl bg-white px-6 py-10 text-center shadow-lift">
        <span class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
          <ExclamationCircleIcon class="h-7 w-7" aria-hidden="true" />
        </span>
        <p class="font-display text-lg font-bold text-ink-900">We couldn't load your orders</p>
        <p class="mb-6 mt-1 max-w-xs text-base text-ink-600">Sorry about that. Everything is still saved on our end.</p>
        <button type="button" @click="loadOrders()"
          class="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-700 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
          <ArrowPathIcon class="h-5 w-5" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-else class="mx-auto max-w-5xl px-5">

      <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <span class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <ClipboardDocumentListIcon class="h-8 w-8" aria-hidden="true" />
        </span>
        <p class="font-display text-lg font-bold text-ink-900">
          {{ selectedStatus ? 'Nothing in this category' : 'No orders yet' }}
        </p>
        <p class="mt-1 max-w-xs text-base text-ink-600">
          {{ selectedStatus ? 'Try a different filter above.' : 'Your pharmacy purchases and medication requests will appear here.' }}
        </p>
      </div>

      <ul v-else aria-label="Your orders" class="mb-4 divide-y divide-ink-100 overflow-hidden rounded-3xl bg-white shadow-lift">
        <li v-for="item in filteredItems" :key="item._key" class="flex items-center">
          <button type="button"
            class="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700"
            @click="item._type === 'store' ? viewOrder(item) : viewRequestOrder(item)">
            <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
              :class="
                ['completed', 'delivered', 'picked_up'].includes(item.status ?? '')
                  ? 'bg-brand-50 text-brand-700'
                  : ['cancelled', 'driver_unavailable'].includes(item.status ?? '')
                    ? 'bg-red-50 text-red-700'
                    : ['processing', 'shipped', 'out_for_delivery', 'ready_for_pickup'].includes(item.status ?? '')
                      ? 'bg-ink-100 text-ink-900'
                      : 'bg-amber-50 text-amber-800'
              ">
              <component :is="item._type === 'store' ? ShoppingBagIcon : ArchiveBoxIcon" class="h-5 w-5" aria-hidden="true" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-base font-semibold text-ink-900">{{ item._displayId }}</span>
              <span class="block truncate text-sm text-ink-600">
                {{ item._date }}<template v-if="item._meta"> · {{ item._meta }}</template>
                · {{ item._type === 'store' ? 'Store' : 'Request' }}
              </span>
            </span>

            <span class="flex flex-shrink-0 flex-col items-end gap-1">
              <strong class="text-base font-bold tabular-nums text-ink-900">GHS {{ item._amount }}</strong>
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="item._type === 'store' ? orderStatusClass(item.status) : requestOrderStatusClass(item.status)">
                {{ item._type === 'store' ? formatStatus(item.status) : formatRequestStatus(item.status) }}
              </span>
            </span>
            <ChevronRightIcon class="h-5 w-5 flex-shrink-0 text-ink-400" aria-hidden="true" />
          </button>

          <button v-if="item._type === 'store' && item.status === 'pending'" type="button"
            @click="confirmCancelOrder(item)"
            class="mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
            :aria-label="`Cancel this order — ${item._displayId}`">
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <!-- Load more -->
      <div v-if="userStore.nextCursor && !selectedStatus" class="mb-4 flex justify-center py-2">
        <button type="button" :disabled="isLoadingMore" @click="loadMoreOrders"
          class="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:opacity-60">
          <ArrowPathIcon v-if="isLoadingMore" class="h-5 w-5 animate-spin" aria-hidden="true" />
          {{ isLoadingMore ? 'Loading…' : 'Show more orders' }}
        </button>
      </div>
    </div>

    <!-- Store order detail -->
    <div v-if="selectedOrder" data-testid="order-detail-backdrop"
      class="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 sm:items-center sm:p-4"
      @click.self="selectedOrder = null">
      <div ref="orderDialogRef" role="dialog" aria-modal="true" aria-labelledby="order-detail-title"
        class="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift sm:max-h-[85vh] sm:max-w-lg sm:rounded-3xl">
        <div class="flex flex-shrink-0 items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 id="order-detail-title" class="font-display text-2xl font-bold text-ink-900">Your purchase</h2>
            <p class="text-sm text-ink-600">Ref: {{ selectedOrder.order_id }}</p>
          </div>
          <button type="button" aria-label="Close" @click="selectedOrder = null"
            class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <dl class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-ink-50 px-4 py-3">
              <dt class="text-sm text-ink-600">Date placed</dt>
              <dd class="text-base font-semibold text-ink-900">{{ formatDate(selectedOrder.created_at) }}</dd>
            </div>
            <div class="rounded-2xl bg-ink-50 px-4 py-3">
              <dt class="text-sm text-ink-600">Status</dt>
              <dd class="mt-1">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="orderStatusClass(selectedOrder.status)">
                  {{ formatStatus(selectedOrder.status) }}
                </span>
              </dd>
            </div>
          </dl>
          <div>
            <h3 class="mb-2 text-base font-semibold text-ink-900">What you ordered</h3>
            <ul class="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-ink-50">
              <li v-for="(item, index) in selectedOrder.items" :key="index" class="flex items-center justify-between gap-3 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-base font-semibold text-ink-900">{{ item.brand_name || item.product_name }}</p>
                  <p class="text-sm text-ink-600">Qty {{ item.qty }} · GHS {{ item.selling_price }} each</p>
                </div>
                <p class="flex-shrink-0 text-base font-bold tabular-nums text-ink-900">GHS {{ formatAmount(item.line_total) }}</p>
              </li>
            </ul>
          </div>
          <dl class="space-y-2 rounded-2xl bg-ink-50 px-4 py-4">
            <div class="flex justify-between text-base text-ink-600">
              <dt>Subtotal</dt>
              <dd class="tabular-nums">GHS {{ formatAmount(selectedOrder.subtotal || selectedOrder.total_amount) }}</dd>
            </div>
            <div class="flex justify-between text-base text-ink-600">
              <dt>Tax</dt>
              <dd class="tabular-nums">GHS {{ formatAmount(selectedOrder.tax_amount || 0) }}</dd>
            </div>
            <div class="flex justify-between border-t border-ink-200 pt-2 text-lg font-bold text-ink-900">
              <dt>Total paid</dt>
              <dd class="tabular-nums">GHS {{ formatAmount(selectedOrder.total_amount) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- Request order detail -->
    <div v-if="selectedRequestOrder" data-testid="request-detail-backdrop"
      class="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 sm:items-center sm:p-4"
      @click.self="selectedRequestOrder = null">
      <div ref="requestDialogRef" role="dialog" aria-modal="true" aria-labelledby="request-order-title"
        class="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift sm:max-h-[85vh] sm:max-w-lg sm:rounded-3xl">
        <div class="flex flex-shrink-0 items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 id="request-order-title" class="font-display text-2xl font-bold text-ink-900">Medication request</h2>
            <p class="text-sm text-ink-600">We sourced these for you · {{ selectedRequestOrder.request_number }}</p>
          </div>
          <button type="button" aria-label="Close" @click="selectedRequestOrder = null"
            class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
            <XMarkIcon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <dl class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-ink-50 px-4 py-3">
              <dt class="text-sm text-ink-600">Last updated</dt>
              <dd class="text-base font-semibold text-ink-900">{{ formatDate(selectedRequestOrder.updated_at || selectedRequestOrder.created_at) }}</dd>
            </div>
            <div class="rounded-2xl bg-ink-50 px-4 py-3">
              <dt class="text-sm text-ink-600">Status</dt>
              <dd class="mt-1">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="requestOrderStatusClass(selectedRequestOrder.status)">
                  {{ formatRequestStatus(selectedRequestOrder.status) }}
                </span>
              </dd>
            </div>
            <div v-if="selectedRequestOrder.fulfillment_type" class="col-span-2 rounded-2xl bg-ink-50 px-4 py-3">
              <dt class="text-sm text-ink-600">How you'll receive it</dt>
              <dd class="text-base font-semibold capitalize text-ink-900">{{ selectedRequestOrder.fulfillment_type }}</dd>
            </div>
          </dl>
          <div>
            <h3 class="mb-2 text-base font-semibold text-ink-900">Medications we sourced for you</h3>
            <ul class="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-ink-50">
              <li v-for="(item, index) in selectedRequestOrder.items || []" :key="index" class="flex items-center justify-between gap-3 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-base font-semibold text-ink-900">{{ item.product_name }}</p>
                  <p class="text-sm text-ink-600">Qty {{ item.quantity }} · GHS {{ formatAmount(item.marked_up_price || item.unit_price || 0) }} each</p>
                </div>
                <p class="flex-shrink-0 text-base font-bold tabular-nums text-ink-900">
                  GHS {{ formatAmount(item.line_total || (Number(item.marked_up_price || item.unit_price || 0) * (item.quantity || 0))) }}
                </p>
              </li>
            </ul>
          </div>
          <dl class="space-y-2 rounded-2xl bg-ink-50 px-4 py-4">
            <div class="flex justify-between text-base text-ink-600">
              <dt>Medications</dt>
              <dd class="tabular-nums">GHS {{ formatAmount(selectedRequestOrder.items_total || 0) }}</dd>
            </div>
            <div v-if="selectedRequestOrder.fulfillment_type === 'delivery' && selectedRequestOrder.delivery_fee" class="flex justify-between text-base text-ink-600">
              <dt>Delivery fee</dt>
              <dd class="tabular-nums">GHS {{ formatAmount(selectedRequestOrder.delivery_fee || 0) }}</dd>
            </div>
            <div class="flex justify-between border-t border-ink-200 pt-2 text-lg font-bold text-ink-900">
              <dt>Total</dt>
              <dd class="tabular-nums">GHS {{ formatAmount(getRequestTotalAmount(selectedRequestOrder)) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- Cancel confirmation -->
    <ConfirmDialog
      :is-open="!!pendingCancelOrder"
      title="Cancel this order?"
      :message="pendingCancelOrder ? `Order #${String(pendingCancelOrder.order_id).substring(0, 8)} will be cancelled and can't be recovered. If you need these medications, you'll need to place a new order.` : ''"
      confirm-text="Yes, cancel it"
      cancel-text="Keep my order"
      variant="danger"
      @close="pendingCancelOrder = null"
      @confirm="performCancel"
    />

    <!-- Toast -->
    <div v-if="toast" data-testid="toast" :role="toast.type === 'error' ? 'alert' : 'status'"
      class="fixed inset-x-4 bottom-24 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl px-5 py-3 text-base font-semibold text-white shadow-lift lg:bottom-6"
      :class="toast.type === 'error' ? 'bg-red-700' : 'bg-brand-700'">
      <component :is="toast.type === 'error' ? ExclamationCircleIcon : CheckCircleIcon" class="h-6 w-6 flex-shrink-0" aria-hidden="true" />
      {{ toast.text }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/stores/user';
import { useOrderStatus } from '~/composables/useOrderStatus';
import { useModalA11y } from '~/composables/useModalA11y';
import { createOrderRequestsService } from '~/services/orderRequests/orderRequestsService';
import {
  ClockIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'

interface OrderItem {
  brand_name?: string;
  product_name?: string;
  qty?: number;
  quantity?: number;
  selling_price?: number | string;
  marked_up_price?: number | string;
  unit_price?: number | string;
  line_total?: number | string;
  [key: string]: unknown;
}

interface StoreOrder {
  order_id?: string | number;
  company_id?: number;
  company_name?: string;
  status?: string;
  created_at?: string;
  order_date?: string;
  total_amount?: number | string;
  subtotal?: number | string;
  tax_amount?: number | string;
  items?: OrderItem[];
  [key: string]: unknown;
}

interface PaidRequest {
  id?: number | string;
  request_number?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  fulfillment_type?: string;
  delivery_fee?: number | string;
  items_total?: number | string;
  estimated_total?: number | string;
  items?: OrderItem[];
  [key: string]: unknown;
}

interface MergedStoreItem extends StoreOrder {
  _type: 'store';
  _key: string;
  _displayId: string;
  _date: string;
  _sortDate: number;
  _meta: string | null;
  _amount: string;
}

interface MergedRequestItem extends PaidRequest {
  _type: 'request';
  _key: string;
  _displayId: string;
  _date: string;
  _sortDate: number;
  _meta: string | null;
  _amount: string;
}

type MergedItem = MergedStoreItem | MergedRequestItem;

// TODO: remove once stores/ are .ts
interface UserStoreShape {
  nextCursor: string | null;
  getAllOrders: (params: Record<string, unknown>) => Promise<StoreOrder[]>;
  getOrderDetails: (orderId: string | number, companyId: number | undefined) => Promise<StoreOrder>;
  cancelOrder: (orderId: string | number, companyId: number | undefined) => Promise<void>;
}

// TODO: remove once composables/ are .ts
interface OrderStatusComposable {
  formatStoreStatus: (status: string | undefined) => string;
  formatRequestStatus: (status: string | undefined) => string;
  storeStatusBadgeClass: (status: string | undefined) => string;
  requestStatusBadgeClass: (status: string | undefined) => string;
}

// TODO: remove once composables/ are .ts
interface ApiInstance {
  request: (url: string, options: { method: string }) => Promise<{ data?: unknown }>;
}

const props = defineProps<{
  initialOrderId?: string | null;
}>();

const userStore = useUserStore() as unknown as UserStoreShape;
const orderRequestsApi = useApi() as unknown as ApiInstance;
// createOrderRequestsService is imported but the component uses requestApiCall directly via orderRequestsApi
void createOrderRequestsService;
const {
  formatStoreStatus: formatStatus,
  formatRequestStatus,
  storeStatusBadgeClass: orderStatusClass,
  requestStatusBadgeClass: requestOrderStatusClass
} = useOrderStatus() as unknown as OrderStatusComposable;

// State
const isLoading = ref<boolean>(false);
const isLoadingMore = ref<boolean>(false);
const hasLoadError = ref<boolean>(false);
const orders = ref<StoreOrder[]>([]);
const paidRequests = ref<PaidRequest[]>([]);
const selectedOrder = ref<StoreOrder | null>(null);
const selectedRequestOrder = ref<PaidRequest | null>(null);
const selectedStatus = ref<string>('');
const pendingCancelOrder = ref<MergedStoreItem | null>(null);
const isCancelling = ref<boolean>(false);
const toast = ref<{ text: string; type: string } | null>(null);
const orderDialogRef = ref<HTMLElement | null>(null);
const requestDialogRef = ref<HTMLElement | null>(null);
useModalA11y(orderDialogRef, () => !!selectedOrder.value, () => { selectedOrder.value = null; });
useModalA11y(requestDialogRef, () => !!selectedRequestOrder.value, () => { selectedRequestOrder.value = null; });
const statusFilters = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
const POLL_INTERVAL_MS = 15000;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const showToast = (text: string, type = 'success'): void => {
  toast.value = { text, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = null; }, 4000);
};

const paidRequestStatuses = new Set<string>([
  'paid',
  'logistics_pending',
  'driver_unavailable',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered'
]);

// Format date
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format amount
const formatAmount = (amount: number | string | null | undefined): string => {
  return parseFloat(String(amount ?? 0)).toFixed(2);
};

// Generic GET helper for order-request sub-calls in this component.
// Delegates to useApi so auth headers and base URL are in one place.
const requestApiCall = async (method: string, url: string): Promise<{ data?: unknown }> => {
  return orderRequestsApi.request(url, { method });
};

const getRequestTotalAmount = (request: PaidRequest): number => {
  const estimated = Number(request.estimated_total);
  if (Number.isFinite(estimated) && estimated > 0) return estimated;
  const itemsTotal = Number(request.items_total ?? 0);
  const deliveryFee = request.fulfillment_type === 'delivery' ? Number(request.delivery_fee ?? 0) : 0;
  return itemsTotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0);
};

const mergedItems = computed<MergedItem[]>(() => {
  const storeItems: MergedStoreItem[] = orders.value.map((o): MergedStoreItem => ({
    ...o,
    _type: 'store',
    _key: `store-${String(o.order_id ?? '')}`,
    _displayId: `Order #${String(o.order_id ?? '').substring(0, 8)}`,
    _date: formatDate(o.created_at ?? o.order_date),
    _sortDate: new Date(o.created_at ?? o.order_date ?? '').getTime() || 0,
    _meta: o.company_name ?? null,
    _amount: formatAmount(o.total_amount)
  }));

  const requestItems: MergedRequestItem[] = paidRequests.value.map((r): MergedRequestItem => ({
    ...r,
    _type: 'request',
    _key: `req-${String(r.id ?? '')}`,
    _displayId: `Request #${String(r.request_number ?? '')}`,
    _date: formatDate(r.updated_at ?? r.created_at),
    _sortDate: new Date(r.updated_at ?? r.created_at ?? '').getTime() || 0,
    _meta: r.fulfillment_type ? (r.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup') : null,
    _amount: formatAmount(getRequestTotalAmount(r))
  }));

  return [...storeItems, ...requestItems].sort((a, b) => b._sortDate - a._sortDate);
});

const storeStatusMap: Record<string, string[]> = {
  active: ['pending', 'processing'],
  in_transit: ['shipped'],
  completed: ['completed', 'delivered', 'picked_up'],
  cancelled: ['cancelled']
};

const requestStatusMap: Record<string, string[]> = {
  active: ['paid', 'logistics_pending'],
  in_transit: ['out_for_delivery', 'ready_for_pickup'],
  completed: ['delivered', 'picked_up', 'completed'],
  cancelled: ['cancelled', 'driver_unavailable', 'returned']
};

const filteredItems = computed<MergedItem[]>(() => {
  if (!selectedStatus.value) return mergedItems.value;
  return mergedItems.value.filter(item => {
    const matchSet = item._type === 'store'
      ? storeStatusMap[selectedStatus.value]
      : requestStatusMap[selectedStatus.value];
    return matchSet ? matchSet.includes(item.status ?? '') : false;
  });
});

const fetchPaidRequests = async (): Promise<PaidRequest[]> => {
  const res = await requestApiCall('GET', '/api/order-requests/customer?limit=100');
  const data = (res.data ?? []) as PaidRequest[];
  return data.filter((req) => paidRequestStatuses.has(req.status ?? ''));
};

const viewRequestOrder = async (request: MergedRequestItem): Promise<void> => {
  try {
    const res = await requestApiCall('GET', `/api/order-requests/customer/${String(request.id ?? '')}`);
    selectedRequestOrder.value = res.data as PaidRequest;
  } catch (err) {
    console.error('Error loading request details:', err);
    showToast('Failed to load request details', 'error');
  }
};

// Load orders + paid requests
const loadOrders = async ({ silent = false }: { silent?: boolean } = {}): Promise<void> => {
  try {
    if (!silent) {
      isLoading.value = true;
      hasLoadError.value = false;
    }

    const [ordersResult, requestsResult] = await Promise.allSettled([
      userStore.getAllOrders({}),
      fetchPaidRequests()
    ]);

    const nextOrders: StoreOrder[] = ordersResult.status === 'fulfilled' ? (ordersResult.value ?? []) : [];
    const nextPaidRequests: PaidRequest[] = requestsResult.status === 'fulfilled' ? (requestsResult.value ?? []) : paidRequests.value;

    if (ordersResult.status === 'rejected') {
      console.error('Error loading store orders:', ordersResult.reason);
    }
    if (requestsResult.status === 'rejected') {
      console.error('Error loading paid request orders:', requestsResult.reason);
    }

    const bothFailed = ordersResult.status === 'rejected' && requestsResult.status === 'rejected';
    if (!silent) {
      hasLoadError.value = bothFailed;
    } else if (bothFailed) {
      showToast('Could not refresh history', 'error');
    }

    orders.value = nextOrders;
    paidRequests.value = nextPaidRequests;

    // Keep open modal order status/details synced with latest list values.
    if (selectedOrder.value?.order_id != null) {
      const refreshed = nextOrders.find(o => o.order_id === selectedOrder.value!.order_id);
      if (refreshed) {
        selectedOrder.value = { ...selectedOrder.value, ...refreshed };
      }
    }

    if (selectedRequestOrder.value?.id != null) {
      const refreshedRequest = nextPaidRequests.find(r => r.id === selectedRequestOrder.value!.id);
      if (refreshedRequest) {
        selectedRequestOrder.value = { ...selectedRequestOrder.value, ...refreshedRequest };
      } else if (!paidRequestStatuses.has(selectedRequestOrder.value.status ?? '')) {
        selectedRequestOrder.value = null;
      }
    }
  } catch (err) {
    console.error('Error loading orders:', err);
    if (!silent) hasLoadError.value = true;
  } finally {
    if (!silent) isLoading.value = false;
  }
};

// Load the next page of store orders via cursor and append to local list.
const loadMoreOrders = async (): Promise<void> => {
  if (!userStore.nextCursor || isLoadingMore.value) return;
  isLoadingMore.value = true;
  try {
    const nextPage = await userStore.getAllOrders({ cursor: userStore.nextCursor });
    orders.value = [...orders.value, ...nextPage];
  } catch (err) {
    console.error('Error loading more orders:', err);
    showToast('Could not load more orders', 'error');
  } finally {
    isLoadingMore.value = false;
  }
};

// View order details
const viewOrder = async (order: MergedStoreItem): Promise<void> => {
  try {
    const details = await userStore.getOrderDetails(order.order_id ?? '', order.company_id);
    selectedOrder.value = details;
  } catch (err) {
    console.error('Error loading order details:', err);
    showToast('Failed to load order details', 'error');
  }
};

const confirmCancelOrder = (order: MergedStoreItem): void => {
  pendingCancelOrder.value = order;
};

const performCancel = async (): Promise<void> => {
  if (!pendingCancelOrder.value || isCancelling.value) return;
  const { order_id, company_id } = pendingCancelOrder.value;
  isCancelling.value = true;
  try {
    await userStore.cancelOrder(order_id ?? '', company_id);
    pendingCancelOrder.value = null;
    showToast('Order cancelled');
    void loadOrders({ silent: true });
  } catch (err) {
    console.error('Error cancelling order:', err);
    showToast(err instanceof Error ? err.message : 'Failed to cancel order', 'error');
  } finally {
    isCancelling.value = false;
  }
};

// Initialize
onMounted(async () => {
  await loadOrders();

  if (props.initialOrderId) {
    const matchOrder = orders.value.find(o => o.order_id === props.initialOrderId);
    const matchRequest = paidRequests.value.find(r => String(r.id ?? '') === String(props.initialOrderId ?? ''));
    const match = matchOrder ?? matchRequest;
    if (match) {
      if ('order_id' in match && match.order_id != null) {
        void viewOrder(match as MergedStoreItem);
      } else {
        selectedRequestOrder.value = match as PaidRequest;
      }
    }
  }

  pollTimer = setInterval(async () => {
    await loadOrders({ silent: true });
  }, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>
