
"use client";

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { PageHeader } from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Camera, QrCode, AlertTriangle, Printer, ScanLine } from 'lucide-react';
import type { AttendanceRecord, Employee } from '@/constants';
import { format, differenceInHours, differenceInMinutes, startOfDay, isToday, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

const CURRENT_EMPLOYEE_ID_FOR_QR_GENERATION = 'emp3'; // Used to generate example QR with a known ID

export default function EmployeeQrAttendancePage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedDataInput, setScannedDataInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [db, setDbInstance] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clockInDataString = `employee_attendance_action:clock_in,employee_id:${CURRENT_EMPLOYEE_ID_FOR_QR_GENERATION},location:main_entry`;
  const clockOutDataString = `employee_attendance_action:clock_out,employee_id:${CURRENT_EMPLOYEE_ID_FOR_QR_GENERATION},location:main_exit`;

  const clockInQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(clockInDataString)}`;
  const clockOutQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(clockOutDataString)}`;

  useEffect(() => {
    async function initDb() {
        const dbInstance = await getDb;
        setDbInstance(dbInstance);
        if (!dbInstance) {
            toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
        }
    }
    initDb();
  }, [toast]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported.');
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'الكاميرا غير مدعومة', description: 'متصفحك لا يدعم الوصول إلى الكاميرا.'});
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'تم رفض الوصول إلى الكاميرا', description: 'يرجى تمكين صلاحيات الكاميرا في متصفحك.'});
      }
    };

    if (isScanning) getCameraPermission();
    else if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, toast]);

  const handleProcessQrData = () => {
    if (!scannedDataInput.trim()) {
      toast({ title: "خطأ", description: "الرجاء إدخال بيانات QR.", variant: "destructive" });
      return;
    }
    handleScanSuccess(scannedDataInput.trim());
    // In a real app with a scanner library, handleScanSuccess would be called by the library.
    // For this simulation, we call it directly after user inputs data.
  };

  const handleScanSuccess = async (data: string | null) => {
    if (!data || !db) {
      if (!db) toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setScannedDataInput(''); // Clear input after processing
    setIsScanning(false); // Stop camera simulation

    const parts = data.split(',');
    const actionPart = parts.find(part => part.startsWith('employee_attendance_action:'));
    const employeeIdPart = parts.find(part => part.startsWith('employee_id:'));

    const actionType = actionPart ? actionPart.split(':')[1] : null;
    const employeeIdFromQr = employeeIdPart ? employeeIdPart.split(':')[1] : null;

    if (!employeeIdFromQr) {
      toast({ variant: 'destructive', title: 'بيانات QR غير كاملة', description: 'لم يتم العثور على معرف الموظف في الرمز.' });
      setIsLoading(false);
      return;
    }
    
    let employeeName = "موظف غير معروف";
    try {
        const employeeResult: Employee[] = await db.select("SELECT name FROM employees WHERE id = $1", [employeeIdFromQr]);
        if (employeeResult.length > 0) {
            employeeName = employeeResult[0].name;
        } else {
            toast({ variant: 'destructive', title: 'خطأ في بيانات الموظف', description: `لم يتم العثور على الموظف بالمعرف: ${employeeIdFromQr}.` });
            setIsLoading(false);
            return;
        }
    } catch (error) {
        console.error("Error fetching employee name:", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل جلب بيانات الموظف.' });
        setIsLoading(false);
        return;
    }


    const now = new Date();
    const todayStr = format(startOfDay(now), 'yyyy-MM-dd');
    const clockTimeStr = now.toISOString();

    if (actionType === 'clock_in') {
      const lastRecords: any[] = await db.select(
        "SELECT clock_out_time FROM employee_attendance WHERE employee_id = $1 AND attendance_date = $2 ORDER BY clock_in_time DESC LIMIT 1",
        [employeeIdFromQr, todayStr]
      );
      const lastRecordToday = lastRecords.length > 0 ? lastRecords[0] : null;

      if (lastRecordToday && !lastRecordToday.clock_out_time) {
        toast({
          title: "خطأ في تسجيل الحضور",
          description: `يا ${employeeName}، أنت مسجل حضور بالفعل اليوم ولم تسجل انصرافًا بعد.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const newRecordId = `att-${Date.now()}`;
      try {
        await db.execute(
          "INSERT INTO employee_attendance (id, employee_id, clock_in_time, attendance_date) VALUES ($1, $2, $3, $4)",
          [newRecordId, employeeIdFromQr, clockTimeStr, todayStr]
        );
        toast({
          title: "تم تسجيل الحضور بنجاح",
          description: `مرحباً بك يا ${employeeName}! وقت الحضور: ${format(now, 'p', { locale: arSA })}.`,
          className: "bg-green-500 text-white",
        });
      } catch (error) {
        console.error("Error clocking in via QR:", error);
        toast({ title: "خطأ في تسجيل الحضور", description: "فشل حفظ سجل الحضور.", variant: "destructive"});
      }

    } else if (actionType === 'clock_out') {
      const lastActiveRecords: any[] = await db.select(
        "SELECT id, clock_in_time, clock_out_time FROM employee_attendance WHERE employee_id = $1 AND attendance_date = $2 AND clock_out_time IS NULL ORDER BY clock_in_time DESC LIMIT 1",
        [employeeIdFromQr, todayStr]
      );
      const lastActiveRecord = lastActiveRecords.length > 0 ? lastActiveRecords[0] : null;

      if (!lastActiveRecord) {
        toast({
          title: "خطأ في تسجيل الانصراف",
          description: `يا ${employeeName}، يجب تسجيل الحضور أولاً اليوم أو أنك سجلت انصرافًا بالفعل.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const clockInDate = parseISO(lastActiveRecord.clock_in_time);
      const totalMinutesWorked = differenceInMinutes(now, clockInDate);
      const hoursWorked = Math.floor(totalMinutesWorked / 60);
      const minutesWorked = totalMinutesWorked % 60;
      const workDuration = parseFloat((hoursWorked + (minutesWorked / 60)).toFixed(2));
      
      try {
        await db.execute(
          "UPDATE employee_attendance SET clock_out_time = $1, work_duration_hours = $2 WHERE id = $3",
          [clockTimeStr, workDuration, lastActiveRecord.id]
        );
        const formatWorkDuration = (clockIn: Date, clockOut?: Date): string => {
          if (!clockOut) return '-';
          const totalMinutesVal = differenceInMinutes(clockOut, clockIn);
          const hoursVal = Math.floor(totalMinutesVal / 60);
          const minutesVal = totalMinutesVal % 60;
          return `${hoursVal} س ${minutesVal} د`;
        };
        toast({
          title: "تم تسجيل الانصراف بنجاح",
          description: `إلى اللقاء يا ${employeeName}! وقت الانصراف: ${format(now, 'p', { locale: arSA })}. مدة العمل: ${formatWorkDuration(clockInDate, now)}.`,
          className: "bg-red-500 text-white",
        });
      } catch(error) {
        console.error("Error clocking out via QR:", error);
        toast({ title: "خطأ في تسجيل الانصراف", description: "فشل تحديث سجل الحضور.", variant: "destructive"});
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'بيانات QR غير صالحة',
        description: `لا يمكن التعرف على الإجراء من رمز QR الممسوح. البيانات: ${data}`,
      });
    }
    setIsLoading(false);
  };
  
  const handlePrint = () => window.print();

  if (hasCameraPermission === false && isScanning) {
    return (
      <div className="hide-on-print">
        <PageHeader title="مسح QR للحضور والانصراف" description="وجه الكاميرا نحو رمز QR الخاص بالتحضير." icon={UserCheck} />
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>الوصول إلى الكاميرا مطلوب</AlertTitle>
          <AlertDescription>يرجى تمكين صلاحيات الكاميرا في إعدادات المتصفح.</AlertDescription>
        </Alert>
        <Button onClick={() => setIsScanning(false)} variant="outline">إلغاء المسح</Button>
      </div>
    );
  }

  return (
    <>
      <div className="hide-on-print">
        <PageHeader title="مسح QR للحضور والانصراف" description="وجه الكاميرا نحو رمز QR الخاص بالتحضير لتسجيل حضورك أو انصرافك." icon={UserCheck} />
      
        <div className="flex flex-col items-center gap-6 mt-8">
          {!isScanning && (
            <div className="w-full max-w-md space-y-4">
               <Card>
                <CardHeader>
                    <CardTitle>إدخال بيانات QR يدويًا</CardTitle>
                    <CardDescription>إذا لم يعمل الماسح، يمكنك إدخال البيانات هنا.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <Label htmlFor="qrDataInput">بيانات QR الممسوحة</Label>
                        <Input 
                            id="qrDataInput" 
                            value={scannedDataInput} 
                            onChange={(e) => setScannedDataInput(e.target.value)} 
                            placeholder="مثال: employee_attendance_action:clock_in,employee_id:empX"
                            className="mt-1"
                        />
                    </div>
                    <Button onClick={handleProcessQrData} className="w-full" disabled={isLoading || !db}>
                        <ScanLine className="me-2 h-4 w-4" />
                        {isLoading ? 'جارٍ المعالجة...' : 'معالجة بيانات QR'}
                    </Button>
                </CardContent>
               </Card>
              <Button onClick={() => setIsScanning(true)} size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Camera className="me-2 h-5 w-5" />
                  {hasCameraPermission === null ? 'التحقق من الكاميرا...' : 'ابدأ مسح رمز الحضور بالكاميرا'}
              </Button>
            </div>
          )}

          {isScanning && (
            <div className="w-full max-w-md p-4 border-2 border-dashed border-primary rounded-lg bg-card shadow-lg">
              <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
              <p className="text-center text-muted-foreground mt-2">جاري البحث عن رمز QR...</p>
              <Button onClick={() => setIsScanning(false)} variant="outline" className="w-full mt-2">إلغاء المسح بالكاميرا</Button>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-10 hide-on-print" />

      <div className="printable-qr-section">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl hide-on-print">رموز QR للحضور والانصراف (للطباعة)</CardTitle>
            <CardDescription className="hide-on-print">
              يمكن طباعة هذه الرموز ووضعها في مكان العمل ليقوم الموظفون بمسحها.
              الرمز مولد للموظف: {CURRENT_EMPLOYEE_ID_FOR_QR_GENERATION}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="printable-qr-area">
              <div className="qr-code-item">
                <h3 className="text-lg font-semibold mb-2">QR Code - تسجيل الحضور</h3>
                <NextImage src={clockInQrUrl} alt="QR Code لتسجيل الحضور" width={200} height={200} className="rounded-md border"/>
                <p className="text-xs text-muted-foreground mt-1 break-all">{clockInDataString}</p>
              </div>
              <div className="qr-code-item">
                <h3 className="text-lg font-semibold mb-2">QR Code - تسجيل الانصراف</h3>
                <NextImage src={clockOutQrUrl} alt="QR Code لتسجيل الانصراف" width={200} height={200} className="rounded-md border"/>
                <p className="text-xs text-muted-foreground mt-1 break-all">{clockOutDataString}</p>
              </div>
            </div>
            <div className="mt-8 text-center hide-on-print">
              <Button onClick={handlePrint} size="lg">
                <Printer className="me-2 h-5 w-5" />
                طباعة رموز QR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
