
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/custom/PageHeader";

export default function CustomerLoginPage() {
  return (
    <>
      <PageHeader title="تسجيل دخول العملاء" description="مرحباً بعودتك! سجل دخولك للطلب ومتابعة طلباتك." icon={LogIn}/>
      <div className="flex justify-center py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بريدك الإلكتروني وكلمة المرور للمتابعة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">تسجيل الدخول</Button>
            <p className="text-sm text-muted-foreground">
              ليس لديك حساب؟ <Link href="/websiteCaffe/auth/register" className="text-primary hover:underline">إنشاء حساب جديد</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
