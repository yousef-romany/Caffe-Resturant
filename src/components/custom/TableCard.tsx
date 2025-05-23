
"use client";

import { useState } from 'react';
import type { Table, TableStatus } from '@/constants';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CircleCheck, CircleX, Trash2, Ban, Check, Edit3, Beer, Sparkles, DollarSign, Eye, QrCode as QrCodeIcon, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import NextImage from 'next/image';

interface TableCardProps {
  table: Table;
  onStatusChange: (tableId: string, newStatus: TableStatus) => void; // Removed associatedAction
}

export function TableCard({ table, onStatusChange }: TableCardProps) {
  const router = useRouter();
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const qrCodeData = `/website/menu?table_id=${table.id}&table_number=${table.number}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeData)}`;


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
    localStorage.setItem('pos_target_table_number', table.number);
    localStorage.removeItem('pos_target_order_id'); 
    localStorage.setItem('pos_action', 'new_order_for_table');
    onStatusChange(table.id, 'مشغولة');
    router.push('/pos');
  };
  
  const handleReserveTable = () => {
    onStatusChange(table.id, 'محجوزة');
  };

  const handleConfirmReservation = () => {
    localStorage.setItem('pos_target_table_number', table.number);
    localStorage.removeItem('pos_target_order_id');
    localStorage.setItem('pos_action', 'new_order_for_table'); 
    onStatusChange(table.id, 'مشغولة');
    router.push('/pos');
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
    // In a real app, POS would clear orderId from table after payment.
    // For now, this button directly marks table for cleaning.
    onStatusChange(table.id, 'تحتاج تنظيف');
  };

  const handleCleaned = () => {
    onStatusChange(table.id, 'متاحة');
  };

  const handlePrintTableQr = () => {
    const printableArea = document.querySelector(`.table-qr-dialog-printable-area-${table.id}`);
    if (printableArea) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write('<html><head><title>Print QR - Table ' + table.number + '</title>');
      printWindow?.document.write('<link rel="stylesheet" href="/_next/static/css/app/layout.css">'); // Adjust if your global CSS path differs
      printWindow?.document.write('<style>body { margin: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; } .qr-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; } .qr-code-img { width: 250px !important; height: 250px !important; border: 1px solid #ccc; } .qr-data-text { font-size: 10px; margin-top: 5px; word-break: break-all; max-width: 250px; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } button, .no-print { display: none !important; } }</style>');
      printWindow?.document.write('</head><body>');
      printWindow?.document.write(printableArea.innerHTML);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
    }
  };


  return (
    <>
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
           <Button 
            variant="secondary" 
            onClick={() => setIsQrDialogOpen(true)} 
            className="w-full col-span-full mt-2"
          >
            <QrCodeIcon className="h-4 w-4 me-2" /> عرض QR للطاولة
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className={`sm:max-w-md table-qr-dialog-printable-area-${table.id}`}>
          <DialogHeader>
            <DialogTitle className="qr-title text-center text-2xl">QR Code لطاولة رقم: {table.number}</DialogTitle>
            <DialogDescription className="text-center no-print">
              امسح هذا الرمز لبدء الطلب لهذه الطاولة من خلال موقعنا.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center my-6">
            <NextImage
              src={qrCodeUrl}
              alt={`QR Code لطاولة ${table.number}`}
              width={250}
              height={250}
              className="rounded-md border qr-code-img"
              data-ai-hint="table QR code"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center break-all qr-data-text">
              بيانات الـQR (للتطوير): {qrCodeData}
            </p>
          </div>
          <DialogFooter className="sm:justify-center no-print">
            <Button type="button" variant="outline" onClick={() => handlePrintTableQr()}>
              <Printer className="me-2 h-4 w-4" /> طباعة
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">إغلاق</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
