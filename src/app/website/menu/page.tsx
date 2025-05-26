
"use client";

import { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { MenuItemCard } from '@/components/custom/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ITEM_CATEGORIES, type MenuItem, type Category, type OrderType } from '@/constants';
import { Search, ListFilter, Utensils, ShoppingCart, PlusCircle, MinusCircle, XCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

interface CartItem extends MenuItem {
  quantity: number;
  cartItemId: string; 
}

export default function CustomerMenuPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'الكل'>('الكل');
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<{ id: string | null; number: string | null }>({ id: null, number: null });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    async function initializeDbAndLoadMenu() {
      try {
        const dbInstance = await getDb;
        setDbInstance(dbInstance);
        if (dbInstance) {
          await fetchMenuItems(dbInstance);
        } else {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing DB for customer menu:", error);
        toast({ title: "خطأ في التهيئة", description: "فشل تهيئة قاعدة البيانات لعرض القائمة.", variant: "destructive" });
        setIsLoading(false);
      }
    }
    initializeDbAndLoadMenu();

    const tableIdFromStorage = localStorage.getItem('customer_selected_table_id');
    const tableNumberFromStorage = localStorage.getItem('customer_selected_table_number');
    if (tableIdFromStorage && tableNumberFromStorage) {
      setSelectedTable({ id: tableIdFromStorage, number: tableNumberFromStorage });
    }
  }, [toast]); 

  const fetchMenuItems = async (currentDb: Database) => {
    setIsLoading(true);
    try {
      const itemsData: any[] = await currentDb.select(
        "SELECT id, name, category, price, cost, image_url as imageUrl, description, data_ai_hint as dataAiHint, is_available FROM menu_items WHERE is_available = TRUE ORDER BY category, name"
      );
      setMenuItems(itemsData.map(item => ({
        ...item, 
        price: Number(item.price), 
        cost: item.cost ? Number(item.cost) : undefined,
        is_available: Boolean(item.is_available) 
      })));
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({ title: "خطأ", description: "فشل في جلب عناصر القائمة من قاعدة البيانات.", variant: "destructive" });
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === 'الكل' || item.category === selectedCategory)
    );
  }, [menuItems, searchTerm, selectedCategory]);

  const handleAddToCart = (item: MenuItem) => {
    setCartItems(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.id === item.id);
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1,
        };
        return updatedCart;
      } else {
        return [...prevCart, { ...item, quantity: 1, cartItemId: `${item.id}-${Date.now()}` }];
      }
    });
    toast({
      title: `تمت إضافة "${item.name}" إلى سلة الطلبات.`,
    });
    if (!isSheetOpen) {
      setIsSheetOpen(true); 
    }
  };

  const handleUpdateCartQuantity = (cartItemId: string, change: number) => {
    setCartItems(prevCart =>
      prevCart
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(item => item !== null) as CartItem[]
    );
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCartItems(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
    toast({
      title: "تم إزالة العنصر من السلة.",
      variant: "destructive"
    });
  };

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({ title: "سلة الطلبات فارغة!", description: "الرجاء إضافة بعض العناصر أولاً.", variant: "destructive" });
      return;
    }
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة. لا يمكن إرسال الطلب.", variant: "destructive" });
      return;
    }

    setIsPlacingOrder(true);

    const newOrderId = `cust-order-${Date.now()}`;
    const newOrderNumber = `CUST-${Date.now().toString().slice(-6)}`;
    const orderType: OrderType = selectedTable.id ? 'صالة' : 'سفري'; 
    const now = new Date().toISOString();
    const totalAmount = cartSubtotal; 

    try {
      await db.execute(
        "INSERT INTO orders (id, order_number, type, subtotal, total_amount, status, created_at, updated_at, table_id, customer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newOrderId, newOrderNumber, orderType,
          cartSubtotal, totalAmount, 'قيد الانتظار',
          now, now, selectedTable.id || null,
          selectedTable.id ? `طاولة ${selectedTable.number}` : 'عميل سفري' 
        ]
      );

      for (const item of cartItems) {
        const menuItemFromDb: any[] = await db.select("SELECT cost FROM menu_items WHERE id = ?", [item.id]);
        const costAtOrder = menuItemFromDb.length > 0 ? Number(menuItemFromDb[0].cost) || 0 : 0;

        await db.execute(
          "INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, quantity, price_at_order, cost_at_order, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            `oi-cust-${Date.now()}-${item.id}`, newOrderId, item.id, item.name,
            item.quantity, item.price, costAtOrder, (item as any).notes || null 
          ]
        );
      }

      if (selectedTable.id) {
        await db.execute(
          "UPDATE tables_info SET status = 'مشغولة', current_order_id = ?, updated_at = ? WHERE id = ?",
          [newOrderId, now, selectedTable.id]
        );
      }

      toast({
        title: "تم إرسال الطلب بنجاح!",
        description: `رقم طلبك هو: ${newOrderNumber}. ${selectedTable.number ? `لطاولة رقم ${selectedTable.number}` : ''}`,
        className: "bg-green-500 text-white"
      });

      setCartItems([]);
      if (selectedTable.id) {
        localStorage.removeItem('customer_selected_table_id');
        localStorage.removeItem('customer_selected_table_number');
        setSelectedTable({ id: null, number: null });
      }
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Error placing order:", error);
      toast({ title: "خطأ في إرسال الطلب", description: "حدث خطأ أثناء محاولة إرسال طلبك. يرجى المحاولة مرة أخرى.", variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="قائمة الطعام لدينا"
        description="تصفح أشهى المأكولات والمشروبات التي نقدمها."
        icon={Utensils}
      />
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="fixed bottom-6 end-6 rtl:end-auto rtl:start-6 z-50 shadow-lg rounded-full p-4 h-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartItems.length > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 rtl:-left-1 rtl:-right-auto rounded-full px-1.5 py-0.5 text-xs">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </Badge>
            )}
            <span className="sr-only">عرض سلة الطلبات</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col" side={typeof document !== 'undefined' && document.documentElement.dir === 'rtl' ? 'left' : 'right'}>
          <SheetHeader className="text-right rtl:text-left">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              سلة طلباتك
            </SheetTitle>
            {selectedTable.number && (
              <Badge variant="outline" className="mt-1 w-fit">طاولة رقم: {selectedTable.number}</Badge>
            )}
          </SheetHeader>
          <ScrollArea className="flex-grow my-4">
            {cartItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">سلة الطلبات فارغة.</p>
            ) : (
              <ul className="space-y-3 p-1">
                {cartItems.map((item) => (
                  <li key={item.cartItemId} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-md">
                    <NextImage src={item.imageUrl || "https://placehold.co/40x40.png"} alt={item.name} width={40} height={40} className="rounded-md h-10 w-10 object-cover flex-shrink-0" data-ai-hint={item.dataAiHint || "food item"}/>
                    <div className="flex-grow">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateCartQuantity(item.cartItemId, -1)}>
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="font-medium w-5 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateCartQuantity(item.cartItemId, 1)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveFromCart(item.cartItemId)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
          {cartItems.length > 0 && (
            <SheetFooter className="flex flex-col gap-3 pt-4 border-t">
              <div className="w-full flex justify-between items-center text-lg font-semibold">
                <span>الإجمالي الفرعي:</span>
                <span className="flex items-center">
                  <DollarSign className="h-5 w-5 me-1 text-primary" />
                  {cartSubtotal.toFixed(2)}
                </span>
              </div>
              <Button onClick={handlePlaceOrder} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPlacingOrder}>
                {isPlacingOrder ? 'جارٍ إرسال الطلب...' : 'إرسال الطلب'}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
      
      <div>
        <div className="mb-6 p-4 bg-card rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:left-3 rtl:right-auto" />
              <Input 
                type="search"
                placeholder="ابحث في عناصر القائمة..."
                className="pe-10 rtl:ps-10 rtl:pe-3 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <ListFilter className="h-5 w-5 text-muted-foreground me-2 shrink-0"/>
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
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-10 text-lg">جارٍ تحميل عناصر القائمة...</p>
        ) : filteredMenuItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenuItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
                variant="display"
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10 text-lg">
            {menuItems.length === 0 ? "قائمة الطعام فارغة حاليًا. يرجى المحاولة لاحقًا!" : "لا توجد عناصر تطابق بحثك أو الفلتر المحدد."}
          </p>
        )}
      </div>
    </div>
  );
}

    