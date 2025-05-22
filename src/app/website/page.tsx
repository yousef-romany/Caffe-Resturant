
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Utensils, Coffee, Cake, ScanLine, UserPlus } from 'lucide-react';

export default function WebsiteLandingPage() {
  const featuredItems = [
    { id: 'feat1', name: 'برجر لحم فاخر', description: 'مكونات طازجة ولحم عالي الجودة.', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'gourmet burger', icon: Utensils },
    { id: 'feat2', name: 'قهوة أرابيكا مميزة', description: 'محمصة بعناية لنكهة لا تُنسى.', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'specialty coffee', icon: Coffee },
    { id: 'feat3', name: 'تشيز كيك فراولة', description: 'مزيج مثالي من الحلاوة والانتعاش.', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'strawberry cheesecake', icon: Cake },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background text-center">
        <div className="absolute inset-0 bg-background/30 backdrop-blur-sm"></div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex justify-center mb-6">
            <Coffee className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            أشهى المأكولات والمشروبات، اطلبها <span className="text-primary">الآن</span>!
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
            تجربة فريدة تنتظرك في كافيه بوس إكسبريس. تصفح قائمتنا واطلب أونلاين بسهولة.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
              <Link href="/website/scan-table">
                <ScanLine className="me-2 h-5 w-5" />
                امسح QR الطاولة للطلب
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="shadow-lg transition-transform hover:scale-105">
              <Link href="/website/auth/register">
                <UserPlus className="me-2 h-5 w-5" />
                إنشاء حساب جديد
              </Link>
            </Button>
          </div>
           <p className="mt-6 text-muted-foreground">
            لديك حساب بالفعل؟ <Link href="/website/auth/login" className="text-primary hover:underline">سجل الدخول</Link>
          </p>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="py-16 bg-secondary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            أطباقنا المميزة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
                <NextImage
                  src={item.imageUrl}
                  alt={item.name}
                  width={600}
                  height={400}
                  className="w-full h-56 object-cover"
                  data-ai-hint={item.dataAiHint}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-center mb-2">
                    <item.icon className="h-6 w-6 text-primary me-2 rtl:ms-2 rtl:me-0" />
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action / About Us Snippet */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            جاهز لتجربة لا تُنسى؟
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            نحن في كافيه بوس إكسبريس نسعى لتقديم أفضل تجربة طعام ومشروبات لعملائنا. جودة عالية، خدمة ممتازة، وأجواء مريحة.
          </p>
          <Button asChild size="lg" variant="secondary" className="shadow-lg transition-transform hover:scale-105">
            <Link href="/website/contact">تواصل معنا أو قم بزيارتنا (قريباً)</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
