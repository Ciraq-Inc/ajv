// utils/otpService.js - With development fallback for API key

import { getDatabase, ref, get } from "firebase/database";
import { usePharmacyStore } from "@/stores/pharmacy";
import { phoneUtils } from "~/utils/phone";

export const otpService = {

  otpLength: 6,
  otpExpiry: 5 * 60 * 1000,
  _manualApiKey: "0KLeqS4nHwJD76dIhTy8bppRV",
  // Add a default dev API key if environment variable is missing

  forceSmsInDev: false,

  // Store for active OTPs
  _activeOtps: new Map(),

  formatPhoneNumber(phone) {
    return phoneUtils.formatPhoneNumber(phone);
  },

  comparePhoneNumbers(phone1, phone2) {
    return phoneUtils.comparePhoneNumbers(phone1, phone2);
  },

  setForceSmsInDev(value) {
    this.forceSmsInDev = !!value;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`SMS in development mode ${this.forceSmsInDev ? 'enabled' : 'disabled'}`);
    }
  },


  async checkPhoneExists(phone, pharmacyId) {
    try {
      // Format phone number to standard format
      const formattedPhone = this.formatPhoneNumber(phone);
      console.log('Checking if phone exists:', formattedPhone, 'for pharmacy:', pharmacyId);

      // First try to use the pharmacy store if available
      const pharmacyStore = usePharmacyStore();

      // Check if we already have customer data and if we're checking for the current pharmacy
      if (pharmacyStore.currentPharmacy === pharmacyId &&
        pharmacyStore.customers &&
        pharmacyStore.customers.length > 0) {

        // Look for the phone number in different formats
        const found = pharmacyStore.customers.some(customer => {
          return this.comparePhoneNumbers(customer.phone, formattedPhone);
        });

        if (found) {
          return true;
        }
      }

      // If not found in cache or no cache available, query the database
      const db = getDatabase();
      const customersRef = ref(db, `pharmacies/${pharmacyId}/customers`);
      const customersSnapshot = await get(customersRef);

      if (customersSnapshot.exists()) {
        // Store customers in the pharmacy store for future use if it's the current pharmacy
        if (pharmacyStore.currentPharmacy === pharmacyId && !pharmacyStore.customers) {
          const customersArray = [];
          customersSnapshot.forEach((customerSnapshot) => {
            customersArray.push({
              id: customerSnapshot.key,
              ...customerSnapshot.val()
            });
          });
          pharmacyStore.setCustomers(customersArray);
        }

        // Iterate through customers to find matching phone number
        let exists = false;
        customersSnapshot.forEach((customerSnapshot) => {
          const customerData = customerSnapshot.val();

          // Use a more flexible phone number comparison
          if (this.comparePhoneNumbers(customerData.phone, formattedPhone)) {
            exists = true;
            return true; // Break the forEach loop
          }
        });

        if (exists) return true;
      }

      // Add debug logging
      console.log('Phone number not found in customers collection');

      // Phone number not found in any collection
      return false;
    } catch (error) {
      console.error("Error checking if phone exists:", error);
      throw error;
    }
  },

  generateOtp() {
    const digits = "0123456789";
    let otp = "";

    // Generate a random n-digit code
    for (let i = 0; i < this.otpLength; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }

    return otp;
  },

  async sendOtpViaMNotify(phone, otp) {
    try {
      // Get API key with fallbacks
      let userPhoneNo = phoneUtils.getMNotifyFormattedPhone(phone);

      // send sms via mNotify
      const response = await $fetch(
        "https://us-central1-referral-system-5cebe.cloudfunctions.net/sendSMS" 
        , {
          method: "POST",
          body: {
            userPhoneNo,
            otp
          },
          headers: {
            "Content-Type": "application/json",
          },
        });
      console.log("🚀 ~ sendOtpViaMNotify ~ response:", response)

      if (!response.ok) {
        const errorText = response.statusText || "Unknown error";
        throw new Error(`Failed to send SMS: ${errorText}`);
      } else {
        const data = await response.text();
        console.log("SMS sent successfully:", data);
        return data;
      }


    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  },

  async generateAndSendOtp(phone, pharmacyId, forceSms = false) {
    try {
      // Format the phone number
      const formattedPhone = phoneUtils.formatPhoneNumber(phone);

      // Check if the phone number exists in the database
      const phoneExists = await this.checkPhoneExists(
        formattedPhone,
        pharmacyId
      );

      if (!phoneExists) {
        throw {
          code: 'auth/phone-not-registered',
          message: "Phone number not registered. Please contact your pharmacy.",
          requestRegistration: true
        };
      }

      // Generate a new OTP
      const otp = this.generateOtp();

      // Store the OTP with timestamp for later verification
      this._activeOtps.set(formattedPhone, {
        otp,
        timestamp: Date.now(),
        attempts: 0,
      });

      // Send the OTP via mNotify if in production OR forceSms is true OR this.forceSmsInDev is true
      if (process.env.NODE_ENV === 'production' || forceSms || this.forceSmsInDev) {
        console.log(`Sending real SMS to ${formattedPhone} with OTP: ${otp}`);
        try {
          await this.sendOtpViaMNotify(formattedPhone, otp);
        } catch (smsError) {
          console.error('SMS sending failed, but OTP is still valid:', smsError);
          // Always log the OTP so testing can continue even if SMS fails
          console.log(`[TESTING FALLBACK] You can use this OTP: ${otp}`);
          // Return partial success - OTP is valid but SMS failed
          return { success: true, smsSent: false, otp };
        }
      } else {
        // In development, just log the OTP
        console.log(`[DEV MODE] OTP for ${formattedPhone}: ${otp}`);
        // For testing convenience, also return the OTP in development mode
        return { success: true, smsSent: false, otp };
      }

      // Return success
      return { success: true, smsSent: true };

    } catch (error) {
      console.error("Error generating and sending OTP:", error);
      throw error;
    }
  },

  async verifyOtp(phone, enteredOtp) {
    try {
      // Format the phone number
      const formattedPhone = phoneUtils.formatPhoneNumber(phone)

      // Check if there's an active OTP for this phone number
      if (!this._activeOtps.has(formattedPhone)) {
        console.error("No active OTP for this phone number");
        return false;
      }

      // Get the stored OTP data
      const otpData = this._activeOtps.get(formattedPhone);

      // Increment attempt counter
      otpData.attempts += 1;

      // Check if OTP has expired
      const now = Date.now();
      if (now - otpData.timestamp > this.otpExpiry) {
        // OTP has expired
        console.log('OTP has expired');
        this._activeOtps.delete(formattedPhone);
        return false;
      }

      // Check if too many attempts (max 3)
      if (otpData.attempts > 3) {
        this._activeOtps.delete(formattedPhone);
        throw new Error("Too many failed attempts. Please request a new code.");
      }

      // Check if the entered OTP matches the stored OTP
      if (enteredOtp === otpData.otp) {
        // OTP is valid, remove it from active OTPs
        console.log('OTP verification successful');
        this._activeOtps.delete(formattedPhone);
        return true;
      }

      // OTP doesn't match
      return false;

    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  },
};

export default otpService;
