
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { MenuItemCard } from '@/components/custom/MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ITEM_CATEGORIES, type MenuItem, type OrderItem, type Category, type Order, type OrderType, type Table, OrderStatus, DEFAULT_VAT_PERCENTAGE } from '@/constants';
import { Search, XCircle, MinusCircle, PlusCircle, DollarSign, ShoppingCart, Edit2, Receipt, Table2 as TableIcon, Printer, Percent, Store, Car, Utensils } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

const invoiceLabels = {
  ar: {
    invoiceTitle: "فاتورة الطلب",
    date: "التاريخ",
    status: "الحالة",
    type: "النوع",
    table: "الطاولة",
    customer: "العميل",
    address: "العنوان",
    orderNotes: "ملاحظات الطلب",
    items: "العناصر",
    item: "العنصر",
    quantity: "الكمية",
    pricePerItem: "السعر لكل عنصر",
    itemNotes: "ملاحظات",
    subtotal: "الإجمالي الفرعي",
    discount: "الخصم",
    vat: `ضريبة القيمة المضافة (${DEFAULT_VAT_PERCENTAGE}%)`,
    total: "الإجمالي النهائي",
    close: "إغلاق",
    pay: "محاسبة ودفع",
    print: "طباعة الفاتورة",
    language: "اللغة",
    arabic: "العربية",
    english: "الإنجليزية",
    statusText: {
      "قيد الانتظار": "قيد الانتظار",
      "قيد التجهيز": "قيد التجهيز",
      "جاهز": "جاهز",
      "مكتمل": "مكتمل",
      "ملغى": "ملغى",
    } as Record<OrderStatus, string>,
    orderNumber: "رقم الطلب",
    notesPlaceholder: "ملاحظات إضافية على الطلب بالكامل (اختياري)",
    posTitleTable: (tableNum: string) => `نقطة البيع - طاولة ${tableNum}`,
    posDescTable: (tableNum: string) => `إدارة طلب الطاولة ${tableNum}.`,
    posTitleGeneral: "نقطة البيع",
    posDescGeneral: "أنشئ طلبات جديدة بسرعة.",
    applyDiscount: "تطبيق الخصم",
    applyVAT: `تطبيق ضريبة القيمة المضافة (${DEFAULT_VAT_PERCENTAGE}%)`,
    discountPercentage: "نسبة الخصم (%)",
    orderTypeLabel: "نوع الطلب",
    dineIn: "صالة",
    takeAway: "سفري",
    delivery: "توصيل",
  },
  en: {
    invoiceTitle: "Order Invoice",
    date: "Date",
    status: "Status",
    type: "Type",
    table: "Table",
    customer: "Customer",
    address: "Address",
    orderNotes: "Order Notes",
    items: "Items",
    item: "Item",
    quantity: "Quantity",
    pricePerItem: "Price per item",
    itemNotes: "Notes",
    subtotal: "Subtotal",
    discount: "Discount",
    vat: `VAT (${DEFAULT_VAT_PERCENTAGE}%)`,
    total: "Total Amount",
    close: "Close",
    pay: "Settle & Pay",
    print: "Print Invoice",
    language: "Language",
    arabic: "Arabic",
    english: "English",
    statusText: {
      "قيد الانتظار": "Pending",
      "قيد التجهيز": "Preparing",
      "جاهز": "Ready",
      "مكتمل": "Completed",
      "ملغى": "Cancelled",
    } as Record<OrderStatus, string>,
    orderNumber: "Order Number",
    notesPlaceholder: "Additional notes for the entire order (optional)",
    posTitleTable: (tableNum: string) => `POS - Table ${tableNum}`,
    posDescTable: (tableNum: string) => `Manage order for table ${tableNum}.`,
    posTitleGeneral: "Point of Sale",
    posDescGeneral: "Quickly create new orders.",
    applyDiscount: "Apply Discount",
    applyVAT: `Apply VAT (${DEFAULT_VAT_PERCENTAGE}%)`,
    discountPercentage: "Discount Percentage (%)",
    orderTypeLabel: "Order Type",
    dineIn: "Dine-in",
    takeAway: "Takeaway",
    delivery: "Delivery",
  },
};


export default function POSPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbMenuItems, setDbMenuItems] = useState<MenuItem[]>([]);
  const [dbAvailableTables, setDbAvailableTables] = useState<Table[]>([]);


  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'الكل'>('الكل');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [editingItemNotes, setEditingItemNotes] = useState<OrderItem | null>(null);
  const [itemNotesInput, setItemNotesInput] = useState('');

  const [orderType, setOrderType] = useState<OrderType | ''>('');
  const [tableNumber, setTableNumber] = useState('');
  const [tableId, setTableId] = useState<string | null>(null); // Store tableId for DB operations
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [generalOrderNotes, setGeneralOrderNotes] = useState('');
  
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [confirmedOrderForInvoice, setConfirmedOrderForInvoice] = useState<Order | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [invoiceLanguage, setInvoiceLanguage] = useState<'ar' | 'en'>('ar');

  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isVatEnabled, setIsVatEnabled] = useState(false);
  const vatPercentage = DEFAULT_VAT_PERCENTAGE; 


  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const currentLabels = invoiceLabels[invoiceLanguage];

  const resetPOSSession = useCallback((navigateToTables: boolean = false) => {
    setCurrentOrder([]);
    setOrderType('');
    setTableNumber('');
    setTableId(null);
    setCustomerName('');
    setDeliveryAddress('');
    setGeneralOrderNotes('');
    setCurrentOrderId(null);
    setSearchTerm(''); 
    setSelectedCategory('الكل'); 
    setIsDiscountEnabled(false);
    setDiscountPercentage(0);
    setIsVatEnabled(false);
    setInvoiceLanguage('ar');

    localStorage.removeItem('pos_target_table_number');
    localStorage.removeItem('pos_target_table_id');
    localStorage.removeItem('pos_target_order_id');
    localStorage.removeItem('pos_action');

    if (navigateToTables) {
      router.push('/tables');
    }
    router.replace(pathname); // Clean URL from any query params if any existed
  }, [router, pathname]);

  useEffect(() => {
    async function initializeAndLoadData() {
      setIsLoading(true);
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        // Fetch Menu Items
        const menuItemsData: MenuItem[] = await dbInstance.select(
          "SELECT id, name, category, price, cost, image_url as imageUrl, description, data_ai_hint as dataAiHint, is_available FROM menu_items WHERE is_available = TRUE ORDER BY category, name"
        );
        setDbMenuItems(menuItemsData.map(item => ({...item, price: Number(item.price), cost: item.cost ? Number(item.cost) : undefined })));

        // Fetch Available Tables (initially, can be refetched if needed)
        const tablesData: Table[] = await dbInstance.select(
          "SELECT id, number, status, capacity, current_order_id as orderId FROM tables_info WHERE status = 'متاحة' ORDER BY CAST(number AS UNSIGNED), number"
        );
        setDbAvailableTables(tablesData);

        // Load POS state from localStorage
        const tableNumFromStorage = localStorage.getItem('pos_target_table_number');
        const tableIdFromStorage = localStorage.getItem('pos_target_table_id');
        const orderIdFromStorage = localStorage.getItem('pos_target_order_id');
        const actionFromStorage = localStorage.getItem('pos_action');

        localStorage.removeItem('pos_target_table_number');
        localStorage.removeItem('pos_target_table_id');
        localStorage.removeItem('pos_target_order_id');
        localStorage.removeItem('pos_action');

        if (orderIdFromStorage) { // Editing an existing order
          setCurrentOrderId(orderIdFromStorage);
          const existingOrderResult: any[] = await dbInstance.select("SELECT * FROM orders WHERE id = $1", [orderIdFromStorage]);
          if (existingOrderResult.length > 0) {
            const existingOrder = existingOrderResult[0];
            const itemsResult: OrderItem[] = await dbInstance.select(
              "SELECT mi.id, mi.name, mi.category, oi.price_at_order as price, oi.quantity, oi.notes, mi.image_url as imageUrl, mi.data_ai_hint as dataAiHint FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = $1",
              [orderIdFromStorage]
            );

            setCurrentOrder(itemsResult.map(item => ({...item, price: Number(item.price), quantity: Number(item.quantity)})));
            setOrderType(existingOrder.type as OrderType);
            if (existingOrder.type === 'صالة' && existingOrder.table_id) {
              const tableInfo: any[] = await dbInstance.select("SELECT number FROM tables_info WHERE id = $1", [existingOrder.table_id]);
              if (tableInfo.length > 0) {
                setTableNumber(tableInfo[0].number);
                setTableId(existingOrder.table_id);
              }
            }
            setGeneralOrderNotes(existingOrder.notes || '');
            setCustomerName(existingOrder.customer_name || '');
            setDeliveryAddress(existingOrder.delivery_address || '');
            setIsDiscountEnabled(!!existingOrder.discount_percentage && existingOrder.discount_percentage > 0);
            setDiscountPercentage(Number(existingOrder.discount_percentage) || 0);
            setIsVatEnabled(!!existingOrder.vat_percentage && existingOrder.vat_percentage > 0);
          } else {
            toast({ title: "خطأ في الطلب", description: `لم يتم العثور على الطلب ${orderIdFromStorage}. بدء طلب جديد.`, variant: "destructive" });
            resetPOSSession(false);
          }
        } else if (tableIdFromStorage && tableNumFromStorage) { // New order for a specific table
          setOrderType('صالة');
          setTableNumber(tableNumFromStorage);
          setTableId(tableIdFromStorage);
          // Ensure this table is still available, or handle if occupied by another session
          const tableStatusResult: any[] = await dbInstance.select("SELECT status FROM tables_info WHERE id = $1", [tableIdFromStorage]);
          if (tableStatusResult.length > 0 && tableStatusResult[0].status !== 'متاحة' && tableStatusResult[0].status !== 'محجوزة') {
             toast({ title: "تنبيه", description: `الطاولة ${tableNumFromStorage} مشغولة حاليًا بطلب آخر أو تحتاج تنظيف.`, variant: "destructive"});
             resetPOSSession(true); // Navigate back to tables
          }
        }
      } catch (error) {
        console.error("Error initializing POS page:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات نقطة البيع.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    initializeAndLoadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Should run once on mount. resetPOSSession is memoized.

  const filteredMenuItems = useMemo(() => {
    return dbMenuItems.filter(item =>
      (selectedCategory === 'الكل' || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedCategory, dbMenuItems]);

  const availableTablesForSelection = useMemo(() => {
    if (currentOrderId && orderType === 'صالة' && tableId) { // Editing an existing table order
        const currentTable = dbAvailableTables.find(t => t.id === tableId) || (tableNumber && tableId ? [{id: tableId, number: tableNumber, capacity:0, status: 'مشغولة' as TableStatus}] : []); // Add current table if not in available list
        return Array.isArray(currentTable) ? currentTable : (currentTable ? [currentTable] : []);
    }
    return dbAvailableTables;
  }, [currentOrderId, orderType, tableId, tableNumber, dbAvailableTables]);


  const handleAddItemToOrder = (item: MenuItem) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id && !orderItem.notes); 
    if (existingItem) {
      setCurrentOrder(currentOrder.map(orderItem =>
        orderItem.id === item.id && !orderItem.notes ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
      ));
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1, notes: '' }]);
    }
    toast({ title: `تمت إضافة ${item.name} إلى الطلب.`});
  };

  const handleUpdateQuantity = (itemId: string, itemNotes: string | undefined, change: number) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.id === itemId && item.notes === itemNotes) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(item => item !== null) as OrderItem[]);
  };


  const handleRemoveItem = (itemToRemove: OrderItem) => {
    const itemIndexToRemove = currentOrder.findIndex(
      (item) => item.id === itemToRemove.id && item.notes === itemToRemove.notes
    );
    if (itemIndexToRemove > -1) {
      setCurrentOrder(currentOrder.filter((_, index) => index !== itemIndexToRemove));
    }
  };
  
  const handleOpenEditNotesDialog = (item: OrderItem) => {
    setEditingItemNotes(item);
    setItemNotesInput(item.notes || '');
  };

  const handleSaveItemNotes = () => {
    if (editingItemNotes) {
      setCurrentOrder(currentOrder.map(item => {
        if (item.id === editingItemNotes.id && item.notes === editingItemNotes.notes && item.quantity === editingItemNotes.quantity) { 
          return { ...item, notes: itemNotesInput };
        }
        return item;
      }));
      setEditingItemNotes(null);
      setItemNotesInput('');
      toast({ title: `تم تحديث الملاحظات لـ ${editingItemNotes.name}.`});
    }
  };

  const orderCalculations = useMemo(() => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    if (isDiscountEnabled && discountPercentage > 0) {
      discountAmount = subtotal * (discountPercentage / 100);
    }
    const totalAfterDiscount = subtotal - discountAmount;
    let vatAmount = 0;
    if (isVatEnabled) {
      vatAmount = totalAfterDiscount * (vatPercentage / 100);
    }
    const finalTotal = totalAfterDiscount + vatAmount;
    return { subtotal, discountAmount, totalAfterDiscount, vatAmount, finalTotal };
  }, [currentOrder, isDiscountEnabled, discountPercentage, isVatEnabled, vatPercentage]);


  const handleClearOrder = () => {
    const wasTableOrder = orderType === 'صالة' && tableNumber;
    resetPOSSession(!!wasTableOrder); 
    toast({ title: "تم مسح الطلب."});
  };

  const handlePlaceOrder = async () => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    if (currentOrder.length === 0) {
      toast({ title: "لا يمكن إرسال طلب فارغ.", variant: "destructive" });
      return;
    }
    if (!orderType) {
      toast({ title: "الرجاء اختيار نوع الطلب.", variant: "destructive" });
      return;
    }

    let orderSpecificsMet = true;
    let missingFieldMessage = "";

    if (orderType === 'صالة' && !tableId) { // Check for tableId
      orderSpecificsMet = false;
      missingFieldMessage = "الرجاء اختيار طاولة لطلبات الصالة.";
    }
    if ((orderType === 'سفري' || orderType === 'توصيل') && !customerName.trim()) {
      orderSpecificsMet = false;
      missingFieldMessage = "الرجاء إدخال اسم العميل لطلبات السفري والتوصيل.";
    }
    if (orderType === 'توصيل' && !deliveryAddress.trim()) {
      orderSpecificsMet = false;
      missingFieldMessage = "الرجاء إدخال عنوان التوصيل لطلبات التوصيل.";
    }

    if (!orderSpecificsMet) {
      toast({ title: "بيانات الطلب غير مكتملة", description: missingFieldMessage, variant: "destructive" });
      return;
    }
    
    const { subtotal, discountAmount, vatAmount, finalTotal } = orderCalculations;
    const now = new Date().toISOString();
    let orderToConfirmForInvoice: Order;

    try {
      setIsLoading(true);
      if (currentOrderId) { 
        await db.execute(
          "UPDATE orders SET type = $1, customer_name = $2, delivery_address = $3, notes = $4, subtotal = $5, discount_percentage = $6, discount_amount = $7, vat_percentage = $8, vat_amount = $9, total_amount = $10, updated_at = $11, table_id = $12 WHERE id = $13",
          [
            orderType, customerName.trim() || null, deliveryAddress.trim() || null, generalOrderNotes.trim() || null,
            subtotal, isDiscountEnabled ? discountPercentage : null, isDiscountEnabled ? discountAmount : null,
            isVatEnabled ? vatPercentage : null, isVatEnabled ? vatAmount : null, finalTotal, now,
            orderType === 'صالة' ? tableId : null, currentOrderId
          ]
        );
        await db.execute("DELETE FROM order_items WHERE order_id = $1", [currentOrderId]);
        for (const item of currentOrder) {
          const itemCost = dbMenuItems.find(mi => mi.id === item.id)?.cost;
          await db.execute(
            "INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, quantity, price_at_order, cost_at_order, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [`oi-${Date.now()}-${item.id}`, currentOrderId, item.id, item.name, item.quantity, item.price, itemCost, item.notes || null]
          );
        }
        orderToConfirmForInvoice = { 
            id: currentOrderId, 
            orderNumber: (await db.select<any[]>("SELECT order_number FROM orders WHERE id = $1", [currentOrderId]))[0].order_number, 
            items: currentOrder, 
            totalAmount: finalTotal, 
            subtotal, discountAmount, discountPercentage: isDiscountEnabled ? discountPercentage : undefined, 
            vatAmount, vatPercentage: isVatEnabled ? vatPercentage : undefined,
            status: (await db.select<any[]>("SELECT status FROM orders WHERE id = $1", [currentOrderId]))[0].status, 
            type: orderType as OrderType, createdAt: parseISO((await db.select<any[]>("SELECT created_at FROM orders WHERE id = $1", [currentOrderId]))[0].created_at), 
            notes: generalOrderNotes.trim() || undefined, 
            customerName: customerName.trim() || undefined, 
            deliveryAddress: deliveryAddress.trim() || undefined, 
            tableNumber: orderType === 'صالة' ? tableNumber : undefined
        };
        toast({ title: "تم تحديث الطلب بنجاح" });
      } else { 
        const newOrderIdValue = `order-${Date.now()}`;
        const newOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        await db.execute(
          "INSERT INTO orders (id, order_number, type, customer_name, delivery_address, notes, subtotal, discount_percentage, discount_amount, vat_percentage, vat_amount, total_amount, status, created_at, updated_at, table_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
          [
            newOrderIdValue, newOrderNumber, orderType, customerName.trim() || null, deliveryAddress.trim() || null, generalOrderNotes.trim() || null,
            subtotal, isDiscountEnabled ? discountPercentage : null, isDiscountEnabled ? discountAmount : null,
            isVatEnabled ? vatPercentage : null, isVatEnabled ? vatAmount : null, finalTotal, 'قيد الانتظار', now, now,
            orderType === 'صالة' ? tableId : null
          ]
        );
        for (const item of currentOrder) {
          const itemCost = dbMenuItems.find(mi => mi.id === item.id)?.cost;
          await db.execute(
            "INSERT INTO order_items (id, order_id, menu_item_id, menu_item_name, quantity, price_at_order, cost_at_order, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [`oi-${Date.now()}-${item.id}`, newOrderIdValue, item.id, item.name, item.quantity, item.price, itemCost, item.notes || null]
          );
        }
        if (orderType === 'صالة' && tableId) {
          await db.execute("UPDATE tables_info SET status = 'مشغولة', current_order_id = $1, updated_at = $2 WHERE id = $3", [newOrderIdValue, now, tableId]);
        }
        orderToConfirmForInvoice = { 
            id: newOrderIdValue, orderNumber: newOrderNumber, items: currentOrder, totalAmount: finalTotal, 
            subtotal, discountAmount, discountPercentage: isDiscountEnabled ? discountPercentage : undefined, 
            vatAmount, vatPercentage: isVatEnabled ? vatPercentage : undefined,
            status: 'قيد الانتظار', type: orderType as OrderType, createdAt: new Date(), notes: generalOrderNotes.trim() || undefined,
            customerName: customerName.trim() || undefined, deliveryAddress: deliveryAddress.trim() || undefined,
            tableNumber: orderType === 'صالة' ? tableNumber : undefined
        };
        toast({ title: "تم إرسال الطلب للمطبخ بنجاح" });
      }
      setConfirmedOrderForInvoice(orderToConfirmForInvoice);
      setIsInvoiceDialogOpen(true);

    } catch (error) {
      console.error("Error placing order:", error);
      toast({ title: "خطأ", description: "فشل إرسال/تحديث الطلب.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseInvoiceDialogAndClearPOS = () => {
    setIsInvoiceDialogOpen(false);
    const wasTableOrder = confirmedOrderForInvoice?.type === 'صالة' && confirmedOrderForInvoice?.tableNumber;
    setConfirmedOrderForInvoice(null);
    resetPOSSession(!!wasTableOrder); 
  };
  
  const handleOrderTypeChange = (value: OrderType | '') => {
    if (currentOrderId && orderType === 'صالة' && tableNumber) return; 
    setOrderType(value);
    if (value !== 'صالة') {
      setTableNumber(''); 
      setTableId(null);
    }
    if (value !== 'سفري' && value !== 'توصيل') {
        setCustomerName('');
    }
    if (value !== 'توصيل') {
        setDeliveryAddress('');
    }
  };

  const handleTableSelectionChange = (selectedTableNumber: string) => {
    const selectedTableObject = dbAvailableTables.find(t => t.number === selectedTableNumber);
    if (selectedTableObject) {
        setTableNumber(selectedTableObject.number);
        setTableId(selectedTableObject.id);
    } else {
        setTableNumber('');
        setTableId(null);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const getPageTitle = () => {
    if (currentOrderId && orderType === 'صالة' && tableNumber) {
      return currentLabels.posTitleTable(tableNumber);
    }
    if (!currentOrderId && orderType === 'صالة' && tableNumber) {
      return currentLabels.posTitleTable(tableNumber);
    }
    return currentLabels.posTitleGeneral;
  };

  const getPageDescription = () => {
    if (currentOrderId && orderType ==='صالة' && tableNumber) {
      return currentLabels.posDescTable(tableNumber);
    }
    if (!currentOrderId && orderType === 'صالة' && tableNumber) {
      return currentLabels.posDescTable(tableNumber);
    }
    return currentLabels.posDescGeneral;
  };

  if (isLoading && !db) { // Initial DB connection loading
    return (
      <>
        <PageHeader title="نقطة البيع" description="جارٍ الاتصال بقاعدة البيانات..." icon={ShoppingCart} />
        <p className="text-center text-muted-foreground py-10">يرجى الانتظار...</p>
      </>
    );
  }
  if (isLoading) { // Data loading after DB connection
    return (
      <>
        <PageHeader title={getPageTitle()} description={getPageDescription()} icon={ShoppingCart} />
        <p className="text-center text-muted-foreground py-10">جارٍ تحميل بيانات نقطة البيع...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title={getPageTitle()}
        description={getPageDescription()}
        icon={(currentOrderId && orderType ==='صالة' && tableNumber) || (!currentOrderId && orderType === 'صالة' && tableNumber) ? TableIcon : ShoppingCart}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Menu Items Section */}
        <div className="lg:col-span-2 flex flex-col h-full bg-card p-4 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث عن العناصر..."
                className="pe-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
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
          <ScrollArea className="flex-grow">
            {isClient && filteredMenuItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 ps-3">
                {filteredMenuItems.map(item => (
                  <MenuItemCard key={item.id} item={item} onAddToCart={handleAddItemToOrder} variant="display" />
                ))}
              </div>
            ) : isClient ? (
              <p className="text-center text-muted-foreground py-10">لا توجد عناصر تطابق معاييرك.</p>
            ) : (
               <p className="text-center text-muted-foreground py-10">جارٍ تحميل العناصر...</p>
            )}
          </ScrollArea>
        </div>

        {/* Current Order Section */}
        <Card className="flex flex-col h-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {currentOrderId ? `تعديل الطلب: ${(async () => db && (await db.select<any[]>("SELECT order_number FROM orders WHERE id = $1", [currentOrderId]))[0]?.order_number || currentOrderId)()}` : 'الطلب الحالي'}
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="py-0">
              {isClient && currentOrder.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">لا توجد عناصر في الطلب بعد.</p>
              ) : isClient ? (
                <ul className="space-y-3 p-3">
                  {currentOrder.map((item) => ( 
                    <li key={`${item.id}-${item.notes || 'no-notes'}`} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-md">
                      <NextImage src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md h-10 w-10 object-cover flex-shrink-0" data-ai-hint={item.dataAiHint || "food item"}/>
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                        {item.notes && <p className="text-xs text-blue-600 italic mt-0.5">ملاحظات: {item.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.notes, -1)}>
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="font-medium w-5 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.notes, 1)}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <Dialog open={editingItemNotes === item} onOpenChange={(isOpen) => { if (!isOpen) setEditingItemNotes(null); }}>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditNotesDialog(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader className="text-right">
                            <DialogTitle>تعديل الملاحظات لـ {editingItemNotes?.name}</DialogTitle>
                            <DialogDescription>إضافة أو تعديل ملاحظات لهذا العنصر.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 items-center gap-4">
                              <Label htmlFor="itemNotesInput" className="text-left">الملاحظات</Label>
                              <Textarea id="itemNotesInput" value={itemNotesInput} onChange={(e) => setItemNotesInput(e.target.value)} placeholder="مثال: جبنة إضافية، بدون سكر" />
                            </div>
                          </div>
                          <DialogFooter>
                              <DialogClose asChild>
                              <Button variant="outline" onClick={() => setEditingItemNotes(null)}>إلغاء</Button>
                            </DialogClose>
                            <Button onClick={handleSaveItemNotes}>حفظ الملاحظات</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveItem(item)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-10">جارٍ تحميل الطلب...</p>
              )}
            </CardContent>
          </ScrollArea>
          
          {isClient && (
            <>
            <div className="space-y-4 p-4 border-t">
              <div>
                <Label className="mb-2 block">{currentLabels.orderTypeLabel}</Label>
                 <Select 
                    value={orderType} 
                    onValueChange={(value) => handleOrderTypeChange(value as OrderType | '')}
                    disabled={!!(currentOrderId && orderType === 'صالة' && tableNumber)} 
                  >
                    <SelectTrigger id="orderTypeSelect" disabled={!!(currentOrderId && orderType === 'صالة' && tableNumber)}>
                        <SelectValue placeholder="اختر نوع الطلب" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="صالة"><Store className="h-4 w-4 me-2 inline-block" /> {currentLabels.dineIn}</SelectItem>
                        <SelectItem value="سفري"><Utensils className="h-4 w-4 me-2 inline-block" /> {currentLabels.takeAway}</SelectItem>
                        <SelectItem value="توصيل"><Car className="h-4 w-4 me-2 inline-block" /> {currentLabels.delivery}</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

              {orderType === 'صالة' && (
                <div>
                  <Label htmlFor="tableNumber">رقم الطاولة</Label>
                  {(currentOrderId && orderType === 'صالة' && tableNumber) ? ( 
                     <Input id="tableNumberInput" value={tableNumber} className="mt-1" disabled />
                  ) : (
                    <Select 
                        value={tableNumber} 
                        onValueChange={handleTableSelectionChange}
                        disabled={!!(currentOrderId && orderType === 'صالة' && tableNumber)} 
                    >
                      <SelectTrigger id="tableNumberSelect" className="mt-1" disabled={!!(currentOrderId && orderType === 'صالة' && tableNumber) || (currentOrderId && !tableNumber) }>
                        <SelectValue placeholder={availableTablesForSelection.length > 0 ? "اختر طاولة" : "لا توجد طاولات متاحة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTablesForSelection.length > 0 ? availableTablesForSelection.map(t => (
                          <SelectItem key={t.id} value={t.number}>
                            طاولة {t.number} (تسع لـ {t.capacity})
                          </SelectItem>
                        )) : <SelectItem value="" disabled>لا توجد طاولات متاحة</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {(orderType === 'سفري' || orderType === 'توصيل') && (
                <div>
                  <Label htmlFor="customerName">اسم العميل</Label>
                  <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسم العميل" className="mt-1" />
                </div>
              )}

              {orderType === 'توصيل' && (
                <div>
                  <Label htmlFor="deliveryAddress">عنوان التوصيل</Label>
                  <Input id="deliveryAddress" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="أدخل عنوان التوصيل" className="mt-1" />
                </div>
              )}
              <div>
                  <Label htmlFor="generalOrderNotes">ملاحظات الطلب</Label>
                  <Textarea id="generalOrderNotes" value={generalOrderNotes} onChange={(e) => setGeneralOrderNotes(e.target.value)} placeholder={currentLabels.notesPlaceholder} className="mt-1"/>
              </div>

              <Separator className="my-3" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isDiscountEnabled" className="flex items-center gap-2 cursor-pointer">
                    <Switch id="isDiscountEnabled" checked={isDiscountEnabled} onCheckedChange={setIsDiscountEnabled} />
                    {currentLabels.applyDiscount}
                  </Label>
                  {isDiscountEnabled && (
                    <div className="flex items-center gap-2 w-28">
                      <Input 
                        type="number" 
                        id="discountPercentage" 
                        value={discountPercentage} 
                        onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)} 
                        className="h-8 text-sm"
                        min="0" max="100"
                      />
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isVatEnabled" className="flex items-center gap-2 cursor-pointer">
                    <Switch id="isVatEnabled" checked={isVatEnabled} onCheckedChange={setIsVatEnabled} />
                    {currentLabels.applyVAT}
                  </Label>
                </div>
              </div>
            </div>

            <CardFooter className="flex flex-col gap-3 pt-4 border-t">
              <div className="w-full text-sm space-y-1">
                <div className="flex justify-between">
                  <span>{currentLabels.subtotal}:</span>
                  <span>${orderCalculations.subtotal.toFixed(2)}</span>
                </div>
                {isDiscountEnabled && orderCalculations.discountAmount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>{currentLabels.discount} ({discountPercentage}%):</span>
                    <span>-${orderCalculations.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                 {isVatEnabled && (
                  <div className="flex justify-between">
                    <span>{currentLabels.vat}:</span>
                    <span>+${orderCalculations.vatAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Separator/>
              <div className="w-full flex justify-between items-center text-lg font-semibold">
                <span>{currentLabels.total}:</span>
                <span className="flex items-center">
                  <DollarSign className="h-5 w-5 me-1 text-primary" />
                  {orderCalculations.finalTotal.toFixed(2)}
                </span>
              </div>
              <div className="w-full grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleClearOrder} className="text-destructive border-destructive hover:bg-destructive/10">
                  مسح الطلب
                </Button>
                <Button 
                    onClick={handlePlaceOrder} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                    disabled={currentOrder.length === 0 || (orderType === 'صالة' && !tableId && !currentOrderId)}
                >
                  {currentOrderId ? 'تحديث الطلب' : 'إرسال الطلب'}
                </Button>
              </div>
            </CardFooter>
            </>
          )}
        </Card>
      </div>

      {confirmedOrderForInvoice && (
        <Dialog open={isInvoiceDialogOpen} onOpenChange={(open) => { if(!open) handleCloseInvoiceDialogAndClearPOS(); }}>
          <DialogContent className="sm:max-w-lg printable-area" dir={invoiceLanguage === 'en' ? 'ltr' : 'rtl'}>
            <div className="printable-invoice-content">
              <DialogHeader>
                 <h1 className="dialog-title-print"> 
                  <Receipt className="h-6 w-6 text-primary inline me-2"/>
                  {currentLabels.invoiceTitle}: {confirmedOrderForInvoice.orderNumber}
                 </h1>
                <p className="dialog-description-print"> 
                  {currentLabels.date}: {format(new Date(confirmedOrderForInvoice.createdAt), 'PPpp', { locale: invoiceLanguage === 'ar' ? arSA : enUS })}
                </p>
              </DialogHeader>
              <div className="mt-4 max-h-[60vh] overflow-y-auto ps-2 space-y-4">
                <p><strong>{currentLabels.status}:</strong> <Badge variant={confirmedOrderForInvoice.status === 'مكتمل' ? 'default' : confirmedOrderForInvoice.status === 'ملغى' ? 'destructive' : 'secondary'} className="badge-print">{currentLabels.statusText[confirmedOrderForInvoice.status]}</Badge></p>
                <p><strong>{currentLabels.type}:</strong> {confirmedOrderForInvoice.type}</p>
                {confirmedOrderForInvoice.type === 'صالة' && confirmedOrderForInvoice.tableNumber && <p><strong>{currentLabels.table}:</strong> {confirmedOrderForInvoice.tableNumber}</p>}
                {confirmedOrderForInvoice.customerName && <p><strong>{currentLabels.customer}:</strong> {confirmedOrderForInvoice.customerName}</p>}
                {confirmedOrderForInvoice.type === 'توصيل' && confirmedOrderForInvoice.deliveryAddress && <p><strong>{currentLabels.address}:</strong> {confirmedOrderForInvoice.deliveryAddress}</p>}
                {confirmedOrderForInvoice.notes && <p><strong>{currentLabels.orderNotes}:</strong> {confirmedOrderForInvoice.notes}</p>}
                
                <h4 className="font-semibold mt-4">{currentLabels.items}:</h4>
                <ul className="space-y-2 invoice-items-list">
                  {confirmedOrderForInvoice.items.map((item, idx) => (
                    <li key={`${item.id}-${item.notes || 'no-notes'}-${idx}`} className="item-row">
                      <NextImage src={item.imageUrl} alt={item.name} width={50} height={50} className="rounded-md h-12 w-12 object-cover no-print" data-ai-hint={item.dataAiHint || "food item"}/>
                      <div className="item-details">
                        <p className="item-name-print">{item.name}</p>
                        <p className="item-meta-print">{currentLabels.quantity}: {item.quantity} &nbsp;|&nbsp; ${item.price.toFixed(2)} {currentLabels.pricePerItem}</p>
                        {item.notes && <p className="item-notes-print">{currentLabels.itemNotes}: {item.notes}</p>}
                      </div>
                      <p className="item-total-price">${(item.price * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
                
                <div className="invoice-summary">
                  <div className="summary-row">
                    <p>{currentLabels.subtotal}:</p>
                    <p>${(confirmedOrderForInvoice.subtotal ?? 0).toFixed(2)}</p>
                  </div>
                  {confirmedOrderForInvoice.discountAmount && confirmedOrderForInvoice.discountAmount > 0 && (
                    <div className="summary-row">
                       <p>{currentLabels.discount} ({confirmedOrderForInvoice.discountPercentage || 0}%):</p>
                       <p>-${confirmedOrderForInvoice.discountAmount.toFixed(2)}</p>
                    </div>
                  )}
                  {confirmedOrderForInvoice.vatAmount && confirmedOrderForInvoice.vatAmount > 0 && (
                     <div className="summary-row">
                       <p>{currentLabels.vat}:</p>
                       <p>+${confirmedOrderForInvoice.vatAmount.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="summary-row total">
                    <p>{currentLabels.total}:</p>
                    <p>${confirmedOrderForInvoice.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="no-print pt-4 flex-wrap sm:justify-start">
              <div className="w-full sm:w-auto mb-2 sm:mb-0">
                 <Label htmlFor="invoiceLanguage" className="me-2">{currentLabels.language}:</Label>
                <Select value={invoiceLanguage} onValueChange={(value) => setInvoiceLanguage(value as 'ar' | 'en')}>
                  <SelectTrigger id="invoiceLanguage" className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">{currentLabels.arabic}</SelectItem>
                    <SelectItem value="en">{currentLabels.english}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <Button type="button" variant="outline" onClick={handlePrintInvoice} className="sm:ms-auto">
                <Printer className="me-2 h-4 w-4" /> {currentLabels.print}
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseInvoiceDialogAndClearPOS}>
                {currentLabels.close}
              </Button>
              <Button type="button" className="bg-green-500 hover:bg-green-600 text-white" onClick={async () => { 
                  if(db && confirmedOrderForInvoice) {
                    try {
                        await db.execute("UPDATE orders SET status = 'مكتمل', completed_at = $1, updated_at = $1 WHERE id = $2", [new Date().toISOString(), confirmedOrderForInvoice.id]);
                        if (confirmedOrderForInvoice.type === 'صالة' && confirmedOrderForInvoice.tableNumber) {
                            const tableResult: any[] = await db.select("SELECT id FROM tables_info WHERE number = $1", [confirmedOrderForInvoice.tableNumber]);
                            if(tableResult.length > 0) {
                                await db.execute("UPDATE tables_info SET status = 'تحتاج تنظيف', current_order_id = NULL, updated_at = $1 WHERE id = $2", [new Date().toISOString(), tableResult[0].id]);
                            }
                        }
                        toast({title: "تمت المحاسبة بنجاح"}); 
                    } catch (err) {
                        console.error("Error completing order:", err);
                        toast({title: "خطأ", description: "فشل تحديث حالة الطلب أو الطاولة.", variant: "destructive"});
                    }
                  }
                  handleCloseInvoiceDialogAndClearPOS(); 
                }}>
                {currentLabels.pay}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

