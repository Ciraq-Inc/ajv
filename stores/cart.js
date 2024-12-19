import { defineStore } from "pinia";

export const useCartStore = defineStore('cart', {
  state: () => ({ 
    items: [], 
    isOpen: false,
  }),
  getters: {
    cartItemCount() { 
      return this.items.reduce((count, item) => count + item.quantity, 0);
    },
    cartTotal() { 
      return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
  },
  actions: {
    addToCart(drug) { 
      const existingItem = this.items.find(item => item.id === drug.id);
      if (existingItem) {
        existingItem.quantity += drug.quantity;
      } else { 
        this.items.unshift({ ...drug });
      }
    },
    removeFromCart(drugId) { 
      const index = this.items.findIndex(item => item.id === drugId);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    },
    updateQuantity(drugId, newQuantity) { 
      const item = this.items.find(item => item.id === drugId);
      if (item) {
        item.quantity = newQuantity > 0 ? newQuantity : 1;
      }
    },
    toggleCart() { 
      this.isOpen = !this.isOpen;
    },
    clearCart() { 
      this.items = [];
    }
  }
});