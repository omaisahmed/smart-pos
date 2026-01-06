import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import ConnectionStatus from '@/components/common/connection-status';
import {
  ShoppingCart,
  BarChart3,
  Package,
  Users,
  FileText,
  Settings,
  ScanBarcode
} from 'lucide-react';

const navigation = [
  // expose POS under /pos as well to avoid confusion when users expect a dedicated route
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-card border-r border-border flex-shrink-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ScanBarcode className="text-primary-foreground h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">Smart POS</h1>
            <p className="text-sm text-muted-foreground">Retail & Restaurant</p>
          </div>
        </div>
        
        <ConnectionStatus />
        
        <nav className="space-y-2 mt-6">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={cn(
                  'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* User Info */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.firstName || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-primary-foreground text-sm font-medium">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || 'User'
              }
            </p>
            <p className="text-xs text-muted-foreground capitalize" data-testid="text-user-role">
              {user?.role || 'cashier'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
