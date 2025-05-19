// stores/user.js

import { defineStore } from "pinia";
import { getDatabase, ref, set, get, push } from "firebase/database";
import { usePharmacyStore } from "./pharmacy";
import { otpService } from "@/utils/otpService";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null,
    isLoading: false,
    error: null,
    userProfile: null,
    authInitialized: false,
    isOtpSent: false,
    phoneVerifying: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    currentUser: (state) => state.user,
    userPhoneNumber: (state) => state.user?.phone || null,
    profile: (state) => state.userProfile || {},
    hasOrders: (state) => (state.userProfile?.ordersCount || 0) > 0,
  },

  actions: {
    formatPhoneNumber(phone) {
      return otpService.formatPhoneNumber(phone);
    },

    async sendVerificationCode(phone) {
      this.isLoading = true;
      this.error = null;

      try {
        const pharmacyStore = usePharmacyStore();

        // Format phone number consistently
        const formattedPhone = this.formatPhoneNumber(phone);

        console.log("Sending verification code to:", formattedPhone);

        // Generate and send OTP using our custom service
        await otpService.generateAndSendOtp(
          formattedPhone,
          pharmacyStore.currentPharmacy,
          true
        );

        // Store the phone number we're verifying
        this.phoneVerifying = formattedPhone;
        this.isOtpSent = true;
        return { success: true };
      } catch (error) {
        console.error("Error sending verification code:", error);
        this.error =
          error.message ||
          "Failed to send verification code. Please try again.";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async verifyCode(phone, code, rememberMe = true) {
      this.isLoading = true;
      this.error = null;

      try {
        // Format phone number consistently
        const formattedPhone = this.formatPhoneNumber(phone);

        // Make sure we're verifying the same phone number
        if (this.phoneVerifying !== formattedPhone) {
          throw new Error("Phone number mismatch. Please request a new code.");
        }

        // Verify the OTP
        const isValid = await otpService.verifyOtp(formattedPhone, code);

        if (!isValid) {
          throw new Error("Invalid verification code. Please try again.");
        }

        // After successful OTP verification, get the customer information
        const pharmacyStore = usePharmacyStore();
        if (!pharmacyStore.customers || pharmacyStore.customers.length === 0) {
          await pharmacyStore.fetchCustomers();
        }

        // Find the customer based on phone number
        const customer = pharmacyStore.findCustomerByPhone(formattedPhone);

        if (!customer) {
          throw new Error("Customer not found. Please contact support.");
        }

        let customerName = "";
        if (customer.name) {
          customerName = customer.name;
        } else if (customer.firstName && customer.lastName) {
          customerName = `${customer.firstName} ${customer.lastName}`;
        } else if (customer.firstName) {
          customerName = customer.firstName;
        } else if (customer.lastName) {
          customerName = customer.lastName;
        }

        // Set the user data
        this.user = {
          uid: customer.id,
          phone: formattedPhone,
          name: customerName,
        };

        // Update user profile with latest info
        await this.updateUserProfile(this.user);

        // Store user in localStorage for persistence if rememberMe is true
        if (rememberMe && typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(this.user));
        }

        // Clear verification state
        this.phoneVerifying = null;
        this.isOtpSent = false;

        return this.user;
      } catch (error) {
        console.error("Error verifying code:", error);
        this.error =
          error.message || "Failed to verify code. Please try again.";
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateUserProfile(userData) {
      if (!userData || !userData.uid) return;

      try {
        const pharmacyStore = usePharmacyStore();
        const db = getDatabase();

        // Correctly build the path to user data
        const userRef = ref(
          db,
          `pharmacies/${pharmacyStore.currentPharmacy}/customers/${userData.uid}`
        );

        // Get existing user data if available
        const snapshot = await get(userRef);
        const existingData = snapshot.exists() ? snapshot.val() : {};

         // Determine the name to use, prioritizing existing data
    let displayName = '';
    
    // Use existing name if available
    if (existingData.name) {
      displayName = existingData.name;
    } 
    // Construct from first and last name
    else if (existingData.firstName && existingData.lastName) {
      displayName = `${existingData.firstName} ${existingData.lastName}`;
    } 
    // Use just first name
    else if (existingData.firstName) {
      displayName = existingData.firstName;
    } 
    // Use just last name
    else if (existingData.lastName) {
      displayName = existingData.lastName;
    }
    // Fall back to name from userData
    else if (userData.name) {
      displayName = userData.name;
    }

        // Get device and browser info for better tracking
        const deviceInfo =
          typeof window !== "undefined"
            ? {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screenSize: `${window.screen.width}x${window.screen.height}`,
              }
            : {};

        // Merge existing data with new data
        const updatedData = {
          ...existingData,
          phone: userData.phone,
          lastLogin: new Date().toISOString(),
          loginHistory: [
            ...(existingData.loginHistory || []),
            {
              timestamp: new Date().toISOString(),
              deviceInfo,
            },
          ].slice(-5), // Keep only last 5 logins
          // Track orders count if available
          ordersCount: existingData.ordersCount || 0,
          // Keep customer data if already exists
          name: displayName,
          // Store pharmacy context
          lastPharmacy: pharmacyStore.currentPharmacy,
        };

        // Save to database
        await set(userRef, updatedData);

        // Save to local state for easy access
        this.userProfile = updatedData;

        return updatedData;
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
      }
    },

    async checkAuthState() {
      if (typeof window === "undefined") return;

      this.isLoading = true;

      try {
        // If auth is already initialized, return current state
        if (this.authInitialized && this.user) {
          this.isLoading = false;
          return this.user;
        }

        // Try to restore from localStorage
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          try {
            this.user = JSON.parse(savedUser);

            // Verify the stored user still exists in Firebase
            const userExists = await this.verifyStoredUser(this.user.uid);

            if (!userExists) {
              // Saved user no longer valid
              this.user = null;
              localStorage.removeItem("user");
            } else {
              // User is valid, fetch profile
              const profile = await this.updateUserProfile(this.user);
              this.userProfile = profile;
            }
          } catch (e) {
            console.error("Error restoring user from storage:", e);
            this.user = null;
            localStorage.removeItem("user");
          }
        } else {
          this.user = null;
        }

        this.authInitialized = true;
        this.isLoading = false;
        return this.user;
      } catch (error) {
        console.error("Error checking auth state:", error);
        this.isLoading = false;
        this.user = null;
        return null;
      }
    },

    // Verify a stored user still exists in Firebase
    async verifyStoredUser(uid) {
      if (!uid) return false;

      try {
        const db = getDatabase();
        const pharmacyStore = usePharmacyStore();

        // Try to fetch user data
        const userRef = ref(
          db,
          `pharmacies/${pharmacyStore.currentPharmacy}/customers/${uid}`
        );
        const snapshot = await get(userRef);

        return snapshot.exists();
      } catch (error) {
        console.error("Error verifying stored user:", error);
        return false;
      }
    },

    async logout() {
      this.isLoading = true;

      try {
        // Clear user data
        this.user = null;
        this.userProfile = null;
        this.phoneVerifying = null;
        this.isOtpSent = false;

        // Remove from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
        }

        return true;
      } catch (error) {
        console.error("Error logging out:", error);
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Enhanced order processing
    async processDirectOrder(cartItems, pharmacyId) {
      if (!this.isLoggedIn) {
        throw new Error("User must be logged in to place an order");
      }

      try {
        this.isLoading = true;

        const db = getDatabase();
        const orderRef = push(ref(db, `orders/${this.user.uid}`));
        const orderKey = orderRef.key;

        // Calculate total amount and save item details
        const totalAmount = cartItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
        const itemsWithDetails = cartItems.map((item) => ({
          id: item.id,
          brandName: item.name,
          price: item.price || 0,
          quantity: item.quantity || 1,
          subtotal: (item.price || 0) * (item.quantity || 1),
        }));

        // Get customer delivery information from profile
        const customerInfo = {
          phone: this.user.phone,
          name: this.userProfile?.firstName || "",
        };

        // Create order data
        const orderData = {
          orderId: orderKey,
          userId: this.user.uid,
          pharmacyId,
          items: itemsWithDetails,
          totalItems: cartItems.length,
          totalQuantity: cartItems.reduce(
            (sum, item) => sum + (item.quantity || 1),
            0
          ),
          totalAmount,
          status: "pending",
          payment: {
            method: "cash_on_delivery",
            status: "pending",
          },
          createdAt: new Date().toISOString(),
          customerInfo,
          // Track any delivery notes (can be added by pharmacy staff later)
          notes: "",
        };

        // Save the order to database
        await set(orderRef, orderData);

        // Also save a reference to the pharmacy's orders list for easier lookup
        await set(ref(db, `pharmacies/${pharmacyId}/orders/${orderKey}`), {
          orderId: orderKey,
          userId: this.user.uid,
          createdAt: new Date().toISOString(),
          totalAmount,
          status: "pending",
        });

        // Update user's orders count
        if (this.userProfile) {
          const updatedProfile = {
            ...this.userProfile,
            ordersCount: (this.userProfile.ordersCount || 0) + 1,
          };

          await this.updateUserProfile({
            ...this.user,
            profile: updatedProfile,
          });
        }

        return {
          success: true,
          orderId: orderKey,
          orderData,
        };
      } catch (error) {
        console.error("Error processing order:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async cancelOrder(orderId, reason = '') {
  if (!this.isLoggedIn || !orderId) {
    throw new Error("User must be logged in to cancel an order");
  }

  try {
    this.isLoading = true;

    const db = getDatabase();
    
    // First, get the current order to check if it can be cancelled
    const orderRef = ref(db, `orders/${this.user.uid}/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (!snapshot.exists()) {
      throw new Error("Order not found");
    }
    
    const orderData = snapshot.val();
    
    // Only allow cancellation of pending or processing orders
    if (orderData.status !== 'pending' && orderData.status !== 'processing') {
      throw new Error(`Cannot cancel an order with status: ${orderData.status}`);
    }
    
    // Update the order status to cancelled
    const updatedOrderData = {
      ...orderData,
      status: 'cancelled',
      cancellation: {
        timestamp: new Date().toISOString(),
        reason: reason || 'No reason provided',
        cancelledBy: 'customer'
      },
      updatedAt: new Date().toISOString()
    };
    
    // Update in the user's orders collection
    await set(orderRef, updatedOrderData);
    
    // Also update in the pharmacy's orders collection
    if (orderData.pharmacyId) {
      const pharmacyOrderRef = ref(
        db, 
        `pharmacies/${orderData.pharmacyId}/orders/${orderId}`
      );
      
      // Get existing summary data first
      const pharmacyOrderSnapshot = await get(pharmacyOrderRef);
      if (pharmacyOrderSnapshot.exists()) {
        const pharmacyOrderData = pharmacyOrderSnapshot.val();
        
        // Update with new status
        await set(pharmacyOrderRef, {
          ...pharmacyOrderData,
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return {
      success: true,
      orderId: orderId,
      message: 'Order cancelled successfully'
    };
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  } finally {
    this.isLoading = false;
  }
},

    // Get user order history
    async getOrderHistory() {
      if (!this.isLoggedIn) {
        throw new Error("User must be logged in to view order history");
      }

      try {
        this.isLoading = true;

        const db = getDatabase();
        const ordersRef = ref(db, `orders/${this.user.uid}`);
        const snapshot = await get(ordersRef);

        if (!snapshot.exists()) {
          return [];
        }

        const orders = [];
        snapshot.forEach((childSnapshot) => {
          orders.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });

        // Sort by date, newest first
        return orders.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      } catch (error) {
        console.error("Error fetching order history:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Update user profile data
    async updateUserData(profileData) {
      if (!this.isLoggedIn) {
        throw new Error("User must be logged in to update profile");
      }

      try {
        this.isLoading = true;

        // Merge with existing profile
        const updatedProfile = {
          ...this.userProfile,
          ...profileData,
          lastUpdated: new Date().toISOString(),
        };

        // Update in Firebase
        await this.updateUserProfile({
          ...this.user,
          profile: updatedProfile,
        });

        // Update local state
        this.userProfile = updatedProfile;

        return updatedProfile;
      } catch (error) {
        console.error("Error updating user data:", error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async checkAdminRights() {
      if (!this.isLoggedIn || !this.user || !this.user.uid) {
        return false;
      }

      try {
        const pharmacyStore = usePharmacyStore();
        if (!pharmacyStore.currentPharmacy) {
          await pharmacyStore.restoreFromStorage();
          if (!pharmacyStore.currentPharmacy) {
            return false;
          }
        }

        const db = getDatabase();

        // Option 1: Check if user exists in pharmacy's admin list
        const adminRef = ref(
          db,
          `pharmacies/${pharmacyStore.currentPharmacy}/admins/${this.user.uid}`
        );
        const adminSnapshot = await get(adminRef);

        // If user exists in the admins collection, they have admin rights
        if (adminSnapshot.exists()) {
          return true;
        }

        // Option 2: Check if user has admin flag in their profile
        if (this.userProfile && this.userProfile.isAdmin) {
          return true;
        }

        // Option 3: Check if pharmacy owner matches user ID
        const pharmacyInfoRef = ref(
          db,
          `pharmacies/${pharmacyStore.currentPharmacy}/info`
        );
        const pharmacyInfoSnapshot = await get(pharmacyInfoRef);

        if (pharmacyInfoSnapshot.exists()) {
          const pharmacyInfo = pharmacyInfoSnapshot.val();
          if (pharmacyInfo.ownerId && pharmacyInfo.ownerId === this.user.uid) {
            return true;
          }
        }

        return false;
      } catch (error) {
        console.error("Error checking admin rights:", error);
        return false;
      }
    },

    getAdminLink() {
      if (!this.isLoggedIn) return null;

      return {
        text: "Pharmacy Dashboard",
        path: "/admin/orders",
        icon: "ri-dashboard-line",
      };
    },
  },
});
