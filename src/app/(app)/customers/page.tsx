
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
import { DUMMY_CUSTOMERS, type Customer } from '@/constants';
import { PlusCircle, Edit, Trash2, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

const initialNewCustomerState: Omit<Customer, 'id' | 'joinDate' | 'totalSpent'> & { joinDate: string } = {
  name: '',
  phone: '',
  email: '',
  loyaltyPoints: 0,
  joinDate: new Date().toISOString().split('T')[0], // Default to today
  notes: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomerData, setNewCustomerData] = useState(initialNewCustomerState);
  const { toast } = useToast();

  useEffect(() => {
    setCustomers(DUMMY_CUSTOMERS);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'loyaltyPoints' ? parseInt(value, 10) : value;
    setNewCustomerData(prev => ({ ...prev, [name]: name === 'loyaltyPoints' && (value === '' || isNaN(Number(numValue))) ? 0 : numValue }));
  };

  const handleSubmit = () => {
    if (!newCustomerData.name || !newCustomerData.phone || !newCustomerData.joinDate) {
      toast({ title: "خطأ", description: "الاسم، الهاتف، وتاريخ الانضمام مطلوبون.", variant: "destructive" });
      return;
    }

    const customerDataToSave: Omit<Customer, 'id' | 'totalSpent'> = {
      ...newCustomerData,
      loyaltyPoints: Number(newCustomerData.loyaltyPoints),
      joinDate: new Date(newCustomerData.joinDate),
      notes: newCustomerData.notes || undefined,
    };

    if (editingCustomer) {
      const updatedCustomer = { ...editingCustomer, ...customerDataToSave };
      setCustomers(customers.map(cust => cust.id === editingCustomer.id ? updatedCustomer : cust));
      DUMMY_CUSTOMERS[DUMMY_CUSTOMERS.findIndex(c => c.id === editingCustomer.id)] = updatedCustomer;
      toast({ title: "نجاح", description: `تم تحديث بيانات العميل ${updatedCustomer.name}.` });
    } else {
      const newCustomerWithId: Customer = {
        ...customerDataToSave,
        id: `cust-${Date.now()}`,
        totalSpent: 0, // New customers start with 0 spent
      };
      setCustomers([newCustomerWithId, ...customers]);
      DUMMY_CUSTOMERS.unshift(newCustomerWithId);
      toast({ title: "نجاح", description: `تمت إضافة العميل ${newCustomerWithId.name}.` });
    }
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setNewCustomerData(initialNewCustomerState);
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

  const handleDeleteCustomer = (customerToDelete: Customer) => {
    setCustomers(customers.filter(cust => cust.id !== customerToDelete.id));
    DUMMY_CUSTOMERS = DUMMY_CUSTOMERS.filter(c => c.id !== customerToDelete.id);
    toast({ title: "نجاح", description: `تم حذف العميل ${customerToDelete.name}.`, variant: "destructive" });
  };

  const openNewCustomerDialog = () => {
    setEditingCustomer(null);
    setNewCustomerData(initialNewCustomerState);
    setIsDialogOpen(true);
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
                    <TableCell className="font-medium">{customer.name}</TableCell>
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
