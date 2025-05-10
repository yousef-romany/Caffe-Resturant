import type { ReactNode } from 'react';
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
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/custom/AppLogo';
import { NavLink } from '@/components/custom/NavLink';
import { UserNav } from '@/components/custom/UserNav';
import { ThemeToggle } from '@/components/custom/ThemeToggle';
import { NAV_ITEMS, SETTINGS_NAV_ITEM } from '@/constants';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-sm">
        <SidebarHeader className="p-4">
          <AppLogo />
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavLink href={item.href} icon={item.icon} label={item.label} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </ScrollArea>
        <SidebarSeparator />
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <NavLink href={SETTINGS_NAV_ITEM.href} icon={SETTINGS_NAV_ITEM.icon} label={SETTINGS_NAV_ITEM.label} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 shadow-sm backdrop-blur-md md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <SidebarTrigger />
             {/* Optionally, show a condensed logo on mobile header if needed */}
             {/* <AppLogo />  */}
          </div>
          <div className="flex flex-1 items-center justify-end gap-4">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
