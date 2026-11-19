/**
 * Client of Univo's public order endpoint. The license center has no order lookup: after approval, buyers activate in
 * the app with the email they used for the purchase.
 */

import { BACKUP_API_ORIGIN, PRIMARY_API_ORIGIN } from '@/config';
import { OFFERING, type OrderSubmission, toUnivoPaymentMethod } from '@/lib/order';

/** Refusals the buyer can act on, named after their meaning rather than the wire code. */
export type SiteOrderRejection =
  | 'humanVerificationFailed'
  | 'offeringNotOnSale'
  | 'paymentMethodUnavailable'
  | 'paymentAlreadyProcessed';

export type SubmitResult =
  | { status: 'submitted' }
  | { status: 'rejected'; code: SiteOrderRejection }
  | { status: 'invalidRequest' }
  | { status: 'originNotAllowed' }
  | { status: 'rateLimited' }
  | { status: 'unavailable' };

const REJECTIONS: Record<string, SiteOrderRejection> = {
  human_verification_failed: 'humanVerificationFailed',
  offering_not_on_sale: 'offeringNotOnSale',
  payment_method_unavailable: 'paymentMethodUnavailable',
  payment_already_processed: 'paymentAlreadyProcessed',
};

/** Same limit as the app: a request that hangs counts as unreachable, so the backup source gets its turn. */
const REQUEST_TIMEOUT_MS = 10_000;

type Fetch = typeof globalThis.fetch;

export interface SubmitOptions {
  /** Injected by tests; the page uses the browser's `fetch`. */
  fetch?: Fetch;
  /** Origins to try in order. The backup is used only when the primary cannot be reached. */
  sources?: readonly string[];
}

/**
 * Submits the order with the Turnstile token proving a person sent it. Explicit rejections, a form error and an
 * unregistered origin are final; only a response without a definite outcome (network error, timeout, temporary
 * failure, rate limiting, unrecognized body) moves on to the backup source.
 */
export async function submitOrder(
  order: OrderSubmission,
  humanToken: string,
  options: SubmitOptions = {}
): Promise<SubmitResult> {
  const send = options.fetch ?? globalThis.fetch;
  const sources = options.sources ?? [PRIMARY_API_ORIGIN, BACKUP_API_ORIGIN];
  let rateLimited = false;
  for (const source of sources) {
    const result = await postOrder(source, order, humanToken, send);
    if (result.status === 'rateLimited') {
      rateLimited = true;
      continue;
    }
    if (result.status !== 'unavailable') {
      return result;
    }
  }
  // A limit on either source explains the failure better than a generic one.
  return rateLimited ? { status: 'rateLimited' } : { status: 'unavailable' };
}

async function postOrder(
  source: string,
  order: OrderSubmission,
  humanToken: string,
  send: Fetch
): Promise<SubmitResult> {
  try {
    const response = await send(`${source}/v1/tinytab/site/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: order.email,
        offering: OFFERING,
        paymentMethod: toUnivoPaymentMethod(order.paymentMethod),
        transactionNumber: order.transactionNumber,
        humanToken,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const payload = await readJson(response);
    if (response.status === 200 && payload?.ok === true) {
      return { status: 'submitted' };
    }
    // Every HTTP 400 is a form validation error, whatever the body says.
    if (response.status === 400) {
      return { status: 'invalidRequest' };
    }
    // Failure bodies share one envelope: `{ ok: false, code }`.
    const wireCode = payload?.ok === false && typeof payload.code === 'string' ? payload.code : null;
    // The license center refuses every origin but the site's registered ones: a configuration problem that the
    // backup source cannot fix.
    if (response.status === 403 && wireCode === 'origin_not_allowed') {
      return { status: 'originNotAllowed' };
    }
    if (response.status === 422 && wireCode) {
      const code = REJECTIONS[wireCode];
      if (code) {
        return { status: 'rejected', code };
      }
    }
    if (response.status === 429) {
      return { status: 'rateLimited' };
    }
    return { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}

async function readJson(response: Response): Promise<{ ok?: unknown; code?: unknown } | null> {
  try {
    return (await response.json()) as { ok?: unknown; code?: unknown };
  } catch {
    return null;
  }
}
