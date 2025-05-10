
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
import { DUMMY_EMPLOYEES, EMPLOYEE_ROLES, type Employee, type EmployeeRole } from '@/constants';
import { PlusCircle, Edit, Trash2, UsersRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

const initialNewEmployeeState: Omit<Employee, 'id' | 'hireDate'> & { hireDate: string } = {
  name: '',
  role: EMPLOYEE_ROLES[0],
  phone: '',
  email: '',
  salary: undefined,
  hireDate: new Date().toISOString().split('T')[0], // Default to today
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployeeData, setNewEmployeeData] = useState(initialNewEmployeeState);
  const { toast } = useToast();

  useEffect(() => {
    setEmployees(DUMMY_EMPLOYEES);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'salary' ? parseFloat(value) : value;
    setNewEmployeeData(prev => ({ ...prev, [name]: name === 'salary' && value === '' ? undefined : numValue }));
  };

  const handleRoleChange = (value: string) => {
    setNewEmployeeData(prev => ({ ...prev, role: value as EmployeeRole }));
  };

  const handleSubmit = () => {
    if (!newEmployeeData.name || !newEmployeeData.phone || !newEmployeeData.hireDate) {
      toast({ title: "خطأ", description: "الاسم، الهاتف، وتاريخ التعيين مطلوبون.", variant: "destructive" });
      return;
    }

    const employeeDataToSave: Omit<Employee, 'id'> = {
      ...newEmployeeData,
      salary: newEmployeeData.salary ? Number(newEmployeeData.salary) : undefined,
      hireDate: new Date(newEmployeeData.hireDate), // Convert string date to Date object
    };

    if (editingEmployee) {
      const updatedEmployee = { ...editingEmployee, ...employeeDataToSave };
      setEmployees(employees.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp));
      DUMMY_EMPLOYEES[DUMMY_EMPLOYEES.findIndex(e => e.id === editingEmployee.id)] = updatedEmployee; // Update dummy data
      toast({ title: "نجاح", description: `تم تحديث بيانات ${updatedEmployee.name}.` });
    } else {
      const newEmployeeWithId: Employee = {
        ...employeeDataToSave,
        id: `emp-${Date.now()}`,
      };
      setEmployees([newEmployeeWithId, ...employees]);
      DUMMY_EMPLOYEES.unshift(newEmployeeWithId); // Update dummy data
      toast({ title: "نجاح", description: `تمت إضافة الموظف ${newEmployeeWithId.name}.` });
    }
    setIsDialogOpen(false);
    setEditingEmployee(null);
    setNewEmployeeData(initialNewEmployeeState);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployeeData({
      ...employee,
      hireDate: format(new Date(employee.hireDate), 'yyyy-MM-dd'), // Format Date to string for input
      salary: employee.salary ?? undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEmployee = (employeeToDelete: Employee) => {
    // Add confirmation dialog in real app
    setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
    DUMMY_EMPLOYEES = DUMMY_EMPLOYEES.filter(e => e.id !== employeeToDelete.id); // Update dummy data
    toast({ title: "نجاح", description: `تم حذف ${employeeToDelete.name}.`, variant: "destructive" });
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
