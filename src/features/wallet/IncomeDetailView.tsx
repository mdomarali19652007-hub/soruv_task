/**
 * IncomeDetailView — focused detail screen for a single income period.
 *
 * Layout:
 *   - top header (back arrow)
 *   - centered indigo circle with violet ring + stacked-coins icon
 *     and the BDT amount
 *   - title (Today / Yesterday / 7d / 30d / Total) + the timestamp
 *   - bottom pill: "< পেছনে যান" -> setView('finance')
 */
import { Coins } from 'lucide-react';
import { TopHeader } from '../../components/ui';
import type { View } from '../../types';

interface Props {
  title: string;
  amount: number;
  setView: (view: View) => void;
  onOpenSidebar?: () => void;
}

export function IncomeDetailView({ title, amount, setView, onOpenSidebar }: Props) {
  const now = new Date();
  return (
    <div className="min-h-screen pb-28 bg-gradient-to-b from-indigo-50 to-white">
      <TopHeader
        title="ইনকাম ডিটেইল"
        showBack
        onBack={() => setView('finance')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-10 flex flex-col items-center text-center">
        {/* Circular hero */}
        <div className="relative w-44 h-44 rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 ring-8 ring-violet-200/60 shadow-[0_24px_48px_-12px_rgba(99,102,241,0.55)] flex items-center justify-center">
          <span className="absolute inset-2 rounded-full border-2 border-white/40" />
          <div className="relative flex flex-col items-center text-white">
            <Coins className="w-10 h-10 mb-1" />
            <span className="text-2xl font-bold tabular-nums leading-tight">
              ৳ {amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <h1 className="mt-6 text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {now.toLocaleDateString()} • {now.toLocaleTimeString()}
        </p>

        <button
          type="button"
          onClick={() => setView('finance')}
          className="mt-10 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-sm hover:bg-slate-50 transition-all"
        >
          <span aria-hidden="true">‹</span>
          পেছনে যান
        </button>
      </main>
    </div>
  );
}
