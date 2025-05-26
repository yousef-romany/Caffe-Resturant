
"use client"; 

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Utensils, Coffee, Cake, ScanLine, Leaf, Sofa, Zap, Smartphone, Star, MessageSquare } from 'lucide-react';
import type { MenuItem, Review } from '@/constants'; 
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';

interface FetchedMenuItem extends MenuItem {
  icon?: LucideIcon; 
}

interface FetchedReview extends Review {
  avatarFallback?: string; 
}


export default function WebsiteLandingPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [featuredItems, setFeaturedItems] = useState<FetchedMenuItem[]>([]);
  const [testimonials, setTestimonials] = useState<FetchedReview[]>([]);
  
  useEffect(() => {
    async function initializeAndLoadData() {
      setIsLoading(true);
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const menuItemsData: any[] = await dbInstance.select(
          "SELECT id, name, category, price, image_url as imageUrl, description, data_ai_hint as dataAiHint, is_available FROM menu_items WHERE is_available = TRUE ORDER BY created_at DESC LIMIT 3"
        );
        setFeaturedItems(menuItemsData.map(item => ({
            ...item, 
            price: Number(item.price),
            icon: item.category === 'مأكولات' ? Utensils : item.category === 'مشروبات' ? Coffee : Cake 
        })));

        const reviewsData: any[] = await dbInstance.select(
          "SELECT id, customer_name as customerName, rating, comment, review_date as reviewDate FROM reviews WHERE is_public = TRUE ORDER BY review_date DESC LIMIT 3"
        );
        setTestimonials(reviewsData.map(review => ({
            ...review,
            rating: Number(review.rating),
            reviewDate: new Date(review.reviewDate), 
            avatarFallback: review.customerName ? review.customerName.substring(0, 2).toUpperCase() : '??'
        })));

      } catch (error) {
        console.error("Error loading data for landing page:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات الصفحة الرئيسية.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    initializeAndLoadData();
  }, [toast]); 

  const whyChooseUsItems = [
    { icon: Leaf, title: "مكونات طازجة", description: "نستخدم أجود المكونات الطازجة يوميًا لضمان أفضل مذاق." },
    { icon: Sofa, title: "أجواء مريحة", description: "استمتع بوقتك في بيئة هادئة ومريحة، مثالية للقاءات أو العمل." },
    { icon: Zap, title: "خدمة سريعة", description: "فريقنا جاهز لخدمتك بسرعة وكفاءة لضمان تجربة سلسة." },
    { icon: Smartphone, title: "طلب سهل عبر الإنترنت", description: "اطلب من طاولتك مباشرة أو للاستلام عبر موقعنا." },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] text-center">
        <Coffee className="h-20 w-20 text-primary animate-pulse mb-4" />
        <p className="text-xl text-muted-foreground">جارٍ تحميل بيانات الكافيه...</p>
      </div>
    );
  }

  return (
    <>
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 bg-gradient-to-br from-primary/10 via-background to-accent/5 text-center overflow-hidden">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm"></div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex justify-center mb-8">
            <Coffee className="h-20 w-20 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            أشهى المأكولات والمشروبات، اطلبها <span className="text-primary">الآن</span>!
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
            تجربة فريدة تنتظرك في كافيه بوس إكسبريس. تصفح قائمتنا الغنية واطلب أونلاين بسهولة وسرعة.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105 duration-300 ease-in-out">
              <Link href="/website/scan-table">
                <ScanLine className="me-2 h-5 w-5" />
                امسح QR الطاولة للطلب
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="shadow-lg transition-transform hover:scale-105 duration-300 ease-in-out">
              <Link href="/website/menu">
                <Utensils className="me-2 h-5 w-5" />
                تصفح القائمة
              </Link>
            </Button>
          </div>
           <p className="mt-8 text-muted-foreground">
            لديك حساب بالفعل؟ <Link href="/website/auth/login" className="text-primary hover:underline font-medium">سجل الدخول</Link>
            <span className="mx-2">أو</span>
            <Link href="/website/auth/register" className="text-primary hover:underline font-medium">أنشئ حسابًا جديدًا</Link>
          </p>
        </div>
      </section>

      {featuredItems.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              أطباقنا المميزة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 group">
                  <div className="overflow-hidden">
                    <NextImage
                      src={item.imageUrl || 'https://placehold.co/600x400.png'}
                      alt={item.name}
                      width={600}
                      height={400}
                      className="w-full h-56 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                      data-ai-hint={item.dataAiHint || "food item"}
                    />
                  </div>
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center mb-1">
                      {item.icon && <item.icon className="h-6 w-6 text-primary me-2 rtl:ms-2 rtl:me-0" />}
                      <CardTitle className="text-xl">{item.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description || item.category}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">لماذا تختارنا؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsItems.map((item, index) => (
              <div key={index} className="text-center p-6 bg-card rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-4">
                  <item.icon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">قالوا عنا</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <div className="relative inline-flex shrink-0 items-center justify-center text-sm font-medium uppercase rounded-full size-12 bg-muted text-muted-foreground me-3 rtl:ms-3 rtl:me-0">
                        {testimonial.avatarFallback}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.customerName}</p>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-muted-foreground italic border-s-4 border-primary ps-4 py-2">
                      "{testimonial.comment || 'تجربة رائعة!'}"
                    </blockquote>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-primary/10">
        <div className="container mx-auto px-4 text-center">
          <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4"/>
          <h2 className="text-3xl font-bold text-foreground mb-6">
            جاهز لتجربة لا تُنسى؟
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            نحن في كافيه بوس إكسبريس نسعى لتقديم أفضل تجربة طعام ومشروبات لعملائنا. جودة عالية، خدمة ممتازة، وأجواء مريحة تنتظرك.
          </p>
          <Button asChild size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105 duration-300 ease-in-out">
            <Link href="/website/menu">اكتشف قائمتنا الكاملة</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

    