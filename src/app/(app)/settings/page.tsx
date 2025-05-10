import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
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
