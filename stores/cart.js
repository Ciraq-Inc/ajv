// Cart.js
import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
    isOpen: false,
    activePharmacy: null, // Track which pharmacy the cart belongs to
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
  },
  actions: {
    // Set active pharmacy
    setActivePharmacy(pharmacyId) {
      // If switching pharmacies, clear the cart
      if (
        this.activePharmacy &&
        this.activePharmacy !== pharmacyId &&
        this.item.length > 0
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
      return true;
    },

    addToCart(drug) {
      // Ensure drugs has pharmacy info
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
    },
    removeFromCart(drugId) {
      const index = this.items.findIndex((item) => item.id === drugId);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    },
    updateQuantity(drugId, newQuantity) {
      const item = this.items.find((item) => item.id === drugId);
      if (item) {
        item.quantity = newQuantity > 0 ? newQuantity : 1;
      }
    },
    toggleCart() {
      this.isOpen = !this.isOpen;
    },
    clearCart() {
      this.items = [];
    },
  },
});
