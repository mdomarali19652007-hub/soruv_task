/**
 * AboutView — static read-only "About us" page reachable from the
 * sidebar drawer. Composed entirely from existing UI primitives so it
 * is cheap to evolve into admin-driven content later.
 */
import { Heart, Sparkles, Users } from 'lucide-react';
import { Card, SectionHeader, TopHeader } from '../../components/ui';
import type { View } from '../../types';

interface Props {
  setView: (view: View) => void;
  onOpenSidebar?: () => void;
}

export function AboutView({ setView, onOpenSidebar }: Props) {
  return (
    <div className="min-h-screen pb-28">
      <TopHeader
        title="আমাদের সম্পর্কে"
        showBack
        onBack={() => setView('home')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <Card variant="gradient" glow padded>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-100/80">
                  About
                </p>
                <h1 className="text-xl font-bold leading-tight">Top Earning</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-indigo-100/90 leading-relaxed">
              Top Earning হলো বাংলাদেশের অন্যতম জনপ্রিয় সুপার অ্যাপ — যেখানে আপনি
              বিভিন্ন ক্যাটাগরির কাজ থেকে দৈনিক ইনকাম করতে পারেন।
            </p>
          </div>
        </Card>

        <Card padded>
          <SectionHeader title="আমাদের লক্ষ্য" />
          <div className="space-y-3 text-sm text-slate-700">
            <p className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <span>প্রতিটি ব্যবহারকারীকে সহজ ও নির্ভরযোগ্য আয়ের সুযোগ দেওয়া।</span>
            </p>
            <p className="flex items-start gap-2">
              <Users className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <span>বাংলাদেশের তরুণ প্রজন্মকে ডিজিটাল ইনকামে যুক্ত করা।</span>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
