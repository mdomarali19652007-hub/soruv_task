/**
 * WithdrawHistoryView — list of withdrawal requests filtered by status.
 *
 * Status tabs: pending | processing | successful | cancelled. The
 * underlying data only stores `pending | approved | rejected` so the
 * tabs map as follows:
 *   - pending      -> status === 'pending'
 *   - processing   -> status === 'pending' AND age < 24h (approximation)
 *   - successful   -> status === 'approved'
 *   - cancelled    -> status === 'rejected'
 *
 * Empty state uses the existing `EmptyState` primitive.
 */
import { useMemo, useState } from 'react';
import { Folder } from 'lucide-react';
import { EmptyState, StatusTabs, TopHeader } from '../../components/ui';
import type { View } from '../../types';

type Tab = 'pending' | 'processing' | 'successful' | 'cancelled';

interface WithdrawalRow {
  id: string;
  userId?: string;
  amount: number;
  receiveAmount?: number;
  fee?: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reason?: string;
}

interface Props {
  userId: string;
  withdrawals: WithdrawalRow[];
  setView: (view: View) => void;
  onOpenSidebar?: () => void;
}

export function WithdrawHistoryView({ userId, withdrawals, setView, onOpenSidebar }: Props) {
  const [active, setActive] = useState<Tab>('pending');

  const mine = useMemo(
    () => withdrawals.filter((w) => w.userId === userId),
    [withdrawals, userId],
  );

  const filtered = useMemo(() => {
    if (active === 'pending') return mine.filter((w) => w.status === 'pending');
    if (active === 'processing') {
      const day = 24 * 60 * 60 * 1000;
      return mine.filter((w) => {
        if (w.status !== 'pending') return false;
        const ts = Date.parse(w.date);
        return !Number.isNaN(ts) && Date.now() - ts < day;
      });
    }
    if (active === 'successful') return mine.filter((w) => w.status === 'approved');
    return mine.filter((w) => w.status === 'rejected');
  }, [mine, active]);

  const counts: Record<Tab, number> = {
    pending: mine.filter((w) => w.status === 'pending').length,
    processing: 0,
    successful: mine.filter((w) => w.status === 'approved').length,
    cancelled: mine.filter((w) => w.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="উইথড্র হিস্ট্রি"
        showBack
        onBack={() => setView('withdraw')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <StatusTabs<Tab>
          tabs={[
            { key: 'pending', label: 'পেন্ডিং', count: counts.pending },
            { key: 'processing', label: 'প্রসেসিং' },
            { key: 'successful', label: 'সফল', count: counts.successful },
            { key: 'cancelled', label: 'বাতিল', count: counts.cancelled },
          ]}
          active={active}
          onSelect={setActive}
        />

        {filtered.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={<Folder className="w-8 h-8" />}
              title="এই ক্যাটাগরিতে কোনো রিকোয়েস্ট নেই"
              description="অন্য একটি ট্যাব দেখুন বা নতুন রিকোয়েস্ট তৈরি করুন।"
            />
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((w) => (
              <li
                key={w.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-widest text-indigo-600 font-bold truncate">
                      {w.method}
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                      ৳ {w.amount.toFixed(2)}
                    </p>
                    {w.fee !== undefined && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        চার্জ: ৳ {w.fee.toFixed(2)} • প্রাপ্য: ৳{' '}
                        {(w.receiveAmount ?? w.amount - w.fee).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      w.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : w.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>{w.date}</span>
                  {w.reason && <span className="text-rose-600">কারণ: {w.reason}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
