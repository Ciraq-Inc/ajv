// services/subdomain.js
import { getDatabase, ref as dbRef, get, set, remove } from "firebase/database";

// Cache for subdomain lookups
const subdomainCache = new Map();

export const subdomainService = {
  /**
   * Resolves a pharmacy ID from a subdomain
   */
  async getPharmacyIdFromSubdomain(subdomain) {
    if (!subdomain) return null;
    
    // Check cache first
    if (subdomainCache.has(subdomain)) {
      return subdomainCache.get(subdomain);
    }
    
    // If not in cache, look up in database
    try {
      const db = getDatabase();
      const snapshot = await get(dbRef(db, `pharmacyBySubdomain/${subdomain}`));
      
      if (snapshot.exists()) {
        const pharmacyId = snapshot.val();
        subdomainCache.set(subdomain, pharmacyId);
        return pharmacyId;
      }
      return null;
    } catch (error) {
      console.error("Error looking up pharmacy by subdomain:", error);
      return null;
    }
  },
  
  /**
   * Resolves a subdomain from a pharmacy ID
   */
  async getSubdomainFromPharmacyId(pharmacyId) {
    if (!pharmacyId) return null;
    
    try {
      const db = getDatabase();
      const snapshot = await get(dbRef(db, `subdomainToPharmacy/${pharmacyId}`));
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error("Error looking up subdomain for pharmacy:", error);
      return null;
    }
  },
  
  /**
   * Updates or sets a subdomain for a pharmacy with validation
   */
  async setSubdomain(pharmacyId, subdomain) {
    if (!pharmacyId || !subdomain) {
      throw new Error("Pharmacy ID and subdomain are required");
    }
    
    // Validate subdomain format
    const validSubdomainRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!validSubdomainRegex.test(subdomain)) {
      throw new Error("Invalid subdomain format");
    }
    
    try {
      const db = getDatabase();
      
      // Check if subdomain is already taken by another pharmacy
      const existingSnapshot = await get(dbRef(db, `pharmacyBySubdomain/${subdomain}`));
      if (existingSnapshot.exists() && existingSnapshot.val() !== pharmacyId) {
        throw new Error("This subdomain is already taken");
      }
      
      // Get current subdomain to remove old mapping if exists
      const currentSubdomainSnapshot = await get(dbRef(db, `subdomainToPharmacy/${pharmacyId}`));
      const currentSubdomain = currentSubdomainSnapshot.exists() ? currentSubdomainSnapshot.val() : null;
      
      // Update in a transaction to maintain data consistency
      const updates = {};
      
      // Remove old mapping if exists
      if (currentSubdomain && currentSubdomain !== subdomain) {
        updates[`pharmacyBySubdomain/${currentSubdomain}`] = null;
      }
      
      // Set new mappings
      updates[`pharmacyBySubdomain/${subdomain}`] = pharmacyId;
      updates[`subdomainToPharmacy/${pharmacyId}`] = subdomain;
      updates[`pharmacies/${pharmacyId}/info/subdomain`] = subdomain;
      
      // Perform all updates atomically
      await set(dbRef(db), updates);
      
      // Update cache
      subdomainCache.set(subdomain, pharmacyId);
      
      return true;
    } catch (error) {
      console.error("Error setting subdomain:", error);
      throw error;
    }
  },
  
  /**
   * Removes a subdomain mapping
   */
  async removeSubdomain(pharmacyId) {
    if (!pharmacyId) return false;
    
    try {
      const db = getDatabase();
      
      // Get current subdomain
      const subSnapshot = await get(dbRef(db, `subdomainToPharmacy/${pharmacyId}`));
      if (!subSnapshot.exists()) return true; // Nothing to remove
      
      const subdomain = subSnapshot.val();
      
      // Remove mappings
      const updates = {};
      updates[`pharmacyBySubdomain/${subdomain}`] = null;
      updates[`subdomainToPharmacy/${pharmacyId}`] = null;
      updates[`pharmacies/${pharmacyId}/info/subdomain`] = null;
      
      await set(dbRef(db), updates);
      
      // Clear from cache
      subdomainCache.delete(subdomain);
      
      return true;
    } catch (error) {
      console.error("Error removing subdomain:", error);
      return false;
    }
  },
  
  /**
   * Clears the subdomain cache
   */
  clearCache() {
    subdomainCache.clear();
  }
};