
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
import { Info, Percent, Tag } from 'lucide-react'; // Added Percent, Tag
import Link from 'next/link';
import { DEFAULT_VAT_PERCENTAGE } from '@/constants'; // Import default VAT

export default function SettingsPage() {
  // State for Tax and Discount settings
  // In a real app, these would be fetched from a backend/localStorage
  const [isVatEnabled, setIsVatEnabled] = useState(true);
  const [vatPercentage, setVatPercentage] = useState(DEFAULT_VAT_PERCENTAGE);
  const [isGlobalDiscountEnabled, setIsGlobalDiscountEnabled] = useState(false);
  const [globalDiscountPercentage, setGlobalDiscountPercentage] = useState(0);

  const handleSaveTaxDiscountSettings = () => {
    // In a real app, save these settings to backend/localStorage
    console.log({ isVatEnabled, vatPercentage, isGlobalDiscountEnabled, globalDiscountPercentage });
    alert("تم حفظ إعدادات الضريبة والخصم (تجريبي).");
  };

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
                <Input id="storeName" defaultValue="كافيه بوس إكسبريس" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="storeAddress">العنوان</Label>
                <Input id="storeAddress" defaultValue="123 الشارع الرئيسي, أي مدينة" className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="storeContact">هاتف الاتصال</Label>
              <Input id="storeContact" defaultValue="+1 (555) 123-4567" className="mt-1" />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ معلومات المتجر</Button>
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
            <Button onClick={handleSaveTaxDiscountSettings} className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ إعدادات الضريبة والخصم</Button>
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
                  <Input id="userName" defaultValue="المسؤول" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="userEmail">البريد الإلكتروني</Label>
                  <Input id="userEmail" type="email" defaultValue="admin@example.com" className="mt-1" />
                </div>
            </div>
            <div>
              <Label htmlFor="userPassword">تغيير كلمة المرور</Label>
              <Input id="userPassword" type="password" placeholder="كلمة المرور الجديدة" className="mt-1" />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">تحديث الحساب</Button>
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
            <Button disabled className="bg-primary hover:bg-primary/90 text-primary-foreground">تكوين الطابعات</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
