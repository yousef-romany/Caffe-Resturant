
"use client";

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_ORDERS, DUMMY_MENU_ITEMS, DUMMY_INGREDIENTS, DUMMY_PURCHASE_ORDERS, DUMMY_EMPLOYEES, type Order, type OrderStatus, type Category, type Ingredient, type PurchaseOrder, type OrderType } from '@/constants';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Utensils, BarChart3, Package, AlertTriangle, ClipboardList, ListChecks, Users, TrendingUp, TrendingDown, Wallet, Filter, CalendarDays } from 'lucide-react'; // Added icons
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Helper to generate random colors for Pie chart
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

export default function ReportsPage() {
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesData[]>([]);
  const [orderTypeSales, setOrderTypeSales] = useState<OrderTypeSalesData[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; sales: number; quantity: number }[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);

  const [totalSalariesPaid, setTotalSalariesPaid] = useState(0);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const [currentTreasuryBalance, setCurrentTreasuryBalance] = useState(5750.75); // Placeholder
  const [netCashFlow, setNetCashFlow] = useState(0); // Placeholder

  const [totalIngredients, setTotalIngredients] = useState(0);
  const [lowStockIngredientsCount, setLowStockIngredientsCount] = useState(0);
  const [lowStockItemsList, setLowStockItemsList] = useState<Ingredient[]>([]);

  const [totalPurchaseOrdersCount, setTotalPurchaseOrdersCount] = useState(0);
  const [recentPurchaseOrders, setRecentPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');


  useEffect(() => {
    // Sales calculations
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

    const itemSalesCount: { [key: string]: { name: string; sales: number; quantity: number } } = {};
    completedOrders.forEach(order => {
        order.items.forEach(orderItem => {
            if (!itemSalesCount[orderItem.id]) {
                itemSalesCount[orderItem.id] = { name: orderItem.name, sales: 0, quantity: 0 };
            }
            itemSalesCount[orderItem.id].sales += orderItem.price * orderItem.quantity;
            itemSalesCount[orderItem.id].quantity += orderItem.quantity;
        });
    });
    const sortedTopItems = Object.values(itemSalesCount)
        .sort((a,b) => b.sales - a.sales)
        .slice(0,5);
    setTopItems(sortedTopItems);

    // Expenses Calculations
    const salaries = DUMMY_EMPLOYEES.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    setTotalSalariesPaid(salaries); // Assuming monthly salaries for this placeholder
    const poAmount = DUMMY_PURCHASE_ORDERS.reduce((sum, po) => sum + po.totalAmount, 0);
    setTotalPurchaseAmount(poAmount);
    setTotalExpenses(salaries + poAmount);
    
    // Financial Placeholder Calculations
    setNetCashFlow(revenue - (salaries + poAmount)); // Simplified net cash flow

    // Inventory Reports
    setTotalIngredients(DUMMY_INGREDIENTS.length);
    const lowStock = DUMMY_INGREDIENTS.filter(ing => ing.lowStockThreshold !== undefined && ing.stockQuantity < ing.lowStockThreshold);
    setLowStockIngredientsCount(lowStock.length);
    setLowStockItemsList(lowStock);

    // Purchase Order Reports
    setTotalPurchaseOrdersCount(DUMMY_PURCHASE_ORDERS.length);
    setRecentPurchaseOrders(DUMMY_PURCHASE_ORDERS.slice(0, 5).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));

  }, [selectedPeriod]); // Re-calculate if period changes, though dummy data won't reflect it accurately
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    // In a real app, this would trigger re-fetching or re-calculating data
    // based on the selected period. For now, it just updates the state.
  };


  if (!isClient) {
    return (
      <>
        <PageHeader title="التقارير" description="حلل أداء مشروعك بالكامل." icon={BarChart3}/>
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل التقارير...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="التقارير" 
        description="حلل أداء مشروعك بالكامل." 
        icon={BarChart3}
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

      {/* Sales Summary Cards */}
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
      
      {/* Expenses Summary Cards */}
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

      {/* Financial Reports Cards */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl">التقارير المالية ({selectedPeriod === 'monthly' ? 'الشهر الحالي' : 'الفترة المختارة'})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
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
        </CardContent>
      </Card>


      {/* Sales Charts */}
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

       <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Utensils className="h-6 w-6 text-primary"/>العناصر الأكثر مبيعًا</CardTitle>
            <CardDescription>العناصر الأكثر شيوعًا حسب الإيرادات والكمية.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>العنصر</TableHead>
                    <TableHead className="text-center">الكمية المباعة</TableHead>
                    <TableHead className="text-left">إجمالي المبيعات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {topItems.map((item, index) => (
                    <TableRow key={item.name}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-left font-semibold">${item.sales.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary"/>ملخص المخزون</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">إجمالي أنواع المكونات</p>
                        <p className="text-2xl font-bold">{totalIngredients}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">مكونات تحتاج إعادة طلب</p>
                        <p className="text-2xl font-bold text-destructive">{lowStockIngredientsCount}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-lg row-span-1 lg:row-span-2">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive"/>مكونات تحتاج إعادة طلب</CardTitle>
                    <CardDescription>المكونات التي وصلت إلى حد المخزون المنخفض.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                    {lowStockItemsList.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المكون</TableHead>
                                    <TableHead className="text-center">الكمية الحالية</TableHead>
                                    <TableHead className="text-center">حد الطلب</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockItemsList.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name} <span className="text-xs text-muted-foreground">({item.unit})</span></TableCell>
                                        <TableCell className="text-center text-destructive font-semibold">{item.stockQuantity}</TableCell>
                                        <TableCell className="text-center">{item.lowStockThreshold}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="p-4 text-center text-muted-foreground">لا توجد مكونات تحتاج إعادة طلب حاليًا.</p>
                    )}
                </CardContent>
            </Card>
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary"/>ملخص أوامر الشراء</CardTitle>
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
        </div>
        
        <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary"/>أحدث أوامر الشراء</CardTitle>
                <CardDescription>عرض آخر 5 أوامر شراء تم إنشاؤها.</CardDescription>
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
        <Card className="mb-8 shadow-lg opacity-50">
             <CardHeader>
                <CardTitle>تقارير إضافية (قريباً)</CardTitle>
                <CardDescription>سيتم إضافة تقارير الموظفين، العملاء، والمراجعات قريباً.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    جاري العمل على تطوير تقارير مفصلة للموظفين (الأداء، المبيعات)، العملاء (سجل الطلبات، الولاء)، ومراجعات الزبائن لتحليل الرضا العام.
                </p>
            </CardContent>
        </Card>
    </>
  );
}
