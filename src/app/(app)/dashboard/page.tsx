
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type OrderStatus } from '@/constants';
import { DollarSign, ShoppingBag, Users, Wallet, Utensils } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';
import { parseISO, format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface DashboardStats {
  totalRevenue: number;
  activeOrdersCount: number;
  totalEmployees: number;
}

interface TopSellingItem {
  id: string;
  name: string;
  totalRevenue: number;
  quantitySold: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  type: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  tableNumber?: string;
}

export default function DashboardPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeOrdersCount: 0,
    totalEmployees: 0,
  });
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const placeholderCashInHand = 5750.75; // Remains placeholder

  useEffect(() => {
    async function initializeAndFetchData() {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        fetchDashboardData(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch data:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات لوحة التحكم.", variant: "destructive" });
        setIsLoading(false);
      }
    }
    initializeAndFetchData();
  }, [toast]);

  const fetchDashboardData = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      // Total Revenue for completed orders
      const revenueResult: any[] = await currentDb.select("SELECT SUM(total_amount) as total FROM orders WHERE status = 'مكتمل'");
      const totalRevenue = revenueResult[0]?.total || 0;

      // Active Orders Count
      const activeOrdersResult: any[] = await currentDb.select("SELECT COUNT(*) as count FROM orders WHERE status IN ('قيد الانتظار', 'قيد التجهيز')");
      const activeOrdersCount = activeOrdersResult[0]?.count || 0;

      // Total Active Employees
      const employeesResult: any[] = await currentDb.select("SELECT COUNT(*) as count FROM employees WHERE is_active = TRUE");
      const totalEmployees = employeesResult[0]?.count || 0;
      
      setStats({ totalRevenue, activeOrdersCount, totalEmployees });

      // Top Selling Items (by revenue from completed orders)
      const topItemsResult: any[] = await currentDb.select(`
        SELECT 
          mi.id, 
          mi.name, 
          SUM(oi.price_at_order * oi.quantity) as totalRevenue,
          SUM(oi.quantity) as quantitySold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE o.status = 'مكتمل'
        GROUP BY mi.id, mi.name 
        ORDER BY totalRevenue DESC 
        LIMIT 5
      `);
      setTopSellingItems(topItemsResult.map(item => ({...item, totalRevenue: Number(item.totalRevenue), quantitySold: Number(item.quantitySold) })));

      // Recent Orders
      const recentOrdersResult: any[] = await currentDb.select(`
        SELECT o.id, o.order_number as orderNumber, o.type, o.total_amount as totalAmount, o.status, o.created_at as createdAt, ti.number as tableNumber
        FROM orders o
        LEFT JOIN tables_info ti ON o.table_id = ti.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `);
      setRecentOrders(recentOrdersResult.map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        createdAt: parseISO(order.createdAt),
      })));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات لوحة التحكم.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <>
        <PageHeader title="لوحة التحكم" description="جارٍ تحميل بيانات لوحة التحكم..." />
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="لوحة التحكم" description="نظرة عامة على نشاط كافيه بوس إكسبريس الخاص بك." />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">(للطلبات المكتملة)</p> 
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات النشطة</CardTitle>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrdersCount}</div>
            <p className="text-xs text-muted-foreground">قيد الانتظار أو التجهيز</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الخزنة</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${placeholderCashInHand.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">الرصيد الحالي بالخزنة (تقديري)</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">موظف نشط</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>الطلبات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.type} {order.tableNumber ? `- ط ${order.tableNumber}` : ''} - {format(order.createdAt, 'p', { locale: arSA })}</p>
                </div>
                <div className="text-right">
                   <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                   <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'مكتمل' ? 'bg-green-100 text-green-700' : 
                      order.status === 'قيد الانتظار' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'قيد التجهيز' ? 'bg-blue-100 text-blue-700' :
                       order.status === 'جاهز' ? 'bg-sky-100 text-sky-700' : 
                      'bg-red-100 text-red-700' // For 'ملغى'
                    }`}>{order.status}</span>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-center py-4">لا توجد طلبات حديثة.</p>}
            <Button variant="link" className="mt-4 p-0 text-primary hover:underline" asChild>
              <Link href="/orders">عرض كل الطلبات</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>العناصر الأكثر مبيعًا</CardTitle>
          </CardHeader>
          <CardContent>
             {topSellingItems.length > 0 ? topSellingItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <p className="font-medium">{item.name}</p>
                <div className='text-left'>
                  <p className="text-sm text-muted-foreground">${item.totalRevenue.toFixed(2)} إيرادات</p>
                  <p className="text-xs text-muted-foreground">({item.quantitySold} مباعة)</p>
                </div>
              </div>
            )) : <p className="text-muted-foreground text-center py-4">لا توجد بيانات عن العناصر الأكثر مبيعًا.</p>}
             <Button variant="link" className="mt-4 p-0 text-primary hover:underline" asChild>
              <Link href="/reports/top-selling">عرض التقرير الكامل</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
