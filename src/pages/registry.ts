import { CircleHelpIcon, type LucideIcon, ShieldCheckIcon, ShoppingBagIcon } from 'lucide-react';
import { type ComponentType, type LazyExoticComponent, lazy } from 'react';

export interface SitePage {
  /** Also names its title and summary in the locale files: `pages.<id>.title`, `pages.<id>.summary`. */
  id: 'purchase' | 'faq' | 'privacy';
  /** The hash route, e.g. `#/purchase`. The app links to these, so they must not change. */
  path: string;
  icon: LucideIcon;
  component: LazyExoticComponent<ComponentType>;
}

/** Pages reachable from the menu and the home page, in menu order. The home page itself is `/`. */
export const PAGES: readonly SitePage[] = [
  {
    id: 'purchase',
    path: '/purchase',
    icon: ShoppingBagIcon,
    component: lazy(() => import('@/pages/purchase')),
  },
  {
    id: 'faq',
    path: '/faq',
    icon: CircleHelpIcon,
    component: lazy(() => import('@/pages/faq')),
  },
  {
    id: 'privacy',
    path: '/privacy',
    icon: ShieldCheckIcon,
    component: lazy(() => import('@/pages/privacy')),
  },
];
