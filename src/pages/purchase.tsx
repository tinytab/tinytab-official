import { CircleCheckIcon, DownloadIcon, SendIcon, ShoppingBagIcon, ZoomInIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CopyButton } from '@/components/copy-button';
import { Page } from '@/components/page';
import { PaymentQr } from '@/components/payment-qr';
import { Turnstile } from '@/components/turnstile';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CONTACT_EMAIL, DOWNLOAD_URL, PAYMENT_METHODS, PRICE, TURNSTILE_SITE_KEY } from '@/config';
import { type SubmitResult, submitOrder } from '@/lib/api';
import { type PaymentMethod, normalizeEmail, normalizeTransactionNumber } from '@/lib/order';

const STEPS = ['download', 'pay', 'submit', 'received', 'activate'] as const;

export default function PurchasePage() {
  const { t } = useTranslation();
  const [orderOpen, setOrderOpen] = useState(false);

  return (
    <Page icon={ShoppingBagIcon} title={t('pages.purchase.title')} description={t('pages.purchase.summary')}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('purchase.price', PRICE)}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('purchase.stepsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-medium text-brand tabular-nums">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-pretty">
                  {t(`purchase.steps.${step}`)}
                  {step === 'download' && (
                    <a
                      href={DOWNLOAD_URL}
                      className="ml-1.5 inline-flex items-center gap-1 font-medium text-brand underline-offset-4 hover:underline"
                    >
                      <DownloadIcon className="size-3.5" />
                      {t('purchase.download')}
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <PaymentMethods onSubmitOrder={() => setOrderOpen(true)} />

      <OrderDialog open={orderOpen} onOpenChange={setOrderOpen} />
    </Page>
  );
}

type PaymentOption = (typeof PAYMENT_METHODS)[number];

/** Small codes side by side; a click opens one alone and larger, so a phone cannot pick up its neighbour. */
function PaymentMethods({ onSubmitOrder }: { onSubmitOrder: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Kept after closing, so the dialog still shows the code while it fades out.
  const [shown, setShown] = useState<PaymentOption>(PAYMENT_METHODS[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('purchase.methodsTitle')}</CardTitle>
        <CardAction>
          <Button type="button" size="sm" aria-haspopup="dialog" onClick={onSubmitOrder}>
            <SendIcon data-icon="inline-start" />
            {t('purchase.order.open')}
          </Button>
        </CardAction>
        <CardDescription>{t('purchase.methodsHint', PRICE)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {PAYMENT_METHODS.map((method) => {
            const name = t(`purchase.methods.${method.id}`);
            return (
              <figure key={method.id} className="grid content-start gap-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShown(method);
                    setOpen(true);
                  }}
                  aria-label={t('purchase.zoom', { method: name })}
                  className="group relative cursor-zoom-in rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <PaymentQr method={method.id} payload={method.payload} label={name} />
                  <span className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ZoomInIcon className="size-4" />
                  </span>
                </button>
                <figcaption className="grid gap-1 text-sm text-muted-foreground">
                  {name}
                  {'address' in method && <PaymentAddress address={method.payload} />}
                </figcaption>
              </figure>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">{t('purchase.zoomHint')}</p>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{t(`purchase.methods.${shown.id}`)}</DialogTitle>
            <DialogDescription>{t(`purchase.scan.${shown.id}`, PRICE)}</DialogDescription>
          </DialogHeader>
          <PaymentQr method={shown.id} payload={shown.payload} label={t(`purchase.methods.${shown.id}`)} />
          {'address' in shown && (
            <div className="grid gap-1 text-center">
              <PaymentAddress address={shown.payload} />
            </div>
          )}
          <DialogClose render={<Button variant="outline" />}>{t('purchase.close')}</DialogClose>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PaymentAddress({ address }: { address: string }) {
  const { t } = useTranslation();

  return (
    <>
      <code className="font-mono text-xs break-all text-foreground">{address}</code>
      <CopyButton
        value={address}
        label={t('purchase.copyAddress')}
        done={t('purchase.addressCopied')}
        size="sm"
        className="justify-self-center"
      />
    </>
  );
}

type FormResult = SubmitResult | { status: 'invalidEmail' | 'emailMismatch' | 'invalidTransactionNumber' };

function OrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0].id);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [result, setResult] = useState<FormResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const filled = email.trim() !== '' && confirmEmail.trim() !== '' && transactionNumber.trim() !== '';

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    const normalizedConfirm = normalizeEmail(confirmEmail);
    const normalizedTransaction = normalizeTransactionNumber(transactionNumber);
    // Checked here first so a typo is reported without a round trip; Univo checks again.
    if (!normalizedEmail || !normalizedConfirm) {
      setResult({ status: 'invalidEmail' });
      return;
    }
    if (normalizedEmail !== normalizedConfirm) {
      setResult({ status: 'emailMismatch' });
      return;
    }
    if (!normalizedTransaction) {
      setResult({ status: 'invalidTransactionNumber' });
      return;
    }
    setEmail(normalizedEmail);
    setConfirmEmail(normalizedEmail);
    setTransactionNumber(normalizedTransaction);
    if (!turnstileToken) {
      return;
    }
    setSubmitting(true);
    const outcome = await submitOrder(
      { email: normalizedEmail, paymentMethod: method, transactionNumber: normalizedTransaction },
      turnstileToken
    );
    setResult(outcome);
    setSubmitting(false);
    if (outcome.status !== 'submitted') {
      // Turnstile tokens are accepted only once, whatever the outcome.
      setTurnstileReset((count) => count + 1);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // The widget unmounts with the dialog; a token it issued is no longer valid on reopen.
      setTurnstileToken(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>{t('purchase.order.title')}</DialogTitle>
          <DialogDescription>{t('purchase.order.description')}</DialogDescription>
        </DialogHeader>
        {result?.status === 'submitted' ? (
          <p className="flex gap-2.5 rounded-lg bg-brand/10 p-3 text-sm" role="status">
            <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>{t('purchase.order.submitted')}</span>
          </p>
        ) : (
          <form onSubmit={submit} className="grid gap-5" noValidate>
            <Field id="order-email" label={t('purchase.order.email')} hint={t('purchase.order.emailHint')}>
              <Input
                id="order-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('purchase.order.emailPlaceholder')}
                autoComplete="email"
                spellCheck={false}
                aria-describedby="order-email-hint"
              />
            </Field>

            <Field
              id="order-confirm-email"
              label={t('purchase.order.confirmEmail')}
              hint={t('purchase.order.confirmEmailHint')}
            >
              <Input
                id="order-confirm-email"
                type="email"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                placeholder={t('purchase.order.emailPlaceholder')}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="order-confirm-email-hint"
              />
            </Field>

            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm leading-none font-medium">{t('purchase.order.method')}</legend>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map(({ id }) => (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors has-checked:border-brand has-checked:bg-brand/10 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                  >
                    <input
                      type="radio"
                      name="order-method"
                      value={id}
                      checked={method === id}
                      onChange={() => setMethod(id)}
                      className="accent-brand"
                    />
                    {t(`purchase.methods.${id}`)}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field
              id="order-transaction"
              label={t('purchase.order.transactionNumber')}
              hint={t(`purchase.order.transactionNumberHint.${method}`)}
            >
              <Input
                id="order-transaction"
                value={transactionNumber}
                onChange={(event) => setTransactionNumber(event.target.value)}
                placeholder={t('purchase.order.transactionNumberPlaceholder')}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="order-transaction-hint"
                className="font-mono"
              />
            </Field>

            <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} resetSignal={turnstileReset} />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={submitting || !filled || !turnstileToken}>
                <SendIcon data-icon="inline-start" />
                {submitting ? t('purchase.order.submitting') : t('purchase.order.submit')}
              </Button>
              {result && (
                <p className="text-sm text-destructive" role="alert">
                  {t(`purchase.order.errors.${result.status === 'rejected' ? result.code : result.status}`, {
                    email: CONTACT_EMAIL,
                  })}
                </p>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <p id={`${id}-hint`} className="text-sm text-muted-foreground text-pretty">
        {hint}
      </p>
    </div>
  );
}
