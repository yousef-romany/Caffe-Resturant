
"use client";

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_ORDERS, type Order, type Category, type OrderType } from '@/constants';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, CalendarDays } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    case 'semi_annually': // Last 6 months from the start of the first month in range
      return { startDate: startOfMonth(subMonths(now, 5)), endDate: endOfMonth(now) };
    case 'annually':
      return { startDate: startOfYear(now), endDate: endOfYear(now) };
    // case 'custom': // Needs date pickers, not implemented yet
    default: // Default to current month
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  }
};


export default function SalesReportPage() {
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
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const { startDate, endDate } = getPeriodDateRange(selectedPeriod);

    const filteredOrdersForPeriod = DUMMY_ORDERS.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isValid(orderDate) && orderDate >= startDate && orderDate <= endDate && order.status === 'مكتمل';
    });

    const revenue = filteredOrdersForPeriod.reduce((sum, order) => sum + order.totalAmount, 0);
    setTotalRevenue(revenue);
    setTotalOrders(filteredOrdersForPeriod.length);
    setAverageOrderValue(filteredOrdersForPeriod.length > 0 ? revenue / filteredOrdersForPeriod.length : 0);

    const catSales: { [key in Category]?: number } = {};
    filteredOrdersForPeriod.forEach(order => {
      order.items.forEach(item => {
        catSales[item.category] = (catSales[item.category] || 0) + (item.price * item.quantity);
      });
    });
    setCategorySales(
        (Object.entries(catSales) as [Category, number][])
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
    );
    
    const otSales: { [key in OrderType]?: number } = {};
    filteredOrdersForPeriod.forEach(order => {
        otSales[order.type] = (otSales[order.type] || 0) + order.totalAmount;
    });
    setOrderTypeSales(
        (Object.entries(otSales) as [OrderType, number][])
        .map(([name, value]) => ({name, value}))
        .sort((a,b) => b.value - a.value)
    );

    // Monthly sales chart data (always last 6 months for this specific chart)
    const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const currentMonthDate = new Date();
    const salesChartData: MonthlySalesData[] = Array(6).fill(null).map((_, i) => {
        const targetMonthDate = subMonths(currentMonthDate, 5 - i);
        const monthIndex = targetMonthDate.getMonth();
        const year = targetMonthDate.getFullYear();
        const monthName = monthsAr[monthIndex];

        const salesForMonth = DUMMY_ORDERS
            .filter(o => {
                const orderDate = new Date(o.createdAt);
                return o.status === 'مكتمل' && 
                       isValid(orderDate) &&
                       orderDate.getMonth() === monthIndex &&
                       orderDate.getFullYear() === year;
            })
            .reduce((sum, order) => sum + order.totalAmount, 0);
        return {
            month: `${monthName} ${year}`, // Add year for clarity
            sales: salesForMonth, 
        };
    });
    setMonthlySalesChartData(salesChartData);

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
        <PageHeader title="تقرير المبيعات" description="تحليل أداء المبيعات." icon={TrendingUp}/>
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل التقرير...</p>
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
                {/* <SelectItem value="custom" disabled>فترة مخصصة (قريباً)</SelectItem> */}
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

