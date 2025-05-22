
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/custom/AppLogo'; // Assuming you want the same logo
import { ThemeToggle } from '@/components/custom/ThemeToggle';
import { Coffee } from 'lucide-react';

export default function WebsiteCaffeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <Link href="/websiteCaffe" className="flex items-center gap-2 text-primary">
            <Coffee className="h-6 w-6" />
            <span className="font-semibold text-lg">كافيه الزبائن</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/websiteCaffe/scan-table" passHref>
              <Button variant="outline">مسح طاولة</Button>
            </Link>
            <Link href="/websiteCaffe/auth/login" passHref>
              <Button variant="ghost">تسجيل الدخول</Button>
            </Link>
            <Link href="/websiteCaffe/auth/register" passHref>
              <Button>إنشاء حساب</Button>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border/40 bg-background py-6">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} كافيه بوس إكسبريس. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
