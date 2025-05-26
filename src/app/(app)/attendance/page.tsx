
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { CalendarClock, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AttendanceRecord, Employee } from '@/constants';
import { format, differenceInHours, differenceInMinutes, startOfDay, isToday, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

const CURRENT_EMPLOYEE_ID = 'emp3'; // محمد عبدالله

export default function AttendancePage() {
  const { toast } = useToast();
  const [db, setDbInstance] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [activeClockInId, setActiveClockInId] = useState<string | null>(null);

  useEffect(() => {
    async function initializeAndFetchData() {
      try {
        const dbInstance = await getDb();
        setDbInstance(dbInstance);
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        await fetchEmployeeAndAttendanceData(dbInstance);
      } catch (error) {
        console.error("Error initializing DB or fetching data:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات الحضور.", variant: "destructive" });
        setIsLoading(false);
      }
    }
    initializeAndFetchData();
  }, [toast]); 

  const fetchEmployeeAndAttendanceData = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const employeeResult: Employee[] = await currentDb.select("SELECT name FROM employees WHERE id = ?", [CURRENT_EMPLOYEE_ID]);
      if (employeeResult.length > 0) {
        setEmployeeName(employeeResult[0].name);
      } else {
        setEmployeeName("موظف غير معروف");
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const attendanceResult: any[] = await currentDb.select(
        "SELECT id, clock_in_time, clock_out_time, attendance_date, work_duration_hours FROM employee_attendance WHERE employee_id = ? AND attendance_date = ? ORDER BY clock_in_time DESC",
        [CURRENT_EMPLOYEE_ID, todayStr]
      );
      
      const fetchedRecords: AttendanceRecord[] = attendanceResult.map(r => ({
        id: r.id,
        employeeId: CURRENT_EMPLOYEE_ID,
        clockInTime: parseISO(r.clock_in_time),
        clockOutTime: r.clock_out_time ? parseISO(r.clock_out_time) : undefined,
        attendanceDate: parseISO(r.attendance_date),
        workDurationHours: r.work_duration_hours ? parseFloat(r.work_duration_hours) : undefined,
      }));
      
      setTodayAttendance(fetchedRecords);

      const lastRecordToday = fetchedRecords.length > 0 ? fetchedRecords[0] : null;
      if (lastRecordToday && lastRecordToday.clockInTime && !lastRecordToday.clockOutTime) {
        setIsClockedIn(true);
        setActiveClockInId(lastRecordToday.id);
      } else {
        setIsClockedIn(false);
        setActiveClockInId(null);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات الحضور.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const formatWorkDuration = (clockIn: Date, clockOut?: Date): string => {
    if (!clockOut) return '-';
    const totalMinutes = differenceInMinutes(clockOut, clockIn);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} س ${minutes} د`;
  };

  const handleClockIn = async () => {
    if (!db) {
        toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
        return;
    }
    if (isClockedIn) {
      toast({ title: "خطأ", description: "أنت مسجل حضور بالفعل.", variant: "destructive" });
      return;
    }

    const now = new Date();
    const newRecordId = `att-${Date.now()}`;
    const attendanceDateStr = format(startOfDay(now), 'yyyy-MM-dd');
    const clockInTimeStr = now.toISOString();

    try {
      await db.execute(
        "INSERT INTO employee_attendance (id, employee_id, clock_in_time, attendance_date) VALUES (?, ?, ?, ?)",
        [newRecordId, CURRENT_EMPLOYEE_ID, clockInTimeStr, attendanceDateStr]
      );
      
      setIsClockedIn(true);
      setActiveClockInId(newRecordId);
      toast({
        title: "تم تسجيل الحضور بنجاح",
        description: `وقت الحضور: ${format(now, 'p', { locale: arSA })}`,
        className: "bg-green-500 text-white",
      });
      if (db) await fetchEmployeeAndAttendanceData(db); 
    } catch (error) {
        console.error("Error clocking in:", error);
        toast({ title: "خطأ في تسجيل الحضور", description: "فشل حفظ سجل الحضور.", variant: "destructive"});
    }
  };

  const handleClockOut = async () => {
    if (!db) {
        toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
        return;
    }
    if (!isClockedIn || !activeClockInId) {
      toast({ title: "خطأ", description: "يجب تسجيل الحضور أولاً.", variant: "destructive" });
      return;
    }

    const now = new Date();
    const activeRecord = todayAttendance.find(r => r.id === activeClockInId);

    if (activeRecord) {
      const clockInDate = new Date(activeRecord.clockInTime);
      const totalMinutesWorked = differenceInMinutes(now, clockInDate);
      const hoursWorked = Math.floor(totalMinutesWorked / 60);
      const minutesWorked = totalMinutesWorked % 60;
      const workDuration = parseFloat((hoursWorked + (minutesWorked / 60)).toFixed(2));
      const clockOutTimeStr = now.toISOString();

      try {
        await db.execute(
          "UPDATE employee_attendance SET clock_out_time = ?, work_duration_hours = ? WHERE id = ?",
          [clockOutTimeStr, workDuration, activeClockInId]
        );

        setIsClockedIn(false);
        setActiveClockInId(null);
        toast({
          title: "تم تسجيل الانصراف بنجاح",
          description: `وقت الانصراف: ${format(now, 'p', { locale: arSA })}. مدة العمل: ${formatWorkDuration(clockInDate, now)}.`,
          className: "bg-red-500 text-white",
        });
        if (db) await fetchEmployeeAndAttendanceData(db); 
      } catch (error) {
        console.error("Error clocking out:", error);
        toast({ title: "خطأ في تسجيل الانصراف", description: "فشل تحديث سجل الحضور.", variant: "destructive"});
      }
    } else {
      toast({ title: "خطأ", description: "لم يتم العثور على سجل الحضور النشط.", variant: "destructive" });
    }
  };
  
  if (isLoading) {
    return (
      <>
        <PageHeader title="سجل الحضور والانصراف" description="جارٍ تحميل البيانات..." icon={CalendarClock} />
        <p className="text-center p-4">يرجى الانتظار...</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`سجل الحضور والانصراف ${employeeName ? `- ${employeeName}` : ''}`}
        description="تسجيل ومتابعة حضورك وانصرافك اليومي."
        icon={CalendarClock}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleClockIn}
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={isClockedIn}
            >
              <LogIn className="h-5 w-5 me-2" /> تسجيل حضور
            </Button>
            <Button
              onClick={handleClockOut}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={!isClockedIn}
            >
              <LogOut className="h-5 w-5 me-2" /> تسجيل انصراف
            </Button>
          </div>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>سجلات الحضور لليوم ({format(new Date(), 'eeee, d MMMM yyyy', {locale: arSA})})</CardTitle>
          <CardDescription>عرض سجلات حضورك وانصرافك لهذا اليوم.</CardDescription>
        </CardHeader>
        <CardContent>
          {todayAttendance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاريخ اليوم</TableHead>
                  <TableHead>وقت الحضور</TableHead>
                  <TableHead>وقت الانصراف</TableHead>
                  <TableHead>مدة العمل</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.attendanceDate), 'PP', { locale: arSA })}</TableCell>
                    <TableCell>{format(new Date(record.clockInTime), 'p', { locale: arSA })}</TableCell>
                    <TableCell>
                      {record.clockOutTime ? format(new Date(record.clockOutTime), 'p', { locale: arSA }) : <Badge variant="outline">قيد الدوام</Badge>}
                    </TableCell>
                    <TableCell>{formatWorkDuration(new Date(record.clockInTime), record.clockOutTime ? new Date(record.clockOutTime) : undefined)}</TableCell>
                    <TableCell>
                      {record.clockOutTime ? (
                        <Badge variant="default">مكتمل</Badge>
                      ) : (
                        <Badge variant="secondary">نشط</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد سجلات حضور لهذا اليوم.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

    