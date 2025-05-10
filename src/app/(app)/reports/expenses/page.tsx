
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DUMMY_EMPLOYEES, DUMMY_PURCHASE_ORDERS } from '@/constants';
import { Users, Package, TrendingDown, CalendarDays } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'custom';

export default function ExpensesReportPage() {
  const [totalSalariesPaid, setTotalSalariesPaid] = useState(0);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const salaries = DUMMY_EMPLOYEES.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    setTotalSalariesPaid(salaries); // Assuming monthly salaries for this placeholder
    const poAmount = DUMMY_PURCHASE_ORDERS.reduce((sum, po) => sum + po.totalAmount, 0);
    setTotalPurchaseAmount(poAmount);
    setTotalExpenses(salaries + poAmount);
  }, [selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as ReportPeriod);
  };
  
  if (!isClient) {
    return (
      <>
        <PageHeader title="تقرير المصروفات" description="تحليل المصروفات المختلفة." icon={TrendingDown}/>
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل التقرير...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="تقرير المصروفات" 
        description="تحليل المصروفات المختلفة كالرواتب والمشتريات." 
        icon={TrendingDown}
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
            <CardTitle className="text-xl">ملخص المصروفات ({selectedPeriod === 'monthly' ? 'الشهر الحالي' : 'الفترة المختارة'})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الرواتب</CardTitle>
                <Users className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalSalariesPaid.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">إجمالي الرواتب المدفوعة</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تكلفة المشتريات</CardTitle>
                <Package className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalPurchaseAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">إجمالي تكلفة أوامر الشراء</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">الرواتب + المشتريات</p>
            </CardContent>
            </Card>
        </CardContent>
      </Card>
      {/* Further detailed expense breakdown charts/tables can be added here */}
    </>
  );
}
