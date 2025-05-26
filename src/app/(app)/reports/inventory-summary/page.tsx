
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Ingredient } from '@/constants';
import { Package, AlertTriangle, Archive, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually';


export default function InventorySummaryReportPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [totalIngredients, setTotalIngredients] = useState(0);
  const [lowStockIngredientsCount, setLowStockIngredientsCount] = useState(0);
  const [lowStockItemsList, setLowStockItemsList] = useState<Ingredient[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly'); 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
     async function initDb() {
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB for inventory summary report:", error);
        toast({ title: "خطأ في الاتصال", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
      }
    }
    initDb();
  }, [toast]);

  useEffect(() => {
    if (!isClient || !db) {
      setIsLoading(db === null);
      return;
    }

    async function fetchInventoryData() {
      setIsLoading(true);
      try {
        const totalIngredientsResult: any[] = await db.select("SELECT COUNT(*) as count FROM ingredients");
        setTotalIngredients(Number(totalIngredientsResult[0]?.count) || 0);

        const lowStockResult: Ingredient[] = await db.select<Ingredient[]>(
            "SELECT id, name, unit, stock_quantity as stockQuantity, cost_per_unit as costPerUnit, low_stock_threshold as lowStockThreshold, supplier_id as supplierId FROM ingredients WHERE stock_quantity < low_stock_threshold AND low_stock_threshold IS NOT NULL"
        );
        setLowStockIngredientsCount(lowStockResult.length);
        setLowStockItemsList(lowStockResult.map(ing => ({
          ...ing,
          stockQuantity: Number(ing.stockQuantity),
          costPerUnit: Number(ing.costPerUnit),
          lowStockThreshold: ing.lowStockThreshold ? Number(ing.lowStockThreshold) : undefined,
        })));
      } catch (error) {
        console.error("Error fetching inventory summary data:", error);
        toast({ title: "خطأ", description: "فشل في جلب بيانات ملخص المخزون.", variant: "destructive" });
        setTotalIngredients(0); setLowStockIngredientsCount(0); setLowStockItemsList([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventoryData();
  }, [selectedPeriod, isClient, db, toast]); 

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as ReportPeriod);
  };

  const getPeriodLabel = () => {
    return "الوقت الحالي"; 
  };

  if (!isClient || isLoading) {
    return (
      <>
        <PageHeader title="ملخص المخزون" description="جارٍ تحميل بيانات التقرير..." icon={Archive}/>
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="ملخص المخزون" 
        description={`نظرة عامة على حالة المخزون والمكونات التي تحتاج لإعادة طلب (${getPeriodLabel()}).`} 
        icon={Archive}
         actions={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={handlePeriodChange} disabled>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="الوقت الحالي (لا يوجد فلتر فترة)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">الوقت الحالي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package className="h-6 w-6 text-primary"/>إحصائيات المخزون</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">إجمالي أنواع المكونات</p>
                        <p className="text-2xl font-bold">{totalIngredients}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">مكونات تحتاج إعادة طلب</p>
                        <p className="text-2xl font-bold text-destructive">{lowStockIngredientsCount}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-lg row-span-1 lg:row-span-1">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive"/>مكونات تحتاج إعادة طلب</CardTitle>
                    <CardDescription>المكونات التي وصلت إلى حد المخزون المنخفض.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                    {lowStockItemsList.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المكون</TableHead>
                                    <TableHead className="text-center">الكمية الحالية</TableHead>
                                    <TableHead className="text-center">حد الطلب</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockItemsList.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name} <span className="text-xs text-muted-foreground">({item.unit})</span></TableCell>
                                        <TableCell className="text-center text-destructive font-semibold">{Number(item.stockQuantity).toLocaleString()}</TableCell>
                                        <TableCell className="text-center">{item.lowStockThreshold?.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="p-4 text-center text-muted-foreground">لا توجد مكونات تحتاج إعادة طلب حاليًا.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </>
  );
}

    