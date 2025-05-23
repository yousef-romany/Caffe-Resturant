
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
import type { Supplier } from '@/constants';
import { PlusCircle, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

const initialNewSupplierState: Omit<Supplier, 'id'> = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
};

export default function SuppliersPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplierData, setNewSupplierData] = useState(initialNewSupplierState);
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
        await fetchSuppliers(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch data:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات الموردين.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadDbAndFetchData();
  }, [toast]);

  const fetchSuppliers = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const fetchedSuppliers: Supplier[] = await currentDb.select('SELECT id, name, contact_person as contactPerson, phone, email, address FROM suppliers ORDER BY name');
      setSuppliers(fetchedSuppliers.map(s => ({
        ...s,
        contactPerson: s.contactPerson || undefined,
        phone: s.phone || undefined,
        email: s.email || undefined,
        address: s.address || undefined,
      })));
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات الموردين.", variant: "destructive" });
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSupplierData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    if (!newSupplierData.name) {
      toast({ title: "خطأ", description: "اسم المورد مطلوب.", variant: "destructive" });
      return;
    }

    const supplierDataToSave = {
      name: newSupplierData.name,
      contact_person: newSupplierData.contactPerson || null,
      phone: newSupplierData.phone || null,
      email: newSupplierData.email || null,
      address: newSupplierData.address || null,
    };

    try {
      if (editingSupplier) {
        await db.execute(
          'UPDATE suppliers SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
          [supplierDataToSave.name, supplierDataToSave.contact_person, supplierDataToSave.phone, supplierDataToSave.email, supplierDataToSave.address, editingSupplier.id]
        );
        toast({ title: "نجاح", description: `تم تحديث بيانات المورد ${supplierDataToSave.name}.` });
      } else {
        const newSupplierId = `sup-${Date.now()}`;
        await db.execute(
          'INSERT INTO suppliers (id, name, contact_person, phone, email, address) VALUES ($1, $2, $3, $4, $5, $6)',
          [newSupplierId, supplierDataToSave.name, supplierDataToSave.contact_person, supplierDataToSave.phone, supplierDataToSave.email, supplierDataToSave.address]
        );
        toast({ title: "نجاح", description: `تمت إضافة المورد ${supplierDataToSave.name}.` });
      }
      setIsDialogOpen(false);
      setEditingSupplier(null);
      setNewSupplierData(initialNewSupplierState);
      await fetchSuppliers(db);
    } catch (error) {
      console.error("Error submitting supplier:", error);
      toast({ title: "خطأ في الحفظ", description: "فشل حفظ بيانات المورد.", variant: "destructive" });
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplierData({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = async (supplierToDelete: Supplier) => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    try {
      await db.execute('DELETE FROM suppliers WHERE id = $1', [supplierToDelete.id]);
      toast({ title: "نجاح", description: `تم حذف المورد ${supplierToDelete.name}.`, variant: "destructive" });
      await fetchSuppliers(db);
    } catch (error: any) {
      console.error("Error deleting supplier:", error);
      if (error.message && (error.message.toLowerCase().includes("constraint failed") || error.message.toLowerCase().includes("foreign key constraint fails"))) {
        toast({ title: "خطأ في الحذف", description: "لا يمكن حذف المورد لأنه مرتبط ببيانات أخرى (مثل مكونات أو أوامر شراء).", variant: "destructive" });
      } else {
        toast({ title: "خطأ في الحذف", description: "فشل حذف المورد.", variant: "destructive" });
      }
    }
  };

  const openNewSupplierDialog = () => {
    setEditingSupplier(null);
    setNewSupplierData(initialNewSupplierState);
    setIsDialogOpen(true);
  };

  const handleViewSupplierDetails = (supplierId: string) => {
    localStorage.setItem('selectedSupplierId', supplierId);
    router.push('/inventory/suppliers/supplier');
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
          {isLoading ? (
            <p className="text-center text-muted-foreground p-10">جارٍ تحميل بيانات الموردين...</p>
          ) : (
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
                        <Button
                          variant="link"
                          onClick={() => handleViewSupplierDetails(supplier.id)}
                          className="text-primary hover:underline p-0 h-auto"
                        >
                          {supplier.name}
                        </Button>
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
          )}
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
    

    