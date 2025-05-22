
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCog, PlusCircle, Edit, ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { DUMMY_SYSTEM_USERS, DUMMY_ROLES, type SystemUser, type Role as AppRole } from '@/constants'; // Renamed Role to AppRole to avoid conflict

// Placeholder for future imports:
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function UserManagementPage() {
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const { toast } = useToast();
  // const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  // const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  // const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  // const [editingRole, setEditingRole] = useState<AppRole | null>(null);

  useEffect(() => {
    setSystemUsers(DUMMY_SYSTEM_USERS);
    setRoles(DUMMY_ROLES);
  }, []);

  const handleToggleUserActive = (userId: string) => {
    // Placeholder: In a real app, this would update the backend and then refresh state.
    setSystemUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    );
    const user = systemUsers.find(u => u.id === userId);
    toast({
      title: `تم تغيير حالة المستخدم ${user?.username}`,
      description: `أصبح المستخدم ${user?.isActive ? 'غير نشط' : 'نشط'}.`,
    });
  };
  
  const getRoleNameById = (roleId: string): string => {
    const role = DUMMY_ROLES.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }

  return (
    <>
      <PageHeader
        title="إدارة المستخدمين والصلاحيات"
        description="إدارة حسابات مستخدمي النظام وأدوارهم وصلاحياتهم."
        icon={UserCog}
        actions={
          <div className="flex gap-2">
            <Button /*onClick={() => setIsUserDialogOpen(true)}*/ className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="h-5 w-5 me-2" /> إضافة مستخدم جديد
            </Button>
            <Button /*onClick={() => setIsRoleDialogOpen(true)}*/ variant="outline">
              <ShieldCheck className="h-5 w-5 me-2" /> إضافة دور جديد
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>قائمة المستخدمين</CardTitle>
            <CardDescription>عرض وتعديل مستخدمي النظام.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>الأدوار</TableHead>
                  <TableHead className="text-center">نشط</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemUsers.length > 0 ? (
                  systemUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.fullName || '-'}</TableCell>
                      <TableCell>
                        {user.roles.map(roleId => (
                          <Badge key={roleId} variant="secondary" className="me-1 whitespace-nowrap">
                            {getRoleNameById(roleId)}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggleUserActive(user.id)} 
                          aria-label={`تنشيط المستخدم ${user.username}`}
                        />
                      </TableCell>
                      <TableCell className="text-center space-x-2 space-x-reverse">
                        <Button variant="ghost" size="icon" onClick={() => toast({ title: "ميزة التعديل قيد التطوير" })}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {/* Activate/Deactivate button replaced by Switch */}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      لا يوجد مستخدمون في النظام.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>الأدوار والصلاحيات</CardTitle>
            <CardDescription>عرض وتعديل الأدوار وصلاحيات كل دور.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>اسم الدور</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>الصلاحيات (مثال)</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.length > 0 ? (
                        roles.map(role => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium">{role.name}</TableCell>
                                <TableCell>{role.description || '-'}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {role.permissions.slice(0, 3).join(', ')}{role.permissions.length > 3 ? '...' : ''}
                                </TableCell>
                                <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => toast({ title: "ميزة تعديل الصلاحيات قيد التطوير" })}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                لا توجد أدوار معرفة في النظام.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for User Dialog */}
      {/* <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
          </DialogHeader>
          <p>نموذج إضافة/تعديل المستخدم هنا.</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
            <Button>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Placeholder for Role Dialog */}
      {/* <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "تعديل دور" : "إضافة دور جديد"}</DialogTitle>
          </DialogHeader>
          <p>نموذج إضافة/تعديل الدور والصلاحيات هنا.</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
            <Button>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </>
  );
}

