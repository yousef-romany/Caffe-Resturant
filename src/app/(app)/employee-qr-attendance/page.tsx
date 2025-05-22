
"use client";

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Camera, QrCode, AlertTriangle } from 'lucide-react';
// Placeholder for QR scanning library

export default function EmployeeQrAttendancePage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  // Assume current employee ID is fetched from auth context in a real app
  const CURRENT_EMPLOYEE_ID = 'emp_scan_test'; 

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
          description: 'يرجى تمكين صلاحيات الكاميرا في متصفحك.',
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
      // In a real app, parse 'data' (e.g., { action: 'clock_in', location_id: 'main_entrance' })
      // Then, make an API call to record attendance for CURRENT_EMPLOYEE_ID
      toast({
        title: 'تم مسح الـ QR بنجاح!',
        description: `بيانات الحضور المستلمة: ${data}. جاري تسجيل الحركة...`,
        className: "bg-green-500 text-white",
      });
      // Example: if (data.action === 'clock_in') { recordClockIn(CURRENT_EMPLOYEE_ID); }
    }
  };

  if (hasCameraPermission === false && isScanning) {
    return (
      <>
        <PageHeader title="مسح QR للحضور والانصراف" description="وجه الكاميرا نحو رمز QR الخاص بالتحضير." icon={UserCheck} />
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>الوصول إلى الكاميرا مطلوب</AlertTitle>
          <AlertDescription>
            يرجى تمكين صلاحيات الكاميرا في إعدادات المتصفح الخاص بك.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setIsScanning(false)} variant="outline">إلغاء المسح</Button>
      </>
    );
  }

  return (
    <>
      <PageHeader title="مسح QR للحضور والانصراف" description="وجه الكاميرا نحو رمز QR الخاص بالتحضير لتسجيل حضورك أو انصرافك." icon={UserCheck} />
      
      <div className="flex flex-col items-center gap-6 mt-8">
        {!isScanning && !scannedData && (
             <Button onClick={() => setIsScanning(true)} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Camera className="me-2 h-5 w-5" />
                ابدأ مسح رمز الحضور
            </Button>
        )}

        {isScanning && (
          <div className="w-full max-w-md p-4 border-2 border-dashed border-primary rounded-lg bg-card shadow-lg">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            <p className="text-center text-muted-foreground mt-2">جاري البحث عن رمز QR...</p>
            {/* Placeholder for actual QR reader integration */}
            <Button onClick={() => handleScanSuccess(`employee_attendance_action:clock_in,location:main_entry,timestamp:${Date.now()}`)} className="w-full mt-4">
              محاكاة مسح (تسجيل حضور)
            </Button>
             <Button onClick={() => handleScanSuccess(`employee_attendance_action:clock_out,location:main_exit,timestamp:${Date.now()}`)} className="w-full mt-2" variant="secondary">
              محاكاة مسح (تسجيل انصراف)
            </Button>
            <Button onClick={() => setIsScanning(false)} variant="outline" className="w-full mt-2">إلغاء المسح</Button>
          </div>
        )}

        {scannedData && (
          <Alert className="max-w-md">
            <QrCode className="h-4 w-4" />
            <AlertTitle>تم تسجيل الحركة بنجاح!</AlertTitle>
            <AlertDescription>
              البيانات المسجلة: <strong>{scannedData}</strong>
              <br />
              في التطبيق الفعلي، سيتم تأكيد تسجيل حضورك أو انصرافك.
            </AlertDescription>
             <Button onClick={() => { setScannedData(null); setIsScanning(true);}} className="mt-4">مسح رمز آخر</Button>
          </Alert>
        )}
      </div>
    </>
  );
}
