
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCog, PlusCircle, Edit, ShieldCheck, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { DUMMY_SYSTEM_USERS, DUMMY_ROLES, DUMMY_EMPLOYEES, DUMMY_PERMISSIONS_LIST, type SystemUser, type Role as AppRole, type Employee } from '@/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';


const initialNewUserState: Omit<SystemUser, 'id'> & { password?: string } = {
  username: '',
  fullName: '',
  employeeId: '',
  roles: [],
  isActive: true,
  password: '',
};

const initialNewRoleState: Omit<AppRole, 'id'> = {
  name: '',
  description: '',
  permissions: [],
};


export default function UserManagementPage() {
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { toast } = useToast();

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);

  const [newUserData, setNewUserData] = useState(initialNewUserState);
  const [newRoleData, setNewRoleData] = useState(initialNewRoleState);

  const allPermissions = useMemo(() => {
    // In a real app, this would likely come from a dedicated permissions list or endpoint
    const permissionsSet = new Set<string>();
    DUMMY_ROLES.forEach(role => role.permissions.forEach(perm => permissionsSet.add(perm)));
    DUMMY_PERMISSIONS_LIST.forEach(perm => permissionsSet.add(perm)); // Ensure all base permissions are included
    return Array.from(permissionsSet).sort();
  }, []);


  useEffect(() => {
    setSystemUsers(DUMMY_SYSTEM_USERS);
    setRoles(DUMMY_ROLES);
    setEmployees(DUMMY_EMPLOYEES);
  }, []);

  const getRoleNameById = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }

  // User Dialog Functions
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserEmployeeChange = (employeeId: string) => {
    setNewUserData(prev => ({ ...prev, employeeId: employeeId === "none" ? undefined : employeeId }));
  };

  const handleUserRoleChange = (roleId: string, checked: boolean) => {
    setNewUserData(prev => {
      const updatedRoles = checked
        ? [...prev.roles, roleId]
        : prev.roles.filter(r => r !== roleId);
      return { ...prev, roles: updatedRoles };
    });
  };

  const handleUserActiveChange = (checked: boolean) => {
    setNewUserData(prev => ({ ...prev, isActive: checked }));
  };

  const openNewUserDialog = () => {
    setEditingUser(null);
    setNewUserData(initialNewUserState);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setNewUserData({ ...user, password: '' }); // Don't prefill password for editing
    setIsUserDialogOpen(true);
  };

  const handleSubmitUser = () => {
    if (!newUserData.username) {
      toast({ title: "خطأ", description: "اسم المستخدم مطلوب.", variant: "destructive" });
      return;
    }
    if (!editingUser && !newUserData.password) {
      toast({ title: "خطأ", description: "كلمة المرور مطلوبة للمستخدم الجديد.", variant: "destructive" });
      return;
    }

    if (editingUser) {
      const updatedUser: SystemUser = {
        ...editingUser,
        username: newUserData.username,
        fullName: newUserData.fullName,
        employeeId: newUserData.employeeId,
        roles: newUserData.roles,
        isActive: newUserData.isActive,
        // Password update logic would be more complex in a real app (e.g., only if new password provided)
        hashedPassword: newUserData.password ? `hashed_${newUserData.password}_example` : editingUser.hashedPassword,
      };
      setSystemUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
      const index = DUMMY_SYSTEM_USERS.findIndex(u => u.id === editingUser.id);
      if (index !== -1) DUMMY_SYSTEM_USERS[index] = updatedUser;
      toast({ title: "نجاح", description: `تم تحديث المستخدم ${updatedUser.username}.` });
    } else {
      const newUser: SystemUser = {
        ...newUserData,
        id: `user-${Date.now()}`,
        hashedPassword: `hashed_${newUserData.password}_example`, // Placeholder for hashing
      };
      delete (newUser as any).password; // Remove plain password
      setSystemUsers(prev => [newUser, ...prev]);
      DUMMY_SYSTEM_USERS.unshift(newUser);
      toast({ title: "نجاح", description: `تمت إضافة المستخدم ${newUser.username}.` });
    }
    setIsUserDialogOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    // Add confirmation dialog in real app
    setSystemUsers(prev => prev.filter(u => u.id !== userId));
    const index = DUMMY_SYSTEM_USERS.findIndex(u => u.id === userId);
    if (index !== -1) DUMMY_SYSTEM_USERS.splice(index, 1);
    toast({ title: "نجاح", description: `تم حذف المستخدم.`, variant: "destructive" });
  };


  // Role Dialog Functions
  const handleRoleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRoleData(prev => ({ ...prev, [name]: value }));
  };

  const handleRolePermissionChange = (permission: string, checked: boolean) => {
    setNewRoleData(prev => {
      const updatedPermissions = checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission);
      return { ...prev, permissions: updatedPermissions };
    });
  };

  const openNewRoleDialog = () => {
    setEditingRole(null);
    setNewRoleData(initialNewRoleState);
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: AppRole) => {
    setEditingRole(role);
    setNewRoleData(role);
    setIsRoleDialogOpen(true);
  };

  const handleSubmitRole = () => {
    if (!newRoleData.name) {
      toast({ title: "خطأ", description: "اسم الدور مطلوب.", variant: "destructive" });
      return;
    }

    if (editingRole) {
      const updatedRole = { ...editingRole, ...newRoleData };
      setRoles(prev => prev.map(r => r.id === editingRole.id ? updatedRole : r));
      const index = DUMMY_ROLES.findIndex(r => r.id === editingRole.id);
      if (index !== -1) DUMMY_ROLES[index] = updatedRole;
      toast({ title: "نجاح", description: `تم تحديث الدور ${updatedRole.name}.` });
    } else {
      const newRole: AppRole = {
        ...newRoleData,
        id: `role-${Date.now()}`,
      };
      setRoles(prev => [newRole, ...prev]);
      DUMMY_ROLES.unshift(newRole);
      toast({ title: "نجاح", description: `تمت إضافة الدور ${newRole.name}.` });
    }
    setIsRoleDialogOpen(false);
  };
  
  const handleDeleteRole = (roleId: string) => {
    // Check if role is in use by any user
    const isRoleInUse = systemUsers.some(user => user.roles.includes(roleId));
    if (isRoleInUse) {
      toast({
        title: "خطأ عند الحذف",
        description: "لا يمكن حذف هذا الدور لأنه مستخدم حاليًا من قبل مستخدم واحد على الأقل.",
        variant: "destructive",
      });
      return;
    }
    setRoles(prev => prev.filter(r => r.id !== roleId));
    const index = DUMMY_ROLES.findIndex(r => r.id === roleId);
    if (index !== -1) DUMMY_ROLES.splice(index, 1);
    toast({ title: "نجاح", description: `تم حذف الدور.`, variant: "destructive" });
  };


  return (
    <>
      <PageHeader
        title="إدارة المستخدمين والصلاحيات"
        description="إدارة حسابات مستخدمي النظام وأدوارهم وصلاحياتهم."
        icon={UserCog}
        actions={
          <div className="flex gap-2">
            <Button onClick={openNewUserDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="h-5 w-5 me-2" /> إضافة مستخدم جديد
            </Button>
            <Button onClick={openNewRoleDialog} variant="outline">
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
                          <Badge key={roleId} variant="secondary" className="me-1 my-0.5 whitespace-nowrap">
                            {getRoleNameById(roleId)}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => {
                             setSystemUsers(prevUsers =>
                                prevUsers.map(u =>
                                u.id === user.id ? { ...u, isActive: checked } : u
                                )
                            );
                            const userToUpdate = DUMMY_SYSTEM_USERS.find(u => u.id === user.id);
                            if(userToUpdate) userToUpdate.isActive = checked;
                            toast({
                                title: `تم تغيير حالة المستخدم ${user.username}`,
                                description: `أصبح المستخدم ${checked ? 'نشط' : 'غير نشط'}.`,
                            });
                          }}
                          aria-label={`تنشيط المستخدم ${user.username}`}
                        />
                      </TableCell>
                      <TableCell className="text-center space-x-2 space-x-reverse">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                        <TableHead>الصلاحيات (عينة)</TableHead>
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
                                <TableCell className="text-center space-x-2 space-x-reverse">
                                <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRole(role.id)}>
                                  <Trash2 className="h-4 w-4" />
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

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? `تعديل المستخدم: ${editingUser.username}` : 'إضافة مستخدم جديد'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'قم بتحديث تفاصيل هذا المستخدم.' : 'املأ تفاصيل المستخدم الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid gap-4 py-4 px-6">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input id="username" name="username" value={newUserData.username} onChange={handleUserInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input id="fullName" name="fullName" value={newUserData.fullName || ''} onChange={handleUserInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</Label>
                <Input id="password" name="password" type="password" value={newUserData.password || ''} onChange={handleUserInputChange} placeholder={editingUser ? 'اتركه فارغًا لعدم التغيير' : ''}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">ربط بموظف (اختياري)</Label>
                <Select value={newUserData.employeeId || "none"} onValueChange={handleUserEmployeeChange}>
                  <SelectTrigger id="employeeId">
                    <SelectValue placeholder="اختر موظفًا" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون ربط</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الأدوار</Label>
                <div className="grid grid-cols-2 gap-2 p-2 border rounded-md">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={newUserData.roles.includes(role.id)}
                        onCheckedChange={(checked) => handleUserRoleChange(role.id, !!checked)}
                      />
                      <Label htmlFor={`role-${role.id}`} className="font-normal">{role.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch id="isActiveUser" checked={newUserData.isActive} onCheckedChange={handleUserActiveChange} />
                <Label htmlFor="isActiveUser">المستخدم نشط</Label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
            <Button onClick={handleSubmitUser}>{editingUser ? 'حفظ التغييرات' : 'إضافة مستخدم'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? `تعديل الدور: ${editingRole.name}` : 'إضافة دور جديد'}</DialogTitle>
            <DialogDescription>
              {editingRole ? 'قم بتحديث تفاصيل هذا الدور وصلاحياته.' : 'املأ تفاصيل الدور الجديد وصلاحياته.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid gap-4 py-4 px-6">
              <div className="space-y-2">
                <Label htmlFor="roleName">اسم الدور</Label>
                <Input id="roleName" name="name" value={newRoleData.name} onChange={handleRoleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDescription">الوصف (اختياري)</Label>
                <Input id="roleDescription" name="description" value={newRoleData.description || ''} onChange={handleRoleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>الصلاحيات</Label>
                <ScrollArea className="h-48 border rounded-md p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {allPermissions.map(permission => (
                      <div key={permission} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`perm-${permission}`}
                          checked={newRoleData.permissions.includes(permission)}
                          onCheckedChange={(checked) => handleRolePermissionChange(permission, !!checked)}
                        />
                        <Label htmlFor={`perm-${permission}`} className="font-normal text-xs">{permission}</Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
            <Button onClick={handleSubmitRole}>{editingRole ? 'حفظ التغييرات' : 'إضافة دور'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
