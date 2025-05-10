import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, BookOpenCheck, ListOrdered, BarChart3, Settings } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'POS', href: '/pos', icon: ShoppingCart },
  { label: 'Menu', href: '/menu', icon: BookOpenCheck },
  { label: 'Orders', href: '/orders', icon: ListOrdered },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
];

export const SETTINGS_NAV_ITEM: NavItem = { label: 'Settings', href: '/settings', icon: Settings };

export type Category = "Food" | "Drinks" | "Desserts" | "Shisha";

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  imageUrl: string;
  description?: string;
  sizes?: { name: string; price: number }[];
  cost?: number; // Optional raw material cost
}

export const DUMMY_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Espresso', category: 'Drinks', price: 2.50, imageUrl: 'https://picsum.photos/200/200?image=1060', dataAiHint: "coffee cup", description: "Strong rich coffee" },
  { id: '2', name: 'Cappuccino', category: 'Drinks', price: 3.50, imageUrl: 'https://picsum.photos/200/200?image=225', dataAiHint: "latte art", description: "Espresso with steamed milk foam" },
  { id: '3', name: 'Cheeseburger', category: 'Food', price: 8.00, imageUrl: 'https://picsum.photos/200/200?image=302', dataAiHint: "burger fries", description: "Classic beef cheeseburger" },
  { id: '4', name: 'French Fries', category: 'Food', price: 3.00, imageUrl: 'https://picsum.photos/200/200?image=431', dataAiHint: "french fries", description: "Crispy golden fries" },
  { id: '5', name: 'Chocolate Cake', category: 'Desserts', price: 5.00, imageUrl: 'https://picsum.photos/200/200?image=585', dataAiHint: "chocolate cake", description: "Rich decadent chocolate cake" },
  { id: '6', name: 'Apple Shisha', category: 'Shisha', price: 15.00, imageUrl: 'https://picsum.photos/200/200?image=603', dataAiHint: "hookah smoke", description: "Smooth apple flavored shisha" },
  { id: '7', name: 'Iced Latte', category: 'Drinks', price: 4.00, imageUrl: 'https://picsum.photos/200/200?image=455', dataAiHint: "iced coffee", description: "Chilled latte with ice" },
  { id: '8', name: 'Chicken Sandwich', category: 'Food', price: 7.50, imageUrl: 'https://picsum.photos/200/200?image=103', dataAiHint: "club sandwich", description: "Grilled chicken sandwich" },
];

export const ITEM_CATEGORIES: Category[] = ["Food", "Drinks", "Desserts", "Shisha"];

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
export type OrderType = "Dine-in" | "Takeaway" | "Delivery";

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
}
export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  type: OrderType;
  customerName?: string;
  tableNumber?: string;
  deliveryAddress?: string;
  captainName?: string;
  createdAt: Date;
}

export const DUMMY_ORDERS: Order[] = [
  { id: 'o1', orderNumber: 'ORD-001', items: [{ ...DUMMY_MENU_ITEMS[0], quantity: 2 }, { ...DUMMY_MENU_ITEMS[2], quantity: 1, notes: "No onions" }], totalAmount: 13.00, status: 'Completed', type: 'Dine-in', tableNumber: '5', createdAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'o2', orderNumber: 'ORD-002', items: [{ ...DUMMY_MENU_ITEMS[1], quantity: 1 }], totalAmount: 3.50, status: 'Preparing', type: 'Takeaway', createdAt: new Date(Date.now() - 3600000 * 1) },
  { id: 'o3', orderNumber: 'ORD-003', items: [{ ...DUMMY_MENU_ITEMS[4], quantity: 1 }, { ...DUMMY_MENU_ITEMS[5], quantity: 1 }], totalAmount: 20.00, status: 'Pending', type: 'Delivery', deliveryAddress: '123 Main St', captainName: 'John Doe', createdAt: new Date() },
];
