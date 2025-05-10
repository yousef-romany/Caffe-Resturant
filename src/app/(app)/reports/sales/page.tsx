
"use client";

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_ORDERS, type Order, type Category, type OrderType } from '@/constants';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
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

export default function SalesReportPage() {
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);
  const [orderTypeSales, setOrderTypeSales] = useState<OrderTypeSalesData[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const completedOrders = DUMMY_ORDERS.filter(o => o.status === 'مكتمل');
    const revenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    setTotalRevenue(revenue);
    setTotalOrders(completedOrders.length);
    setAverageOrderValue(completedOrders.length > 0 ? revenue / completedOrders.length : 0);

    const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const currentMonthIndex = new Date().getMonth();
    const salesData: MonthlySalesData[] = Array(6).fill(null).map((_, i) => {
        const monthIndex = (currentMonthIndex - 5 + i + 12) % 12;
        const monthName = monthsAr[monthIndex];
        const salesForMonth = DUMMY_ORDERS
            .filter(o => o.status === 'مكتمل' && new Date(o.createdAt).getMonth() === monthIndex)
            .reduce((sum, order) => sum + order.totalAmount, 0);
        return {
            month: monthName,
            sales: salesForMonth > 0 ? salesForMonth : Math.floor(Math.random() * 1500) + 500, 
        };
    });
    setMonthlySales(salesData);

    const catSales: { [key in Category]?: number } = {};
    completedOrders.forEach(order => {
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
    completedOrders.forEach(order => {
        otSales[order.type] = (otSales[order.type] || 0) + order.totalAmount;
    });
    setOrderTypeSales(
        (Object.entries(otSales) as [OrderType, number][])
        .map(([name, value]) => ({name, value}))
        .sort((a,b) => b.value - a.value)
    );

  }, [selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as ReportPeriod);
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
        description="تحليل أداء المبيعات لفترات مختلفة." 
        icon={TrendingUp}
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
            <CardTitle className="text-xl">ملخص المبيعات ({selectedPeriod === 'monthly' ? 'الشهر الحالي' : 'الفترة المختارة'})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">لجميع الطلبات المكتملة</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                <ShoppingBag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">الطلبات المكتملة</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">متوسط كل طلب مكتمل</p>
            </CardContent>
            </Card>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8">
        <Card className="shadow-lg col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات الشهرية</CardTitle>
            <CardDescription>أداء المبيعات خلال آخر 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] ps-0">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={monthlySales} layout="vertical" margin={{ right: 30, left: 20 }}>
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
            <CardTitle>المبيعات حسب الفئة</CardTitle>
            <CardDescription>توزيع الإيرادات عبر فئات العناصر.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
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
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>المبيعات حسب نوع الطلب</CardTitle>
            <CardDescription>توزيع الإيرادات عبر أنواع الطلبات.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
