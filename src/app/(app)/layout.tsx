
"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  SidebarMenuButton, // Import SidebarMenuButton
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
import { NAV_ITEMS, SETTINGS_NAV_ITEM, type NavItem, type CategorySlug } from "@/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeKitchenSlugForNav, setActiveKitchenSlugForNav] = useState<CategorySlug | null>(null);

  useEffect(() => {
    if (pathname === '/kitchen-display') {
      const storedSlug = localStorage.getItem('selectedKitchenCategorySlug') as CategorySlug | null;
      if (storedSlug) {
        setActiveKitchenSlugForNav(storedSlug);
      } else {
        // If no slug in localStorage, default to the first one in NAV_ITEMS or null
        const kitchenNav = NAV_ITEMS.find(item => item.label === 'شاشة المطبخ');
        const firstKitchenSubItemSlug = kitchenNav?.children?.[0]?.slug;
        setActiveKitchenSlugForNav(firstKitchenSubItemSlug || null);
      }
    } else {
      // If not on /kitchen-display, no specific kitchen category is active for nav highlighting
      setActiveKitchenSlugForNav(null);
    }
  }, [pathname]);


  const renderNavItems = (items: NavItem[], isSubMenu = false, parentHref?: string) => {
    return items.map((item) => {
      if (item.children && item.children.length > 0) {
        const isChildActive = item.children?.some(child => {
          if (item.href === '/kitchen-display' && child.slug) {
            return activeKitchenSlugForNav === child.slug && pathname === '/kitchen-display';
          }
          return pathname.startsWith(child.href);
        });
        
        let isActiveGroup = 
          (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) || 
          isChildActive;

        if (item.href === '/kitchen-display' && pathname !== '/kitchen-display') {
            isActiveGroup = false; // Don't highlight main kitchen nav if not on kitchen page
        } else if (item.href === '/kitchen-display' && pathname === '/kitchen-display') {
            isActiveGroup = true; // Highlight main kitchen nav if on kitchen page, sub-item highlights based on slug
        }
        
        return (
          <AccordionItem
            value={item.label}
            key={item.label}
            className="border-b-0"
          >
            <AccordionTrigger
              className={cn(
                "flex w-full items-center rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:no-underline",
                isActiveGroup &&
                  "bg-sidebar-primary text-sidebar-primary-foreground data-[state=open]:bg-sidebar-primary data-[state=open]:text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              )}
              dir="rtl"
            >
              <div className="flex w-full items-center justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                <item.icon className="h-5 w-5" />
                <span className="!w-fit group-data-[collapsible=icon]:hidden">
                  {item.label}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 ps-3">
              <SidebarMenu>{renderNavItems(item.children, true, item.href)}</SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        );
      }

      // Handle kitchen sub-items specifically
      if (parentHref === '/kitchen-display' && item.slug) {
        const currentItemSlug = item.slug;
        return (
          <SidebarMenuItem key={item.label} dir="rtl">
            <SidebarMenuButton
              asChild
              isActive={activeKitchenSlugForNav === currentItemSlug && pathname === '/kitchen-display'}
              tooltip={{ children: item.label, className: "text-xs" }}
              className="justify-start"
              onClick={() => {
                if (currentItemSlug) {
                  localStorage.setItem('selectedKitchenCategorySlug', currentItemSlug);
                  setActiveKitchenSlugForNav(currentItemSlug);
                  if (pathname === '/kitchen-display') {
                    // Force re-render or trigger useEffect in kitchen-display if already on the page
                    // One way is to temporarily change path then change back, or manage a refresh state.
                    // Forcing a push to the same path can sometimes work.
                    router.push('/kitchen-display');
                  } else {
                    router.push('/kitchen-display');
                  }
                }
              }}
            >
              <a> {/* Using <a> for semantic correctness with asChild, but it won't navigate via href */}
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
            {SETTINGS_NAV_ITEM.children && SETTINGS_NAV_ITEM.children.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                 <AccordionItem
                    value={SETTINGS_NAV_ITEM.label}
                    key={SETTINGS_NAV_ITEM.label}
                    className="border-b-0"
                  >
                    <AccordionTrigger
                      className={cn(
                        "flex w-full items-center rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:no-underline",
                        (pathname.startsWith(SETTINGS_NAV_ITEM.href) || SETTINGS_NAV_ITEM.children?.some(child => pathname.startsWith(child.href))) &&
                          "bg-sidebar-primary text-sidebar-primary-foreground data-[state=open]:bg-sidebar-primary data-[state=open]:text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      )}
                      dir="rtl"
                    >
                      <div className="flex w-full items-center justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                        <SETTINGS_NAV_ITEM.icon className="h-5 w-5" />
                        <span className="!w-fit group-data-[collapsible=icon]:hidden">
                          {SETTINGS_NAV_ITEM.label}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 ps-3">
                      <SidebarMenu>{renderNavItems(SETTINGS_NAV_ITEM.children, true, SETTINGS_NAV_ITEM.href)}</SidebarMenu>
                    </AccordionContent>
                  </AccordionItem>
              </Accordion>
            ) : (
               <SidebarMenuItem>
                  <NavLink
                    href={SETTINGS_NAV_ITEM.href}
                    icon={SETTINGS_NAV_ITEM.icon}
                    label={SETTINGS_NAV_ITEM.label}
                  />
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 shadow-sm backdrop-blur-md md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
