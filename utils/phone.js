import {
  parsePhoneNumber,
  isValidPhoneNumber,
  ParseError,
} from 'libphonenumber-js';

export const phoneUtils = {
  /**
   * Convert a phone number to E.164 format.
   * @param {string} phone - User-typed phone (national or international)
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code ('GH', 'US', 'GB')
   * @returns {string} E.164 string (e.g. '+233241234567') or empty string if invalid
   */
  formatToE164(phone, countryCode = 'GH') {
    if (!phone) return '';
    let raw = phone.toString().trim();

    // Pre-process legacy bare-prefix formats so libphonenumber-js can parse them.
    // e.g. '233241234567' → '+233241234567', '44XXXXXXXXXX' → '+44XXXXXXXXXX'
    if (!raw.startsWith('+')) {
      const digits = raw.replace(/\D/g, '');
      if (digits.startsWith('233') && digits.length === 12) raw = '+' + digits;
      else if (digits.startsWith('1') && digits.length === 11) raw = '+' + digits;
      else if (digits.startsWith('44') && digits.length === 12) raw = '+' + digits;
    }

    try {
      const parsed = parsePhoneNumber(raw, countryCode);
      if (parsed && parsed.isValid()) return parsed.format('E.164');
    } catch (e) {
      if (!(e instanceof ParseError)) throw e;
    }
    return '';
  },

  /**
   * Validate a phone number for a given country.
   * @param {string} phone
   * @param {string} countryCode
   * @returns {boolean}
   */
  isValidPhone(phone, countryCode = 'GH') {
    if (!phone) return false;
    try {
      return isValidPhoneNumber(phone.toString().trim(), countryCode);
    } catch {
      return false;
    }
  },

  /**
   * Format an E.164 number for human-readable display.
   * e.g. '+233241234567' → '+233 24 123 4567'
   * @param {string} phone - E.164 or any parseable format
   * @returns {string}
   */
  formatForDisplay(phone) {
    if (!phone) return '';
    try {
      const parsed = parsePhoneNumber(phone.toString().trim());
      if (parsed) return parsed.formatInternational();
    } catch {
      // fall through
    }
    return phone;
  },

  /**
   * Compare two phone numbers for equality (country-aware).
   * @param {string} phone1
   * @param {string} phone2
   * @param {string} countryCode - default country for bare numbers
   * @returns {boolean}
   */
  comparePhoneNumbers(phone1, phone2, countryCode = 'GH') {
    if (!phone1 || !phone2) return false;
    const e1 = this.formatToE164(phone1, countryCode);
    const e2 = this.formatToE164(phone2, countryCode);
    return e1 !== '' && e1 === e2;
  },

  /**
   * Return digits-only with country code for wa.me links.
   * e.g. '+233241234567' → '233241234567'
   * @param {string | null | undefined} phone
   * @param {string} countryCode
   * @returns {string}
   */
  formatWhatsApp(phone, countryCode = 'GH') {
    if (!phone) return '';
    const e164 = this.formatToE164(phone, countryCode);
    return e164 ? e164.replace(/^\+/, '') : '';
  },
};

export default phoneUtils;
