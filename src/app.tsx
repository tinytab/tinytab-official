import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Suspense, useEffect } from 'react';
import { Redirect, Route, Router, Switch, useLocation } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';

import { SiteBackground } from '@/components/site-background';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Home } from '@/pages/home';
import { PAGES } from '@/pages/registry';

function Routes() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        className="flex flex-1 flex-col"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Suspense fallback={<div className="min-h-96" />}>
          <Switch location={location}>
            <Route path="/" component={Home} />
            {PAGES.map(({ id, path, component }) => (
              <Route key={id} path={path} component={component} />
            ))}
            <Route>
              <Redirect to="/" replace />
            </Route>
          </Switch>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <SiteBackground />
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main className="page-width flex flex-1 flex-col">
              <Routes />
            </main>
            <SiteFooter />
          </div>
        </Router>
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </MotionConfig>
  );
}
