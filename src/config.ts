/** Site settings that change per deployment or business decision. Everything here is public. */

import type { PaymentMethod } from '@/lib/order';

/** Univo's order API origins (no path), tried in order: `.env.development` / `.env.production`. */
export const PRIMARY_API_ORIGIN = import.meta.env.VITE_API_PRIMARY;
export const BACKUP_API_ORIGIN = import.meta.env.VITE_API_BACKUP;

/** Public site key of the Turnstile widget on the purchase page: `.env.development` / `.env.production`. */
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

/** Where buyers send payment details when the form cannot be used. */
export const CONTACT_EMAIL = 'xianghongai@gmail.com';

export const PRICE = { cny: '¥9.9', usd: '$1.9', usdt: '1.9 USDT' };

/**
 * The installer of the latest release in the public TinyTab repository. Every release must attach the DMG under
 * exactly this file name, or the link breaks.
 */
export const DOWNLOAD_URL = 'https://github.com/tinytab/tinytab-official/releases/latest/download/TinyTab.dmg';

/**
 * Where buyers pay. The purchase page draws each `payload` as a QR code of the same size; USDT also shows the address
 * itself, which buyers paste into a wallet. The Alipay and WeChat codes already carry the amount.
 */
export const PAYMENT_METHODS = [
  { id: 'alipay', payload: 'https://qr.alipay.com/fkx11617c0ysvnmvki6wj82' },
  { id: 'wechat', payload: 'wxp://f2f14A5FQJyr6BJwMSXS9I9s1ZdRBaJUgzB0XCGxzGfw5mT689K33_FXtkdyx9WXoka-' },
  { id: 'usdtTrc20', payload: 'TYxhMZN2FW6BUvHTyGDLc4Lbr5mRPCWFbd', address: true },
  { id: 'usdtErc20', payload: '0x40ac31e6a8e1f3f6aa732b7e5b4d37251449dd1d', address: true },
] as const satisfies readonly { id: PaymentMethod; payload: string; address?: boolean }[];
