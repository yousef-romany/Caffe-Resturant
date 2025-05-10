"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarMenuButton } from '@/components/ui/sidebar';

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function NavLink({ href, icon: Icon, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} passHref legacyBehavior>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={{ children: label, className: "text-xs" }}
        className="justify-start"
      >
        <a>
          <Icon className="h-5 w-5" />
          <span className="group-data-[collapsible=icon]:hidden">{label}</span>
        </a>
      </SidebarMenuButton>
    </Link>
  );
}
