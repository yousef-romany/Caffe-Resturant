
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DUMMY_INGREDIENTS, type Ingredient } from '@/constants';
import { Package, AlertTriangle, Archive, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'custom';


export default function InventorySummaryReportPage() {
  const [totalIngredients, setTotalIngredients] = useState(0);
  const [lowStockIngredientsCount, setLowStockIngredientsCount] = useState(0);
  const [lowStockItemsList, setLowStockItemsList] = useState<Ingredient[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('monthly'); // Period might affect historical stock levels in real app
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTotalIngredients(DUMMY_INGREDIENTS.length);
    const lowStock = DUMMY_INGREDIENTS.filter(ing => ing.lowStockThreshold !== undefined && ing.stockQuantity < ing.lowStockThreshold);
    setLowStockIngredientsCount(lowStock.length);
    setLowStockItemsList(lowStock);
  }, [selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as ReportPeriod);
  };

  if (!isClient) {
    return (
      <>
        <PageHeader title="ملخص المخزون" description="نظرة عامة على حالة المخزون." icon={Archive}/>
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل التقرير...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="ملخص المخزون" 
        description="نظرة عامة على حالة المخزون والمكونات التي تحتاج لإعادة طلب." 
        icon={Archive}
         actions={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">الوقت الحالي</SelectItem> {/* Simplified for dummy data */}
                <SelectItem value="custom" disabled>فترة مخصصة (قريباً)</SelectItem>
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
            <Card className="shadow-lg row-span-1 lg:row-span-1"> {/* Changed row-span for better layout if only two cards */}
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
                                        <TableCell className="text-center text-destructive font-semibold">{item.stockQuantity}</TableCell>
                                        <TableCell className="text-center">{item.lowStockThreshold}</TableCell>
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
        {/* Potentially add charts for stock value, turnover rates etc. */}
    </>
  );
}
