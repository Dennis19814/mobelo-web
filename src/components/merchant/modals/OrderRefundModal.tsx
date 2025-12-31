'use client';
import { logger } from '@/lib/logger'

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, DollarSign } from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  total: number;
  totalPaid: number;
  totalRefunded: number;
  currency: string;
  status: string;
  paymentStatus: string;
}

interface OrderRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onRefundSuccess: () => void;
}

export function OrderRefundModal({
  isOpen,
  onClose,
  order,
  onRefundSuccess
}: OrderRefundModalProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!order) return null;

  const maxRefundable = order.totalPaid - order.totalRefunded;
  const canRefund = maxRefundable > 0 && order.paymentStatus === 'paid';

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the refund',
        variant: 'destructive',
      });
      return;
    }

    const amount = refundType === 'full' ? undefined : parseFloat(refundAmount);

    if (refundType === 'partial') {
      if (!amount || amount <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid refund amount',
          variant: 'destructive',
        });
        return;
      }

      if (amount > maxRefundable) {
        toast({
          title: 'Error',
          description: `Refund amount cannot exceed ${maxRefundable} ${order.currency}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/proxy/orders/${order.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process refund');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Refund of ${result.payment.amount} ${order.currency} processed successfully`,
      });

      onRefundSuccess();
      onClose();

      // Reset form
      setRefundType('full');
      setRefundAmount('');
      setReason('');
    } catch (error) {
      logger.error('Refund error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process refund',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setRefundType('full');
      setRefundAmount('');
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Refund Order #{order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Process a refund for this order. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Order Total:</span>
                <div className="font-medium">{order.total} {order.currency}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                <div className="font-medium">{order.totalPaid} {order.currency}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Already Refunded:</span>
                <div className="font-medium">{order.totalRefunded} {order.currency}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Available to Refund:</span>
                <div className="font-medium text-green-600">{maxRefundable} {order.currency}</div>
              </div>
            </div>
          </div>

          {!canRefund && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {maxRefundable <= 0
                  ? 'This order has been fully refunded'
                  : 'This order cannot be refunded (payment not completed)'}
              </span>
            </div>
          )}

          {canRefund && (
            <>
              {/* Refund Type */}
              <div className="space-y-2">
                <Label htmlFor="refund-type">Refund Type</Label>
                <Select
                  value={refundType}
                  onValueChange={(value: 'full' | 'partial') => setRefundType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Refund ({maxRefundable} {order.currency})</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Partial Refund Amount */}
              {refundType === 'partial' && (
                <div className="space-y-2">
                  <Label htmlFor="refund-amount">Refund Amount ({order.currency})</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxRefundable}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`0.00 (max: ${maxRefundable})`}
                  />
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Refund</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for this refund..."
                  rows={3}
                  required
                />
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
          {canRefund && (
            <Button
              type="button"
              onClick={handleRefund}
              disabled={isLoading || !reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Processing...' : `Process ${refundType === 'full' ? 'Full' : 'Partial'} Refund`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}