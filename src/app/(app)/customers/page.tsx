
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import type { Customer } from '@/constants';
import { PlusCircle, Edit, Trash2, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

const initialNewCustomerState: Omit<Customer, 'id' | 'joinDate' | 'totalSpent'> & { joinDate: string } = {
  name: '',
  phone: '',
  email: '',
  loyaltyPoints: 0,
  joinDate: new Date().toISOString().split('T')[0], // Default to today
  notes: '',
};

export default function CustomersPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomerData, setNewCustomerData] = useState(initialNewCustomerState);
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDbAndFetchData() {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        await fetchCustomers(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch data:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات العملاء.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadDbAndFetchData();
  }, [toast]);

  const fetchCustomers = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const fetchedCustomers: any[] = await currentDb.select('SELECT id, name, phone, email, loyalty_points as loyaltyPoints, join_date as joinDate, total_spent as totalSpent, notes FROM customers ORDER BY name');
      setCustomers(fetchedCustomers.map(cust => ({
        ...cust,
        joinDate: cust.joinDate ? parseISO(cust.joinDate) : new Date(),
        loyaltyPoints: Number(cust.loyaltyPoints) || 0,
        totalSpent: Number(cust.totalSpent) || 0,
      })));
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات العملاء.", variant: "destructive" });
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'loyaltyPoints' ? parseInt(value, 10) : value;
    setNewCustomerData(prev => ({ ...prev, [name]: name === 'loyaltyPoints' && (value === '' || isNaN(Number(numValue))) ? 0 : numValue }));
  };

  const handleSubmit = async () => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    if (!newCustomerData.name || !newCustomerData.phone || !newCustomerData.joinDate) {
      toast({ title: "خطأ", description: "الاسم، الهاتف، وتاريخ الانضمام مطلوبون.", variant: "destructive" });
      return;
    }
    // Basic phone validation (e.g., starts with 05 and is 10 digits long for SA numbers)
    if (!/^05\d{8}$/.test(newCustomerData.phone)) {
        toast({
            title: "خطأ في رقم الهاتف",
            description: "الرجاء إدخال رقم هاتف سعودي صالح (e.g., 05xxxxxxxx).",
            variant: "destructive",
        });
        return;
    }
    if (newCustomerData.email && !/\S+@\S+\.\S+/.test(newCustomerData.email)) {
        toast({
            title: "خطأ في البريد الإلكتروني",
            description: "الرجاء إدخال عنوان بريد إلكتروني صالح أو تركه فارغًا.",
            variant: "destructive",
        });
        return;
    }


    const customerDataToSave = {
      name: newCustomerData.name,
      phone: newCustomerData.phone,
      email: newCustomerData.email || null,
      loyalty_points: Number(newCustomerData.loyaltyPoints) || 0,
      join_date: format(new Date(newCustomerData.joinDate), 'yyyy-MM-dd'), // Format date for DB
      notes: newCustomerData.notes || null,
    };

    try {
      if (editingCustomer) {
        await db.execute(
          'UPDATE customers SET name = $1, phone = $2, email = $3, loyalty_points = $4, join_date = $5, notes = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
          [customerDataToSave.name, customerDataToSave.phone, customerDataToSave.email, customerDataToSave.loyalty_points, customerDataToSave.join_date, customerDataToSave.notes, editingCustomer.id]
        );
        toast({ title: "نجاح", description: `تم تحديث بيانات العميل ${customerDataToSave.name}.` });
      } else {
        const newCustomerId = `cust-${Date.now()}`;
        await db.execute(
          'INSERT INTO customers (id, name, phone, email, loyalty_points, join_date, notes, total_spent) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)',
          [newCustomerId, customerDataToSave.name, customerDataToSave.phone, customerDataToSave.email, customerDataToSave.loyalty_points, customerDataToSave.join_date, customerDataToSave.notes]
        );
        toast({ title: "نجاح", description: `تمت إضافة العميل ${customerDataToSave.name}.` });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setNewCustomerData(initialNewCustomerState);
      await fetchCustomers(db);
    } catch (error) {
      console.error("Error submitting customer:", error);
      toast({ title: "خطأ في الحفظ", description: "فشل حفظ بيانات العميل. قد يكون رقم الهاتف أو البريد مكرر.", variant: "destructive" });
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomerData({
      ...customer,
      joinDate: format(new Date(customer.joinDate), 'yyyy-MM-dd'),
      email: customer.email || '',
      notes: customer.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = async (customerToDelete: Customer) => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    try {
      // Consider checking for related orders before deleting
      await db.execute('DELETE FROM customers WHERE id = $1', [customerToDelete.id]);
      toast({ title: "نجاح", description: `تم حذف العميل ${customerToDelete.name}.`, variant: "destructive" });
      await fetchCustomers(db);
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      if (error.message && error.message.toLowerCase().includes("foreign key constraint fails")) {
        toast({ title: "خطأ في الحذف", description: "لا يمكن حذف هذا العميل لأنه مرتبط بطلبات أو بيانات أخرى.", variant: "destructive" });
      } else {
        toast({ title: "خطأ في الحذف", description: "فشل حذف العميل.", variant: "destructive" });
      }
    }
  };

  const openNewCustomerDialog = () => {
    setEditingCustomer(null);
    setNewCustomerData(initialNewCustomerState);
    setIsDialogOpen(true);
  };

  const handleViewCustomerDetails = (customerId: string) => {
    localStorage.setItem('selectedCustomerId', customerId);
    router.push('/customers/customer');
  };

  return (
    <>
      <PageHeader
        title="إدارة العملاء"
        description="إضافة وتعديل وحذف بيانات العملاء الدائمين."
        icon={Award}
        actions={
          <Button onClick={openNewCustomerDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 me-2" /> إضافة عميل جديد
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardContent className="p-0">
           {isLoading ? (
            <p className="text-center text-muted-foreground p-10">جارٍ تحميل بيانات العملاء...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead className="text-center">نقاط الولاء</TableHead>
                  <TableHead className="text-center">إجمالي الإنفاق ($)</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <Button 
                          variant="link" 
                          onClick={() => handleViewCustomerDetails(customer.id)}
                          className="text-primary hover:underline p-0 h-auto"
                        >
                          {customer.name}
                        </Button>
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell className="text-center">{customer.loyaltyPoints}</TableCell>
                      <TableCell className="text-center">${(customer.totalSpent || 0).toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(customer.joinDate), 'PP', { locale: arSA })}</TableCell>
                      <TableCell className="text-center space-x-2 space-x-reverse">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      لا يوجد عملاء مسجلون بعد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'قم بتحديث تفاصيل هذا العميل.' : 'املأ تفاصيل العميل الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto ps-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left">الاسم</Label>
              <Input id="name" name="name" value={newCustomerData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-left">الهاتف</Label>
              <Input id="phone" name="phone" type="tel" value={newCustomerData.phone} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-left">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" value={newCustomerData.email || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loyaltyPoints" className="text-left">نقاط الولاء</Label>
              <Input id="loyaltyPoints" name="loyaltyPoints" type="number" value={newCustomerData.loyaltyPoints} onChange={handleInputChange} className="col-span-3" min="0" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="joinDate" className="text-left">تاريخ الانضمام</Label>
              <Input id="joinDate" name="joinDate" type="date" value={newCustomerData.joinDate} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-left pt-2">ملاحظات</Label>
              <Textarea id="notes" name="notes" value={newCustomerData.notes || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingCustomer ? 'حفظ التغييرات' : 'إضافة عميل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
    

    