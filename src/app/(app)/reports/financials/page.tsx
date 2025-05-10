
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DUMMY_ORDERS, DUMMY_EMPLOYEES, DUMMY_PURCHASE_ORDERS } from '@/constants';
import { Wallet, TrendingUp, TrendingDown, Landmark, CalendarDays } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'custom';

export default function FinancialsReportPage() {
  const [currentTreasuryBalance, setCurrentTreasuryBalance] = useState(5750.75); // Placeholder
  const [netCashFlow, setNetCashFlow] = useState(0); // Placeholder
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const completedOrders = DUMMY_ORDERS.filter(o => o.status === 'مكتمل');
    const revenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    setTotalRevenue(revenue);

    const salaries = DUMMY_EMPLOYEES.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    const poAmount = DUMMY_PURCHASE_ORDERS.reduce((sum, po) => sum + po.totalAmount, 0);
    const expenses = salaries + poAmount;
    setTotalExpenses(expenses);
    
    setNetCashFlow(revenue - expenses);
  }, [selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as ReportPeriod);
  };

  if (!isClient) {
    return (
      <>
        <PageHeader title="التقرير المالي" description="نظرة عامة على الوضع المالي." icon={Landmark}/>
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل التقرير...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="التقرير المالي" 
        description="نظرة عامة على رصيد الخزنة، صافي التدفق النقدي، والإيرادات مقابل المصروفات." 
        icon={Landmark}
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
            <CardTitle className="text-xl">الوضع المالي ({selectedPeriod === 'monthly' ? 'الشهر الحالي' : 'الفترة المختارة'})</CardTitle>
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
                <p className="text-xs text-muted-foreground">الإيرادات - المصروفات (تقديري)</p>
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
      {/* More detailed financial charts (e.g., profit/loss statement breakdown) can be added here */}
    </>
  );
}
