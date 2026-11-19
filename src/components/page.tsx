import type { LucideIcon } from 'lucide-react';

interface PageProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Frame shared by the feature pages: icon, title and summary, then the content. The column is centred on wide
 * screens, while its text stays left-aligned for reading.
 */
export function Page({ icon: Icon, title, description, children }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl py-8 sm:py-10">
      <header className="mb-6 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon className="size-5" />
        </span>
        <div className="grid gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{description}</p>
        </div>
      </header>
      <div className="grid gap-6">{children}</div>
    </div>
  );
}
