
"use client";

import type { Table, TableStatus } from '@/constants';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CircleCheck, CircleX, Trash2, Ban, Check, Edit3, Beer, Sparkles, DollarSign, Eye } from 'lucide-react'; // Replaced Table with Beer (example), Sparkles for cleaning
import { useRouter } from 'next/navigation';

interface TableCardProps {
  table: Table;
  onStatusChange: (tableId: string, newStatus: TableStatus, associatedAction?: 'create_order') => void;
}

export function TableCard({ table, onStatusChange }: TableCardProps) {
  const router = useRouter();

  const getStatusBadgeVariant = (status: TableStatus) => {
    switch (status) {
      case 'متاحة': return 'default'; // Greenish in default theme
      case 'مشغولة': return 'destructive'; // Reddish
      case 'محجوزة': return 'secondary'; // Bluish/Grayish
      case 'تحتاج تنظيف': return 'outline'; // Yellowish/Orange if theme supports, else neutral
      default: return 'outline';
    }
  };

  const handleOccupyTable = () => {
    onStatusChange(table.id, 'مشغولة', 'create_order');
  };
  
  const handleReserveTable = () => {
    // In a real app, this would open a dialog for reservation details
    onStatusChange(table.id, 'محجوزة');
  };

  const handleConfirmReservation = () => {
    onStatusChange(table.id, 'مشغولة', 'create_order');
  };

  const handleCancelReservation = () => {
    onStatusChange(table.id, 'متاحة');
  };
  
  const handleViewOrder = () => {
    if (table.orderId) {
      // Find the order from DUMMY_ORDERS to pass to POS or specific order view page
      // For now, just log or route to a generic orders page
      router.push(`/pos?table=${table.number}&orderId=${table.orderId}`);
    }
  };

  const handleFinishAndPay = () => {
    // Simulate payment, then change status
    onStatusChange(table.id, 'تحتاج تنظيف');
  };

  const handleCleaned = () => {
    onStatusChange(table.id, 'متاحة');
  };


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">طاولة {table.number}</CardTitle>
          <Badge variant={getStatusBadgeVariant(table.status)} className="text-xs whitespace-nowrap">
            {table.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-sm">
          <Users className="h-4 w-4" />
          <span>تسع لـ {table.capacity} أفراد</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Placeholder for additional info like current order summary if occupied */}
        {table.status === 'مشغولة' && table.orderId && (
          <p className="text-xs text-muted-foreground">طلب نشط: {table.orderId}</p>
        )}
         {table.status === 'محجوزة' && (
          <p className="text-xs text-blue-600">محجوزة لـ (اسم الحجز)</p> // Placeholder
        )}
      </CardContent>
      <CardFooter className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {table.status === 'متاحة' && (
          <>
            <Button onClick={handleOccupyTable} className="w-full bg-green-500 hover:bg-green-600 text-white">
              <Beer className="h-4 w-4 me-2" /> إشغال الطاولة
            </Button>
            <Button onClick={handleReserveTable} variant="outline" className="w-full">
              <Edit3 className="h-4 w-4 me-2" /> حجز الطاولة
            </Button>
          </>
        )}
        {table.status === 'مشغولة' && (
          <>
            <Button onClick={handleViewOrder} variant="outline" className="w-full">
              <Eye className="h-4 w-4 me-2" /> عرض الطلب
            </Button>
            <Button onClick={handleFinishAndPay} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <DollarSign className="h-4 w-4 me-2" /> إنهاء وحساب
            </Button>
          </>
        )}
        {table.status === 'محجوزة' && (
          <>
            <Button onClick={handleConfirmReservation} className="w-full bg-green-500 hover:bg-green-600 text-white">
              <Check className="h-4 w-4 me-2" /> تأكيد الحضور
            </Button>
            <Button onClick={handleCancelReservation} variant="destructive" className="w-full">
              <Ban className="h-4 w-4 me-2" /> إلغاء الحجز
            </Button>
          </>
        )}
        {table.status === 'تحتاج تنظيف' && (
          <Button onClick={handleCleaned} className="w-full col-span-full bg-amber-500 hover:bg-amber-600 text-white">
            <Sparkles className="h-4 w-4 me-2" /> تم التنظيف
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
