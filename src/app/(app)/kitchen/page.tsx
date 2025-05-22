
"use client";

import { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DUMMY_ORDERS, type Order, type OrderStatus, type OrderItem, ITEM_CATEGORIES, KITCHEN_CATEGORY_ICONS, CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES, type Category } from '@/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, CheckCircle2, CookingPot, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';

interface KitchenOrderCardProps {
  order: Order;
  onStartPreparing: (orderId: string) => void;
  onMarkAsReady: (orderId: string) => void;
  displayCategory?: Category; // Only show items of this category
}

function KitchenOrderCard({ order, onStartPreparing, onMarkAsReady, displayCategory }: KitchenOrderCardProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      setTimeAgo(formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: arSA }));
    };
    updateTimer();
    const intervalId = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(intervalId);
  }, [order.createdAt]);

  const itemsToDisplay = displayCategory 
    ? order.items.filter(item => item.category === displayCategory) 
    : order.items;

  if (itemsToDisplay.length === 0) {
    return null; // Don't render the card if no items match the display category for this order
  }

  return (
    <Card className="shadow-lg flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{order.orderNumber}</span>
          <span className="text-sm font-normal text-muted-foreground">{timeAgo}</span>
        </CardTitle>
        <CardDescription>
          {order.type}
          {order.type === 'صالة' && order.tableNumber && ` - طاولة: ${order.tableNumber}`}
          {displayCategory && <span className="text-xs text-blue-500 block">({displayCategory})</span>}
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="py-0 ">
          <ul className="space-y-2">
            {itemsToDisplay.map(item => (
              <li key={`${item.id}-${item.notes || 'no-notes'}`} className="flex items-start gap-2 p-2 border-b last:border-b-0">
                <NextImage src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md h-10 w-10 object-cover flex-shrink-0" data-ai-hint={item.dataAiHint || "food item"}/>
                <div className="flex-grow">
                  <p className="font-medium text-sm">{item.name} <span className="text-muted-foreground text-xs">x {item.quantity}</span></p>
                  {item.notes && <p className="text-xs text-blue-600 italic mt-0.5">ملاحظات: {item.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </ScrollArea>
      <CardFooter className="pt-3">
        {order.status === 'قيد الانتظار' && (
          <Button onClick={() => onStartPreparing(order.id)} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
            <CookingPot className="h-4 w-4 me-2" />
            بدء تجهيز الطلب
          </Button>
        )}
        {order.status === 'قيد التجهيز' && (
          <Button onClick={() => onMarkAsReady(order.id)} className="w-full bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle2 className="h-4 w-4 me-2" />
            تم الانتهاء (جاهز)
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}


export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const initialOrders = JSON.parse(JSON.stringify(DUMMY_ORDERS)) as Order[];
    setOrders(initialOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    // Update DUMMY_ORDERS to reflect changes, simulating backend update
    const orderIndex = DUMMY_ORDERS.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      DUMMY_ORDERS[orderIndex].status = newStatus;
      if (newStatus === 'قيد التجهيز') DUMMY_ORDERS[orderIndex].kitchen_started_at = new Date();
      if (newStatus === 'جاهز') DUMMY_ORDERS[orderIndex].kitchen_ready_at = new Date();
    }
  };

  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'قيد التجهيز');
    const order = orders.find(o => o.id === orderId);
    toast({ title: "بدء التجهيز", description: `بدأ تجهيز الطلب ${order?.orderNumber}.` });
  };

  const handleMarkAsReady = (orderId: string) => {
    updateOrderStatus(orderId, 'جاهز');
    const order = orders.find(o => o.id === orderId);
    toast({ title: "تم الانتهاء", description: `الطلب ${order?.orderNumber} جاهز للاستلام.`, className: "bg-green-500 text-white" });
  };

  const categoriesToDisplay = useMemo(() => {
    if (CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES && CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES.length > 0) {
      return ITEM_CATEGORIES.filter(cat => CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES.includes(cat));
    }
    return ITEM_CATEGORIES;
  }, []);

  const ordersByStatusAndCategory = useMemo(() => {
    const activeOrders = orders.filter(order => order.status === 'قيد الانتظار' || order.status === 'قيد التجهيز');
    
    const result: Record<Category, { pending: Order[], preparing: Order[] }> = {} as Record<Category, { pending: Order[], preparing: Order[] }>;

    categoriesToDisplay.forEach(category => {
      result[category] = { pending: [], preparing: [] };
      activeOrders.forEach(order => {
        if (order.items.some(item => item.category === category)) {
          if (order.status === 'قيد الانتظار') {
            result[category].pending.push(order);
          } else if (order.status === 'قيد التجهيز') {
            result[category].preparing.push(order);
          }
        }
      });
    });
    return result;
  }, [orders, categoriesToDisplay]);


  if (!isClient) {
    return (
      <>
        <PageHeader title="شاشة المطبخ" description="إدارة الطلبات النشطة حسب القسم." icon={ChefHat} />
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل شاشة المطبخ...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="شاشة المطبخ" description="إدارة الطلبات النشطة حسب القسم." icon={ChefHat} />
      
      <div className={`grid grid-cols-1 ${categoriesToDisplay.length > 1 ? `md:grid-cols-${Math.min(categoriesToDisplay.length, 3)}` : ''} gap-4 h-[calc(100vh-12rem)]`}>
        {categoriesToDisplay.map(category => {
          const CategoryIcon = KITCHEN_CATEGORY_ICONS[category] || ChefHat;
          const pendingForCategory = ordersByStatusAndCategory[category]?.pending || [];
          const preparingForCategory = ordersByStatusAndCategory[category]?.preparing || [];

          return (
            <div key={category} className="flex flex-col bg-card p-4 rounded-lg shadow-md">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <CategoryIcon className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">{category} ({pendingForCategory.length + preparingForCategory.length})</h2>
              </div>
              
              <div className="flex-grow space-y-4">
                {/* Pending Orders for this category */}
                {pendingForCategory.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-yellow-600 mb-2 flex items-center"><Clock className="h-5 w-5 me-2"/> طلبات جديدة ({pendingForCategory.length})</h3>
                    <ScrollArea className="max-h-[calc(50vh-10rem)] pr-3">
                      <div className="grid grid-cols-1 gap-4">
                        {pendingForCategory.map(order => (
                          <KitchenOrderCard
                            key={`${order.id}-pending-${category}`}
                            order={order}
                            onStartPreparing={handleStartPreparing}
                            onMarkAsReady={handleMarkAsReady}
                            displayCategory={category}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Preparing Orders for this category */}
                {preparingForCategory.length > 0 && (
                  <div>
                     <h3 className="text-md font-medium text-blue-600 mb-2 flex items-center"><CookingPot className="h-5 w-5 me-2"/> طلبات قيد التجهيز ({preparingForCategory.length})</h3>
                    <ScrollArea className="max-h-[calc(50vh-10rem)] pr-3">
                      <div className="grid grid-cols-1 gap-4">
                        {preparingForCategory.map(order => (
                          <KitchenOrderCard
                            key={`${order.id}-preparing-${category}`}
                            order={order}
                            onStartPreparing={handleStartPreparing}
                            onMarkAsReady={handleMarkAsReady}
                            displayCategory={category}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                {pendingForCategory.length === 0 && preparingForCategory.length === 0 && (
                   <div className="flex-grow flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-lg">لا توجد طلبات نشطة لهذا القسم.</p>
                   </div>
                )}
              </div>
            </div>
          );
        })}
         {categoriesToDisplay.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-full">
                <p className="text-muted-foreground text-xl">لم يتم تعيين أقسام لهذا المستخدم.</p>
            </div>
        )}
      </div>
    </>
  );
}
