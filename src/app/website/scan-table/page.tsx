
"use client";

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, QrCode, AlertTriangle } from 'lucide-react';
// Placeholder for QR scanning library if needed in future
// import { QrReader } from 'react-qr-reader'; 

export default function ScanTableQrPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported.');
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'الكاميرا غير مدعومة',
          description: 'متصفحك لا يدعم الوصول إلى الكاميرا.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'تم رفض الوصول إلى الكاميرا',
          description: 'يرجى تمكين صلاحيات الكاميرا في متصفحك لاستخدام هذه الميزة.',
        });
      }
    };

    if (isScanning) {
        getCameraPermission();
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
    
    // Cleanup function to stop camera when component unmounts or isScanning becomes false
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isScanning, toast]);

  const handleScanSuccess = (data: string | null) => {
    if (data) {
      setScannedData(data);
      setIsScanning(false);
      toast({
        title: 'تم مسح الـ QR بنجاح!',
        description: `بيانات الطاولة: ${data}. جاري توجيهك...`, // Placeholder for actual redirection
      });
      // Here you would typically parse the data and navigate to the order page for that table
      // e.g., router.push(`/website/order?tableId=${data}`);
    }
  };

  const handleScanError = (error: any) => {
    console.error('QR Scan Error:', error);
    toast({
      variant: 'destructive',
      title: 'خطأ في مسح الـ QR',
      description: 'لم نتمكن من قراءة الرمز. يرجى المحاولة مرة أخرى.',
    });
  };

  if (hasCameraPermission === false && isScanning) {
    return (
      <>
        <PageHeader title="مسح QR الطاولة" description="قم بتوجيه الكاميرا نحو رمز QR الموجود على طاولتك." icon={QrCode} />
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>الوصول إلى الكاميرا مطلوب</AlertTitle>
          <AlertDescription>
            يرجى تمكين صلاحيات الكاميرا في إعدادات المتصفح الخاص بك لمسح رمز QR.
          </AlertDescription>
        </Alert>
         <Button onClick={() => setIsScanning(false)} variant="outline">إلغاء المسح</Button>
      </>
    );
  }

  return (
    <>
      <PageHeader title="مسح QR الطاولة" description="قم بتوجيه الكاميرا نحو رمز QR الموجود على طاولتك لبدء الطلب." icon={QrCode} />
      
      <div className="flex flex-col items-center gap-6 mt-8">
        {!isScanning && !scannedData && (
             <Button onClick={() => setIsScanning(true)} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Camera className="me-2 h-5 w-5" />
                ابدأ مسح QR الطاولة
            </Button>
        )}

        {isScanning && (
          <div className="w-full max-w-md p-4 border-2 border-dashed border-primary rounded-lg bg-card shadow-lg">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            <p className="text-center text-muted-foreground mt-2">جاري البحث عن رمز QR...</p>
            {/* Placeholder for actual QR reader integration. 
                React-qr-reader or similar would go here, calling handleScanSuccess/Error.
                For now, we'll simulate a scan after a timeout or button press.
            */}
            <Button onClick={() => handleScanSuccess("Table_A101_CafeExpress")} className="w-full mt-4">محاكاة مسح ناجح</Button>
            <Button onClick={() => setIsScanning(false)} variant="outline" className="w-full mt-2">إلغاء المسح</Button>
          </div>
        )}

        {scannedData && (
          <Alert className="max-w-md">
            <QrCode className="h-4 w-4" />
            <AlertTitle>تم المسح بنجاح!</AlertTitle>
            <AlertDescription>
              بيانات الطاولة الممسوحة: <strong>{scannedData}</strong>
              <br />
              في تطبيق حقيقي، سيتم توجيهك الآن لصفحة الطلب الخاصة بهذه الطاولة.
            </AlertDescription>
             <Button onClick={() => { setScannedData(null); setIsScanning(true);}} className="mt-4">مسح رمز آخر</Button>
          </Alert>
        )}
      </div>
    </>
  );
}
