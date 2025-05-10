
"use client";

import { useState, useMemo, useEffect } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { MenuItemCard } from '@/components/custom/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DUMMY_MENU_ITEMS, ITEM_CATEGORIES, type MenuItem, type OrderItem, type Category, DUMMY_ORDERS, type Order, type OrderType } from '@/constants';
import { Search, XCircle, MinusCircle, PlusCircle, DollarSign, ShoppingCart, Edit2, Receipt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'الكل'>('الكل');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [editingItemNotes, setEditingItemNotes] = useState<OrderItem | null>(null);
  const [itemNotesInput, setItemNotesInput] = useState('');

  const [orderType, setOrderType] = useState<OrderType | ''>('');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [generalOrderNotes, setGeneralOrderNotes] = useState('');
  
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);


  const { toast } = useToast();

  const filteredItems = useMemo(() => {
    return DUMMY_MENU_ITEMS.filter(item =>
      (selectedCategory === 'الكل' || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedCategory]);

  const handleAddItemToOrder = (item: MenuItem) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id && !orderItem.notes); // Only increment if no notes
    if (existingItem) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === item.id && !orderItem.notes ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
      ));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1 }]);
    }
    toast({ title: `تمت إضافة ${item.name} إلى الطلب.`});
  };

  const handleUpdateQuantity = (itemId: string, change: number) => {
     // Find the specific instance of the item, if multiple exist due to notes
    const itemIndex = currentOrder.findIndex(item => item.id === itemId); // This might need refinement if IDs are not unique enough with notes

    setCurrentOrder(currentOrder.map((item, index) => {
      if (item.id === itemId) { // Simpler: assumes item id is unique enough, or update first match. For specific notes, use a more complex ID.
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(item => item !== null) as OrderItem[]);
  };


  const handleRemoveItem = (itemToRemove: OrderItem) => {
    // To correctly remove an item that might have notes, we need a more specific identifier or remove the first match.
    // For simplicity, this removes the first item matching the ID. If items with notes are treated as unique entries,
    // this logic would need to compare the full item object or a unique instance ID.
    const itemIndexToRemove = currentOrder.findIndex(
      (item) => item.id === itemToRemove.id && item.notes === itemToRemove.notes
    );
    if (itemIndexToRemove > -1) {
      setCurrentOrder(currentOrder.filter((_, index) => index !== itemIndexToRemove));
    }
  };
  
  const handleOpenEditNotesDialog = (item: OrderItem) => {
    setEditingItemNotes(item);
    setItemNotesInput(item.notes || '');
  };

  const handleSaveItemNotes = () => {
    if (editingItemNotes) {
      // If item already exists with same notes, update its quantity.
      // If notes changed, or item with new notes doesn't exist, create/update appropriately.
      // This logic can get complex if you want to merge items vs. treat noted items as separate.
      // For now, assume we update the notes of the specific item instance passed to editingItemNotes.
      setCurrentOrder(currentOrder.map(item =>
        item === editingItemNotes ? { ...item, notes: itemNotesInput } : item
      ));
      setEditingItemNotes(null);
      setItemNotesInput('');
      toast({ title: `تم تحديث الملاحظات لـ ${editingItemNotes.name}.`});
    }
  };

  const orderTotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [currentOrder]);

  const resetPOSSession = () => {
    setCurrentOrder([]);
    setOrderType('');
    setTableNumber('');
    setCustomerName('');
    setDeliveryAddress('');
    setGeneralOrderNotes('');
    // searchTerm and selectedCategory can remain
  };

  const handleClearOrder = () => {
    resetPOSSession();
    toast({ title: "تم مسح الطلب."});
  };

  const handlePlaceOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "لا يمكن إرسال طلب فارغ.", variant: "destructive" });
      return;
    }
    if (!orderType) {
      toast({ title: "الرجاء اختيار نوع الطلب.", variant: "destructive" });
      return;
    }

    let orderSpecificsMet = true;
    let missingFieldMessage = "";

    if (orderType === 'صالة' && !tableNumber.trim()) {
      orderSpecificsMet = false;
      missingFieldMessage = "الرجاء إدخال رقم الطاولة لطلبات الصالة.";
    }
    if ((orderType === 'سفري' || orderType === 'توصيل') && !customerName.trim()) {
      orderSpecificsMet = false;
      missingFieldMessage = "الرجاء إدخال اسم العميل لطلبات السفري والتوصيل.";
    }
    if (orderType === 'توصيل' && !deliveryAddress.trim()) {
      orderSpecificsMet = false;
      missingFieldMessage = "الرجاء إدخال عنوان التوصيل لطلبات التوصيل.";
    }

    if (!orderSpecificsMet) {
      toast({ title: "بيانات الطلب غير مكتملة", description: missingFieldMessage, variant: "destructive" });
      return;
    }

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: `طلب-${Date.now().toString().slice(-5)}`,
      items: JSON.parse(JSON.stringify(currentOrder)), // Deep copy
      totalAmount: orderTotal,
      status: 'قيد الانتظار',
      type: orderType as OrderType,
      createdAt: new Date(),
      notes: generalOrderNotes.trim() || undefined,
    };

    if (orderType === 'صالة') newOrder.tableNumber = tableNumber.trim();
    if (orderType === 'سفري' || orderType === 'توصيل') newOrder.customerName = customerName.trim();
    if (orderType === 'توصيل') newOrder.deliveryAddress = deliveryAddress.trim();

    DUMMY_ORDERS.unshift(newOrder);

    setConfirmedOrder(newOrder);
    setIsInvoiceDialogOpen(true);

    toast({ title: "تم إرسال الطلب للمطبخ", description: `طلب رقم ${newOrder.orderNumber}. جاري تجهيز الفاتورة.` });
  };
  
  const handleCloseInvoiceDialogAndClearPOS = () => {
    setIsInvoiceDialogOpen(false);
    setConfirmedOrder(null);
    resetPOSSession();
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <>
      <PageHeader title="نقطة البيع" description="أنشئ طلبات جديدة بسرعة." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Menu Items Section */}
        <div className="lg:col-span-2 flex flex-col h-full bg-card p-4 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث عن العناصر..."
                className="pe-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={selectedCategory === 'الكل' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('الكل')}
                className="shrink-0"
              >
                الكل
              </Button>
              {ITEM_CATEGORIES.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className="shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-grow">
            {isClient && filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 ps-3">
                {filteredItems.map(item => (
                  <MenuItemCard key={item.id} item={item} onAddToCart={handleAddItemToOrder} variant="display" />
                ))}
              </div>
            ) : isClient ? (
              <p className="text-center text-muted-foreground py-10">لا توجد عناصر تطابق معاييرك.</p>
            ) : (
               <p className="text-center text-muted-foreground py-10">جارٍ تحميل العناصر...</p>
            )}
          </ScrollArea>
        </div>

        {/* Current Order Section */}
        <Card className="flex flex-col h-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              الطلب الحالي
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="py-0">
              {isClient && currentOrder.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">لا توجد عناصر في الطلب بعد.</p>
              ) : isClient ? (
                <ul className="space-y-3 p-3">
                  {currentOrder.map((item, idx) => ( // Added idx for a unique key if needed for items with notes
                    <li key={`${item.id}-${idx}`} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-md">
                      <NextImage src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md h-10 w-10 object-cover flex-shrink-0" data-ai-hint={item.dataAiHint || "food item"}/>
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                        {item.notes && <p className="text-xs text-blue-600 italic mt-0.5">ملاحظات: {item.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, -1)}>
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="font-medium w-5 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, 1)}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditNotesDialog(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                       {editingItemNotes === item && ( // Check if this specific item instance is being edited
                          <DialogContent>
                            <DialogHeader className="text-right">
                              <DialogTitle>تعديل الملاحظات لـ {editingItemNotes.name}</DialogTitle>
                              <DialogDescription>إضافة أو تعديل ملاحظات لهذا العنصر.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-1 items-center gap-4">
                                <Label htmlFor="itemNotesInput" className="text-left">الملاحظات</Label>
                                <Textarea id="itemNotesInput" value={itemNotesInput} onChange={(e) => setItemNotesInput(e.target.value)} placeholder="مثال: جبنة إضافية، بدون سكر" />
                              </div>
                            </div>
                            <DialogFooter>
                               <DialogClose asChild>
                                <Button variant="outline" onClick={() => setEditingItemNotes(null)}>إلغاء</Button>
                              </DialogClose>
                              <Button onClick={handleSaveItemNotes}>حفظ الملاحظات</Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveItem(item)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-10">جارٍ تحميل الطلب...</p>
              )}
            </CardContent>
          </ScrollArea>
          
          {isClient && (
            <>
            <div className="space-y-3 p-4 border-t">
              <div>
                <Label htmlFor="orderType">نوع الطلب</Label>
                <Select value={orderType} onValueChange={(value) => setOrderType(value as OrderType | '')}>
                  <SelectTrigger id="orderType" className="mt-1">
                    <SelectValue placeholder="اختر نوع الطلب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="صالة">صالة</SelectItem>
                    <SelectItem value="سفري">سفري</SelectItem>
                    <SelectItem value="توصيل">توصيل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === 'صالة' && (
                <div>
                  <Label htmlFor="tableNumber">رقم الطاولة</Label>
                  <Input id="tableNumber" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="أدخل رقم الطاولة" className="mt-1" />
                </div>
              )}

              {(orderType === 'سفري' || orderType === 'توصيل') && (
                <div>
                  <Label htmlFor="customerName">اسم العميل</Label>
                  <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسم العميل" className="mt-1" />
                </div>
              )}

              {orderType === 'توصيل' && (
                <div>
                  <Label htmlFor="deliveryAddress">عنوان التوصيل</Label>
                  <Input id="deliveryAddress" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="أدخل عنوان التوصيل" className="mt-1" />
                </div>
              )}
              <div>
                  <Label htmlFor="generalOrderNotes">ملاحظات الطلب</Label>
                  <Textarea id="generalOrderNotes" value={generalOrderNotes} onChange={(e) => setGeneralOrderNotes(e.target.value)} placeholder="ملاحظات إضافية على الطلب بالكامل (اختياري)" className="mt-1"/>
              </div>
            </div>

            <CardFooter className="flex flex-col gap-4 pt-4 border-t">
              <div className="w-full flex justify-between items-center text-lg font-semibold">
                <span>الإجمالي:</span>
                <span className="flex items-center">
                  <DollarSign className="h-5 w-5 me-1 text-primary" />
                  {orderTotal.toFixed(2)}
                </span>
              </div>
              <div className="w-full grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleClearOrder} className="text-destructive border-destructive hover:bg-destructive/10">
                  مسح الطلب
                </Button>
                <Button onClick={handlePlaceOrder} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={currentOrder.length === 0}>
                  إرسال الطلب
                </Button>
              </div>
            </CardFooter>
            </>
          )}
        </Card>
      </div>

      {confirmedOrder && (
        <Dialog open={isInvoiceDialogOpen} onOpenChange={(open) => { if(!open) handleCloseInvoiceDialogAndClearPOS(); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary"/>
                فاتورة الطلب: {confirmedOrder.orderNumber}
              </DialogTitle>
              <DialogDescription>
                التاريخ: {format(new Date(confirmedOrder.createdAt), 'PPpp', { locale: arSA })}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto ps-2 space-y-4">
              <p><strong>الحالة:</strong> <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs">{confirmedOrder.status}</span></p>
              <p><strong>النوع:</strong> {confirmedOrder.type}</p>
              {confirmedOrder.type === 'صالة' && confirmedOrder.tableNumber && <p><strong>الطاولة:</strong> {confirmedOrder.tableNumber}</p>}
              {confirmedOrder.customerName && <p><strong>العميل:</strong> {confirmedOrder.customerName}</p>}
              {confirmedOrder.type === 'توصيل' && confirmedOrder.deliveryAddress && <p><strong>العنوان:</strong> {confirmedOrder.deliveryAddress}</p>}
              {confirmedOrder.notes && <p><strong>ملاحظات الطلب:</strong> {confirmedOrder.notes}</p>}
              
              <h4 className="font-semibold mt-4">العناصر:</h4>
              <ul className="space-y-2">
                {confirmedOrder.items.map((item, idx) => (
                  <li key={`${item.id}-${idx}`} className="flex items-start gap-3 p-2 border rounded-md">
                    <NextImage src={item.imageUrl} alt={item.name} width={50} height={50} className="rounded-md h-12 w-12 object-cover" data-ai-hint={item.dataAiHint || "food item"}/>
                    <div className="flex-grow">
                      <p className="font-medium">{item.name} <span className="text-muted-foreground text-sm">x {item.quantity}</span></p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} لكل عنصر</p>
                      {item.notes && <p className="text-xs text-blue-600 italic">ملاحظات: {item.notes}</p>}
                    </div>
                    <p className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                  </li>
                ))}
              </ul>
              <Separator className="my-3"/>
              <div className="flex justify-start items-center">
                <p className="text-lg font-bold">الإجمالي: ${confirmedOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseInvoiceDialogAndClearPOS}>
                إغلاق
              </Button>
              <Button type="button" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => { /* Placeholder for payment */ toast({title: "تمت المحاسبة (تجريبي)"}); handleCloseInvoiceDialogAndClearPOS(); }}>
                محاسبة ودفع
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

