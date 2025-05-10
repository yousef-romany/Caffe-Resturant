
"use client";

import { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DUMMY_ORDERS, type Order, type OrderStatus } from '@/constants';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, CheckCircle2, Clock, CookingPot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface KitchenOrderCardProps {
  order: Order;
  onStartPreparing: (orderId: string) => void;
  onMarkAsReady: (orderId: string) => void;
}

function KitchenOrderCard({ order, onStartPreparing, onMarkAsReady }: KitchenOrderCardProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      setTimeAgo(formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: arSA }));
    };
    updateTimer();
    const intervalId = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(intervalId);
  }, [order.createdAt]);

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
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="py-0 ">
          <ul className="space-y-2">
            {order.items.map(item => (
              <li key={item.id} className="flex items-start gap-2 p-2 border-b last:border-b-0">
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
            بدء التجهيز
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
    // Initialize with a deep copy to allow local modifications
    const initialOrders = JSON.parse(JSON.stringify(DUMMY_ORDERS)) as Order[];
    setOrders(initialOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    // In a real app, this would also call an API to update the backend.
    // And DUMMY_ORDERS would be replaced by data from a global store or API.
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

  const pendingOrders = useMemo(() => {
    return orders.filter(order => order.status === 'قيد الانتظار');
  }, [orders]);

  const preparingOrders = useMemo(() => {
    return orders.filter(order => order.status === 'قيد التجهيز');
  }, [orders]);

  if (!isClient) {
    return (
      <>
        <PageHeader title="شاشة المطبخ" description="إدارة الطلبات النشطة." icon={ChefHat} />
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل شاشة المطبخ...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="شاشة المطبخ" description="إدارة الطلبات النشطة." icon={ChefHat} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-10rem)]">
        {/* Pending Orders Column */}
        <div className="flex flex-col bg-card p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            <Clock className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">طلبات جديدة ({pendingOrders.length})</h2>
          </div>
          {pendingOrders.length === 0 ? (
             <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-lg">لا توجد طلبات جديدة حاليًا.</p>
             </div>
          ) : (
            <ScrollArea className="flex-grow pr-3">
              <div className="grid grid-cols-1 gap-4">
                {pendingOrders.map(order => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    onStartPreparing={handleStartPreparing}
                    onMarkAsReady={handleMarkAsReady}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Preparing Orders Column */}
        <div className="flex flex-col bg-card p-4 rounded-lg shadow-md">
           <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            <CookingPot className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">طلبات قيد التجهيز ({preparingOrders.length})</h2>
          </div>
          {preparingOrders.length === 0 ? (
            <div className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-lg">لا توجد طلبات قيد التجهيز حاليًا.</p>
            </div>
          ) : (
            <ScrollArea className="flex-grow pr-3">
              <div className="grid grid-cols-1 gap-4">
                {preparingOrders.map(order => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    onStartPreparing={handleStartPreparing}
                    onMarkAsReady={handleMarkAsReady}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </>
  );
}
