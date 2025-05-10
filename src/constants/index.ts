
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, BookOpenCheck, ListOrdered, BarChart3, Settings, ChefHat, Table2 as TableIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { label: 'نقطة البيع', href: '/pos', icon: ShoppingCart },
  { label: 'القائمة', href: '/menu', icon: BookOpenCheck },
  { label: 'شاشة المطبخ', href: '/kitchen', icon: ChefHat },
  { label: 'الطاولات', href: '/tables', icon: TableIcon },
  { label: 'الطلبات', href: '/orders', icon: ListOrdered },
  { label: 'التقارير', href: '/reports', icon: BarChart3 },
];

export const SETTINGS_NAV_ITEM: NavItem = { label: 'الإعدادات', href: '/settings', icon: Settings };

export type Category = "مأكولات" | "مشروبات" | "حلويات" | "شيشة";

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  cost?: number; // Optional raw material cost
  imageUrl: string;
  description?: string;
  dataAiHint?: string;
  sizes?: { name: string; price: number }[];
}

export const DUMMY_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'اسبريسو', category: 'مشروبات', price: 2.50, cost: 0.50, imageUrl: 'https://picsum.photos/200/200?image=1060', dataAiHint: "coffee cup", description: "قهوة غنية وقوية" },
  { id: '2', name: 'كابتشينو', category: 'مشروبات', price: 3.50, cost: 0.75, imageUrl: 'https://picsum.photos/200/200?image=225', dataAiHint: "latte art", description: "اسبريسو مع رغوة حليب مبخر" },
  { id: '3', name: 'تشيز برجر', category: 'مأكولات', price: 8.00, cost: 2.50, imageUrl: 'https://picsum.photos/200/200?image=302', dataAiHint: "burger fries", description: "برجر لحم بالجبنة كلاسيكي" },
  { id: '4', name: 'بطاطس مقلية', category: 'مأكولات', price: 3.00, cost: 0.80, imageUrl: 'https://picsum.photos/200/200?image=431', dataAiHint: "french fries", description: "بطاطس ذهبية مقرمشة" },
  { id: '5', name: 'كيكة شوكولاتة', category: 'حلويات', price: 5.00, cost: 1.50, imageUrl: 'https://picsum.photos/200/200?image=585', dataAiHint: "chocolate cake", description: "كيكة شوكولاتة غنية وفاخرة" },
  { id: '6', name: 'شيشة تفاح', category: 'شيشة', price: 15.00, cost: 3.00, imageUrl: 'https://picsum.photos/200/200?image=603', dataAiHint: "hookah smoke", description: "شيشة بنكهة التفاح المنعشة" },
  { id: '7', name: 'آيس لاتيه', category: 'مشروبات', price: 4.00, cost: 1.00, imageUrl: 'https://picsum.photos/200/200?image=455', dataAiHint: "iced coffee", description: "لاتيه مثلج مع ثلج" },
  { id: '8', name: 'ساندويتش دجاج', category: 'مأكولات', price: 7.50, cost: 2.00, imageUrl: 'https://picsum.photos/200/200?image=103', dataAiHint: "club sandwich", description: "ساندويتش دجاج مشوي" },
];

export const ITEM_CATEGORIES: Category[] = ["مأكولات", "مشروبات", "حلويات", "شيشة"];

export type OrderStatus = "قيد الانتظار" | "قيد التجهيز" | "جاهز" | "مكتمل" | "ملغى";
export type OrderType = "صالة" | "سفري" | "توصيل";

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
  notes?: string; // General notes for the entire order
  createdAt: Date; // Keep as Date object
}

// Make createdAt a proper Date object for sorting and display consistency
export let DUMMY_ORDERS: Order[] = [
  { id: 'o1', orderNumber: 'طلب-001', items: [{ ...DUMMY_MENU_ITEMS[0], quantity: 2 }, { ...DUMMY_MENU_ITEMS[2], quantity: 1, notes: "بدون بصل" }], totalAmount: 13.00, status: 'مكتمل', type: 'صالة', tableNumber: '5', createdAt: new Date(Date.now() - 3600000 * 3) },
  { id: 'o2', orderNumber: 'طلب-002', items: [{ ...DUMMY_MENU_ITEMS[1], quantity: 1 }], totalAmount: 3.50, status: 'قيد التجهيز', type: 'سفري', customerName: 'أحمد محمود', createdAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'o3', orderNumber: 'طلب-003', items: [{ ...DUMMY_MENU_ITEMS[4], quantity: 1 }, { ...DUMMY_MENU_ITEMS[5], quantity: 1 }], totalAmount: 20.00, status: 'قيد الانتظار', type: 'توصيل', customerName: 'فاطمة علي', deliveryAddress: '123 الشارع الرئيسي, المدينة', captainName: 'جون دو', createdAt: new Date(Date.now() - 3600000 * 1) },
  { id: 'o4', orderNumber: 'طلب-004', items: [{ ...DUMMY_MENU_ITEMS[6], quantity: 2, notes: "سكر قليل" }, { ...DUMMY_MENU_ITEMS[3], quantity: 1 }], totalAmount: 16.00, status: 'قيد الانتظار', type: 'صالة', tableNumber: '2', createdAt: new Date() },
  { id: 'o5', orderNumber: 'طلب-005', items: [{ ...DUMMY_MENU_ITEMS[7], quantity: 1 }], totalAmount: 7.50, status: 'قيد التجهيز', type: 'صالة', tableNumber: '8', createdAt: new Date(Date.now() - 1800000) }, // 30 mins ago
  { id: 'o6', orderNumber: 'طلب-006', items: [{ ...DUMMY_MENU_ITEMS[0], quantity: 1 }, { ...DUMMY_MENU_ITEMS[4], quantity: 1 }], totalAmount: 7.50, status: 'جاهز', type: 'سفري', customerName: 'سارة إبراهيم', createdAt: new Date(Date.now() - 900000) }, // 15 mins ago
];


export type TableStatus = "متاحة" | "مشغولة" | "محجوزة" | "تحتاج تنظيف";

export interface Table {
  id: string;
  number: string;
  status: TableStatus;
  capacity: number;
  orderId?: string; // To link to an active order if occupied
}

export const DUMMY_TABLES: Table[] = [
  { id: 't1', number: '1', status: 'متاحة', capacity: 4 },
  { id: 't2', number: '2', status: 'مشغولة', capacity: 2, orderId: 'o4' },
  { id: 't3', number: '3', status: 'محجوزة', capacity: 6 },
  { id: 't4', number: '4', status: 'متاحة', capacity: 4 },
  { id: 't5', number: '5', status: 'تحتاج تنظيف', capacity: 2 },
  { id: 't6', number: '6', status: 'متاحة', capacity: 8 },
  { id: 't7', number: '7', status: 'متاحة', capacity: 4 },
  { id: 't8', number: '8', status: 'مشغولة', capacity: 2, orderId: 'o5' },
  { id: 't9', number: '9', status: 'متاحة', capacity: 6 },
  { id: 't10', number: '10', status: 'محجوزة', capacity: 4 },
];

export const TABLE_STATUSES: TableStatus[] = ["متاحة", "مشغولة", "محجوزة", "تحتاج تنظيف"];
