
import type { ReactNode } from 'react';
import { SiteNavbar } from '@/components/custom/site/SiteNavbar';
import { SiteFooter } from '@/components/custom/site/SiteFooter';

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
