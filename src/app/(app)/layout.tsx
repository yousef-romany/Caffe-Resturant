
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
import { useEffect, useState } from "react"; // Import useEffect and useState

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

  useEffect(() => {
    // Load user session and permissions from localStorage
    const sessionString = localStorage.getItem('userSession');
    if (sessionString) {
      try {
        const sessionData: UserSession = JSON.parse(sessionString);
        setUserPermissions(sessionData.permissionNames || []);
      } catch (e) {
        console.error("Failed to parse user session from localStorage", e);
        setUserPermissions([]); // Default to no permissions on error
      }
    }
    setIsSessionLoaded(true);

    // Update active kitchen slug based on localStorage
    const storedSlug = localStorage.getItem('selectedKitchenCategorySlug') as CategorySlug | null;
    if (pathname === '/kitchen-display' && storedSlug) {
      setActiveKitchenSlugForNav(storedSlug);
    } else if (pathname !== '/kitchen-display') {
      setActiveKitchenSlugForNav(null);
    }
  }, [pathname]);


  const canView = (item: NavItem): boolean => {
    if (!item.requiredPermission) {
      return true; // Item is public or visible by default if no permission specified
    }
    return userPermissions.includes(item.requiredPermission);
  };

  const renderNavItems = (items: NavItem[], isSubMenu = false, parentHref?: string) => {
    return items
      .filter(canView) // Filter items based on permissions
      .map((item) => {
      if (item.children && item.children.length > 0) {
        const visibleChildren = item.children.filter(canView);
        if (visibleChildren.length === 0 && item.requiredPermission && !canView(item)) {
            // If the parent itself has a permission and user doesn't have it,
            // and no children are visible, don't render the accordion.
            // This might still render if parent has no perm but all children are filtered out.
            return null;
        }
        if (visibleChildren.length === 0 && !item.requiredPermission) {
            // If the parent has no specific permission, but all its children are filtered out,
            // do not render the parent accordion either.
            return null;
        }


        const isChildActive = visibleChildren.some(child => {
          if (item.href === '/kitchen-display' && child.slug) {
            return activeKitchenSlugForNav === child.slug && pathname === '/kitchen-display';
          }
          return pathname.startsWith(child.href);
        });
        
        let isActiveGroup = 
          (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) || 
          isChildActive;

        if (item.href === '/kitchen-display' && pathname !== '/kitchen-display') {
            isActiveGroup = false;
        } else if (item.href === '/kitchen-display' && pathname === '/kitchen-display') {
            isActiveGroup = true;
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

      // Handle kitchen sub-items specifically for navigation state, not permission filtering here
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
                  router.push('/kitchen-display'); // This will trigger re-render of kitchen-display page
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
  };

  if (!isSessionLoaded) {
    // Optionally, render a loading skeleton or null for the sidebar while session is loading
    return (
      <div className="flex min-h-screen">
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
