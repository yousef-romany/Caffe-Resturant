
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, BookOpenCheck, ListOrdered, BarChart3, Settings, ChefHat, Table2 as TableIcon, Package, UsersRound, Award, MessageSquare, Wallet, ShoppingBasket, Users, ListChecks, TrendingUp, TrendingDown, Landmark, Archive, Flame, FileText, UserCog, CalendarClock, Coffee as CoffeeIcon, Cake, Beer, Soup, Sandwich, GlassWater, QrCode, ShieldCheck } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
  slug?: CategorySlug;
  requiredPermission?: string; // Added for RBAC
}

export type Category = "مأكولات" | "مشروبات" | "حلويات" | "شيشة";
export const ITEM_CATEGORIES: Category[] = ["مأكولات", "مشروبات", "حلويات", "شيشة"];

// Example: if empty, all categories defined in CATEGORY_SLUG_MAP are accessible if user has 'view_kitchen_screen'
// If populated, e.g., ['حلويات'], only 'حلويات' section will be shown on kitchen display,
// assuming user has 'view_kitchen_screen' and this specific category assignment.
export const CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES: Category[] = [];


export const KITCHEN_CATEGORY_ICONS: Record<Category, LucideIcon> = {
  "مأكولات": Sandwich,
  "مشروبات": GlassWater,
  "حلويات": Cake,
  "شيشة": Flame,
};

export type CategorySlug = 'food' | 'drinks' | 'desserts' | 'hookah';

export const CATEGORY_SLUG_MAP: Record<CategorySlug, { name: Category; icon: LucideIcon; slug: CategorySlug }> = {
  'food': { name: 'مأكولات', icon: KITCHEN_CATEGORY_ICONS['مأكولات'], slug: 'food' },
  'drinks': { name: 'مشروبات', icon: KITCHEN_CATEGORY_ICONS['مشروبات'], slug: 'drinks' },
  'desserts': { name: 'حلويات', icon: KITCHEN_CATEGORY_ICONS['حلويات'], slug: 'desserts' },
  'hookah': { name: 'شيشة', icon: KITCHEN_CATEGORY_ICONS['شيشة'], slug: 'hookah' },
};


export const NAV_ITEMS: NavItem[] = [
  { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { label: 'نقطة البيع', href: '/pos', icon: ShoppingCart, requiredPermission: 'manage_pos' },
  { label: 'القائمة', href: '/menu', icon: BookOpenCheck, requiredPermission: 'manage_menu' },
  {
    label: 'شاشة المطبخ',
    href: '/kitchen-display',
    icon: ChefHat,
    requiredPermission: 'view_kitchen_screen',
    children: Object.values(CATEGORY_SLUG_MAP).map(catMap => ({
      label: catMap.name,
      href: '/kitchen-display',
      icon: catMap.icon,
      slug: catMap.slug,
      requiredPermission: 'view_kitchen_screen',
    })),
  },
  { label: 'الطاولات', href: '/tables', icon: TableIcon, requiredPermission: 'manage_tables' },
  {
    label: 'المخزون',
    href: '/inventory',
    icon: Package,
    requiredPermission: 'manage_inventory_view',
    children: [
      { label: 'نظرة عامة', href: '/inventory', icon: FileText, requiredPermission: 'manage_inventory_view' },
      { label: 'المكونات', href: '/inventory/ingredients', icon: ShoppingBasket, requiredPermission: 'manage_inventory_edit' },
      { label: 'الموردين', href: '/inventory/suppliers', icon: Users, requiredPermission: 'manage_inventory_edit' },
      { label: 'أوامر الشراء', href: '/inventory/purchases', icon: ListChecks, requiredPermission: 'manage_inventory_edit' },
    ],
  },
  { label: 'الموظفين', href: '/employees', icon: UsersRound, requiredPermission: 'manage_employees_view' },
  {
    label: 'سجل الحضور',
    href: '/attendance', // Main link for the accordion trigger itself
    icon: CalendarClock,
    requiredPermission: 'view_attendance_report', // Or 'record_attendance_own' for base access
    children: [
      { label: 'عرض السجل', href: '/attendance', icon: ListOrdered, requiredPermission: 'view_attendance_report' }, // Specific permission for viewing reports
      { label: 'مسح QR للحضور', href: '/employee-qr-attendance', icon: QrCode, requiredPermission: 'record_attendance_own' }, // Permission to use QR
    ]
  },
  { label: 'العملاء', href: '/customers', icon: Award, requiredPermission: 'manage_customers' },
  { label: 'التقييمات', href: '/reviews', icon: MessageSquare, requiredPermission: 'view_reviews' },
  { label: 'سجل الطلبات', href: '/orders', icon: ListOrdered, requiredPermission: 'view_orders_history' },
  {
    label: 'التقارير',
    href: '/reports',
    icon: BarChart3,
    requiredPermission: 'view_reports_sales', // General permission for accessing reports section
    children: [
      { label: 'نظرة عامة', href: '/reports', icon: FileText, requiredPermission: 'view_reports_sales' }, // Or a more general view_reports
      { label: 'المبيعات', href: '/reports/sales', icon: TrendingUp, requiredPermission: 'view_reports_sales' },
      { label: 'المصروفات', href: '/reports/expenses', icon: TrendingDown, requiredPermission: 'view_reports_financial' },
      { label: 'ملخص مالي', href: '/reports/financials', icon: Landmark, requiredPermission: 'view_reports_financial' },
      { label: 'ملخص المخزون', href: '/reports/inventory-summary', icon: Archive, requiredPermission: 'manage_inventory_view' },
      { label: 'أوامر الشراء', href: '/reports/purchase-orders-summary', icon: ListChecks, requiredPermission: 'manage_inventory_view' },
      { label: 'الأكثر مبيعًا', href: '/reports/top-selling', icon: Flame, requiredPermission: 'view_reports_sales' },
    ],
  },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  label: 'الإعدادات',
  href: '/settings',
  icon: Settings,
  requiredPermission: 'manage_app_settings',
  children: [
    { label: 'إعدادات عامة', href: '/settings', icon: Settings, requiredPermission: 'manage_app_settings' },
    { label: 'إدارة المستخدمين', href: '/settings/users', icon: UserCog, requiredPermission: 'manage_system_users' },
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
  supplierName?: string; // Denormalized for display convenience
}


export interface MenuItemIngredient {
  ingredientId: string;
  ingredientName?: string; // For display in forms
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
  is_available?: boolean;
}


export type OrderStatus = "قيد الانتظار" | "قيد التجهيز" | "جاهز" | "مكتمل" | "ملغى";
export type OrderType = "صالة" | "سفري" | "توصيل";

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
  category: Category; // Ensure category is part of OrderItem for kitchen display filtering
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
  tableId?: string; // To link directly to tables_info
  deliveryAddress?: string;
  captainName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  completed_at?: Date;
  kitchen_started_at?: Date;
  kitchen_ready_at?: Date;
}

export const DEFAULT_VAT_PERCENTAGE = 15;


export type TableStatus = "متاحة" | "مشغولة" | "محجوزة" | "تحتاج تنظيف";

export interface Table {
  id: string;
  number: string;
  status: TableStatus;
  capacity: number;
  orderId?: string; // current_order_id from DB
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
  costPerUnit: number; // cost_per_unit_at_purchase from DB
  unit: IngredientUnit; // unit_at_purchase from DB
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string; // Denormalized from DB
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
  shift?: EmployeeShift;
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
  customerName: string; // From DB: customer_name
  rating: number;
  comment?: string;
  reviewDate: Date; // From DB: review_date
  orderId?: string; // From DB: order_id
  menuItemName?: string; // From DB: menu_item_name
  is_public?: boolean; // From DB: is_public
  avatarFallback?: string; // Added for UI
}


export interface AttendanceRecord {
  id: string;
  employeeId: string; // From DB: employee_id
  employeeName?: string; // To be fetched/joined
  clockInTime: Date; // From DB: clock_in_time
  clockOutTime?: Date; // From DB: clock_out_time
  attendanceDate: Date; // From DB: attendance_date
  workDurationHours?: number; // From DB: work_duration_hours
  notes?: string;
}


export interface SystemUser {
  id: string;
  username: string;
  hashedPassword?: string; // Not typically sent to client
  employeeId?: string;    // From DB: employee_id
  fullName?: string;      // From DB: full_name (alias as fullName in JS)
  roles: string[];        // Array of role IDs
  isActive: boolean;      // From DB: is_active
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // Array of permission names/IDs
}

export interface Permission {
  id: string;
  name: string;
  group_name?: string;
  description?: string;
}

export const DUMMY_PERMISSIONS_LIST: string[] = [
  'view_dashboard', 'manage_pos', 'manage_menu', 'view_kitchen_screen', 'manage_tables',
  'manage_inventory_view', 'manage_inventory_edit', 'manage_employees_view', 'manage_employees_edit',
  'record_attendance_own', 'record_attendance_others', 'view_attendance_report',
  'manage_customers', 'view_reviews', 'view_orders_history',
  'view_reports_sales', 'view_reports_financial',
  'manage_app_settings', 'manage_system_users'
];

// DUMMY DATA - Kept for reference during development if DB connection fails or for initial setup.
// Should be phased out or used only for initial seeding if absolutely necessary.
export const DUMMY_CUSTOMERS: Customer[] = [];
export const DUMMY_ORDERS: Order[] = [];
export const DUMMY_MENU_ITEMS: MenuItem[] = [];
export const DUMMY_TABLES: Table[] = [];
export const DUMMY_EMPLOYEES: Employee[] = [];
export const DUMMY_ATTENDANCE_RECORDS: AttendanceRecord[] = [];
export const DUMMY_REVIEWS: Review[] = [];
export const DUMMY_INGREDIENTS: Ingredient[] = [];
export const DUMMY_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const DUMMY_SUPPLIERS: Supplier[] = [];
export const DUMMY_SYSTEM_USERS: SystemUser[] = [];
export const DUMMY_ROLES: Role[] = [];
// End DUMMY DATA
