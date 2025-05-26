
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type PurchaseOrder } from '@/constants';
import { ListChecks, ClipboardList, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, isValid, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function PurchaseOrdersSummaryReportPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [totalPurchaseOrdersCount, setTotalPurchaseOrdersCount] = useState(0);
  const [displayedPurchaseOrders, setDisplayedPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function initDb() {
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB for PO summary report:", error);
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

    async function fetchPurchaseOrdersData() {
        setIsLoading(true);
        const { startDate, endDate } = getPeriodDateRange(selectedPeriod);
        const startDateSqlDate = format(startDate, 'yyyy-MM-dd');
        const endDateSqlDate = format(endDate, 'yyyy-MM-dd');

        try {
            const poStatsResult: any[] = await db.select(
                "SELECT COUNT(*) as count, SUM(total_amount) as totalAmount FROM purchase_orders WHERE order_date BETWEEN ? AND ?",
                [startDateSqlDate, endDateSqlDate]
            );
            setTotalPurchaseOrdersCount(Number(poStatsResult[0]?.count) || 0);
            setTotalPurchaseAmount(Number(poStatsResult[0]?.totalAmount) || 0);

            const recentPOsResult: any[] = await db.select(
                "SELECT id, order_number as orderNumber, supplier_name as supplierName, total_amount as totalAmount, status, order_date as orderDate FROM purchase_orders WHERE order_date BETWEEN ? AND ? ORDER BY order_date DESC LIMIT 10",
                [startDateSqlDate, endDateSqlDate]
            );
            setDisplayedPurchaseOrders(recentPOsResult.map(po => ({
                ...po,
                orderDate: parseISO(po.orderDate), 
                totalAmount: Number(po.totalAmount),
                items: [], 
            })));

        } catch (error) {
            console.error("Error fetching PO summary data:", error);
            toast({ title: "خطأ", description: "فشل في جلب بيانات ملخص أوامر الشراء.", variant: "destructive" });
            setTotalPurchaseOrdersCount(0); setTotalPurchaseAmount(0); setDisplayedPurchaseOrders([]);
        } finally {
            setIsLoading(false);
        }
    }
    fetchPurchaseOrdersData();
  }, [selectedPeriod, isClient, db, toast]);

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

  if (!isClient || isLoading) {
    return (
      <>
        <PageHeader title="ملخص أوامر الشراء" description="جارٍ تحميل بيانات التقرير..." icon={ListChecks}/>
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
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
                                <TableCell className="text-left font-semibold">${Number(po.totalAmount).toFixed(2)}</TableCell>
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

    