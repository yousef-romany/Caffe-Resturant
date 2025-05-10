import NextImage from 'next/image'; // Using NextImage as Image might conflict
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MenuItem } from '@/constants';
import { DollarSign, Edit, Trash2 } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem) => void;
  variant?: 'display' | 'management'; // 'display' for POS, 'management' for menu page
}

export function MenuItemCard({ item, onEdit, onDelete, onAddToCart, variant = 'display' }: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <NextImage // Changed from Image to NextImage
          src={item.imageUrl}
          alt={item.name}
          width={300}
          height={200}
          className="w-full h-40 object-cover"
          data-ai-hint={item.dataAiHint || "food item"}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg mb-1 truncate">{item.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground h-10 overflow-hidden text-ellipsis">
          {item.description || item.category}
        </CardDescription>
        <div className="flex items-center text-primary font-semibold mt-2">
          <DollarSign className="h-4 w-4 me-1" /> {/* Changed mr-1 to me-1 for RTL */}
          <span>{item.price.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        {variant === 'display' && onAddToCart && (
          <Button onClick={() => onAddToCart(item)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            إضافة للطلب
          </Button>
        )}
        {variant === 'management' && (
          <div className="flex gap-2 w-full">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(item)} className="flex-1">
                <Edit className="h-4 w-4 me-2" /> تعديل
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(item)} className="flex-1">
                <Trash2 className="h-4 w-4 me-2" /> حذف
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
