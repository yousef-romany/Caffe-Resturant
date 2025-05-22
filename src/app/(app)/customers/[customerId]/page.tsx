
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { DUMMY_CUSTOMERS, DUMMY_ORDERS, type Customer, type Order, type OrderStatus } from '@/constants';
import { User, ShoppingBag, CalendarDays, Filter, DollarSign } from 'lucide-react';
import { format, getYear, getMonth, getDate, isValid, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';

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
  const params = useParams();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [filterYear, setFilterYear] = useState<string>('الكل');
  const [filterMonth, setFilterMonth] = useState<string>('الكل');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  useEffect(() => {
    const foundCustomer = DUMMY_CUSTOMERS.find(c => c.id === customerId);
    if (foundCustomer) {
      setCustomer(foundCustomer);
      // Filter orders by customer name for dummy data. In real DB, filter by customerId.
      const customerOrders = DUMMY_ORDERS.filter(order => order.customerName === foundCustomer.name)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(customerOrders);
    } else {
      //notFound(); // This would throw an error, for a static site, maybe redirect or show message
    }
  }, [customerId]);

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

  if (!customer) {
    return (
        <div className="container mx-auto p-4">
            <PageHeader title="لم يتم العثور على العميل" icon={User} />
            <p>عذراً، لم نتمكن من العثور على بيانات هذا العميل.</p>
        </div>
    );
  }

  return (
    <>
      <PageHeader title={`ملف العميل: ${customer.name}`} description={`عرض تفاصيل وتعاملات العميل ${customer.name}.`} icon={User} />

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
                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
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
