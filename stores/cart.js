// Cart.js - Updated for path-based routing
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
    isOpen: false,
    activePharmacy: null,
    activePharmacySlug: null, // Added to track the pharmacy slug
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
    // Check if cart has items
    hasItems() {
      return this.items.length > 0;
    }
  },
  
  actions: {
    // Set active pharmacy
    setActivePharmacy(pharmacyId, pharmacySlug = null) {
      // If switching pharmacies, clear the cart
      if (
        this.activePharmacy &&
        this.activePharmacy !== pharmacyId &&
        this.items.length > 0 // Fixed typo: was this.item.length
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
      
      this.activePharmacy = pharmacyId;
      if (pharmacySlug) {
        this.activePharmacySlug = pharmacySlug;
      }
      
      // Store pharmacy info for persistence
      if (process.client) {
        localStorage.setItem('activeCartPharmacy', pharmacyId);
        if (pharmacySlug) {
          localStorage.setItem('activeCartPharmacySlug', pharmacySlug);
        }
      }
      
      return true;
    },
    
    // Set pharmacy slug without changing ID (e.g. if learned later)
    setPharmacySlug(slug) {
      if (!slug) return;
      
      this.activePharmacySlug = slug;
      
      if (process.client) {
        localStorage.setItem('activeCartPharmacySlug', slug);
      }
    },

    addToCart(drug) {
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
        existingItem.quantity += drug.quantity || 1;
      } else {
        const quantity = drug.quantity || 1;
        this.items.unshift({ ...drug, quantity });
      }
      
      // Save cart to localStorage for persistence
      this.saveCartToStorage();
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
    
    // Save cart to localStorage
    saveCartToStorage() {
      if (!process.client) return;
      
      try {
        localStorage.setItem('cartItems', JSON.stringify(this.items));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    },
    
    // Restore cart from localStorage
    restoreFromStorage() {
      if (!process.client) return;
      
      try {
        // Restore active pharmacy
        const storedPharmacy = localStorage.getItem('activeCartPharmacy');
        const storedPharmacySlug = localStorage.getItem('activeCartPharmacySlug');
        
        if (storedPharmacy) {
          this.activePharmacy = storedPharmacy;
        }
        
        if (storedPharmacySlug) {
          this.activePharmacySlug = storedPharmacySlug;
        }
        
        // Restore cart items
        const storedItems = localStorage.getItem('cartItems');
        if (storedItems) {
          this.items = JSON.parse(storedItems);
        }
      } catch (error) {
        console.error('Failed to restore cart from localStorage:', error);
      }
    }
  },
});