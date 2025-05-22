
"use client";

import Link from 'next/link';
import { AppLogo } from '@/components/custom/AppLogo'; // Using existing logo for now
import { Button } from '@/components/ui/button';
import { Home, List, ShoppingBag, MapPin, MessageCircle, UserPlus, LogInIcon } from 'lucide-react'; // Added icons
import { ThemeToggle } from '../ThemeToggle'; // Corrected import path

const navItems = [
  { label: 'الرئيسية', href: '/website', icon: Home },
  { label: 'القائمة', href: '/website/menu', icon: List }, 
  // { label: 'اطلب أونلاين', href: '/website/order', icon: ShoppingBag }, // Placeholder link
  // { label: 'تتبع طلبك', href: '/website/track', icon: MapPin }, // Placeholder link
  // { label: 'اتصل بنا', href: '/website/contact', icon: MessageCircle }, // Placeholder link
];

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/website" className="flex items-center space-x-2 rtl:space-x-reverse">
          {/* Using a simplified logo for website, AppLogo is for POS */}
          <ShoppingBag className="h-7 w-7 text-primary" />
           <span className="font-bold text-xl text-primary">كافيه الزبائن</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" asChild className="px-2 sm:px-3">
              <Link
                href={item.href}
                className="transition-colors hover:text-primary text-foreground/80"
              >
                <item.icon className="h-4 w-4 sm:me-1" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </Button>
          ))}
           <div className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" asChild  className="px-2 sm:px-3">
                <Link href="/website/auth/login">
                    <LogInIcon className="h-4 w-4 sm:me-1" /> <span className="hidden sm:inline">دخول</span>
                </Link>
            </Button>
            <Button asChild  className="px-2 sm:px-3">
                <Link href="/website/auth/register">
                     <UserPlus className="h-4 w-4 sm:me-1" /> <span className="hidden sm:inline">حساب جديد</span>
                </Link>
            </Button>
           </div>
          <ThemeToggle />
           {/* Mobile Menu Trigger (placeholder for future) */}
            <div className="sm:hidden">
             {/* <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button> */}
            </div>
        </nav>
      </div>
    </header>
  );
}
