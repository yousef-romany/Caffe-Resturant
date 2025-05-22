
"use client";

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Camera, QrCode, AlertTriangle } from 'lucide-react';
import { DUMMY_ATTENDANCE_RECORDS, DUMMY_EMPLOYEES, type AttendanceRecord, type Employee } from '@/constants';
import { format, differenceInHours, differenceInMinutes, startOfDay, isToday } from 'date-fns';
import { arSA } from 'date-fns/locale';

export default function EmployeeQrAttendancePage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  
  // Assume current employee ID is fetched from auth context in a real app
  // For simulation, using 'emp3' (محمد عبدالله) from DUMMY_EMPLOYEES
  const CURRENT_EMPLOYEE_ID = 'emp3'; 

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
    if (!data) return;

    setScannedData(data);
    setIsScanning(false);

    const currentEmployee = DUMMY_EMPLOYEES.find(emp => emp.id === CURRENT_EMPLOYEE_ID);
    if (!currentEmployee) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على الموظف الحالي.' });
      return;
    }
    const employeeName = currentEmployee.name;

    // Basic parsing for the simulated data string
    // Example: "employee_attendance_action:clock_in,location:main_entry,timestamp:162987612345"
    const actionPart = data.split(',').find(part => part.startsWith('employee_attendance_action:'));
    const actionType = actionPart ? actionPart.split(':')[1] : null;

    const now = new Date();
    const todayRecords = DUMMY_ATTENDANCE_RECORDS.filter(
      (record) => record.employeeId === CURRENT_EMPLOYEE_ID && isToday(new Date(record.attendanceDate))
    ).sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime());
    
    const lastRecordToday = todayRecords.length > 0 ? todayRecords[0] : null;

    if (actionType === 'clock_in') {
      if (lastRecordToday && !lastRecordToday.clockOutTime) {
        toast({
          title: "خطأ",
          description: `يا ${employeeName}، أنت مسجل حضور بالفعل اليوم ولم تسجل انصرافًا.`,
          variant: "destructive",
        });
        return;
      }

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: CURRENT_EMPLOYEE_ID,
        clockInTime: now,
        attendanceDate: startOfDay(now),
      };
      DUMMY_ATTENDANCE_RECORDS.unshift(newRecord);
      toast({
        title: "تم تسجيل الحضور بنجاح",
        description: `مرحباً بك يا ${employeeName}! وقت الحضور: ${format(now, 'p', { locale: arSA })}`,
        className: "bg-green-500 text-white",
      });

    } else if (actionType === 'clock_out') {
      if (!lastRecordToday || lastRecordToday.clockOutTime) {
        toast({
          title: "خطأ",
          description: `يا ${employeeName}، يجب تسجيل الحضور أولاً اليوم أو أنك سجلت انصرافًا بالفعل.`,
          variant: "destructive",
        });
        return;
      }

      const recordIndex = DUMMY_ATTENDANCE_RECORDS.findIndex(r => r.id === lastRecordToday.id);
      if (recordIndex !== -1) {
        const recordToUpdate = DUMMY_ATTENDANCE_RECORDS[recordIndex];
        recordToUpdate.clockOutTime = now;
        const durationHours = differenceInHours(now, new Date(recordToUpdate.clockInTime));
        const durationMinutes = differenceInMinutes(now, new Date(recordToUpdate.clockInTime)) % 60;
        recordToUpdate.workDurationHours = parseFloat(`${durationHours}.${String(durationMinutes).padStart(2, '0')}`);
        
        DUMMY_ATTENDANCE_RECORDS[recordIndex] = recordToUpdate;
        
        const formatWorkDuration = (clockIn: Date, clockOut?: Date): string => {
          if (!clockOut) return '-';
          const totalMinutesVal = differenceInMinutes(clockOut, clockIn);
          const hoursVal = Math.floor(totalMinutesVal / 60);
          const minutesVal = totalMinutesVal % 60;
          return `${hoursVal} س ${minutesVal} د`;
        };

        toast({
          title: "تم تسجيل الانصراف بنجاح",
          description: `إلى اللقاء يا ${employeeName}! وقت الانصراف: ${format(now, 'p', { locale: arSA })}. مدة العمل: ${formatWorkDuration(new Date(recordToUpdate.clockInTime), now)}.`,
          className: "bg-red-500 text-white",
        });
      } else {
         toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على سجل الحضور النشط.' });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'بيانات QR غير صالحة',
        description: 'لا يمكن التعرف على الإجراء من رمز QR الممسوح.',
      });
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
            <AlertTitle>تم التعامل مع المسح!</AlertTitle>
            <AlertDescription>
              سيتم عرض رسالة تأكيد بالحالة (حضور/انصراف).
              <br/>
              البيانات المستلمة من الـQR: <strong>{scannedData}</strong>
            </AlertDescription>
             <Button onClick={() => { setScannedData(null); setIsScanning(true);}} className="mt-4">مسح رمز آخر</Button>
          </Alert>
        )}
      </div>
    </>
  );
}

