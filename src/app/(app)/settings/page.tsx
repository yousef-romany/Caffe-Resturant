import { PageHeader } from '@/components/custom/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your application settings." />
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>Update your cafe or restaurant details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" defaultValue="Cafe POS Express" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="storeAddress">Address</Label>
                <Input id="storeAddress" defaultValue="123 Main Street, Anytown" className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="storeContact">Contact Phone</Label>
              <Input id="storeContact" defaultValue="+1 (555) 123-4567" className="mt-1" />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Store Info</Button>
          </CardContent>
        </Card>

        <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your personal account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userName">Your Name</Label>
                  <Input id="userName" defaultValue="Admin User" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="userEmail">Email</Label>
                  <Input id="userEmail" type="email" defaultValue="admin@example.com" className="mt-1" />
                </div>
            </div>
            <div>
              <Label htmlFor="userPassword">Change Password</Label>
              <Input id="userPassword" type="password" placeholder="New Password" className="mt-1" />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Update Account</Button>
          </CardContent>
        </Card>

         <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Printer Settings</CardTitle>
            <CardDescription>Configure your receipt and kitchen printers (UI Placeholder).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <Label htmlFor="receiptPrinter">Receipt Printer</Label>
                <Input id="receiptPrinter" defaultValue="Thermal Printer (USB)" className="mt-1" disabled/>
            </div>
            <div>
                <Label htmlFor="kitchenPrinter">Kitchen Printer</Label>
                <Input id="kitchenPrinter" defaultValue="Network Printer (LAN)" className="mt-1" disabled/>
            </div>
            <Button disabled className="bg-primary hover:bg-primary/90 text-primary-foreground">Configure Printers</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
