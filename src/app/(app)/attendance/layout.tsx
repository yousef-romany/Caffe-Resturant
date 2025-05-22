
import type { ReactNode } from 'react';

interface AttendanceLayoutProps {
  children: ReactNode;
}

export default function AttendanceLayout({ children }: AttendanceLayoutProps) {
  return <div className="space-y-6">{children}</div>;
}
