'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { formatPKR } from '@/lib/currency';
import { notifyAuthState } from '@/lib/authState.client';
import { getOrderStatusLabel } from '@/lib/orderStatus';

type Tab = 'overview' | 'orders' | 'addresses' | 'security';

type Customer = {
  id: string;
  email: string;
  name: string | null;
  role: 'USER';
  emailVerified: boolean;
  createdAt: string;
};

type OrderItem = {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  size?: string | null;
  color?: string | null;
};

type Order = {
  id: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string | null;
  items: OrderItem[];
  createdAt: string;
};

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  postalCode: string | null;
  isDefault: boolean;
};

const emptyAddress = {
  label: 'Home',
  fullName: '',
  phone: '',
  address: '',
  city: '',
  region: '',
  postalCode: '',
  isDefault: false,
};

function statusClasses(status: string) {
  if (['COMPLETED', 'APPROVED', 'PAID'].includes(status)) return 'bg-green-100 text-green-700';
  if (['CANCELLED', 'DISAPPROVED'].includes(status)) return 'bg-red-100 text-red-700';
  if (status === 'SHIPPED') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

export default function CustomerAccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState({ name: '', email: '', currentPassword: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAccount = async () => {
    try {
      const [meResponse, ordersResponse, addressesResponse] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/orders', { cache: 'no-store' }),
        fetch('/api/account/addresses', { cache: 'no-store' }),
      ]);
      const mePayload = await meResponse.json();
      if (!meResponse.ok || mePayload.user?.role !== 'USER') {
        router.replace('/');
        return;
      }

      const ordersPayload = await ordersResponse.json();
      const addressesPayload = await addressesResponse.json();
      const nextCustomer = mePayload.user as Customer;
      setCustomer(nextCustomer);
      setProfile({ name: nextCustomer.name || '', email: nextCustomer.email, currentPassword: '' });
      if (ordersResponse.ok) setOrders(ordersPayload.data || []);
      if (addressesResponse.ok) setAddresses(addressesPayload.addresses || []);
    } catch {
      setMessage({ type: 'error', text: 'Unable to load your account.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccount();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestOrder = orders[0];
  const pendingOrders = useMemo(
    () => orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status)).length,
    [orders],
  );

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save your profile.');
      setCustomer(payload.user);
      setProfile((current) => ({ ...current, currentPassword: '' }));
      setMessage({
        type: 'success',
        text: payload.emailChanged
          ? payload.verificationEmailSent
            ? 'Profile updated. Please verify your new email address.'
            : 'Profile updated. Email delivery must be configured before verification can be sent.'
          : 'Profile updated successfully.',
      });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save your profile.' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to change your password.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: payload.message });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to change your password.' });
    } finally {
      setSaving(false);
    }
  };

  const resendVerification = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to send verification email.');
      setMessage({ type: 'success', text: payload.message });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to send verification email.' });
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(
        editingAddressId ? `/api/account/addresses/${editingAddressId}` : '/api/account/addresses',
        {
          method: editingAddressId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressForm),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to save the address.');
      setAddressForm(emptyAddress);
      setEditingAddressId(null);
      const addressesResponse = await fetch('/api/account/addresses', { cache: 'no-store' });
      const addressesPayload = await addressesResponse.json();
      setAddresses(addressesPayload.addresses || []);
      setMessage({ type: 'success', text: 'Address saved successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save the address.' });
    } finally {
      setSaving(false);
    }
  };

  const editAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode || '',
      isDefault: address.isDefault,
    });
  };

  const deleteAddress = async (id: string) => {
    if (!window.confirm('Delete this saved address?')) return;
    const response = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) {
      setMessage({ type: 'error', text: payload.error || 'Unable to delete the address.' });
      return;
    }
    setAddresses((current) => current.filter((address) => address.id !== id));
    setMessage({ type: 'success', text: 'Address deleted.' });
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    notifyAuthState('signed-out');
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50"><Navbar /><p className="pt-40 text-center text-gray-500">Loading your account...</p></div>;
  }
  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-600">Customer account</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-950">Welcome, {customer.name || 'customer'}</h1>
            <p className="mt-2 text-sm text-gray-500">{customer.email}</p>
          </div>
          <button onClick={logout} className="self-start rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Sign out</button>
        </div>

        {!customer.emailVerified && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-amber-900">Verify your email address</p>
              <p className="text-sm text-amber-700">Verification secures your account and can connect eligible guest orders.</p>
            </div>
            <button disabled={saving} onClick={resendVerification} className="rounded-full bg-amber-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">Resend email</button>
          </div>
        )}

        {message && (
          <div className={`mb-6 rounded-xl border p-4 text-sm ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <nav className="h-fit rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            {([
              ['overview', 'Overview'],
              ['orders', `Orders (${orders.length})`],
              ['addresses', `Addresses (${addresses.length})`],
              ['security', 'Profile & security'],
            ] as Array<[Tab, string]>).map(([value, label]) => (
              <button
                key={value}
                onClick={() => { setTab(value); setMessage(null); }}
                className={`mb-1 w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${tab === value ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}
              >
                {label}
              </button>
            ))}
          </nav>

          <section className="min-w-0">
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <SummaryCard label="Total orders" value={String(orders.length)} />
                  <SummaryCard label="Active orders" value={String(pendingOrders)} />
                  <SummaryCard label="Saved addresses" value={String(addresses.length)} />
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-950">Latest order</h2>
                  {latestOrder ? (
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">#{latestOrder.id.slice(-8).toUpperCase()}</p>
                        <p className="mt-1 text-sm text-gray-500">{new Date(latestOrder.createdAt).toLocaleDateString()} · {formatPKR(latestOrder.total)}</p>
                      </div>
                      <span className={`self-start rounded-full px-3 py-1 text-xs font-bold ${statusClasses(latestOrder.status)}`}>{getOrderStatusLabel(latestOrder.status)}</span>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <p className="text-sm text-gray-500">You have not placed an account order yet.</p>
                      <Link href="/products" className="mt-4 inline-flex rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white">Start shopping</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-950">Order history</h2>
                {orders.length === 0 ? (
                  <p className="mt-5 text-sm text-gray-500">No orders are connected to this account yet.</p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {orders.map((order) => (
                      <article key={order.id} className="rounded-2xl border border-gray-200 p-5">
                        <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-gray-950">Order #{order.id.slice(-8).toUpperCase()}</p>
                            <p className="mt-1 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()} · {formatPKR(order.total)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(order.paymentStatus)}`}>Payment: {order.paymentStatus}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                          </div>
                        </button>
                        {expandedOrder === order.id && (
                          <div className="mt-5 border-t border-gray-100 pt-5">
                            <div className="space-y-3">
                              {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
                                <div key={`${item.id || 'item'}-${index}`} className="flex justify-between gap-4 text-sm">
                                  <span>{item.name || 'Product'} × {item.quantity || 1}{item.size ? ` · Size ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}</span>
                                  <span className="font-semibold">{formatPKR(Number(item.price || 0) * Number(item.quantity || 1))}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-5 grid gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                              <div><span className="font-semibold">Delivery:</span><br />{order.shippingName}<br />{order.shippingAddress}<br />{order.shippingCity}, {order.shippingRegion} {order.shippingPostalCode}</div>
                              <div className="space-y-1 sm:text-right">
                                <p>Subtotal: {formatPKR(order.subtotal)}</p>
                                <p>Discount: −{formatPKR(order.discountAmount)}</p>
                                <p>Shipping: {formatPKR(order.shippingCost)}</p>
                                <p className="font-bold">Total: {formatPKR(order.total)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'addresses' && (
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-950">{editingAddressId ? 'Edit address' : 'Add address'}</h2>
                  <form onSubmit={saveAddress} className="mt-5 space-y-3">
                    <Input label="Label" value={addressForm.label} onChange={(value) => setAddressForm((current) => ({ ...current, label: value }))} />
                    <Input label="Full name" value={addressForm.fullName} onChange={(value) => setAddressForm((current) => ({ ...current, fullName: value }))} />
                    <Input label="Phone" value={addressForm.phone} onChange={(value) => setAddressForm((current) => ({ ...current, phone: value }))} />
                    <Input label="Address" value={addressForm.address} onChange={(value) => setAddressForm((current) => ({ ...current, address: value }))} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="City" value={addressForm.city} onChange={(value) => setAddressForm((current) => ({ ...current, city: value }))} />
                      <Input label="Region / province" value={addressForm.region} onChange={(value) => setAddressForm((current) => ({ ...current, region: value }))} />
                    </div>
                    <Input label="Postal code (optional)" required={false} value={addressForm.postalCode} onChange={(value) => setAddressForm((current) => ({ ...current, postalCode: value }))} />
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))} />
                      Use as default address
                    </label>
                    <div className="flex gap-3">
                      <button disabled={saving} className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{editingAddressId ? 'Update' : 'Save'} address</button>
                      {editingAddressId && <button type="button" onClick={() => { setEditingAddressId(null); setAddressForm(emptyAddress); }} className="rounded-full border px-5 py-2 text-sm font-semibold">Cancel</button>}
                    </div>
                  </form>
                </div>
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <article key={address.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-950">{address.label}</h3>
                            {address.isDefault && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">Default</span>}
                          </div>
                          <p className="mt-3 text-sm leading-6 text-gray-600">{address.fullName}<br />{address.phone}<br />{address.address}<br />{address.city}, {address.region} {address.postalCode}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => editAddress(address)} className="text-sm font-semibold text-purple-600">Edit</button>
                          <button onClick={() => deleteAddress(address.id)} className="text-sm font-semibold text-red-500">Delete</button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {addresses.length === 0 && <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No saved addresses yet.</div>}
                </div>
              </div>
            )}

            {tab === 'security' && (
              <div className="grid gap-6 xl:grid-cols-2">
                <form onSubmit={saveProfile} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-950">Profile</h2>
                  <div className="mt-5 space-y-4">
                    <Input label="Full name" value={profile.name} onChange={(value) => setProfile((current) => ({ ...current, name: value }))} />
                    <Input label="Email" type="email" value={profile.email} onChange={(value) => setProfile((current) => ({ ...current, email: value }))} />
                    {profile.email !== customer.email && <Input label="Current password to change email" type="password" value={profile.currentPassword} onChange={(value) => setProfile((current) => ({ ...current, currentPassword: value }))} />}
                    <button disabled={saving} className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">Save profile</button>
                  </div>
                </form>
                <form onSubmit={changePassword} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-950">Change password</h2>
                  <div className="mt-5 space-y-4">
                    <Input label="Current password" type="password" value={passwords.currentPassword} onChange={(value) => setPasswords((current) => ({ ...current, currentPassword: value }))} />
                    <Input label="New password" type="password" value={passwords.newPassword} onChange={(value) => setPasswords((current) => ({ ...current, newPassword: value }))} />
                    <Input label="Confirm new password" type="password" value={passwords.confirmPassword} onChange={(value) => setPasswords((current) => ({ ...current, confirmPassword: value }))} />
                    <p className="text-xs text-gray-500">Use at least 8 characters with letters and numbers.</p>
                    <button disabled={saving} className="rounded-full bg-gray-950 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">Change password</button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p></div>;
}

function Input({ label, value, onChange, type = 'text', required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>;
}
