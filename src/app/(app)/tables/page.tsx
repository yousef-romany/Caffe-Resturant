
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { TableCard } from '@/components/custom/TableCard';
import { DUMMY_TABLES, DUMMY_ORDERS, type Table, type TableStatus } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { Table2 as TableIcon, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Removed useSearchParams as it's no longer directly used here for this flow
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

  useEffect(() => {
    setIsClient(true);
    // Initialize with a deep copy to allow local modifications
    setTables(JSON.parse(JSON.stringify(DUMMY_TABLES)));
  }, []);
  

  const handleTableStatusChange = (tableId: string, newStatus: TableStatus, associatedAction?: 'create_order') => {
    let updatedOrderId: string | undefined = undefined;
    let targetTableNumber: string | undefined = undefined;

    setTables(prevTables =>
      prevTables.map(table => {
        if (table.id === tableId) {
          targetTableNumber = table.number; // Capture table number for navigation
          const updatedTable = { ...table, status: newStatus };
          if (newStatus === 'مشغولة' && associatedAction === 'create_order') {
            updatedOrderId = table.orderId || `order-${Date.now()}`; 
            updatedTable.orderId = updatedOrderId;
            
            if (!table.orderId) {
                const newOrder = {
                  id: updatedOrderId,
                  orderNumber: `طلب-${Date.now().toString().slice(-5)}`,
                  items: [],
                  subtotal: 0,
                  totalAmount: 0,
                  status: 'قيد الانتظار' as const,
                  type: 'صالة' as const,
                  tableNumber: table.number,
                  createdAt: new Date(),
                };
                DUMMY_ORDERS.unshift(newOrder);
            }

          } else if (newStatus === 'متاحة' || newStatus === 'تحتاج تنظيف') {
            updatedTable.orderId = undefined; 
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

    if (newStatus === 'مشغولة' && associatedAction === 'create_order' && targetTableNumber && updatedOrderId) {
        localStorage.setItem('pos_target_table_number', targetTableNumber);
        localStorage.setItem('pos_target_order_id', updatedOrderId);
        localStorage.setItem('pos_action', 'edit_order'); // Or 'new_order_for_table' if always starting fresh POS for it
        router.push('/pos');
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
