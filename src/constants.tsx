/**
 * Shared constants used across App screens.
 *
 * Extracted from src/App.tsx. `INCOME_CARDS` and `SMM_SERVICES` embed
 * lucide-react icon JSX, so this file must be `.tsx`.
 *
 * NOTE: the audit report flags `INCOME_CARDS` as having duplicated
 * destinations (`folder-a`, `folder-d` etc.) which produce confusing
 * navigation. That de-duplication is intentionally out of scope for
 * this mechanical extraction; it will be handled in a follow-up PR
 * that also adds distinct sub-views.
 */

import {
  Briefcase,
  Facebook,
  Gamepad2,
  Globe,
  Key,
  Mail,
  Newspaper,
  PlayCircle,
  Send,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type { UserProfile } from './types';

// NOTE: These defaults are only used as a zero-state placeholder while the
// authenticated user's real profile is being hydrated from /api/me. Fields
// that would be misleading if rendered as if they were real data (numericId,
// referralLink, name/email/phone) are intentionally empty -- views must
// treat `numericId === ''` as "not loaded yet" and render a placeholder.
export const INITIAL_USER: UserProfile = {
  name: '',
  email: '',
  phone: '',
  country: 'Bangladesh',
  age: 0,
  referralCode: '',
  id: '',
  numericId: '',
  rank: 'Bronze',
  mainBalance: 0.0,
  totalEarned: 0.0,
  pendingPayout: 0.0,
  referralLink: '',
  gen1Count: 0,
  dailyClaimed: false,
  notifications: [],
  taskHistory: [],
  achievements: [
    { id: '1', title: 'First Task', progress: 0, goal: 1 },
    { id: '2', title: 'Team Builder', progress: 0, goal: 10 },
  ],
  adWatches: [],
  isActive: false,
  activationDate: '',
  activationExpiry: '',
  referralActiveCount: 0,
  status: 'active',
  restrictionReason: '',
  suspensionUntil: '',
  totalCommission: 0.0,
  socialSubmissions: [],
};

export const INCOME_CARDS = [
  { title: 'TOP NEWS', icon: <Newspaper className="w-6 h-6" />, color: 'from-blue-600 to-indigo-700', view: 'top-news' },
  { title: 'Daily Job', icon: <Briefcase className="w-6 h-6" />, color: 'from-cyan-500 to-blue-500', view: 'folder-a' },
  { title: 'Fb Marketing', icon: <Facebook className="w-6 h-6" />, color: 'from-blue-600 to-indigo-600', view: 'folder-b' },
  { title: 'Gmail Sell', icon: <Mail className="w-6 h-6" />, color: 'from-red-500 to-orange-500', view: 'folder-c' },
  { title: 'Ads Earn', icon: <PlayCircle className="w-6 h-6" />, color: 'from-emerald-500 to-teal-500', view: 'ads-earn' },
  { title: 'Mobile Banking', icon: <Smartphone className="w-6 h-6" />, color: 'from-indigo-500 to-blue-600', view: 'mobile-banking' },
  { title: 'BUY SELL', icon: <Key className="w-6 h-6" />, color: 'from-rose-500 to-pink-600', view: 'otp-buy-sell' },
  { title: 'Network Marketing', icon: <Users className="w-6 h-6" />, color: 'from-purple-500 to-pink-500', view: 'folder-d' },
  { title: 'Micro Tasks', icon: <Smartphone className="w-6 h-6" />, color: 'from-emerald-500 to-teal-500', view: 'folder-a' },
  { title: 'Asset Trading', icon: <TrendingUp className="w-6 h-6" />, color: 'from-amber-500 to-orange-600', view: 'folder-c' },
  { title: 'Team Bonus', icon: <Users className="w-6 h-6" />, color: 'from-indigo-500 to-purple-600', view: 'folder-d' },
  { title: 'Premium Jobs', icon: <ShieldCheck className="w-6 h-6" />, color: 'from-yellow-400 to-amber-600', view: 'folder-a' },
  { title: 'E-commerce', icon: <ShoppingBag className="w-6 h-6" />, color: 'from-pink-500 to-rose-600', view: 'ecommerce' },
  { title: 'SOCIAL', icon: <Users className="w-6 h-6" />, color: 'from-indigo-500 to-blue-600', view: 'social-hub' },
  { title: 'SMM & BOOSTING', icon: <Zap className="w-6 h-6" />, color: 'from-yellow-400 to-orange-500', view: 'subscription-boosting' },
  { title: 'GAMING', icon: <Gamepad2 className="w-6 h-6" />, color: 'from-violet-500 to-purple-600', view: 'gaming' },
];

export const SMM_SERVICES = [
  { id: 'fb-like', name: 'Facebook Likes', pricePer1k: 50, icon: <Facebook className="w-5 h-5" />, min: 100, tag: 'Popular', color: 'from-blue-500 to-blue-700' },
  { id: 'fb-star', name: 'Facebook Stars', pricePer1k: 5000, icon: <Sparkles className="w-5 h-5" />, min: 10, tag: 'Premium', color: 'from-amber-400 to-orange-600' },
  { id: 'fb-follow', name: 'Facebook Page Follow', pricePer1k: 200, icon: <Users className="w-5 h-5" />, min: 100, tag: 'High Quality', color: 'from-indigo-500 to-purple-700' },
  { id: 'tg-member', name: 'Telegram Members', pricePer1k: 150, icon: <Send className="w-5 h-5" />, min: 100, tag: 'Fast Start', color: 'from-sky-400 to-blue-600' },
  { id: 'tg-view', name: 'Telegram Channel Views', pricePer1k: 30, icon: <Globe className="w-5 h-5" />, min: 100, tag: 'Best Value', color: 'from-emerald-400 to-teal-600' },
  { id: 'tg-star', name: 'Telegram Stars', pricePer1k: 4500, icon: <Sparkles className="w-5 h-5" />, min: 10, tag: 'New', color: 'from-violet-500 to-fuchsia-700' },
];
