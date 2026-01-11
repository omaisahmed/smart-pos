import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ScanBarcode, Pause, RotateCcw } from 'lucide-react';
import { CartItem, CartSummary, PaymentMethod } from '@/types/pos';
import { Customer } from '@shared/schema';
import HeldSalesModal from './held-sales-modal';

interface CartPanelProps {
  items: CartItem[];
  onUpdateItem: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onProcessPayment: (paymentMethod: string, customerId?: string) => void;
  onRestoreHeldSale: (heldSale: any) => void;
  selectedCustomer: string;
  selectedPaymentMethod: string;
  onSelectedCustomerChange: (value: string) => void;
  onSelectedPaymentMethodChange: (value: string) => void;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: 'money-bill-wave', enabled: true },
  { id: 'card', name: 'Card', icon: 'credit-card', enabled: true },
  { id: 'jazzcash', name: 'JazzCash', icon: 'mobile-alt', enabled: true },
  { id: 'easypaisa', name: 'EasyPaisa', icon: 'wallet', enabled: true },
];

export default function CartPanel({
  items,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onProcessPayment,
  onRestoreHeldSale,
  selectedCustomer,
  selectedPaymentMethod,
  onSelectedCustomerChange,
  onSelectedPaymentMethodChange
}: CartPanelProps) {
  const { toast } = useToast();

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const [heldSales, setHeldSales] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState<number>(17);

  useEffect(() => {
    const loadHeldSales = () => {
      try {
        const held = JSON.parse(localStorage.getItem('held:sales') || '[]');
        setHeldSales(held);
      } catch (err) {
        console.error('Failed to load held sales', err);
      }
    };
    loadHeldSales();
  }, []);

  useEffect(() => {
    const loadTaxRate = () => {
      try {
        const settings = localStorage.getItem('settings:store');
        if (settings) {
          const parsed = JSON.parse(settings);
          setTaxRate(parsed.taxRate ?? 17);
        }
      } catch (err) {
        console.error('Failed to load tax rate', err);
        setTaxRate(17);
      }
    };
    loadTaxRate();

    // Listen for storage changes (updates from settings page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settings:store') {
        loadTaxRate();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const cartSummary: CartSummary = {
    subtotal: items.reduce((sum, item) => sum + item.totalPrice, 0),
    tax: items.reduce((sum, item) => sum + item.totalPrice, 0) * (taxRate / 100),
    total: items.reduce((sum, item) => sum + item.totalPrice, 0) * (1 + taxRate / 100),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };

  const handleProcessPayment = () => {
    if (items.length === 0) return;
    onProcessPayment(selectedPaymentMethod, selectedCustomer || undefined);
  };

  const getPaymentIcon = (iconName: string) => {
    switch (iconName) {
      case 'money-bill-wave':
        return '💵';
      case 'credit-card':
        return '💳';
      case 'mobile-alt':
        return '📱';
      case 'wallet':
        return '👛';
      default:
        return '💰';
    }
  };

  return (
    <div className="w-96 bg-card border-l border-border p-6 flex flex-col">
      <h3 className="text-xl font-bold mb-4" data-testid="text-cart-title">Current Sale</h3>
      
      {/* Customer Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Customer</label>
        <Select value={selectedCustomer} onValueChange={onSelectedCustomerChange}>
          <SelectTrigger data-testid="select-customer">
            <SelectValue placeholder="Walk-in Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="walk-in">Walk-in Customer</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Cart Items */}
      <div className="flex-1 space-y-3 mb-6 max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground" data-testid="text-empty-cart">Cart is empty</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
              data-testid={`cart-item-${item.id}`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate" data-testid="text-item-name">
                  {item.product.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Rs. {item.unitPrice.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  data-testid={`button-decrease-${item.id}`}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-semibold" data-testid={`text-quantity-${item.id}`}>
                  {item.quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                  data-testid={`button-increase-${item.id}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-destructive hover:text-destructive"
                  data-testid={`button-remove-${item.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="w-20 text-right font-semibold ml-2" data-testid={`text-item-total-${item.id}`}>
                Rs. {item.totalPrice.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Totals */}
      <div className="border-t border-border pt-4 mb-6">
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span data-testid="text-subtotal">Rs. {cartSummary.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Tax ({taxRate}%):</span>
          <span data-testid="text-tax">Rs. {cartSummary.tax.toLocaleString()}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between text-xl font-bold">
          <span>Total:</span>
          <span className="text-primary" data-testid="text-total">
            Rs. {cartSummary.total.toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Payment Methods */}
      {/* <div className="mb-6">
        <h4 className="font-semibold mb-3">Payment Method</h4>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => (
            <Button
              key={method.id}
              variant={selectedPaymentMethod === method.id ? 'default' : 'outline'}
              className="p-3 h-auto flex flex-col"
              onClick={() => setSelectedPaymentMethod(method.id)}
              disabled={!method.enabled}
              data-testid={`payment-${method.id}`}
            >
              <span className="text-lg mb-1">{getPaymentIcon(method.icon)}</span>
              <span className="text-sm">{method.name}</span>
            </Button>
          ))}
        </div>
      </div> */}
      
      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          className="w-full py-3 font-semibold"
          onClick={handleProcessPayment}
          disabled={items.length === 0}
          data-testid="button-process-payment"
        >
          <ScanBarcode className="h-4 w-4 mr-2" />
          Complete Sale
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (items.length === 0) {
                toast({ title: 'Nothing to hold', description: 'Cart is empty', variant: 'destructive' });
                return;
              }

              try {
                const held = JSON.parse(localStorage.getItem('held:sales') || '[]');
                const newHeld = {
                  id: `held-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  items,
                  customerId: selectedCustomer || null,
                  paymentMethod: selectedPaymentMethod,
                };
                held.push(newHeld);
                localStorage.setItem('held:sales', JSON.stringify(held));
                setHeldSales([...held]);
                onClearCart();
                toast({ title: 'Sale held', description: 'Sale saved for later.' });
              } catch (err) {
                console.error('Failed to hold sale', err);
                toast({ title: 'Hold failed', description: 'Could not save held sale', variant: 'destructive' });
              }
            }}
            data-testid="button-hold-sale"
          >
            <Pause className="h-4 w-4 mr-1" />
            Hold
          </Button>
          <Button
            variant="outline"
            onClick={onClearCart}
            disabled={items.length === 0}
            className="text-destructive hover:text-destructive"
            data-testid="button-clear-cart"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
        <HeldSalesModal onRestore={onRestoreHeldSale} heldSales={heldSales} onUpdate={() => setHeldSales(JSON.parse(localStorage.getItem('held:sales') || '[]'))} />
      </div>
    </div>
  );
}
