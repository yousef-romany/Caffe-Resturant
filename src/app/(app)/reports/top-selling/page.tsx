
"use client";

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_ORDERS, DUMMY_MENU_ITEMS, type Order, type OrderItem } from '@/constants';
import { Flame, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'custom';

export default function TopSellingReportPage() {
  const [topItems, setTopItems] = useState<{ name: string; sales: number; quantity: number }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const completedOrders = DUMMY_ORDERS.filter(o => o.status === 'مكتمل');
    const itemSalesCount: { [key: string]: { name: string; sales: number; quantity: number } } = {};
    completedOrders.forEach(order => {
        order.items.forEach(orderItem => {
            const menuItem = DUMMY_MENU_ITEMS.find(mi => mi.id === orderItem.id);
            if (!menuItem) return;

            if (!itemSalesCount[orderItem.id]) {
                itemSalesCount[orderItem.id] = { name: menuItem.name, sales: 0, quantity: 0 };
            }
            itemSalesCount[orderItem.id].sales += menuItem.price * orderItem.quantity;
            itemSalesCount[orderItem.id].quantity += orderItem.quantity;
        });
    });
    const sortedTopItems = Object.values(itemSalesCount)
        .sort((a,b) => b.sales - a.sales) // Sort by sales amount
        .slice(0,10); // Show top 10
    setTopItems(sortedTopItems);

  }, [selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as ReportPeriod);
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
        description="تحليل العناصر الأكثر شيوعًا حسب الإيرادات والكمية المباعة." 
        icon={Flame}
        actions={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">يومي (هذا اليوم)</SelectItem>
                <SelectItem value="weekly">أسبوعي (هذا الأسبوع)</SelectItem>
                <SelectItem value="monthly">شهري (هذا الشهر)</SelectItem>
                <SelectItem value="quarterly">ربع سنوي (هذا الربع)</SelectItem>
                <SelectItem value="semi_annually">نصف سنوي</SelectItem>
                <SelectItem value="annually">سنوي</SelectItem>
                <SelectItem value="custom" disabled>فترة مخصصة (قريباً)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

       <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-primary"/>العناصر الأكثر مبيعًا ({selectedPeriod === 'monthly' ? 'الشهر الحالي' : 'الفترة المختارة'})
            </CardTitle>
            <CardDescription>أكثر 10 عناصر تحقيقًا للإيرادات.</CardDescription>
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
                    <TableRow key={item.name}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-left font-semibold">${item.sales.toFixed(2)}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">لا توجد بيانات لعرضها.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        {/* Consider adding charts for sales distribution among top items */}
    </>
  );
}
