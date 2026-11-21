import { DownloadIcon, KeyboardIcon, LayersIcon, type LucideIcon, ShieldCheckIcon, ZapIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';

import { SwitcherPreview } from '@/components/switcher-preview';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { DOWNLOAD_URL } from '@/config';

const FEATURES: readonly { id: 'windows' | 'hints' | 'light' | 'offline'; icon: LucideIcon }[] = [
  { id: 'windows', icon: LayersIcon },
  { id: 'hints', icon: KeyboardIcon },
  { id: 'light', icon: ZapIcon },
  { id: 'offline', icon: ShieldCheckIcon },
];

/**
 * Top-aligned single-screen landing layout on desktop: hero and features flow naturally,
 * while the sticky footer stays at the viewport bottom.
 * Prices live on the purchase page only; on phones the page simply scrolls.
 */
export function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-12 py-10 lg:gap-14 lg:py-8 lg:[@media(max-height:760px)]:gap-8 lg:[@media(max-height:760px)]:py-4">
      <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="max-w-2xl">
          <Badge variant="outline" className="text-muted-foreground">
            {t('home.eyebrow')}
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl lg:[@media(max-height:760px)]:text-5xl">
            {t('home.headline1')}
            <br />
            <span className="bg-linear-to-r from-brand to-violet-400 bg-clip-text text-transparent">
              {t('home.headline2')}
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-pretty lg:[@media(max-height:760px)]:mt-4">
            {t('home.intro')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 lg:[@media(max-height:760px)]:mt-6">
            <a href={DOWNLOAD_URL} className={buttonVariants({ size: 'lg', className: 'h-10 px-5' })}>
              <DownloadIcon data-icon="inline-start" />
              {t('home.ctaDownload')}
            </a>
            <Link
              href="/purchase"
              className={buttonVariants({ size: 'lg', variant: 'outline', className: 'h-10 px-5' })}
            >
              {t('home.ctaPurchase')}
            </Link>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <SwitcherPreview />
        </motion.div>
      </section>

      <section aria-label={t('home.featuresTitle')}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ id, icon: Icon }, index) => (
            <motion.li
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 + index * 0.06, ease: 'easeOut' }}
              className="grid content-start gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <h2 className="flex items-center gap-2 font-medium">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="size-4" />
                </span>
                {t(`home.features.${id}.title`)}
              </h2>
              <p className="text-sm text-muted-foreground text-pretty">{t(`home.features.${id}.body`)}</p>
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  );
}
