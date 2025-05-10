
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_ORDERS, DUMMY_MENU_ITEMS, Order, OrderStatus, Category } from '@/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Utensils } from 'lucide-react';
import { arSA } from 'date-fns/locale'; // Arabic locale

// Helper to generate random colors for Pie chart
const COLORS = ['#50C878', '#84D9A0', '#A0E0B4', '#BCE8C8', '#D6F0DC']; // Shades of Emerald Green

interface MonthlySalesData {
  month: string;
  sales: number;
}

interface CategorySalesData {
  name: Category; // Use Category type for consistency
  value: number;
}

export default function ReportsPage() {
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; sales: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);

  useEffect(() => {
    // Simulate data processing
    const completedOrders = DUMMY_ORDERS.filter(o => o.status === 'مكتمل');
    
    // Total Revenue & Orders
    const revenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    setTotalRevenue(revenue);
    setTotalOrders(completedOrders.length);
    setAverageOrderValue(completedOrders.length > 0 ? revenue / completedOrders.length : 0);

    // Monthly Sales (dummy data for past 6 months)
    // Translated months for display. Actual date logic would use date-fns with arSA locale.
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"]; 
    const salesData: MonthlySalesData[] = months.map(month => ({
      month,
      sales: Math.floor(Math.random() * 5000) + 1000,
    }));
    setMonthlySales(salesData);

    // Sales by Category
    const catSales: { [key in Category]?: number } = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        catSales[item.category] = (catSales[item.category] || 0) + (item.price * item.quantity);
      });
    });
    setCategorySales(
        (Object.entries(catSales) as [Category, number][])
        .map(([name, value]) => ({ name, value }))
    );
    
    // Top Selling Items
    const itemSales: { [key: string]: { name: string; sales: number } } = {};
    completedOrders.forEach(order => {
        order.items.forEach(orderItem => {
            if (!itemSales[orderItem.id]) {
                itemSales[orderItem.id] = { name: orderItem.name, sales: 0 };
            }
            itemSales[orderItem.id].sales += orderItem.price * orderItem.quantity;
        });
    });
    const sortedTopItems = Object.values(itemSales)
        .sort((a,b) => b.sales - a.sales)
        .slice(0,5);
    setTopItems(sortedTopItems);

  }, []);
  
  // Avoid hydration errors
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);


  if (!isClient) {
    return (
      <>
        <PageHeader title="تقارير المبيعات" description="حلل أداء مبيعاتك." />
        <p>جارٍ تحميل التقارير...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="تقارير المبيعات" description="حلل أداء مبيعاتك." />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">لجميع الطلبات المكتملة</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">الطلبات المكتملة</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">متوسط كل طلب مكتمل</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8">
        <Card className="shadow-lg col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات الشهرية</CardTitle>
            <CardDescription>أداء المبيعات خلال آخر 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales} layout="horizontal" margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} orientation="right" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', direction: 'rtl' }}/>
                <Bar dataKey="sales" name="المبيعات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="hsl(var(--border))"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <CardTitle>العناصر الأكثر مبيعًا</CardTitle>
            <CardDescription>العناصر الأكثر شيوعًا حسب الإيرادات.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {topItems.map((item, index) => (
                <li key={item.name} className="flex justify-between items-center p-2 border-b last:border-b-0">
                  <span className="font-medium text-sm">{index + 1}. {item.name}</span>
                  <span className="text-sm text-primary font-semibold">${item.sales.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
