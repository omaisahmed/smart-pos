import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Mail, X } from 'lucide-react';
import { ReceiptData } from '@/types/pos';
import { useState, useEffect } from 'react';

interface ReceiptModalProps {
  receiptData: ReceiptData;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => void;
}

export default function ReceiptModal({ receiptData, isOpen, onClose, onPrint }: ReceiptModalProps) {
  const { transaction, storeName, storeAddress, storePhone, gstNumber, cashierName } = receiptData;
  const [taxRate, setTaxRate] = useState<number>(17);
  const [recalculatedTax, setRecalculatedTax] = useState<number>(0);
  const [recalculatedTotal, setRecalculatedTotal] = useState<number>(0);

  useEffect(() => {
    // Load the current tax rate from settings
    const loadTaxRate = () => {
      try {
        const settings = localStorage.getItem('settings:store');
        if (settings) {
          const parsed = JSON.parse(settings);
          const newTaxRate = parsed.taxRate ?? 17;
          setTaxRate(newTaxRate);
          
          // Recalculate tax and total based on current tax rate
          const subtotal = Number(transaction.subtotal) || 0;
          const tax = subtotal * (newTaxRate / 100);
          const total = subtotal * (1 + newTaxRate / 100);
          
          setRecalculatedTax(tax);
          setRecalculatedTotal(total);
        }
      } catch (err) {
        console.error('Failed to load tax rate', err);
        setTaxRate(17);
      }
    };
    loadTaxRate();
  }, [isOpen, transaction]);

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  const handleEmail = () => {
    // Build a simple receipt text and open the user's mail client via mailto
    try {
      const subject = `Receipt ${transaction.transactionNumber} - ${storeName}`;
      let body = `Store: ${storeName}\n`;
      if (storeAddress) body += `Address: ${storeAddress}\n`;
      if (storePhone) body += `Phone: ${storePhone}\n`;
      body += `\nReceipt: ${transaction.transactionNumber}\n`;
      body += `Date: ${formatDate(transaction.createdAt!)} ${formatTime(transaction.createdAt!)}\n`;
      body += `Cashier: ${cashierName}\n\nItems:\n`;
      transaction.items.forEach((it) => {
        body += `${it.product.name}  x${it.quantity}  Rs. ${Number(it.totalPrice).toLocaleString()}\n`;
      });
      body += `\nSubtotal: Rs. ${Number(transaction.subtotal).toLocaleString()}\n`;
      body += `Tax: Rs. ${Number(transaction.tax).toLocaleString()}\n`;
      body += `TOTAL: Rs. ${Number(transaction.total).toLocaleString()}\n\n`;
      body += 'Thank you for your business!';

      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto, '_blank');
    } catch (err) {
      console.error('Failed to open mail client', err);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="no-print">
          <DialogTitle>Receipt Preview</DialogTitle>
        </DialogHeader>
        
        {/* Receipt Content */}
        <div
          id="receipt-content"
          className="font-mono text-xs bg-white text-black p-4 rounded border print:shadow-none print:border-none print:p-0"
          data-testid="receipt-content"
        >
          {/* Store Header */}
          <div className="text-center mb-4">
            <h2 className="text-base font-bold uppercase">{storeName}</h2>
            <p>{storeAddress}</p>
            <p>Phone: {storePhone}</p>
            {gstNumber && <p>GST: {gstNumber}</p>}
          </div>
          
          <Separator className="my-2 border-gray-300" />
          
          {/* Transaction Details */}
          <div className="mb-3">
            <div className="flex justify-between">
              <span>Date:</span>
              <span data-testid="text-receipt-date">
                {formatDate(transaction.createdAt!)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span data-testid="text-receipt-time">
                {formatTime(transaction.createdAt!)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Receipt:</span>
              <span data-testid="text-receipt-number">
                {transaction.transactionNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span data-testid="text-receipt-cashier">{cashierName}</span>
            </div>
            {transaction.customer && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{transaction.customer.name}</span>
              </div>
            )}
          </div>
          
          <Separator className="my-2 border-gray-300" />
          
          {/* Items */}
          <div className="mb-3">
            {transaction.items.map((item, index) => (
              <div key={index} className="mb-1">
                <div className="flex justify-between">
                  <span className="truncate flex-1 mr-2">
                    {item.product.name}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>
                    Rs. {Number(item.unitPrice).toLocaleString()} × {item.quantity}
                  </span>
                  <span data-testid={`receipt-item-total-${index}`}>
                    Rs. {Number(item.totalPrice).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-2 border-gray-300" />
          
          {/* Totals */}
          <div className="mb-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span data-testid="text-receipt-subtotal">
                Rs. {Number(transaction.subtotal).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({taxRate}%):</span>
              <span data-testid="text-receipt-tax">
                Rs. {recalculatedTax.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL:</span>
              <span data-testid="text-receipt-total">
                Rs. {recalculatedTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Payment:</span>
              <span className="capitalize" data-testid="text-receipt-payment">
                {transaction.paymentMethod}
              </span>
            </div>
          </div>
          
          <Separator className="my-2 border-gray-300" />
          
          {/* Footer */}
          <div className="text-center text-xs">
            <p>Thank you for your business!</p>
            <p>Please keep this receipt for your records</p>
          </div>
        </div>
        
  {/* Action Buttons */}
  <div className="flex space-x-3 no-print">
          <Button
            type="button"
            onClick={handlePrint}
            className="flex-1"
            data-testid="button-print-receipt"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          {/* <Button
            type="button"
            variant="outline"
            onClick={handleEmail}
            data-testid="button-email-receipt"
            aria-label="Email receipt"
          >
            <Mail className="h-4 w-4" />
          </Button> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
