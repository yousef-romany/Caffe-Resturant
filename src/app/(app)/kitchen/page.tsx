
"use client";
// This page is no longer used directly as navigation goes to /kitchen/[categorySlug]
// It can be removed or repurposed as a general kitchen overview if needed.
// For now, we'll redirect to the first kitchen category page.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_SLUG_MAP } from '@/constants';

export default function KitchenRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const firstCategorySlug = Object.values(CATEGORY_SLUG_MAP)[0]?.slug;
    if (firstCategorySlug) {
      router.replace(`/kitchen/${firstCategorySlug}`);
    } else {
      // Fallback if no categories are defined, though this shouldn't happen
      router.replace('/dashboard'); 
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground text-lg">جارٍ التحويل إلى شاشة المطبخ...</p>
    </div>
  );
}
