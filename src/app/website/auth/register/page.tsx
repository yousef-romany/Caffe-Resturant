
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/custom/PageHeader";
import { useToast } from '@/hooks/use-toast';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { format } from 'date-fns';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء ملء جميع الحقول المطلوبة.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمتا المرور غير متطابقتين.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        toast({
            title: "خطأ في البريد الإلكتروني",
            description: "الرجاء إدخال عنوان بريد إلكتروني صالح.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }
    
    // Basic phone validation (e.g., starts with 05 and is 10 digits long for SA numbers)
    if (!/^05\d{8}$/.test(phone)) {
        toast({
            title: "خطأ في رقم الهاتف",
            description: "الرجاء إدخال رقم هاتف سعودي صالح (e.g., 05xxxxxxxx).",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }


    try {
      const db = await getDb();
      if (!db) {
        toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Check if email or phone already exists
      const existingEmailCheck: any[] = await db.select("SELECT id FROM customers WHERE email = $1", [email]);
      if (existingEmailCheck.length > 0) {
        toast({
          title: "خطأ في التسجيل",
          description: "هذا البريد الإلكتروني مسجل بالفعل.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const existingPhoneCheck: any[] = await db.select("SELECT id FROM customers WHERE phone = $1", [phone]);
      if (existingPhoneCheck.length > 0) {
        toast({
          title: "خطأ في التسجيل",
          description: "رقم الهاتف هذا مسجل بالفعل.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const newCustomerId = `cust-${Date.now()}`;
      const joinDate = format(new Date(), 'yyyy-MM-dd');

      // Note: Password is not stored in the 'customers' table in the current schema.
      // A full auth system would require password hashing and a separate users table or adding a hashed_password field.
      await db.execute(
        "INSERT INTO customers (id, name, phone, email, loyalty_points, join_date, total_spent) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [newCustomerId, fullName, phone, email, 0, joinDate, 0]
      );

      toast({
        title: "تم إنشاء الحساب بنجاح!",
        description: "يمكنك الآن تسجيل الدخول.",
        className: "bg-green-500 text-white",
      });
      router.push('/website/auth/login');

    } catch (error) {
      console.error("Error registering customer:", error);
      toast({
        title: "خطأ في التسجيل",
        description: "حدث خطأ أثناء محاولة إنشاء حسابك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="إنشاء حساب عميل جديد" description="انضم إلينا للاستمتاع بتجربة طلب سهلة وسريعة." icon={UserPlus}/>
      <div className="flex justify-center py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>املأ البيانات التالية لإنشاء حسابك.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input id="fullName" placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" type="tel" placeholder="05xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
              </Button>
              <p className="text-sm text-muted-foreground">
                لديك حساب بالفعل؟ <Link href="/website/auth/login" className="text-primary hover:underline">سجل الدخول</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}
