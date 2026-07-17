// stores/pharmacy.ts — Pharmacy store (JS → TS migration)
//
// Manages the "active pharmacy" session for the customer-facing storefront.
// Holds pharmacy metadata, product list, and pagination state. All HTTP
// delegates to pharmacyService; the store owns loading flags, error
// surfacing, localStorage persistence, and envelope handling.
//
// Task 2 — Cursor pagination: fetchProducts now accepts an optional
// `cursor` param. When supplied the service will receive it and the
// backend may return `{ items, next_cursor }` instead of a flat array.
// Both shapes are handled; `nextCursor` is stored on state so the
// component can drive infinite-scroll / "load more" patterns.

import { defineStore } from 'pinia';
import { otpService } from '~/utils/otpService';
import { createPharmacyService } from '~/services/pharmacy/pharmacyService';
import type { Company, Product, ProductClassification } from '~/services/types';

// ---------------------------------------------------------------------------
// Domain types (local to pharmacy store)
// ---------------------------------------------------------------------------

/**
 * Mapped product shape stored in the Pinia state. The service returns raw
 * API snake_case fields; fetchProducts maps them to camelCase on the way in.
 *
 * All optional fields are `T | null | undefined` so that `exactOptionalPropertyTypes`
 * does not reject assignments from raw API data where a field may be absent.
 */
export interface PharmacyProduct {
  id: number | string;
  barcode?: string | null | undefined;
  brandName?: string | undefined;
  masterName?: string | undefined;
  dosage?: string | null | undefined;
  strength?: string | null | undefined;
  unit?: string | null | undefined;
  buyUnit?: string | null | undefined;
  sellUnit?: string | null | undefined;
  costPrice?: number | null | undefined;
  sellingPrice?: number | null | undefined;
  markup?: number | null | undefined;
  discount?: number | null | undefined;
  stockQty?: number | undefined;
  reorder?: number | null | undefined;
  shelves?: string | null | undefined;
  productExpiry?: string | null | undefined;
  hasMultiExpiryDate?: boolean | null | undefined;
  hasTax?: boolean | null | undefined;
  multi?: boolean | null | undefined;
  supplier?: string | null | undefined;
  supplierId?: number | null | undefined;
  selectedProdClass?: string | null | undefined;
  isActive?: boolean | null | undefined;
  inStock?: boolean | undefined;
  quantity?: number | undefined;
  productImageUrl?: string | null | undefined;
  /** Raw API fields forwarded through for legacy callers */
  [key: string]: unknown;
}

export interface PharmacyData {
  id: number | string;
  uiid?: string | null | undefined;
  name?: string | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  tel1?: string | null | undefined;
  tel2?: string | null | undefined;
  whatsapp_number?: string | null | undefined;
  address?: string | null | undefined;
  address1?: string | null | undefined;
  address2?: string | null | undefined;
  location?: string | null | undefined;
  companytype?: string | null | undefined;
  domain_name?: string | null | undefined;
  logo?: string | null | undefined;
  logoUrl?: string | null | undefined;
  shop_banner?: string | null | undefined;
  subdomain?: string | null | undefined;
  hide_prices?: boolean | undefined;
  theme_preset?: string | undefined;
  theme_color?: string | null | undefined;
  [key: string]: unknown;
}

export interface ProductPagination {
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Customer row shape as used by this store (stub — managed via auth API). */
export interface StoredCustomer {
  id: number | string;
  phone?: string;
  [key: string]: unknown;
}

export interface PharmacyState {
  currentPharmacy: number | string | null;
  pharmacyData: PharmacyData | null;
  products: PharmacyProduct[];
  customers: StoredCustomer[];
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  pharmacySlug: string | null;
  productPagination: ProductPagination;
  /** Cursor returned by the last paginated products fetch. Null when no further pages. */
  nextCursor: string | null;
  /** Drug classifications actually carried by this pharmacy's stocked products. */
  classifications: ProductClassification[];
}

// ---------------------------------------------------------------------------
// Cursor-pagination response shape (Task 2)
// ---------------------------------------------------------------------------

interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
}

function isCursorPage<T>(value: unknown): value is CursorPage<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    Array.isArray((value as Record<string, unknown>)['items'])
  );
}

// ---------------------------------------------------------------------------
// Raw API product shape (server response before camelCase mapping)
// ---------------------------------------------------------------------------

interface RawApiProduct {
  id?: number | string;
  barcode?: string | null;
  brand_name?: string;
  master_name?: string;
  dosage?: string | null;
  strength?: string | null;
  unit?: string | null;
  buy_unit?: string | null;
  sell_unit?: string | null;
  cost_price?: number | null;
  selling_price?: number | null;
  markup?: number | null;
  discount?: number | null;
  stock_qty?: number;
  reorder?: number | null;
  shelves?: string | null;
  product_expiry?: string | null;
  has_multi_expiry_date?: boolean | null;
  has_tax?: boolean | null;
  multi?: boolean | null;
  supplier?: string | null;
  supplier_id?: number | null;
  selected_prod_class?: string | null;
  is_active?: boolean | null;
  product_image_url?: string | null;
}

function mapProduct(product: RawApiProduct): PharmacyProduct {
  return {
    id: product.id ?? 0,
    barcode: product.barcode,
    brandName: product.brand_name,
    masterName: product.master_name,
    dosage: product.dosage,
    strength: product.strength,
    unit: product.unit,
    buyUnit: product.buy_unit,
    sellUnit: product.sell_unit,
    costPrice: product.cost_price,
    sellingPrice: product.selling_price,
    markup: product.markup,
    discount: product.discount,
    stockQty: product.stock_qty,
    reorder: product.reorder,
    shelves: product.shelves,
    productExpiry: product.product_expiry,
    hasMultiExpiryDate: product.has_multi_expiry_date,
    hasTax: product.has_tax,
    multi: product.multi,
    supplier: product.supplier,
    supplierId: product.supplier_id,
    selectedProdClass: product.selected_prod_class,
    isActive: product.is_active,
    inStock: (product.stock_qty ?? 0) > 0,
    quantity: product.stock_qty,
    productImageUrl: product.product_image_url ?? null,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePharmacyStore = defineStore('pharmacy', {
  state: (): PharmacyState => ({
    currentPharmacy: null,
    pharmacyData: null,
    products: [],
    customers: [],
    isLoading: false,
    error: null,
    notFound: false,
    pharmacySlug: null,
    productPagination: {
      currentPage: 1,
      pageSize: 50,
      total: 0,
      totalPages: 0,
    },
    nextCursor: null,
    classifications: [],
  }),

  actions: {
    // -------------------------------------------------------------------
    // Service factory accessor — resolved at call time so useApi() is
    // always inside the Nuxt request context.
    // -------------------------------------------------------------------
    _pharmacyService() {
      return createPharmacyService(useApi());
    },

    async setCurrentPharmacy(pharmacyId: number | string): Promise<void> {
      this.currentPharmacy = pharmacyId;

      if (process.client) {
        try {
          localStorage.setItem('currentPharmacyId', String(pharmacyId));
        } catch (error) {
          console.error('Failed to save pharmacy ID to localStorage:', error);
        }
      }

      await this.fetchPharmacyData();
    },

    async fetchPharmacyData(): Promise<void> {
      const pharmacyId = this.currentPharmacy;
      if (!pharmacyId) return;

      this.isLoading = true;
      this.error = null;
      this.notFound = false;

      try {
        let data: Awaited<ReturnType<ReturnType<typeof this._pharmacyService>['getById']>>;
        try {
          data = await this._pharmacyService().getById(pharmacyId);
        } catch (httpErr: unknown) {
          const err = httpErr as { status?: number } | null;
          if (err && err.status === 404) {
            this.notFound = true;
            this.pharmacyData = null;
            this.products = [];
            this.customers = [];
            return;
          }
          throw new Error(`HTTP error! status: ${err?.status ?? 'unknown'}`);
        }

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to fetch pharmacy data');
        }

        const d = data.data as Company & {
          tel1?: string;
          tel2?: string;
          email?: string;
          address1?: string;
          address2?: string;
          location?: string;
          companytype?: string;
          hide_prices?: number | boolean;
          theme_preset?: string;
          theme_color?: string;
        };

        this.pharmacyData = {
          id: d.id,
          uiid: d.uiid,
          name: d.name,
          email: d.email,
          phone: d.tel1 ?? d.tel2,
          tel1: d.tel1,
          tel2: d.tel2,
          whatsapp_number: d.whatsapp_number,
          address: d.address1,
          address1: d.address1,
          address2: d.address2,
          location: d.location,
          companytype: d.companytype,
          domain_name: d.domain_name,
          logo: d.logo,
          logoUrl: d.logo,
          shop_banner: d.shop_banner,
          subdomain: d.domain_name,
          hide_prices: d.hide_prices === 1 || d.hide_prices === true,
          theme_preset: d.theme_preset ?? 'indigo',
          theme_color: d.theme_color ?? null,
        };

        const domainName = this.pharmacyData?.domain_name;
        if (domainName) {
          this.pharmacySlug = String(domainName);

          if (process.client) {
            try {
              localStorage.setItem('currentPharmacySlug', this.pharmacySlug);
            } catch (error) {
              console.error('Failed to save pharmacy slug to localStorage:', error);
            }
          }
        }

        await this.fetchProducts();
        void this.fetchClassifications();
      } catch (error: unknown) {
        console.error('Error fetching pharmacy data:', error);
        this.error = error instanceof Error ? error.message : String(error);
        this.products = [];
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Fetch products for the current pharmacy.
     *
     * Task 2 — Cursor pagination:
     * When `cursor` is provided the backend returns `{ items, next_cursor }`
     * inside `data`; when absent it returns a flat array. Both shapes are
     * handled here and `nextCursor` is updated accordingly.
     */
    async fetchProducts({
      page = 1,
      limit = 50,
      search = '',
      cursor,
      classificationId,
    }: {
      page?: number;
      limit?: number;
      search?: string;
      cursor?: string;
      classificationId?: number | string;
    } = {}): Promise<PharmacyProduct[]> {
      if (!this.currentPharmacy) return [];

      try {
        let data: Awaited<ReturnType<ReturnType<typeof this._pharmacyService>['listProducts']>>;
        try {
          data = await this._pharmacyService().listProducts({
            ...(this.currentPharmacy != null ? { companyId: this.currentPharmacy } : {}),
            page,
            limit,
            search,
            ...(cursor !== undefined ? { cursor } : {}),
            ...(classificationId !== undefined ? { classificationId } : {}),
            // Offset mode only — cursor pagination is currently unreachable
            // from the UI and the backend ignores `sort` on that branch.
            ...(cursor === undefined ? { sort: 'images_first' as const } : {}),
          });
        } catch (httpErr: unknown) {
          const err = httpErr as { status?: number } | null;
          throw new Error(`HTTP error! status: ${err?.status ?? 'unknown'}`);
        }

        if (!data.success) {
          throw new Error(data.message ?? 'Failed to fetch products');
        }

        // Handle cursor-page shape vs legacy flat array.
        // When a cursor was supplied we append; otherwise replace from scratch.
        if (isCursorPage<RawApiProduct>(data.data)) {
          this.nextCursor = data.data.next_cursor;
          const mapped = data.data.items.map(mapProduct);
          if (cursor !== undefined) {
            this.products = [...this.products, ...mapped];
          } else {
            this.products = mapped;
          }
        } else {
          this.nextCursor = null;
          const envelope = data as unknown as {
            page?: number;
            total?: number;
            totalPages?: number;
            data?: RawApiProduct[];
          };
          this.productPagination = {
            currentPage: envelope.page ?? page,
            pageSize: limit,
            total: envelope.total ?? 0,
            totalPages: envelope.totalPages ?? 0,
          };
          this.products = (Array.isArray(data.data) ? (data.data as RawApiProduct[]) : []).map(mapProduct);
        }

        return this.products;
      } catch (error: unknown) {
        console.error('Error fetching products:', error);
        this.products = [];
        throw error;
      }
    },

    /**
     * Distinct drug classifications actually carried by this pharmacy's
     * stocked products, resolved server-side via each product's
     * master_products link — replaces the old static category list.
     */
    async fetchClassifications(): Promise<ProductClassification[]> {
      if (!this.currentPharmacy) return [];

      try {
        const data = await this._pharmacyService().listClassifications(this.currentPharmacy);
        this.classifications = data.success && Array.isArray(data.data) ? data.data : [];
        return this.classifications;
      } catch (error: unknown) {
        console.error('Error fetching classifications:', error);
        this.classifications = [];
        return [];
      }
    },

    async fetchCustomers(): Promise<StoredCustomer[]> {
      if (!this.currentPharmacy) return [];

      try {
        console.warn('fetchCustomers: Customer data should be managed via authentication API');
        this.customers = [];
        return this.customers;
      } catch (error: unknown) {
        console.error('Error fetching customers:', error);
        this.customers = [];
        throw error;
      }
    },

    setCustomers(customersData: StoredCustomer[]): void {
      this.customers = customersData;
    },

    setPharmacySlug(slug: string): void {
      this.pharmacySlug = slug;

      if (process.client) {
        try {
          localStorage.setItem('currentPharmacySlug', slug);
        } catch (error) {
          console.error('Failed to save pharmacy slug to localStorage:', error);
        }
      }
    },

    async getPharmacyIdFromSlug(slug: string): Promise<string | null> {
      if (!slug) {
        console.log('No slug provided');
        return null;
      }

      console.log(`Looking up pharmacy ID for slug: '${slug}'`);

      try {
        let data: Awaited<ReturnType<ReturnType<typeof this._pharmacyService>['getByDomainSlug']>>;
        try {
          data = await this._pharmacyService().getByDomainSlug(slug);
        } catch (httpErr: unknown) {
          const err = httpErr as { status?: number } | null;
          if (err && err.status === 404) {
            console.log(`No pharmacy found for slug: '${slug}'`);
            return null;
          }
          throw new Error(`HTTP error! status: ${err?.status ?? 'unknown'}`);
        }

        if (data.success && data.data) {
          console.log(`Found pharmacy ID: ${data.data.id} for slug: ${slug}`);
          return String(data.data.id);
        }

        console.log(`No pharmacy ID found for slug: '${slug}'`);
        return null;
      } catch (error: unknown) {
        console.error('Error getting pharmacy ID from slug:', error);
        return null;
      }
    },

    async initializeFromSlug(slug: string): Promise<boolean> {
      if (!slug) return false;

      this.isLoading = true;
      this.error = null;
      this.notFound = false;

      try {
        const pharmacyId = await this.getPharmacyIdFromSlug(slug);

        if (!pharmacyId) {
          this.notFound = true;
          return false;
        }

        this.currentPharmacy = pharmacyId;
        this.pharmacySlug = slug;

        if (process.client) {
          try {
            localStorage.setItem('currentPharmacyId', pharmacyId);
            localStorage.setItem('currentPharmacySlug', slug);
          } catch (error) {
            console.error('Failed to save pharmacy data to localStorage:', error);
          }
        }

        await this.fetchPharmacyData();

        return true;
      } catch (error: unknown) {
        console.error('Error initializing pharmacy from slug:', error);
        this.error = error instanceof Error ? error.message : String(error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    findCustomerByPhone(phone: string): StoredCustomer | null {
      console.log(`Finding customer with phone: ${phone}`);
      console.warn('findCustomerByPhone: This method is deprecated. Use authentication API instead.');

      if (!Array.isArray(this.customers) || this.customers.length === 0) {
        console.log('No customers loaded in store');
        return null;
      }

      if (!phone) {
        console.error('No phone number provided to find customer');
        return null;
      }

      const formattedInputPhone = otpService.formatPhoneNumber(phone) as string;

      const exactMatch = this.customers.find(
        (customer) => customer.phone === formattedInputPhone,
      );

      if (exactMatch) {
        console.log(`Found exact phone match: ${exactMatch.id}`);
        return exactMatch;
      }

      console.warn(`No customer found with phone number: ${formattedInputPhone}`);
      return null;
    },

    async ensureCustomersLoaded(): Promise<void> {
      console.warn('ensureCustomersLoaded: Customer management now handled via authentication API');
    },

    async restoreFromStorage(): Promise<void> {
      if (!process.client) return;

      try {
        const storedPharmacyId = localStorage.getItem('currentPharmacyId');
        const storedPharmacySlug = localStorage.getItem('currentPharmacySlug');

        if (storedPharmacyId && !this.currentPharmacy) {
          this.currentPharmacy = storedPharmacyId;
          await this.fetchPharmacyData();
        }

        if (storedPharmacySlug && !this.pharmacySlug) {
          this.pharmacySlug = storedPharmacySlug;
        }
      } catch (error: unknown) {
        console.error('Error restoring pharmacy data from storage:', error);
      }
    },

    clearPharmacyData(): void {
      this.currentPharmacy = null;
      this.pharmacyData = null;
      this.products = [];
      this.customers = [];
      this.pharmacySlug = null;
      this.nextCursor = null;

      if (process.client) {
        try {
          localStorage.removeItem('currentPharmacyId');
          localStorage.removeItem('currentPharmacySlug');
          sessionStorage.removeItem('currentPharmacyId');
          sessionStorage.removeItem('currentPharmacySlug');
        } catch (error) {
          console.error('Failed to clear pharmacy data from storage:', error);
        }
      }
    },
  },

  getters: {
    hasProducts: (state): boolean =>
      Array.isArray(state.products) && state.products.length > 0,

    inStockProducts: (state): PharmacyProduct[] =>
      state.products.filter(
        (product) => (product.quantity ?? 0) > 0 || product.inStock === true,
      ),

    hasCustomers: (state): boolean =>
      Array.isArray(state.customers) && state.customers.length > 0,

    isNotFound: (state): boolean => state.notFound,

    pathPrefix: (state): string => {
      if (state.pharmacySlug) {
        return `/${state.pharmacySlug}`;
      }
      return '';
    },

    getPharmacyPath:
      (state) =>
      (path: string): string => {
        if (state.pharmacySlug) {
          const normalizedPath =
            path && !path.startsWith('/') ? `/${path}` : path;
          return `/${state.pharmacySlug}${normalizedPath || ''}`;
        }
        return path || '/';
      },
  },
});
