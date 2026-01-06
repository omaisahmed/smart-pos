import { useState } from 'react';
import ProductGrid from '@/components/pos/product-grid';
import CartPanel from '@/components/pos/cart-panel';
import ReceiptModal from '@/components/pos/receipt-modal';
import { CartItem, ReceiptData } from '@/types/pos';
import { Product } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function POS() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');

  const addToCart = (product: Product) => {
    setCartItems(current => {
      const existingItem = current.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return current.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: crypto.randomUUID(),
          product,
          quantity: 1,
          unitPrice: Number(product.price),
          totalPrice: Number(product.price)
        };
        return [...current, newItem];
      }
    });
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(current =>
      current.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              totalPrice: quantity * item.unitPrice
            }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(current => current.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const restoreHeldSale = (heldSale: any) => {
    clearCart();
    setCartItems(heldSale.items);
    setSelectedCustomer(heldSale.customerId || '');
    setSelectedPaymentMethod(heldSale.paymentMethod);
  };

  const processPayment = async (paymentMethod: string, customerId?: string) => {
    if (cartItems.length === 0) return;

    const customerIdToSend = selectedCustomer === 'walk-in' ? null : selectedCustomer;

    // Save transaction to database
    const transactionData = {
      transactionNumber: `TXN-${Date.now()}`,
      customerId: customerIdToSend,
      subtotal: cartItems.reduce((sum, item) => sum + item.totalPrice, 0).toString(),
      tax: (cartItems.reduce((sum, item) => sum + item.totalPrice, 0) * 0.17).toString(),
      total: (cartItems.reduce((sum, item) => sum + item.totalPrice, 0) * 1.17).toString(),
      paymentMethod,
      paymentStatus: 'completed',
      synced: false,
    };

    const itemsData = cartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: item.totalPrice.toString(),
    }));

    try {
      await apiRequest('POST', '/api/transactions', { transaction: transactionData, items: itemsData });
    } catch (err) {
      console.error('Failed to save transaction', err);
      // TODO: handle error
    }

    // Show receipt
    const mockReceiptData: ReceiptData = {
      transaction: {
        ...transactionData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: cartItems.map(item => ({
          id: crypto.randomUUID(),
          transactionId: crypto.randomUUID(),
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          createdAt: new Date(),
          product: item.product
        }))
      },
      storeName: 'Smart POS Store',
      storeAddress: '123 Main Street, Karachi',
      storePhone: '+92-300-1234567',
      gstNumber: '123456789',
      cashierName: 'Current User'
    };

    setReceiptData(mockReceiptData);
    setShowReceipt(true);
    // Don't clear cart here
  };

  return (
    <div className="flex h-full overflow-hidden">
      <ProductGrid onAddToCart={addToCart} />
      <CartPanel
        items={cartItems}
        onUpdateItem={updateCartItem}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onProcessPayment={processPayment}
        onRestoreHeldSale={restoreHeldSale}
        selectedCustomer={selectedCustomer}
        selectedPaymentMethod={selectedPaymentMethod}
        onSelectedCustomerChange={setSelectedCustomer}
        onSelectedPaymentMethodChange={setSelectedPaymentMethod}
      />
      {showReceipt && receiptData && (
        <ReceiptModal
          receiptData={receiptData}
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          onPrint={clearCart}
        />
      )}
    </div>
  );
}
