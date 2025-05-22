
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/custom/ThemeToggle';
import { Coffee, Home, ScanLine, UserPlus, LogInIcon } from 'lucide-react'; // Added more icons

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <Link href="/website" className="flex items-center gap-2 text-primary">
            <Coffee className="h-7 w-7" />
            <span className="font-bold text-xl">كافيه الزبائن</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/website" passHref>
              <Button variant="ghost" className="hidden sm:inline-flex">
                <Home className="h-4 w-4 me-1" /> الرئيسية
              </Button>
            </Link>
            <Link href="/website/scan-table" passHref>
              <Button variant="outline">
                <ScanLine className="h-4 w-4 sm:me-1" /> <span className="hidden sm:inline">مسح طاولة</span>
              </Button>
            </Link>
            <Link href="/website/auth/login" passHref>
              <Button variant="ghost">
                <LogInIcon className="h-4 w-4 sm:me-1" /> <span className="hidden sm:inline">دخول</span>
              </Button>
            </Link>
            <Link href="/website/auth/register" passHref>
              <Button>
                <UserPlus className="h-4 w-4 sm:me-1" /> <span className="hidden sm:inline">حساب جديد</span>
              </Button>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-grow">
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
