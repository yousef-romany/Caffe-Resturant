"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AppLogo } from "@/components/custom/AppLogo";
import { NavLink } from "@/components/custom/NavLink";
import { UserNav } from "@/components/custom/UserNav";
import { ThemeToggle } from "@/components/custom/ThemeToggle";
import { NAV_ITEMS, SETTINGS_NAV_ITEM, type NavItem } from "@/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  const renderNavItems = (items: NavItem[], isSubMenu = false) => {
    return items.map((item) => {
      if (item.children && item.children.length > 0) {
        const isActiveGroup =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <AccordionItem
            value={item.label}
            key={item.label}
            className="border-b-0"
          >
            <AccordionTrigger
              className={cn(
                "flex justify-start w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:no-underline",
                isActiveGroup &&
                  "bg-sidebar-primary text-sidebar-primary-foreground data-[state=open]:bg-sidebar-primary data-[state=open]:text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              )}
              dir="rtl"
            >
              <div className="flex w-full">
                <item.icon className="h-5 w-5" />
                <span className="!w-fit group-data-[collapsible=icon]:hidden">
                  {item.label}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 ps-3">
              {" "}
              {/* Indent accordion content */}
              <SidebarMenu>{renderNavItems(item.children, true)}</SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        );
      }
      return (
        <SidebarMenuItem key={item.href} dir="rtl">
          <NavLink href={item.href} icon={item.icon} label={item.label} />
        </SidebarMenuItem>
      );
    });
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        side="right"
        className="border-l border-r-0 border-sidebar-border shadow-sm"
      >
        <SidebarHeader className="p-4">
          <AppLogo />
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent>
            <Accordion type="multiple" className="w-full">
              {renderNavItems(NAV_ITEMS)}
            </Accordion>
          </SidebarContent>
        </ScrollArea>
        <SidebarSeparator />
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <NavLink
                href={SETTINGS_NAV_ITEM.href}
                icon={SETTINGS_NAV_ITEM.icon}
                label={SETTINGS_NAV_ITEM.label}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 shadow-sm backdrop-blur-md md:px-6">
          <div className="w-[100px] h-full bg-red-500"></div>
          <div className="flex">
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex flex-1 items-center justify-start gap-4">
              {" "}
              {/* Changed to justify-start for RTL */}
              <ThemeToggle />
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
