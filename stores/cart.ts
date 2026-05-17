// stores/cart.ts — Cart store (JS → TS migration)
//
// Tracks items the customer is adding from a single pharmacy session.
// Cart pharmacy context is persisted to localStorage so it survives page
// reloads. Cross-pharmacy add attempts prompt the user to clear the cart
// first. Business logic is a 1:1 port of the original cart.js — no
// behavioural changes allowed.

import { defineStore } from 'pinia';
import { usePharmacyStore } from '~/stores/pharmacy';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface CartItem {
  id: number | string;
  pharmacyId?: number | string | null;
  quantity: number;
  price: number;
  [key: string]: unknown;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  activePharmacy: number | string | null;
  activePharmacySlug: string | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    isOpen: false,
    activePharmacy: null,
    activePharmacySlug: null,
  }),

  getters: {
    cartItemCount(state): number {
      return state.items.reduce((count, item) => count + item.quantity, 0);
    },

    cartTotal(state): number {
      return state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
    },

    hasItems(state): boolean {
      return state.items.length > 0;
    },

    // Check if the cart's pharmacy matches the current pharmacy context.
    isInCorrectPharmacyContext(state): boolean {
      const pharmacyStore = usePharmacyStore();
      return state.activePharmacy === pharmacyStore.currentPharmacy;
    },
  },

  actions: {
    setActivePharmacy(pharmacyId: number | string, pharmacySlug: string | null = null): boolean {
      // Already on this pharmacy — possibly update slug only.
      if (this.activePharmacy === pharmacyId) {
        if (pharmacySlug && this.activePharmacySlug !== pharmacySlug) {
          this.activePharmacySlug = pharmacySlug;
          if (process.client) {
            localStorage.setItem('activeCartPharmacySlug', pharmacySlug);
          }
        }
        return true;
      }

      // Switching pharmacies with existing items — confirm with user.
      if (
        this.activePharmacy &&
        this.activePharmacy !== pharmacyId &&
        this.items.length > 0
      ) {
        if (
          confirm(
            'Switching to a new pharmacy will clear your current cart. Continue?',
          )
        ) {
          this.clearCart();
        } else {
          return false;
        }
      }

      this.activePharmacy = pharmacyId;
      if (pharmacySlug) {
        this.activePharmacySlug = pharmacySlug;
      }

      if (process.client) {
        localStorage.setItem('activeCartPharmacy', String(pharmacyId));
        if (pharmacySlug) {
          localStorage.setItem('activeCartPharmacySlug', pharmacySlug);
        }
      }

      console.log(`Cart pharmacy context set to: ${pharmacyId} (${pharmacySlug ?? 'no slug'})`);
      return true;
    },

    setPharmacySlug(slug: string): void {
      if (!slug) return;

      this.activePharmacySlug = slug;

      if (process.client) {
        localStorage.setItem('activeCartPharmacySlug', slug);
      }

      console.log(`Cart pharmacy slug updated to: ${slug}`);
    },

    addToCart(drug: CartItem): void {
      const pharmacyStore = usePharmacyStore();

      if (!this.activePharmacy) {
        if (pharmacyStore.currentPharmacy) {
          this.setActivePharmacy(
            pharmacyStore.currentPharmacy,
            pharmacyStore.pharmacySlug,
          );
        } else {
          console.error('Cannot add to cart: No active pharmacy context');
          return;
        }
      }

      if (!drug.pharmacyId) {
        drug.pharmacyId = this.activePharmacy;
      }

      if (drug.pharmacyId !== this.activePharmacy) {
        console.error('Cannot add items from different pharmacy to cart');
        return;
      }

      const existingItem = this.items.find((item) => item.id === drug.id);
      if (existingItem) {
        existingItem.quantity = drug.quantity || 1;
      } else {
        const quantity = drug.quantity || 1;
        this.items.unshift({ ...drug, quantity });
      }

      this.saveCartToStorage();
    },

    removeFromCart(drugId: number | string): void {
      const index = this.items.findIndex((item) => item.id === drugId);
      if (index !== -1) {
        this.items.splice(index, 1);
        this.saveCartToStorage();
      }
    },

    updateQuantity(drugId: number | string, newQuantity: number): void {
      const item = this.items.find((item) => item.id === drugId);
      if (item) {
        item.quantity = newQuantity > 0 ? newQuantity : 1;
        this.saveCartToStorage();
      }
    },

    toggleCart(): void {
      this.isOpen = !this.isOpen;
    },

    clearCart(): void {
      this.items = [];
      this.saveCartToStorage();
    },

    saveCartToStorage(): void {
      if (!process.client) return;

      try {
        localStorage.setItem('cartItems', JSON.stringify(this.items));
        console.log('Cart saved to storage:', this.items.length, 'items', this.items);
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    },

    restoreFromStorage(): void {
      if (!process.client) return;

      try {
        const storedPharmacy = localStorage.getItem('activeCartPharmacy');
        const storedPharmacySlug = localStorage.getItem('activeCartPharmacySlug');
        const storedItems = localStorage.getItem('cartItems');

        let restored = false;

        if (storedPharmacy) {
          this.activePharmacy = storedPharmacy;
          restored = true;
        }

        if (storedPharmacySlug) {
          this.activePharmacySlug = storedPharmacySlug;
          restored = true;
        }

        if (storedItems) {
          this.items = JSON.parse(storedItems) as CartItem[];
          restored = true;
        }

        if (restored) {
          console.log('Cart restored from storage:', {
            pharmacy: this.activePharmacy,
            slug: this.activePharmacySlug,
            itemCount: this.items.length,
          });
        }
      } catch (error) {
        console.error('Failed to restore cart from localStorage:', error);
      }
    },

    validatePharmacyContext(): boolean {
      const pharmacyStore = usePharmacyStore();

      if (
        pharmacyStore.currentPharmacy &&
        this.activePharmacy !== pharmacyStore.currentPharmacy
      ) {
        console.log('Pharmacy context mismatch, updating cart pharmacy');
        return this.setActivePharmacy(
          pharmacyStore.currentPharmacy,
          pharmacyStore.pharmacySlug,
        );
      }

      return true;
    },
  },
});
