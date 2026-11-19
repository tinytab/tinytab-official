import { MailIcon, ShieldCheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LanguageMenu } from '@/components/language-menu';
import { CONTACT_EMAIL } from '@/config';

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="page-width flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:gap-2">
      <span className="flex items-center gap-1.5">
        <ShieldCheckIcon className="size-4 text-brand" />
        {t('footer.promise')}
      </span>
      <div className="flex items-center gap-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
        >
          <MailIcon className="size-4" />
          {t('footer.contact')}
        </a>
        <LanguageMenu />
      </div>
    </footer>
  );
}
