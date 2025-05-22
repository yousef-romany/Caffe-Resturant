
import type { ReactNode } from 'react';

interface KitchenLayoutProps {
  children: ReactNode;
}

// This layout can be used for common elements across all /kitchen/[categorySlug] pages if needed in the future.
// For now, it's a simple pass-through.
export default function KitchenLayout({ children }: KitchenLayoutProps) {
  return <>{children}</>;
}
