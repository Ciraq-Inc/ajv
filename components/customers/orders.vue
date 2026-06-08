<template>
  <div class="w-full pb-12">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between px-5 pt-4 pb-4">
      <h1 class="text-xl font-black text-[#350062] tracking-tight">Your Orders</h1>
      <span v-if="mergedItems.length > 0"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4F217A]/[0.07] text-[#4F217A] text-[11px] font-black tabular-nums">
        {{ mergedItems.length }}
      </span>
    </div>

    <!-- ── Status filter chips ── -->
    <div class="px-5 mb-4 overflow-x-auto no-scrollbar">
      <div class="inline-flex gap-2">
        <button @click="selectedStatus = ''"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
          :class="selectedStatus === '' ? 'text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'"
          :style="selectedStatus === '' ? 'background: #4F217A;' : ''">
          All
        </button>
        <button @click="selectedStatus = 'active'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
          :class="selectedStatus === 'active' ? 'text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'"
          :style="selectedStatus === 'active' ? 'background: #4F217A;' : ''">
          Active
        </button>
        <button @click="selectedStatus = 'in_transit'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
          :class="selectedStatus === 'in_transit' ? 'text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'"
          :style="selectedStatus === 'in_transit' ? 'background: #4F217A;' : ''">
          In Transit
        </button>
        <button @click="selectedStatus = 'completed'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
          :class="selectedStatus === 'completed' ? 'text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'"
          :style="selectedStatus === 'completed' ? 'background: #4F217A;' : ''">
          Completed
        </button>
        <button @click="selectedStatus = 'cancelled'"
          class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
          :class="selectedStatus === 'cancelled' ? 'text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'"
          :style="selectedStatus === 'cancelled' ? 'background: #4F217A;' : ''">
          Cancelled
        </button>
      </div>
    </div>

    <!-- ── Skeleton loading ── -->
    <div v-if="isLoading" class="px-5 space-y-3" aria-label="Fetching your orders…" aria-busy="true">
      <div v-for="n in 4" :key="n"
        class="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white px-4 py-4">
        <div class="h-10 w-10 rounded-full bg-zinc-200 animate-pulse shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 rounded bg-zinc-200 animate-pulse" :style="{ width: n % 2 === 0 ? '50%' : '42%' }"></div>
          <div class="h-2.5 rounded bg-zinc-200 animate-pulse" :style="{ width: n % 3 === 0 ? '30%' : '38%' }"></div>
        </div>
        <div class="shrink-0 space-y-1.5 flex flex-col items-end">
          <div class="h-3 w-14 rounded bg-zinc-200 animate-pulse"></div>
          <div class="h-4 w-12 rounded-full bg-zinc-200 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- ── Error + retry ── -->
    <div v-else-if="hasLoadError" class="px-5">
      <div class="rounded-2xl bg-white ring-1 ring-zinc-100 shadow-sm px-6 py-10 flex flex-col items-center text-center">
        <div class="w-14 h-14 bg-[#4F217A]/[0.06] rounded-2xl flex items-center justify-center mb-4">
          <ExclamationCircleIcon class="w-6 h-6 text-red-500" />
        </div>
        <p class="text-base font-bold text-zinc-800 mb-1">We couldn't load your orders</p>
        <p class="text-sm text-zinc-400 mb-6 max-w-[22ch] leading-relaxed">Sorry about that — everything is still saved on our end.</p>
        <button @click="loadOrders()"
          class="px-5 py-2.5 text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 transition-opacity active:opacity-80"
          style="background: #4F217A;">
          <ArrowPathIcon class="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>

    <!-- ── List ── -->
    <div v-else class="px-5 max-w-5xl mx-auto">

      <!-- Empty -->
      <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-14 h-14 bg-[#4F217A]/[0.06] rounded-2xl flex items-center justify-center mb-4">
          <ClipboardDocumentListIcon class="w-6 h-6 text-[#4F217A]/40" />
        </div>
        <p class="text-base font-bold text-zinc-800 mb-1">
          {{ selectedStatus ? 'Nothing in this category' : 'No orders yet' }}
        </p>
        <p class="text-sm text-zinc-400 max-w-[22ch] leading-relaxed">
          {{ selectedStatus ? 'Try a different filter above.' : 'Your pharmacy purchases and medication requests will appear here.' }}
        </p>
      </div>

      <!-- Rows grouped in one card -->
      <div v-else class="rounded-2xl overflow-hidden bg-white ring-1 ring-zinc-200 shadow-sm mb-4">
        <article
          v-for="item in filteredItems"
          :key="item._key"
          class="flex items-center gap-3 px-4 py-4 hover:bg-zinc-50 transition-colors cursor-pointer group border-b border-zinc-50 last:border-b-0"
          @click="item._type === 'store' ? viewOrder(item) : viewRequestOrder(item)"
        >
          <!-- Icon -->
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="
              item.status === 'completed' || item.status === 'delivered' || item.status === 'picked_up'
                ? 'bg-emerald-50 text-emerald-600'
                : item.status === 'cancelled' || item.status === 'driver_unavailable'
                  ? 'bg-red-50 text-red-400'
                  : item.status === 'processing' || item.status === 'shipped' || item.status === 'out_for_delivery' || item.status === 'ready_for_pickup'
                    ? 'bg-blue-50 text-blue-500'
                    : 'bg-amber-50 text-amber-500'
            ">
            <component :is="item._type === 'store' ? ShoppingBagIcon : ArchiveBoxIcon" class="w-5 h-5" />
          </div>

          <!-- Text -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-zinc-900 truncate mb-0.5">{{ item._displayId }}</p>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">{{ item._date }}</span>
              <span v-if="item._meta" class="text-[10px] font-medium text-zinc-400">· {{ item._meta }}</span>
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                :class="item._type === 'store' ? 'bg-zinc-100 text-zinc-400' : 'text-white'"
                :style="item._type === 'request' ? 'background: #4F217A;' : ''">
                {{ item._type === 'store' ? 'Store' : 'Request' }}
              </span>
            </div>
          </div>

          <!-- Right -->
          <div class="flex items-center gap-2.5 flex-shrink-0">
            <div class="flex flex-col items-end gap-1.5">
              <strong class="text-sm font-black text-zinc-900 tabular-nums">GHS {{ item._amount }}</strong>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                :class="item._type === 'store' ? orderStatusClass(item.status) : requestOrderStatusClass(item.status)">
                {{ item._type === 'store' ? formatStatus(item.status) : formatRequestStatus(item.status) }}
              </span>
            </div>
            <button
              v-if="item._type === 'store' && item.status === 'pending'"
              @click.stop="confirmCancelOrder(item)"
              class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors flex-shrink-0"
              :aria-label="`Cancel this order — ${item._displayId}`">
              <XMarkIcon class="w-4 h-4" />
            </button>
            <ChevronRightIcon class="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
          </div>
        </article>
      </div>

      <!-- Load more -->
      <div v-if="userStore.nextCursor && !selectedStatus" class="flex justify-center py-2 mb-4">
        <button
          :disabled="isLoadingMore"
          @click="loadMoreOrders"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-bold text-zinc-600 hover:border-[#4F217A] hover:text-[#4F217A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
          <ArrowPathIcon v-if="isLoadingMore" class="w-4 h-4 animate-spin" />
          {{ isLoadingMore ? 'Loading…' : 'Show more orders' }}
        </button>
      </div>
    </div>

    <!-- ── Store Order Detail Modal ── -->
    <div
      v-if="selectedOrder"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style="background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);"
      @click.self="selectedOrder = null"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh]">
        <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-100 flex-shrink-0">
          <div>
            <h3 class="font-black text-zinc-900 tracking-tight">Your purchase</h3>
            <p class="text-[11px] text-zinc-400 font-medium mt-0.5">Ref: {{ selectedOrder.order_id }}</p>
          </div>
          <button @click="selectedOrder = null"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
            <XMarkIcon class="w-[18px] h-[18px]" />
          </button>
        </div>
        <div class="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-zinc-50 rounded-xl px-3.5 py-3">
              <p class="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 mb-1">Date placed</p>
              <p class="text-[13px] font-bold text-zinc-900 leading-snug">{{ formatDate(selectedOrder.created_at) }}</p>
            </div>
            <div class="bg-zinc-50 rounded-xl px-3.5 py-3">
              <p class="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 mb-1">Status</p>
              <span class="inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                :class="orderStatusClass(selectedOrder.status)">
                {{ formatStatus(selectedOrder.status) }}
              </span>
            </div>
          </div>
          <div>
            <h4 class="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400 mb-2.5">What you ordered</h4>
            <div class="divide-y divide-zinc-50 rounded-xl border border-zinc-100 overflow-hidden bg-white">
              <div v-for="(item, index) in selectedOrder.items" :key="index"
                class="flex items-center justify-between px-4 py-3.5 gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-[13px] font-bold text-zinc-900 leading-snug truncate">{{ item.brand_name || item.product_name }}</p>
                  <p class="text-[11px] text-zinc-400 font-medium mt-0.5">Qty {{ item.qty }} · GHS {{ item.selling_price }} each</p>
                </div>
                <p class="text-[13px] font-black text-zinc-900 flex-shrink-0 tabular-nums">GHS {{ formatAmount(item.line_total) }}</p>
              </div>
            </div>
          </div>
          <div class="rounded-xl border border-zinc-100 overflow-hidden">
            <div class="divide-y divide-zinc-50">
              <div class="flex justify-between items-center px-4 py-3 text-sm text-zinc-500">
                <span class="font-medium">Subtotal</span>
                <span class="font-semibold tabular-nums">GHS {{ formatAmount(selectedOrder.subtotal || selectedOrder.total_amount) }}</span>
              </div>
              <div class="flex justify-between items-center px-4 py-3 text-sm text-zinc-500">
                <span class="font-medium">Tax</span>
                <span class="font-semibold tabular-nums">GHS {{ formatAmount(selectedOrder.tax_amount || 0) }}</span>
              </div>
              <div class="flex justify-between items-center px-4 py-3.5 bg-zinc-50">
                <span class="text-[13px] font-black text-zinc-900">Total paid</span>
                <span class="text-[15px] font-black text-zinc-900 tabular-nums">GHS {{ formatAmount(selectedOrder.total_amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Request Order Detail Modal ── -->
    <div
      v-if="selectedRequestOrder"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style="background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);"
      @click.self="selectedRequestOrder = null"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh]">
        <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-100 flex-shrink-0">
          <div>
            <h3 class="font-black text-zinc-900 tracking-tight">Medication request</h3>
            <p class="text-[11px] text-zinc-400 font-medium mt-0.5">We sourced these for you · {{ selectedRequestOrder.request_number }}</p>
          </div>
          <button @click="selectedRequestOrder = null"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
            <XMarkIcon class="w-[18px] h-[18px]" />
          </button>
        </div>
        <div class="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-zinc-50 rounded-xl px-3.5 py-3">
              <p class="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 mb-1">Last updated</p>
              <p class="text-[13px] font-bold text-zinc-900 leading-snug">{{ formatDate(selectedRequestOrder.updated_at || selectedRequestOrder.created_at) }}</p>
            </div>
            <div class="bg-zinc-50 rounded-xl px-3.5 py-3">
              <p class="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 mb-1">Status</p>
              <span class="inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                :class="requestOrderStatusClass(selectedRequestOrder.status)">
                {{ formatRequestStatus(selectedRequestOrder.status) }}
              </span>
            </div>
            <div v-if="selectedRequestOrder.fulfillment_type" class="bg-zinc-50 rounded-xl px-3.5 py-3">
              <p class="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 mb-1">How you'll receive it</p>
              <p class="text-[13px] font-bold text-zinc-900 capitalize leading-snug">{{ selectedRequestOrder.fulfillment_type }}</p>
            </div>
          </div>
          <div>
            <h4 class="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-400 mb-2.5">Medications we sourced for you</h4>
            <div class="divide-y divide-zinc-50 rounded-xl border border-zinc-100 overflow-hidden bg-white">
              <div v-for="(item, index) in selectedRequestOrder.items || []" :key="index"
                class="flex items-center justify-between px-4 py-3.5 gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-[13px] font-bold text-zinc-900 leading-snug truncate">{{ item.product_name }}</p>
                  <p class="text-[11px] text-zinc-400 font-medium mt-0.5">
                    Qty {{ item.quantity }} · GHS {{ formatAmount(item.marked_up_price || item.unit_price || 0) }} each
                  </p>
                </div>
                <p class="text-[13px] font-black text-zinc-900 flex-shrink-0 tabular-nums">
                  GHS {{ formatAmount(item.line_total || (Number(item.marked_up_price || item.unit_price || 0) * (item.quantity || 0))) }}
                </p>
              </div>
            </div>
          </div>
          <div class="rounded-xl border border-zinc-100 overflow-hidden">
            <div class="divide-y divide-zinc-50">
              <div class="flex justify-between items-center px-4 py-3 text-sm text-zinc-500">
                <span class="font-medium">Medications</span>
                <span class="font-semibold tabular-nums">GHS {{ formatAmount(selectedRequestOrder.items_total || 0) }}</span>
              </div>
              <div v-if="selectedRequestOrder.fulfillment_type === 'delivery' && selectedRequestOrder.delivery_fee"
                class="flex justify-between items-center px-4 py-3 text-sm text-zinc-500">
                <span class="font-medium">Delivery fee</span>
                <span class="font-semibold tabular-nums">GHS {{ formatAmount(selectedRequestOrder.delivery_fee || 0) }}</span>
              </div>
              <div class="flex justify-between items-center px-4 py-3.5 bg-zinc-50">
                <span class="text-[13px] font-black text-zinc-900">Total</span>
                <span class="text-[15px] font-black text-zinc-900 tabular-nums">GHS {{ formatAmount(getRequestTotalAmount(selectedRequestOrder)) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Cancel confirmation ── -->
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

    <!-- ── Toast ── -->
    <div v-if="toast"
      class="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-[13px] font-bold whitespace-nowrap"
      :class="toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'"
      role="status" aria-live="polite">
      <component :is="toast.type === 'error' ? ExclamationCircleIcon : CheckCircleIcon" class="w-4 h-4 flex-shrink-0" />
      {{ toast.text }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '~/stores/user';
import { useOrderStatus } from '~/composables/useOrderStatus';
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
