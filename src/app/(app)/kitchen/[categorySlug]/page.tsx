
"use client";

import { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DUMMY_ORDERS, type Order, type OrderStatus, type OrderItem, KITCHEN_CATEGORY_ICONS, type Category, CATEGORY_SLUG_MAP, type CategorySlug, CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES } from '@/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, CheckCircle2, CookingPot, Clock, AlertTriangle, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { notFound, useParams } from 'next/navigation';

const PENDING_LATE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const PREPARING_LATE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

interface KitchenOrderCardProps {
  order: Order;
  onStartPreparing: (orderId: string) => void;
  onMarkAsReady: (orderId: string) => void;
  displayCategory: Category; 
  isLate: boolean;
}

function KitchenOrderCard({ order, onStartPreparing, onMarkAsReady, displayCategory, isLate }: KitchenOrderCardProps) {
  const [timeAgo, setTimeAgo] = useState('');
  const [timeInCurrentStatus, setTimeInCurrentStatus] = useState('');

  useEffect(() => {
    const updateTimers = () => {
      setTimeAgo(formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: arSA }));

      let statusTime = order.createdAt;
      if (order.status === 'قيد التجهيز' && order.kitchen_started_at) {
        statusTime = order.kitchen_started_at;
      }
      setTimeInCurrentStatus(formatDistanceToNow(new Date(statusTime), { locale: arSA, addSuffix: false }));
    };
    
    updateTimers();
    const intervalId = setInterval(updateTimers, 60000); 
    return () => clearInterval(intervalId);
  }, [order.createdAt, order.status, order.kitchen_started_at]);

  const itemsToDisplay = order.items.filter(item => item.category === displayCategory);

  if (itemsToDisplay.length === 0) {
    return null;
  }

  return (
    <Card className={`shadow-lg flex flex-col h-full ${isLate ? 'border-destructive border-2' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{order.orderNumber}</span>
          <div className="flex items-center gap-2">
            {isLate && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> متأخر</Badge>}
            <span className="text-sm font-normal text-muted-foreground">{timeAgo}</span>
          </div>
        </CardTitle>
        <CardDescription>
          {order.type}
          {order.type === 'صالة' && order.tableNumber && ` - طاولة: ${order.tableNumber}`}
          {order.status === 'قيد الانتظار' && (
            <span className="block text-xs text-yellow-600 mt-1">
              <Clock className="h-3 w-3 inline me-1" />
              في الانتظار منذ: {timeInCurrentStatus}
            </span>
          )}
          {order.status === 'قيد التجهيز' && (
            <span className="block text-xs text-blue-600 mt-1">
              <CookingPot className="h-3 w-3 inline me-1" />
              تحت التجهيز منذ: {timeInCurrentStatus}
            </span>
          )}
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


export default function KitchenCategoryPage({ params }: { params: { categorySlug: CategorySlug }}) {
  const { categorySlug } = params;
  const categoryInfo = CATEGORY_SLUG_MAP[categorySlug];

  const [orders, setOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const initialOrders = JSON.parse(JSON.stringify(DUMMY_ORDERS)) as Order[];
    setOrders(initialOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, []);
  
  if (!categoryInfo) {
    notFound();
  }
  
  const currentCategoryName = categoryInfo.name;
  const CategoryIcon = categoryInfo.icon || ChefHat;

  const isAuthorizedForCategory = 
    CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES.length === 0 || 
    CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES.includes(currentCategoryName);


  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const now = new Date();
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, status: newStatus, updatedAt: now };
          if (newStatus === 'قيد التجهيز') {
            updatedOrder.kitchen_started_at = now;
          } else if (newStatus === 'جاهز') {
            updatedOrder.kitchen_ready_at = now;
            if (!updatedOrder.kitchen_started_at) { 
              updatedOrder.kitchen_started_at = updatedOrder.createdAt; 
            }
          }
          return updatedOrder;
        }
        return order;
      })
    );
    
    const orderIndex = DUMMY_ORDERS.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      DUMMY_ORDERS[orderIndex].status = newStatus;
      DUMMY_ORDERS[orderIndex].updatedAt = now;
      if (newStatus === 'قيد التجهيز') DUMMY_ORDERS[orderIndex].kitchen_started_at = now;
      if (newStatus === 'جاهز') {
        DUMMY_ORDERS[orderIndex].kitchen_ready_at = now;
        if (!DUMMY_ORDERS[orderIndex].kitchen_started_at) {
            DUMMY_ORDERS[orderIndex].kitchen_started_at = DUMMY_ORDERS[orderIndex].createdAt;
        }
      }
    }
  };

  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'قيد التجهيز');
    const order = orders.find(o => o.id === orderId);
    toast({ title: "بدء التجهيز", description: `بدأ تجهيز الطلب ${order?.orderNumber} لقسم ${currentCategoryName}.` });
  };

  const handleMarkAsReady = (orderId: string) => {
    updateOrderStatus(orderId, 'جاهز');
    const order = orders.find(o => o.id === orderId);
    toast({ title: "تم الانتهاء", description: `الطلب ${order?.orderNumber} جاهز للاستلام من قسم ${currentCategoryName}.`, className: "bg-green-500 text-white" });
  };
  
  const filteredOrdersForCategory = useMemo(() => {
    return orders.filter(order => 
      (order.status === 'قيد الانتظار' || order.status === 'قيد التجهيز') &&
      order.items.some(item => item.category === currentCategoryName)
    );
  }, [orders, currentCategoryName]);

  const pendingOrders = filteredOrdersForCategory.filter(o => o.status === 'قيد الانتظار');
  const preparingOrders = filteredOrdersForCategory.filter(o => o.status === 'قيد التجهيز');

  const checkIsLate = (order: Order): boolean => {
    const now = Date.now();
    if (order.status === 'قيد الانتظار') {
      return (now - new Date(order.createdAt).getTime()) > PENDING_LATE_THRESHOLD_MS;
    }
    if (order.status === 'قيد التجهيز') {
      const startTime = order.kitchen_started_at ? new Date(order.kitchen_started_at).getTime() : new Date(order.createdAt).getTime();
      return (now - startTime) > PREPARING_LATE_THRESHOLD_MS;
    }
    return false;
  };


  if (!isClient) {
    return (
      <>
        <PageHeader title={`شاشة المطبخ - ${currentCategoryName}`} description={`إدارة الطلبات لقسم ${currentCategoryName}.`} icon={CategoryIcon} />
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل شاشة المطبخ...</p>
      </>
    );
  }
  
  if (!isAuthorizedForCategory) {
      return (
        <>
            <PageHeader title="غير مصرح به" description={`ليس لديك الصلاحية لعرض قسم ${currentCategoryName}.`} icon={Ban} />
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-xl">
                    ليس لديك صلاحية الوصول لهذا القسم. يرجى مراجعة المدير.
                </p>
            </div>
        </>
      );
  }


  return (
    <>
      <PageHeader title={`شاشة المطبخ - ${currentCategoryName}`} description={`إدارة الطلبات النشطة لقسم ${currentCategoryName}.`} icon={CategoryIcon} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        {/* Pending Orders Column */}
        <div className="flex flex-col bg-card p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-yellow-600 mb-3 pb-2 border-b flex items-center">
                <Clock className="h-5 w-5 me-2"/> طلبات جديدة ({pendingOrders.length})
            </h3>
            {pendingOrders.length > 0 ? (
                <ScrollArea className="flex-grow pr-3">
                    <div className="grid grid-cols-1 gap-4">
                    {pendingOrders.map(order => (
                        <KitchenOrderCard
                        key={`${order.id}-pending-${currentCategoryName}`}
                        order={order}
                        onStartPreparing={handleStartPreparing}
                        onMarkAsReady={handleMarkAsReady}
                        displayCategory={currentCategoryName}
                        isLate={checkIsLate(order)}
                        />
                    ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground text-center">لا توجد طلبات جديدة لهذا القسم.</p>
                </div>
            )}
        </div>

        {/* Preparing Orders Column */}
        <div className="flex flex-col bg-card p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-blue-600 mb-3 pb-2 border-b flex items-center">
                <CookingPot className="h-5 w-5 me-2"/> طلبات قيد التجهيز ({preparingOrders.length})
            </h3>
            {preparingOrders.length > 0 ? (
                 <ScrollArea className="flex-grow pr-3">
                    <div className="grid grid-cols-1 gap-4">
                    {preparingOrders.map(order => (
                        <KitchenOrderCard
                        key={`${order.id}-preparing-${currentCategoryName}`}
                        order={order}
                        onStartPreparing={handleStartPreparing}
                        onMarkAsReady={handleMarkAsReady}
                        displayCategory={currentCategoryName}
                        isLate={checkIsLate(order)}
                        />
                    ))}
                    </div>
                </ScrollArea>
            ) : (
                 <div className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground text-center">لا توجد طلبات قيد التجهيز لهذا القسم.</p>
                </div>
            )}
        </div>
      </div>
    </>
  );
}

