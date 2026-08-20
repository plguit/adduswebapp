/**
 * OTP Verification Service (Mock & Firebase Adapter Architecture)
 * 
 * Simulates sending, verifying, and resending 4-digit OTP codes.
 * Accepts any 4-digit number in mock mode for instant onboarding verification.
 */

export const otpService = {
  async sendOTP(phone) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!phone || phone.length !== 10) {
          return reject(new Error('Invalid mobile number. Must be 10 digits.'));
        }
        resolve({
          success: true,
          status: 'OTP_SENT_SUCCESSFULLY',
          message: 'OTP sent successfully to +91 ' + phone,
          timerSeconds: 30
        });
      }, 300);
    });
  },

  async resendOTP(phone) {
    return this.sendOTP(phone);
  },

  async verifyOTP(phone, otpCode, failedAttemptsCount = 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!otpCode || otpCode.length !== 4) {
          return resolve({
            success: false,
            status: 'OTP_INVALID',
            message: 'Please enter all 4 digits of the OTP.'
          });
        }

        // In Mock MVP mode, accept any 4-digit code
        return resolve({
          success: true,
          status: 'VERIFIED',
          message: 'Perfect! 🎉 Your account is ready. Now let\'s understand your business.'
        });
      }, 300);
    });
  }
};
