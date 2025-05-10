
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, BookOpenCheck, ListOrdered, BarChart3, Settings, ChefHat, Table2 as TableIcon, Package, UsersRound, Award, MessageSquare } from 'lucide-react';

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
  { label: 'المخزون', href: '/inventory', icon: Package },
  { label: 'الموظفين', href: '/employees', icon: UsersRound },
  { label: 'العملاء', href: '/customers', icon: Award },
  { label: 'التقييمات', href: '/reviews', icon: MessageSquare },
  { label: 'الطلبات', href: '/orders', icon: ListOrdered },
  { label: 'التقارير', href: '/reports', icon: BarChart3 },
];

export const SETTINGS_NAV_ITEM: NavItem = { label: 'الإعدادات', href: '/settings', icon: Settings };

export type Category = "مأكولات" | "مشروبات" | "حلويات" | "شيشة";

// Inventory Management Types
export type IngredientUnit = 'جرام' | 'كيلوجرام' | 'مللي لتر' | 'لتر' | 'قطعة';
export const INGREDIENT_UNITS: IngredientUnit[] = ['جرام', 'كيلوجرام', 'مللي لتر', 'لتر', 'قطعة'];

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit; // The unit for stockQuantity and costPerUnit
  stockQuantity: number;
  costPerUnit: number; // Cost for one unit as defined in 'unit'
  lowStockThreshold?: number;
  supplierId?: string;
}

export let DUMMY_INGREDIENTS: Ingredient[] = [
  { id: 'ing1', name: 'حبوب بن أرابيكا', unit: 'جرام', stockQuantity: 10000, costPerUnit: 0.02, lowStockThreshold: 2000 }, // Cost per gram (20/kg)
  { id: 'ing2', name: 'حليب كامل الدسم', unit: 'مللي لتر', stockQuantity: 20000, costPerUnit: 0.0015, lowStockThreshold: 5000 }, // Cost per ml (1.5/L)
  { id: 'ing3', name: 'سكر أبيض', unit: 'جرام', stockQuantity: 50000, costPerUnit: 0.0008, lowStockThreshold: 10000 }, // Cost per gram (0.8/kg)
  { id: 'ing4', name: 'لحم برجر', unit: 'قطعة', stockQuantity: 100, costPerUnit: 1, lowStockThreshold: 20 },
  { id: 'ing5', name: 'خبز برجر', unit: 'قطعة', stockQuantity: 100, costPerUnit: 0.25, lowStockThreshold: 20 },
  { id: 'ing6', name: 'بطاطس مجمدة', unit: 'جرام', stockQuantity: 30000, costPerUnit: 0.002, lowStockThreshold: 5000 }, // Cost per gram (2/kg)
  { id: 'ing7', name: 'دقيق كيك', unit: 'جرام', stockQuantity: 5000, costPerUnit: 0.0012, lowStockThreshold: 1000 }, // Cost per gram (1.2/kg)
  { id: 'ing8', name: 'بودرة كاكاو', unit: 'جرام', stockQuantity: 500, costPerUnit: 0.02, lowStockThreshold: 100 },
  { id: 'ing9', name: 'معسل تفاح', unit: 'جرام', stockQuantity: 1000, costPerUnit: 0.05, lowStockThreshold: 200 },
  { id: 'ing10', name: 'ماء (مفلتر)', unit: 'مللي لتر', stockQuantity: 100000, costPerUnit: 0.0001, lowStockThreshold: 20000 }, // Example water cost
];


export interface MenuItemIngredient {
  ingredientId: string;
  quantity: number;
  unit: IngredientUnit; // The unit used in this specific menu item's recipe
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  cost?: number; // This will be CALCULATED if ingredients are present, otherwise can be manual
  imageUrl: string;
  description?: string;
  dataAiHint?: string;
  ingredients?: MenuItemIngredient[]; // Array of ingredients used
  // sizes?: { name: string; price: number }[]; // Future use
}

export const DUMMY_MENU_ITEMS: MenuItem[] = [
  { 
    id: '1', name: 'اسبريسو', category: 'مشروبات', price: 2.50, 
    imageUrl: 'https://picsum.photos/200/200?image=1060', dataAiHint: "coffee cup", description: "قهوة غنية وقوية",
    ingredients: [
      { ingredientId: 'ing1', quantity: 7, unit: 'جرام' }, // 7g coffee beans
      { ingredientId: 'ing10', quantity: 30, unit: 'مللي لتر' } // 30ml water
    ]
    // Calculated cost would be (7 * 0.02) + (30 * 0.0001) = 0.14 + 0.003 = 0.143
  },
  { 
    id: '2', name: 'كابتشينو', category: 'مشروبات', price: 3.50, 
    imageUrl: 'https://picsum.photos/200/200?image=225', dataAiHint: "latte art", description: "اسبريسو مع رغوة حليب مبخر",
    ingredients: [
      { ingredientId: 'ing1', quantity: 7, unit: 'جرام' },   // 7g coffee beans
      { ingredientId: 'ing2', quantity: 150, unit: 'مللي لتر' }, // 150ml milk
      { ingredientId: 'ing10', quantity: 30, unit: 'مللي لتر' } // 30ml water for espresso base
    ]
    // Calculated cost: (7*0.02) + (150*0.0015) + (30*0.0001) = 0.14 + 0.225 + 0.003 = 0.368
  },
  { 
    id: '3', name: 'تشيز برجر', category: 'مأكولات', price: 8.00, cost: 2.50, // Manual cost for now
    imageUrl: 'https://picsum.photos/200/200?image=302', dataAiHint: "burger fries", description: "برجر لحم بالجبنة كلاسيكي",
    // ingredients: [
    //   { ingredientId: 'ing4', quantity: 1, unit: 'قطعة' }, // 1 burger patty
    //   { ingredientId: 'ing5', quantity: 1, unit: 'قطعة' }, // 1 burger bun
    //   // ... add cheese, lettuce, tomato ingredients if detailed
    // ]
  },
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
  notes?: string; 
  createdAt: Date;
}

export let DUMMY_ORDERS: Order[] = [
  { id: 'o1', orderNumber: 'طلب-001', items: [{ ...DUMMY_MENU_ITEMS[0], quantity: 2 }, { ...DUMMY_MENU_ITEMS[2], quantity: 1, notes: "بدون بصل" }], totalAmount: 13.00, status: 'مكتمل', type: 'صالة', tableNumber: '5', createdAt: new Date(Date.now() - 3600000 * 3) },
  { id: 'o2', orderNumber: 'طلب-002', items: [{ ...DUMMY_MENU_ITEMS[1], quantity: 1 }], totalAmount: 3.50, status: 'قيد التجهيز', type: 'سفري', customerName: 'أحمد محمود', createdAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'o3', orderNumber: 'طلب-003', items: [{ ...DUMMY_MENU_ITEMS[4], quantity: 1 }, { ...DUMMY_MENU_ITEMS[5], quantity: 1 }], totalAmount: 20.00, status: 'قيد الانتظار', type: 'توصيل', customerName: 'فاطمة علي', deliveryAddress: '123 الشارع الرئيسي, المدينة', captainName: 'جون دو', createdAt: new Date(Date.now() - 3600000 * 1) },
  { id: 'o4', orderNumber: 'طلب-004', items: [{ ...DUMMY_MENU_ITEMS[6], quantity: 2, notes: "سكر قليل" }, { ...DUMMY_MENU_ITEMS[3], quantity: 1 }], totalAmount: 16.00, status: 'قيد الانتظار', type: 'صالة', tableNumber: '2', createdAt: new Date() },
  { id: 'o5', orderNumber: 'طلب-005', items: [{ ...DUMMY_MENU_ITEMS[7], quantity: 1 }], totalAmount: 7.50, status: 'قيد التجهيز', type: 'صالة', tableNumber: '8', createdAt: new Date(Date.now() - 1800000) }, 
  { id: 'o6', orderNumber: 'طلب-006', items: [{ ...DUMMY_MENU_ITEMS[0], quantity: 1 }, { ...DUMMY_MENU_ITEMS[4], quantity: 1 }], totalAmount: 7.50, status: 'جاهز', type: 'سفري', customerName: 'سارة إبراهيم', createdAt: new Date(Date.now() - 900000) }, 
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
  { id: 't1', number: '1', status: 'متاحة', capacity: 4 },
  { id: 't2', number: '2', status: 'مشغولة', capacity: 2, orderId: 'o4' },
  { id: 't3', number: '3', status: 'محجوزة', capacity: 6 },
  { id: 't4', number: '4', status: 'متاحة', capacity: 4 },
  { id: 't5', number: '5', status: 'تحتاج تنظيف', capacity: 2 }, // Was 'o1' table, now needs cleaning
  { id: 't6', number: '6', status: 'متاحة', capacity: 8 },
  { id: 't7', number: '7', status: 'متاحة', capacity: 4 },
  { id: 't8', number: '8', status: 'مشغولة', capacity: 2, orderId: 'o5' },
  { id: 't9', number: '9', status: 'متاحة', capacity: 6 },
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
  supplierName: string; 
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
            { ingredientId: 'ing1', ingredientName: 'حبوب بن أرابيكا', quantity: 5000, costPerUnit: 0.0195, unit: 'جرام' }, // 5kg at 19.5/kg
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
            { ingredientId: 'ing2', ingredientName: 'حليب كامل الدسم', quantity: 10000, costPerUnit: 0.0015, unit: 'مللي لتر' }, // 10L at 1.5/L
        ],
        totalAmount: 15,
        status: 'مؤكد',
        orderDate: new Date('2024-05-10'),
        expectedDeliveryDate: new Date('2024-05-15'),
    }
];

// Employee Management Types
export type EmployeeRole = "كاشير" | "مقدم طعام" | "شيف" | "مدير" | "عامل نظافة" | "محاسب";
export const EMPLOYEE_ROLES: EmployeeRole[] = ["كاشير", "مقدم طعام", "شيف", "مدير", "عامل نظافة", "محاسب"];

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  email?: string;
  salary?: number;
  hireDate: Date; // Use string for form input, Date for storage/logic
}

export let DUMMY_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'أحمد خالد', role: 'مدير', phone: '0501112233', email: 'ahmad.k@example.com', salary: 7000, hireDate: new Date('2023-01-15') },
  { id: 'emp2', name: 'سارة علي', role: 'شيف', phone: '0502223344', salary: 6000, hireDate: new Date('2023-03-01') },
  { id: 'emp3', name: 'محمد عبدالله', role: 'كاشير', phone: '0503334455', email: 'mohamed.a@example.com', salary: 4500, hireDate: new Date('2023-05-20') },
  { id: 'emp4', name: 'فاطمة حسين', role: 'مقدم طعام', phone: '0504445566', salary: 4000, hireDate: new Date('2023-06-10') },
];


// Customer Management Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  joinDate: Date; // Use string for form input, Date for storage/logic
  totalSpent?: number; 
  notes?: string;
}

export let DUMMY_CUSTOMERS: Customer[] = [
  { id: 'cust1', name: 'خالد الغامدي', phone: '0551234567', email: 'khalid.g@example.com', loyaltyPoints: 150, joinDate: new Date('2023-02-10'), totalSpent: 1250.75 },
  { id: 'cust2', name: 'نورة السبيعي', phone: '0557654321', loyaltyPoints: 85, joinDate: new Date('2023-08-05'), totalSpent: 730.50 },
  { id: 'cust3', name: 'عبدالرحمن الشهري', phone: '0555555555', email: 'abdul.s@example.com', loyaltyPoints: 220, joinDate: new Date('2022-11-20'), totalSpent: 2100.00, notes: 'يفضل القهوة التركية' },
];


// Review Management Types
export interface Review {
  id: string;
  customerName: string; 
  rating: number; // 1 to 5
  comment?: string;
  reviewDate: Date; // Use string for form input, Date for storage/logic
  orderId?: string; 
  menuItemName?: string;
}

export let DUMMY_REVIEWS: Review[] = [
  { id: 'rev1', customerName: 'خالد الغامدي', rating: 5, comment: 'القهوة ممتازة والخدمة سريعة!', reviewDate: new Date('2024-05-01'), orderId: 'o1', menuItemName: 'اسبريسو' },
  { id: 'rev2', customerName: 'نورة السبيعي', rating: 4, comment: 'المكان جميل وهادئ، التشيز برجر كان جيد.', reviewDate: new Date('2024-04-28'), orderId: 'o2', menuItemName: 'تشيز برجر' },
  { id: 'rev3', customerName: 'زائر', rating: 3, comment: 'الشيشة كانت تحتاج فحم زيادة.', reviewDate: new Date('2024-04-25') },
  { id: 'rev4', customerName: 'عبدالرحمن الشهري', rating: 5, comment: 'كل شيء رائع كالعادة، أفضل كابتشينو في المدينة.', reviewDate: new Date('2024-05-03'), menuItemName: 'كابتشينو' },
];
