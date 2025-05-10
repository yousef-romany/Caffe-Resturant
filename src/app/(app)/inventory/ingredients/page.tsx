
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
import { DUMMY_INGREDIENTS, INGREDIENT_UNITS, type Ingredient, type IngredientUnit } from '@/constants';
import { PlusCircle, Edit, Trash2, ShoppingBasket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialNewIngredientState: Omit<Ingredient, 'id'> = {
  name: '',
  unit: INGREDIENT_UNITS[0],
  stockQuantity: 0,
  costPerUnit: 0,
  lowStockThreshold: undefined,
  supplierId: undefined,
};

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [newIngredientData, setNewIngredientData] = useState(initialNewIngredientState);
  const { toast } = useToast();

  useEffect(() => {
    setIngredients(DUMMY_INGREDIENTS);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = (name === 'stockQuantity' || name === 'costPerUnit' || name === 'lowStockThreshold') ? parseFloat(value) : value;
    setNewIngredientData(prev => ({ ...prev, [name]: name === 'lowStockThreshold' && value === '' ? undefined : numValue }));
  };

  const handleUnitChange = (value: string) => {
    setNewIngredientData(prev => ({ ...prev, unit: value as IngredientUnit }));
  };

  const handleSubmit = () => {
    if (!newIngredientData.name || newIngredientData.stockQuantity < 0 || newIngredientData.costPerUnit <= 0) {
      toast({ title: "خطأ", description: "الاسم، كمية صالحة، وتكلفة وحدة صالحة مطلوبة.", variant: "destructive" });
      return;
    }

    if (editingIngredient) {
      const updatedIngredient = { ...editingIngredient, ...newIngredientData };
      setIngredients(ingredients.map(ing => ing.id === editingIngredient.id ? updatedIngredient : ing));
      toast({ title: "نجاح", description: `تم تحديث ${updatedIngredient.name}.` });
    } else {
      const newIngredientWithId: Ingredient = {
        ...newIngredientData,
        id: `ing-${Date.now()}`,
      };
      setIngredients([newIngredientWithId, ...ingredients]);
      toast({ title: "نجاح", description: `تمت إضافة ${newIngredientWithId.name}.` });
    }
    setIsDialogOpen(false);
    setEditingIngredient(null);
    setNewIngredientData(initialNewIngredientState);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setNewIngredientData(ingredient);
    setIsDialogOpen(true);
  };

  const handleDeleteIngredient = (ingredientToDelete: Ingredient) => {
    // Add confirmation dialog in real app
    setIngredients(ingredients.filter(ing => ing.id !== ingredientToDelete.id));
    toast({ title: "نجاح", description: `تم حذف ${ingredientToDelete.name}.`, variant: "destructive" });
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
                    <TableCell className="text-center">{ingredient.stockQuantity}</TableCell>
                    <TableCell className="text-center">${ingredient.costPerUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{ingredient.lowStockThreshold ?? '-'}</TableCell>
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
              <Input id="stockQuantity" name="stockQuantity" type="number" value={newIngredientData.stockQuantity} onChange={handleInputChange} className="col-span-3" min="0" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="costPerUnit" className="text-left">تكلفة الوحدة ($)</Label>
              <Input id="costPerUnit" name="costPerUnit" type="number" value={newIngredientData.costPerUnit} onChange={handleInputChange} className="col-span-3" min="0" step="0.01" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lowStockThreshold" className="text-left">حد المخزون المنخفض</Label>
              <Input id="lowStockThreshold" name="lowStockThreshold" type="number" value={newIngredientData.lowStockThreshold ?? ''} onChange={handleInputChange} className="col-span-3" min="0" placeholder="اختياري" />
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
