import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Play, Trash2 } from 'lucide-react';

interface HeldSale {
  id: string;
  createdAt: string;
  items: any[];
  customerId: string | null;
  paymentMethod: string;
}

interface HeldSalesModalProps {
  onRestore: (heldSale: HeldSale) => void;
  heldSales: HeldSale[];
  onUpdate: () => void;
}

export default function HeldSalesModal({ onRestore, heldSales, onUpdate }: HeldSalesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleRestore = (heldSale: HeldSale) => {
    onRestore(heldSale);
    // Remove from held sales
    try {
      const updated = heldSales.filter(h => h.id !== heldSale.id);
      localStorage.setItem('held:sales', JSON.stringify(updated));
      onUpdate();
    } catch (err) {
      console.error('Failed to remove held sale after restore', err);
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    try {
      const updated = heldSales.filter(h => h.id !== id);
      localStorage.setItem('held:sales', JSON.stringify(updated));
      onUpdate();
      toast({ title: 'Held sale deleted' });
    } catch (err) {
      console.error('Failed to delete held sale', err);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Held Sales ({heldSales.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Held Sales</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {heldSales.length === 0 ? (
            <p className="text-center text-muted-foreground">No held sales</p>
          ) : (
            heldSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">
                    {sale.items.length} item{sale.items.length !== 1 ? 's' : ''} - Rs. {sale.items.reduce((sum, it) => sum + it.totalPrice, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleRestore(sale)}>
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(sale.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}