
"use client";

import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart3, TrendingUp, TrendingDown, Landmark, Archive, ListChecks, Flame, FileText } from 'lucide-react';
import type { NavItem } from '@/constants';
import { NAV_ITEMS } from '@/constants';

export default function ReportsPage() {

  const reportSubItems = NAV_ITEMS.find(item => item.href === '/reports')?.children?.filter(child => child.href !== '/reports') || [];

  return (
    <>
      <PageHeader 
        title="مركز التقارير" 
        description="اختر تقريرًا لعرض تحليلات مفصلة لأداء مشروعك." 
        icon={BarChart3}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportSubItems.map((reportItem) => (
          <Card key={reportItem.href} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                {reportItem.icon && <reportItem.icon className="h-8 w-8 text-primary" />}
                <CardTitle className="text-xl">{reportItem.label}</CardTitle>
              </div>
              <CardDescription>عرض تقرير {reportItem.label} المفصل.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href={reportItem.href}>
                  عرض تقرير {reportItem.label}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 lg:col-span-3 opacity-70">
            <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <CardTitle className="text-xl">التقرير الشامل (النسخة القديمة)</CardTitle>
                </div>
                <CardDescription>عرض النسخة القديمة من التقرير الشامل الذي يحتوي على كل البيانات في صفحة واحدة (لأغراض المقارنة).</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full bg-primary/80 hover:bg-primary/70 text-primary-foreground">
                    <Link href="/reports/all-in-one-legacy">
                        عرض التقرير الشامل القديم
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
