/**
 * PrivacyView — static privacy policy page reachable from the sidebar
 * drawer. Content is illustrative; admin-driven content can replace
 * the constant below in a follow-up.
 */
import { Card, SectionHeader, TopHeader } from '../../components/ui';
import type { View } from '../../types';

interface Props {
  setView: (view: View) => void;
  onOpenSidebar?: () => void;
}

const SECTIONS = [
  {
    title: 'তথ্য সংগ্রহ',
    body:
      'আমরা শুধুমাত্র অ্যাকাউন্ট তৈরি, পেমেন্ট এবং সাপোর্ট পরিচালনার জন্য প্রয়োজনীয় ব্যক্তিগত তথ্য সংগ্রহ করি।',
  },
  {
    title: 'তথ্যের ব্যবহার',
    body:
      'সংগ্রহকৃত তথ্য তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করা হয় না। শুধুমাত্র সার্ভিস উন্নয়নের কাজে ব্যবহৃত হয়।',
  },
  {
    title: 'নিরাপত্তা',
    body:
      'সকল লেনদেন এনক্রিপ্টেড চ্যানেলে সম্পন্ন হয়। আপনার পাসওয়ার্ড সবসময় গোপন রাখুন।',
  },
];

export function PrivacyView({ setView, onOpenSidebar }: Props) {
  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="প্রাইভেসি পলিসি"
        showBack
        onBack={() => setView('home')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {SECTIONS.map((s) => (
          <Card key={s.title} padded>
            <SectionHeader title={s.title} />
            <p className="text-sm text-slate-700 leading-relaxed">{s.body}</p>
          </Card>
        ))}
      </main>
    </div>
  );
}
