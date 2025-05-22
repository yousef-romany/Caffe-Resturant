
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/custom/PageHeader";

export default function CustomerRegisterPage() {
  return (
    <>
       <PageHeader title="إنشاء حساب عميل جديد" description="انضم إلينا للاستمتاع بتجربة طلب سهلة وسريعة." icon={UserPlus}/>
      <div className="flex justify-center py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>املأ البيانات التالية لإنشاء حسابك.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input id="fullName" placeholder="الاسم الكامل" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" type="tel" placeholder="رقم الهاتف" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input id="confirmPassword" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">إنشاء الحساب</Button>
             <p className="text-sm text-muted-foreground">
              لديك حساب بالفعل؟ <Link href="/website/auth/login" className="text-primary hover:underline">سجل الدخول</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
