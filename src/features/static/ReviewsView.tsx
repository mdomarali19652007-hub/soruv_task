/**
 * ReviewsView — static "Ratings & Reviews" page reachable from the
 * sidebar drawer. Holds placeholder testimonials so the route is
 * never blank; once an admin endpoint is added the same component can
 * render dynamic data.
 */
import { Star } from 'lucide-react';
import { Card, SectionHeader, TopHeader } from '../../components/ui';
import type { View } from '../../types';

interface Props {
  setView: (view: View) => void;
  onOpenSidebar?: () => void;
}

const REVIEWS = [
  {
    name: 'রহিম উদ্দিন',
    rating: 5,
    text: 'অসাধারণ একটি অ্যাপ। প্রতিদিন কাজ করে ভালো ইনকাম হচ্ছে।',
  },
  {
    name: 'সাবিনা ইয়াসমিন',
    rating: 5,
    text: 'উইথড্র খুব দ্রুত পাচ্ছি। সাপোর্ট টিম খুব হেল্পফুল।',
  },
  {
    name: 'কামাল হোসেন',
    rating: 4,
    text: 'ইউজার ইন্টারফেস খুব সুন্দর হয়েছে। আরো নতুন কাজ যোগ করলে ভালো হবে।',
  },
];

export function ReviewsView({ setView, onOpenSidebar }: Props) {
  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="রেটিং ও রিভিউ"
        showBack
        onBack={() => setView('home')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <Card padded>
          <SectionHeader title="ব্যবহারকারীদের মতামত" subtitle="সাম্প্রতিক রিভিউ" />
          <div className="space-y-3">
            {REVIEWS.map((r, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{r.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
