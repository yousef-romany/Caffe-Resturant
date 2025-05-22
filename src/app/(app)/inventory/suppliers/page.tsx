
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
import { DUMMY_SUPPLIERS, type Supplier } from '@/constants';
import { PlusCircle, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const initialNewSupplierState: Omit<Supplier, 'id'> = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplierData, setNewSupplierData] = useState(initialNewSupplierState);
  const { toast } = useToast();

  useEffect(() => {
    setSuppliers(DUMMY_SUPPLIERS);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSupplierData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!newSupplierData.name) {
      toast({ title: "خطأ", description: "اسم المورد مطلوب.", variant: "destructive" });
      return;
    }

    if (editingSupplier) {
      const updatedSupplier = { ...editingSupplier, ...newSupplierData };
      setSuppliers(suppliers.map(sup => sup.id === editingSupplier.id ? updatedSupplier : sup));
      const indexToUpdate = DUMMY_SUPPLIERS.findIndex(s => s.id === editingSupplier.id);
      if (indexToUpdate !== -1) DUMMY_SUPPLIERS[indexToUpdate] = updatedSupplier;
      toast({ title: "نجاح", description: `تم تحديث ${updatedSupplier.name}.` });
    } else {
      const newSupplierWithId: Supplier = {
        ...newSupplierData,
        id: `sup-${Date.now()}`,
      };
      setSuppliers([newSupplierWithId, ...suppliers]);
      DUMMY_SUPPLIERS.unshift(newSupplierWithId);
      toast({ title: "نجاح", description: `تمت إضافة ${newSupplierWithId.name}.` });
    }
    setIsDialogOpen(false);
    setEditingSupplier(null);
    setNewSupplierData(initialNewSupplierState);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplierData(supplier);
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = (supplierToDelete: Supplier) => {
    setSuppliers(suppliers.filter(sup => sup.id !== supplierToDelete.id));
    const indexToDelete = DUMMY_SUPPLIERS.findIndex(s => s.id === supplierToDelete.id);
    if (indexToDelete !== -1) DUMMY_SUPPLIERS.splice(indexToDelete, 1);
    toast({ title: "نجاح", description: `تم حذف ${supplierToDelete.name}.`, variant: "destructive" });
  };

  const openNewSupplierDialog = () => {
    setEditingSupplier(null);
    setNewSupplierData(initialNewSupplierState);
    setIsDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="إدارة الموردين"
        description="إضافة وتعديل وحذف الموردين."
        icon={Users}
        actions={
          <Button onClick={openNewSupplierDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 me-2" /> إضافة مورد جديد
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المورد</TableHead>
                <TableHead>شخص الاتصال</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length > 0 ? (
                suppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                       <Link href={`/inventory/suppliers/${supplier.id}`} className="text-primary hover:underline">
                        {supplier.name}
                      </Link>
                    </TableCell>
                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell className="text-center space-x-2 space-x-reverse">
                      <Button variant="ghost" size="icon" onClick={() => handleEditSupplier(supplier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplier(supplier)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    لا يوجد موردون مسجلون بعد.
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
            <DialogTitle>{editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'قم بتحديث تفاصيل هذا المورد.' : 'املأ تفاصيل المورد الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto ps-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left">اسم المورد</Label>
              <Input id="name" name="name" value={newSupplierData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactPerson" className="text-left">شخص الاتصال</Label>
              <Input id="contactPerson" name="contactPerson" value={newSupplierData.contactPerson || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-left">الهاتف</Label>
              <Input id="phone" name="phone" type="tel" value={newSupplierData.phone || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-left">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" value={newSupplierData.email || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="address" className="text-left pt-2">العنوان</Label>
              <Textarea id="address" name="address" value={newSupplierData.address || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingSupplier ? 'حفظ التغييرات' : 'إضافة مورد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
