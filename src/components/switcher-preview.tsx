import { cn } from 'cn';
import { CompassIcon, HammerIcon, type LucideIcon, MailIcon, NotebookPenIcon, SquareTerminalIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Sample windows, most recently used first; the first is the current window and has no hint key, as in the app. */
const ROWS: readonly {
  id: 'xcode' | 'safari' | 'terminal' | 'notes' | 'mail';
  icon: LucideIcon;
  tint: string;
  hint: string | null;
  minimized?: boolean;
}[] = [
  { id: 'xcode', icon: HammerIcon, tint: 'bg-sky-500', hint: null },
  { id: 'safari', icon: CompassIcon, tint: 'bg-blue-500', hint: 'S' },
  { id: 'terminal', icon: SquareTerminalIcon, tint: 'bg-zinc-700', hint: 'T' },
  { id: 'notes', icon: NotebookPenIcon, tint: 'bg-amber-400', hint: 'N', minimized: true },
  { id: 'mail', icon: MailIcon, tint: 'bg-indigo-500', hint: 'M' },
];

const CYCLE_MILLISECONDS = 1600;

/**
 * A static replica of the switcher panel. The highlight steps through the rows as if Tab were pressed,
 * except when the system asks for reduced motion.
 */
export function SwitcherPreview() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState(1);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const timer = setInterval(() => setSelected((index) => (index + 1) % ROWS.length), CYCLE_MILLISECONDS);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <figure aria-label={t('home.previewLabel')} className="relative w-full max-w-md">
      {/* Brand glow behind the panel: stays within mobile gutters, extends on larger screens. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -inset-y-6 rounded-full bg-brand/25 blur-2xl sm:-inset-10 sm:blur-3xl"
      />

      <div className="relative w-full rounded-2xl bg-card/80 p-2 shadow-2xl ring-1 ring-foreground/10 backdrop-blur-xl">
        <ul className="grid gap-0.5" aria-hidden>
          {ROWS.map(({ id, icon: Icon, tint, hint, minimized }, index) => {
            const active = index === selected;
            return (
              <li
                key={id}
                className="relative flex h-14 items-center gap-3 rounded-xl px-3 lg:[@media(max-height:760px)]:h-12"
              >
                {active && (
                  <motion.span
                    layoutId="switcher-preview-highlight"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    className="absolute inset-0 rounded-xl bg-brand"
                  />
                )}
                <span className={cn('relative flex size-9 items-center justify-center rounded-lg text-white', tint)}>
                  <Icon className="size-5" />
                </span>
                <span className={cn('relative grid min-w-0 flex-1', active ? 'text-brand-foreground' : '')}>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {t(`home.preview.rows.${id}.app`)}
                    {minimized && (
                      <span
                        className={cn(
                          'rounded px-1 text-[0.65rem]',
                          active ? 'bg-brand-foreground/20' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {t('home.preview.minimized')}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn('truncate text-xs', active ? 'text-brand-foreground/80' : 'text-muted-foreground')}
                  >
                    {t(`home.preview.rows.${id}.title`)}
                  </span>
                </span>
                {hint && (
                  <kbd
                    className={cn(
                      'relative flex size-7 items-center justify-center rounded-md font-mono text-sm font-semibold ring-1',
                      active ? 'bg-brand-foreground/20 ring-brand-foreground/30' : 'bg-muted ring-foreground/10'
                    )}
                  >
                    {hint}
                  </kbd>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <figcaption className="relative mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        {t('home.preview.hold')}
        <kbd className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs ring-1 ring-foreground/10">⌘</kbd>+
        <kbd className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs ring-1 ring-foreground/10">Tab</kbd>
      </figcaption>
    </figure>
  );
}
