/**
 * AgentServicesView — destination of the new center-floating bottom
 * tab introduced by the competitor-aligned restructure.
 *
 * Layout:
 *   - TopHeader (hamburger -> sidebar)
 *   - title + subtitle
 *   - 2x2 grid of large white tiles, each with a coloured border:
 *       1. E-commerce       -> setView('ecommerce')
 *       2. Drive Pack       -> setView('drive-offer')
 *       3. Ticket Agent     -> "Coming soon" pill
 *       4. Delivery Partner -> "Coming soon" pill
 */
import {
  Bike,
  ShoppingBag,
  Ticket,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { TopHeader } from '../../components/ui';
import type { View } from '../../types';

interface ServiceTile {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  borderClass: string;
  iconClass: string;
  destination: View | null;
}

const TILES: ServiceTile[] = [
  {
    key: 'ecommerce',
    label: 'ই-কমার্স',
    description: 'প্রোডাক্ট রিসেল করে ইনকাম',
    icon: ShoppingBag,
    borderClass: 'border-pink-200 hover:border-pink-400',
    iconClass: 'from-pink-500 to-fuchsia-600',
    destination: 'ecommerce',
  },
  {
    key: 'drive',
    label: 'ড্রাইভ প্যাক',
    description: 'গাড়ি / বাইক অফার',
    icon: Bike,
    borderClass: 'border-orange-200 hover:border-orange-400',
    iconClass: 'from-orange-500 to-amber-500',
    destination: 'drive-offer',
  },
  {
    key: 'ticket',
    label: 'টিকিট এজেন্ট',
    description: 'বাস / ট্রেন টিকিটিং',
    icon: Ticket,
    borderClass: 'border-indigo-200 hover:border-indigo-400',
    iconClass: 'from-indigo-500 to-violet-600',
    destination: null,
  },
  {
    key: 'delivery',
    label: 'ডেলিভারি পার্টনার',
    description: 'লোকাল ডেলিভারি সার্ভিস',
    icon: Truck,
    borderClass: 'border-emerald-200 hover:border-emerald-400',
    iconClass: 'from-emerald-500 to-teal-600',
    destination: null,
  },
];

interface Props {
  setView: (view: View) => void;
  onOpenSidebar?: () => void;
}

export function AgentServicesView({ setView, onOpenSidebar }: Props) {
  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="এজেন্ট সার্ভিস"
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-6">
        <header className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-900">আমাদের এজেন্ট সার্ভিসসমূহ</h1>
          <p className="text-sm text-slate-600 mt-1">
            যেকোনো একটি বেছে নিয়ে এজেন্ট হিসেবে কাজ শুরু করুন
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            const comingSoon = tile.destination === null;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => {
                  if (tile.destination) setView(tile.destination);
                }}
                disabled={comingSoon}
                className={`relative aspect-[1/1] flex flex-col items-center justify-center text-center gap-2 p-4 rounded-2xl bg-white border-2 ${tile.borderClass} shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-90 disabled:cursor-not-allowed`}
              >
                <span
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tile.iconClass} text-white inline-flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-6 h-6" />
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight">
                  {tile.label}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {tile.description}
                </span>
                {comingSoon && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold tracking-wider uppercase">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}


