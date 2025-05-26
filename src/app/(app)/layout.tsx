
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
  // Removed useSidebar from here as AppLayout provides it.
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


  const checkPagePermission = useCallback((currentPath: string, permissions: string[]): boolean => {
    let requiredPermission: string | undefined = undefined;

    const findPermissionRecursive = (items: NavItem[], path: string): boolean => {
      for (const item of items) {
        // Check if the current item's href matches the path directly
        if (item.href === path) {
          requiredPermission = item.requiredPermission;
          return true; // Found a direct match
        }
        // If the item is an accordion (has children) and its href is a prefix of the path,
        // check its children. This handles cases where a section like /inventory has sub-pages.
        if (item.children && path.startsWith(item.href)) {
          if (findPermissionRecursive(item.children, path)) {
            // If a child matched, the requiredPermission is already set by the child.
            // If no child matched, but the parent itself has a permission, use that.
             if (requiredPermission === undefined && item.requiredPermission) {
                requiredPermission = item.requiredPermission;
             }
            return true;
          }
        }
      }
      return false; // No match in this branch
    };
    
    // Check main navigation items
    if (findPermissionRecursive(NAV_ITEMS, currentPath)) {
      // requiredPermission is now set if a match was found
    } 
    // If not found in main nav, check settings nav item and its children
    else if (SETTINGS_NAV_ITEM.href === currentPath) {
        requiredPermission = SETTINGS_NAV_ITEM.requiredPermission;
    } else if (SETTINGS_NAV_ITEM.children && currentPath.startsWith(SETTINGS_NAV_ITEM.href)) {
        if (findPermissionRecursive(SETTINGS_NAV_ITEM.children, currentPath)) {
            // requiredPermission is set by child
        } else if (SETTINGS_NAV_ITEM.requiredPermission) {
            // No child matched, but parent has permission
            requiredPermission = SETTINGS_NAV_ITEM.requiredPermission;
        }
    }


    if (requiredPermission === undefined) {
      // If no specific permission is defined for the path after checking all NavItems,
      // and the path is not the general dashboard (which is now always allowed),
      // it might be an unknown path or a path that should be public within the app layout.
      // For safety, if not /dashboard, and no permission found, deny.
      // /dashboard is handled by not having a requiredPermission in NAV_ITEMS.
      return currentPath === '/dashboard'; // Only allow dashboard if no perm is found
    }
    return permissions.includes(requiredPermission);
  }, []);


  useEffect(() => {
    const sessionString = localStorage.getItem('userSession');
    let currentPermissions: string[] = [];
    if (sessionString) {
      try {
        const sessionData: UserSession = JSON.parse(sessionString);
        currentPermissions = sessionData.permissionNames || [];
        setUserPermissions(currentPermissions);
      } catch (e) {
        console.error("Failed to parse user session from localStorage", e);
        setUserPermissions([]);
      }
    } else {
      // No session, redirect to login unless it's the login page itself
      if (pathname !== '/') { // Assuming '/' is the login page
         router.replace('/');
         return; // Stop further processing if redirecting
      }
    }
    setIsSessionLoaded(true);

    const storedSlug = localStorage.getItem('selectedKitchenCategorySlug') as CategorySlug | null;
    if (pathname === '/kitchen-display' && storedSlug) {
      setActiveKitchenSlugForNav(storedSlug);
    } else if (pathname !== '/kitchen-display') {
      setActiveKitchenSlugForNav(null);
    }
    
    // Only check page permission if session is loaded
    if (sessionString) { // Check if user is logged in
      if (!checkPagePermission(pathname, currentPermissions)) {
        console.warn(`Access denied to ${pathname}. User may lack required permission.`);
        router.replace('/dashboard'); // Redirect to dashboard if access to current page is denied
      }
    }
    setIsAccessChecked(true);

  }, [pathname, router, checkPagePermission]);


  const canView = useCallback((item: NavItem): boolean => {
    if (!item.requiredPermission) {
      return true; // Item is public or accessible to all authenticated users
    }
    return userPermissions.includes(item.requiredPermission);
  }, [userPermissions]);

  const renderNavItems = useCallback((items: NavItem[], isSubMenu = false, parentHref?: string) => {
    return items
      .filter(canView) // Filter items based on permissions first
      .map((item) => {
        const visibleChildren = item.children?.filter(canView) || [];
        
        if (item.children && item.children.length > 0) {
          if (visibleChildren.length === 0 && !item.requiredPermission) return null; // Hide accordion if no visible children and parent has no specific perm
          if (visibleChildren.length === 0 && item.requiredPermission && !canView(item)) return null; // Hide if parent itself isn't viewable

          const isChildActive = visibleChildren.some(child => {
            if (parentHref === '/kitchen-display' && child.slug) {
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

        // Handle kitchen display direct children
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
                    // Only push if not already on /kitchen-display, or refresh to trigger useEffect in KitchenDisplayPage
                    if (pathname !== '/kitchen-display') {
                      router.push('/kitchen-display');
                    } else {
                      router.refresh(); // Or a more targeted state update to trigger data fetch
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

        // Standard NavLink for other items
        return (
          <SidebarMenuItem key={item.href} dir="rtl">
            <NavLink href={item.href} icon={item.icon} label={item.label} />
          </SidebarMenuItem>
        );
    });
  }, [canView, pathname, activeKitchenSlugForNav, router]);


  if (!isSessionLoaded || !isAccessChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>جارٍ تحميل الجلسة والتحقق من الصلاحيات...</p>
        {/* Or a more sophisticated skeleton loader */}
      </div>
    );
  }
  
  // If no user session, redirect to login page (already handled in useEffect, but as a fallback)
  if (!localStorage.getItem('userSession') && pathname !== '/') {
     // This should ideally not be reached if useEffect handles redirection correctly
     return <div className="flex min-h-screen items-center justify-center"><p>إعادة توجيه لتسجيل الدخول...</p></div>;
  }


  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        side="right" // Ensures sidebar is on the right for RTL
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
                        (pathname.startsWith(SETTINGS_NAV_ITEM.href) || SETTINGS_NAV_ITEM.children?.filter(canView).some(child => pathname.startsWith(child.href))) &&
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
                      <SidebarMenu>{SETTINGS_NAV_ITEM.children && renderNavItems(SETTINGS_NAV_ITEM.children.filter(canView), true, SETTINGS_NAV_ITEM.href)}</SidebarMenu>
                    </AccordionContent>
                  </AccordionItem>
              </Accordion>
            ) : canView(SETTINGS_NAV_ITEM) ? ( // If settings item itself is a direct link and viewable
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
```