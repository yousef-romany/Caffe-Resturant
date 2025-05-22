
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { CalendarClock, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DUMMY_ATTENDANCE_RECORDS, DUMMY_EMPLOYEES, type AttendanceRecord, type Employee } from '@/constants';
import { format, differenceInHours, differenceInMinutes, startOfDay, isToday } from 'date-fns';
import { arSA } from 'date-fns/locale';

// For simplicity, let's assume a currently logged-in employee
const CURRENT_EMPLOYEE_ID = 'emp3'; // محمد عبدالله

export default function AttendancePage() {
  const { toast } = useToast();
  const [employeeName, setEmployeeName] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(DUMMY_ATTENDANCE_RECORDS);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [activeClockInId, setActiveClockInId] = useState<string | null>(null);

  useEffect(() => {
    const currentEmployee = DUMMY_EMPLOYEES.find(emp => emp.id === CURRENT_EMPLOYEE_ID);
    if (currentEmployee) {
      setEmployeeName(currentEmployee.name);
    }

    const employeeRecords = attendanceRecords.filter(
      (record) => record.employeeId === CURRENT_EMPLOYEE_ID
    );

    const todayRecords = employeeRecords.filter((record) =>
      isToday(new Date(record.attendanceDate))
    );
    setTodayAttendance(todayRecords.sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime()));

    const lastRecordToday = todayRecords.length > 0 ? todayRecords[0] : null;

    if (lastRecordToday && lastRecordToday.clockInTime && !lastRecordToday.clockOutTime) {
      setIsClockedIn(true);
      setActiveClockInId(lastRecordToday.id);
    } else {
      setIsClockedIn(false);
      setActiveClockInId(null);
    }
  }, [attendanceRecords]);

  const formatWorkDuration = (clockIn: Date, clockOut?: Date): string => {
    if (!clockOut) return '-';
    const totalMinutes = differenceInMinutes(clockOut, clockIn);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} س ${minutes} د`;
  };

  const handleClockIn = () => {
    if (isClockedIn) {
      toast({
        title: "خطأ",
        description: "أنت مسجل حضور بالفعل.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: CURRENT_EMPLOYEE_ID,
      clockInTime: now,
      attendanceDate: startOfDay(now),
    };

    // Update the dummy data array (simulating backend update)
    DUMMY_ATTENDANCE_RECORDS.unshift(newRecord);
    setAttendanceRecords([...DUMMY_ATTENDANCE_RECORDS]); // Trigger re-render

    setIsClockedIn(true);
    setActiveClockInId(newRecord.id);
    toast({
      title: "تم تسجيل الحضور بنجاح",
      description: `وقت الحضور: ${format(now, 'p', { locale: arSA })}`,
      className: "bg-green-500 text-white",
    });
  };

  const handleClockOut = () => {
    if (!isClockedIn || !activeClockInId) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الحضور أولاً.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const recordIndex = DUMMY_ATTENDANCE_RECORDS.findIndex(r => r.id === activeClockInId);

    if (recordIndex !== -1) {
      const recordToUpdate = DUMMY_ATTENDANCE_RECORDS[recordIndex];
      recordToUpdate.clockOutTime = now;
      const durationHours = differenceInHours(now, new Date(recordToUpdate.clockInTime));
      const durationMinutes = differenceInMinutes(now, new Date(recordToUpdate.clockInTime)) % 60;
      recordToUpdate.workDurationHours = parseFloat(`${durationHours}.${durationMinutes}`);


      DUMMY_ATTENDANCE_RECORDS[recordIndex] = recordToUpdate;
      setAttendanceRecords([...DUMMY_ATTENDANCE_RECORDS]); // Trigger re-render

      setIsClockedIn(false);
      setActiveClockInId(null);
      toast({
        title: "تم تسجيل الانصراف بنجاح",
        description: `وقت الانصراف: ${format(now, 'p', { locale: arSA })}. مدة العمل: ${formatWorkDuration(new Date(recordToUpdate.clockInTime), now)}.`,
        className: "bg-red-500 text-white",
      });
    } else {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على سجل الحضور النشط.",
        variant: "destructive",
      });
    }
  };

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
