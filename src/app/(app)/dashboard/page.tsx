import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DUMMY_MENU_ITEMS, DUMMY_ORDERS } from '@/constants';
import { DollarSign, ShoppingBag, Users, Utensils } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const totalSales = DUMMY_ORDERS.filter(o => o.status === 'مكتمل').reduce((sum, order) => sum + order.totalAmount, 0);
  const activeOrders = DUMMY_ORDERS.filter(o => o.status === 'قيد الانتظار' || o.status === 'قيد التجهيز').length;
  const totalMenuItems = DUMMY_MENU_ITEMS.length;
  
  // This is a placeholder for top selling items logic
  const topSellingItems = DUMMY_MENU_ITEMS.slice(0, 3).map(item => ({ ...item, quantitySold: Math.floor(Math.random() * 50) + 10 }));


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
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">20.1% أكثر من الشهر الماضي</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات النشطة</CardTitle>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">قيد التنفيذ حاليًا</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عناصر القائمة</CardTitle>
            <Utensils className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMenuItems}</div>
            <p className="text-xs text-muted-foreground">إجمالي العناصر المتاحة</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عملاء اليوم</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">15+ عن أمس</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>الطلبات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {DUMMY_ORDERS.slice(0,5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.type} - {new Date(order.createdAt).toLocaleTimeString('ar-EG')}</p>
                </div>
                <div className="text-right">
                   <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                   <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'مكتمل' ? 'bg-green-100 text-green-700' : 
                      order.status === 'قيد الانتظار' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'قيد التجهيز' ? 'bg-blue-100 text-blue-700' :
                       order.status === 'جاهز' ? 'bg-sky-100 text-sky-700' : // Example for 'Ready'
                      'bg-red-100 text-red-700' // For 'Cancelled'
                    }`}>{order.status}</span>
                </div>
              </div>
            ))}
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
             {topSellingItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.quantitySold} مبيعات</p>
              </div>
            ))}
             <Button variant="link" className="mt-4 p-0 text-primary hover:underline" asChild>
              <Link href="/reports">عرض التقرير الكامل</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
