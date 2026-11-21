import { ShieldCheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Page } from '@/components/page';
import { CONTACT_EMAIL } from '@/config';

const SECTIONS = ['network', 'email', 'stored', 'usage', 'analytics', 'contact'] as const;

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <Page icon={ShieldCheckIcon} title={t('pages.privacy.title')} description={t('pages.privacy.summary')}>
      <div className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
        {SECTIONS.map((section) => (
          <section key={section} className="px-5 py-4">
            <h2 className="font-medium">{t(`privacy.sections.${section}.title`)}</h2>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              {t(`privacy.sections.${section}.body`, { email: CONTACT_EMAIL })}
            </p>
          </section>
        ))}
      </div>
    </Page>
  );
}
