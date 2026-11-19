import { describe, expect, it, vi } from 'vitest';

import { submitOrder } from '@/lib/api';
import type { OrderSubmission } from '@/lib/order';

const ORDER: OrderSubmission = {
  email: 'buyer@example.com',
  paymentMethod: 'alipay',
  transactionNumber: '202601010001',
};

const SOURCES = ['https://primary.test', 'https://backup.test'] as const;

function respond(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function fakeFetch(...replies: readonly (Response | Error)[]) {
  const fetch = vi.fn();
  for (const reply of replies) {
    if (reply instanceof Error) {
      fetch.mockRejectedValueOnce(reply);
    } else {
      fetch.mockResolvedValueOnce(reply);
    }
  }
  return fetch;
}

function options(fetch: ReturnType<typeof fakeFetch>) {
  return { fetch: fetch as unknown as typeof globalThis.fetch, sources: SOURCES };
}

function requestBody(fetch: ReturnType<typeof fakeFetch>, call = 0): Record<string, unknown> {
  const [, init] = fetch.mock.calls[call]!;
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

describe('submitOrder', () => {
  it('posts the camelCase order to the primary source', async () => {
    const fetch = fakeFetch(respond(200, { ok: true }));

    await expect(submitOrder(ORDER, 'turnstile-token', options(fetch))).resolves.toEqual({ status: 'submitted' });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://primary.test/v1/tinytab/site/orders');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(requestBody(fetch)).toEqual({
      email: 'buyer@example.com',
      offering: 'pro',
      paymentMethod: 'alipay',
      transactionNumber: '202601010001',
      humanToken: 'turnstile-token',
    });
  });

  it.each([
    ['alipay', 'alipay'],
    ['wechat', 'wechat'],
    ['usdtTrc20', 'usdt-trc20'],
    ['usdtErc20', 'usdt-erc20'],
  ] as const)('maps the payment method %s to %s', async (paymentMethod, expected) => {
    const fetch = fakeFetch(respond(200, { ok: true }));

    await submitOrder({ ...ORDER, paymentMethod }, 'token', options(fetch));

    expect(requestBody(fetch).paymentMethod).toBe(expected);
  });

  it.each([
    ['human_verification_failed', 'humanVerificationFailed'],
    ['offering_not_on_sale', 'offeringNotOnSale'],
    ['payment_method_unavailable', 'paymentMethodUnavailable'],
    ['payment_already_processed', 'paymentAlreadyProcessed'],
  ] as const)('reports %s as an explicit rejection without using the backup', async (code, expected) => {
    const fetch = fakeFetch(respond(422, { ok: false, code }));

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({
      status: 'rejected',
      code: expected,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reports an invalid request without using the backup', async () => {
    const fetch = fakeFetch(respond(400, { ok: false, code: 'invalid_request' }));

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'invalidRequest' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('treats any other HTTP 400 as a form error without using the backup', async () => {
    const fetch = fakeFetch(new Response('Bad Request', { status: 400 }));

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'invalidRequest' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reports an unregistered origin without using the backup', async () => {
    const fetch = fakeFetch(respond(403, { ok: false, code: 'origin_not_allowed' }));

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'originNotAllowed' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to the backup when the primary cannot be reached', async () => {
    const fetch = fakeFetch(new TypeError('offline'), respond(200, { ok: true }));

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'submitted' });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0]![0]).toBe('https://primary.test/v1/tinytab/site/orders');
    expect(fetch.mock.calls[1]![0]).toBe('https://backup.test/v1/tinytab/site/orders');
  });

  it('falls back to the backup on a server error', async () => {
    const fetch = fakeFetch(respond(503, { ok: false }), respond(200, { ok: true }));

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'submitted' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('treats a success status without ok true as unreachable', async () => {
    const fetch = fakeFetch(respond(200, { ok: false }), respond(200, { ok: true }));

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'submitted' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries the backup after rate limiting and reports it when both sources limit the request', async () => {
    const fetch = fakeFetch(
      respond(429, { ok: false, code: 'rate_limited' }),
      respond(429, { ok: false, code: 'rate_limited' })
    );

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'rateLimited' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps the rate limit when the backup fails for another reason', async () => {
    const fetch = fakeFetch(
      respond(429, { ok: false, code: 'rate_limited' }),
      respond(500, { ok: false, code: 'internal_error' })
    );

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'rateLimited' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('treats an unknown rejection code as unreachable and reports unavailable after both sources fail', async () => {
    const fetch = fakeFetch(
      respond(422, { ok: false, code: 'some_new_reason' }),
      respond(422, { ok: false, code: 'some_new_reason' })
    );

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'unavailable' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('reports unavailable after both sources fail', async () => {
    const fetch = fakeFetch(new TypeError('offline'), respond(500, { ok: false }));

    await expect(submitOrder(ORDER, 'token', options(fetch))).resolves.toEqual({ status: 'unavailable' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
