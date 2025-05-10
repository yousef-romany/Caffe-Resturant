
"use client";

import { useState, useMemo, useEffect } from 'react';
import NextImage from 'next/image'; // Renamed to avoid conflict
import { PageHeader } from '@/components/custom/PageHeader';
import { MenuItemCard } from '@/components/custom/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DUMMY_MENU_ITEMS, ITEM_CATEGORIES, type MenuItem, type OrderItem, type Category } from '@/constants';
import { Search, XCircle, MinusCircle, PlusCircle, DollarSign, ShoppingCart, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'الكل'>('الكل');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');

  const { toast } = useToast();

  const filteredItems = useMemo(() => {
    return DUMMY_MENU_ITEMS.filter(item =>
      (selectedCategory === 'الكل' || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedCategory]);

  const handleAddItemToOrder = (item: MenuItem) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
      ));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1 }]);
    }
    toast({ title: `تمت إضافة ${item.name} إلى الطلب.`});
  };

  const handleUpdateQuantity = (itemId: string, change: number) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(item => item !== null) as OrderItem[]);
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
  };
  
  const handleOpenEditNotesDialog = (item: OrderItem) => {
    setEditingItem(item);
    setItemNotes(item.notes || '');
  };

  const handleSaveItemNotes = () => {
    if (editingItem) {
      setCurrentOrder(currentOrder.map(item =>
        item.id === editingItem.id ? { ...item, notes: itemNotes } : item
      ));
      setEditingItem(null);
      setItemNotes('');
      toast({ title: `تم تحديث الملاحظات لـ ${editingItem.name}.`});
    }
  };


  const orderTotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [currentOrder]);

  const handleClearOrder = () => {
    setCurrentOrder([]);
    toast({ title: "تم مسح الطلب."});
  };

  const handlePlaceOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "لا يمكن إرسال طلب فارغ.", variant: "destructive" });
      return;
    }
    // Placeholder for actual order placement logic
    console.log("إرسال الطلب:", currentOrder, "الإجمالي:", orderTotal);
    toast({ title: "تم إرسال الطلب!", description: `الإجمالي: $${orderTotal.toFixed(2)}` });
    setCurrentOrder([]); // Clear order after placing
  };
  
  // Avoid hydration errors by delaying rendering of dynamic content
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 ps-3"> {/* Changed pr-3 to ps-3 for RTL */}
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
                <ul className="space-y-3">
                  {currentOrder.map(item => (
                    <li key={item.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                      <NextImage src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md h-10 w-10 object-cover" data-ai-hint={item.dataAiHint || "food item"}/>
                      <div className="flex-grow">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                        {item.notes && <p className="text-xs text-blue-600 italic">ملاحظات: {item.notes}</p>}
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
                       {editingItem && editingItem.id === item.id && (
                          <DialogContent>
                            <DialogHeader className="text-right">
                              <DialogTitle>تعديل الملاحظات لـ {editingItem.name}</DialogTitle>
                              <DialogDescription>إضافة أو تعديل ملاحظات لهذا العنصر.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="notes" className="text-left col-span-1">الملاحظات</Label> {/* Changed to text-left for RTL */}
                                <Textarea id="notes" value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} className="col-span-3" placeholder="مثال: جبنة إضافية، بدون سكر" />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingItem(null)}>إلغاء</Button>
                              <Button onClick={handleSaveItemNotes}>حفظ الملاحظات</Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveItem(item.id)}>
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
          {isClient && currentOrder.length > 0 && (
            <CardFooter className="flex flex-col gap-4 pt-4 border-t">
              <div className="w-full flex justify-between items-center text-lg font-semibold">
                <span>الإجمالي:</span>
                <span className="flex items-center">
                  <DollarSign className="h-5 w-5 me-1 text-primary" /> {/* Changed mr-1 to me-1 for RTL */}
                  {orderTotal.toFixed(2)}
                </span>
              </div>
              <div className="w-full grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleClearOrder} className="text-destructive border-destructive hover:bg-destructive/10">
                  مسح الطلب
                </Button>
                <Button onClick={handlePlaceOrder} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  إرسال الطلب
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  );
}
