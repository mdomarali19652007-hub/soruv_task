/**
 * Smart Shop (e-commerce) screen -- product grid, COD checkout, history.
 *
 * Phase 6 extraction from src/App.tsx. Preserves the same four
 * step machine (`list` / `submit` / `success` / `history`) and the
 * original mainBalance-debit-via-updateRow pattern (pre-existing
 * quirk tracked in the audit plan).
 */

import { useState } from 'react';
import { ArrowLeft, History, Info, ShoppingBag } from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import { generateTransactionId } from '../../utils/sanitize';
import type { Product, ProductOrder, UserProfile, View } from '../../types';

interface LastOrder {
  orderId: string;
  date: string;
  time: string;
  amount: number;
}

interface Props {
  user: Pick<UserProfile, 'id' | 'mainBalance'>;
  setView: (view: View) => void;
  products: Product[];
  productOrders: ProductOrder[];
  deliveryFee: number;
  handleSubmission: (action: () => Promise<void>, successMsg: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export function EcommerceView({
  user,
  setView,
  products,
  productOrders,
  deliveryFee,
  handleSubmission,
  insertRow,
  updateRow,
}: Props) {
  const [step, setStep] = useState<'list' | 'submit' | 'success' | 'history'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);

  const handleBuy = (product: Product) => {
    setSelectedProduct(product);
    setStep('submit');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Full name required');
      return;
    }
    if (!phone || phone.length < 11) {
      setError('Valid phone number required');
      return;
    }
    if (!address) {
      setError('Shipping address required');
      return;
    }
    if (!selectedProduct) return;

    if (user.mainBalance < deliveryFee) {
      setError(`Insufficient balance for advance delivery fee. Required: ৳ ${deliveryFee.toFixed(2)}`);
      return;
    }

    await handleSubmission(async () => {
      const orderData = {
        userId: user.id,
        userName: name,
        productId: selectedProduct.id,
        phone,
        address,
        amount: selectedProduct.price,
        deliveryFee,
        totalPaid: deliveryFee,
        paymentStatus: 'COD' as const,
        status: 'pending' as const,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        orderId: generateTransactionId('ORD'),
      };

      await updateRow('users', user.id, {
        mainBalance: -deliveryFee,
      });

      await insertRow('productOrders', orderData);

      setLastOrder({
        orderId: orderData.orderId,
        date: orderData.date,
        time: orderData.time,
        amount: orderData.amount,
      });
      setStep('success');
    }, 'Order placed successfully!');
  };

  if (step === 'success' && lastOrder && selectedProduct) {
    return (
      <SuccessView
        title="Order Success"
        subtitle="Your transaction has been verified"
        onClose={() => setStep('list')}
        colorClass="bg-emerald-500"
        details={[
          { label: 'Order ID', value: lastOrder.orderId },
          { label: 'Date & Time', value: `${lastOrder.date} | ${lastOrder.time}` },
          { label: 'Product', value: selectedProduct.name },
          { label: 'Amount Paid', value: `৳ ${lastOrder.amount.toFixed(2)}`, color: 'text-emerald-600' },
        ]}
      />
    );
  }

  if (step === 'submit') {
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('list')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Checkout</h2>
          </div>
          <div className="glass-card border-white/40 shadow-xl space-y-6">
            <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-900">{selectedProduct?.name}</h4>
                <p className="text-sm font-black text-slate-500">৳ {selectedProduct?.price.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Product Price (COD)</p>
                <p className="text-sm font-black text-indigo-600">Pay on Delivery</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Advance Delivery Fee</p>
                <p className="text-sm font-black text-rose-500">৳ {deliveryFee.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-900 uppercase">Balance Deduction</p>
                <p className="text-lg font-black text-rose-600">৳ {deliveryFee.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Phone Number</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Shipping Address</label>
              <textarea
                placeholder="Full Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner resize-none"
                rows={3}
              />
            </div>
            {error && <p className="text-[10px] font-bold text-rose-500 text-center">{error}</p>}
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
            >
              CONFIRM ORDER
            </button>

            <div className="mt-6 p-4 bg-pink-50/50 rounded-2xl border border-pink-100">
              <h4 className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-3">Shopping Rules</h4>
              <ul className="space-y-2">
                <li className="text-[9px] text-rose-600 font-black flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1 shrink-0" />
                  Mandatory ৳ {deliveryFee} advance delivery fee applies to all orders.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-pink-400 rounded-full mt-1 shrink-0" />
                  Orders are processed within 24-48 hours.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-pink-400 rounded-full mt-1 shrink-0" />
                  Delivery charges are non-refundable once processed.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-pink-400 rounded-full mt-1 shrink-0" />
                  No returns after product is shipped.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'history') {
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('list')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Order History</h2>
          </div>
          <div className="space-y-4">
            {productOrders.filter((o) => o.userId === user.id).length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No orders yet</p>
              </div>
            ) : (
              productOrders
                .filter((o) => o.userId === user.id)
                .map((o) => {
                  const product = products.find((p) => p.id === o.productId);
                  return (
                    <div key={o.id} className="glass-card border-white/40 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{product?.name || 'Product'}</p>
                          <p className="text-[8px] text-slate-400 uppercase font-bold">{o.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">৳ {o.amount}</p>
                        {o.paymentStatus === 'COD' && (
                          <p className="text-[7px] font-black text-rose-500 uppercase mb-1">COD</p>
                        )}
                        <span
                          className={`text-[7px] font-black uppercase px-2 py-1 rounded-full ${
                            o.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-600'
                              : o.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-600'
                                : o.status === 'processing'
                                  ? 'bg-indigo-100 text-indigo-600'
                                  : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('home')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Smart Shop</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('history')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <History className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="glass-card border-rose-100 bg-rose-50/30 mb-6 p-4">
          <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Info className="w-3 h-3" />
            Shopping Rules
          </h3>
          <p className="text-[9px] text-slate-600 font-bold leading-relaxed">
            প্রতিটি অর্ডারের জন্য ৳ {deliveryFee} অগ্রিম ডেলিভারি চার্জ আপনার ব্যালেন্স থেকে কেটে নেওয়া হবে। প্রোডাক্টের দাম ডেলিভারি ম্যানকে ক্যাশ অন ডেলিভারি (COD) হিসেবে দিতে হবে।
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {products.length === 0 ? (
            <div className="col-span-2 text-center py-20">
              <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No products available</p>
            </div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="glass-card border-white/40 shadow-lg overflow-hidden flex flex-col p-0">
                {p.image && <img src={p.image} alt={p.name} className="w-full h-28 object-cover" />}
                <div className="p-3 flex flex-col flex-1 gap-1">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase line-clamp-2 flex-1">{p.name}</h4>
                    {p.category && (
                      <span className="text-[7px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap">
                        {p.category}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-[8px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{p.description}</p>
                  )}
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-bold text-slate-400 uppercase">Sell Price</span>
                      <span className="text-xs font-black text-indigo-600">৳ {p.price.toFixed(0)}</span>
                    </div>
                    {p.resellPrice && p.resellPrice > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-bold text-slate-400 uppercase">Resell Price</span>
                        <span className="text-[10px] font-black text-emerald-600">৳ {p.resellPrice.toFixed(0)}</span>
                      </div>
                    )}
                    {(p.profitPerUnit ?? 0) > 0 && (
                      <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-2 py-1">
                        <span className="text-[7px] font-black text-emerald-600 uppercase">Profit/Unit</span>
                        <span className="text-[10px] font-black text-emerald-700">৳ {(p.profitPerUnit ?? 0).toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                  {p.variants && (
                    <p className="text-[7px] text-slate-400 font-bold mt-0.5">
                      <span className="text-slate-500">Variants:</span> {p.variants}
                    </p>
                  )}
                  {p.quantityOptions && (
                    <p className="text-[7px] text-slate-400 font-bold">
                      <span className="text-slate-500">Qty:</span> {p.quantityOptions}
                    </p>
                  )}
                  <button
                    onClick={() => handleBuy(p)}
                    className="mt-2 w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-[8px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    BUY NOW
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
