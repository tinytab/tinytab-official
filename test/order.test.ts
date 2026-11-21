import { describe, expect, it } from 'vitest';

import { normalizeEmail, normalizeTransactionNumber, toUnivoPaymentMethod } from '@/lib/order';

describe('normalizeEmail', () => {
  it('trims and lower-cases a plausible address', () => {
    expect(normalizeEmail('  Buyer@Example.COM ')).toBe('buyer@example.com');
  });

  it('rejects text that is not an address', () => {
    for (const input of ['', 'buyer', 'buyer@', '@example.com', 'buyer@example', 'a b@example.com']) {
      expect(normalizeEmail(input)).toBeNull();
    }
    expect(normalizeEmail(`${'a'.repeat(250)}@example.com`)).toBeNull();
  });
});

describe('normalizeTransactionNumber', () => {
  it('drops spaces pasted from a bill', () => {
    expect(normalizeTransactionNumber(' 4200 0012 3456 ')).toBe('420000123456');
  });

  it('accepts letters, digits, hyphens and underscores of a sensible length', () => {
    expect(normalizeTransactionNumber('2026100622001')).toBe('2026100622001');
    expect(normalizeTransactionNumber('T-2026_ab')).toBe('T-2026_ab');
    const ethereumHash = `0x${'a1'.repeat(32)}`;
    expect(normalizeTransactionNumber(ethereumHash)).toBe(ethereumHash);
    for (const input of ['12345', 'x'.repeat(67), '交易单号123456', '<script>', '']) {
      expect(normalizeTransactionNumber(input)).toBeNull();
    }
  });
});

describe('toUnivoPaymentMethod', () => {
  it("uses Univo's identifiers", () => {
    expect(toUnivoPaymentMethod('alipay')).toBe('alipay');
    expect(toUnivoPaymentMethod('wechat')).toBe('wechat');
    expect(toUnivoPaymentMethod('usdtTrc20')).toBe('usdt-trc20');
    expect(toUnivoPaymentMethod('usdtErc20')).toBe('usdt-erc20');
  });
});
