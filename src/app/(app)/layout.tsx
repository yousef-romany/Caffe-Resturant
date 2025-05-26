
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
    let matchedItem: NavItem | null = null;

    const findItemRecursive = (items: NavItem[], path: string): NavItem | null => {
      for (const item of items) {
        if (item.href === path || (item.href !== "/" && path.startsWith(item.href) && item.children && item.children.length > 0)) {
          // If it's a direct match or a prefix match for a parent with children
          if (item.children && item.children.length > 0) {
            // If it's a parent, check if any child matches more specifically
            const deeperMatch = findItemRecursive(item.children, path);
            if (deeperMatch) return deeperMatch; // Prefer deeper match
          }
          return item; // Return current item if no deeper match or no children
        }
      }
      return null;
    };
    
    matchedItem = findItemRecursive(NAV_ITEMS, currentPath);
    if (!matchedItem && SETTINGS_NAV_ITEM) {
        if (SETTINGS_NAV_ITEM.href === currentPath || (SETTINGS_NAV_ITEM.href !== "/" && currentPath.startsWith(SETTINGS_NAV_ITEM.href) && SETTINGS_NAV_ITEM.children && SETTINGS_NAV_ITEM.children.length > 0)) {
            if (SETTINGS_NAV_ITEM.children && SETTINGS_NAV_ITEM.children.length > 0) {
                const settingsChildMatch = findItemRecursive(SETTINGS_NAV_ITEM.children, currentPath);
                if (settingsChildMatch) matchedItem = settingsChildMatch;
                else matchedItem = SETTINGS_NAV_ITEM;
            } else {
                 matchedItem = SETTINGS_NAV_ITEM;
            }
        }
    }
    
    requiredPermission = matchedItem?.requiredPermission;

    if (requiredPermission === undefined) {
      // If no specific permission is set for the matched item (or no item matched but it's a known path like dashboard), allow access for logged-in users.
      // The dashboard (href: '/dashboard') has its requiredPermission removed, so it will fall here.
      return true; 
    }
    return permissions.includes(requiredPermission);
  }, []);


  useEffect(() => {
    const sessionString = localStorage.getItem('userSession');
    let currentPermissions: string[] = [];
    let sessionData: UserSession | null = null;

    if (sessionString) {
      try {
        sessionData = JSON.parse(sessionString);
        currentPermissions = sessionData?.permissionNames || [];
        setUserPermissions(currentPermissions);
      } catch (e) {
        console.error("Failed to parse user session from localStorage", e);
        setUserPermissions([]);
      }
    }
    setIsSessionLoaded(true); // Session loading attempt is complete

    // If no session, redirect to login, unless already on login page
    if (!sessionData && pathname !== '/') {
      router.replace('/');
      return; 
    }
    
    // If session exists, then check page permission
    if (sessionData) {
        if (!checkPagePermission(pathname, currentPermissions)) {
          console.warn(`Access denied to ${pathname} for user with permissions: [${currentPermissions.join(', ')}]. Redirecting to dashboard.`);
          router.replace('/dashboard'); 
        }
    }
    setIsAccessChecked(true); // Access check is complete


    // Handle kitchen slug for sidebar navigation highlighting
    const storedSlug = localStorage.getItem('selectedKitchenCategorySlug') as CategorySlug | null;
    if (pathname === '/kitchen-display' && storedSlug) {
      setActiveKitchenSlugForNav(storedSlug);
    } else if (pathname.startsWith('/kitchen-display') && !storedSlug) {
      // If on kitchen-display but no slug in local storage, try to infer from constants if needed, or set to default
      // This part might need more specific logic if direct navigation to /kitchen-display (no slug) is possible and should pick a default
    }
    else if (pathname !== '/kitchen-display') {
      setActiveKitchenSlugForNav(null);
    }
    
    const handleStorageChange = () => {
        const updatedSlug = localStorage.getItem('selectedKitchenCategorySlug') as CategorySlug | null;
        if (pathname === '/kitchen-display' && updatedSlug !== activeKitchenSlugForNav) {
            setActiveKitchenSlugForNav(updatedSlug);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [pathname, router, checkPagePermission, activeKitchenSlugForNav]);


  const canView = useCallback((item: NavItem): boolean => {
    if (!item.requiredPermission) {
      return true; // Items without a requiredPermission are visible to all logged-in users
    }
    return userPermissions.includes(item.requiredPermission);
  }, [userPermissions]);

  const renderNavItems = useCallback((items: NavItem[], isSubMenu = false, parentHref?: string) => {
    return items
      .filter(canView) 
      .map((item) => {
        const visibleChildren = item.children?.filter(canView) || [];
        
        if (item.children && item.children.length > 0) {
          if (visibleChildren.length === 0 && !item.requiredPermission && !isSubMenu) return null; 
          if (visibleChildren.length === 0 && item.requiredPermission && !canView(item)) return null; 

          let isChildActive = visibleChildren.some(child => {
            if (parentHref === '/kitchen-display' && child.slug) {
              return activeKitchenSlugForNav === child.slug && pathname === '/kitchen-display';
            }
            return child.href !== "/" && pathname.startsWith(child.href);
          });
          
          let isActiveGroup = 
            (item.href === "/" && pathname === "/") || (item.href !== "/" && pathname.startsWith(item.href)) || 
            isChildActive;

          // Special handling for kitchen-display parent
          if (item.href === '/kitchen-display') {
             isActiveGroup = pathname.startsWith('/kitchen-display') && (isChildActive || (activeKitchenSlugForNav && item.children?.some(c => c.slug === activeKitchenSlugForNav)));
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

        // Handling for kitchen category items
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
                    setActiveKitchenSlugForNav(currentItemSlug); // Update state for immediate UI feedback
                    if (pathname !== '/kitchen-display') {
                      router.push('/kitchen-display');
                    } else {
                       // Force re-render if already on the page.
                       // Dispatching a storage event can sometimes work if the page listens to it.
                       window.dispatchEvent(new Event('storage')); 
                       router.refresh(); // A more direct way to ask Next.js to refresh data
                    }
                  }
                }}
              >
                <a> {/* Anchor tag is required when asChild is true for routing */}
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        }

        // Regular NavLink for other items
        return (
          <SidebarMenuItem key={item.href} dir="rtl">
            <NavLink href={item.href} icon={item.icon} label={item.label} />
          </SidebarMenuItem>
        );
    });
  }, [canView, pathname, activeKitchenSlugForNav, router]); // Added router to dependencies for kitchen slug navigation


  if (!isSessionLoaded || !isAccessChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>جارٍ تحميل الجلسة والتحقق من الصلاحيات...</p>
      </div>
    );
  }
  
  // This check should ideally be handled by the useEffect redirecting,
  // but as a fallback, if somehow rendering happens before redirect.
  if (!localStorage.getItem('userSession') && pathname !== '/') {
     // This might cause a flash if redirection from useEffect is slightly delayed.
     // The useEffect should be the primary gatekeeper.
     return <div className="flex min-h-screen items-center justify-center"><p>إعادة توجيه لتسجيل الدخول...</p></div>;
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
