
"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { type Order as AppOrder, type OrderStatus, type OrderType, type OrderItem as AppOrderItem, type Category } from '@/constants'; // Added Category
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Eye, Filter, RotateCcw, ShoppingCart, PackageOpen } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { arSA } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import NextImage from 'next/image';
import { Separator } from '@/components/ui/separator';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';

const ORDER_STATUSES: OrderStatus[] = ["قيد الانتظار", "قيد التجهيز", "جاهز", "مكتمل", "ملغى"];
const ORDER_TYPES: OrderType[] = ["صالة", "سفري", "توصيل"];

interface FetchedOrder {
  id: string;
  order_number: string;
  created_at: string; 
  type: OrderType;
  customer_name?: string;
  table_number?: string; 
  captain_name?: string;
  total_amount: number;
  status: OrderStatus;
  table_id?: string;
}

interface DetailedOrderItem extends AppOrderItem {
  // Inherits from AppOrderItem, can add more DB specific fields if needed
  category: Category; // Explicitly add category here
}


export default function OrdersPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [orders, setOrders] = useState<FetchedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'الكل'>('الكل');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'الكل'>('الكل');
  
  const [selectedOrder, setSelectedOrder] = useState<FetchedOrder | null>(null);
  const [detailedOrderItems, setDetailedOrderItems] = useState<DetailedOrderItem[]>([]);
  const [isFetchingOrderDetails, setIsFetchingOrderDetails] = useState(false);

  useEffect(() => {
    async function loadDbAndFetchOrders() {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        await fetchOrders(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch orders:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات الطلبات.", variant: "destructive" });
        setIsLoading(false);
      }
    }
    loadDbAndFetchOrders();
  }, [toast]);

  const fetchOrders = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const fetchedOrders: any[] = await currentDb.select(`
        SELECT 
          o.id, 
          o.order_number, 
          o.created_at, 
          o.type, 
          o.customer_name, 
          o.captain_name,
          o.total_amount, 
          o.status,
          ti.number as table_number,
          o.table_id 
        FROM orders o
        LEFT JOIN tables_info ti ON o.table_id = ti.id
        ORDER BY o.created_at DESC
      `);
      setOrders(fetchedOrders.map(order => ({
        ...order,
        total_amount: Number(order.total_amount) || 0,
      })));
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات الطلبات.", variant: "destructive" });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewOrderDetails = async (order: FetchedOrder) => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    setSelectedOrder(order);
    setIsFetchingOrderDetails(true);
    setDetailedOrderItems([]);
    try {
      const items: any[] = await db.select(
        `SELECT 
          oi.id, 
          oi.menu_item_id,
          oi.menu_item_name as name, 
          oi.quantity, 
          oi.price_at_order as price, 
          oi.notes,
          mi.image_url as imageUrl, 
          mi.data_ai_hint as dataAiHint,
          mi.category
         FROM order_items oi
         LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      setDetailedOrderItems(items.map(item => ({
        id: item.menu_item_id, 
        name: item.name,
        category: item.category as Category,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        imageUrl: item.imageUrl || 'https://placehold.co/50x50.png',
        dataAiHint: item.dataAiHint || 'food item',
        notes: item.notes,
      })));
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast({ title: "خطأ", description: "فشل في جلب تفاصيل عناصر الطلب.", variant: "destructive" });
      setDetailedOrderItems([]);
    } finally {
      setIsFetchingOrderDetails(false);
    }
  };


  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      (order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
       (order.table_number && order.table_number.includes(searchTerm))) &&
      (statusFilter === 'الكل' || order.status === statusFilter) &&
      (typeFilter === 'الكل' || order.type === typeFilter)
    );
  }, [orders, searchTerm, statusFilter, typeFilter]);

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'مكتمل': return 'default'; 
      case 'قيد الانتظار': return 'secondary';
      case 'قيد التجهيز': return 'outline'; 
      case 'جاهز': return 'default'; 
      case 'ملغى': return 'destructive';
      default: return 'outline';
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('الكل');
    setTypeFilter('الكل');
  };

  return (
    <>
      <PageHeader title="سجل الطلبات" description="عرض وإدارة جميع طلبات العملاء." icon={ShoppingCart} />

      <div className="mb-6 p-4 bg-card rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="searchOrders" className="text-sm font-medium">بحث</Label>
            <Input
              id="searchOrders"
              type="search"
              placeholder="رقم الطلب، العميل، الطاولة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="statusFilter" className="text-sm font-medium">الحالة</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'الكل')}>
              <SelectTrigger id="statusFilter" className="mt-1">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">جميع الحالات</SelectItem>
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="typeFilter" className="text-sm font-medium">نوع الطلب</Label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as OrderType | 'الكل')}>
              <SelectTrigger id="typeFilter" className="mt-1">
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">جميع الأنواع</SelectItem>
                {ORDER_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={resetFilters} variant="outline" className="w-full md:w-auto">
            <RotateCcw className="h-4 w-4 me-2" /> إعادة تعيين الفلاتر
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
           {isLoading ? (
            <p className="text-center text-muted-foreground p-10">جارٍ تحميل الطلبات...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        {isValid(parseISO(order.created_at)) 
                          ? format(parseISO(order.created_at), 'PPpp', { locale: arSA }) 
                          : 'تاريخ غير صالح'}
                      </TableCell>
                      <TableCell>{order.type}</TableCell>
                      <TableCell>
                        {order.type === 'صالة' && order.table_number && `طاولة: ${order.table_number}`}
                        {order.type === 'توصيل' && order.customer_name && `${order.customer_name}`}
                        {order.type === 'توصيل' && order.captain_name && ` (الكابتن: ${order.captain_name})`}
                        {order.type === 'سفري' && order.customer_name && `${order.customer_name}`}
                        {(!order.table_number && !order.customer_name && !order.captain_name && (order.type === 'صالة' || order.type === 'توصيل' || order.type === 'سفري')) && '-'}
                      </TableCell>
                      <TableCell className="text-left">${order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrderDetails(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {orders.length === 0 ? "لا توجد طلبات مسجلة بعد." : "لا توجد طلبات تطابق الفلاتر المحددة."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => {setSelectedOrder(null); setDetailedOrderItems([]);}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب: {selectedOrder.order_number}</DialogTitle>
              <DialogDescription>
                التاريخ: {isValid(parseISO(selectedOrder.created_at)) ? format(parseISO(selectedOrder.created_at), 'PPpp', { locale: arSA }) : 'تاريخ غير صالح'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto ps-2 space-y-4">
              <p><strong>الحالة:</strong> <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge></p>
              <p><strong>النوع:</strong> {selectedOrder.type}</p>
              {selectedOrder.type === 'صالة' && selectedOrder.table_number && <p><strong>الطاولة:</strong> {selectedOrder.table_number}</p>}
              {selectedOrder.customer_name && <p><strong>العميل:</strong> {selectedOrder.customer_name}</p>}
              {selectedOrder.type === 'توصيل' && selectedOrder.captain_name && <p><strong>الكابتن:</strong> {selectedOrder.captain_name}</p>}
              
              <h4 className="font-semibold mt-4 flex items-center gap-1"><PackageOpen className="h-5 w-5 text-primary"/> العناصر:</h4>
              {isFetchingOrderDetails ? (
                <p className="text-center text-muted-foreground py-4">جارٍ تحميل عناصر الطلب...</p>
              ) : detailedOrderItems.length > 0 ? (
                <ul className="space-y-2">
                  {detailedOrderItems.map((item: DetailedOrderItem, index: number) => ( 
                    <li key={`${item.id}-${index}`} className="flex items-start gap-3 p-2 border rounded-md">
                      <NextImage 
                        src={item.imageUrl || 'https://placehold.co/50x50.png'} 
                        alt={item.name} 
                        width={50} 
                        height={50} 
                        className="rounded-md h-12 w-12 object-cover" 
                        data-ai-hint={item.dataAiHint || "food item"}
                      />
                      <div className="flex-grow">
                        <p className="font-medium">{item.name} <span className="text-muted-foreground text-sm">x {item.quantity}</span></p>
                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} لكل عنصر</p>
                        {item.notes && <p className="text-xs text-blue-600 italic">ملاحظات: {item.notes}</p>}
                      </div>
                      <p className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-4">لا توجد عناصر في هذا الطلب.</p>
              )}
              <Separator className="my-3"/>
              <div className="flex justify-start items-center">
                <p className="text-lg font-bold">الإجمالي: ${selectedOrder.total_amount.toFixed(2)}</p>
              </div>
            </div>
            <DialogClose asChild>
                <Button variant="outline" className="mt-4 w-full">إغلاق</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    