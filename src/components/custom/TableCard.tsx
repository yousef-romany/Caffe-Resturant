
"use client";

import type { Table, TableStatus } from '@/constants';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CircleCheck, CircleX, Trash2, Ban, Check, Edit3, Beer, Sparkles, DollarSign, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TableCardProps {
  table: Table;
  onStatusChange: (tableId: string, newStatus: TableStatus, associatedAction?: 'create_order') => void;
}

export function TableCard({ table, onStatusChange }: TableCardProps) {
  const router = useRouter();

  const getStatusBadgeVariant = (status: TableStatus) => {
    switch (status) {
      case 'متاحة': return 'default';
      case 'مشغولة': return 'destructive';
      case 'محجوزة': return 'secondary';
      case 'تحتاج تنظيف': return 'outline';
      default: return 'outline';
    }
  };

  const handleOccupyTable = () => {
    // This function is now more streamlined as the POS navigation is handled by onStatusChange
    onStatusChange(table.id, 'مشغولة', 'create_order');
  };
  
  const handleReserveTable = () => {
    onStatusChange(table.id, 'محجوزة');
  };

  const handleConfirmReservation = () => {
    // This should also navigate to POS after setting localStorage
    onStatusChange(table.id, 'مشغولة', 'create_order');
  };

  const handleCancelReservation = () => {
    onStatusChange(table.id, 'متاحة');
  };
  
  const handleViewOrder = () => {
    if (table.orderId && table.number) {
      localStorage.setItem('pos_target_table_number', table.number);
      localStorage.setItem('pos_target_order_id', table.orderId);
      localStorage.setItem('pos_action', 'edit_order');
      router.push('/pos');
    }
  };

  const handleFinishAndPay = () => {
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
        {table.status === 'مشغولة' && table.orderId && (
          <p className="text-xs text-muted-foreground">طلب نشط: {table.orderId}</p>
        )}
         {table.status === 'محجوزة' && (
          <p className="text-xs text-blue-600">محجوزة لـ (اسم الحجز)</p> 
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
