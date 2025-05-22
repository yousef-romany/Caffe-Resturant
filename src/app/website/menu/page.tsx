
"use client";

import { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { MenuItemCard } from '@/components/custom/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DUMMY_MENU_ITEMS, ITEM_CATEGORIES, type MenuItem, type Category, type OrderItem as AppOrderItem } from '@/constants'; // Renamed OrderItem to AppOrderItem
import { Search, ListFilter, Utensils, ShoppingCart, PlusCircle, MinusCircle, XCircle, Edit2, Trash2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Simplified OrderItem for client-side cart
interface CartItem extends MenuItem {
  quantity: number;
  cartItemId: string; // Unique ID for cart item instance (e.g., item.id + timestamp or notes hash)
}

export default function CustomerMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'الكل'>('الكل');
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<{ id: string | null; number: string | null }>({ id: null, number: null });

  useEffect(() => {
    setMenuItems(DUMMY_MENU_ITEMS); // Assuming DUMMY_MENU_ITEMS has pre-calculated costs if needed by MenuItemCard

    const tableIdFromStorage = localStorage.getItem('customer_selected_table_id');
    const tableNumberFromStorage = localStorage.getItem('customer_selected_table_number');
    if (tableIdFromStorage && tableNumberFromStorage) {
      setSelectedTable({ id: tableIdFromStorage, number: tableNumberFromStorage });
      // Optionally, clear from localStorage if it's a one-time use, or keep it for session
      // localStorage.removeItem('customer_selected_table_id');
      // localStorage.removeItem('customer_selected_table_number');
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
    // Placeholder for actual order placement logic
    console.log("Placing order:", cartItems, "for table:", selectedTable);
    toast({
      title: "تم إرسال الطلب بنجاح (تجريبي)",
      description: `إجمالي الطلب: $${cartSubtotal.toFixed(2)}. ${selectedTable.number ? `لطاولة رقم ${selectedTable.number}` : ''}`,
      className: "bg-green-500 text-white"
    });
    setCartItems([]); // Clear cart after "placing order"
    // In a real app, you'd send this to a backend and then likely redirect or show a confirmation page.
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="قائمة الطعام لدينا"
        description="تصفح أشهى المأكولات والمشروبات التي نقدمها."
        icon={Utensils}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Items Section */}
        <div className="lg:col-span-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 shadow-lg"> {/* sticky top-20 for when header is present */}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                سلة طلباتك
              </CardTitle>
              {selectedTable.number && (
                <Badge variant="outline" className="mt-1">طاولة رقم: {selectedTable.number}</Badge>
              )}
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-24rem)] max-h-[500px]"> {/* Adjust height as needed */}
              <CardContent className="py-0">
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
              </CardContent>
            </ScrollArea>
            {cartItems.length > 0 && (
              <CardFooter className="flex flex-col gap-3 pt-4 border-t">
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
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

    