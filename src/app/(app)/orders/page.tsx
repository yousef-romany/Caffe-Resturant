
"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { DUMMY_ORDERS, type Order, type OrderStatus, type OrderType } from '@/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card'; // Added Card imports
import { Label } from '@/components/ui/label'; // Added Label import
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
import { Eye, Filter, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale'; // Arabic locale for date-fns
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import NextImage from 'next/image'; // Renamed to avoid conflict
import { Separator } from '@/components/ui/separator';


const ORDER_STATUSES: OrderStatus[] = ["قيد الانتظار", "قيد التجهيز", "جاهز", "مكتمل", "ملغى"];
const ORDER_TYPES: OrderType[] = ["صالة", "سفري", "توصيل"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'الكل'>('الكل');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'الكل'>('الكل');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setOrders(DUMMY_ORDERS.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      (order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
       (order.tableNumber && order.tableNumber.includes(searchTerm))) &&
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
      <PageHeader title="سجل الطلبات" description="عرض وإدارة جميع طلبات العملاء." />

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>التفاصيل</TableHead> {/* For Customer/Table/Captain */}
                <TableHead className="text-left">المبلغ</TableHead> {/* Changed to text-left for RTL */}
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient && filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'PPpp', { locale: arSA })}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>
                      {order.type === 'صالة' && order.tableNumber && `طاولة: ${order.tableNumber}`}
                      {order.type === 'توصيل' && order.customerName && `${order.customerName}`}
                      {order.type === 'توصيل' && order.captainName && ` (الكابتن: ${order.captainName})`}
                      {order.type === 'سفري' && order.customerName && `${order.customerName}`}
                    </TableCell>
                    <TableCell className="text-left">${order.totalAmount.toFixed(2)}</TableCell> {/* Changed to text-left for RTL */}
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : isClient ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    لم يتم العثور على طلبات.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    جارٍ تحميل الطلبات...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب: {selectedOrder.orderNumber}</DialogTitle>
              <DialogDescription>
                التاريخ: {format(new Date(selectedOrder.createdAt), 'PPpp', { locale: arSA })}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto ps-2 space-y-4">
              <p><strong>الحالة:</strong> <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge></p>
              <p><strong>النوع:</strong> {selectedOrder.type}</p>
              {selectedOrder.type === 'صالة' && selectedOrder.tableNumber && <p><strong>الطاولة:</strong> {selectedOrder.tableNumber}</p>}
              {selectedOrder.customerName && <p><strong>العميل:</strong> {selectedOrder.customerName}</p>}
              {selectedOrder.type === 'توصيل' && selectedOrder.deliveryAddress && <p><strong>العنوان:</strong> {selectedOrder.deliveryAddress}</p>}
              {selectedOrder.type === 'توصيل' && selectedOrder.captainName && <p><strong>الكابتن:</strong> {selectedOrder.captainName}</p>}
              
              <h4 className="font-semibold mt-4">العناصر:</h4>
              <ul className="space-y-2">
                {selectedOrder.items.map(item => (
                  <li key={item.id} className="flex items-start gap-3 p-2 border rounded-md">
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
              <div className="flex justify-start items-center"> {/* Changed to justify-start for RTL */}
                <p className="text-lg font-bold">الإجمالي: ${selectedOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
