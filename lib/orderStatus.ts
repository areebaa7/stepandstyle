export type StoredOrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
export type OrderStatusLabel = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export function getOrderStatusLabel(status: string): OrderStatusLabel | string {
  if (status === 'PENDING') return 'Pending';
  if (status === 'PAID') return 'Confirmed';
  if (status === 'SHIPPED') return 'Shipped';
  if (status === 'COMPLETED') return 'Delivered';
  if (status === 'CANCELLED') return 'Cancelled';
  return status;
}

export function getOrderStatusTone(status: string) {
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  if (status === 'SHIPPED') return 'info';
  if (status === 'PAID') return 'confirmed';
  return 'pending';
}
