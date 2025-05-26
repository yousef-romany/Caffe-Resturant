
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, CalendarDays } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, isValid, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import type { OrderType, Category } from '@/constants';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#50C878', '#84D9A0', '#A0E0B4', '#BCE8C8', '#D6F0DC', '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'];

interface MonthlySalesData {
  month: string;
  sales: number;
}

interface CategorySalesData {
  name: Category;
  value: number;
}

interface OrderTypeSalesData {
  name: OrderType;
  value: number;
}

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


export default function SalesReportPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [monthlySalesChartData, setMonthlySalesChartData] = useState<MonthlySalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);
  const [orderTypeSales, setOrderTypeSales] = useState<OrderTypeSalesData[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function initDb() {
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB for sales report:", error);
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

    async function fetchDataForPeriod() {
      setIsLoading(true);
      const { startDate, endDate } = getPeriodDateRange(selectedPeriod);
      const startDateString = format(startDate, 'yyyy-MM-dd HH:mm:ss');
      const endDateString = format(endDate, 'yyyy-MM-dd HH:mm:ss');

      try {
        const summaryResult: any[] = await db.select(
          "SELECT SUM(total_amount) as totalRevenue, COUNT(*) as totalOrders FROM orders WHERE status = 'مكتمل' AND created_at BETWEEN ? AND ?",
          [startDateString, endDateString]
        );
        const revenue = Number(summaryResult[0]?.totalRevenue) || 0;
        const ordersCount = Number(summaryResult[0]?.totalOrders) || 0;
        setTotalRevenue(revenue);
        setTotalOrders(ordersCount);
        setAverageOrderValue(ordersCount > 0 ? revenue / ordersCount : 0);

        const catSalesResult: any[] = await db.select(
          `SELECT mi.category, SUM(oi.price_at_order * oi.quantity) as value
           FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE o.status = 'مكتمل' AND o.created_at BETWEEN ? AND ?
           GROUP BY mi.category
           ORDER BY value DESC`,
          [startDateString, endDateString]
        );
        setCategorySales(catSalesResult.map(r => ({ name: r.category as Category, value: Number(r.value) })));
        
        const otSalesResult: any[] = await db.select(
          `SELECT type, SUM(total_amount) as value
           FROM orders
           WHERE status = 'مكتمل' AND created_at BETWEEN ? AND ?
           GROUP BY type
           ORDER BY value DESC`,
          [startDateString, endDateString]
        );
        setOrderTypeSales(otSalesResult.map(r => ({ name: r.type as OrderType, value: Number(r.value) })));

        const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        const currentMonthDate = new Date();
        const salesChartDataPromises: Promise<MonthlySalesData>[] = Array(6).fill(null).map(async (_, i) => {
            const targetMonthDate = subMonths(currentMonthDate, 5 - i);
            const monthStart = format(startOfMonth(targetMonthDate), 'yyyy-MM-dd HH:mm:ss');
            const monthEnd = format(endOfMonth(targetMonthDate), 'yyyy-MM-dd HH:mm:ss');
            const monthIndex = targetMonthDate.getMonth();
            const year = targetMonthDate.getFullYear();
            const monthName = `${monthsAr[monthIndex]} ${year}`;

            const monthSalesResult: any[] = await db.select(
                "SELECT SUM(total_amount) as sales FROM orders WHERE status = 'مكتمل' AND created_at BETWEEN ? AND ?",
                [monthStart, monthEnd]
            );
            return {
                month: monthName,
                sales: Number(monthSalesResult[0]?.sales) || 0, 
            };
        });
        setMonthlySalesChartData(await Promise.all(salesChartDataPromises));

      } catch (error) {
        console.error("Error fetching sales report data:", error);
        toast({ title: "خطأ", description: "فشل في جلب بيانات تقرير المبيعات.", variant: "destructive" });
        setTotalRevenue(0); setTotalOrders(0); setAverageOrderValue(0);
        setCategorySales([]); setOrderTypeSales([]); setMonthlySalesChartData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDataForPeriod();
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
        <PageHeader title="تقرير المبيعات" description="جارٍ تحميل بيانات التقرير..." icon={TrendingUp}/>
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="تقرير المبيعات" 
        description={`تحليل أداء المبيعات لـ ${getPeriodLabel()}.`} 
        icon={TrendingUp}
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
            <CardTitle className="text-xl">ملخص المبيعات ({getPeriodLabel()})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">لجميع الطلبات المكتملة في الفترة</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                <ShoppingBag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">الطلبات المكتملة في الفترة</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">متوسط كل طلب مكتمل في الفترة</p>
            </CardContent>
            </Card>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8">
        <Card className="shadow-lg col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات الشهرية (آخر 6 أشهر)</CardTitle>
            <CardDescription>أداء المبيعات خلال آخر 6 أشهر بغض النظر عن الفلتر.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] ps-0">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={monthlySalesChartData} layout="vertical" margin={{ right: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <YAxis type="category" dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80}/>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', direction: 'rtl' }}/>
                <Bar dataKey="sales" name="المبيعات" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>المبيعات حسب الفئة ({getPeriodLabel()})</CardTitle>
            <CardDescription>توزيع الإيرادات عبر فئات العناصر.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => `${name} (${(percent * 100).toFixed(0)}%) - $${value.toFixed(0)}`}
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="hsl(var(--border))"
                    >
                    {categorySales.map((entry, index) => (
                        <Cell key={`cell-cat-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', direction: 'rtl' }}/>
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-center text-muted-foreground pt-10">لا توجد بيانات مبيعات حسب الفئة لهذه الفترة.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>المبيعات حسب نوع الطلب ({getPeriodLabel()})</CardTitle>
            <CardDescription>توزيع الإيرادات عبر أنواع الطلبات.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
             {orderTypeSales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={orderTypeSales}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => `${name} (${(percent * 100).toFixed(0)}%) - $${value.toFixed(0)}`}
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="hsl(var(--border))"
                    >
                    {orderTypeSales.map((entry, index) => (
                        <Cell key={`cell-type-${index}`} fill={COLORS[(index + categorySales.length) % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', direction: 'rtl' }}/>
                </PieChart>
                </ResponsiveContainer>
             ) : (
                <p className="text-center text-muted-foreground pt-10">لا توجد بيانات مبيعات حسب نوع الطلب لهذه الفترة.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    