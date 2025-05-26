
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
import { type Supplier, type PurchaseOrder, type PurchaseOrderStatus } from '@/constants';
import { Users, ListChecks, CalendarDays, Filter, DollarSign, ArrowRight } from 'lucide-react';
import { format, getYear, getMonth, getDate, isValid, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';

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
  const router = useRouter();
  const { toast } = useToast();
  const [db, setDbInstance] = useState<Database | null>(null);
  const [supplierIdState, setSupplierIdState] = useState<string | null>(null); 
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  
  const [filterYear, setFilterYear] = useState<string>('الكل');
  const [filterMonth, setFilterMonth] = useState<string>('الكل');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializePage() {
      const idFromStorage = localStorage.getItem('selectedSupplierId');
      if (idFromStorage) {
        setSupplierIdState(idFromStorage);
      } else {
        setIsLoading(false);
        toast({ title: "لم يتم تحديد مورد", description: "الرجاء اختيار مورد من القائمة.", variant: "destructive"});
        router.replace('/inventory/suppliers'); 
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
    async function fetchSupplierAndPOs() {
      if (db && supplierIdState) {
        setIsLoading(true);
        try {
          const foundSupplierResult: Supplier[] = await db.select(
            'SELECT id, name, contact_person as contactPerson, phone, email, address FROM suppliers WHERE id = ?', 
            [supplierIdState]
          );
          
          if (foundSupplierResult.length > 0) {
            setSupplier({
              ...foundSupplierResult[0],
              contactPerson: foundSupplierResult[0].contactPerson || undefined,
              phone: foundSupplierResult[0].phone || undefined,
              email: foundSupplierResult[0].email || undefined,
              address: foundSupplierResult[0].address || undefined,
            });

            const supplierPOsResult: any[] = await db.select(
              'SELECT id, order_number as orderNumber, total_amount as totalAmount, status, order_date as orderDate, supplier_name as supplierName FROM purchase_orders WHERE supplier_id = ? ORDER BY order_date DESC',
              [supplierIdState]
            );
            setPurchaseOrders(supplierPOsResult.map(po => ({
              ...po,
              orderDate: po.orderDate ? parseISO(po.orderDate) : new Date(),
              totalAmount: Number(po.totalAmount) || 0,
              items: [] 
            })));

          } else {
            setSupplier(null); 
            setPurchaseOrders([]);
            toast({ title: "لم يتم العثور على المورد", description: `المورد بالمعرف ${supplierIdState} غير موجود.`, variant: "destructive"});
          }
        } catch (error) {
          console.error("Error fetching supplier details or POs:", error);
          toast({ title: "خطأ", description: "فشل في جلب تفاصيل المورد أو أوامر الشراء.", variant: "destructive" });
          setSupplier(null);
          setPurchaseOrders([]);
        } finally {
          setIsLoading(false);
          localStorage.removeItem('selectedSupplierId'); 
        }
      } else if (!supplierIdState && !isLoading) { 
        setIsLoading(false);
      }
    }
    fetchSupplierAndPOs();
  }, [db, supplierIdState, toast]); 


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
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <PageHeader title="جارٍ تحميل بيانات المورد..." icon={Users} />
        <p>يرجى الانتظار...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
        <div className="container mx-auto p-4">
            <PageHeader title="لم يتم تحديد مورد أو لم يتم العثور عليه" icon={Users} />
            <p>عذراً، لم نتمكن من العثور على بيانات هذا المورد. يرجى المحاولة مرة أخرى من <Button variant="link" onClick={() => router.push('/inventory/suppliers')} className="p-0 h-auto">قائمة الموردين</Button>.</p>
        </div>
    );
  }

  return (
    <>
      <PageHeader title={`ملف المورد: ${supplier.name}`} description={`عرض تفاصيل وتعاملات المورد ${supplier.name}.`} icon={Users} 
        actions={
          <Button variant="outline" onClick={() => router.push('/inventory/suppliers')}>
            <ArrowRight className="h-4 w-4 me-2" /> العودة لقائمة الموردين
          </Button>
        }
      />

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
                    <TableCell>${Number(po.totalAmount).toFixed(2)}</TableCell>
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

    