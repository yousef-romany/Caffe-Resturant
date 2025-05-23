
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { EMPLOYEE_ROLES, type Employee, type EmployeeRole } from '@/constants';
import { PlusCircle, Edit, Trash2, UsersRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';

const initialNewEmployeeState: Omit<Employee, 'id' | 'hireDate'> & { hireDate: string } = {
  name: '',
  role: EMPLOYEE_ROLES[0],
  phone: '',
  email: '',
  salary: undefined,
  hireDate: new Date().toISOString().split('T')[0], // Default to today
};

export default function EmployeesPage() {
  const [db, setDbInstance] = useState<Database | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployeeData, setNewEmployeeData] = useState(initialNewEmployeeState);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDbAndFetchData() {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        await fetchEmployees(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch data:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل بيانات الموظفين.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadDbAndFetchData();
  }, [toast]);

  const fetchEmployees = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const fetchedEmployees: any[] = await currentDb.select('SELECT id, name, role, phone, email, salary, hire_date as hireDate FROM employees ORDER BY name');
      // Ensure hireDate is a Date object, and salary is a number or undefined
      setEmployees(fetchedEmployees.map(emp => ({
        ...emp,
        hireDate: emp.hireDate ? parseISO(emp.hireDate) : new Date(), // parseISO if date string, fallback if needed
        salary: emp.salary !== null && emp.salary !== undefined ? Number(emp.salary) : undefined,
      })));
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات الموظفين.", variant: "destructive" });
      setEmployees([]); // Clear employees on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'salary' ? parseFloat(value) : value;
    setNewEmployeeData(prev => ({ ...prev, [name]: name === 'salary' && value === '' ? undefined : numValue }));
  };

  const handleRoleChange = (value: string) => {
    setNewEmployeeData(prev => ({ ...prev, role: value as EmployeeRole }));
  };

  const handleSubmit = async () => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    if (!newEmployeeData.name || !newEmployeeData.phone || !newEmployeeData.hireDate) {
      toast({ title: "خطأ", description: "الاسم، الهاتف، وتاريخ التعيين مطلوبون.", variant: "destructive" });
      return;
    }

    const employeeDataToSave = {
      name: newEmployeeData.name,
      role: newEmployeeData.role,
      phone: newEmployeeData.phone,
      email: newEmployeeData.email || null, // Ensure NULL for empty email
      salary: newEmployeeData.salary ? Number(newEmployeeData.salary) : null, // Ensure NULL for empty salary
      hire_date: format(new Date(newEmployeeData.hireDate), 'yyyy-MM-dd'), // Format for DB
    };

    try {
      if (editingEmployee) {
        await db.execute(
          'UPDATE employees SET name = $1, role = $2, phone = $3, email = $4, salary = $5, hire_date = $6 WHERE id = $7',
          [employeeDataToSave.name, employeeDataToSave.role, employeeDataToSave.phone, employeeDataToSave.email, employeeDataToSave.salary, employeeDataToSave.hire_date, editingEmployee.id]
        );
        toast({ title: "نجاح", description: `تم تحديث بيانات ${employeeDataToSave.name}.` });
      } else {
        const newEmployeeId = `emp-${Date.now()}`;
        await db.execute(
          'INSERT INTO employees (id, name, role, phone, email, salary, hire_date, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, true)',
          [newEmployeeId, employeeDataToSave.name, employeeDataToSave.role, employeeDataToSave.phone, employeeDataToSave.email, employeeDataToSave.salary, employeeDataToSave.hire_date]
        );
        toast({ title: "نجاح", description: `تمت إضافة الموظف ${employeeDataToSave.name}.` });
      }
      setIsDialogOpen(false);
      setEditingEmployee(null);
      setNewEmployeeData(initialNewEmployeeState);
      await fetchEmployees(db); // Refresh data
    } catch (error) {
      console.error("Error submitting employee:", error);
      toast({ title: "خطأ في الحفظ", description: "فشل حفظ بيانات الموظف.", variant: "destructive" });
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployeeData({
      ...employee,
      hireDate: format(new Date(employee.hireDate), 'yyyy-MM-dd'), // Format Date to string for input
      salary: employee.salary ?? undefined,
      email: employee.email || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEmployee = async (employeeToDelete: Employee) => {
    if (!db) {
      toast({ title: "خطأ", description: "قاعدة البيانات غير متاحة.", variant: "destructive" });
      return;
    }
    // Consider adding a confirmation dialog here in a real app
    try {
      await db.execute('DELETE FROM employees WHERE id = $1', [employeeToDelete.id]);
      toast({ title: "نجاح", description: `تم حذف ${employeeToDelete.name}.`, variant: "destructive" });
      await fetchEmployees(db); // Refresh data
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({ title: "خطأ في الحذف", description: "فشل حذف الموظف.", variant: "destructive" });
    }
  };
  
  const openNewEmployeeDialog = () => {
    setEditingEmployee(null);
    setNewEmployeeData(initialNewEmployeeState);
    setIsDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="إدارة الموظفين"
        description="إضافة وتعديل وحذف بيانات الموظفين."
        icon={UsersRound}
        actions={
          <Button onClick={openNewEmployeeDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 me-2" /> إضافة موظف جديد
          </Button>
        }
      />
      
      <Card className="shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center text-muted-foreground p-10">جارٍ تحميل بيانات الموظفين...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الوظيفة</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead className="text-center">الراتب ($)</TableHead>
                  <TableHead>تاريخ التعيين</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length > 0 ? (
                  employees.map(employee => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.email || '-'}</TableCell>
                      <TableCell className="text-center">{employee.salary ? `$${employee.salary.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>{format(new Date(employee.hireDate), 'PP', { locale: arSA })}</TableCell>
                      <TableCell className="text-center space-x-2 space-x-reverse">
                        <Button variant="ghost" size="icon" onClick={() => handleEditEmployee(employee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployee(employee)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      لا يوجد موظفون مسجلون بعد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'قم بتحديث تفاصيل هذا الموظف.' : 'املأ تفاصيل الموظف الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto ps-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-left">الاسم</Label>
              <Input id="name" name="name" value={newEmployeeData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-left">الوظيفة</Label>
              <Select name="role" value={newEmployeeData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر الوظيفة" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_ROLES.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-left">الهاتف</Label>
              <Input id="phone" name="phone" type="tel" value={newEmployeeData.phone} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-left">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" value={newEmployeeData.email || ''} onChange={handleInputChange} className="col-span-3" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salary" className="text-left">الراتب ($)</Label>
              <Input id="salary" name="salary" type="number" value={newEmployeeData.salary ?? ''} onChange={handleInputChange} className="col-span-3" min="0" step="0.01" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hireDate" className="text-left">تاريخ التعيين</Label>
              <Input id="hireDate" name="hireDate" type="date" value={newEmployeeData.hireDate} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {editingEmployee ? 'حفظ التغييرات' : 'إضافة موظف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    