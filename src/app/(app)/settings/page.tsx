
"use client"; // Required for useState, useEffect, etc.

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Percent, Tag, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

// Define setting keys as constants for consistency
const SETTING_KEYS = {
  STORE_NAME: 'STORE_NAME',
  STORE_ADDRESS: 'STORE_ADDRESS',
  STORE_CONTACT_PHONE: 'STORE_CONTACT_PHONE',
  IS_VAT_ENABLED: 'IS_VAT_ENABLED',
  VAT_PERCENTAGE: 'VAT_PERCENTAGE',
  IS_GLOBAL_DISCOUNT_ENABLED: 'IS_GLOBAL_DISCOUNT_ENABLED',
  GLOBAL_DISCOUNT_PERCENTAGE: 'GLOBAL_DISCOUNT_PERCENTAGE',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [db, setDbInstance] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store Information State
  const [storeName, setStoreName] = useState('كافيه بوس إكسبريس');
  const [storeAddress, setStoreAddress] = useState('123 الشارع الرئيسي, أي مدينة');
  const [storeContactPhone, setStoreContactPhone] = useState('+1 (555) 123-4567');

  // Tax and Discount State
  const [isVatEnabled, setIsVatEnabled] = useState(true);
  const [vatPercentage, setVatPercentage] = useState(14); // Default from original constant
  const [isGlobalDiscountEnabled, setIsGlobalDiscountEnabled] = useState(false);
  const [globalDiscountPercentage, setGlobalDiscountPercentage] = useState(0);

  useEffect(() => {
    async function initializeDbAndLoadSettings() {
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
        if (dbInstance) {
          await loadAllSettings(dbInstance);
        } else {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات. لا يمكن تحميل الإعدادات.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error initializing DB for settings:", error);
        toast({ title: "خطأ في التهيئة", description: "فشل تهيئة قاعدة البيانات للإعدادات.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    initializeDbAndLoadSettings();
  }, [toast]); // toast is stable

  const loadAllSettings = async (currentDb: Database) => {
    setIsLoading(true);
    try {
      const settingsResult: any[] = await currentDb.select('SELECT setting_key, setting_value FROM app_settings');
      const settingsMap = new Map(settingsResult.map(s => [s.setting_key, s.setting_value]));

      setStoreName(settingsMap.get(SETTING_KEYS.STORE_NAME) || 'كافيه بوس إكسبريس');
      setStoreAddress(settingsMap.get(SETTING_KEYS.STORE_ADDRESS) || '123 الشارع الرئيسي, أي مدينة');
      setStoreContactPhone(settingsMap.get(SETTING_KEYS.STORE_CONTACT_PHONE) || '+1 (555) 123-4567');

      setIsVatEnabled(settingsMap.get(SETTING_KEYS.IS_VAT_ENABLED) === 'true');
      setVatPercentage(parseFloat(settingsMap.get(SETTING_KEYS.VAT_PERCENTAGE) || '14'));
      setIsGlobalDiscountEnabled(settingsMap.get(SETTING_KEYS.IS_GLOBAL_DISCOUNT_ENABLED) === 'true');
      setGlobalDiscountPercentage(parseFloat(settingsMap.get(SETTING_KEYS.GLOBAL_DISCOUNT_PERCENTAGE) || '0'));

    } catch (error) {
      console.error("Error loading settings:", error);
      toast({ title: "خطأ", description: "فشل تحميل الإعدادات من قاعدة البيانات.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return false;
    }
    try {
      // Attempt to update; if no rows affected, then insert (UPSERT logic)
      const updateResult: any = await db.execute(
        "UPDATE app_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2",
        [value, key]
      );

      if (updateResult.rowsAffected === 0) {
        await db.execute(
          "INSERT INTO app_settings (setting_key, setting_value) VALUES ($1, $2)",
          [key, value]
        );
      }
      return true;
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      toast({ title: "خطأ في الحفظ", description: `فشل حفظ الإعداد: ${key}.`, variant: "destructive" });
      return false;
    }
  };

  const handleSaveStoreInfo = async () => {
    let success = true;
    success &&= await saveSetting(SETTING_KEYS.STORE_NAME, storeName);
    success &&= await saveSetting(SETTING_KEYS.STORE_ADDRESS, storeAddress);
    success &&= await saveSetting(SETTING_KEYS.STORE_CONTACT_PHONE, storeContactPhone);
    if (success) {
      toast({ title: "نجاح", description: "تم حفظ معلومات المتجر." });
    }
  };

  const handleSaveTaxDiscountSettings = async () => {
    let success = true;
    success &&= await saveSetting(SETTING_KEYS.IS_VAT_ENABLED, isVatEnabled.toString());
    success &&= await saveSetting(SETTING_KEYS.VAT_PERCENTAGE, vatPercentage.toString());
    success &&= await saveSetting(SETTING_KEYS.IS_GLOBAL_DISCOUNT_ENABLED, isGlobalDiscountEnabled.toString());
    success &&= await saveSetting(SETTING_KEYS.GLOBAL_DISCOUNT_PERCENTAGE, globalDiscountPercentage.toString());
    if (success) {
      toast({ title: "نجاح", description: "تم حفظ إعدادات الضريبة والخصم." });
    }
  };

  if (isLoading && !db) {
    return <PageHeader title="الإعدادات" description="جارٍ تحميل الإعدادات..." />;
  }


  return (
    <>
      <PageHeader title="الإعدادات" description="إدارة إعدادات التطبيق الخاص بك." />
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>معلومات المتجر</CardTitle>
            <CardDescription>تحديث تفاصيل المقهى أو المطعم الخاص بك.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">اسم المتجر</Label>
                <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="storeAddress">العنوان</Label>
                <Input id="storeAddress" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="storeContact">هاتف الاتصال</Label>
              <Input id="storeContact" value={storeContactPhone} onChange={(e) => setStoreContactPhone(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={handleSaveStoreInfo} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="h-4 w-4 me-2"/> حفظ معلومات المتجر
            </Button>
          </CardContent>
        </Card>

        <Separator />

         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>إعدادات الضريبة والخصم</CardTitle>
            <CardDescription>تكوين ضريبة القيمة المضافة والخصومات العامة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableVat" className="flex flex-col space-y-1">
                  <span>تفعيل ضريبة القيمة المضافة</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    تطبيق ضريبة القيمة المضافة على الفواتير.
                  </span>
                </Label>
                <Switch
                  id="enableVat"
                  checked={isVatEnabled}
                  onCheckedChange={setIsVatEnabled}
                />
              </div>
              {isVatEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <Label htmlFor="vatPercentage">نسبة الضريبة (%)</Label>
                    <div className="relative mt-1">
                       <Percent className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                        id="vatPercentage"
                        type="number"
                        value={vatPercentage}
                        onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                        className="pe-10 rtl:ps-10 rtl:pe-3"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Separator/>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                <Label htmlFor="enableGlobalDiscount" className="flex flex-col space-y-1">
                  <span>تفعيل الخصم العام</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    تطبيق خصم عام على إجمالي الفاتورة (قبل الضريبة).
                  </span>
                </Label>
                <Switch
                  id="enableGlobalDiscount"
                  checked={isGlobalDiscountEnabled}
                  onCheckedChange={setIsGlobalDiscountEnabled}
                />
              </div>
              {isGlobalDiscountEnabled && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <Label htmlFor="globalDiscountPercentage">نسبة الخصم العام (%)</Label>
                     <div className="relative mt-1">
                       <Tag className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                        id="globalDiscountPercentage"
                        type="number"
                        value={globalDiscountPercentage}
                        onChange={(e) => setGlobalDiscountPercentage(parseFloat(e.target.value) || 0)}
                        className="pe-10 rtl:ps-10 rtl:pe-3"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleSaveTaxDiscountSettings} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="h-4 w-4 me-2"/> حفظ إعدادات الضريبة والخصم
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>إعدادات الحساب</CardTitle>
            <CardDescription>إدارة تفاصيل حسابك الشخصي.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userName">اسمك</Label>
                  <Input id="userName" defaultValue="المسؤول" className="mt-1" disabled/>
                </div>
                <div>
                  <Label htmlFor="userEmail">البريد الإلكتروني</Label>
                  <Input id="userEmail" type="email" defaultValue="admin@example.com" className="mt-1" disabled/>
                </div>
            </div>
            <div>
              <Label htmlFor="userPassword">تغيير كلمة المرور</Label>
              <Input id="userPassword" type="password" placeholder="كلمة المرور الجديدة" className="mt-1" />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled>تحديث الحساب (قريباً)</Button>
          </CardContent>
        </Card>

         <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>إعدادات الرواتب</CardTitle>
            <CardDescription>إدارة معلومات رواتب الموظفين.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>معلومات هامة</AlertTitle>
              <AlertDescription>
                يتم إدارة رواتب الموظفين وتفاصيلهم من خلال صفحة <Link href="/employees" className="font-semibold text-primary hover:underline">إدارة الموظفين</Link>.
                 هناك يمكنك إضافة موظفين جدد، تعديل بياناتهم بما في ذلك الرواتب، وتواريخ التعيين.
              </AlertDescription>
            </Alert>
             <Button asChild variant="outline">
                <Link href="/employees">
                    الانتقال إلى صفحة الموظفين
                </Link>
            </Button>
          </CardContent>
        </Card>


         <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>إعدادات الطابعة</CardTitle>
            <CardDescription>تكوين طابعات الإيصالات والمطبخ (واجهة مستخدم مبدئية).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <Label htmlFor="receiptPrinter">طابعة الإيصالات</Label>
                <Input id="receiptPrinter" defaultValue="طابعة حرارية (USB)" className="mt-1" disabled/>
            </div>
            <div>
                <Label htmlFor="kitchenPrinter">طابعة المطبخ</Label>
                <Input id="kitchenPrinter" defaultValue="طابعة شبكة (LAN)" className="mt-1" disabled/>
            </div>
            <Button disabled className="bg-primary hover:bg-primary/90 text-primary-foreground">تكوين الطابعات (قريباً)</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    