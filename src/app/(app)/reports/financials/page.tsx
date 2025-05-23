
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, Landmark, CalendarDays } from 'lucide-react';
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

export default function FinancialsReportPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [currentTreasuryBalance, setCurrentTreasuryBalance] = useState(5750.75); // Placeholder
  const [netCashFlow, setNetCashFlow] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function initDb() {
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB for financials report:", error);
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

    async function fetchFinancialData() {
        setIsLoading(true);
        const { startDate, endDate } = getPeriodDateRange(selectedPeriod);
        const startDateString = format(startDate, 'yyyy-MM-dd HH:mm:ss');
        const endDateString = format(endDate, 'yyyy-MM-dd HH:mm:ss');
        const startDateSqlDate = format(startDate, 'yyyy-MM-dd');
        const endDateSqlDate = format(endDate, 'yyyy-MM-dd');
      try {
        // Fetch revenue for the period
        const revenueResult: any[] = await db.select(
          "SELECT SUM(total_amount) as totalRevenue FROM orders WHERE status = 'مكتمل' AND created_at BETWEEN ? AND ?",
          [startDateString, endDateString]
        );
        const revenueForPeriod = Number(revenueResult[0]?.totalRevenue) || 0;
        setTotalRevenue(revenueForPeriod);

        // Fetch salaries (current snapshot)
        const salariesResult: any[] = await db.select("SELECT SUM(salary) as totalSalaries FROM employees WHERE is_active = TRUE");
        const salaries = Number(salariesResult[0]?.totalSalaries) || 0;

        // Fetch purchase orders amount for the period
        const purchaseOrdersResult: any[] = await db.select(
          "SELECT SUM(total_amount) as totalPurchase FROM purchase_orders WHERE order_date BETWEEN ? AND ?",
          [startDateSqlDate, endDateSqlDate]
        );
        const poAmountForPeriod = Number(purchaseOrdersResult[0]?.totalPurchase) || 0;
        
        const expensesForPeriod = salaries + poAmountForPeriod;
        setTotalExpenses(expensesForPeriod);
        
        setNetCashFlow(revenueForPeriod - expensesForPeriod);

      } catch (error) {
        console.error("Error fetching financial data:", error);
        toast({ title: "خطأ", description: "فشل في جلب البيانات المالية.", variant: "destructive" });
        setTotalRevenue(0); setTotalExpenses(0); setNetCashFlow(0);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFinancialData();
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
        <PageHeader title="التقرير المالي" description="جارٍ تحميل بيانات التقرير..." icon={Landmark}/>
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="التقرير المالي" 
        description={`نظرة عامة على الوضع المالي لـ ${getPeriodLabel()}.`}
        icon={Landmark}
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
            <CardTitle className="text-xl">الوضع المالي ({getPeriodLabel()})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">رصيد الخزنة الحالي</CardTitle>
                <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${currentTreasuryBalance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">تقديري بناءً على آخر البيانات</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صافي التدفق النقدي</CardTitle>
                {netCashFlow >= 0 ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${netCashFlow >=0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netCashFlow.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">الإيرادات - المصروفات (في الفترة)</p>
            </CardContent>
            </Card>
             <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">مقابل إجمالي المصروفات</p>
                     <div className="text-xl font-bold text-destructive">${totalExpenses.toFixed(2)}</div>
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </>
  );
}

    