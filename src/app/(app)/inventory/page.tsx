
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package, Users, ShoppingBasket, ListChecks } from 'lucide-react'; // Added ListChecks for Purchase Orders

export default function InventoryPage() {
  return (
    <>
      <PageHeader 
        title="إدارة المخزون" 
        description="نظرة عامة على مكوناتك ومورديك وعمليات الشراء." 
        icon={Package}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBasket className="h-8 w-8 text-primary" />
              <CardTitle className="text-xl">إدارة المكونات</CardTitle>
            </div>
            <CardDescription>إضافة وتعديل وتتبع كميات وتكاليف المكونات.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/inventory/ingredients">
                عرض المكونات
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-primary" />
              <CardTitle className="text-xl">إدارة الموردين</CardTitle>
            </div>
            <CardDescription>إدارة قائمة الموردين وتفاصيل الاتصال بهم.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/inventory/suppliers">
                عرض الموردين
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
              <ListChecks className="h-8 w-8 text-primary" />
              <CardTitle className="text-xl">أوامر الشراء</CardTitle>
            </div>
            <CardDescription>إنشاء وتتبع أوامر الشراء من الموردين (قريباً).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/inventory/purchases"> 
                عرض أوامر الشراء
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
