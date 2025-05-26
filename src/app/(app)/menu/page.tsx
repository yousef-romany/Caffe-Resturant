
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_CATEGORIES, type MenuItem, type Category, type MenuItemIngredient, type IngredientUnit, INGREDIENT_UNITS, type Ingredient as StockIngredient } from '@/constants';
import { PlusCircle, Edit, Trash2, Search, PackagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image'; 
import { Separator } from '@/components/ui/separator';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { Switch } from '@/components/ui/switch'; 

const initialNewItemState: Omit<MenuItem, 'id' | 'imageUrl'> & { manualCost?: number } = {
  name: '',
  category: ITEM_CATEGORIES[0],
  price: 0,
  manualCost: 0, 
  description: '',
  dataAiHint: '',
  ingredients: [],
  is_available: true, 
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
    if (stockIngredient && recipeIngredient.quantity > 0 && stockIngredient.costPerUnit > 0) {
      let costForIngredient = 0;
      if (stockIngredient.unit === 'كيلوجرام' && recipeIngredient.unit === 'جرام') {
        costForIngredient = (stockIngredient.costPerUnit / 1000) * recipeIngredient.quantity;
      } else if (stockIngredient.unit === 'لتر' && recipeIngredient.unit === 'مللي لتر') {
        costForIngredient = (stockIngredient.costPerUnit / 1000) * recipeIngredient.quantity;
      } else if (stockIngredient.unit === 'جرام' && recipeIngredient.unit === 'كيلوجرام') {
        costForIngredient = (stockIngredient.costPerUnit * 1000) * recipeIngredient.quantity;
      } else if (stockIngredient.unit === 'مللي لتر' && recipeIngredient.unit === 'لتر') {
        costForIngredient = (stockIngredient.costPerUnit * 1000) * recipeIngredient.quantity;
      } else if (stockIngredient.unit === recipeIngredient.unit || (stockIngredient.unit === 'قطعة' && recipeIngredient.unit === 'قطعة') ) {
        costForIngredient = stockIngredient.costPerUnit * recipeIngredient.quantity;
      } else {
        console.warn(`Unit mismatch for ingredient ${stockIngredient.name}: recipe unit ${recipeIngredient.unit}, stock unit ${stockIngredient.unit}. Cost calculation may be inaccurate. Attempting direct multiplication.`);
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
  const [db, setDbInstance] = useState<Database | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItemData, setNewItemData] = useState(initialNewItemState);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [stockIngredients, setStockIngredients] = useState<StockIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadDbAndFetchData() {
      try {
        const dbInstance = await getDb;
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        await fetchAllMenuData(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch data:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات القائمة.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadDbAndFetchData();
  }, [toast]);

  const fetchAllMenuData = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const fetchedMenuItems: any[] = await currentDb.select('SELECT id, name, category, price, cost, image_url as imageUrl, description, data_ai_hint as dataAiHint, is_available FROM menu_items ORDER BY name');
      const fetchedStockIngredients: StockIngredient[] = await currentDb.select('SELECT id, name, unit, cost_per_unit as costPerUnit FROM ingredients');
      const fetchedMenuItemRecipes: any[] = await currentDb.select('SELECT menu_item_id, ingredient_id as ingredientId, quantity, unit FROM menu_item_ingredients');
      
      setStockIngredients(fetchedStockIngredients);

      const itemsWithRecipesAndCosts = fetchedMenuItems.map(item => {
        const recipeIngredients = fetchedMenuItemRecipes
          .filter(recipe => recipe.menu_item_id === item.id)
          .map(ri => ({ ingredientId: ri.ingredientId, quantity: Number(ri.quantity), unit: ri.unit as IngredientUnit }));
        
        const calculatedCost = calculateMenuItemCost(recipeIngredients, fetchedStockIngredients);
        
        return {
          ...item,
          price: Number(item.price) || 0,
          cost: (recipeIngredients && recipeIngredients.length > 0 && calculatedCost > 0) ? calculatedCost : (item.cost ? Number(item.cost) : 0), 
          ingredients: recipeIngredients,
          is_available: Boolean(item.is_available),
        };
      });
      setMenuItems(itemsWithRecipesAndCosts);

    } catch (error) {
      console.error("Error fetching menu data:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات القائمة أو المكونات.", variant: "destructive" });
      setMenuItems([]);
      setStockIngredients([]);
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  const handleAvailabilityChange = (checked: boolean) => {
    setNewItemData(prev => ({ ...prev, is_available: checked }));
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

  const handleSubmit = async () => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    if (!newItemData.name || newItemData.price <= 0) {
      toast({ title: "خطأ", description: "الاسم وسعر صالح (أكبر من صفر) مطلوبان.", variant: "destructive" });
      return;
    }

    if (newItemData.ingredients && newItemData.ingredients.length > 0) {
      for (const ing of newItemData.ingredients) {
        if (!ing.ingredientId || ing.quantity <= 0) {
          toast({ title: "خطأ في المكونات", description: "يرجى تحديد مكون صالح وكمية أكبر من الصفر لكل مكون في الوصفة.", variant: "destructive" });
          return;
        }
      }
    }

    const newImageUrl = newItemData.imageUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(newItemData.name)}`;
    const newAiHint = newItemData.dataAiHint || newItemData.category.toLowerCase().split(" ")[0] || "food item";
    
    let finalCost: number;
    if (newItemData.ingredients && newItemData.ingredients.length > 0) {
      finalCost = calculateMenuItemCost(newItemData.ingredients, stockIngredients);
    } else {
      finalCost = newItemData.manualCost !== undefined ? Number(newItemData.manualCost) : 0;
    }

    const menuItemToSave = {
      name: newItemData.name,
      category: newItemData.category,
      price: Number(newItemData.price),
      cost: finalCost,
      image_url: newImageUrl,
      description: newItemData.description || null,
      data_ai_hint: newAiHint,
      is_available: newItemData.is_available === undefined ? 1 : (newItemData.is_available ? 1 : 0),
    };

    try {
      if (editingItem) {
        await db.execute(
          'UPDATE menu_items SET name = ?, category = ?, price = ?, cost = ?, image_url = ?, description = ?, data_ai_hint = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [menuItemToSave.name, menuItemToSave.category, menuItemToSave.price, menuItemToSave.cost, menuItemToSave.image_url, menuItemToSave.description, menuItemToSave.data_ai_hint, menuItemToSave.is_available, editingItem.id]
        );
        await db.execute('DELETE FROM menu_item_ingredients WHERE menu_item_id = ?', [editingItem.id]);
        if (newItemData.ingredients && newItemData.ingredients.length > 0) {
          for (const ing of newItemData.ingredients) {
            await db.execute(
              'INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
              [editingItem.id, ing.ingredientId, Number(ing.quantity), ing.unit]
            );
          }
        }
        toast({ title: "نجاح", description: `تم تحديث ${menuItemToSave.name}.` });
      } else {
        const newItemId = `menu-${Date.now()}`;
        await db.execute(
          'INSERT INTO menu_items (id, name, category, price, cost, image_url, description, data_ai_hint, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [newItemId, menuItemToSave.name, menuItemToSave.category, menuItemToSave.price, menuItemToSave.cost, menuItemToSave.image_url, menuItemToSave.description, menuItemToSave.data_ai_hint, menuItemToSave.is_available]
        );
        if (newItemData.ingredients && newItemData.ingredients.length > 0) {
          for (const ing of newItemData.ingredients) {
            await db.execute(
              'INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
              [newItemId, ing.ingredientId, Number(ing.quantity), ing.unit]
            );
          }
        }
        toast({ title: "نجاح", description: `تمت إضافة ${menuItemToSave.name} إلى القائمة.` });
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setNewItemData(initialNewItemState);
      if(db) await fetchAllMenuData(db);
    } catch (error) {
      console.error("Error submitting menu item:", error);
      toast({ title: "خطأ في الحفظ", description: "فشل حفظ بيانات عنصر القائمة. قد يكون الاسم مكرر.", variant: "destructive" });
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemData({ 
      name: item.name,
      category: item.category,
      price: item.price,
      manualCost: (item.ingredients && item.ingredients.length > 0) ? undefined : item.cost, 
      description: item.description || '',
      imageUrl: item.imageUrl,
      dataAiHint: item.dataAiHint || '',
      ingredients: item.ingredients ? JSON.parse(JSON.stringify(item.ingredients)) : [],
      is_available: item.is_available === undefined ? true : item.is_available,
    }); 
    setIsDialogOpen(true);
  };

  const handleDeleteItem = async (itemToDelete: MenuItem) => {
    if (!db) return;
    try {
      const orderItemCheck: any[] = await db.select('SELECT 1 FROM order_items WHERE menu_item_id = ? LIMIT 1', [itemToDelete.id]);
      if (orderItemCheck.length > 0) {
        toast({ title: "خطأ في الحذف", description: "لا يمكن حذف هذا العنصر لأنه مستخدم في طلبات سابقة. يمكنك جعله 'غير متوفر' بدلاً من ذلك.", variant: "destructive" });
        return;
      }

      await db.execute('DELETE FROM menu_items WHERE id = ?', [itemToDelete.id]);
      toast({ title: "نجاح", description: `تم حذف ${itemToDelete.name}.`, variant: "destructive" });
      if(db) await fetchAllMenuData(db);
    } catch (error: any) {
      console.error("Error deleting menu item:", error);
       if (error.message && error.message.toLowerCase().includes("constraint")) {
          toast({ title: "خطأ في الحذف", description: "لا يمكن حذف هذا العنصر لأنه مستخدم في بيانات أخرى (مثل الطلبات أو الوصفات).", variant: "destructive" });
      } else {
        toast({ title: "خطأ في الحذف", description: "فشل حذف عنصر القائمة.", variant: "destructive" });
      }
    }
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
    return newItemData.manualCost !== undefined ? Number(newItemData.manualCost) : 0;
  }, [newItemData.ingredients, newItemData.manualCost, stockIngredients]);

  if (isLoading) {
    return (
      <>
        <PageHeader title="إدارة القائمة" />
        <p className="text-center text-muted-foreground p-10">جارٍ تحميل بيانات القائمة...</p>
      </>
    );
  }

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
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:left-3 rtl:right-auto" />
          <Input 
            type="search"
            placeholder="ابحث في عناصر القائمة..."
            className="pe-10 rtl:ps-10 rtl:pe-3 w-full max-w-md"
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
          {menuItems.length === 0 ? "لا توجد عناصر في القائمة بعد. أضف واحدة للبدء!" : "لا توجد عناصر تطابق بحثك."}
        </p>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'تعديل عنصر القائمة' : 'إضافة عنصر قائمة جديد'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'قم بتحديث تفاصيل عنصر القائمة هذا.' : 'املأ تفاصيل عنصر القائمة الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto ps-2 pe-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left rtl:text-right">الاسم</Label>
              <Input id="name" name="name" value={newItemData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-left rtl:text-right">الفئة</Label>
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
              <Label htmlFor="price" className="text-left rtl:text-right">السعر ($)</Label>
              <Input id="price" name="price" type="number" value={newItemData.price} onChange={handleInputChange} className="col-span-3" min="0" step="0.01" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manualCost" className="text-left rtl:text-right">التكلفة ($)</Label>
              <Input 
                id="manualCost" 
                name="manualCost"
                type="number" 
                value={newItemData.ingredients && newItemData.ingredients.length > 0 ? displayedCost.toFixed(4) : (newItemData.manualCost ?? 0)} 
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
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-left rtl:text-right pt-2">الوصف</Label>
              <Textarea id="description" name="description" value={newItemData.description || ''} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-left rtl:text-right">رابط الصورة</Label>
              <Input id="imageUrl" name="imageUrl" value={newItemData.imageUrl || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري، مثال: https://placehold.co/300x200.png"/>
            </div>
            {newItemData.imageUrl && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3">
                  <NextImage src={newItemData.imageUrl} alt="معاينة" width={120} height={80} className="rounded-md object-cover" data-ai-hint={newItemData.dataAiHint || "item preview"}/>
                </div>
              </div>
            )}
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataAiHint" className="text-left rtl:text-right">تلميح للذكاء الاصطناعي</Label>
              <Input id="dataAiHint" name="dataAiHint" value={newItemData.dataAiHint || ''} onChange={handleInputChange} className="col-span-3" placeholder="مثال: كوب قهوة، برجر بطاطس (كلمتان كحد أقصى)"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_available" className="text-left rtl:text-right">متوفر؟</Label>
                <Switch
                    id="is_available"
                    checked={newItemData.is_available}
                    onCheckedChange={handleAvailabilityChange}
                    className="col-span-3 justify-self-start"
                />
            </div>

            <Separator className="my-4 col-span-4" />

            <div className="col-span-4 space-y-4">
              <h3 className="text-lg font-medium text-center">مكونات هذا العنصر</h3>
              {(newItemData.ingredients || []).map((ingredient, index) => (
                <div key={index} className="grid grid-cols-12 items-end gap-2 p-3 border rounded-md">
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
                      step="any"
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
              {(!newItemData.ingredients || newItemData.ingredients.length === 0) && (
                 <p className="text-sm text-muted-foreground text-center">لم يتم تحديد مكونات. ستُستخدم التكلفة اليدوية إذا لم تتم إضافة مكونات.</p>
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

    