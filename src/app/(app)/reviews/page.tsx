
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { type Review } from '@/constants';
import { MessageSquare, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';
import { useToast } from '@/hooks/use-toast';

export default function ReviewsPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadDbAndFetchReviews() {
      try {
        const dbInstance = await getDb;
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        await fetchReviews(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch reviews:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات التقييمات.", variant: "destructive" });
        setIsLoading(false);
      }
    }
    loadDbAndFetchReviews();
  }, [toast]);

  const fetchReviews = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      // Fetch reviews and related data (e.g., customer name if review is linked to customer_id)
      // For now, we'll fetch as per the 'reviews' table structure.
      const fetchedReviews: any[] = await currentDb.select(
        'SELECT id, customer_name as customerName, rating, comment, review_date as reviewDate, order_id as orderId, menu_item_name as menuItemName, is_public FROM reviews ORDER BY review_date DESC'
      );
      setReviews(fetchedReviews.map(review => ({
        ...review,
        rating: Number(review.rating),
        reviewDate: review.reviewDate ? parseISO(review.reviewDate) : new Date(),
        is_public: Boolean(review.is_public),
      })));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات التقييمات.", variant: "destructive" });
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };


  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ms-0.5 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="تقييمات العملاء"
        description="عرض تقييمات وملاحظات العملاء على الخدمة والمنتجات."
        icon={MessageSquare}
      />
      
      <Card className="shadow-lg">
        <CardContent className="p-0">
           {isLoading ? (
            <p className="text-center text-muted-foreground p-10">جارٍ تحميل التقييمات...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead className="text-center">التقييم</TableHead>
                  <TableHead>التعليق</TableHead>
                  <TableHead>المنتج/الطلب</TableHead>
                  <TableHead>تاريخ التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length > 0 ? (
                  reviews.map(review => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.customerName || 'زائر'}</TableCell>
                      <TableCell className="text-center">{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-sm truncate">{review.comment || '-'}</TableCell>
                      <TableCell>
                        {review.menuItemName && <Badge variant="outline" className="me-1 whitespace-nowrap">منتج: {review.menuItemName}</Badge>}
                        {review.orderId && <Badge variant="secondary" className="whitespace-nowrap">طلب: {review.orderId}</Badge>}
                        {!review.menuItemName && !review.orderId && "-"}
                      </TableCell>
                      <TableCell>{format(new Date(review.reviewDate), 'PPpp', { locale: arSA })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      لا توجد تقييمات لعرضها حاليًا.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

    