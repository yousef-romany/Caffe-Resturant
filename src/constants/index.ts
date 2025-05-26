
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, BookOpenCheck, ListOrdered, BarChart3, Settings, ChefHat, Table2 as TableIcon, Package, UsersRound, Award, MessageSquare, Wallet, ShoppingBasket, Users, ListChecks, TrendingUp, TrendingDown, Landmark, Archive, Flame, FileText, UserCog, CalendarClock, Coffee as CoffeeIcon, Cake, Beer, Soup, Sandwich, GlassWater, QrCode, ShieldCheck } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
  slug?: CategorySlug; // Added for kitchen category slugs
}

export type Category = "مأكولات" | "مشروبات" | "حلويات" | "شيشة";
export const ITEM_CATEGORIES: Category[] = ["مأكولات", "مشروبات", "حلويات", "شيشة"];

export const CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES: Category[] = [];


export const KITCHEN_CATEGORY_ICONS: Record<Category, LucideIcon> = {
  "مأكولات": Sandwich,
  "مشروبات": GlassWater,
  "حلويات": Cake,
  "شيشة": Flame,
};

export type CategorySlug = 'food' | 'drinks' | 'desserts' | 'hookah';

export const CATEGORY_SLUG_MAP: Record<CategorySlug, { name: Category, icon: LucideIcon, slug: CategorySlug }> = {
  'food': { name: 'مأكولات', icon: KITCHEN_CATEGORY_ICONS['مأكولات'], slug: 'food' },
  'drinks': { name: 'مشروبات', icon: KITCHEN_CATEGORY_ICONS['مشروبات'], slug: 'drinks' },
  'desserts': { name: 'حلويات', icon: KITCHEN_CATEGORY_ICONS['حلويات'], slug: 'desserts' },
  'hookah': { name: 'شيشة', icon: KITCHEN_CATEGORY_ICONS['شيشة'], slug: 'hookah' },
};


export const NAV_ITEMS: NavItem[] = [
  { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { label: 'نقطة البيع', href: '/pos', icon: ShoppingCart },
  { label: 'القائمة', href: '/menu', icon: BookOpenCheck },
  {
    label: 'شاشة المطبخ',
    href: '/kitchen-display', 
    icon: ChefHat,
    children: Object.values(CATEGORY_SLUG_MAP).map(catMap => ({
      label: catMap.name,
      href: '/kitchen-display', 
      icon: catMap.icon,
      slug: catMap.slug, 
    })),
  },
  { label: 'الطاولات', href: '/tables', icon: TableIcon },
  {
    label: 'المخزون',
    href: '/inventory',
    icon: Package,
    children: [
      { label: 'نظرة عامة', href: '/inventory', icon: FileText },
      { label: 'المكونات', href: '/inventory/ingredients', icon: ShoppingBasket },
      { label: 'الموردين', href: '/inventory/suppliers', icon: Users },
      { label: 'أوامر الشراء', href: '/inventory/purchases', icon: ListChecks },
    ],
  },
  { label: 'الموظفين', href: '/employees', icon: UsersRound },
  {
    label: 'سجل الحضور',
    href: '/attendance',
    icon: CalendarClock,
    children: [
      { label: 'عرض السجل', href: '/attendance', icon: ListOrdered },
      { label: 'مسح QR للحضور', href: '/employee-qr-attendance', icon: QrCode },
    ]
  },
  { label: 'العملاء', href: '/customers', icon: Award },
  { label: 'التقييمات', href: '/reviews', icon: MessageSquare },
  { label: 'سجل الطلبات', href: '/orders', icon: ListOrdered },
  {
    label: 'التقارير',
    href: '/reports',
    icon: BarChart3,
    children: [
      { label: 'نظرة عامة', href: '/reports', icon: FileText },
      { label: 'المبيعات', href: '/reports/sales', icon: TrendingUp },
      { label: 'المصروفات', href: '/reports/expenses', icon: TrendingDown },
      { label: 'ملخص مالي', href: '/reports/financials', icon: Landmark },
      { label: 'ملخص المخزون', href: '/reports/inventory-summary', icon: Archive },
      { label: 'أوامر الشراء', href: '/reports/purchase-orders-summary', icon: ListChecks },
      { label: 'الأكثر مبيعًا', href: '/reports/top-selling', icon: Flame },
    ],
  },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  label: 'الإعدادات',
  href: '/settings',
  icon: Settings,
  children: [
    { label: 'إعدادات عامة', href: '/settings', icon: Settings },
    { label: 'إدارة المستخدمين', href: '/settings/users', icon: UserCog },
  ]
};


// Inventory Management Types
export type IngredientUnit = 'جرام' | 'كيلوجرام' | 'مللي لتر' | 'لتر' | 'قطعة';
export const INGREDIENT_UNITS: IngredientUnit[] = ['جرام', 'كيلوجرام', 'مللي لتر', 'لتر', 'قطعة'];

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  stockQuantity: number;
  costPerUnit: number;
  lowStockThreshold?: number;
  supplierId?: string;
  supplierName?: string; // Optional: denormalized for display
}


export interface MenuItemIngredient {
  ingredientId: string;
  ingredientName?: string; // For display purposes in recipe
  quantity: number;
  unit: IngredientUnit;
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  cost?: number;
  imageUrl: string;
  description?: string;
  dataAiHint?: string;
  ingredients?: MenuItemIngredient[];
  is_available?: boolean; // Added for menu item availability
}


export type OrderStatus = "قيد الانتظار" | "قيد التجهيز" | "جاهز" | "مكتمل" | "ملغى";
export type OrderType = "صالة" | "سفري" | "توصيل";

export interface OrderItem extends MenuItem { 
  quantity: number;
  notes?: string;
  category: Category; 
}
export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  vatPercentage?: number;
  vatAmount?: number;
  totalAmount: number;
  status: OrderStatus;
  type: OrderType;
  customerName?: string;
  tableNumber?: string;
  tableId?: string; 
  deliveryAddress?: string;
  captainName?: string; 
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  completed_at?: Date; 
  kitchen_started_at?: Date;
  kitchen_ready_at?: Date;
}

export const DEFAULT_VAT_PERCENTAGE = 14;


export type TableStatus = "متاحة" | "مشغولة" | "محجوزة" | "تحتاج تنظيف";

export interface Table {
  id: string;
  number: string;
  status: TableStatus;
  capacity: number;
  orderId?: string;
}

export const TABLE_STATUSES: TableStatus[] = ["متاحة", "مشغولة", "محجوزة", "تحتاج تنظيف"];


export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}


export type PurchaseOrderStatus = 'معلق' | 'مؤكد' | 'مستلم' | 'ملغى';

export interface PurchaseOrderItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  costPerUnit: number;
  unit: IngredientUnit;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string; 
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  receivedDate?: Date;
  notes?: string;
}


export type EmployeeRole = "كاشير" | "مقدم طعام" | "شيف" | "مدير" | "عامل نظافة" | "محاسب";
export const EMPLOYEE_ROLES: EmployeeRole[] = ["كاشير", "مقدم طعام", "شيف", "مدير", "عامل نظافة", "محاسب"];

export type EmployeeShift = "صباحي" | "مسائي" | "متغير";
export const EMPLOYEE_SHIFTS: EmployeeShift[] = ["صباحي", "مسائي", "متغير"];


export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  email?: string;
  salary?: number;
  hireDate: Date;
  is_active?: boolean;
  shift?: EmployeeShift; // Added shift property
}


export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  joinDate: Date;
  totalSpent?: number;
  notes?: string;
}


export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment?: string;
  reviewDate: Date;
  orderId?: string;
  menuItemName?: string; 
  is_public?: boolean; 
}


export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string; 
  clockInTime: Date;
  clockOutTime?: Date;
  attendanceDate: Date; 
  workDurationHours?: number; 
  notes?: string;
}


export interface SystemUser {
  id: string;
  username: string;
  hashedPassword?: string; 
  employeeId?: string;
  full_name?: string;
  roles: string[]; 
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; 
}

export const DUMMY_PERMISSIONS_LIST: string[] = [
  'view_dashboard', 'manage_pos', 'manage_menu', 'view_kitchen_screen', 'manage_tables',
  'manage_inventory_view', 'manage_inventory_edit', 'manage_employees_view', 'manage_employees_edit',
  'record_attendance_own', 'record_attendance_others', 'view_attendance_report',
  'manage_customers', 'view_reviews', 'view_orders_history', 'view_reports_sales',
  'view_reports_financial', 'manage_app_settings', 'manage_system_users'
];

// Note: DUMMY_ data arrays (DUMMY_INGREDIENTS, DUMMY_MENU_ITEMS, DUMMY_ORDERS, DUMMY_TABLES, DUMMY_SUPPLIERS, DUMMY_PURCHASE_ORDERS, DUMMY_EMPLOYEES, DUMMY_CUSTOMERS, DUMMY_REVIEWS, DUMMY_ATTENDANCE_RECORDS, DUMMY_ROLES, DUMMY_SYSTEM_USERS)
// are no longer the primary source of data for pages that have been connected to the database.
// They are kept for reference or for parts of the application not yet fully migrated.
// For a production system, these would be entirely replaced by database interactions.

// Example data for DUMMY_EMPLOYEES including shift
export let DUMMY_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'أحمد خالد', role: 'مدير', phone: '0501112233', email: 'ahmad.k@example.com', salary: 7000, hireDate: new Date('2023-01-15'), is_active: true, shift: 'صباحي' },
  { id: 'emp2', name: 'سارة علي', role: 'شيف', phone: '0502223344', salary: 6000, hireDate: new Date('2023-03-01'), is_active: true, shift: 'مسائي' },
  { id: 'emp3', name: 'محمد عبدالله', role: 'كاشير', phone: '0503334455', email: 'mohamed.a@example.com', salary: 4500, hireDate: new Date('2023-05-20'), is_active: true, shift: 'صباحي' },
  { id: 'emp4', name: 'فاطمة حسين', role: 'مقدم طعام', phone: '0504445566', salary: 4000, hireDate: new Date('2023-06-10'), is_active: true, shift: 'مسائي' },
  { id: 'emp5', name: 'علي الغامدي (سابق)', role: 'مقدم طعام', phone: '0505556677', salary: 3800, hireDate: new Date('2022-01-10'), is_active: false, shift: 'متغير' },
];

    