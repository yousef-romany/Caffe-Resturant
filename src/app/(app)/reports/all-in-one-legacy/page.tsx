
"use client";

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type Order, type OrderStatus, type Category, type Ingredient, type PurchaseOrder, type OrderType, type Employee } from '@/constants';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Utensils, BarChart3, Package, AlertTriangle, ClipboardList, ListChecks, Users, TrendingUp, TrendingDown, Wallet, Filter, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isValid, parseISO, subMonths } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';


const COLORS = ['#50C878', '#84D9A0', '#A0E0B4', '#BCE8C8', '#D6F0DC', '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'];

interface MonthlySalesData {
  month: string;
  sales: number;
}

interface CategorySalesData {
  name: Category | string; 
  value: number;
}

interface OrderTypeSalesData {
  name: OrderType | string; 
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

export default function AllInOneLegacyReportsPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

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

  const [currentTreasuryBalance, setCurrentTreasuryBalance] = useState(5750.75); 
  const [netCashFlow, setNetCashFlow] = useState(0);

  const [totalIngredients, setTotalIngredients] = useState(0);
  const [lowStockIngredientsCount, setLowStockIngredientsCount] = useState(0);
  const [lowStockItemsList, setLowStockItemsList] = useState<Ingredient[]>([]);

  const [totalPurchaseOrdersCount, setTotalPurchaseOrdersCount] = useState(0);
  const [recentPurchaseOrders, setRecentPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function initDb() {
      try {
        const dbInstance = await getDb;
        setDbInstance(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB for all-in-one report:", error);
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

    async function fetchAllReportData() {
      setIsLoading(true);
      const { startDate, endDate } = getPeriodDateRange(selectedPeriod);
      const startDateString = format(startDate, 'yyyy-MM-dd HH:mm:ss');
      const endDateString = format(endDate, 'yyyy-MM-dd HH:mm:ss');
      const startDateSqlDate = format(startDate, 'yyyy-MM-dd');
      const endDateSqlDate = format(endDate, 'yyyy-MM-dd');

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

        const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        const currentMonthDate = new Date();
        const salesChartDataPromises: Promise<MonthlySalesData>[] = Array(6).fill(null).map(async (_, i) => {
            const targetMonthDate = subMonths(currentMonthDate, 5 - i);
            const monthStart = format(startOfMonth(targetMonthDate), 'yyyy-MM-dd HH:mm:ss');
            const monthEnd = format(endOfMonth(targetMonthDate), 'yyyy-MM-dd HH:mm:ss');
            const monthIndex = targetMonthDate.getMonth(); const year = targetMonthDate.getFullYear();
            const monthName = `${monthsAr[monthIndex]} ${year}`;
            const monthSalesResult: any[] = await db.select("SELECT SUM(total_amount) as sales FROM orders WHERE status = 'مكتمل' AND created_at BETWEEN ? AND ?", [monthStart, monthEnd]);
            return { month: monthName, sales: Number(monthSalesResult[0]?.sales) || 0 };
        });
        setMonthlySales(await Promise.all(salesChartDataPromises));

        const catSalesResult: any[] = await db.select(
          `SELECT mi.category, SUM(oi.price_at_order * oi.quantity) as value FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE o.status = 'مكتمل' AND o.created_at BETWEEN ? AND ? GROUP BY mi.category ORDER BY value DESC`,
          [startDateString, endDateString]
        );
        setCategorySales(catSalesResult.map(r => ({ name: r.category, value: Number(r.value) })));
        
        const otSalesResult: any[] = await db.select(
          `SELECT type, SUM(total_amount) as value FROM orders WHERE status = 'مكتمل' AND created_at BETWEEN ? AND ? GROUP BY type ORDER BY value DESC`,
          [startDateString, endDateString]
        );
        setOrderTypeSales(otSalesResult.map(r => ({ name: r.type, value: Number(r.value) })));

        const topItemsResult: any[] = await db.select(
          `SELECT mi.name, SUM(oi.price_at_order * oi.quantity) as sales, SUM(oi.quantity) as quantity FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE o.status = 'مكتمل' AND o.created_at BETWEEN ? AND ? GROUP BY mi.id, mi.name ORDER BY sales DESC LIMIT 5`,
          [startDateString, endDateString]
        );
        setTopItems(topItemsResult.map(item => ({ ...item, sales: Number(item.sales), quantity: Number(item.quantity) })));

        const employeesResult: any[] = await db.select("SELECT SUM(salary) as totalSalaries FROM employees WHERE is_active = TRUE");
        const salaries = Number(employeesResult[0]?.totalSalaries) || 0;
        setTotalSalariesPaid(salaries);
        const purchaseOrdersResult: any[] = await db.select("SELECT SUM(total_amount) as totalPurchase FROM purchase_orders WHERE order_date BETWEEN ? AND ?", [startDateSqlDate, endDateSqlDate]);
        const poAmount = Number(purchaseOrdersResult[0]?.totalPurchase) || 0;
        setTotalPurchaseAmount(poAmount);
        setTotalExpenses(salaries + poAmount);
        
        setNetCashFlow(revenue - (salaries + poAmount));

        const totalIngredientsResult: any[] = await db.select("SELECT COUNT(*) as count FROM ingredients");
        setTotalIngredients(Number(totalIngredientsResult[0]?.count) || 0);
        const lowStockDbResult: Ingredient[] = await db.select<Ingredient[]>("SELECT id, name, unit, stock_quantity as stockQuantity, cost_per_unit as costPerUnit, low_stock_threshold as lowStockThreshold FROM ingredients WHERE stock_quantity < low_stock_threshold AND low_stock_threshold IS NOT NULL");
        setLowStockIngredientsCount(lowStockDbResult.length);
        setLowStockItemsList(lowStockDbResult.map(ing => ({...ing, stockQuantity: Number(ing.stockQuantity), costPerUnit: Number(ing.costPerUnit), lowStockThreshold: ing.lowStockThreshold ? Number(ing.lowStockThreshold) : undefined })));

        const poStatsResult: any[] = await db.select("SELECT COUNT(*) as count FROM purchase_orders WHERE order_date BETWEEN ? AND ?", [startDateSqlDate, endDateSqlDate]);
        setTotalPurchaseOrdersCount(Number(poStatsResult[0]?.count) || 0);
        const recentPOsDbResult: any[] = await db.select("SELECT id, order_number as orderNumber, supplier_name as supplierName, total_amount as totalAmount, status, order_date as orderDate FROM purchase_orders WHERE order_date BETWEEN ? AND ? ORDER BY order_date DESC LIMIT 5", [startDateSqlDate, endDateSqlDate]);
        setRecentPurchaseOrders(recentPOsDbResult.map(po => ({ ...po, orderDate: parseISO(po.orderDate), totalAmount: Number(po.totalAmount), items:[] })));

      } catch (error) {
        console.error("Error fetching all-in-one report data:", error);
        toast({ title: "خطأ", description: "فشل في جلب بيانات التقرير الشامل.", variant: "destructive" });
        setTotalRevenue(0); setTotalOrders(0); setAverageOrderValue(0); setMonthlySales([]); setCategorySales([]); setOrderTypeSales([]); setTopItems([]);
        setTotalSalariesPaid(0); setTotalPurchaseAmount(0); setTotalExpenses(0); setNetCashFlow(0);
        setTotalIngredients(0); setLowStockIngredientsCount(0); setLowStockItemsList([]);
        setTotalPurchaseOrdersCount(0); setRecentPurchaseOrders([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllReportData();
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
        <PageHeader title="التقرير الشامل (قديم)" description="جارٍ تحميل بيانات التقرير..." icon={BarChart3}/>
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="التقرير الشامل (قديم)" 
        description={`تحليل شامل لأداء مشروعك لـ ${getPeriodLabel()}.`} 
        icon={BarChart3}
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
                <SelectItem value="semi_annually">نصف سنوي</SelectItem>
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
      
      <Card className="mb-8 shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl">ملخص المصروفات ({getPeriodLabel()})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الرواتب</CardTitle>
                <Users className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalSalariesPaid.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">إجمالي رواتب الموظفين النشطين حاليًا</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تكلفة المشتريات</CardTitle>
                <Package className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalPurchaseAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">إجمالي تكلفة أوامر الشراء في الفترة</p>
            </CardContent>
            </Card>
            <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">الرواتب + المشتريات في الفترة</p>
            </CardContent>
            </Card>
        </CardContent>
      </Card>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl">التقارير المالية ({getPeriodLabel()})</CardTitle>
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
                <p className="text-xs text-muted-foreground">الإيرادات - المصروفات (في الفترة)</p>
            </CardContent>
            </Card>
        </CardContent>
      </Card>


      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8">
        <Card className="shadow-lg col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات الشهرية (آخر 6 أشهر)</CardTitle>
            <CardDescription>أداء المبيعات خلال آخر 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] ps-0">
            {monthlySales.length > 0 ? (
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
            ) : ( <p className="text-center text-muted-foreground pt-10">لا توجد بيانات مبيعات شهرية لعرضها.</p> )}
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
            ) : ( <p className="text-center text-muted-foreground pt-10">لا توجد بيانات مبيعات حسب الفئة لهذه الفترة.</p> )}
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
             ) : ( <p className="text-center text-muted-foreground pt-10">لا توجد بيانات مبيعات حسب نوع الطلب لهذه الفترة.</p> )}
          </CardContent>
        </Card>
      </div>

       <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Utensils className="h-6 w-6 text-primary"/>العناصر الأكثر مبيعًا ({getPeriodLabel()})</CardTitle>
            <CardDescription>العناصر الأكثر شيوعًا حسب الإيرادات والكمية.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topItems.length > 0 ? (
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
                        <TableCell className="text-left font-semibold">${Number(item.sales).toFixed(2)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            ) : ( <p className="p-4 text-center text-muted-foreground">لا توجد بيانات عناصر مبيعة لهذه الفترة.</p> )}
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
                                        <TableCell className="text-center text-destructive font-semibold">{Number(item.stockQuantity).toLocaleString()}</TableCell>
                                        <TableCell className="text-center">{item.lowStockThreshold?.toLocaleString()}</TableCell>
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
                    <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary"/>ملخص أوامر الشراء ({getPeriodLabel()})</CardTitle>
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
                <CardTitle className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary"/>أحدث أوامر الشراء ({getPeriodLabel()})</CardTitle>
                <CardDescription>عرض آخر 5 أوامر شراء تم إنشاؤها في الفترة.</CardDescription>
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

    