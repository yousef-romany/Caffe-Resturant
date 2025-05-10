
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { TableCard } from '@/components/custom/TableCard';
import { DUMMY_TABLES, DUMMY_ORDERS, type Table, type TableStatus } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { Table2 as TableIcon, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { TABLE_STATUSES } from '@/constants';


export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'الكل'>('الكل');
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);
    // Initialize with a deep copy to allow local modifications
    setTables(JSON.parse(JSON.stringify(DUMMY_TABLES)));
  }, []);
  
  useEffect(() => {
    // This effect handles creating a new order if redirected from POS with newOrderForTable
    const newOrderForTable = searchParams.get('newOrderForTable');
    const orderId = searchParams.get('orderId');

    if (newOrderForTable && orderId) {
       setTables(prevTables =>
        prevTables.map(t =>
          t.number === newOrderForTable ? { ...t, status: 'مشغولة', orderId: orderId } : t
        )
      );
      // Optionally, clear these search params from the URL
      // router.replace('/tables', undefined); // Next 13 way to clear search params
    }
  }, [searchParams, router]);


  const handleTableStatusChange = (tableId: string, newStatus: TableStatus, associatedAction?: 'create_order') => {
    let updatedOrderId: string | undefined = undefined;

    setTables(prevTables =>
      prevTables.map(table => {
        if (table.id === tableId) {
          const updatedTable = { ...table, status: newStatus };
          if (newStatus === 'مشغولة' && associatedAction === 'create_order') {
            // Simulate creating a new order ID if one doesn't exist (e.g. from available or confirmed reservation)
            updatedOrderId = table.orderId || `order-${Date.now()}`; // Keep existing if present, or create new
            updatedTable.orderId = updatedOrderId;
            
            // Create a dummy order if it's a new occupation
            if (!table.orderId) {
                const newOrder = {
                  id: updatedOrderId,
                  orderNumber: `طلب-${Date.now().toString().slice(-5)}`,
                  items: [],
                  totalAmount: 0,
                  status: 'قيد الانتظار' as const, // Or 'قيد التجهيز' if items are added immediately
                  type: 'صالة' as const,
                  tableNumber: table.number,
                  createdAt: new Date(),
                };
                DUMMY_ORDERS.unshift(newOrder);
            }

          } else if (newStatus === 'متاحة' || newStatus === 'تحتاج تنظيف') {
            updatedTable.orderId = undefined; // Clear orderId when table becomes available or needs cleaning
          }
          return updatedTable;
        }
        return table;
      })
    );

    const table = tables.find(t => t.id === tableId);
    toast({
      title: `تحديث حالة الطاولة ${table?.number}`,
      description: `تم تغيير حالة الطاولة ${table?.number} إلى ${newStatus}.`,
    });

    if (newStatus === 'مشغولة' && associatedAction === 'create_order' && table) {
        // Navigate to POS to start/continue order for this table
        router.push(`/pos?table=${table.number}&orderId=${updatedOrderId}`);
    }
  };
  
  const filteredTables = tables.filter(table => 
    filterStatus === 'الكل' || table.status === filterStatus
  );

  const resetFilters = () => {
    setFilterStatus('الكل');
  };

  if (!isClient) {
    return (
      <>
        <PageHeader title="إدارة الطاولات" description="عرض وتحديث حالات الطاولات في الوقت الفعلي." icon={TableIcon} />
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل الطاولات...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="إدارة الطاولات" 
        description="عرض وتحديث حالات الطاولات في الوقت الفعلي." 
        icon={TableIcon}
        actions={
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as TableStatus | 'الكل')}>
              <SelectTrigger id="statusFilter" className="w-[180px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">جميع الحالات</SelectItem>
                {TABLE_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={resetFilters} variant="outline">
                <Filter className="h-4 w-4 me-2"/> مسح الفلتر
            </Button>
          </div>
        }
      />

      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              onStatusChange={handleTableStatusChange}
            />
          ))}
        </div>
      ) : (
         <p className="text-center text-muted-foreground py-10">
          {filterStatus !== 'الكل' ? `لا توجد طاولات بحالة "${filterStatus}".` : "لا توجد طاولات لعرضها."}
        </p>
      )}
    </>
  );
}
