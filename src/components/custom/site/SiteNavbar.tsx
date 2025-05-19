
"use client";

import Link from 'next/link';
import { AppLogo } from '@/components/custom/AppLogo'; // Using existing logo for now
import { Button } from '@/components/ui/button';
import { Home, List, ShoppingBag, MapPin, MessageCircle } from 'lucide-react'; // Added icons

const navItems = [
  { label: 'الرئيسية', href: '/website', icon: Home },
  { label: 'القائمة', href: '/website/menu', icon: List }, // Placeholder link
  { label: 'اطلب أونلاين', href: '/website/order', icon: ShoppingBag }, // Placeholder link
  { label: 'تتبع طلبك', href: '/website/track', icon: MapPin }, // Placeholder link
  { label: 'اتصل بنا', href: '/website/contact', icon: MessageCircle }, // Placeholder link
];

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/website" className="flex items-center space-x-2 rtl:space-x-reverse">
          <AppLogo />
        </Link>
        <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-primary text-foreground/70"
            >
              <item.icon className="inline-block h-4 w-4 me-1 rtl:ms-1 rtl:me-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Mobile Menu Trigger (placeholder for future) */}
        <div className="md:hidden">
          {/* <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button> */}
        </div>
      </div>
    </header>
  );
}
