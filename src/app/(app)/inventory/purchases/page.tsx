
"use client";

import { useState, useEffect, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { DUMMY_PURCHASE_ORDERS, DUMMY_SUPPLIERS, DUMMY_INGREDIENTS, type PurchaseOrder, type PurchaseOrderItem, type Supplier, type Ingredient, type IngredientUnit, type PurchaseOrderStatus, INGREDIENT_UNITS } from '@/constants';
import { PlusCircle, Edit, Trash2, ListChecks, PackagePlus, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import NextImage from 'next/image';

const initialNewPurchaseOrderState: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'totalAmount'> & { orderDate: string; expectedDeliveryDate?: string } = {
  supplierId: '',
  supplierName: '', // Will be populated based on supplierId
  items: [],
  status: 'معلق',
  orderDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: '',
  notes: '',
};

const PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = ['معلق', 'مؤكد', 'مستلم', 'ملغى'];

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [newPurchaseOrderData, setNewPurchaseOrderData] = useState(initialNewPurchaseOrderState);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPurchaseOrder, setViewingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPurchaseOrders(DUMMY_PURCHASE_ORDERS.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
    setSuppliers(DUMMY_SUPPLIERS);
    setIngredients(DUMMY_INGREDIENTS);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPurchaseOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierChange = (supplierId: string) => {
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    setNewPurchaseOrderData(prev => ({ 
      ...prev, 
      supplierId: supplierId,
      supplierName: selectedSupplier ? selectedSupplier.name : ''
    }));
  };
  
  const handleStatusChange = (status: PurchaseOrderStatus) => {
     setNewPurchaseOrderData(prev => ({ ...prev, status }));
  };

  const handleAddItemToPO = () => {
    setNewPurchaseOrderData(prev => ({
      ...prev,
      items: [...prev.items, { ingredientId: '', ingredientName: '', quantity: 1, costPerUnit: 0, unit: INGREDIENT_UNITS[0] }]
    }));
  };

  const handlePOItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    setNewPurchaseOrderData(prev => {
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'ingredientId') {
            const selectedIngredient = ingredients.find(ing => ing.id === value);
            updatedItem.ingredientName = selectedIngredient ? selectedIngredient.name : '';
            updatedItem.unit = selectedIngredient ? selectedIngredient.unit : INGREDIENT_UNITS[0];
            updatedItem.costPerUnit = selectedIngredient ? selectedIngredient.costPerUnit : 0;
          }
          if (field === 'quantity' || field === 'costPerUnit') {
             updatedItem[field as 'quantity' | 'costPerUnit'] = parseFloat(value as string) || 0;
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };
  
  const handlePOItemUnitChange = (index: number, unit: IngredientUnit) => {
    setNewPurchaseOrderData(prev => ({
        ...prev,
        items: prev.items.map((item, i) => i === index ? {...item, unit} : item)
    }));
  };

  const handleRemoveItemFromPO = (index: number) => {
    setNewPurchaseOrderData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };
  
  const calculateTotalAmount = (items: PurchaseOrderItem[]): number => {
    return items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  };

  const handleSubmit = () => {
    if (!newPurchaseOrderData.supplierId || newPurchaseOrderData.items.length === 0) {
      toast({ title: "خطأ", description: "يجب تحديد مورد وإضافة عنصر واحد على الأقل.", variant: "destructive" });
      return;
    }
    for (const item of newPurchaseOrderData.items) {
        if(!item.ingredientId || item.quantity <=0 || item.costPerUnit < 0){
            toast({ title: "خطأ في العناصر", description: "يرجى تحديد مكون وكمية وتكلفة صالحة لكل عنصر.", variant: "destructive" });
            return;
        }
    }

    const totalAmount = calculateTotalAmount(newPurchaseOrderData.items);
    const purchaseOrderDataToSave : Omit<PurchaseOrder, 'id' | 'orderNumber'> = {
        ...newPurchaseOrderData,
        orderDate: new Date(newPurchaseOrderData.orderDate),
        expectedDeliveryDate: newPurchaseOrderData.expectedDeliveryDate ? new Date(newPurchaseOrderData.expectedDeliveryDate) : undefined,
        totalAmount,
    };


    if (editingPurchaseOrder) {
      const updatedPurchaseOrder = { ...editingPurchaseOrder, ...purchaseOrderDataToSave };
      setPurchaseOrders(purchaseOrders.map(po => po.id === editingPurchaseOrder.id ? updatedPurchaseOrder : po));
      // Update DUMMY_PURCHASE_ORDERS if it's being used directly
      const indexToUpdate = DUMMY_PURCHASE_ORDERS.findIndex(p => p.id === editingPurchaseOrder.id);
      if (indexToUpdate !== -1) DUMMY_PURCHASE_ORDERS[indexToUpdate] = updatedPurchaseOrder;
      toast({ title: "نجاح", description: `تم تحديث أمر الشراء ${updatedPurchaseOrder.orderNumber}.` });
    } else {
      const newPurchaseOrderWithId: PurchaseOrder = {
        ...purchaseOrderDataToSave,
        id: `po-${Date.now()}`,
        orderNumber: `PO-${Date.now().toString().slice(-5)}`,
      };
      setPurchaseOrders([newPurchaseOrderWithId, ...purchaseOrders]);
      DUMMY_PURCHASE_ORDERS.unshift(newPurchaseOrderWithId);
      toast({ title: "نجاح", description: `تم إنشاء أمر الشراء ${newPurchaseOrderWithId.orderNumber}.` });
    }
    setIsDialogOpen(false);
    setEditingPurchaseOrder(null);
    setNewPurchaseOrderData(initialNewPurchaseOrderState);
  };

  const handleEditPurchaseOrder = (po: PurchaseOrder) => {
    setEditingPurchaseOrder(po);
    setNewPurchaseOrderData({
        ...po,
        orderDate: format(new Date(po.orderDate), 'yyyy-MM-dd'),
        expectedDeliveryDate: po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'yyyy-MM-dd') : '',
    });
    setIsDialogOpen(true);
  };

  const handleDeletePurchaseOrder = (poToDelete: PurchaseOrder) => {
    setPurchaseOrders(purchaseOrders.filter(po => po.id !== poToDelete.id));
    const indexToDelete = DUMMY_PURCHASE_ORDERS.findIndex(p => p.id === poToDelete.id);
    if (indexToDelete !== -1) DUMMY_PURCHASE_ORDERS.splice(indexToDelete, 1);
    toast({ title: "نجاح", description: `تم حذف أمر الشراء ${poToDelete.orderNumber}.`, variant: "destructive" });
  };

  const openNewPurchaseOrderDialog = () => {
    setEditingPurchaseOrder(null);
    setNewPurchaseOrderData(initialNewPurchaseOrderState);
    setIsDialogOpen(true);
  };

  const handleViewPurchaseOrder = (po: PurchaseOrder) => {
    setViewingPurchaseOrder(po);
    setIsViewDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'مستلم': return 'default'; // Green
      case 'مؤكد': return 'secondary'; // Blueish
      case 'معلق': return 'outline'; // Yellowish/Orange
      case 'ملغى': return 'destructive'; // Red
      default: return 'outline';
    }
  };
  
  const displayedTotalAmount = useMemo(() => {
    return calculateTotalAmount(newPurchaseOrderData.items);
  }, [newPurchaseOrderData.items]);

  return (
    <>
      <PageHeader
        title="إدارة أوامر الشراء"
        description="إنشاء وتتبع أوامر الشراء من الموردين."
        icon={ListChecks}
        actions={
          <Button onClick={openNewPurchaseOrderDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 me-2" /> إنشاء أمر شراء جديد
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>تاريخ الطلب</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-left">الإجمالي ($)</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length > 0 ? (
                purchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.orderNumber}</TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell>{format(new Date(po.orderDate), 'PP', { locale: arSA })}</TableCell>
                    <TableCell className="text-center">
                         <span className={`text-xs px-2 py-0.5 rounded-full ${
                            po.status === 'مستلم' ? 'bg-green-100 text-green-700' : 
                            po.status === 'مؤكد' ? 'bg-blue-100 text-blue-700' :
                            po.status === 'معلق' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700' // For 'ملغى'
                        }`}>{po.status}</span>
                    </TableCell>
                    <TableCell className="text-left">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center space-x-2 space-x-reverse">
                      <Button variant="ghost" size="icon" onClick={() => handleViewPurchaseOrder(po)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditPurchaseOrder(po)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePurchaseOrder(po)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    لا توجد أوامر شراء مسجلة بعد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPurchaseOrder ? 'تعديل أمر الشراء' : 'إنشاء أمر شراء جديد'}</DialogTitle>
            <DialogDescription>
              {editingPurchaseOrder ? 'قم بتحديث تفاصيل أمر الشراء هذا.' : 'املأ تفاصيل أمر الشراء الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto ps-2 pe-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="supplierId">المورد</Label>
                    <Select name="supplierId" value={newPurchaseOrderData.supplierId} onValueChange={handleSupplierChange}>
                        <SelectTrigger id="supplierId">
                        <SelectValue placeholder="اختر المورد" />
                        </SelectTrigger>
                        <SelectContent>
                        {suppliers.map(sup => (
                            <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="orderDate">تاريخ الطلب</Label>
                    <Input id="orderDate" name="orderDate" type="date" value={newPurchaseOrderData.orderDate} onChange={handleInputChange} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="expectedDeliveryDate">تاريخ التسليم المتوقع</Label>
                    <Input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" value={newPurchaseOrderData.expectedDeliveryDate || ''} onChange={handleInputChange} />
                </div>
                <div>
                    <Label htmlFor="statusPo">حالة الطلب</Label>
                     <Select name="statusPo" value={newPurchaseOrderData.status} onValueChange={handleStatusChange}>
                        <SelectTrigger id="statusPo">
                        <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                        {PURCHASE_ORDER_STATUSES.map(stat => (
                            <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea id="notes" name="notes" value={newPurchaseOrderData.notes || ''} onChange={handleInputChange} placeholder="اختياري"/>
            </div>

            <h3 className="text-lg font-medium mt-4 mb-2 text-center">عناصر أمر الشراء</h3>
            {newPurchaseOrderData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 items-end gap-2 p-3 border rounded-md">
                <div className="col-span-4">
                  <Label htmlFor={`ingredientId-${index}`}>المكون</Label>
                  <Select value={item.ingredientId} onValueChange={(value) => handlePOItemChange(index, 'ingredientId', value)}>
                    <SelectTrigger id={`ingredientId-${index}`}>
                      <SelectValue placeholder="اختر المكون" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`quantity-${index}`}>الكمية</Label>
                  <Input id={`quantity-${index}`} type="number" value={item.quantity} onChange={(e) => handlePOItemChange(index, 'quantity', e.target.value)} min="0.01" step="0.01" />
                </div>
                 <div className="col-span-3">
                    <Label htmlFor={`unit-${index}`}>الوحدة</Label>
                    <Select 
                      value={item.unit} 
                      onValueChange={(value) => handlePOItemUnitChange(index, value as IngredientUnit)}
                    >
                      <SelectTrigger id={`unit-${index}`}>
                        <SelectValue placeholder="الوحدة" />
                      </SelectTrigger>
                      <SelectContent>
                        {INGREDIENT_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                <div className="col-span-2">
                  <Label htmlFor={`costPerUnit-${index}`}>تكلفة الوحدة</Label>
                  <Input id={`costPerUnit-${index}`} type="number" value={item.costPerUnit} onChange={(e) => handlePOItemChange(index, 'costPerUnit', e.target.value)} min="0" step="0.01" />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromPO(index)} className="text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddItemToPO} className="mt-2">
              <PackagePlus className="h-4 w-4 me-2" /> إضافة عنصر للطلب
            </Button>
            <div className="mt-4 text-left font-semibold text-lg">
                الإجمالي: ${displayedTotalAmount.toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingPurchaseOrder ? 'حفظ التغييرات' : 'إنشاء أمر شراء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Purchase Order Dialog */}
      {viewingPurchaseOrder && (
         <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                 <DialogHeader>
                    <DialogTitle>تفاصيل أمر الشراء: {viewingPurchaseOrder.orderNumber}</DialogTitle>
                    <DialogDescription>
                        المورد: {viewingPurchaseOrder.supplierName} - تاريخ الطلب: {format(new Date(viewingPurchaseOrder.orderDate), 'PP', {locale: arSA})}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-[60vh] overflow-y-auto ps-2 space-y-3">
                    <p><strong>الحالة:</strong> <span className={`text-xs px-2 py-0.5 rounded-full ${
                            viewingPurchaseOrder.status === 'مستلم' ? 'bg-green-100 text-green-700' : 
                            viewingPurchaseOrder.status === 'مؤكد' ? 'bg-blue-100 text-blue-700' :
                            viewingPurchaseOrder.status === 'معلق' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>{viewingPurchaseOrder.status}</span></p>
                    {viewingPurchaseOrder.expectedDeliveryDate && <p><strong>تاريخ التسليم المتوقع:</strong> {format(new Date(viewingPurchaseOrder.expectedDeliveryDate), 'PP', {locale: arSA})}</p>}
                    {viewingPurchaseOrder.receivedDate && <p><strong>تاريخ الاستلام:</strong> {format(new Date(viewingPurchaseOrder.receivedDate), 'PP', {locale: arSA})}</p>}
                    {viewingPurchaseOrder.notes && <p><strong>ملاحظات:</strong> {viewingPurchaseOrder.notes}</p>}

                    <h4 className="font-semibold mt-3">العناصر:</h4>
                    <ul className="space-y-2">
                        {viewingPurchaseOrder.items.map((item, index) => (
                             <li key={index} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">{item.ingredientName}</p>
                                    <p className="text-sm text-muted-foreground">الكمية: {item.quantity} {item.unit}</p>
                                </div>
                                <p className="text-sm">التكلفة: ${(item.quantity * item.costPerUnit).toFixed(2)}</p>
                            </li>
                        ))}
                    </ul>
                    <div className="text-left font-bold text-lg mt-3 pt-3 border-t">
                        الإجمالي: ${viewingPurchaseOrder.totalAmount.toFixed(2)}
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">إغلاق</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      )}
    </>
  );
}

