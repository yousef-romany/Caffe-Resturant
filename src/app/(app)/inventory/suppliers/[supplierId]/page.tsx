
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { DUMMY_SUPPLIERS, DUMMY_PURCHASE_ORDERS, type Supplier, type PurchaseOrder, type PurchaseOrderStatus } from '@/constants';
import { Users, ListChecks, CalendarDays, Filter, DollarSign } from 'lucide-react';
import { format, getYear, getMonth, getDate, isValid, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';

const getStatusBadgeVariant = (status: PurchaseOrderStatus) => {
  switch (status) {
    case 'مستلم': return 'default';
    case 'مؤكد': return 'secondary';
    case 'معلق': return 'outline';
    case 'ملغى': return 'destructive';
    default: return 'outline';
  }
};

export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.supplierId as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  
  const [filterYear, setFilterYear] = useState<string>('الكل');
  const [filterMonth, setFilterMonth] = useState<string>('الكل');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  useEffect(() => {
    const foundSupplier = DUMMY_SUPPLIERS.find(s => s.id === supplierId);
    if (foundSupplier) {
      setSupplier(foundSupplier);
      const supplierPOs = DUMMY_PURCHASE_ORDERS.filter(po => po.supplierId === foundSupplier.id)
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      setPurchaseOrders(supplierPOs);
    } else {
      // notFound(); // Or handle not found state for static export
    }
  }, [supplierId]);

  const availableYears = useMemo(() => {
    const years = new Set(purchaseOrders.map(po => getYear(new Date(po.orderDate)).toString()));
    return ['الكل', ...Array.from(years).sort((a,b) => parseInt(b) - parseInt(a))];
  }, [purchaseOrders]);

  const availableMonths = useMemo(() => {
    const months = new Set(purchaseOrders.map(po => (getMonth(new Date(po.orderDate)) + 1).toString().padStart(2, '0')));
    return ['الكل', ...Array.from(months).sort()];
  }, [purchaseOrders]);

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const poDate = new Date(po.orderDate);
      if (!isValid(poDate)) return false;

      if (filterYear !== 'الكل' && getYear(poDate).toString() !== filterYear) return false;
      if (filterMonth !== 'الكل' && (getMonth(poDate) + 1).toString().padStart(2, '0') !== filterMonth) return false;
      if (filterDay && getDate(poDate).toString() !== filterDay.padStart(2,'0')) return false;
      
      if (filterDateFrom) {
        const fromDate = parseISO(filterDateFrom);
        if (isValid(fromDate) && poDate < fromDate) return false;
      }
      if (filterDateTo) {
        const toDate = parseISO(filterDateTo);
        if (isValid(toDate) && poDate > new Date(toDate.setHours(23, 59, 59, 999))) return false;
      }
      return true;
    });
  }, [purchaseOrders, filterYear, filterMonth, filterDay, filterDateFrom, filterDateTo]);

  const resetFilters = () => {
    setFilterYear('الكل');
    setFilterMonth('الكل');
    setFilterDay('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  if (!supplier) {
    return (
        <div className="container mx-auto p-4">
            <PageHeader title="لم يتم العثور على المورد" icon={Users} />
            <p>عذراً، لم نتمكن من العثور على بيانات هذا المورد.</p>
        </div>
    );
  }

  return (
    <>
      <PageHeader title={`ملف المورد: ${supplier.name}`} description={`عرض تفاصيل وتعاملات المورد ${supplier.name}.`} icon={Users} />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>بيانات المورد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>الاسم:</strong> {supplier.name}</p>
          <p><strong>شخص الاتصال:</strong> {supplier.contactPerson || '-'}</p>
          <p><strong>الهاتف:</strong> {supplier.phone || '-'}</p>
          <p><strong>البريد الإلكتروني:</strong> {supplier.email || '-'}</p>
          <p><strong>العنوان:</strong> {supplier.address || '-'}</p>
        </CardContent>
      </Card>

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> فلاتر سجل أوامر الشراء</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="filterYearPo">السنة</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger id="filterYearPo"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterMonthPo">الشهر</Label>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger id="filterMonthPo"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div>
            <Label htmlFor="filterDayPo">اليوم</Label>
            <Input id="filterDayPo" type="number" placeholder="يوم (e.g., 05, 12)" value={filterDay} onChange={e => setFilterDay(e.target.value)} min="1" max="31" />
          </div>
          <div>
            <Label htmlFor="filterDateFromPo">من تاريخ</Label>
            <Input id="filterDateFromPo" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="filterDateToPo">إلى تاريخ</Label>
            <Input id="filterDateToPo" type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
          </div>
          <Button onClick={resetFilters} variant="outline" className="w-full md:w-auto">
            <Filter className="h-4 w-4 me-2" /> إعادة تعيين الفلاتر
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6" /> سجل أوامر الشراء</CardTitle>
          <CardDescription>قائمة بجميع أوامر الشراء التي تمت مع {supplier.name}.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead><CalendarDays className="inline h-4 w-4 me-1" /> تاريخ الطلب</TableHead>
                <TableHead><DollarSign className="inline h-4 w-4 me-1" /> المبلغ الإجمالي</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchaseOrders.length > 0 ? (
                filteredPurchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.orderNumber}</TableCell>
                    <TableCell>{format(new Date(po.orderDate), 'PP', { locale: arSA })}</TableCell>
                    <TableCell>${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                     {purchaseOrders.length === 0 ? "لا توجد أوامر شراء لهذا المورد بعد." : "لا توجد أوامر شراء تطابق الفلاتر المحددة."}
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
