
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { DUMMY_SUPPLIERS, INGREDIENT_UNITS, type Ingredient, type IngredientUnit, type Supplier } from '@/constants'; // Keep DUMMY_SUPPLIERS for now
import { PlusCircle, Edit, Trash2, ShoppingBasket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

const initialNewIngredientState: Omit<Ingredient, 'id'> = {
  name: '',
  unit: INGREDIENT_UNITS[0],
  stockQuantity: 0,
  costPerUnit: 0,
  lowStockThreshold: undefined,
  supplierId: undefined,
};

export default function IngredientsPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [newIngredientData, setNewIngredientData] = useState(initialNewIngredientState);
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>(DUMMY_SUPPLIERS); // Still using dummy suppliers for dropdown
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDbAndFetchData() {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        await fetchIngredients(dbInstance);
        // TODO: Fetch suppliers from DB when suppliers page is converted
        // await fetchSuppliers(dbInstance); 
      } catch (error) {
        console.error("Failed to initialize DB or fetch data:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات المكونات.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadDbAndFetchData();
  }, [toast]);

  const fetchIngredients = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const fetchedIngredients: any[] = await currentDb.select(
        'SELECT id, name, unit, stock_quantity as stockQuantity, cost_per_unit as costPerUnit, low_stock_threshold as lowStockThreshold, supplier_id as supplierId FROM ingredients ORDER BY name'
      );
      setIngredients(fetchedIngredients.map(ing => ({
        ...ing,
        stockQuantity: Number(ing.stockQuantity) || 0,
        costPerUnit: Number(ing.costPerUnit) || 0,
        lowStockThreshold: ing.lowStockThreshold !== null && ing.lowStockThreshold !== undefined ? Number(ing.lowStockThreshold) : undefined,
      })));
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات المكونات.", variant: "destructive" });
      setIngredients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder for fetching suppliers from DB in the future
  // const fetchSuppliers = async (currentDb: Database) => { ... }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = (name === 'stockQuantity' || name === 'costPerUnit' || name === 'lowStockThreshold') ? parseFloat(value) : value;
    setNewIngredientData(prev => ({ ...prev, [name]: (name === 'lowStockThreshold' || name === 'stockQuantity' || name === 'costPerUnit') && value === '' ? undefined : numValue }));
  };

  const handleUnitChange = (value: string) => {
    setNewIngredientData(prev => ({ ...prev, unit: value as IngredientUnit }));
  };

  const handleSupplierChange = (supplierId: string) => {
    setNewIngredientData(prev => ({ ...prev, supplierId: supplierId === "none" ? undefined : supplierId }));
  };

  const handleSubmit = async () => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    if (!newIngredientData.name || newIngredientData.stockQuantity < 0 || newIngredientData.costPerUnit <= 0) {
      toast({ title: "خطأ", description: "الاسم، كمية صالحة (أكبر أو تساوي صفر)، وتكلفة وحدة صالحة (أكبر من صفر) مطلوبة.", variant: "destructive" });
      return;
    }

    const ingredientDataToSave = {
      name: newIngredientData.name,
      unit: newIngredientData.unit,
      stock_quantity: Number(newIngredientData.stockQuantity) || 0,
      cost_per_unit: Number(newIngredientData.costPerUnit) || 0,
      low_stock_threshold: newIngredientData.lowStockThreshold !== undefined ? Number(newIngredientData.lowStockThreshold) : null,
      supplier_id: newIngredientData.supplierId || null,
    };

    try {
      if (editingIngredient) {
        await db.execute(
          'UPDATE ingredients SET name = $1, unit = $2, stock_quantity = $3, cost_per_unit = $4, low_stock_threshold = $5, supplier_id = $6 WHERE id = $7',
          [ingredientDataToSave.name, ingredientDataToSave.unit, ingredientDataToSave.stock_quantity, ingredientDataToSave.cost_per_unit, ingredientDataToSave.low_stock_threshold, ingredientDataToSave.supplier_id, editingIngredient.id]
        );
        toast({ title: "نجاح", description: `تم تحديث المكون ${ingredientDataToSave.name}.` });
      } else {
        const newIngredientId = `ing-${Date.now()}`;
        await db.execute(
          'INSERT INTO ingredients (id, name, unit, stock_quantity, cost_per_unit, low_stock_threshold, supplier_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [newIngredientId, ingredientDataToSave.name, ingredientDataToSave.unit, ingredientDataToSave.stock_quantity, ingredientDataToSave.cost_per_unit, ingredientDataToSave.low_stock_threshold, ingredientDataToSave.supplier_id]
        );
        toast({ title: "نجاح", description: `تمت إضافة المكون ${ingredientDataToSave.name}.` });
      }
      setIsDialogOpen(false);
      setEditingIngredient(null);
      setNewIngredientData(initialNewIngredientState);
      await fetchIngredients(db);
    } catch (error) {
      console.error("Error submitting ingredient:", error);
      toast({ title: "خطأ في الحفظ", description: "فشل حفظ بيانات المكون.", variant: "destructive" });
    }
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setNewIngredientData({
        name: ingredient.name,
        unit: ingredient.unit,
        stockQuantity: ingredient.stockQuantity,
        costPerUnit: ingredient.costPerUnit,
        lowStockThreshold: ingredient.lowStockThreshold,
        supplierId: ingredient.supplierId,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteIngredient = async (ingredientToDelete: Ingredient) => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    try {
      await db.execute('DELETE FROM ingredients WHERE id = $1', [ingredientToDelete.id]);
      toast({ title: "نجاح", description: `تم حذف المكون ${ingredientToDelete.name}.`, variant: "destructive" });
      await fetchIngredients(db);
    } catch (error: any) {
      console.error("Error deleting ingredient:", error);
      if (error.message && error.message.includes("constraint failed")) { // Basic check for FK constraint error
          toast({ title: "خطأ في الحذف", description: "لا يمكن حذف المكون لأنه مستخدم في عناصر قائمة أو أوامر شراء.", variant: "destructive" });
      } else {
          toast({ title: "خطأ في الحذف", description: "فشل حذف المكون.", variant: "destructive" });
      }
    }
  };
  
  const openNewIngredientDialog = () => {
    setEditingIngredient(null);
    setNewIngredientData(initialNewIngredientState);
    setIsDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="إدارة المكونات"
        description="إضافة وتعديل وحذف مكونات المخزون."
        icon={ShoppingBasket}
        actions={
          <Button onClick={openNewIngredientDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 me-2" /> إضافة مكون جديد
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardContent className="p-0">
           {isLoading ? (
            <p className="text-center text-muted-foreground p-10">جارٍ تحميل بيانات المكونات...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead className="text-center">الكمية بالمخزون</TableHead>
                  <TableHead className="text-center">تكلفة الوحدة ($)</TableHead>
                  <TableHead className="text-center">حد المخزون المنخفض</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.length > 0 ? (
                  ingredients.map(ingredient => (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">{ingredient.name}</TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell className="text-center">{ingredient.stockQuantity.toLocaleString()}</TableCell>
                      <TableCell className="text-center">${ingredient.costPerUnit.toFixed(4)}</TableCell>
                      <TableCell className="text-center">{ingredient.lowStockThreshold?.toLocaleString() ?? '-'}</TableCell>
                      <TableCell className="text-center space-x-2 space-x-reverse">
                        <Button variant="ghost" size="icon" onClick={() => handleEditIngredient(ingredient)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(ingredient)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا توجد مكونات في المخزون بعد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingIngredient ? 'تعديل المكون' : 'إضافة مكون جديد'}</DialogTitle>
            <DialogDescription>
              {editingIngredient ? 'قم بتحديث تفاصيل هذا المكون.' : 'املأ تفاصيل المكون الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto ps-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left">الاسم</Label>
              <Input id="name" name="name" value={newIngredientData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-left">الوحدة</Label>
              <Select name="unit" value={newIngredientData.unit} onValueChange={handleUnitChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stockQuantity" className="text-left">الكمية بالمخزون</Label>
              <Input id="stockQuantity" name="stockQuantity" type="number" value={newIngredientData.stockQuantity} onChange={handleInputChange} className="col-span-3" min="0" step="any" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="costPerUnit" className="text-left">تكلفة الوحدة ($)</Label>
              <Input id="costPerUnit" name="costPerUnit" type="number" value={newIngredientData.costPerUnit} onChange={handleInputChange} className="col-span-3" min="0" step="any" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lowStockThreshold" className="text-left">حد المخزون المنخفض</Label>
              <Input id="lowStockThreshold" name="lowStockThreshold" type="number" value={newIngredientData.lowStockThreshold ?? ''} onChange={handleInputChange} className="col-span-3" min="0" step="any" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplierId" className="text-left">المورد (اختياري)</Label>
              <Select name="supplierId" value={newIngredientData.supplierId || "none"} onValueChange={handleSupplierChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مورد محدد</SelectItem>
                  {suppliers.map(sup => ( // Still using dummy suppliers for now
                    <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingIngredient ? 'حفظ التغييرات' : 'إضافة مكون'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


    