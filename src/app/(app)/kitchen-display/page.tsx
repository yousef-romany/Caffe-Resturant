
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type Order, type OrderStatus, type OrderItem, type OrderType, KITCHEN_CATEGORY_ICONS, type Category, CATEGORY_SLUG_MAP, type CategorySlug, CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES } from '@/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, CheckCircle2, CookingPot, Clock, AlertTriangle, Ban } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter, usePathname } from 'next/navigation'; // usePathname for re-triggering useEffect
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

const PENDING_LATE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const PREPARING_LATE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

interface KitchenOrderCardProps {
  order: Order;
  onStartPreparing: (orderId: string, newStatus: OrderStatus) => void;
  onMarkAsReady: (orderId: string, newStatus: OrderStatus) => void;
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
            {isLate && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> متأخر</Badge>}
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
            {itemsToDisplay.map((item, index) => (
              <li key={`${item.id}-${item.notes || 'no-notes'}-${index}`} className="flex items-start gap-2 p-2 border-b last:border-b-0">
                <NextImage src={item.imageUrl || 'https://placehold.co/50x50.png'} alt={item.name} width={40} height={40} className="rounded-md h-10 w-10 object-cover flex-shrink-0" data-ai-hint={item.dataAiHint || "food item"}/>
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
          <Button onClick={() => onStartPreparing(order.id, 'قيد التجهيز')} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
            <CookingPot className="h-4 w-4 me-2" />
            بدء تجهيز الطلب
          </Button>
        )}
        {order.status === 'قيد التجهيز' && (
          <Button onClick={() => onMarkAsReady(order.id, 'جاهز')} className="w-full bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle2 className="h-4 w-4 me-2" />
            تم الانتهاء (جاهز)
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}


export default function KitchenDisplayPage() {
  const router = useRouter();
  const pathname = usePathname(); // To re-trigger useEffect on navigation to this page
  const { toast } = useToast();

  const [db, setDbInstance] = useState<Database | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategorySlug, setActiveCategorySlug] = useState<CategorySlug | null>(null);
  const [activeCategoryInfo, setActiveCategoryInfo] = useState<{ name: Category; icon: LucideIcon; slug: CategorySlug } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(true); // Assume authorized until checked

  const fetchOrdersForCategory = useCallback(async (categoryName: Category, currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const fetchedOrdersRaw: any[] = await currentDb.select(
        "SELECT id, order_number, type, status, created_at, kitchen_started_at, table_id FROM orders WHERE status IN ('قيد الانتظار', 'قيد التجهيز') ORDER BY created_at ASC"
      );

      const tableIds = fetchedOrdersRaw.filter(o => o.table_id).map(o => o.table_id);
      let tableNumberMap: Record<string, string> = {};
      if (tableIds.length > 0) {
        const tableNumbersRaw: any[] = await currentDb.select(
          `SELECT id, number FROM tables_info WHERE id IN (${tableIds.map(id => `'${id}'`).join(',')})`
        );
        tableNumberMap = tableNumbersRaw.reduce((acc, curr) => {
          acc[curr.id] = curr.number;
          return acc;
        }, {});
      }
      
      const ordersWithItems: Order[] = [];
      for (const orderRaw of fetchedOrdersRaw) {
        const itemsRaw: any[] = await currentDb.select(
          `SELECT oi.menu_item_id as id, oi.menu_item_name as name, oi.quantity, oi.price_at_order as price, oi.notes, mi.image_url as imageUrl, mi.data_ai_hint as dataAiHint, mi.category 
           FROM order_items oi 
           JOIN menu_items mi ON oi.menu_item_id = mi.id 
           WHERE oi.order_id = $1`,
          [orderRaw.id]
        );

        const items: OrderItem[] = itemsRaw.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category as Category,
          price: Number(item.price),
          quantity: Number(item.quantity),
          imageUrl: item.imageUrl || 'https://placehold.co/50x50.png',
          dataAiHint: item.dataAiHint || 'food item',
          notes: item.notes,
        }));
        
        if (items.some(item => item.category === categoryName)) {
          ordersWithItems.push({
            id: orderRaw.id,
            orderNumber: orderRaw.order_number,
            type: orderRaw.type as OrderType,
            status: orderRaw.status as OrderStatus,
            createdAt: parseISO(orderRaw.created_at),
            kitchen_started_at: orderRaw.kitchen_started_at ? parseISO(orderRaw.kitchen_started_at) : undefined,
            kitchen_ready_at: orderRaw.kitchen_ready_at ? parseISO(orderRaw.kitchen_ready_at) : undefined,
            tableNumber: orderRaw.table_id ? tableNumberMap[orderRaw.table_id] : undefined,
            items: items,
            totalAmount: 0, 
          });
        }
      }
      setOrders(ordersWithItems);
    } catch (error) {
      console.error(`Error fetching orders for category ${categoryName}:`, error);
      toast({ title: "خطأ", description: `فشل في جلب الطلبات لقسم ${categoryName}.`, variant: "destructive" });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    async function initializeDbAndCategory() {
      const dbInstance = await getDb;
      setDbInstance(dbInstance);

      let slugToLoad: CategorySlug | null = null;
      let categoryInfo: { name: Category; icon: LucideIcon; slug: CategorySlug } | null = null;

      // 1. Try to load from localStorage
      const storedSlug = localStorage.getItem('selectedKitchenCategorySlug') as CategorySlug | null;
      if (storedSlug && CATEGORY_SLUG_MAP[storedSlug]) {
        slugToLoad = storedSlug;
        categoryInfo = CATEGORY_SLUG_MAP[slugToLoad];
      }

      // Helper to check authorization
      const isUserAuthorizedForCategory = (catInfo: typeof categoryInfo) => {
        if (!catInfo) return false;
        return CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES.length === 0 || 
               CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES.includes(catInfo.name);
      };

      // 2. If localStorage value is not valid or not authorized, determine a default
      if (!categoryInfo || !isUserAuthorizedForCategory(categoryInfo)) {
        slugToLoad = null; // Reset slugToLoad if current one is not good
        categoryInfo = null;

        if (CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES.length > 0) {
          // Find the first authorized category
          for (const catName of CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES) {
            const foundSlug = Object.values(CATEGORY_SLUG_MAP).find(c => c.name === catName)?.slug;
            if (foundSlug) {
              slugToLoad = foundSlug;
              categoryInfo = CATEGORY_SLUG_MAP[slugToLoad];
              break;
            }
          }
        } else {
          // If no specific assignments, default to the first category in the system
          const firstSystemCategorySlug = Object.keys(CATEGORY_SLUG_MAP)[0] as CategorySlug | undefined;
          if (firstSystemCategorySlug) {
            slugToLoad = firstSystemCategorySlug;
            categoryInfo = CATEGORY_SLUG_MAP[slugToLoad];
          }
        }
      }
      
      setIsAuthorized(isUserAuthorizedForCategory(categoryInfo));

      if (categoryInfo && slugToLoad) {
        setActiveCategorySlug(slugToLoad);
        setActiveCategoryInfo(categoryInfo);
        localStorage.setItem('selectedKitchenCategorySlug', slugToLoad); // Update localStorage with the final active slug
        if (dbInstance) {
          fetchOrdersForCategory(categoryInfo.name, dbInstance);
        }
      } else {
        setActiveCategoryInfo(null);
        setActiveCategorySlug(null);
        setIsLoading(false); // No valid category, stop loading
        if (CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES.length > 0 && !slugToLoad) {
          // User has assignments, but none match available categories
          toast({ title: "خطأ في الإعداد", description: "الأقسام المخصصة لك غير موجودة في النظام.", variant: "destructive" });
        } else if (Object.keys(CATEGORY_SLUG_MAP).length === 0) {
            toast({ title: "خطأ", description: "لم يتم تعريف أقسام للمطبخ في النظام.", variant: "destructive" });
        }
      }
    }
    initializeDbAndCategory();
  // Effect dependencies: pathname ensures re-evaluation if navigated via router.push('/kitchen-display')
  // db ensures it runs after db is initialized.
  }, [pathname, db, toast, fetchOrdersForCategory]);


  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!db || !activeCategoryInfo) return;
    const now = new Date().toISOString();
    let sql = `UPDATE orders SET status = ?, updated_at = ?`;
    const params: any[] = [newStatus, now];

    if (newStatus === 'قيد التجهيز') {
      sql += `, kitchen_started_at = ?`;
      params.push(now);
    } else if (newStatus === 'جاهز') {
      sql += `, kitchen_ready_at = ?`;
      params.push(now);
      const order = orders.find(o => o.id === orderId);
      if (order && !order.kitchen_started_at) {
        sql += `, kitchen_started_at = ?`; 
        params.push(order.createdAt.toISOString()); 
      }
    }
    sql += ` WHERE id = ?`;
    params.push(orderId);

    try {
      await db.execute(sql, params);
      fetchOrdersForCategory(activeCategoryInfo.name, db); // Re-fetch to update UI
      toast({
        title: newStatus === 'قيد التجهيز' ? "بدء التجهيز" : "تم الانتهاء",
        description: `تم تحديث حالة الطلب بنجاح.`,
        className: newStatus === 'جاهز' ? "bg-green-500 text-white" : "",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({ title: "خطأ", description: "فشل تحديث حالة الطلب.", variant: "destructive" });
    }
  };

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

  if (isLoading && !activeCategoryInfo && !db) { // Initial loading state before DB and category logic
    return (
      <>
        <PageHeader title="شاشة المطبخ" description="جارٍ تحميل بيانات المطبخ..." />
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
      </>
    );
  }
  
  if (!activeCategoryInfo) { // If no category could be determined
    return (
      <>
        <PageHeader title="شاشة المطبخ" icon={ChefHat} description="لم يتم تحديد قسم صالح لعرضه." />
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-xl">
            يرجى اختيار قسم مطبخ صالح من القائمة الجانبية، أو التأكد من وجود أقسام معرفة.
          </p>
        </div>
      </>
    );
  }
  
  if (!isAuthorized) { // If determined category is not authorized for the user
    return (
      <>
        <PageHeader title="غير مصرح به" description={`ليس لديك الصلاحية لعرض قسم ${activeCategoryInfo.name}.`} icon={Ban} />
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-xl">
            ليس لديك صلاحية الوصول لهذا القسم. يرجى مراجعة المدير.
          </p>
        </div>
      </>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'قيد الانتظار');
  const preparingOrders = orders.filter(o => o.status === 'قيد التجهيز');
  
  return (
    <>
      <PageHeader title={`شاشة المطبخ - ${activeCategoryInfo.name}`} description={`إدارة الطلبات النشطة لقسم ${activeCategoryInfo.name}.`} icon={activeCategoryInfo.icon} />
      {isLoading ? ( // Loading state while fetching orders for the determined category
         <p className="text-center text-muted-foreground py-10">جارٍ تحميل طلبات قسم {activeCategoryInfo.name}...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          <div className="flex flex-col bg-card p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-yellow-600 mb-3 pb-2 border-b flex items-center">
              <Clock className="h-5 w-5 me-2" /> طلبات جديدة ({pendingOrders.length})
            </h3>
            {pendingOrders.length > 0 ? (
              <ScrollArea className="flex-grow pr-3">
                <div className="grid grid-cols-1 gap-4">
                  {pendingOrders.map(order => (
                    <KitchenOrderCard
                      key={`${order.id}-pending-${activeCategoryInfo.name}`}
                      order={order}
                      onStartPreparing={handleUpdateOrderStatus}
                      onMarkAsReady={handleUpdateOrderStatus}
                      displayCategory={activeCategoryInfo.name}
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

          <div className="flex flex-col bg-card p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-blue-600 mb-3 pb-2 border-b flex items-center">
              <CookingPot className="h-5 w-5 me-2" /> طلبات قيد التجهيز ({preparingOrders.length})
            </h3>
            {preparingOrders.length > 0 ? (
              <ScrollArea className="flex-grow pr-3">
                <div className="grid grid-cols-1 gap-4">
                  {preparingOrders.map(order => (
                    <KitchenOrderCard
                      key={`${order.id}-preparing-${activeCategoryInfo.name}`}
                      order={order}
                      onStartPreparing={handleUpdateOrderStatus}
                      onMarkAsReady={handleUpdateOrderStatus}
                      displayCategory={activeCategoryInfo.name}
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
      )}
    </>
  );
}
