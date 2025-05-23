
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually';

const getPeriodDateRange = (period: ReportPeriod): { startDate: Date; endDate: Date } => {
  const now = new Date();
  switch (period) {
    case 'daily':
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case 'weekly':
      return { startDate: startOfWeek(now, { locale: arSA }), endDate: endOfWeek(now, { locale: arSA }) };
    case 'monthly':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case 'quarterly':
      return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) };
    case 'semi_annually':
      return { startDate: startOfMonth(subMonths(now, 5)), endDate: endOfMonth(now) };
    case 'annually':
      return { startDate: startOfYear(now), endDate: endOfYear(now) };
    default:
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  }
};

interface TopSellingItemData {
  id: string; // Assuming menu_item_id
  name: string;
  sales: number;
  quantity: number;
}

export default function TopSellingReportPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const [topItems, setTopItems] = useState<TopSellingItemData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function initDb() {
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB for top selling report:", error);
        toast({ title: "خطأ في الاتصال", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
      }
    }
    initDb();
  }, [toast]);

  useEffect(() => {
    if (!isClient || !db) {
      setIsLoading(db === null);
      return;
    }

    async function fetchTopSellingItems() {
      setIsLoading(true);
      const { startDate, endDate } = getPeriodDateRange(selectedPeriod);
      const startDateString = format(startDate, 'yyyy-MM-dd HH:mm:ss');
      const endDateString = format(endDate, 'yyyy-MM-dd HH:mm:ss');
      
      try {
        const topItemsResult: any[] = await db.select(
          `SELECT mi.id, mi.name, SUM(oi.price_at_order * oi.quantity) as sales, SUM(oi.quantity) as quantity
           FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE o.status = 'مكتمل' AND o.created_at BETWEEN ? AND ?
           GROUP BY mi.id, mi.name
           ORDER BY sales DESC
           LIMIT 10`,
          [startDateString, endDateString]
        );
        setTopItems(topItemsResult.map(item => ({
          id: item.id,
          name: item.name,
          sales: Number(item.sales) || 0,
          quantity: Number(item.quantity) || 0,
        })));
      } catch (error) {
        console.error("Error fetching top selling items:", error);
        toast({ title: "خطأ", description: "فشل في جلب بيانات العناصر الأكثر مبيعًا.", variant: "destructive" });
        setTopItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTopSellingItems();
  }, [selectedPeriod, isClient, db, toast]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as ReportPeriod);
  };

  const getPeriodLabel = () => {
    switch(selectedPeriod) {
        case 'daily': return 'اليوم الحالي';
        case 'weekly': return 'الأسبوع الحالي';
        case 'monthly': return 'الشهر الحالي';
        case 'quarterly': return 'الربع الحالي';
        case 'semi_annually': return 'آخر 6 أشهر';
        case 'annually': return 'السنة الحالية';
        default: return 'الفترة المختارة';
    }
  };

  if (!isClient || isLoading) {
    return (
      <>
        <PageHeader title="تقرير العناصر الأكثر مبيعًا" description="جارٍ تحميل بيانات التقرير..." icon={Flame}/>
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
      </>
    );
  }
  
  return (
    <>
      <PageHeader 
        title="تقرير العناصر الأكثر مبيعًا" 
        description={`تحليل العناصر الأكثر شيوعًا حسب الإيرادات والكمية المباعة لـ ${getPeriodLabel()}.`} 
        icon={Flame}
        actions={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">يومي</SelectItem>
                <SelectItem value="weekly">أسبوعي</SelectItem>
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="quarterly">ربع سنوي</SelectItem>
                <SelectItem value="semi_annually">نصف سنوي (آخر 6 أشهر)</SelectItem>
                <SelectItem value="annually">سنوي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

       <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-primary"/>العناصر الأكثر مبيعًا ({getPeriodLabel()})
            </CardTitle>
            <CardDescription>أكثر 10 عناصر تحقيقًا للإيرادات في الفترة المحددة.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>العنصر</TableHead>
                    <TableHead className="text-center">الكمية المباعة</TableHead>
                    <TableHead className="text-left">إجمالي المبيعات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {topItems.length > 0 ? topItems.map((item, index) => (
                    <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-left font-semibold">${Number(item.sales).toFixed(2)}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">لا توجد بيانات مبيعات لهذه الفترة.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    </>
  );
}

    