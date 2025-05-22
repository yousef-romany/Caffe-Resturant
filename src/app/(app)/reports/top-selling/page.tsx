
"use client";

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_ORDERS, DUMMY_MENU_ITEMS, type Order, type OrderItem } from '@/constants';
import { Flame, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'custom';

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

export default function TopSellingReportPage() {
  const [topItems, setTopItems] = useState<{ name: string; sales: number; quantity: number }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const { startDate, endDate } = getPeriodDateRange(selectedPeriod);
    
    const completedOrdersForPeriod = DUMMY_ORDERS.filter(o => {
        const orderDate = new Date(o.createdAt);
        return isValid(orderDate) && orderDate >= startDate && orderDate <= endDate && o.status === 'مكتمل';
    });

    const itemSalesCount: { [key: string]: { name: string; sales: number; quantity: number } } = {};
    completedOrdersForPeriod.forEach(order => {
        order.items.forEach(orderItem => {
            // Find the menu item from DUMMY_MENU_ITEMS to ensure we use the current name,
            // though orderItem itself contains historical name/price.
            const menuItem = DUMMY_MENU_ITEMS.find(mi => mi.id === orderItem.id);
            if (!menuItem) return; // Should not happen with current dummy data setup

            if (!itemSalesCount[orderItem.id]) {
                itemSalesCount[orderItem.id] = { name: menuItem.name, sales: 0, quantity: 0 };
            }
            // Use orderItem.price as it's the price at the time of order
            itemSalesCount[orderItem.id].sales += orderItem.price * orderItem.quantity;
            itemSalesCount[orderItem.id].quantity += orderItem.quantity;
        });
    });
    const sortedTopItems = Object.values(itemSalesCount)
        .sort((a,b) => b.sales - a.sales) // Sort by sales amount
        .slice(0,10); // Show top 10
    setTopItems(sortedTopItems);

  }, [selectedPeriod, isClient]);

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

  if (!isClient) {
    return (
      <>
        <PageHeader title="تقرير العناصر الأكثر مبيعًا" description="عرض العناصر الأكثر شيوعًا." icon={Flame}/>
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل التقرير...</p>
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
                    <TableRow key={item.name + index}> {/* Added index to key for potential duplicate names if IDs differ */}
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-left font-semibold">${item.sales.toFixed(2)}</TableCell>
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

    