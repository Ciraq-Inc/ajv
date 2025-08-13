// utils/otpService.js - With development fallback for API key

import { getDatabase, ref, get } from "firebase/database";
import { usePharmacyStore } from "@/stores/pharmacy";
import { phoneUtils } from "~/utils/phone";

export const otpService = {

  otpLength: 6,
  otpExpiry: 5 * 60 * 1000,
  _manualApiKey: "0KLeqS4nHwJD76dIhTy8bppRV",
  // Add a default dev API key if environment variable is missing
  get mNotifyApiKey() {
    return process.env.MNOTIFY_API_KEY || process.env.NUXT_PUBLIC_MNOTIFY_API_KEY || '';
  },
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
    const apiKey = this._manualApiKey || this.mNotifyApiKey;
    
    // Validate API key first
    if (!apiKey) {
      console.error("Missing mNotify API key. Check your environment configuration.");
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('DEVELOPMENT MODE: You can continue testing without SMS, the OTP is visible in the console logs.');
        // In development, instead of throwing an error, we'll just return a mock success
        return { 
          success: true, 
          mock: true,
          message: 'Development mode - SMS not actually sent'
        };
      }
      
      throw new Error("Missing mNotify API key. Please configure the environment variable.");
    }
    
    // Format phone for mNotify
    let mNotifyPhone = phoneUtils.getMNotifyFormattedPhone(phone);
    
    // Additional formatting to ensure compliance with mNotify requirements
    if (mNotifyPhone.startsWith('0')) {
      // Remove leading zero and add Ghana country code
      mNotifyPhone = '233' + mNotifyPhone.substring(1);
    } else if (mNotifyPhone.startsWith('+233')) {
      // Remove the plus sign if it exists
      mNotifyPhone = mNotifyPhone.substring(1);
    } else if (mNotifyPhone.startsWith('+')) {
      // For any other international format, just remove the plus
      mNotifyPhone = mNotifyPhone.substring(1);
    }
    
    console.log("Formatted phone for mNotify:", mNotifyPhone);
    
    // Prepare the message
    const messageText = `Your verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
    
    // Prepare the API request - UPDATED to make recipient an array
    const requestBody = {
      key: apiKey,
      recipient: [mNotifyPhone],  // Changed to an array as required by mNotify
      message: messageText,
      sender: "MedsGh",
    };
    
    // Debug log the request (hide full API key)
    const safeLog = {
      ...requestBody,
      key: requestBody.key ? `${requestBody.key.substring(0, 4)}...${requestBody.key.substring(requestBody.key.length-4)}` : 'missing'
    };
    console.log("Sending request to mNotify:", safeLog);
    
    // Make the API call to mNotify
    const response = await fetch(
      "https://api.mnotify.com/api/sms/quick",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    // Handle the response
    const data = await response.json();
    console.log("mNotify API response:", data);
    
    if (!response.ok) {
      // Enhanced error logging
      console.error("mNotify API error:", {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(data)
      });
      
      // Log more detailed error info if available
      if (data && data.errors) {
        console.error("Error details:", data.errors);
      }

      // fallback to nalosolutions
  // fallback to nalosolutions
try {
  console.log("Attempting fallback SMS via Nalo Solutions...");
  
  const username = "Rigelis";
  const password = "Maestro1985@";
  const source = "RigelOS";
  
  const response = await fetch(
    `https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo/send-message/?username=${username}&password=${password}&type=0&destination=${mNotifyPhone}&dlr=1&source=${source}&message=${encodeURIComponent(messageText)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  
  const fallbackData = await response.text(); // Nalo returns text response
  console.log("Nalo Solutions API response:", fallbackData);
  
  if (!response.ok) {
    console.error("Nalo Solutions API error:", {
      status: response.status,
      statusText: response.statusText,
      data: fallbackData
    });
    throw new Error(`Fallback SMS provider failed (Status: ${response.status})`);
  }
  
  // Check if the response indicates success (adjust based on Nalo's response format)
  if (fallbackData.includes("success") || fallbackData.includes("sent")) {
    console.log("OTP sent successfully via Nalo Solutions (fallback)");
    return { 
      success: true, 
      fallback: true,
      provider: "nalosolutions",
      message: 'SMS sent via fallback provider'
    };
  } else {
    throw new Error(`Fallback SMS provider returned unexpected response: ${fallbackData}`);
  }
  
} catch (fallbackError) {
  console.error("Error sending SMS with fallback provider:", fallbackError);
  
  // If both providers fail, throw the original error
  if (data && data.message) {
    throw new Error(`Both SMS providers failed. Primary: ${data.message}, Fallback: ${fallbackError.message}`);
  } else {
    throw new Error(`Both SMS providers failed. Primary: mNotify API error (Status: ${response.status}), Fallback: ${fallbackError.message}`);
  }
}
      
      // Throw a descriptive error
      if (data && data.message) {
        throw new Error(`mNotify API error: ${data.message}`);
      } else {
        throw new Error(`Failed to send SMS via mNotify (Status: ${response.status})`);
      }
    }
    
    console.log("OTP sent successfully via mNotify");
    return data;
    
  } catch (error) {
    console.error("Error sending OTP via mNotify:", error);
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
