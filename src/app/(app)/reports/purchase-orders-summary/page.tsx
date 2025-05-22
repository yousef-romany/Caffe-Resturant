
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_PURCHASE_ORDERS, type PurchaseOrder } from '@/constants';
import { ListChecks, ClipboardList, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function PurchaseOrdersSummaryReportPage() {
  const [totalPurchaseOrdersCount, setTotalPurchaseOrdersCount] = useState(0);
  const [displayedPurchaseOrders, setDisplayedPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const { startDate, endDate } = getPeriodDateRange(selectedPeriod);

    const filteredPurchaseOrders = DUMMY_PURCHASE_ORDERS.filter(po => {
        const orderDate = new Date(po.orderDate);
        return isValid(orderDate) && orderDate >= startDate && orderDate <= endDate;
    });
    
    setTotalPurchaseOrdersCount(filteredPurchaseOrders.length);
    setDisplayedPurchaseOrders(filteredPurchaseOrders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 10));
    const poAmountForPeriod = filteredPurchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    setTotalPurchaseAmount(poAmountForPeriod);

  }, [selectedPeriod, isClient]);

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
        <PageHeader title="ملخص أوامر الشراء" description="نظرة عامة على أوامر الشراء للموردين." icon={ListChecks}/>
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل التقرير...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="ملخص أوامر الشراء" 
        description={`نظرة عامة على أوامر الشراء للموردين وتكاليفها لـ ${getPeriodLabel()}.`} 
        icon={ListChecks}
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
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary"/>إحصائيات أوامر الشراء ({getPeriodLabel()})</CardTitle>
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
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary"/>أوامر الشراء في الفترة</CardTitle>
            <CardDescription>عرض أوامر الشراء التي تم إنشاؤها ضمن {getPeriodLabel()} (حتى 10 أوامر).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            {displayedPurchaseOrders.length > 0 ? (
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
                        {displayedPurchaseOrders.map(po => (
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
                <p className="p-4 text-center text-muted-foreground">لا توجد أوامر شراء مسجلة لهذه الفترة.</p>
            )}
        </CardContent>
      </Card>
    </>
  );
}

    