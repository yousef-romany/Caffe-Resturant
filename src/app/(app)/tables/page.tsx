
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { TableCard } from '@/components/custom/TableCard';
import { type Table, type TableStatus } from '@/constants'; 
import { useToast } from '@/hooks/use-toast';
import { Table2 as TableIcon, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { TABLE_STATUSES } from '@/constants';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

export default function TablesPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'الكل'>('الكل');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadDbAndFetchTables() {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        await fetchTables(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch tables:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات الطاولات.", variant: "destructive" });
        setIsLoading(false);
      }
    }
    loadDbAndFetchTables();
  }, [toast]);

  const fetchTables = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const dbTables: any[] = await currentDb.select(
        'SELECT id, number, status, capacity, current_order_id as orderId FROM tables_info ORDER BY CAST(number AS UNSIGNED), number'
      );
      setTables(dbTables.map(t => ({
        ...t,
        capacity: Number(t.capacity) 
      })));
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات الطاولات.", variant: "destructive" });
      setTables([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableStatusChange = async (tableId: string, newStatus: TableStatus) => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }

    const tableToUpdateLocally = tables.find(t => t.id === tableId);
    if (!tableToUpdateLocally) return;

    let sql = 'UPDATE tables_info SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [newStatus];
    let updatedLocalOrderId: string | undefined = tableToUpdateLocally.orderId;

    if (newStatus === 'متاحة' || newStatus === 'تحتاج تنظيف') {
      sql += ', current_order_id = NULL'; 
      updatedLocalOrderId = undefined;
    }
    
    sql += ' WHERE id = ?';
    params.push(tableId);

    try {
      await db.execute(sql, params);

      setTables(prevTables =>
        prevTables.map(t =>
          t.id === tableId ? { ...t, status: newStatus, orderId: updatedLocalOrderId } : t
        )
      );

      toast({
        title: `تحديث حالة الطاولة ${tableToUpdateLocally.number}`,
        description: `تم تغيير حالة الطاولة ${tableToUpdateLocally.number} إلى ${newStatus}.`,
      });

    } catch (error) {
      console.error("Error updating table status:", error);
      toast({ title: "خطأ", description: "فشل تحديث حالة الطاولة في قاعدة البيانات.", variant: "destructive" });
      if (db) await fetchTables(db); 
    }
  };
  
  const filteredTables = tables.filter(table => 
    filterStatus === 'الكل' || table.status === filterStatus
  );

  const resetFilters = () => {
    setFilterStatus('الكل');
  };

  if (isLoading) {
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
          {tables.length === 0 ? "لا توجد طاولات معرفة في النظام." : 
           filterStatus !== 'الكل' ? `لا توجد طاولات بحالة "${filterStatus}".` : "لا توجد طاولات لعرضها."}
        </p>
      )}
    </>
  );
}

    