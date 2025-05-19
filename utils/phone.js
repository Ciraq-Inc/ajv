// utils/phoneUtils.js
//   Utility functions for phone number handling

export const phoneUtils = {
  formatPhoneNumber(phone) {
    if (!phone) return "";

    let formatted = phone.toString().trim();

    // Remove any non-digit characters
    formatted = formatted.replace(/\D/g, "");

    // Format consistently for Ghana numbers
    if (formatted.startsWith("0")) {
      formatted = "+233" + formatted.substring(1);
    } else if (!formatted.startsWith("+")) {
      if (formatted.startsWith("233")) {
        formatted = "+" + formatted;
      } else {
        formatted = "+233" + formatted;
      }
    }

    return formatted;
  },

  getMNotifyFormattedPhone(phone) {
    let formatted = phone.replace(/\D/g, "");

    if (formatted.startsWith("233")) {
      formatted = formatted.substring(3);
    }

    if (!formatted.startsWith("0")) {
      formatted = "0" + formatted;
    }

    return formatted;
  },

  comparePhoneNumbers(phone1, phone2) {
    if (!phone1 || !phone2) return false;

    // Normalize both phone numbers to remove all non-digit characters
    const normalizedPhone1 = phone1.toString().replace(/\D/g, "");
    const normalizedPhone2 = phone2.toString().replace(/\D/g, "");

    // If either number starts with country code, remove it for comparison
    const cleanPhone1 = normalizedPhone1.startsWith("233")
      ? normalizedPhone1.substring(3)
      : normalizedPhone1;
    const cleanPhone2 = normalizedPhone2.startsWith("233")
      ? normalizedPhone2.substring(3)
      : normalizedPhone2;

    // Handle cases where one number might start with 0 and the other doesn't
    const finalPhone1 = cleanPhone1.startsWith("0")
      ? cleanPhone1
      : "0" + cleanPhone1;
    const finalPhone2 = cleanPhone2.startsWith("0")
      ? cleanPhone2
      : "0" + cleanPhone2;

    return finalPhone1 === finalPhone2;
  },
};

export default phoneUtils;
