import { validation } from '../utils/validation.js';

/**
 * Email Authentication Service
 * Manages email validation, sending 4-digit OTP codes, and verifying email credentials.
 */
export const emailAuthService = {
  /**
   * Validates email format.
   * @param {string} email 
   * @returns {{ isValid: boolean, error?: string }}
   */
  validateEmail(email) {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'Email address is required.' };
    }
    const clean = email.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(clean)) {
      return { isValid: false, error: 'Please enter a valid email address (e.g. alex@domain.com).' };
    }
    return { isValid: true };
  },

  /**
   * Sends 4-digit OTP code to email.
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async sendEmailOTP(email) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const valRes = this.validateEmail(email);
        if (!valRes.isValid) {
          return reject(new Error(valRes.error));
        }

        resolve({
          success: true,
          status: 'EMAIL_OTP_SENT',
          message: `Verification code sent to ${email}`,
          timerSeconds: 30
        });
      }, 400);
    });
  },

  /**
   * Verifies 4-digit email OTP code.
   * Accepts any 4-digit code in mock mode.
   * @param {string} email 
   * @param {string} code 
   * @returns {Promise<Object>}
   */
  async verifyEmailOTP(email, code) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!code || code.length !== 4) {
          return resolve({
            success: false,
            status: 'INVALID_OTP',
            message: 'Please enter all 4 digits of the email verification code.'
          });
        }

        resolve({
          success: true,
          status: 'VERIFIED',
          message: 'Email address verified successfully!'
        });
      }, 400);
    });
  }
};
