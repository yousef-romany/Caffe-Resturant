
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { type Customer, type Order, type OrderStatus } from '@/constants'; // Keep type imports for structure
import { User, ShoppingBag, CalendarDays, Filter, DollarSign, ArrowRight } from 'lucide-react';
import { format, getYear, getMonth, getDate, isValid, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';

const getStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case 'مكتمل': return 'default';
    case 'قيد الانتظار': return 'secondary';
    case 'قيد التجهيز': return 'outline';
    case 'جاهز': return 'default';
    case 'ملغى': return 'destructive';
    default: return 'outline';
  }
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [db, setDbInstance] = useState<Database | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [filterYear, setFilterYear] = useState<string>('الكل');
  const [filterMonth, setFilterMonth] = useState<string>('الكل');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializePage() {
      const idFromStorage = localStorage.getItem('selectedCustomerId');
      if (idFromStorage) {
        setCustomerId(idFromStorage);
      } else {
        setIsLoading(false);
        toast({ title: "لم يتم تحديد عميل", description: "الرجاء اختيار عميل من القائمة.", variant: "destructive"});
        router.replace('/customers'); 
      }
      
      try {
        const dbInstance = await getDb();
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB:", error);
        toast({ title: "خطأ في الاتصال", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
        setIsLoading(false);
      }
    }
    initializePage();
  }, [router, toast]);

  useEffect(() => {
    async function fetchCustomerAndOrders() {
      if (db && customerId) {
        setIsLoading(true);
        try {
          const foundCustomerResult: any[] = await db.select('SELECT id, name, phone, email, loyalty_points as loyaltyPoints, join_date as joinDate, total_spent as totalSpent, notes FROM customers WHERE id = $1', [customerId]);
          
          if (foundCustomerResult.length > 0) {
            const custData = foundCustomerResult[0];
            setCustomer({
              ...custData,
              joinDate: custData.joinDate ? parseISO(custData.joinDate) : new Date(),
              loyaltyPoints: Number(custData.loyaltyPoints) || 0,
              totalSpent: Number(custData.totalSpent) || 0,
            });

            const customerOrdersResult: any[] = await db.select(
              'SELECT id, order_number as orderNumber, total_amount as totalAmount, status, type, created_at as createdAt FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
              [customerId]
            );
            setOrders(customerOrdersResult.map(order => ({
              ...order,
              createdAt: order.createdAt ? parseISO(order.createdAt) : new Date(),
              totalAmount: Number(order.totalAmount) || 0,
              items: [], // Items are not fetched here for this overview table
            })));

          } else {
            setCustomer(null); 
            setOrders([]);
            toast({ title: "لم يتم العثور على العميل", description: `العميل بالمعرف ${customerId} غير موجود.`, variant: "destructive"});
          }
        } catch (error) {
          console.error("Error fetching customer details or orders:", error);
          toast({ title: "خطأ", description: "فشل في جلب تفاصيل العميل أو طلباته.", variant: "destructive" });
          setCustomer(null);
          setOrders([]);
        } finally {
          setIsLoading(false);
          localStorage.removeItem('selectedCustomerId'); 
        }
      } else if (!customerId && !isLoading) { 
        setIsLoading(false);
      }
    }
    fetchCustomerAndOrders();
  }, [db, customerId, toast]); // Removed isLoading from dependencies

  const availableYears = useMemo(() => {
    const years = new Set(orders.map(order => getYear(new Date(order.createdAt)).toString()));
    return ['الكل', ...Array.from(years).sort((a,b) => parseInt(b) - parseInt(a))];
  }, [orders]);

  const availableMonths = useMemo(() => {
    const months = new Set(orders.map(order => (getMonth(new Date(order.createdAt)) + 1).toString().padStart(2, '0')));
    return ['الكل', ...Array.from(months).sort()];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      if (!isValid(orderDate)) return false;

      if (filterYear !== 'الكل' && getYear(orderDate).toString() !== filterYear) return false;
      if (filterMonth !== 'الكل' && (getMonth(orderDate) + 1).toString().padStart(2, '0') !== filterMonth) return false;
      if (filterDay && getDate(orderDate).toString() !== filterDay.padStart(2,'0')) return false;
      
      if (filterDateFrom) {
        const fromDate = parseISO(filterDateFrom);
        if (isValid(fromDate) && orderDate < fromDate) return false;
      }
      if (filterDateTo) {
        const toDate = parseISO(filterDateTo);
        if (isValid(toDate) && orderDate > new Date(toDate.setHours(23, 59, 59, 999))) return false;
      }
      return true;
    });
  }, [orders, filterYear, filterMonth, filterDay, filterDateFrom, filterDateTo]);

  const resetFilters = () => {
    setFilterYear('الكل');
    setFilterMonth('الكل');
    setFilterDay('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <PageHeader title="جارٍ تحميل بيانات العميل..." icon={User} />
        <p>يرجى الانتظار...</p>
      </div>
    );
  }

  if (!customer) {
    return (
        <div className="container mx-auto p-4">
            <PageHeader title="لم يتم تحديد عميل أو لم يتم العثور عليه" icon={User} />
            <p>عذراً، لم نتمكن من العثور على بيانات هذا العميل. يرجى المحاولة مرة أخرى من <Button variant="link" onClick={() => router.push('/customers')} className="p-0 h-auto">قائمة العملاء</Button>.</p>
        </div>
    );
  }

  return (
    <>
      <PageHeader title={`ملف العميل: ${customer.name}`} description={`عرض تفاصيل وتعاملات العميل ${customer.name}.`} icon={User} 
        actions={
          <Button variant="outline" onClick={() => router.push('/customers')}>
            <ArrowRight className="h-4 w-4 me-2" /> العودة لقائمة العملاء
          </Button>
        }
      />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>بيانات العميل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>الاسم:</strong> {customer.name}</p>
          <p><strong>الهاتف:</strong> {customer.phone}</p>
          <p><strong>البريد الإلكتروني:</strong> {customer.email || '-'}</p>
          <p><strong>تاريخ الانضمام:</strong> {format(new Date(customer.joinDate), 'PP', { locale: arSA })}</p>
          <p><strong>نقاط الولاء:</strong> {customer.loyaltyPoints}</p>
          <p><strong>إجمالي الإنفاق:</strong> ${(customer.totalSpent || 0).toFixed(2)}</p>
          {customer.notes && <p><strong>ملاحظات:</strong> {customer.notes}</p>}
        </CardContent>
      </Card>

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> فلاتر سجل الطلبات</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="filterYear">السنة</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger id="filterYear"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterMonth">الشهر</Label>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger id="filterMonth"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterDay">اليوم</Label>
            <Input id="filterDay" type="number" placeholder="يوم (e.g., 05, 12)" value={filterDay} onChange={e => setFilterDay(e.target.value)} min="1" max="31" />
          </div>
          <div>
            <Label htmlFor="filterDateFrom">من تاريخ</Label>
            <Input id="filterDateFrom" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="filterDateTo">إلى تاريخ</Label>
            <Input id="filterDateTo" type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
          </div>
          <Button onClick={resetFilters} variant="outline" className="w-full md:w-auto">
            <Filter className="h-4 w-4 me-2" /> إعادة تعيين الفلاتر
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-6 w-6" /> سجل طلبات العميل</CardTitle>
          <CardDescription>قائمة بجميع الطلبات التي قام بها {customer.name}.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead><CalendarDays className="inline h-4 w-4 me-1" /> التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead><DollarSign className="inline h-4 w-4 me-1" /> المبلغ الإجمالي</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'PPpp', { locale: arSA })}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>${Number(order.totalAmount).toFixed(2)}</TableCell> {/* Ensure totalAmount is treated as number */}
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {orders.length === 0 ? "لا توجد طلبات لهذا العميل بعد." : "لا توجد طلبات تطابق الفلاتر المحددة."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

    