/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { getOrderStatusLabel } from '@/lib/orderStatus';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from './AdminAsyncState';
import AdminPagination from './AdminPagination';

const ORDERS_PAGE_SIZE = 20;

type PaymentMethod = 'CARD' | 'DIRECT' | 'COD';
type PaymentStatus = 'PENDING' | 'APPROVED' | 'DISAPPROVED';

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  size?: string | null;
  color?: string | null;
}

interface AdminOrder {
  id: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  paymentIntentId?: string | null;
  receiptUrl?: string | null;
  directAccount?: string | null;
  subtotal: string | number;
  discountAmount: string | number;
  shippingCost: string | number;
  total: string | number;
  items: OrderItem[];
  promoCode?: {
    code: string;
    discountPercent: number;
  } | null;
  user?: {
    email: string | null;
    name: string | null;
  } | null;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [actionStatus, setActionStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [deliveryFilter, setDeliveryFilter] =
    useState<'ALL' | AdminOrder['status']>('ALL');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const response = await fetch('/api/orders?scope=all', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.data) {
          throw new Error(data.error || 'Failed to load orders');
        }
        const normalized = (data.data as AdminOrder[]).map((order) => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
        }));
        setOrders(normalized);
        if (normalized.length > 0) {
          setSelectedOrderId((prev) => prev ?? normalized[0].id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load orders';
        setLoadError(message);
        setActionStatus({
          type: 'error',
          message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderIdFilter && !order.id.toLowerCase().includes(orderIdFilter.toLowerCase())) {
        return false;
      }
      if (paymentFilter !== 'ALL' && order.paymentStatus !== paymentFilter) {
        return false;
      }
      if (deliveryFilter !== 'ALL' && order.status !== deliveryFilter) {
        return false;
      }
      return true;
    });
  }, [orders, orderIdFilter, paymentFilter, deliveryFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PAGE_SIZE,
    currentPage * ORDERS_PAGE_SIZE,
  );

  const activeOrderId = useMemo(() => {
    if (!paginatedOrders.length) return null;
    return paginatedOrders.some((order) => order.id === selectedOrderId)
      ? selectedOrderId
      : paginatedOrders[0].id;
  }, [paginatedOrders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => paginatedOrders.find((order) => order.id === activeOrderId) ?? null,
    [activeOrderId, paginatedOrders],
  );

  const resetSelectionDraft = () => {
    setActionStatus({ type: 'idle', message: '' });
    setNote('');
  };

  const selectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    resetSelectionDraft();
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    const amount = Number(value) || 0;
    return `Rs. ${amount.toFixed(2)}`;
  };

  const paidAmount = (order: AdminOrder) => {
    const total = Number(order.total) || 0;
    // For pre-paid methods (CARD, DIRECT), we display the total as the paid amount
    // since the user has already sent the funds (or card intent).
    if (order.paymentMethod === 'CARD' || order.paymentMethod === 'DIRECT') {
      return total;
    }
    
    // For COD, only show as paid if the admin has approved the payment (e.g. after delivery)
    if (order.paymentMethod === 'COD' && order.paymentStatus === 'APPROVED') {
      return total;
    }
    
    return 0;
  };

  const remainingAmount = (order: AdminOrder) => {
    // For pre-paid methods, nothing is ever collected on delivery
    if (order.paymentMethod === 'CARD' || order.paymentMethod === 'DIRECT') {
      return 0;
    }
    
    const total = Number(order.total);
    return Math.max(0, total - paidAmount(order));
  };

  const promoDiscountValue = (order: AdminOrder) => {
    if (!order.promoCode) return 0;
    const subtotal = Number(order.subtotal);
    return (subtotal * order.promoCode.discountPercent) / 100;
  };

  const shippingCostValue = (order: AdminOrder) => {
    const sCost = Number(order.shippingCost) || 0;
    if (sCost > 0) return sCost;
    
    // Fallback calculation for old orders: Total - (Subtotal - Discount)
    // Note: discountAmount in our DB currently only stores the promo discount
    const total = Number(order.total);
    const subtotal = Number(order.subtotal);
    const discount = Number(order.discountAmount);
    
    return Math.max(0, total - (subtotal - discount));
  };

  const renderActionControls = () => {
    if (!selectedOrder) {
      return null;
    }

    if (selectedOrder.status === 'COMPLETED') {
      return <p className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">Order has been delivered. No further changes are allowed.</p>;
    }
    if (selectedOrder.status === 'CANCELLED') {
      return <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">Order has been cancelled. No further changes are allowed.</p>;
    }

    const prepaidNeedsApproval =
      (selectedOrder.paymentMethod === 'DIRECT' || selectedOrder.paymentMethod === 'CARD') &&
      selectedOrder.paymentStatus !== 'APPROVED';
    const deliveryNeedsPayment =
      selectedOrder.status === 'SHIPPED' && selectedOrder.paymentStatus !== 'APPROVED';

    return (
      <div className="space-y-4">
        {selectedOrder.paymentStatus === 'PENDING' && (
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Payment decision</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusUpdate('APPROVED')}
                className="flex-1 min-w-[150px] rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {isUpdating ? 'Updating...' : selectedOrder.paymentMethod === 'COD' ? 'Record Payment Received' : 'Approve Payment'}
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusUpdate('DISAPPROVED')}
                className="flex-1 min-w-[150px] rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isUpdating ? 'Updating...' : 'Disapprove & Cancel'}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-purple-100 bg-purple-50/60 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-purple-700">Order lifecycle</p>
          <div className="flex flex-wrap gap-3">
            {selectedOrder.status === 'PENDING' && (
              <button
                type="button"
                disabled={isUpdating || prepaidNeedsApproval}
                onClick={() => handleOrderAction('CONFIRM')}
                className="flex-1 min-w-[170px] rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                title={prepaidNeedsApproval ? 'Approve prepaid payment first' : undefined}
              >
                {isUpdating ? 'Updating...' : 'Confirm Order'}
              </button>
            )}
            {selectedOrder.status === 'PAID' && (
              <button
                type="button"
                disabled={isUpdating || prepaidNeedsApproval}
                onClick={() => handleOrderAction('SHIP')}
                className="flex-1 min-w-[170px] rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Mark Shipped'}
              </button>
            )}
            {selectedOrder.status === 'SHIPPED' && (
              <button
                type="button"
                disabled={isUpdating || deliveryNeedsPayment}
                onClick={() => handleOrderAction('DELIVER')}
                className="flex-1 min-w-[170px] rounded-lg bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                title={deliveryNeedsPayment ? 'Record or approve payment first' : undefined}
              >
                {isUpdating ? 'Updating...' : 'Mark Delivered'}
              </button>
            )}
            {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'PAID') && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleOrderAction('CANCEL')}
                className="flex-1 min-w-[150px] rounded-lg border border-red-200 bg-white py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Cancel Order'}
              </button>
            )}
          </div>
          {(prepaidNeedsApproval || deliveryNeedsPayment) && (
            <p className="mt-3 text-xs font-semibold text-amber-700">Approve or record payment before moving to the next stage.</p>
          )}
        </section>
      </div>
    );
  };

  const handleStatusUpdate = async (status: PaymentStatus) => {
    if (!selectedOrder) return;
    if (status === 'DISAPPROVED' && !note.trim()) {
      setActionStatus({ type: 'error', message: 'Please provide a reason for disapproval.' });
      return;
    }

    try {
      setIsUpdating(true);
      setActionStatus({ type: 'idle', message: '' });

      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: status,
          adminNote: note.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.order) {
        throw new Error(data.error || 'Failed to update order');
      }
      if (status === 'DISAPPROVED') {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === data.order.id
              ? { ...data.order, items: Array.isArray(data.order.items) ? data.order.items : [] }
              : order,
          ),
        );
        setActionStatus({
          type: 'success',
          message: `Order disapproved successfully.${data.warning ? ` ${data.warning}` : ''}`,
        });
      } else {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === data.order.id
              ? { ...data.order, items: Array.isArray(data.order.items) ? data.order.items : [] }
              : order,
          ),
        );
        setActionStatus({
          type: 'success',
          message: `Order approved successfully.${data.warning ? ` ${data.warning}` : ''}`,
        });
      }
      setNote('');
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update order.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOrderAction = async (action: 'CONFIRM' | 'SHIP' | 'DELIVER' | 'CANCEL') => {
    if (!selectedOrder) return;
    if (action === 'CANCEL' && !note.trim()) {
      setActionStatus({ type: 'error', message: 'Please provide a cancellation reason in the admin note.' });
      return;
    }

    try {
      setIsUpdating(true);
      setActionStatus({ type: 'idle', message: '' });

      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: note.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.order) {
        throw new Error(data.error || 'Failed to update order status.');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.order.id
            ? { ...data.order, items: Array.isArray(data.order.items) ? data.order.items : [] }
            : order,
        ),
      );
      setActionStatus({
        type: 'success',
        message: `${action === 'CONFIRM'
          ? 'Order confirmed successfully.'
          : action === 'SHIP'
            ? 'Order marked as shipped.'
            : action === 'DELIVER'
              ? 'Order marked as delivered.'
              : 'Order cancelled successfully.'}${data.warning ? ` ${data.warning}` : ''}`,
      });
      setNote('');
    } catch (error) {
      setActionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update order.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <AdminLoadingState label="Loading orders..." />;
  }

  if (loadError && !orders.length) {
    return <AdminErrorState message={loadError} />;
  }

  if (!orders.length) {
    return (
      <AdminEmptyState
        title="No orders yet"
        description="Customer orders will appear here after checkout is completed."
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4 px-6 py-4 border-b border-gray-100 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search Order ID"
              value={orderIdFilter}
              onChange={(e) => {
                setOrderIdFilter(e.target.value);
                setPage(1);
                resetSelectionDraft();
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-500 hover:border-slate-400"
            />
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value as any);
                setPage(1);
                resetSelectionDraft();
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white outline-none transition-all hover:border-slate-400"
            >
              <option value="ALL">All payments</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DISAPPROVED">Disapproved</option>
            </select>
            <select
              value={deliveryFilter}
              onChange={(e) => {
                setDeliveryFilter(e.target.value as 'ALL' | AdminOrder['status']);
                setPage(1);
                resetSelectionDraft();
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white outline-none transition-all hover:border-slate-400"
            >
              <option value="ALL">All delivery statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <span className="text-sm text-gray-500">{filteredOrders.length} shown</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`cursor-pointer hover:bg-purple-50 ${activeOrderId === order.id ? 'bg-purple-50/70' : ''}`}
                    onClick={() => selectOrder(order.id)}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">#{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="font-medium text-gray-900">{order.shippingName}</div>
                      <div className="text-xs text-gray-500">{order.shippingEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{order.paymentMethod.toLowerCase()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.paymentStatus === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : order.paymentStatus === 'DISAPPROVED'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700'
                            : order.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'PAID'
                                ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={currentPage} pageSize={ORDERS_PAGE_SIZE} totalItems={filteredOrders.length} itemLabel="orders" onPageChange={(nextPage) => { setPage(nextPage); resetSelectionDraft(); }} />
      </div>

      {selectedOrder && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Order ID</p>
              <h3 className="text-lg font-bold text-gray-900 break-all">#{selectedOrder.id}</h3>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm text-gray-500">Placed on</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <section>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Customer</h4>
              <p className="text-gray-900 font-medium">{selectedOrder.shippingName}</p>
              <p className="text-sm text-gray-600">{selectedOrder.shippingEmail}</p>
              <p className="text-sm text-gray-600">{selectedOrder.shippingPhone}</p>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Shipping Address</h4>
              <p className="text-gray-600">
                {selectedOrder.shippingAddress}, {selectedOrder.shippingCity} {selectedOrder.shippingPostalCode}
              </p>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={`${item.id ?? index}-${item.name}`} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name}
                      {(item.size || item.color) && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({[item.size, item.color].filter(Boolean).join(', ')})
                        </span>
                      )}
                      {" "}× {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {promoDiscountValue(selectedOrder) > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Promo Discount ({selectedOrder.promoCode?.code})</span>
                  <span>-{formatCurrency(promoDiscountValue(selectedOrder))}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold text-gray-900">{formatCurrency(shippingCostValue(selectedOrder))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold text-gray-900">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Status</span>
                <span className="font-semibold text-gray-900">
                  {getOrderStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid Amount</span>
                <span className="font-semibold text-gray-900">{formatCurrency(paidAmount(selectedOrder))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining on Delivery</span>
                <span className="font-semibold text-gray-900">{formatCurrency(remainingAmount(selectedOrder))}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </section>

            {selectedOrder.receiptUrl && (
              <section>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Payment Receipt</h4>
                <div className="relative h-64 rounded-xl border border-gray-200 overflow-hidden cursor-pointer" onClick={() => setFullscreenImage(selectedOrder.receiptUrl || null)}>
                  <Image
                    src={selectedOrder.receiptUrl}
                    alt="Payment receipt"
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-contain hover:opacity-90 transition-opacity"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFullscreenImage(selectedOrder.receiptUrl || null)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-semibold mt-2 inline-block cursor-pointer"
                >
                  View full receipt
                </button>
              </section>
            )}

            <section>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add payment, cancellation, or internal note..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-500 hover:border-slate-400 resize-none"
              />
              {selectedOrder.adminNote && (
                <p className="text-xs text-gray-500 mt-2">
                  Last note: <span className="font-medium text-gray-700">{selectedOrder.adminNote}</span>
                </p>
              )}
            </section>
          </div>

          {actionStatus.type !== 'idle' && (
            <p
              className={`text-sm mb-3 ${
                actionStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {actionStatus.message}
            </p>
          )}

          {renderActionControls()}
        </div>
      )}

      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-4xl w-full h-[85vh] flex flex-col items-center">
            <button
              className="absolute -top-10 right-0 z-10 text-white hover:text-gray-300 font-bold text-xl"
              onClick={() => setFullscreenImage(null)}
            >
              Close
            </button>
            <Image
              src={fullscreenImage}
              alt="Full Payment Receipt"
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
