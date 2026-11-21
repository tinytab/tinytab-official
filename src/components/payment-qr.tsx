import { useMemo } from 'react';

import { PAYMENT_LOGOS } from '@/components/payment-logos';
import type { PaymentMethod } from '@/lib/order';
import { qrShape } from '@/lib/qr';

/** Share of the code's width taken by the logo; error correction level H recovers the modules it hides. */
const LOGO_SCALE = 0.22;

/** A payment QR code drawn from its payload with the method's logo in the centre, the same size for every method. */
export function PaymentQr({ method, payload, label }: { method: PaymentMethod; payload: string; label: string }) {
  const { size, path } = useMemo(() => qrShape(payload), [payload]);
  const Logo = PAYMENT_LOGOS[method];
  const logo = size * LOGO_SCALE;
  const centre = size / 2;

  return (
    <div className="aspect-square w-full rounded-xl bg-white p-3 ring-1 ring-foreground/10">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="size-full">
        <path d={path} fill="#000" shapeRendering="crispEdges" />
        <circle cx={centre} cy={centre} r={logo / 2 + 1} fill="#fff" />
        <Logo x={centre - logo / 2} y={centre - logo / 2} width={logo} height={logo} />
      </svg>
    </div>
  );
}
