/**
 * Orders: after paying by QR code, a buyer submits the email used for the purchase and the transaction number (the
 * transaction hash for USDT). Univo's license center reviews the payment, and the buyer then activates TinyTab with a
 * verification code sent to that email.
 */

export const PAYMENT_METHODS = ['alipay', 'wechat', 'usdtTrc20', 'usdtErc20'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** TinyTab's only offering in Univo. */
export const OFFERING = 'pro';

/** Univo's identifiers for the payment methods shown on this site. */
export const UNIVO_PAYMENT_METHODS = {
  alipay: 'alipay',
  wechat: 'wechat',
  usdtTrc20: 'usdt-trc20',
  usdtErc20: 'usdt-erc20',
} as const satisfies Record<PaymentMethod, string>;

export type UnivoPaymentMethod = (typeof UNIVO_PAYMENT_METHODS)[PaymentMethod];

/** What the purchase form collects. The offering and the Turnstile token are added when submitting. */
export interface OrderSubmission {
  email: string;
  paymentMethod: PaymentMethod;
  transactionNumber: string;
}

const EMAIL_MAX_LENGTH = 254;
// Up to 66 so an Ethereum transaction hash (`0x` and 64 hex digits) fits.
const TRANSACTION_NUMBER_PATTERN = /^[A-Za-z0-9_-]{6,66}$/;

/** Trimmed and lower-cased, or null. Deliberately loose: the address is only read by the license center. */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return email.length <= EMAIL_MAX_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Transaction numbers and hashes are letters, digits, `-` and `_`; spaces pasted from a bill are dropped. */
export function normalizeTransactionNumber(input: string): string | null {
  const transactionNumber = input.replace(/\s/g, '');
  return TRANSACTION_NUMBER_PATTERN.test(transactionNumber) ? transactionNumber : null;
}

export function toUnivoPaymentMethod(paymentMethod: PaymentMethod): UnivoPaymentMethod {
  return UNIVO_PAYMENT_METHODS[paymentMethod];
}
