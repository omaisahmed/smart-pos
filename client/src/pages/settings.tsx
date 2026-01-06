import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, User, Bell, Shield, Printer } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  // Store settings
  const [storeName, setStoreName] = useState('Smart POS Store');
  const [storePhone, setStorePhone] = useState('+92-300-1234567');
  const [storeAddress, setStoreAddress] = useState('123 Main Street, Karachi');
  const [gstNumber, setGstNumber] = useState('123456789');
  const [taxRate, setTaxRate] = useState<number | ''>(17);

  // Printer settings
  const [printerName, setPrinterName] = useState('Thermal Printer');
  const [paperWidth, setPaperWidth] = useState<number | ''>(80);
  const [autoPrint, setAutoPrint] = useState(true);

  // Notification settings
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailyReport, setDailyReport] = useState(true);
  const [syncNotifications, setSyncNotifications] = useState(true);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
  }, [user]);

  // Load persisted settings from localStorage on mount
  useEffect(() => {
    try {
      const store = localStorage.getItem('settings:store');
      if (store) {
        const s = JSON.parse(store);
        setStoreName(s.storeName ?? storeName);
        setStorePhone(s.storePhone ?? storePhone);
        setStoreAddress(s.storeAddress ?? storeAddress);
        setGstNumber(s.gstNumber ?? gstNumber);
        setTaxRate(s.taxRate ?? taxRate);
      }

      const printer = localStorage.getItem('settings:printer');
      if (printer) {
        const p = JSON.parse(printer);
        setPrinterName(p.printerName ?? printerName);
        setPaperWidth(p.paperWidth ?? paperWidth);
        setAutoPrint(p.autoPrint ?? autoPrint);
      }

      const notifications = localStorage.getItem('settings:notifications');
      if (notifications) {
        const n = JSON.parse(notifications);
        setLowStockAlerts(n.lowStockAlerts ?? lowStockAlerts);
        setDailyReport(n.dailyReport ?? dailyReport);
        setSyncNotifications(n.syncNotifications ?? syncNotifications);
      }
    } catch (err) {
      console.warn('Failed to load settings from localStorage', err);
    }
  }, []);

  const handleSave = async () => {
    try {
      await apiRequest('PUT', '/api/auth/user', { firstName, lastName, email });
      // refresh auth info
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: 'Settings Saved',
        description: 'Your profile has been updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to save',
        description: err?.message || 'An error occurred while updating profile.',
      });
    }
  };

  const saveStoreSettings = () => {
    try {
      const payload = { storeName, storePhone, storeAddress, gstNumber, taxRate };
      localStorage.setItem('settings:store', JSON.stringify(payload));
      toast({ title: 'Store settings saved', description: 'Store settings persisted locally.' });
    } catch (err) {
      toast({ title: 'Failed', description: 'Could not save store settings.' });
    }
  };

  const savePrinterSettings = () => {
    try {
      const payload = { printerName, paperWidth, autoPrint };
      localStorage.setItem('settings:printer', JSON.stringify(payload));
      toast({ title: 'Printer settings saved', description: 'Printer settings persisted locally.' });
    } catch (err) {
      toast({ title: 'Failed', description: 'Could not save printer settings.' });
    }
  };

  const saveNotificationSettings = () => {
    try {
      const payload = { lowStockAlerts, dailyReport, syncNotifications };
      localStorage.setItem('settings:notifications', JSON.stringify(payload));
      toast({ title: 'Notification settings saved', description: 'Notification settings persisted locally.' });
    } catch (err) {
      toast({ title: 'Failed', description: 'Could not save notification settings.' });
    }
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
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="input-last-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  data-testid="input-store-name"
                />
            </div>
            <div>
              <Label htmlFor="storePhone">Store Phone</Label>
              <Input
                id="storePhone"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                data-testid="input-store-phone"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Input
                id="storeAddress"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                data-testid="input-store-address"
              />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                data-testid="input-gst-number"
              />
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={taxRate as number}
                onChange={(e) => setTaxRate(e.target.value === '' ? '' : Number(e.target.value))}
                data-testid="input-tax-rate"
              />
            </div>
          </div>
          <Button onClick={saveStoreSettings} data-testid="button-save-store">
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
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                data-testid="input-printer-name"
              />
            </div>
            <div>
              <Label htmlFor="paperWidth">Paper Width (mm)</Label>
              <Input
                id="paperWidth"
                type="number"
                value={paperWidth as number}
                onChange={(e) => setPaperWidth(e.target.value === '' ? '' : Number(e.target.value))}
                data-testid="input-paper-width"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="autoPrint" checked={autoPrint} onCheckedChange={(v) => setAutoPrint(Boolean(v))} data-testid="switch-auto-print" />
            <Label htmlFor="autoPrint">Automatically print receipts</Label>
          </div>
          <Button onClick={savePrinterSettings} data-testid="button-save-printer">
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
              <Switch id="lowStock" checked={lowStockAlerts} onCheckedChange={(v) => setLowStockAlerts(Boolean(v))} data-testid="switch-low-stock" />
              <Label htmlFor="lowStock">Low stock alerts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="dailyReport" checked={dailyReport} onCheckedChange={(v) => setDailyReport(Boolean(v))} data-testid="switch-daily-report" />
              <Label htmlFor="dailyReport">Daily sales reports</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="syncNotifications" checked={syncNotifications} onCheckedChange={(v) => setSyncNotifications(Boolean(v))} data-testid="switch-sync-notifications" />
              <Label htmlFor="syncNotifications">Data sync notifications</Label>
            </div>
          </div>
          <Button onClick={saveNotificationSettings} data-testid="button-save-notifications">
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
