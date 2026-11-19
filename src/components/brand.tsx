import { useTranslation } from 'react-i18next';

import appIconUrl from '@/assets/AppIcon.svg';

export function Brand() {
  const { t } = useTranslation();

  return (
    <span className="flex items-center gap-2.5">
      <img src={appIconUrl} alt="" className="size-7" />
      <span className="text-xl font-semibold tracking-tight">{t('brand.name')}</span>
    </span>
  );
}
