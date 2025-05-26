
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
import { DUMMY_PERMISSIONS_LIST, type SystemUser, type Role as AppRole, type Employee } from '@/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDb } from '@/lib/db';
import type { Database } from '@tauri-apps/plugin-sql';


const initialNewUserState: Omit<SystemUser, 'id' | 'hashedPassword'> & { password?: string } = {
  username: '',
  full_name: '',
  employeeId: undefined,
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
  const [db, setDbInstance] = useState<Database | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>(DUMMY_PERMISSIONS_LIST);
  const { toast } = useToast();

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);

  const [newUserData, setNewUserData] = useState(initialNewUserState);
  const [newRoleData, setNewRoleData] = useState(initialNewRoleState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDbAndData() {
      try {
        const dbInstance = await getDb;
        if (!dbInstance) {
          toast({ title: "خطأ فادح", description: "فشل الاتصال بقاعدة البيانات.", variant: "destructive"});
          setIsLoading(false);
          return;
        }
        setDbInstance(dbInstance);
        await fetchAllData(dbInstance);
      } catch (error) {
        console.error("Failed to initialize DB or fetch data:", error);
        toast({ title: "خطأ في التحميل", description: "فشل تحميل البيانات الأولية.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    }
    loadDbAndData();
  }, [toast]);

  const fetchAllData = async (currentDb: Database) => {
    if (!currentDb) return;
    setIsLoading(true);
    try {
      const usersData: SystemUser[] = await currentDb.select('SELECT id, username, full_name, employee_id, is_active FROM system_users ORDER BY username');
      
      const rolesData: AppRole[] = await currentDb.select('SELECT id, name, description FROM roles ORDER BY name');
      const rolesWithPermissions = await Promise.all(rolesData.map(async (role: AppRole) => {
        const permissionsRaw: {permission_id: string}[] = await currentDb.select("SELECT permission_id FROM role_permissions WHERE role_id = ?", [role.id]);
        return { ...role, permissions: permissionsRaw.map(p => p.permission_id) };
      }));
      
      const userRolesPromises = usersData.map(async (user: SystemUser) => {
        const userRolesRaw: {role_id: string}[] = await currentDb.select('SELECT role_id FROM user_roles WHERE user_id = ?', [user.id]);
        return { ...user, roles: userRolesRaw.map(ur => ur.role_id), isActive: Boolean(user.isActive) };
      });
      const usersWithRoles = await Promise.all(userRolesPromises);

      const employeesData: Employee[] = await currentDb.select('SELECT id, name, role FROM employees WHERE is_active = true ORDER BY name'); 
      
      const permissionsFromDb: {name: string}[] = await currentDb.select('SELECT name FROM permissions ORDER BY name');
      setAllPermissions(permissionsFromDb.map(p => p.name));

      setSystemUsers(usersWithRoles);
      setRoles(rolesWithPermissions);
      setEmployees(employeesData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "خطأ", description: "فشل في جلب البيانات من قاعدة البيانات.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const getRoleNameById = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }

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

  const handleUserActiveChangeSwitch = async (userId: string, isActive: boolean) => {
    if (!db) return;
    try {
<<<<<<< HEAD
      await db.execute('UPDATE system_users SET is_active = ? WHERE id = ?', [Number(isActive), userId]);
=======
      await db.execute('UPDATE system_users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, userId]);
>>>>>>> 2343b1e9ea3354f95d34b02aef35b24185a4914b
      setSystemUsers(prevUsers =>
        prevUsers.map(u =>
        u.id === userId ? { ...u, isActive: isActive } : u
        )
      );
      toast({
          title: `تم تغيير حالة المستخدم بنجاح`,
          description: `أصبح المستخدم ${isActive ? 'نشط' : 'غير نشط'}.`,
      });
    } catch (error) {
      console.error("Error updating user active status:", error);
      toast({ title: "خطأ", description: "فشل تحديث حالة المستخدم.", variant: "destructive" });
    }
  };


  const openNewUserDialog = () => {
    setEditingUser(null);
    setNewUserData(initialNewUserState);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setNewUserData({ 
      username: user.username,
      full_name: user.full_name,
      employeeId: user.employeeId,
      roles: user.roles || [], 
      isActive: user.isActive,
      password: '', 
    });
    setIsUserDialogOpen(true);
  };

  const handleSubmitUser = async () => {
    if (!db) return;
    if (!newUserData.username) {
      toast({ title: "خطأ", description: "اسم المستخدم مطلوب.", variant: "destructive" });
      return;
    }
    if (!editingUser && !newUserData.password) {
      toast({ title: "خطأ", description: "كلمة المرور مطلوبة للمستخدم الجديد.", variant: "destructive" });
      return;
    }

    try {
      if (editingUser) {
<<<<<<< HEAD
        // Update existing user
        const updateFields: any[] = [newUserData.username, newUserData.full_name, newUserData.employeeId, Number(newUserData.isActive)];
=======
        const updateFields: any[] = [newUserData.username, newUserData.fullName, newUserData.employeeId, newUserData.isActive ? 1 : 0];
>>>>>>> 2343b1e9ea3354f95d34b02aef35b24185a4914b
        let sql = 'UPDATE system_users SET username = ?, full_name = ?, employee_id = ?, is_active = ?';
        if (newUserData.password) {
          sql += ', hashed_password = ?';
          updateFields.push(newUserData.password); 
        }
        sql += ' WHERE id = ?';
        updateFields.push(editingUser.id);
        
        await db.execute(sql, updateFields);
        
        await db.execute('DELETE FROM user_roles WHERE user_id = ?', [editingUser.id]);
        for (const roleId of newUserData.roles) {
          await db.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [editingUser.id, roleId]);
        }
        toast({ title: "نجاح", description: `تم تحديث المستخدم ${newUserData.username}.` });
      } else {
        const newUserId = `user-${Date.now()}`;
        await db.execute(
          'INSERT INTO system_users (id, username, full_name, employee_id, hashed_password, is_active) VALUES (?, ?, ?, ?, ?, ?)',
<<<<<<< HEAD
          [newUserId, newUserData.username, newUserData.full_name, newUserData.employeeId, newUserData.password, Number(newUserData.isActive)] // Plain text password
=======
          [newUserId, newUserData.username, newUserData.fullName, newUserData.employeeId, newUserData.password, newUserData.isActive ? 1 : 0]
>>>>>>> 2343b1e9ea3354f95d34b02aef35b24185a4914b
        );
        for (const roleId of newUserData.roles) {
          await db.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [newUserId, roleId]);
        }
        toast({ title: "نجاح", description: `تمت إضافة المستخدم ${newUserData.username}.` });
      }
      setIsUserDialogOpen(false);
      if (db) await fetchAllData(db);
    } catch (error) {
      console.error("Error submitting user:", error);
      toast({ title: "خطأ", description: "فشل حفظ بيانات المستخدم. قد يكون اسم المستخدم مكرر.", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    try {
      await db.execute('DELETE FROM system_users WHERE id = ?', [userId]);
      toast({ title: "نجاح", description: `تم حذف المستخدم.`, variant: "destructive" });
      if (db) await fetchAllData(db);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "خطأ", description: "فشل حذف المستخدم.", variant: "destructive" });
    }
  };


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
    setNewRoleData({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [] 
    });
    setIsRoleDialogOpen(true);
  };

  const handleSubmitRole = async () => {
    if (!db) return;
    if (!newRoleData.name) {
      toast({ title: "خطأ", description: "اسم الدور مطلوب.", variant: "destructive" });
      return;
    }
    
    try {
      if (editingRole) {
        await db.execute(
          'UPDATE roles SET name = ?, description = ? WHERE id = ?',
          [newRoleData.name, newRoleData.description, editingRole.id]
        );
        await db.execute('DELETE FROM role_permissions WHERE role_id = ?', [editingRole.id]);
        for (const permissionName of newRoleData.permissions) {
          await db.execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, (SELECT id FROM permissions WHERE name = ?))', 
            [editingRole.id, permissionName]);
        }
        toast({ title: "نجاح", description: `تم تحديث الدور ${newRoleData.name}.` });
      } else {
        const newRoleId = `role-${Date.now()}`;
        await db.execute(
          'INSERT INTO roles (id, name, description) VALUES (?, ?, ?)',
          [newRoleId, newRoleData.name, newRoleData.description]
        );
        for (const permissionName of newRoleData.permissions) {
           await db.execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, (SELECT id FROM permissions WHERE name = ?))', 
            [newRoleId, permissionName]);
        }
        toast({ title: "نجاح", description: `تمت إضافة الدور ${newRoleData.name}.` });
      }
      setIsRoleDialogOpen(false);
      if (db) await fetchAllData(db);
    } catch (error) {
      console.error("Error submitting role:", error);
      toast({ title: "خطأ", description: "فشل حفظ بيانات الدور. قد يكون اسم الدور مكرر.", variant: "destructive" });
    }
  };
  
  const handleDeleteRole = async (roleId: string) => {
    if (!db) return;
    try {
      const usersWithRole: {count: number}[] = await db.select('SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?', [roleId]);
      if (usersWithRole[0].count > 0) {
        toast({
          title: "خطأ عند الحذف",
          description: "لا يمكن حذف هذا الدور لأنه مستخدم حاليًا من قبل مستخدم واحد على الأقل.",
          variant: "destructive",
        });
        return;
      }
      await db.execute('DELETE FROM roles WHERE id = ?', [roleId]);
      toast({ title: "نجاح", description: `تم حذف الدور.`, variant: "destructive" });
      if (db) await fetchAllData(db);
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({ title: "خطأ", description: "فشل حذف الدور.", variant: "destructive" });
    }
  };

  if (isLoading && !db) { 
    return (
      <>
        <PageHeader title="إدارة المستخدمين والصلاحيات" icon={UserCog}/>
        <p className="text-center text-muted-foreground">جارٍ تحميل قاعدة البيانات...</p>
      </>
    )
  }
  if (isLoading) { 
    return (
      <>
        <PageHeader title="إدارة المستخدمين والصلاحيات" icon={UserCog}/>
        <p className="text-center text-muted-foreground">جارٍ تحميل البيانات...</p>
      </>
    )
  }


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
                  <TableHead className='text-center'>اسم المستخدم</TableHead>
                  <TableHead className='text-center'>الاسم الكامل</TableHead>
                  <TableHead className='text-center'>الأدوار</TableHead>
                  <TableHead className="text-center">نشط</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemUsers.length > 0 ? (
                  systemUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-center">{user.username}</TableCell>
                      <TableCell className="text-center">{user.full_name || '-'}</TableCell>
                      <TableCell>
                        {(user.roles || []).map(roleId => (
                          <Badge key={roleId} variant="secondary" className="me-1 my-0.5 whitespace-nowrap">
                            {getRoleNameById(roleId)}
                          </Badge>
                        ))}
                        {(user.roles || []).length === 0 && '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => handleUserActiveChangeSwitch(user.id, checked)}
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
                                  {(role.permissions || []).slice(0, 3).join(', ')}{(role.permissions || []).length > 3 ? '...' : ''}
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
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input id="full_name" name="full_name" value={newUserData.full_name || ''} onChange={handleUserInputChange} />
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
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="grid grid-cols-2 gap-2">
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
                </ScrollArea>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch id="isActiveUserForm" checked={newUserData.isActive} onCheckedChange={(checked) => setNewUserData(prev => ({...prev, isActive: checked}))} />
                <Label htmlFor="isActiveUserForm">المستخدم نشط</Label>
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
                          checked={(newRoleData.permissions || []).includes(permission)}
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

    

    