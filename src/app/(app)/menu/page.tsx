"use client";

import { useState, useEffect } from 'react';
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DUMMY_MENU_ITEMS, ITEM_CATEGORIES, type MenuItem, type Category } from '@/constants';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const initialNewItemState: Omit<MenuItem, 'id' | 'imageUrl'> & { imageUrl?: string } = {
  name: '',
  category: ITEM_CATEGORIES[0],
  price: 0,
  description: '',
  dataAiHint: '',
};

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItemData, setNewItemData] = useState(initialNewItemState);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setMenuItems(DUMMY_MENU_ITEMS);
  }, []);
  
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItemData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
  };

  const handleCategoryChange = (value: string) => {
    setNewItemData(prev => ({ ...prev, category: value as Category }));
  };

  const handleSubmit = () => {
    if (!newItemData.name || newItemData.price <= 0) {
      toast({ title: "Error", description: "Name and a valid price are required.", variant: "destructive" });
      return;
    }

    const newImageUrl = newItemData.imageUrl || `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`;
    const newAiHint = newItemData.dataAiHint || newItemData.category.toLowerCase();

    if (editingItem) {
      const updatedItem = { ...editingItem, ...newItemData, imageUrl: newImageUrl, dataAiHint: newAiHint };
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? updatedItem : item));
      toast({ title: "Success", description: `${updatedItem.name} updated.` });
    } else {
      const newItemWithId: MenuItem = {
        ...newItemData,
        id: `menu-${Date.now()}`,
        imageUrl: newImageUrl,
        dataAiHint: newAiHint,
      };
      setMenuItems([newItemWithId, ...menuItems]);
      toast({ title: "Success", description: `${newItemWithId.name} added to menu.` });
    }
    setIsDialogOpen(false);
    setEditingItem(null);
    setNewItemData(initialNewItemState);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemData({ ...item });
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (itemToDelete: MenuItem) => {
    // Add a confirmation dialog here in a real app
    setMenuItems(menuItems.filter(item => item.id !== itemToDelete.id));
    toast({ title: "Success", description: `${itemToDelete.name} deleted.`, variant: "destructive" });
  };

  const openNewItemDialog = () => {
    setEditingItem(null);
    setNewItemData(initialNewItemState);
    setIsDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Menu Management"
        description="Add, edit, or remove menu items."
        actions={
          <Button onClick={openNewItemDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 mr-2" /> Add New Item
          </Button>
        }
      />
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Search menu items..."
            className="pl-10 w-full max-w-md"
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
          {searchTerm ? "No items match your search." : "No menu items yet. Add one to get started!"}
        </p>
      )}
      

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of this menu item.' : 'Fill in the details for the new menu item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" value={newItemData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Select name="category" value={newItemData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price ($)</Label>
              <Input id="price" name="price" type="number" value={newItemData.price} onChange={handleInputChange} className="col-span-3" min="0" step="0.01" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" name="description" value={newItemData.description} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" value={newItemData.imageUrl || ''} onChange={handleInputChange} className="col-span-3" placeholder="Optional, e.g., https://picsum.photos/200/200"/>
            </div>
            {newItemData.imageUrl && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3">
                  <Image src={newItemData.imageUrl} alt="Preview" width={80} height={80} className="rounded-md object-cover" data-ai-hint={newItemData.dataAiHint || "item preview"}/>
                </div>
              </div>
            )}
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataAiHint" className="text-right">AI Hint</Label>
              <Input id="dataAiHint" name="dataAiHint" value={newItemData.dataAiHint || ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g., coffee cup, burger fries (max 2 words)"/>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
