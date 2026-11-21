import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Cloudflare requires loading the script from its own origin; it cannot be bundled. */
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const LOAD_TIMEOUT_MS = 15_000;

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      language: string;
      theme: 'auto';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    }
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    const timer = setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS);
    script.onload = () => {
      clearTimeout(timer);
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error('missing'));
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error('blocked'));
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    // A later visit to the page may succeed, e.g. once the network is back.
    loading = null;
    throw error;
  });
  return loading;
}

/** Turnstile's language codes for the site's languages. */
const LANGUAGES: Record<string, string> = {
  'zh-CN': 'zh-cn',
  'zh-Hant': 'zh-tw',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  de: 'de',
  fr: 'fr',
  it: 'it',
  es: 'es',
  pt: 'pt',
};

interface TurnstileProps {
  siteKey: string;
  /** The current token, or null when there is none (not yet solved, expired or failed). */
  onToken: (token: string | null) => void;
  /** Changing it asks for a fresh token; each token is accepted only once. */
  resetSignal: number;
}

/** Cloudflare Turnstile: proves a person submits the order form, without a puzzle in most cases. */
export function Turnstile({ siteKey, onToken, resetSignal }: TurnstileProps) {
  const { t, i18n } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const emitToken = useEffectEvent((token: string | null) => onToken(token));

  useEffect(() => {
    let cancelled = false;
    loadTurnstile().then(
      (api) => {
        if (cancelled || !container.current) {
          return;
        }
        setFailed(false);
        const id = api.render(container.current, {
          sitekey: siteKey,
          language: LANGUAGES[i18n.language] ?? 'auto',
          theme: 'auto',
          callback: (token) => emitToken(token),
          'expired-callback': () => emitToken(null),
          'error-callback': () => {
            emitToken(null);
            setFailed(true);
          },
        });
        widget.current = { api, id };
      },
      () => !cancelled && setFailed(true)
    );
    return () => {
      cancelled = true;
      if (widget.current) {
        widget.current.api.remove(widget.current.id);
        widget.current = null;
      }
    };
  }, [siteKey, i18n.language]);

  useEffect(() => {
    if (resetSignal > 0 && widget.current) {
      emitToken(null);
      widget.current.api.reset(widget.current.id);
    }
  }, [resetSignal]);

  return (
    <div className="grid gap-2">
      <div ref={container} className="min-h-[65px]" />
      {failed && (
        <p className="text-sm text-destructive" role="alert">
          {t('purchase.order.turnstileFailed')}
        </p>
      )}
    </div>
  );
}
