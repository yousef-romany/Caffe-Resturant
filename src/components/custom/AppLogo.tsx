import Link from 'next/link';
import { Coffee } from 'lucide-react';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-primary group-data-[collapsible=icon]:justify-center">
      <Coffee className="h-6 w-6 stroke-[2.5px]" />
      <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">كافيه بوس إكسبريس</span>
    </Link>
  );
}
