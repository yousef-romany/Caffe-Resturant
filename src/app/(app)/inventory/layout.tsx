
import type { ReactNode } from 'react';

interface InventoryLayoutProps {
  children: ReactNode;
}

export default function InventoryLayout({ children }: InventoryLayoutProps) {
  return <div className="space-y-6">{children}</div>;
}
