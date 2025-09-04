import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Mail, X } from 'lucide-react';
import { ReceiptData } from '@/types/pos';

interface ReceiptModalProps {
  receiptData: ReceiptData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ receiptData, isOpen, onClose }: ReceiptModalProps) {
  const { transaction, storeName, storeAddress, storePhone, gstNumber, cashierName } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // Implementation for email receipt
    console.log('Email receipt functionality to be implemented');
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
      <DialogContent className="max-w-md no-print">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Receipt Preview</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-receipt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
              <span>Tax (17%):</span>
              <span data-testid="text-receipt-tax">
                Rs. {Number(transaction.tax).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>TOTAL:</span>
              <span data-testid="text-receipt-total">
                Rs. {Number(transaction.total).toLocaleString()}
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
            onClick={handlePrint}
            className="flex-1"
            data-testid="button-print-receipt"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button
            variant="outline"
            onClick={handleEmail}
            data-testid="button-email-receipt"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
