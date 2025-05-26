
"use client"; // Make this a Client Component

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
  SidebarMenuButton,
  useSidebar, // Keep the import if SidebarTrigger or other direct children use it, but AppLayout itself should not call it at the top level.
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
import { useEffect, useState, useCallback } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

interface UserSession {
  userId: string;
  username: string;
  fullName?: string;
  roleNames: string[];
  permissionNames: string[];
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeKitchenSlugForNav, setActiveKitchenSlugForNav] = useState<CategorySlug | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [isAccessChecked, setIsAccessChecked] = useState(false);

  // Do NOT call useSidebar() here at the top level of AppLayout if AppLayout is the one *providing* SidebarProvider.
  // const { isMobile, state, openMobile, setOpenMobile, side } = useSidebar(); // This was the problematic line.

  const checkPagePermission = useCallback((currentPath: string, permissions: string[]): boolean => {
    let requiredPermission: string | undefined = undefined;

    const findPermission = (items: NavItem[]): boolean => {
      for (const item of items) {
        if (item.href === currentPath) {
          requiredPermission = item.requiredPermission;
          return true;
        }
        if (item.children && findPermission(item.children)) {
          // If a child matched, but the parent itself has a more general perm, it might be an issue.
          // However, for direct page access, we care about the specific page's perm.
          // If the currentPath matched a child, requiredPermission would be set by that child.
          return true;
        }
      }
      return false;
    };

    findPermission(NAV_ITEMS);
    if (requiredPermission === undefined) { // Check settings nav if not found in main nav
        if (SETTINGS_NAV_ITEM.href === currentPath) {
            requiredPermission = SETTINGS_NAV_ITEM.requiredPermission;
        } else if (SETTINGS_NAV_ITEM.children) {
            findPermission([SETTINGS_NAV_ITEM]); // Reuse findPermission by wrapping settings in an array
        }
    }
    
    if (!requiredPermission) return true; // Page doesn't require specific permission
    return permissions.includes(requiredPermission);
  }, []);


  useEffect(() => {
    const sessionString = localStorage.getItem('userSession');
    let permissions: string[] = [];
    if (sessionString) {
      try {
        const sessionData: UserSession = JSON.parse(sessionString);
        permissions = sessionData.permissionNames || [];
        setUserPermissions(permissions);
      } catch (e) {
        console.error("Failed to parse user session from localStorage", e);
        setUserPermissions([]);
      }
    }
    setIsSessionLoaded(true);

    const storedSlug = localStorage.getItem('selectedKitchenCategorySlug') as CategorySlug | null;
    if (pathname === '/kitchen-display' && storedSlug) {
      setActiveKitchenSlugForNav(storedSlug);
    } else if (pathname !== '/kitchen-display') {
      setActiveKitchenSlugForNav(null);
    }
    
    // Check page permission
    if (sessionString || pathname === '/dashboard') { // Assuming /dashboard is always accessible post-login before full session check
      if (!checkPagePermission(pathname, permissions)) {
        console.warn(`Access denied to ${pathname}. Required permission not found.`);
        router.replace('/dashboard'); // Or a dedicated 'unauthorized' page
      }
    } else if (pathname !== '/') { // if no session and not on login page, redirect (this logic might need adjustment based on public pages)
        // This case should ideally be handled by a middleware or a higher-level auth check
        // router.replace('/');
    }
    setIsAccessChecked(true);

  }, [pathname, router, checkPagePermission]);


  const canView = useCallback((item: NavItem): boolean => {
    if (!item.requiredPermission) {
      return true;
    }
    return userPermissions.includes(item.requiredPermission);
  }, [userPermissions]);

  const renderNavItems = useCallback((items: NavItem[], isSubMenu = false, parentHref?: string) => {
    return items
      .filter(canView)
      .map((item) => {
      if (item.children && item.children.length > 0) {
        const visibleChildren = item.children.filter(canView);
        
        if (visibleChildren.length === 0 && !item.requiredPermission) return null;
        if (visibleChildren.length === 0 && item.requiredPermission && !canView(item)) return null;


        const isChildActive = visibleChildren.some(child => {
          if (parentHref === '/kitchen-display' && child.slug) {
            return activeKitchenSlugForNav === child.slug && pathname === '/kitchen-display';
          }
          return pathname.startsWith(child.href);
        });
        
        let isActiveGroup = 
          (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) || 
          isChildActive;

        // Special handling for kitchen display parent
        if (item.href === '/kitchen-display' && pathname !== '/kitchen-display') {
            isActiveGroup = false; // Don't highlight parent if not on /kitchen-display itself
        } else if (item.href === '/kitchen-display' && pathname === '/kitchen-display') {
             isActiveGroup = isChildActive || (activeKitchenSlugForNav && item.children?.some(c => c.slug === activeKitchenSlugForNav));
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
              <SidebarMenu>{renderNavItems(visibleChildren, true, item.href)}</SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        );
      }

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
                  if (pathname !== '/kitchen-display') {
                    router.push('/kitchen-display');
                  } else {
                    // Force a re-render or state update if already on the page
                    // This might involve a more direct way to trigger data refresh in KitchenDisplayPage
                    // For now, router.push should still cause necessary effects to run if pathname changes (even to itself with different internal state)
                    // Or, we might need a global state/event for this.
                    router.refresh(); // Or a more targeted state update if possible
                  }
                }
              }}
            >
              <a>
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
  }, [canView, pathname, activeKitchenSlugForNav, router]);


  if (!isSessionLoaded || !isAccessChecked) {
    return (
      <div className="flex min-h-screen">
        {/* Simplified Skeleton for SidebarProvider context */}
        <SidebarProvider defaultOpen>
            <Sidebar
            collapsible="icon"
            side="right"
            className="border-l border-r-0 border-sidebar-border shadow-sm"
            >
            <SidebarHeader className="p-4">
                <AppLogo />
            </SidebarHeader>
            {/* Add Skeleton loaders here if desired */}
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
      </div>
    );
  }

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
            {SETTINGS_NAV_ITEM.children && SETTINGS_NAV_ITEM.children.length > 0 && canView(SETTINGS_NAV_ITEM) ? (
              <Accordion type="single" collapsible className="w-full">
                 <AccordionItem
                    value={SETTINGS_NAV_ITEM.label}
                    key={SETTINGS_NAV_ITEM.label}
                    className="border-b-0"
                  >
                    <AccordionTrigger
                      className={cn(
                        "flex w-full items-center rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:no-underline",
                        (pathname.startsWith(SETTINGS_NAV_ITEM.href) || SETTINGS_NAV_ITEM.children?.some(child => pathname.startsWith(child.href) && canView(child))) &&
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
                      <SidebarMenu>{SETTINGS_NAV_ITEM.children && renderNavItems(SETTINGS_NAV_ITEM.children, true, SETTINGS_NAV_ITEM.href)}</SidebarMenu>
                    </AccordionContent>
                  </AccordionItem>
              </Accordion>
            ) : canView(SETTINGS_NAV_ITEM) ? (
               <SidebarMenuItem>
                  <NavLink
                    href={SETTINGS_NAV_ITEM.href}
                    icon={SETTINGS_NAV_ITEM.icon}
                    label={SETTINGS_NAV_ITEM.label}
                  />
              </SidebarMenuItem>
            ) : null}
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
