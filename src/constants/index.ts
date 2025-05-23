
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

// Example: To show only 'حلويات' and 'مشروبات' for current staff
// export const CURRENT_KITCHEN_STAFF_ASSIGNED_CATEGORIES: Category[] = ['حلويات', 'مشروبات'];
// To show all, leave it empty or list all categories
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
    href: '/kitchen-display', // Main link points to the generic display
    icon: ChefHat,
    children: Object.values(CATEGORY_SLUG_MAP).map(catMap => ({
      label: catMap.name,
      href: '/kitchen-display', // All sub-items point to the same page
      icon: catMap.icon,
      slug: catMap.slug, // Add slug for localStorage
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

export let DUMMY_INGREDIENTS: Ingredient[] = [
  { id: 'ing1', name: 'حبوب بن أرابيكا', unit: 'جرام', stockQuantity: 10000, costPerUnit: 0.02, lowStockThreshold: 2000 },
  { id: 'ing2', name: 'حليب كامل الدسم', unit: 'مللي لتر', stockQuantity: 20000, costPerUnit: 0.0015, lowStockThreshold: 5000 },
  { id: 'ing3', name: 'سكر أبيض', unit: 'جرام', stockQuantity: 50000, costPerUnit: 0.0008, lowStockThreshold: 10000 },
  { id: 'ing4', name: 'لحم برجر', unit: 'قطعة', stockQuantity: 100, costPerUnit: 1, lowStockThreshold: 20 },
  { id: 'ing5', name: 'خبز برجر', unit: 'قطعة', stockQuantity: 100, costPerUnit: 0.25, lowStockThreshold: 20 },
  { id: 'ing6', name: 'بطاطس مجمدة', unit: 'جرام', stockQuantity: 30000, costPerUnit: 0.002, lowStockThreshold: 5000 },
  { id: 'ing7', name: 'دقيق كيك', unit: 'جرام', stockQuantity: 5000, costPerUnit: 0.0012, lowStockThreshold: 1000 },
  { id: 'ing8', name: 'بودرة كاكاو', unit: 'جرام', stockQuantity: 500, costPerUnit: 0.02, lowStockThreshold: 100 },
  { id: 'ing9', name: 'معسل تفاح', unit: 'جرام', stockQuantity: 1000, costPerUnit: 0.05, lowStockThreshold: 200 },
  { id: 'ing10', name: 'ماء (مفلتر)', unit: 'مللي لتر', stockQuantity: 100000, costPerUnit: 0.0001, lowStockThreshold: 20000 },
];


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

export const DUMMY_MENU_ITEMS: MenuItem[] = [
  {
    id: '1', name: 'اسبريسو', category: 'مشروبات', price: 2.50,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "coffee cup", description: "قهوة غنية وقوية",
    ingredients: [
      { ingredientId: 'ing1', quantity: 7, unit: 'جرام' },
      { ingredientId: 'ing10', quantity: 30, unit: 'مللي لتر' }
    ],
    is_available: true,
  },
  {
    id: '2', name: 'كابتشينو', category: 'مشروبات', price: 3.50,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "latte art", description: "اسبريسو مع رغوة حليب مبخر",
    ingredients: [
      { ingredientId: 'ing1', quantity: 7, unit: 'جرام' },
      { ingredientId: 'ing2', quantity: 150, unit: 'مللي لتر' },
      { ingredientId: 'ing10', quantity: 30, unit: 'مللي لتر' }
    ],
    is_available: true,
  },
  {
    id: '3', name: 'تشيز برجر', category: 'مأكولات', price: 8.00,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "burger fries", description: "برجر لحم بالجبنة كلاسيكي",
    ingredients: [
      { ingredientId: 'ing4', quantity: 1, unit: 'قطعة' },
      { ingredientId: 'ing5', quantity: 1, unit: 'قطعة' },
    ],
    cost: 1.25,
    is_available: true,
  },
  {
    id: '4', name: 'بطاطس مقلية', category: 'مأكولات', price: 3.00,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "french fries", description: "بطاطس ذهبية مقرمشة",
    ingredients: [ { ingredientId: 'ing6', quantity: 150, unit: 'جرام' } ],
    cost: 0.30,
    is_available: true,
  },
  {
    id: '5', name: 'كيكة شوكولاتة', category: 'حلويات', price: 5.00,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "chocolate slice", description: "كيكة شوكولاتة غنية وفاخرة",
    ingredients: [
        { ingredientId: 'ing7', quantity: 50, unit: 'جرام' },
        { ingredientId: 'ing8', quantity: 20, unit: 'جرام' },
        { ingredientId: 'ing3', quantity: 30, unit: 'جرام' },
    ],
    cost: 0.484,
    is_available: true,
  },
  {
    id: '6', name: 'شيشة تفاح', category: 'شيشة', price: 15.00,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "hookah smoke", description: "شيشة بنكهة التفاح المنعشة",
    ingredients: [ {ingredientId: 'ing9', quantity: 25, unit: 'جرام'} ],
    cost: 1.25,
    is_available: true,
  },
  {
    id: '7', name: 'آيس لاتيه', category: 'مشروبات', price: 4.00,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "iced latte", description: "لاتيه مثلج مع ثلج",
    ingredients: [
        { ingredientId: 'ing1', quantity: 7, unit: 'جرام' },
        { ingredientId: 'ing2', quantity: 180, unit: 'مللي لتر' },
        { ingredientId: 'ing10', quantity: 30, unit: 'مللي لتر' }
    ],
    cost: 0.413,
    is_available: true,
  },
  {
    id: '8', name: 'ساندويتش دجاج', category: 'مأكولات', price: 7.50,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "club sandwich", description: "ساندويتش دجاج مشوي",
    cost: 2.00,
    is_available: true,
  },
  {
    id: 'm9', name: 'عصير برتقال طازج', category: 'مشروبات', price: 4.50,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "orange juice", description: "عصير برتقال طازج ومعصور.",
    cost: 1.00,
    is_available: true,
  },
  {
    id: 'm10', name: 'سلطة سيزر', category: 'مأكولات', price: 6.50,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "caesar salad", description: "سلطة سيزر كلاسيكية مع دجاج مشوي.",
    cost: 1.80,
    is_available: true,
  },
  {
    id: 'm11', name: 'مولتن كيك', category: 'حلويات', price: 6.00,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "molten cake", description: "كيك شوكولاتة ذائبة مع آيس كريم فانيلا.",
    cost: 1.50,
    is_available: false, // Example of unavailable item
  },
  {
    id: 'm12', name: 'شيشة عنب نعناع', category: 'شيشة', price: 16.00,
    imageUrl: 'https://placehold.co/300x200.png', dataAiHint: "hookah flavors", description: "شيشة بنكهة العنب والنعناع.",
    cost: 1.30,
    is_available: true,
  },
];


export type OrderStatus = "قيد الانتظار" | "قيد التجهيز" | "جاهز" | "مكتمل" | "ملغى";
export type OrderType = "صالة" | "سفري" | "توصيل";

export interface OrderItem extends MenuItem { // For cart and order display, inherits MenuItem but overrides quantity and adds notes
  quantity: number;
  notes?: string;
  category: Category; // Ensure category is present
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
  tableId?: string; // Added to store table ID if order is for a table
  deliveryAddress?: string;
  captainName?: string; // For delivery orders
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  completed_at?: Date; // Timestamp for when order was marked as completed
  kitchen_started_at?: Date;
  kitchen_ready_at?: Date;
}

export const DEFAULT_VAT_PERCENTAGE = 14;


export let DUMMY_ORDERS: Order[] = [
  {
    id: 'o1',
    orderNumber: 'طلب-001',
    items: [
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '1')!, quantity: 2, category: 'مشروبات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '3')!, quantity: 1, notes: "بدون بصل", category: 'مأكولات' }
    ],
    subtotal: (2.50 * 2) + 8.00,
    totalAmount: 13.00,
    status: 'مكتمل',
    type: 'صالة',
    tableNumber: '5',
    createdAt: new Date(Date.now() - 3600000 * 3),
    kitchen_started_at: new Date(Date.now() - 3600000 * 2.9),
    kitchen_ready_at: new Date(Date.now() - 3600000 * 2.7),
    completed_at: new Date(Date.now() - 3600000 * 2.5)
  },
  {
    id: 'o2',
    orderNumber: 'طلب-002',
    items: [
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '2')!, quantity: 1, category: 'مشروبات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '5')!, quantity: 1, notes: "بدون سكر إضافي", category: 'حلويات'}
    ],
    subtotal: 3.50 + 5.00,
    totalAmount: 8.50,
    status: 'قيد التجهيز',
    type: 'سفري',
    customerName: 'أحمد محمود',
    createdAt: new Date(Date.now() - 1200000),
    kitchen_started_at: new Date(Date.now() - 600000)
  },
  {
    id: 'o3',
    orderNumber: 'طلب-003',
    items: [
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '5')!, quantity: 1, category: 'حلويات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '6')!, quantity: 1, category: 'شيشة' }
    ],
    subtotal: 5.00 + 15.00,
    totalAmount: 20.00,
    status: 'قيد الانتظار',
    type: 'توصيل',
    customerName: 'فاطمة علي',
    deliveryAddress: '123 الشارع الرئيسي, المدينة',
    captainName: 'جون دو',
    createdAt: new Date(Date.now() - 360000)
  },
  {
    id: 'o4',
    orderNumber: 'طلب-004',
    items: [
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '7')!, quantity: 2, notes: "سكر قليل", category: 'مشروبات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '4')!, quantity: 1, category: 'مأكولات' }
    ],
    subtotal: (4.00 * 2) + 3.00,
    totalAmount: 11.00,
    status: 'قيد الانتظار',
    type: 'صالة',
    tableNumber: '2',
    tableId: 't2',
    createdAt: new Date(Date.now() - 60000)
  },
  {
    id: 'o5',
    orderNumber: 'طلب-005',
    items: [
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '8')!, quantity: 1, category: 'مأكولات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '1')!, quantity: 1, notes: "دبل شوت", category: 'مشروبات'}
    ],
    subtotal: 7.50 + 2.50,
    totalAmount: 10.00,
    status: 'قيد التجهيز',
    type: 'صالة',
    tableNumber: '8',
    tableId: 't8',
    createdAt: new Date(Date.now() - 1800000),
    kitchen_started_at: new Date(Date.now() - 900000)
  },
  {
    id: 'o6',
    orderNumber: 'طلب-006',
    items: [
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '1')!, quantity: 1, category: 'مشروبات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '5')!, quantity: 1, category: 'حلويات' }
    ],
    subtotal: 2.50 + 5.00,
    totalAmount: 7.50,
    status: 'جاهز',
    type: 'سفري',
    customerName: 'سارة إبراهيم',
    createdAt: new Date(Date.now() - 900000),
    kitchen_started_at: new Date(Date.now() - 700000),
    kitchen_ready_at: new Date(Date.now() - 300000)
  },
  {
    id: 'o7',
    orderNumber: 'طلب-007',
    items: [
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '3')!, quantity: 1, category: 'مأكولات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '2')!, quantity: 2, notes: "حليب قليل الدسم", category: 'مشروبات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '5')!, quantity: 1, category: 'حلويات' }
    ],
    subtotal: 8.00 + (3.50 * 2) + 5.00,
    totalAmount: 20.00,
    status: 'قيد الانتظار',
    type: 'صالة',
    tableNumber: '1',
    tableId: 't1',
    createdAt: new Date(Date.now() - 300000),
  },
  {
    id: 'o8',
    orderNumber: 'طلب-008',
    items: [
      { ...DUMMY_MENU_ITEMS.find(i => i.id === 'm10')!, quantity: 1, category: 'مأكولات' },
      { ...DUMMY_MENU_ITEMS.find(i => i.id === '6')!, quantity: 1, category: 'شيشة' },
    ],
    subtotal: 6.50 + 15.00,
    totalAmount: 21.50,
    status: 'قيد التجهيز',
    type: 'صالة',
    tableNumber: '9',
    tableId: 't9',
    createdAt: new Date(Date.now() - 720000),
    kitchen_started_at: new Date(Date.now() - 420000)
  }
];


export type TableStatus = "متاحة" | "مشغولة" | "محجوزة" | "تحتاج تنظيف";

export interface Table {
  id: string;
  number: string;
  status: TableStatus;
  capacity: number;
  orderId?: string;
}

export const DUMMY_TABLES: Table[] = [
  { id: 't1', number: '1', status: 'مشغولة', capacity: 4, orderId: 'o7' },
  { id: 't2', number: '2', status: 'مشغولة', capacity: 2, orderId: 'o4' },
  { id: 't3', number: '3', status: 'محجوزة', capacity: 6 },
  { id: 't4', number: '4', status: 'متاحة', capacity: 4 },
  { id: 't5', number: '5', status: 'تحتاج تنظيف', capacity: 2 },
  { id: 't6', number: '6', status: 'متاحة', capacity: 8 },
  { id: 't7', number: '7', status: 'متاحة', capacity: 4 },
  { id: 't8', number: '8', status: 'مشغولة', capacity: 2, orderId: 'o5' },
  { id: 't9', number: '9', status: 'مشغولة', capacity: 6, orderId: 'o8' },
  { id: 't10', number: '10', status: 'محجوزة', capacity: 4 },
];

export const TABLE_STATUSES: TableStatus[] = ["متاحة", "مشغولة", "محجوزة", "تحتاج تنظيف"];


export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export let DUMMY_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'موردو القهوة الممتازون', contactPerson: 'علي حسن', phone: '0501234567', email: 'ali.hassan@coffeebeans.com', address: 'شارع الرياض, جدة' },
  { id: 'sup2', name: 'ألبان المزرعة الطازجة', contactPerson: 'فاطمة سعيد', phone: '0559876543', email: 'fatima.saeed@freshdairy.com', address: 'طريق الملك فهد, الرياض' },
  { id: 'sup3', name: 'مخابز وحلويات المدينة', phone: '0123456789', address: 'حي النور, الدمام' },
];

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
  supplierName: string; // Denormalized for display convenience
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  receivedDate?: Date;
  notes?: string;
}

export let DUMMY_PURCHASE_ORDERS: PurchaseOrder[] = [
    {
        id: 'po1',
        orderNumber: 'PO-2024-001',
        supplierId: 'sup1',
        supplierName: 'موردو القهوة الممتازون',
        items: [
            { ingredientId: 'ing1', ingredientName: 'حبوب بن أرابيكا', quantity: 5000, costPerUnit: 0.0195, unit: 'جرام' },
        ],
        totalAmount: 97.5,
        status: 'مستلم',
        orderDate: new Date('2024-04-01'),
        receivedDate: new Date('2024-04-05'),
    },
    {
        id: 'po2',
        orderNumber: 'PO-2024-002',
        supplierId: 'sup2',
        supplierName: 'ألبان المزرعة الطازجة',
        items: [
            { ingredientId: 'ing2', ingredientName: 'حليب كامل الدسم', quantity: 10000, costPerUnit: 0.0015, unit: 'مللي لتر' },
        ],
        totalAmount: 15,
        status: 'مؤكد',
        orderDate: new Date('2024-05-10'),
        expectedDeliveryDate: new Date('2024-05-15'),
    }
];

export type EmployeeRole = "كاشير" | "مقدم طعام" | "شيف" | "مدير" | "عامل نظافة" | "محاسب";
export const EMPLOYEE_ROLES: EmployeeRole[] = ["كاشير", "مقدم طعام", "شيف", "مدير", "عامل نظافة", "محاسب"];

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  email?: string;
  salary?: number;
  hireDate: Date;
  is_active?: boolean; // Added for employee status
}

export let DUMMY_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'أحمد خالد', role: 'مدير', phone: '0501112233', email: 'ahmad.k@example.com', salary: 7000, hireDate: new Date('2023-01-15'), is_active: true },
  { id: 'emp2', name: 'سارة علي', role: 'شيف', phone: '0502223344', salary: 6000, hireDate: new Date('2023-03-01'), is_active: true },
  { id: 'emp3', name: 'محمد عبدالله', role: 'كاشير', phone: '0503334455', email: 'mohamed.a@example.com', salary: 4500, hireDate: new Date('2023-05-20'), is_active: true },
  { id: 'emp4', name: 'فاطمة حسين', role: 'مقدم طعام', phone: '0504445566', salary: 4000, hireDate: new Date('2023-06-10'), is_active: true },
  { id: 'emp5', name: 'علي الغامدي (سابق)', role: 'مقدم طعام', phone: '0505556677', salary: 3800, hireDate: new Date('2022-01-10'), is_active: false },
];


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

export let DUMMY_CUSTOMERS: Customer[] = [
  { id: 'cust1', name: 'خالد الغامدي', phone: '0551234567', email: 'khalid.g@example.com', loyaltyPoints: 150, joinDate: new Date('2023-02-10'), totalSpent: 1250.75 },
  { id: 'cust2', name: 'نورة السبيعي', phone: '0557654321', loyaltyPoints: 85, joinDate: new Date('2023-08-05'), totalSpent: 730.50 },
  { id: 'cust3', name: 'عبدالرحمن الشهري', phone: '0555555555', email: 'abdul.s@example.com', loyaltyPoints: 220, joinDate: new Date('2022-11-20'), totalSpent: 2100.00, notes: 'يفضل القهوة التركية' },
];


export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment?: string;
  reviewDate: Date;
  orderId?: string;
  menuItemName?: string; // Denormalized from menu item at time of review
  is_public?: boolean; // Whether the review can be shown publicly
}

export let DUMMY_REVIEWS: Review[] = [
  { id: 'rev1', customerName: 'خالد الغامدي', rating: 5, comment: 'القهوة ممتازة والخدمة سريعة!', reviewDate: new Date('2024-05-01'), orderId: 'o1', menuItemName: 'اسبريسو', is_public: true },
  { id: 'rev2', customerName: 'نورة السبيعي', rating: 4, comment: 'المكان جميل وهادئ، التشيز برجر كان جيد.', reviewDate: new Date('2024-04-28'), orderId: 'o2', menuItemName: 'تشيز برجر', is_public: true },
  { id: 'rev3', customerName: 'زائر', rating: 3, comment: 'الشيشة كانت تحتاج فحم زيادة.', reviewDate: new Date('2024-04-25'), is_public: true },
  { id: 'rev4', customerName: 'عبدالرحمن الشهري', rating: 5, comment: 'كل شيء رائع كالعادة، أفضل كابتشينو في المدينة.', reviewDate: new Date('2024-05-03'), menuItemName: 'كابتشينو', is_public: false }, // Example private review
];

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string; // For display, if needed
  clockInTime: Date;
  clockOutTime?: Date;
  attendanceDate: Date; // Derived from clock_in_time for easier querying
  workDurationHours?: number; // Calculated on clock_out
  notes?: string;
}

export let DUMMY_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att1',
    employeeId: 'emp3',
    clockInTime: new Date(new Date().setHours(8, 58, 0, 0)),
    clockOutTime: new Date(new Date().setHours(17, 5, 0, 0)),
    attendanceDate: new Date(new Date().setHours(0,0,0,0)),
    workDurationHours: 8.11,
  },
  {
    id: 'att2',
    employeeId: 'emp4',
    clockInTime: new Date(new Date().setHours(9, 10, 0, 0)),
    attendanceDate: new Date(new Date().setHours(0,0,0,0)),
    // No clockOutTime yet
  },
  {
    id: 'att3',
    employeeId: 'emp3',
    clockInTime: new Date(new Date(new Date().setDate(new Date().getDate() -1)).setHours(9, 0, 0, 0)),
    clockOutTime: new Date(new Date(new Date().setDate(new Date().getDate() -1)).setHours(17, 15, 0, 0)),
    attendanceDate: new Date(new Date(new Date().setDate(new Date().getDate() -1)).setHours(0,0,0,0)),
    workDurationHours: 8.25,
  },
];

export interface SystemUser {
  id: string;
  username: string;
  hashedPassword?: string; // Should never be sent to client
  employeeId?: string;
  fullName?: string;
  roles: string[]; // Array of role IDs
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // Array of permission names/keys
}

// This list should ideally be fetched from the 'permissions' table in the DB
export const DUMMY_PERMISSIONS_LIST: string[] = [
  'view_dashboard', 'manage_pos', 'manage_menu', 'view_kitchen_screen', 'manage_tables',
  'manage_inventory_view', 'manage_inventory_edit', 'manage_employees_view', 'manage_employees_edit',
  'record_attendance_own', 'record_attendance_others', 'view_attendance_report',
  'manage_customers', 'view_reviews', 'view_orders_history', 'view_reports_sales',
  'view_reports_financial', 'manage_app_settings', 'manage_system_users'
];


export let DUMMY_ROLES: Role[] = [
    { id: 'role_admin', name: 'مسؤول النظام', description: 'صلاحيات كاملة على النظام', permissions: [...DUMMY_PERMISSIONS_LIST] },
    { id: 'role_manager', name: 'مدير', description: 'إدارة العمليات والموظفين والتقارير', permissions: ['view_dashboard', 'manage_pos', 'manage_menu', 'manage_employees_view', 'view_reports_sales'] },
    { id: 'role_cashier', name: 'كاشير', description: 'معالجة الطلبات والمدفوعات', permissions: ['manage_pos', 'view_orders_history'] },
    { id: 'role_kitchen', name: 'شيف', description: 'إدارة المطبخ وحالة الطلبات', permissions: ['view_kitchen_screen'] },
];

export let DUMMY_SYSTEM_USERS: SystemUser[] = [
    { id: 'user1', username: 'admin', employeeId: 'emp1', fullName: 'أحمد خالد (مدير)', roles: ['role_admin', 'role_manager'], isActive: true, hashedPassword: 'hashed_password_example_admin' },
    { id: 'user2', username: 'cashier1', employeeId: 'emp3', fullName: 'محمد عبدالله (كاشير)', roles: ['role_cashier'], isActive: true, hashedPassword: 'hashed_password_example_cashier' },
    { id: 'user3', username: 'chef_sara', employeeId: 'emp2', fullName: 'سارة علي (شيف)', roles: ['role_kitchen'], isActive: true, hashedPassword: 'hashed_password_example_chef' },
    { id: 'user4', username: 'manager_test', fullName: 'مدير تجريبي', roles: ['role_manager'], isActive: false, hashedPassword: 'hashed_password_example_manager' },
];
