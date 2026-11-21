import { ChevronDownIcon, CircleHelpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Page } from '@/components/page';

const ITEMS = ['notOpened', 'permission', 'reinstall', 'newMac', 'network'] as const;

export default function FaqPage() {
  const { t } = useTranslation();

  return (
    <Page icon={CircleHelpIcon} title={t('pages.faq.title')} description={t('pages.faq.summary')}>
      <div className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
        {ITEMS.map((item) => (
          <details key={item} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {t(`faq.items.${item}.question`)}
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">{t(`faq.items.${item}.answer`)}</p>
          </details>
        ))}
      </div>
    </Page>
  );
}
