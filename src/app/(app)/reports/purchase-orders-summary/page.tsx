
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_PURCHASE_ORDERS, type PurchaseOrder } from '@/constants';
import { ListChecks, ClipboardList, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'custom';

export default function PurchaseOrdersSummaryReportPage() {
  const [totalPurchaseOrdersCount, setTotalPurchaseOrdersCount] = useState(0);
  const [recentPurchaseOrders, setRecentPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTotalPurchaseOrdersCount(DUMMY_PURCHASE_ORDERS.length);
    setRecentPurchaseOrders(DUMMY_PURCHASE_ORDERS.slice(0, 10).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())); // Show more recent ones
    const poAmount = DUMMY_PURCHASE_ORDERS.reduce((sum, po) => sum + po.totalAmount, 0);
    setTotalPurchaseAmount(poAmount);
  }, [selectedPeriod]);

  const getPurchaseStatusBadgeVariant = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'مستلم': return 'default';
      case 'مؤكد': return 'secondary';
      case 'معلق': return 'outline';
      case 'ملغى': return 'destructive';
      default: return 'outline';
    }
  };

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as ReportPeriod);
  };

  if (!isClient) {
    return (
      <>
        <PageHeader title="ملخص أوامر الشراء" description="نظرة عامة على أوامر الشراء للموردين." icon={ListChecks}/>
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل التقرير...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="ملخص أوامر الشراء" 
        description="نظرة عامة على أوامر الشراء للموردين وتكاليفها." 
        icon={ListChecks}
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
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary"/>إحصائيات أوامر الشراء</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
            <div>
                <p className="text-sm text-muted-foreground">إجمالي أوامر الشراء</p>
                <p className="text-2xl font-bold">{totalPurchaseOrdersCount}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">التكلفة الإجمالية للمشتريات</p>
                <p className="text-2xl font-bold">${totalPurchaseAmount.toFixed(2)}</p>
            </div>
        </CardContent>
      </Card>
        
      <Card className="mb-8 shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary"/>أحدث أوامر الشراء</CardTitle>
            <CardDescription>عرض آخر 10 أوامر شراء تم إنشاؤها.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            {recentPurchaseOrders.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>رقم الطلب</TableHead>
                            <TableHead>المورد</TableHead>
                            <TableHead>تاريخ الطلب</TableHead>
                            <TableHead className="text-center">الحالة</TableHead>
                            <TableHead className="text-left">الإجمالي</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentPurchaseOrders.map(po => (
                            <TableRow key={po.id}>
                                <TableCell className="font-medium">{po.orderNumber}</TableCell>
                                <TableCell>{po.supplierName}</TableCell>
                                <TableCell>{format(new Date(po.orderDate), 'PP', { locale: arSA })}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={getPurchaseStatusBadgeVariant(po.status)}>{po.status}</Badge>
                                </TableCell>
                                <TableCell className="text-left font-semibold">${po.totalAmount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="p-4 text-center text-muted-foreground">لا توجد أوامر شراء مسجلة بعد.</p>
            )}
        </CardContent>
      </Card>
      {/* Consider adding charts for purchase trends by supplier or by month */}
    </>
  );
}
