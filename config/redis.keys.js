export const getOTPKey = (email) => `otp:${email}`;
export const getCooldownKey = (email) => `otp:cooldown:${email}`;
export const getResendAttemptsKey = (email) => `otp:resendAttempts:${email}`;
