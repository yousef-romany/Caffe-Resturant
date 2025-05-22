
"use client";

import { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { MenuItemCard } from '@/components/custom/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DUMMY_MENU_ITEMS, ITEM_CATEGORIES, type MenuItem, type Category } from '@/constants';
import { Search, ListFilter, Utensils, ShoppingCart, PlusCircle, MinusCircle, XCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Keep Card for MenuItemCard, remove if not used elsewhere
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

// Simplified OrderItem for client-side cart
interface CartItem extends MenuItem {
  quantity: number;
  cartItemId: string; // Unique ID for cart item instance
}

export default function CustomerMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'الكل'>('الكل');
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<{ id: string | null; number: string | null }>({ id: null, number: null });
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    setMenuItems(DUMMY_MENU_ITEMS);

    const tableIdFromStorage = localStorage.getItem('customer_selected_table_id');
    const tableNumberFromStorage = localStorage.getItem('customer_selected_table_number');
    if (tableIdFromStorage && tableNumberFromStorage) {
      setSelectedTable({ id: tableIdFromStorage, number: tableNumberFromStorage });
    }
  }, []);
  
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
    setIsSheetOpen(true); // Open sheet when item is added
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

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      toast({ title: "سلة الطلبات فارغة!", description: "الرجاء إضافة بعض العناصر أولاً.", variant: "destructive" });
      return;
    }
    console.log("Placing order:", cartItems, "for table:", selectedTable);
    toast({
      title: "تم إرسال الطلب بنجاح (تجريبي)",
      description: `إجمالي الطلب: $${cartSubtotal.toFixed(2)}. ${selectedTable.number ? `لطاولة رقم ${selectedTable.number}` : ''}`,
      className: "bg-green-500 text-white"
    });
    setCartItems([]); 
    setIsSheetOpen(false); // Close sheet after placing order
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="قائمة الطعام لدينا"
        description="تصفح أشهى المأكولات والمشروبات التي نقدمها."
        icon={Utensils}
      />
      
      {/* Cart Trigger Button - Positioned fixed or relatively as needed */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="fixed bottom-6 end-6 rtl:end-auto rtl:start-6 z-50 shadow-lg rounded-full p-4 h-auto bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setIsSheetOpen(true)}
          >
            <ShoppingCart className="h-6 w-6" />
            {cartItems.length > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 rtl:-left-1 rtl:-right-auto rounded-full px-1.5 py-0.5 text-xs">
                {cartItems.length}
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
                    <NextImage src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md h-10 w-10 object-cover flex-shrink-0" data-ai-hint={item.dataAiHint || "food item"}/>
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
              <Button onClick={handlePlaceOrder} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                إرسال الطلب (تجريبي)
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Menu Items Section */}
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

        {filteredMenuItems.length > 0 ? (
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
            {searchTerm || selectedCategory !== 'الكل' ? "لا توجد عناصر تطابق بحثك أو الفلتر المحدد." : "قائمة الطعام فارغة حاليًا. يرجى المحاولة لاحقًا!"}
          </p>
        )}
      </div>
    </div>
  );
}
