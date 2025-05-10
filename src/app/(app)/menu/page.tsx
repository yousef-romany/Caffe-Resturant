
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { MenuItemCard } from '@/components/custom/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // Removed DialogTrigger as it's handled by openNewItemDialog
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DUMMY_MENU_ITEMS, ITEM_CATEGORIES, type MenuItem, type Category, DUMMY_INGREDIENTS, type MenuItemIngredient, type IngredientUnit, INGREDIENT_UNITS, type Ingredient as StockIngredient } from '@/constants';
import { PlusCircle, Edit, Trash2, Search, PackagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image'; 
import { Separator } from '@/components/ui/separator';

const initialNewItemState: Omit<MenuItem, 'id' | 'imageUrl'> & { manualCost?: number } = {
  name: '',
  category: ITEM_CATEGORIES[0],
  price: 0,
  manualCost: 0, 
  description: '',
  dataAiHint: '',
  ingredients: [],
};

const calculateMenuItemCost = (
  menuIngredients: MenuItemIngredient[] | undefined,
  allStockIngredients: StockIngredient[]
): number => {
  if (!menuIngredients || menuIngredients.length === 0) {
    return 0;
  }

  let totalCost = 0;
  menuIngredients.forEach(recipeIngredient => {
    const stockIngredient = allStockIngredients.find(i => i.id === recipeIngredient.ingredientId);
    if (stockIngredient && recipeIngredient.quantity > 0) {
      let costForIngredient = 0;
      // Simplified unit conversion logic.
      if (stockIngredient.unit === 'كيلوجرام' && recipeIngredient.unit === 'جرام') {
        costForIngredient = (stockIngredient.costPerUnit / 1000) * recipeIngredient.quantity;
      } else if (stockIngredient.unit === 'لتر' && recipeIngredient.unit === 'مللي لتر') {
        costForIngredient = (stockIngredient.costPerUnit / 1000) * recipeIngredient.quantity;
      } else if (stockIngredient.unit === 'جرام' && recipeIngredient.unit === 'كيلوجرام') {
        costForIngredient = (stockIngredient.costPerUnit * 1000) * recipeIngredient.quantity;
      } else if (stockIngredient.unit === 'مللي لتر' && recipeIngredient.unit === 'لتر') {
        costForIngredient = (stockIngredient.costPerUnit * 1000) * recipeIngredient.quantity;
      } else if (stockIngredient.unit === recipeIngredient.unit || stockIngredient.unit === 'قطعة' && recipeIngredient.unit === 'قطعة') {
        costForIngredient = stockIngredient.costPerUnit * recipeIngredient.quantity;
      } else {
        console.warn(`Unit mismatch for ingredient ${stockIngredient.name}: recipe unit ${recipeIngredient.unit}, stock unit ${stockIngredient.unit}. Cost calculation may be inaccurate. Using direct multiplication.`);
        costForIngredient = stockIngredient.costPerUnit * recipeIngredient.quantity; 
      }
      totalCost += costForIngredient;
    } else if (!stockIngredient) {
      console.warn(`Ingredient with ID ${recipeIngredient.ingredientId} not found in inventory.`);
    }
  });
  return parseFloat(totalCost.toFixed(4));
};


export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItemData, setNewItemData] = useState(initialNewItemState);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [stockIngredients, setStockIngredients] = useState<StockIngredient[]>([]);

  useEffect(() => {
    setStockIngredients(DUMMY_INGREDIENTS);
    const itemsWithCalculatedCosts = DUMMY_MENU_ITEMS.map(item => {
      if (item.ingredients && item.ingredients.length > 0) {
        return { ...item, cost: calculateMenuItemCost(item.ingredients, DUMMY_INGREDIENTS) };
      }
      return item; 
    });
    setMenuItems(itemsWithCalculatedCosts);
  }, []);
  
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItemData(prev => ({ 
      ...prev, 
      [name]: (name === 'price' || name === 'manualCost') ? parseFloat(value) || 0 : value 
    }));
  };

  const handleCategoryChange = (value: string) => {
    setNewItemData(prev => ({ ...prev, category: value as Category }));
  };

  const handleAddIngredientToRecipe = () => {
    setNewItemData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { ingredientId: '', quantity: 1, unit: INGREDIENT_UNITS[0] }]
    }));
  };

  const handleRecipeIngredientChange = (index: number, field: keyof MenuItemIngredient, value: string | number) => {
    setNewItemData(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).map((ing, i) => 
        i === index ? { ...ing, [field]: field === 'quantity' ? parseFloat(value as string) || 0 : value } : ing
      )
    }));
  };
  
  const handleRecipeIngredientUnitChange = (index: number, value: IngredientUnit) => {
     setNewItemData(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).map((ing, i) => 
        i === index ? { ...ing, unit: value } : ing
      )
    }));
  };


  const handleRemoveIngredientFromRecipe = (index: number) => {
    setNewItemData(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!newItemData.name || newItemData.price <= 0) {
      toast({ title: "خطأ", description: "الاسم وسعر صالح مطلوبان.", variant: "destructive" });
      return;
    }

    // Validate ingredients if any
    if (newItemData.ingredients && newItemData.ingredients.length > 0) {
      for (const ing of newItemData.ingredients) {
        if (!ing.ingredientId || ing.quantity <= 0) {
          toast({ title: "خطأ في المكونات", description: "يرجى تحديد مكون صالح وكمية أكبر من الصفر لكل مكون.", variant: "destructive" });
          return;
        }
      }
    }

    const newImageUrl = newItemData.imageUrl || `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000)}`;
    const newAiHint = newItemData.dataAiHint || newItemData.category.toLowerCase();
    
    let finalCost: number;
    if (newItemData.ingredients && newItemData.ingredients.length > 0) {
      finalCost = calculateMenuItemCost(newItemData.ingredients, stockIngredients);
    } else {
      finalCost = newItemData.manualCost || 0;
    }

    if (editingItem) {
      const updatedItem: MenuItem = { 
        ...editingItem, 
        ...newItemData, 
        cost: finalCost, 
        imageUrl: newImageUrl, 
        dataAiHint: newAiHint,
        ingredients: newItemData.ingredients && newItemData.ingredients.length > 0 ? newItemData.ingredients : undefined,
      };
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? updatedItem : item));
      toast({ title: "نجاح", description: `تم تحديث ${updatedItem.name}.` });
    } else {
      const newItemWithId: MenuItem = {
        id: `menu-${Date.now()}`,
        name: newItemData.name,
        category: newItemData.category,
        price: newItemData.price,
        cost: finalCost,
        imageUrl: newImageUrl,
        description: newItemData.description,
        dataAiHint: newAiHint,
        ingredients: newItemData.ingredients && newItemData.ingredients.length > 0 ? newItemData.ingredients : undefined,
      };
      setMenuItems([newItemWithId, ...menuItems]);
      toast({ title: "نجاح", description: `تمت إضافة ${newItemWithId.name} إلى القائمة.` });
    }
    setIsDialogOpen(false);
    setEditingItem(null);
    setNewItemData(initialNewItemState);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemData({ 
      ...item, 
      manualCost: item.cost, // Store original or manual cost here
      ingredients: item.ingredients || [] 
    }); 
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (itemToDelete: MenuItem) => {
    setMenuItems(menuItems.filter(item => item.id !== itemToDelete.id));
    toast({ title: "نجاح", description: `تم حذف ${itemToDelete.name}.`, variant: "destructive" });
  };

  const openNewItemDialog = () => {
    setEditingItem(null);
    setNewItemData(initialNewItemState);
    setIsDialogOpen(true);
  };

  const displayedCost = useMemo(() => {
    if (newItemData.ingredients && newItemData.ingredients.length > 0) {
      return calculateMenuItemCost(newItemData.ingredients, stockIngredients);
    }
    return newItemData.manualCost || 0;
  }, [newItemData.ingredients, newItemData.manualCost, stockIngredients]);

  return (
    <>
      <PageHeader
        title="إدارة القائمة"
        description="إضافة أو تعديل أو حذف عناصر القائمة. يمكن حساب التكاليف تلقائيًا عند تحديد المكونات."
        actions={
          <Button onClick={openNewItemDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 me-2" /> إضافة عنصر جديد
          </Button>
        }
      />
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="ابحث في عناصر القائمة..."
            className="pe-10 w-full max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredMenuItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMenuItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              variant="management"
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          {searchTerm ? "لا توجد عناصر تطابق بحثك." : "لا توجد عناصر في القائمة بعد. أضف واحدة للبدء!"}
        </p>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl"> {/* Increased width for ingredient section */}
          <DialogHeader>
            <DialogTitle>{editingItem ? 'تعديل عنصر القائمة' : 'إضافة عنصر قائمة جديد'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'قم بتحديث تفاصيل عنصر القائمة هذا.' : 'املأ تفاصيل عنصر القائمة الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto ps-2 pe-4"> {/* Added pe-4 for scrollbar spacing */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left">الاسم</Label>
              <Input id="name" name="name" value={newItemData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-left">الفئة</Label>
              <Select name="category" value={newItemData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-left">السعر ($)</Label>
              <Input id="price" name="price" type="number" value={newItemData.price} onChange={handleInputChange} className="col-span-3" min="0" step="0.01" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-left">التكلفة ($)</Label>
              <Input 
                id="cost" 
                name="manualCost"
                type="number" 
                value={newItemData.ingredients && newItemData.ingredients.length > 0 ? displayedCost.toFixed(4) : newItemData.manualCost} 
                onChange={handleInputChange} 
                className="col-span-3" 
                min="0" 
                step="0.0001"
                disabled={!!(newItemData.ingredients && newItemData.ingredients.length > 0)}
                title={(newItemData.ingredients && newItemData.ingredients.length > 0) ? "محسوبة من المكونات" : "أدخل التكلفة يدويًا إذا لم يتم تحديد مكونات"}
              />
            </div>
             {(newItemData.ingredients && newItemData.ingredients.length > 0) && (
                 <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">التكلفة ${displayedCost.toFixed(4)} محسوبة بناءً على المكونات المحددة.</p>
             )}
            <div className="grid grid-cols-4 items-start gap-4"> {/* Changed items-center to items-start for Textarea */}
              <Label htmlFor="description" className="text-left pt-2">الوصف</Label>
              <Textarea id="description" name="description" value={newItemData.description} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-left">رابط الصورة</Label>
              <Input id="imageUrl" name="imageUrl" value={newItemData.imageUrl || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري، مثال: https://picsum.photos/300/200"/>
            </div>
            {newItemData.imageUrl && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3">
                  <NextImage src={newItemData.imageUrl} alt="معاينة" width={120} height={80} className="rounded-md object-cover" data-ai-hint={newItemData.dataAiHint || "item preview"}/>
                </div>
              </div>
            )}
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataAiHint" className="text-left">تلميح للذكاء الاصطناعي</Label>
              <Input id="dataAiHint" name="dataAiHint" value={newItemData.dataAiHint || ''} onChange={handleInputChange} className="col-span-3" placeholder="مثال: كوب قهوة، برجر بطاطس (كلمتان كحد أقصى)"/>
            </div>

            <Separator className="my-4 col-span-4" />

            {/* Ingredient Management Section */}
            <div className="col-span-4 space-y-4">
              <h3 className="text-lg font-medium text-center">مكونات هذا العنصر</h3>
              {(newItemData.ingredients || []).map((ingredient, index) => (
                <div key={index} className="grid grid-cols-12 items-center gap-2 p-3 border rounded-md">
                  <div className="col-span-5">
                    <Label htmlFor={`ingredientId-${index}`} className="sr-only">المكون</Label>
                    <Select 
                      value={ingredient.ingredientId} 
                      onValueChange={(value) => handleRecipeIngredientChange(index, 'ingredientId', value)}
                    >
                      <SelectTrigger id={`ingredientId-${index}`}>
                        <SelectValue placeholder="اختر المكون" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockIngredients.map(si => (
                          <SelectItem key={si.id} value={si.id}>{si.name} ({si.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor={`quantity-${index}`} className="sr-only">الكمية</Label>
                    <Input 
                      id={`quantity-${index}`} 
                      type="number" 
                      value={ingredient.quantity} 
                      onChange={(e) => handleRecipeIngredientChange(index, 'quantity', e.target.value)} 
                      min="0.001" 
                      step="0.001"
                      placeholder="الكمية"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor={`unit-${index}`} className="sr-only">الوحدة</Label>
                    <Select 
                      value={ingredient.unit} 
                      onValueChange={(value) => handleRecipeIngredientUnitChange(index, value as IngredientUnit)}
                    >
                      <SelectTrigger id={`unit-${index}`}>
                        <SelectValue placeholder="الوحدة" />
                      </SelectTrigger>
                      <SelectContent>
                        {INGREDIENT_UNITS.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredientFromRecipe(index)} className="text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!newItemData.ingredients || newItemData.ingredients.length === 0) && !editingItem && (
                 <p className="text-sm text-muted-foreground text-center">لم يتم تحديد مكونات. ستُستخدم التكلفة اليدوية إذا لم تتم إضافة مكونات.</p>
              )}
               {editingItem && (!newItemData.ingredients || newItemData.ingredients.length === 0) && (
                 <p className="text-sm text-muted-foreground text-center">لا توجد مكونات محددة لهذا العنصر. ستُستخدم التكلفة اليدوية إذا لم تتم إضافة مكونات.</p>
              )}
              <Button type="button" variant="outline" onClick={handleAddIngredientToRecipe} className="w-full">
                <PackagePlus className="h-4 w-4 me-2" /> إضافة مكون للعنصر
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingItem ? 'حفظ التغييرات' : 'إضافة عنصر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

