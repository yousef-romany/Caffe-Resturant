
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/custom/PageHeader';
import { Coffee, ScanLine, UserPlus } from 'lucide-react';

export default function WebsiteCaffeLandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] text-center">
      <PageHeader
        title="أهلاً بك في كافيه الزبائن"
        description="اطلب أشهى المأكولات والمشروبات مباشرة من طاولتك أو لتأخذها معك."
        icon={Coffee}
      />
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
          <Link href="/websiteCaffe/scan-table">
            <ScanLine className="me-2 h-5 w-5" />
            امسح QR الطاولة للطلب
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="shadow-lg">
          <Link href="/websiteCaffe/auth/register">
            <UserPlus className="me-2 h-5 w-5" />
            إنشاء حساب جديد
          </Link>
        </Button>
      </div>
      <p className="mt-6 text-muted-foreground">
        لديك حساب بالفعل؟ <Link href="/websiteCaffe/auth/login" className="text-primary hover:underline">سجل الدخول</Link>
      </p>
    </div>
  );
}
