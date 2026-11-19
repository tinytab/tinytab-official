import { cn } from 'cn';
import { useEffect, useRef } from 'react';

const currentTheme = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

/**
 * Decorative backdrop behind every page: a soft brand-coloured top light, and over it a particle wave field drawn
 * with Three.js (`wave-field.ts`). Three.js is loaded only after the page has rendered; until then, or where WebGL is
 * unavailable, the top light alone remains. Under `prefers-reduced-motion` the field is a still frame. The backdrop
 * sits behind the content and is hidden from assistive technology.
 */
export function SiteBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) {
      return;
    }
    let disposed = false;
    let cleanup = () => {};

    void import('@/components/wave-field').then(({ createWaveField }) => {
      if (disposed) {
        return;
      }
      const field = createWaveField(element, {
        animate: !matchMedia('(prefers-reduced-motion: reduce)').matches,
        dense: matchMedia('(min-width: 768px)').matches,
        theme: currentTheme(),
      });
      if (!field) {
        return;
      }
      element.dataset.ready = '';

      // Follow the theme toggle, which flips the `dark` class on <html>.
      const themes = new MutationObserver(() => field.setTheme(currentTheme()));
      themes.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      const pointer = (event: PointerEvent) =>
        field.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
      window.addEventListener('pointermove', pointer, { passive: true });

      cleanup = () => {
        themes.disconnect();
        window.removeEventListener('pointermove', pointer);
        field.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={cn(
          'absolute -top-[35vmax] left-1/2 size-[70vmax] -translate-x-1/2 rounded-full will-change-transform',
          'animate-drift-a opacity-20 motion-reduce:animate-none dark:opacity-30',
          'bg-[radial-gradient(circle,var(--color-brand)_0%,transparent_60%)]'
        )}
      />
      {/* Fades in once the first frame is drawn, so the field never pops in. */}
      <canvas
        ref={canvas}
        className="absolute inset-0 size-full opacity-0 transition-opacity duration-1000 data-ready:opacity-100"
      />
    </div>
  );
}
