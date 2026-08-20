/**
 * Formatter Utilities
 * Clean string, date, and currency formatting helpers.
 */

export const formatters = {
  formatPhone(digits) {
    if (!digits) return '';
    const clean = digits.replace(/\D/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)} ${clean.slice(5, 10)}`;
  },

  formatVaultKey(key) {
    if (!key) return '';
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  },

  formatCurrency(amount) {
    if (typeof amount !== 'number') return amount;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  }
};
