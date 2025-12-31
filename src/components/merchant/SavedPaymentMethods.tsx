'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Star, Trash2, Plus, RefreshCw } from 'lucide-react';

interface PaymentMethod {
  id: number;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardholderName?: string;
  isDefault: boolean;
  nickname?: string;
  createdAt: string;
}

interface SavedPaymentMethodsProps {
  userId: number;
}

export function SavedPaymentMethods({ userId }: SavedPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const { toast } = useToast();

  const loadPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/proxy/mobile-users/payment-methods', {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_TEST_API_KEY || '',
          'x-app-secret': process.env.NEXT_PUBLIC_TEST_APP_SECRET || '',
          'x-user-id': userId.toString(),
        },
      });

      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      } else {
        throw new Error('Failed to load payment methods');
      }
    } catch (error) {
      logger.error('Error loading payment methods:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleSetDefault = async (methodId: number) => {
    try {
      setSettingDefaultId(methodId);

      const response = await fetch(`/api/proxy/mobile-users/payment-methods/${methodId}/default`, {
        method: 'PATCH',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_TEST_API_KEY || '',
          'x-app-secret': process.env.NEXT_PUBLIC_TEST_APP_SECRET || '',
          'x-user-id': userId.toString(),
        },
      });

      if (response.ok) {
        await loadPaymentMethods(); // Reload to get updated data
        toast({
          title: 'Success',
          description: 'Default payment method updated',
        });
      } else {
        throw new Error('Failed to update default payment method');
      }
    } catch (error) {
      logger.error('Error setting default:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      toast({
        title: 'Error',
        description: 'Failed to update default payment method',
        variant: 'destructive',
      });
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDeleteConfirm = (method: PaymentMethod) => {
    setMethodToDelete(method);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!methodToDelete) return;

    try {
      setDeletingId(methodToDelete.id);

      const response = await fetch(`/api/proxy/mobile-users/payment-methods/${methodToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_TEST_API_KEY || '',
          'x-app-secret': process.env.NEXT_PUBLIC_TEST_APP_SECRET || '',
          'x-user-id': userId.toString(),
        },
      });

      if (response.ok) {
        await loadPaymentMethods(); // Reload to get updated data
        toast({
          title: 'Success',
          description: 'Payment method deleted',
        });
      } else {
        throw new Error('Failed to delete payment method');
      }
    } catch (error) {
      logger.error('Error deleting payment method:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
      setDeleteConfirmOpen(false);
      setMethodToDelete(null);
    }
  };

  const getCardBrandIcon = (brand?: string) => {
    // In a real app, you might want to use actual card brand icons
    const brandColors = {
      visa: 'text-orange-600',
      mastercard: 'text-orange-500',
      amex: 'text-green-600',
      discover: 'text-purple-600',
    };

    return (
      <CreditCard
        className={`h-5 w-5 ${brandColors[brand as keyof typeof brandColors] || 'text-gray-500'}`}
      />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Saved Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading payment methods...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Saved Payment Methods
              </CardTitle>
              <CardDescription>
                Manage saved payment methods for this user
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadPaymentMethods}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No Payment Methods
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                This user hasn't saved any payment methods yet.
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-1" />
                Add First Payment Method
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card</TableHead>
                    <TableHead>Cardholder</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getCardBrandIcon(method.cardBrand)}
                          <div>
                            <div className="font-medium">
                              {method.cardBrand?.toUpperCase()} •••• {method.cardLast4}
                            </div>
                            {method.nickname && (
                              <div className="text-sm text-gray-500">
                                {method.nickname}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {method.cardholderName || 'N/A'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {method.cardExpMonth && method.cardExpYear
                            ? `${method.cardExpMonth.toString().padStart(2, '0')}/${method.cardExpYear}`
                            : 'N/A'}
                        </div>
                      </TableCell>

                      <TableCell>
                        {method.isDefault ? (
                          <Badge variant="default" className="bg-green-600">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Secondary</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(method.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!method.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(method.id)}
                              disabled={settingDefaultId === method.id}
                            >
                              {settingDefaultId === method.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Star className="h-3 w-3" />
                              )}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConfirm(method)}
                            disabled={deletingId === method.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === method.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {methodToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {getCardBrandIcon(methodToDelete.cardBrand)}
                <div>
                  <div className="font-medium">
                    {methodToDelete.cardBrand?.toUpperCase()} •••• {methodToDelete.cardLast4}
                  </div>
                  {methodToDelete.cardholderName && (
                    <div className="text-sm text-gray-500">
                      {methodToDelete.cardholderName}
                    </div>
                  )}
                </div>
                {methodToDelete.isDefault && (
                  <Badge variant="default" className="bg-green-600 ml-auto">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingId !== null}
            >
              {deletingId !== null ? 'Deleting...' : 'Delete Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}