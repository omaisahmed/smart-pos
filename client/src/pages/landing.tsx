import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, Zap, Globe, ScanBarcode } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <ScanBarcode className="text-primary-foreground h-7 w-7" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Smart POS
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Offline-first Point of Sale system for retail stores and restaurants. 
            Keep selling even when the internet goes down.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-4"
            onClick={() => navigate('/login')}
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Process transactions instantly, even without internet connection
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Offline First</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Continue selling when internet is down. Sync automatically when back online
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your data is encrypted and secure with role-based access control
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Complete Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Inventory, customers, reports, and more - all in one easy to use POS system
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Perfect for Pakistani Businesses
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                <span className="text-muted-foreground">Kiryana stores and general shops</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                <span className="text-muted-foreground">Auto parts and hardware stores</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                <span className="text-muted-foreground">Restaurants and cafes</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                <span className="text-muted-foreground">Clothing and retail shops</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                <span className="text-muted-foreground">Pharmacies and medical stores</span>
              </li>
              {/* <li className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                <span className="text-muted-foreground">JazzCash and EasyPaisa integration</span>
              </li> */}
            </ul>
          </div>
          
          <div className="bg-card rounded-lg p-8 border">
            <h3 className="text-xl font-semibold mb-4">Key Features</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Sales and billing with receipt printing</li>
              <li>• Inventory management with low stock alerts</li>
              <li>• Customer management and credit tracking</li>
              <li>• Multi-user roles (cashier, manager, admin)</li>
              <li>• Offline-first with automatic sync</li>
              <li>• Daily sales and profit/loss reports</li>
              <li>• Thermal printer support</li>
              <li>• User-friendly interface</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
