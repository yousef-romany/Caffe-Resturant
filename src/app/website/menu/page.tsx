
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { MenuItemCard } from '@/components/custom/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DUMMY_MENU_ITEMS, ITEM_CATEGORIES, type MenuItem, type Category } from '@/constants';
import { Search, ListFilter, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomerMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'الكل'>('الكل');
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching menu items - in a real app, this would be an API call.
    // For now, we use the cost-calculated items from constants directly.
    const itemsWithCalculatedCosts = DUMMY_MENU_ITEMS.map(item => {
        // Placeholder for cost calculation logic if needed on client, or assume cost is pre-calculated
        // For customer view, cost is not directly shown, but it's good to have the full item object.
        return item;
    });
    setMenuItems(itemsWithCalculatedCosts);
  }, []);
  
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === 'الكل' || item.category === selectedCategory)
    );
  }, [menuItems, searchTerm, selectedCategory]);

  const handleAddToCart = (item: MenuItem) => {
    // Placeholder for adding to cart logic
    toast({
      title: `تمت إضافة ${item.name} إلى سلة الطلبات (تجريبي)`,
      description: "في تطبيق حقيقي، سيتم إضافة هذا العنصر إلى سلة طلباتك.",
    });
    console.log("Added to cart (placeholder):", item);
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="قائمة الطعام لدينا"
        description="تصفح أشهى المأكولات والمشروبات التي نقدمها."
        icon={Utensils}
      />
      
      <div className="mb-8 p-4 bg-card rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="relative">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:left-3 rtl:right-auto" />
            <Input 
              type="search"
              placeholder="ابحث في عناصر القائمة..."
              className="pe-10 rtl:ps-10 rtl:pe-3 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <ListFilter className="h-5 w-5 text-muted-foreground me-2 shrink-0"/>
            <Button
              variant={selectedCategory === 'الكل' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('الكل')}
              className="shrink-0"
            >
              الكل
            </Button>
            {ITEM_CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {filteredMenuItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMenuItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart} // Pass the handler
              variant="display" // Use display variant for customer view
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10 text-lg">
          {searchTerm || selectedCategory !== 'الكل' ? "لا توجد عناصر تطابق بحثك أو الفلتر المحدد." : "قائمة الطعام فارغة حاليًا. يرجى المحاولة لاحقًا!"}
        </p>
      )}
    </div>
  );
}
