
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, AlertTriangle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import type { SystemUser, Role } from '@/constants'; // Assuming these types are defined

interface UserSessionData {
  userId: string;
  username: string;
  fullName?: string;
  roleNames: string[];
  permissionNames: string[];
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!username || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور.");
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال اسم المستخدم وكلمة المرور.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const db = await getDb();
      if (!db) {
        setError("فشل الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى لاحقًا.");
        toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Simulate login: Check if username exists and is active
      // IMPORTANT: In a real app, you MUST hash and verify passwords securely.
      // This is a placeholder and highly insecure for password handling.
      const users: SystemUser[] = await db.select("SELECT id, username, full_name, is_active FROM system_users WHERE username = $1", [username]);

      if (users.length === 0) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة.");
        toast({ title: "فشل تسجيل الدخول", description: "اسم المستخدم أو كلمة المرور غير صحيحة.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const user = users[0];
      if (!user.is_active) {
        setError("هذا الحساب غير نشط. يرجى الاتصال بالمسؤول.");
        toast({ title: "حساب غير نشط", description: "هذا الحساب غير نشط. يرجى الاتصال بالمسؤول.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Fetch user roles
      const userRolesRaw: { role_id: string }[] = await db.select("SELECT role_id FROM user_roles WHERE user_id = $1", [user.id]);
      const roleIds = userRolesRaw.map(ur => ur.role_id);
      
      let roleNames: string[] = [];
      if (roleIds.length > 0) {
        // Constructing a dynamic IN clause is tricky with some SQL drivers' parameterization.
        // For simplicity with tauri-plugin-sql, we'll fetch all roles and filter, or do multiple queries if needed.
        // A more optimized way might be SELECT name FROM roles WHERE id IN (?, ?, ...)
        // For now, let's fetch names for these specific roles.
        const rolesData: Role[] = await db.select(`SELECT id, name FROM roles WHERE id IN (${roleIds.map(id => `'${id}'`).join(',')})`);
        roleNames = rolesData.map(r => r.name);
      }

      // Fetch permissions for these roles
      let permissionNames: string[] = [];
      if (roleIds.length > 0) {
        const permissionsRaw: { name: string }[] = await db.select(
          `SELECT DISTINCT p.name 
           FROM permissions p 
           JOIN role_permissions rp ON p.id = rp.permission_id 
           WHERE rp.role_id IN (${roleIds.map(id => `'${id}'`).join(',')})`
        );
        permissionNames = permissionsRaw.map(p => p.name);
      }
      
      // Store user session info (simplified)
      const sessionData: UserSessionData = {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        roleNames: roleNames,
        permissionNames: permissionNames,
      };
      localStorage.setItem('userSession', JSON.stringify(sessionData));

      toast({
        title: "تم تسجيل الدخول بنجاح!",
        description: `مرحباً بك، ${user.fullName || user.username}!`,
        className: "bg-green-500 text-white",
      });
      router.push('/dashboard');

    } catch (err) {
      console.error("Login error:", err);
      setError("حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      toast({ title: "خطأ", description: "حدث خطأ غير متوقع أثناء تسجيل الدخول.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <LogIn className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0"/>
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="مثال: admin" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
            {/* Placeholder for forgot password or other links if needed later */}
            {/* <p className="text-sm text-muted-foreground text-center">
              <Link href="#" className="text-primary hover:underline">هل نسيت كلمة المرور؟</Link>
            </p> */}
          </CardFooter>
        </form>
      </Card>
      <p className="mt-8 text-xs text-muted-foreground text-center">
        نظام كافيه بوس إكسبريس. &copy; {new Date().getFullYear()}.
        <br />
        تنبيه: هذا نظام تجريبي. لا تستخدم بيانات اعتماد حقيقية.
      </p>
    </main>
  );
}
