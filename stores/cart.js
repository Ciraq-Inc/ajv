// Cart.js - Enhanced to better integrate with pharmacy middleware
import { defineStore } from "pinia";
import { usePharmacyStore } from '~/stores/pharmacy';

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
    isOpen: false,
    activePharmacy: null,
    activePharmacySlug: null,
  }),
  
  getters: {
    cartItemCount() {
      return this.items.reduce((count, item) => count + item.quantity, 0);
    },
    cartTotal() {
      return this.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },
    hasItems() {
      return this.items.length > 0;
    },
    // Add a getter to check if cart's pharmacy matches the current pharmacy context
    isInCorrectPharmacyContext() {
      const pharmacyStore = usePharmacyStore();
      return this.activePharmacy === pharmacyStore.currentPharmacy;
    }
  },
  
  actions: {
    setActivePharmacy(pharmacyId, pharmacySlug = null) {
      // Check if we're trying to set the same pharmacy
      if (this.activePharmacy === pharmacyId) {
        // If slug is provided and different, update it
        if (pharmacySlug && this.activePharmacySlug !== pharmacySlug) {
          this.activePharmacySlug = pharmacySlug;
          if (process.client) {
            localStorage.setItem('activeCartPharmacySlug', pharmacySlug);
          }
        }
        return true; // Already set to this pharmacy
      }
      
      // If switching pharmacies and we have items, confirm with user
      if (
        this.activePharmacy &&
        this.activePharmacy !== pharmacyId &&
        this.items.length > 0
      ) {
        if (
          confirm(
            "Switching to a new pharmacy will clear your current cart. Continue?"
          )
        ) {
          this.clearCart();
        } else {
          return false;
        }
      }
      
      // Set new pharmacy context
      this.activePharmacy = pharmacyId;
      if (pharmacySlug) {
        this.activePharmacySlug = pharmacySlug;
      }
      
      // Persist to storage
      if (process.client) {
        localStorage.setItem('activeCartPharmacy', pharmacyId);
        if (pharmacySlug) {
          localStorage.setItem('activeCartPharmacySlug', pharmacySlug);
        }
      }
      
      console.log(`Cart pharmacy context set to: ${pharmacyId} (${pharmacySlug || 'no slug'})`);
      return true;
    },
    
    setPharmacySlug(slug) {
      if (!slug) return;
      
      this.activePharmacySlug = slug;
      
      if (process.client) {
        localStorage.setItem('activeCartPharmacySlug', slug);
      }
      
      console.log(`Cart pharmacy slug updated to: ${slug}`);
    },

    addToCart(drug) {
      const pharmacyStore = usePharmacyStore();
      
      // Validate pharmacy context
      if (!this.activePharmacy) {
        // If no active pharmacy is set, use the current one from pharmacy store
        if (pharmacyStore.currentPharmacy) {
          this.setActivePharmacy(
            pharmacyStore.currentPharmacy, 
            pharmacyStore.pharmacySlug
          );
        } else {
          console.error("Cannot add to cart: No active pharmacy context");
          return;
        }
      }
      
      // Ensure drug has pharmacy info
      if (!drug.pharmacyId) {
        drug.pharmacyId = this.activePharmacy;
      }

      // Make sure we only add items from the active pharmacy
      if (drug.pharmacyId !== this.activePharmacy) {
        console.error("Cannot add items from different pharmacy to cart");
        return;
      }

      const existingItem = this.items.find((item) => item.id === drug.id);
      if (existingItem) {
        // Replace quantity instead of adding to it
        existingItem.quantity = drug.quantity || 1;
      } else {
        const quantity = drug.quantity || 1;
        this.items.unshift({ ...drug, quantity });
      }
      
      this.saveCartToStorage();
      
      // Open cart briefly to show the item was added
      this.isOpen = true;
      setTimeout(() => {
        this.isOpen = false;
      }, 3000);
    },
    
    removeFromCart(drugId) {
      const index = this.items.findIndex((item) => item.id === drugId);
      if (index !== -1) {
        this.items.splice(index, 1);
        this.saveCartToStorage();
      }
    },
    
    updateQuantity(drugId, newQuantity) {
      const item = this.items.find((item) => item.id === drugId);
      if (item) {
        item.quantity = newQuantity > 0 ? newQuantity : 1;
        this.saveCartToStorage();
      }
    },
    
    toggleCart() {
      this.isOpen = !this.isOpen;
    },
    
    clearCart() {
      this.items = [];
      this.saveCartToStorage();
    },
    
    saveCartToStorage() {
      if (!process.client) return;
      
      try {
        localStorage.setItem('cartItems', JSON.stringify(this.items));
        console.log('Cart saved to storage:', this.items.length, 'items');
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    },
    
    restoreFromStorage() {
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
          this.items = JSON.parse(storedItems);
          restored = true;
        }
        
        if (restored) {
          console.log('Cart restored from storage:', {
            pharmacy: this.activePharmacy,
            slug: this.activePharmacySlug,
            itemCount: this.items.length
          });
        }
      } catch (error) {
        console.error('Failed to restore cart from localStorage:', error);
      }
    },
    
    // New method to ensure cart pharmacy context matches the pharmacy store
    validatePharmacyContext() {
      const pharmacyStore = usePharmacyStore();
      
      // If pharmacies don't match, update cart pharmacy
      if (pharmacyStore.currentPharmacy && 
          this.activePharmacy !== pharmacyStore.currentPharmacy) {
        
        console.log('Pharmacy context mismatch, updating cart pharmacy');
        
        // Force update (will ask for confirmation if items exist)
        return this.setActivePharmacy(
          pharmacyStore.currentPharmacy, 
          pharmacyStore.pharmacySlug
        );
      }
      
      return true;
    }
  },
});