import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Settings as SettingsIcon, User, Bell, Shield, Printer } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated successfully.',
    });
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and preferences</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                defaultValue={user?.firstName || ''}
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                defaultValue={user?.lastName || ''}
                data-testid="input-last-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email || ''}
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                defaultValue={user?.role || 'cashier'}
                disabled
                data-testid="input-role"
              />
            </div>
          </div>
          <Button onClick={handleSave} data-testid="button-save-profile">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            Store Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                defaultValue="SmartPOS Store"
                data-testid="input-store-name"
              />
            </div>
            <div>
              <Label htmlFor="storePhone">Store Phone</Label>
              <Input
                id="storePhone"
                defaultValue="+92-300-1234567"
                data-testid="input-store-phone"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Input
                id="storeAddress"
                defaultValue="123 Main Street, Karachi"
                data-testid="input-store-address"
              />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                defaultValue="123456789"
                data-testid="input-gst-number"
              />
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                defaultValue="17"
                data-testid="input-tax-rate"
              />
            </div>
          </div>
          <Button onClick={handleSave} data-testid="button-save-store">
            Save Store Settings
          </Button>
        </CardContent>
      </Card>

      {/* Printer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Printer className="h-5 w-5 mr-2" />
            Printer Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="printerName">Printer Name</Label>
              <Input
                id="printerName"
                defaultValue="Thermal Printer"
                data-testid="input-printer-name"
              />
            </div>
            <div>
              <Label htmlFor="paperWidth">Paper Width (mm)</Label>
              <Input
                id="paperWidth"
                type="number"
                defaultValue="80"
                data-testid="input-paper-width"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="autoPrint" data-testid="switch-auto-print" />
            <Label htmlFor="autoPrint">Automatically print receipts</Label>
          </div>
          <Button onClick={handleSave} data-testid="button-save-printer">
            Save Printer Settings
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch id="lowStock" defaultChecked data-testid="switch-low-stock" />
              <Label htmlFor="lowStock">Low stock alerts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="dailyReport" defaultChecked data-testid="switch-daily-report" />
              <Label htmlFor="dailyReport">Daily sales reports</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="syncNotifications" defaultChecked data-testid="switch-sync-notifications" />
              <Label htmlFor="syncNotifications">Data sync notifications</Label>
            </div>
          </div>
          <Button onClick={handleSave} data-testid="button-save-notifications">
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Account Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
