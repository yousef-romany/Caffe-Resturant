
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
import { DUMMY_REVIEWS, type Review } from '@/constants';
import { MessageSquare, Star } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Sort reviews by date, newest first
    const sortedReviews = DUMMY_REVIEWS.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
    setReviews(sortedReviews);
  }, []);

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
                    <TableCell className="font-medium">{review.customerName}</TableCell>
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
        </CardContent>
      </Card>
    </>
  );
}
