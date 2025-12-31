'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Edit3, Trash2, Plus, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Order {
  id: number;
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
  items: OrderItem[];
}

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onEditSuccess: () => void;
}

export function OrderEditModal({
  isOpen,
  onClose,
  order,
  onEditSuccess
}: OrderEditModalProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsToRemove, setItemsToRemove] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (order) {
      setItems([...order.items]);
      setItemsToRemove([]);
    }
  }, [order]);

  if (!order) return null;

  const canEdit = !['delivered', 'cancelled', 'refunded'].includes(order.status);

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, lineTotal: newQuantity * item.unitPrice }
        : item
    ));
  };

  const updateItemPrice = (itemId: number, newPrice: number) => {
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, unitPrice: newPrice, lineTotal: item.quantity * newPrice }
        : item
    ));
  };

  const removeItem = (itemId: number) => {
    setItems(items.filter(item => item.id !== itemId));
    if (!itemsToRemove.includes(itemId)) {
      setItemsToRemove([...itemsToRemove, itemId]);
    }
  };

  const calculateNewTotal = () => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const getAdjustmentAmount = () => {
    return calculateNewTotal() - order.total;
  };

  const hasChanges = () => {
    if (itemsToRemove.length > 0) return true;

    return items.some(item => {
      const originalItem = order.items.find(orig => orig.id === item.id);
      if (!originalItem) return true; // New item
      return originalItem.quantity !== item.quantity || originalItem.unitPrice !== item.unitPrice;
    });
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      toast({
        title: 'No Changes',
        description: 'No modifications were made to the order',
        variant: 'default',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare modification data
      const itemsToUpdate = items
        .filter(item => {
          const originalItem = order.items.find(orig => orig.id === item.id);
          return originalItem && (
            originalItem.quantity !== item.quantity ||
            originalItem.unitPrice !== item.unitPrice
          );
        })
        .map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));

      const modifications = {
        itemsToRemove: itemsToRemove.length > 0 ? itemsToRemove : undefined,
        itemsToUpdate: itemsToUpdate.length > 0 ? itemsToUpdate : undefined,
      };

      const response = await fetch(`/api/proxy/orders/${order.id}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modifications),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update order');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Order has been updated successfully',
      });

      onEditSuccess();
      onClose();
    } catch (error) {
      logger.error('Order update error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setItems(order ? [...order.items] : []);
      setItemsToRemove([]);
      onClose();
    }
  };

  const adjustmentAmount = getAdjustmentAmount();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Order #{order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Modify order items. Changes will recalculate the order total.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!canEdit && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                This order cannot be modified due to its current status: {order.status}
              </span>
            </div>
          )}

          {canEdit && (
            <>
              {/* Order Items Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24">Quantity</TableHead>
                      <TableHead className="w-32">Unit Price</TableHead>
                      <TableHead className="w-32">Line Total</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">ID: {item.productId}</div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {item.lineTotal.toFixed(2)} {order.currency}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No items in this order
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Original Total</div>
                  <div className="font-medium">{order.total.toFixed(2)} {order.currency}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">New Total</div>
                  <div className="font-medium">{calculateNewTotal().toFixed(2)} {order.currency}</div>
                </div>
                {adjustmentAmount !== 0 && (
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Adjustment</div>
                    <div className={`font-medium ${adjustmentAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {adjustmentAmount > 0 ? '+' : ''}{adjustmentAmount.toFixed(2)} {order.currency}
                    </div>
                    {adjustmentAmount > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Customer will need to pay additional amount
                      </div>
                    )}
                    {adjustmentAmount < 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Customer will receive a refund for the difference
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {canEdit && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !hasChanges()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}