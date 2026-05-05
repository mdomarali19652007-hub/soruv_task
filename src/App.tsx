import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import {
  User,
  Wallet,
  TrendingUp,
  Users,
  Globe,
  ArrowLeft,
  History,
  CheckCircle,
  CheckCircle2,
  LogOut,
  Briefcase,
  Facebook,
  Mail,
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  PlayCircle,
  HelpCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Smartphone,
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  MessageCircle,
  MessageSquare,
  Trophy,
  Bell,
  X,
  Send,
  Settings,
  Wifi,
  Check,
  Award,
  Camera,
  Key,
  Zap,
  Image as ImageIcon,
  Upload,
  Loader2,
  Megaphone,
  RefreshCw,
  Activity,
  ShoppingBag,
  Package,
  Copy,
  Newspaper,
  Heart,
  Share2,
  ThumbsUp,
  Gift,
  Music,
  Keyboard,
  Instagram,
  Youtube,
  Bot,
  Video,
  Search,
  UserX,
  Sparkles,
  Gamepad2,
  Info,
  Trash2,
  Menu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from './lib/supabase';
import {
  insertRow,
  updateRow,
  upsertRow,
  getRow,
  getRows,
  deleteRow,
  incrementField,
  incrementFields,
  subscribeToTable,
  subscribeToRow,
  uploadFile,
  submitWithdrawal,
  processWithdrawal,
  processDeposit,
  activateAccount,
  claimDailyReward,
  processSpin
} from './lib/database';
import { adminInsert, adminUpdate, adminDelete, adminUpsert, adminIncrement, adminIncrementFields, adminGetRow } from './lib/admin-api';
import { isOnAdminHost, getConfiguredAdminHostname } from './lib/admin-host';
import { sanitizeAndTrim, isValidMobileWallet, sanitizeAccountNumber, generateTransactionId } from './utils/sanitize';
import {
  authClient,
  signIn,
  signUp,
  signOut,
  useSession,
  registerWithReferral,
  createGoogleProfile,
  validateReferralCode,
  isReferralRequired,
  requestPasswordReset,
  fetchMyProfile,
  completeOauthTransferIfNeeded,
} from './lib/auth-client';
import { ResetPasswordView } from './features/auth/ResetPasswordView';
import { EmailVerificationOverlay } from './features/auth/EmailVerificationOverlay';

// --- Types, constants and utilities extracted into dedicated modules ---
// See src/types.ts, src/constants.tsx, src/utils/db-errors.ts, src/components/*
// and src/features/news/TopNewsView.tsx for the split modules. App.tsx is
// being reduced toward a thin composition root; the legacy names below are
// re-exported so the (still-large) body of this file keeps compiling.
import type {
  DbErrorInfo,
  DollarBuyRequest,
  DriveOffer,
  DriveOfferRequest,
  FirestoreErrorInfo,
  GlobalUpload,
  GmailSubmission,
  LudoSubmission,
  LudoTournament,
  MicrojobSubmission,
  NewsPost,
  Product,
  ProductOrder,
  RechargeRequest,
  SmmOrder,
  SocialSubmission,
  SubscriptionRequest,
  TaskSubmission,
  UserMessage,
  UserProfile,
  View,
} from './types';
import { OperationType } from './types';
import { INCOME_CARDS, INITIAL_USER, SMM_SERVICES } from './constants';
import {
  buildFirestoreErrorInfo,
  handleFirestoreError,
  handleListenerError,
} from './utils/db-errors';
import { SubmissionLoader as SharedSubmissionLoader } from './components/SubmissionLoader';
import { SuccessView as SharedSuccessView } from './components/SuccessView';
import { RestrictionScreen as SharedRestrictionScreen } from './components/RestrictionScreen';
import { WelcomeOverlay as SharedWelcomeOverlay } from './components/WelcomeOverlay';
import { TopNewsView as SharedTopNewsView } from './features/news/TopNewsView';
import { SpinView as SharedSpinView } from './features/spin/SpinView';
import { AdsEarnView as SharedAdsEarnView } from './features/ads/AdsEarnView';
import { AccountActivationView as SharedAccountActivationView } from './features/activation/AccountActivationView';
import { DashboardView as SharedDashboardView } from './features/dashboard/DashboardView';
import { MobileRechargeView as SharedMobileRechargeView } from './features/mobile-recharge/MobileRechargeView';
// AdminView is the largest single module in the project (~3100 lines
// + recharts). Loading it eagerly forces every consumer device to
// parse it on first paint, which is one of the main causes of the
// mobile main-thread stall measured on /home. Code-split it behind
// React.lazy so phones download / parse it only if/when the user
// actually opens the admin shell.
const AdminView = lazy(() =>
  import('./features/admin/AdminView').then((m) => ({ default: m.AdminView })),
);
import { AdminLoginView } from './features/admin/AdminLoginView';
import { DriveOfferView as SharedDriveOfferView } from './features/drive-offer/DriveOfferView';
import { ReferralView as SharedReferralView } from './features/referral/ReferralView';
import { FolderAView as SharedFolderAView } from './features/workstation/FolderAView';
import { FolderBView as SharedFolderBView } from './features/workstation/FolderBView';
import { FolderCView as SharedFolderCView } from './features/workstation/FolderCView';
import { FolderDView as SharedFolderDView } from './features/workstation/FolderDView';
import { SupportView as SharedSupportView } from './features/support/SupportView';
import { uploadMedia as sharedUploadMedia } from './lib/upload-media';
import { EcommerceView as SharedEcommerceView } from './features/ecommerce/EcommerceView';
import { DollarBuyView as SharedDollarBuyView } from './features/dollar/DollarBuyView';
import { DollarSellView as SharedDollarSellView } from './features/dollar/DollarSellView';
import { SocialJobView as SharedSocialJobView } from './features/social/SocialJobView';
import { LudoEarnView as SharedLudoEarnView } from './features/ludo/LudoEarnView';
import { SmmPanelView as SharedSmmPanelView } from './features/smm/SmmPanelView';
import { SubscriptionBoostingView as SharedSubscriptionBoostingView } from './features/smm/SubscriptionBoostingView';
import { FinanceView as SharedFinanceView } from './features/finance/FinanceView';
import { OtpBuySellView as SharedOtpBuySellView } from './features/otp-buy-sell/OtpBuySellView';
import { LeaderboardView as SharedLeaderboardView } from './features/leaderboard/LeaderboardView';
import { MobileBankingView as SharedMobileBankingView } from './features/mobile-banking/MobileBankingView';
import { GamingView as SharedGamingView } from './features/gaming/GamingView';
import { WorkStationView as SharedWorkStationView } from './features/workstation/WorkStationView';
import { SocialHubView as SharedSocialHubView } from './features/social/SocialHubView';
import { HomeView as RedesignedHomeView } from './features/home/HomeView';
import { WithdrawView as SharedWithdrawView } from './features/wallet/WithdrawView';
import { WithdrawHistoryView as SharedWithdrawHistoryView } from './features/wallet/WithdrawHistoryView';
import { IncomeDetailView as SharedIncomeDetailView } from './features/wallet/IncomeDetailView';
import {
  IncomeHistoryView as SharedIncomeHistoryView,
  BalanceHistoryView as SharedBalanceHistoryView,
  PaymentHistoryView as SharedPaymentHistoryView,
} from './features/wallet/HistoryViews';
import { AgentServicesView as SharedAgentServicesView } from './features/agent-services/AgentServicesView';
import { AboutView as SharedAboutView } from './features/static/AboutView';
import { ReviewsView as SharedReviewsView } from './features/static/ReviewsView';
import { PrivacyView as SharedPrivacyView } from './features/static/PrivacyView';
import { BottomNav, Sidebar as SharedSidebar, type BottomNavTab, type IncomePeriod } from './components/ui';
import {
  Home as HomeIcon,
  Briefcase as EarnIcon,
  Wallet as WalletIcon,
  Users as NetworkIcon,
  ShoppingBag as ProductIcon,
} from 'lucide-react';

// Silence unused-import warnings for types/utilities that may not be
// referenced yet in this file but are part of the public module surface
// kept for downstream splits.
void buildFirestoreErrorInfo;
void handleListenerError;
export type {
  DbErrorInfo,
  DollarBuyRequest,
  DriveOffer,
  DriveOfferRequest,
  FirestoreErrorInfo,
  GlobalUpload,
  GmailSubmission,
  LudoSubmission,
  LudoTournament,
  MicrojobSubmission,
  NewsPost,
  Product,
  ProductOrder,
  RechargeRequest,
  SmmOrder,
  SocialSubmission,
  SubscriptionRequest,
  TaskSubmission,
  UserMessage,
  UserProfile,
  View,
};

export default function App() {
  const [view, setView] = useState<View>(() => {
    // Password reset link lands on /reset-password?token=...
    // Admin panel has its own dedicated route at /admin AND a dedicated
    // admin subdomain (configured via VITE_ADMIN_HOSTNAME). When the
    // page is served from the admin subdomain we force the admin view
    // regardless of pathname so deep-links like
    // `admin.example.com/users` still land on the admin shell. See
    // [`src/lib/admin-host.ts`](src/lib/admin-host.ts:1).
    if (typeof window !== 'undefined') {
      if (isOnAdminHost()) return 'admin';
      if (window.location.pathname === '/reset-password') return 'reset-password';
      if (window.location.pathname === '/admin') return 'admin';
    }
    return 'login';
  });
  const [selectedSocialJob, setSelectedSocialJob] = useState<{ title: string, color: string, icon: any } | null>(null);
  const [financeStep, setFinanceStep] = useState<'form' | 'success' | 'deposit' | 'deposit-success'>('form');
  // Sidebar drawer (opened from the hamburger in TopHeader). Lives at
  // the App-shell level so it overlays every screen.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Selected income period -> drives `IncomeDetailView` content.
  const [incomeDetail, setIncomeDetail] = useState<{
    period: IncomePeriod;
    amount: number;
    title: string;
  } | null>(null);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRegistering, setIsRegistering] = useState(() => {
    // Auto-show registration form when visiting with a referral link (?ref=...)
    return !!new URLSearchParams(window.location.search).get('ref');
  });
  // Pre-fill referral code from ?ref= URL parameter (from shared referral links)
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    refCode: new URLSearchParams(window.location.search).get('ref') || '',
    country: 'Bangladesh',
    age: ''
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginAccepted, setLoginAccepted] = useState(false);
  const [regAccepted, setRegAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [globalNotice, setGlobalNotice] = useState('🔥 মো: সৌরভ ইসলাম: স্বাগতম Top Earning-তে! বাংলাদেশের সেরা ইনকাম সাইটে কাজ শুরু করুন আজই। 🔥');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [telegramLink, setTelegramLink] = useState('https://t.me/BDTKING999');
  const [facebookLink, setFacebookLink] = useState('https://facebook.com');
  const [whatsappLink, setWhatsappLink] = useState('https://wa.me/8801700000000');
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const [rulesText, setRulesText] = useState('Welcome to Top Earning! Please follow our rules.');
  const [smmPrices, setSmmPrices] = useState<{ [key: string]: number }>({});
  const [minWithdrawal, setMinWithdrawal] = useState(55);
  const [withdrawalFee, setWithdrawalFee] = useState(20); // 20% fee
  const [dollarBuyRate, setDollarBuyRate] = useState(125.00);
  const [dollarSellRate, setDollarSellRate] = useState(115.00);
  const [spinCost, setSpinCost] = useState(2.00);
  const [dailyReward, setDailyReward] = useState(1.00);
  const [activeFolders, setActiveFolders] = useState<string[]>(['folder-a', 'folder-b', 'folder-c', 'folder-d']);
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>(['spin', 'daily-claim', 'leaderboard', 'ads-earn']);
  const [enabledSmmServices, setEnabledSmmServices] = useState<string[]>(['fb-like', 'fb-star', 'fb-follow', 'tg-member', 'tg-view', 'tg-star', 'youtube-premium', 'meta-verified']);
  const [enabledCards, setEnabledCards] = useState<string[]>(INCOME_CARDS.map(c => c.title));
  const [adminGen1Rate, setAdminGen1Rate] = useState(20.00);
  const [adminGen2Rate, setAdminGen2Rate] = useState(5.00);
  const [adminGen3Rate, setAdminGen3Rate] = useState(2.00);
  const [activationFee, setActivationFee] = useState(25);
  const [rechargeCommissionRate, setRechargeCommissionRate] = useState(20); // ৳ 20 per 1000
  const [activationDuration, setActivationDuration] = useState(30);
  const [referralCommissionRate, setReferralCommissionRate] = useState(5);
  const [referralActivationBonus, setReferralActivationBonus] = useState(20);
  const [totalPaid, setTotalPaid] = useState(550000);
  const [activeWorkerCount, setActiveWorkerCount] = useState(12000);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allSocialSubmissions, setAllSocialSubmissions] = useState<SocialSubmission[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [withdrawals, setWithdrawals] = useState<{ id: string; amount: number; receiveAmount?: number; fee?: number; method: string; status: 'pending' | 'approved' | 'rejected'; date: string; reason?: string }[]>([]);
  const [dollarBuyRequests, setDollarBuyRequests] = useState<DollarBuyRequest[]>([]);
  const [gmailSubmissions, setGmailSubmissions] = useState<GmailSubmission[]>([]);
  const [microjobSubmissions, setMicrojobSubmissions] = useState<MicrojobSubmission[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [driveOffers, setDriveOffers] = useState<DriveOffer[]>([]);
  const [driveOfferRequests, setDriveOfferRequests] = useState<DriveOfferRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [ludoTournaments, setLudoTournaments] = useState<LudoTournament[]>([]);
  const [ludoSubmissions, setLudoSubmissions] = useState<LudoSubmission[]>([]);
  const [smmOrders, setSmmOrders] = useState<SmmOrder[]>([]);
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [allUploads, setAllUploads] = useState<GlobalUpload[]>([]);
  const [dynamicTasks, setDynamicTasks] = useState<{
    id: string;
    title: string;
    reward: number;
    desc: string;
    link: string;
    category: 'micro' | 'social' | 'gmail' | 'premium';
    createdAt?: string;
  }[]>([]);
  const [gmailPassword, setGmailPassword] = useState('');
  const [gmailReward, setGmailReward] = useState(10.00);
  const [adReward, setAdReward] = useState(0.40);
  const [dailyAdLimit, setDailyAdLimit] = useState(5);
  const [deliveryFee, setDeliveryFee] = useState(120);
  const [chatHistory, setChatHistory] = useState<{ text: string; isUser: boolean }[]>([
    { text: 'Hello! How can we help you today?', isUser: false }
  ]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState<'info' | 'freelance' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [lastWithdrawal, setLastWithdrawal] = useState<any>(null);
  const [lastDeposit, setLastDeposit] = useState<any>(null);

  // Three-dot menu on login/register view
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const authMenuRef = useRef<HTMLDivElement>(null);

  // Google OAuth: we require a referral code before creating the user
  // profile. If the OAuth flow completes without a pendingReferralCode,
  // we surface a modal asking the user to enter one. Sign-out bails.
  const [needsReferralCodePrompt, setNeedsReferralCodePrompt] = useState(false);
  const [refCodePromptValue, setRefCodePromptValue] = useState('');
  const [refCodePromptError, setRefCodePromptError] = useState<string | null>(null);
  const [refCodePromptSubmitting, setRefCodePromptSubmitting] = useState(false);
  // Extra fields collected by the post-OAuth profile completion modal
  // (name/phone/country) -- Google does not give us these, so when the
  // form was bypassed (or only partially filled before "Sign Up with
  // Google") we ask the user once before creating the Supabase row.
  const [profilePromptName, setProfilePromptName] = useState('');
  const [profilePromptPhone, setProfilePromptPhone] = useState('');
  const [profilePromptCountry, setProfilePromptCountry] = useState('Bangladesh');

  useEffect(() => {
    if (!showAuthMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (authMenuRef.current && !authMenuRef.current.contains(e.target as Node)) {
        setShowAuthMenu(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAuthMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showAuthMenu]);

  // DB-backed admin flag (seeded by supabase/migrations/20260419_admin_role.sql).
  // We retain a short legacy email allowlist so existing installs keep working
  // before the migration has been applied. Remove once every deployment is on
  // the new schema.
  const LEGACY_ADMIN_EMAILS = ['soruvislam51@gmail.com', 'shovonali885@gmail.com'];
  const isAdmin = user.isAdmin === true || LEGACY_ADMIN_EMAILS.includes(user.email);

  // --- Scroll to Top on View Change ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // --- Redirect authenticated users away from login view ---
  // Do NOT redirect when we are on the `/reset-password` flow; the user
  // may be logged in elsewhere and still need to complete the reset.
  useEffect(() => {
    if (isAuthReady && isLoggedIn && view === 'login' && !needsEmailVerification) {
      setView('home');
    }
  }, [isAuthReady, isLoggedIn, view, needsEmailVerification]);

  // --- /admin route guard ---
  // If the user lands on /admin but is not actually an admin (or auth has
  // resolved as logged-out), bounce them off the admin view and clear the
  // URL. This complements the in-component permission checks inside
  // AdminView itself.
  //
  // On a dedicated admin subdomain (`isOnAdminHost()`), failing this
  // guard also means the browser is on the wrong host entirely; we bounce
  // to the configured public site URL when one is available, otherwise
  // we just fall back to clearing the path.
  useEffect(() => {
    if (!isAuthReady) return;
    if (view !== 'admin') return;
    // On the dedicated admin subdomain, never bounce off 'admin' -- a
    // logged-out visitor should see the dedicated AdminLoginView, and a
    // non-admin gets a restriction message inside the admin shell.
    // Bouncing here would fight the host-lock effect below and either
    // loop or render nothing.
    if (isOnAdminHost()) return;
    if (!isLoggedIn || !isAdmin) {
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/admin') {
          window.history.replaceState({}, '', '/');
        }
      }
      setView(isLoggedIn ? 'home' : 'login');
    }
  }, [isAuthReady, isLoggedIn, isAdmin, view]);

  // --- Sync URL <-> view for the dedicated /admin route ---
  // The SPA does not use a router, so we manually mirror the admin view
  // to the /admin pathname (and clear it when navigating elsewhere) so
  // the page is bookmarkable and the browser back button behaves.
  //
  // On the admin subdomain we DO NOT push `/admin` -- the subdomain
  // itself implies the admin view, so the path stays at `/`. Clearing
  // the URL when leaving the admin view is also a no-op there because
  // every path on the admin host renders the admin shell anyway.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOnAdminHost()) return;
    const path = window.location.pathname;
    if (view === 'admin' && path !== '/admin') {
      window.history.pushState({}, '', '/admin');
    } else if (view !== 'admin' && view !== 'reset-password' && path === '/admin') {
      window.history.pushState({}, '', '/');
    }
  }, [view]);

  // --- Apex `/admin` -> admin subdomain redirect ---
  // When a dedicated admin host is configured (`VITE_ADMIN_HOSTNAME`),
  // visiting `/admin` on the apex domain bounces to that subdomain so
  // every admin session uses the same host (and therefore the same
  // CORS / cookie scope). Apex `/admin` keeps working as a fallback
  // when no admin host is configured.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOnAdminHost()) return;
    if (window.location.pathname !== '/admin') return;
    const adminHost = getConfiguredAdminHostname();
    if (!adminHost) return;
    const target = `${window.location.protocol}//${adminHost}/`;
    window.location.replace(target);
  }, []);

  // --- Browser back/forward support for /admin ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      // On the admin subdomain every path serves the admin shell, so
      // popstate never changes which view we render.
      if (isOnAdminHost()) {
        setView('admin');
        return;
      }
      const path = window.location.pathname;
      if (path === '/admin') {
        setView('admin');
      } else if (path === '/reset-password') {
        setView('reset-password');
      } else if (isLoggedIn) {
        setView('home');
      } else {
        setView('login');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isLoggedIn]);

  // --- Lock the admin subdomain to the admin view ---
  // When the browser is on the configured admin host (e.g.
  // `admin.example.com`), the only legitimate view is `'admin'`. If any
  // stray `setView(...)` call (e.g. a leaked bottom-nav click, a
  // deep-linked component, or future code paths) flips the view to a
  // consumer route, snap it back. This is a belt-and-braces guard --
  // the bottom nav gate and the early return both already prevent the
  // common cases, but this catches anything we missed.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isOnAdminHost()) return;
    if (view !== 'admin') setView('admin');
  }, [view]);

  // --- Mobile / touch detection ---
  // Drives `MotionConfig.reducedMotion` so framer-motion runs zero
  // animations on phones, tablets and any device that exposed a
  // coarse pointer. Together with the CSS overrides in `index.css`
  // (backdrop-filter / fixed gradient / infinite animations) this
  // gives mobile a 60+ FPS scroll instead of the previous ~10-15.
  const [isLowPower, setIsLowPower] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(
      '(max-width: 768px), (hover: none) and (pointer: coarse)',
    ).matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(
      '(max-width: 768px), (hover: none) and (pointer: coarse)',
    );
    const onChange = (e: MediaQueryListEvent) => setIsLowPower(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // --- Login Animation ---
  // Fire the welcome confetti exactly once per login (the transition
  // from logged-out -> logged-in). Without this gate, the previous
  // implementation re-fired confetti every time the user navigated
  // back to /home in the same session, which became annoying.
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (!isLoggedIn) {
      // Reset on logout so the next login re-arms the celebration.
      confettiFiredRef.current = false;
      return;
    }
    if (confettiFiredRef.current) return;
    if (view !== 'home') return;
    confettiFiredRef.current = true;
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#6366f1', '#a855f7'],
    });
  }, [isLoggedIn, view]);

  // --- Better Auth Session + Profile Hydration ---
  // NOTE: Since 20260419_rls_lockdown.sql revoked anon SELECT on `users`, we
  // can no longer read the current user's profile via supabase.from('users')
  // with the anon key. We now hydrate the profile from the server via
  // /api/me (service-role backed, scoped to the caller) and poll it to keep
  // balances and flags reasonably fresh without needing a signed Supabase
  // JWT bridge for realtime on the users table.
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    let currentHydratedUserId: string | null = null;
    let profilePollTimer: ReturnType<typeof setInterval> | null = null;

    const stopProfilePoll = () => {
      if (profilePollTimer) {
        clearInterval(profilePollTimer);
        profilePollTimer = null;
      }
    };

    const hydrateProfile = async (authUserId: string): Promise<UserProfile | null> => {
      const data = await fetchMyProfile<UserProfile>();
      if (data && data.id === authUserId) {
        setUser(data);
        return data;
      }
      return null;
    };

    // Poll Better Auth session to determine auth state
    const checkSession = async () => {
      try {
        // Recover from a half-finished OAuth round-trip. Clerk can leave
        // the in-flight signIn/signUp resource in `transferable` state
        // (e.g. when a brand-new email comes back from Google through
        // the sign-in flow, or vice versa). Without this transfer the
        // OAuth callback completes but no Clerk user/session is ever
        // created, the `user.created` webhook never fires and the
        // dashboard hard-bounces back to /login. See
        // src/lib/auth-client.ts#completeOauthTransferIfNeeded.
        await completeOauthTransferIfNeeded().catch(() => false);

        const sessionResult = await authClient.getSession();
        const session = sessionResult?.data;

        if (session?.user) {
          const authUser = session.user;
          setIsLoggedIn(true);
          // Email verification is enforced on the server via
          // `emailAndPassword.requireEmailVerification` in src/server/auth.ts
          // -- that flag is only true when EMAIL_ENABLED=true AND a real
          // email provider is wired up (RESEND_API_KEY, etc). The client
          // mirrors the decision via VITE_EMAIL_ENABLED so the overlay
          // only appears when we can actually deliver a verification email.
          // Default: disabled. Flip VITE_EMAIL_ENABLED=true (and the
          // matching server-side EMAIL_ENABLED=true) to reactivate the
          // verification gate.
          const emailGateEnabled =
            (import.meta.env.VITE_EMAIL_ENABLED as string | undefined)?.toLowerCase() === 'true';
          const needsVerification =
            emailGateEnabled &&
            (authUser as { emailVerified?: boolean }).emailVerified === false;
          setNeedsEmailVerification(Boolean(needsVerification));

          setView(prev => (prev === 'login' ? 'home' : prev));

          // Hydrate once for this session user; start a poll to pick up
          // balance/rank/activation changes made server-side.
          if (currentHydratedUserId !== authUser.id) {
            stopProfilePoll();
            currentHydratedUserId = authUser.id;

            // For Google OAuth users, ensure the app-level profile
            // exists before the first /api/me. We recover any data the
            // user typed on the registration form before being
            // redirected to Google -- both the legacy `pendingReferralCode`
            // key and the richer `pendingSignUpMetadata` blob written by
            // signUp.social. Whatever we find is forwarded to
            // /api/register/google-profile so the row can be created
            // with phone/country/age in one shot.
            const pendingRefCode = localStorage.getItem('pendingReferralCode');
            let pendingMeta: { name?: string; phone?: string; country?: string; age?: string; refCode?: string } = {};
            try {
              const raw = localStorage.getItem('pendingSignUpMetadata');
              if (raw) pendingMeta = JSON.parse(raw);
            } catch { /* ignore parse errors */ }
            const refCodeForProfile = pendingRefCode || pendingMeta.refCode || '';
            if (refCodeForProfile) {
              localStorage.removeItem('pendingReferralCode');
              localStorage.removeItem('pendingSignUpMetadata');
              await createGoogleProfile(refCodeForProfile, {
                name: pendingMeta.name,
                phone: pendingMeta.phone,
                country: pendingMeta.country,
                age: pendingMeta.age,
              }).catch(e => console.warn('Failed to create Google profile:', e));
            }

            // Hydrate. If the profile still does not exist, the OAuth
            // user has not yet provided a referral code (or the form
            // was skipped) -- surface the profile-completion prompt
            // instead of silently creating an orphan row. Prefill
            // whatever we already know from the pending metadata blob
            // and the Clerk user, so the user only has to fill what
            // is actually missing.
            const profile = await hydrateProfile(authUser.id);
            if (!profile) {
              const clerkUser = (typeof window !== 'undefined' ? window.Clerk?.user : undefined) as
                | { firstName?: string | null; lastName?: string | null; fullName?: string | null }
                | undefined;
              const fallbackName =
                pendingMeta.name ||
                clerkUser?.fullName ||
                [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
                authUser.name ||
                '';
              setProfilePromptName(fallbackName);
              setProfilePromptPhone(pendingMeta.phone || '');
              setProfilePromptCountry(pendingMeta.country || 'Bangladesh');
              setRefCodePromptValue(pendingMeta.refCode || pendingRefCode || '');
              setNeedsReferralCodePrompt(true);
            }

            // Light poll so the dashboard reflects server-side balance
            // changes without a full realtime channel.
            profilePollTimer = setInterval(() => {
              hydrateProfile(authUser.id).catch(() => { /* swallow */ });
            }, 15000);
            unsubs.push(stopProfilePoll);
          }
          setIsAuthReady(true);
        } else {
          stopProfilePoll();
          currentHydratedUserId = null;
          setIsLoggedIn(false);
          setView('login');
          setIsAuthReady(true);
        }
      } catch {
        setIsLoggedIn(false);
        setView('login');
        setIsAuthReady(true);
      }
    };

    checkSession();

    // Re-check session periodically (catches deleted users instantly)
    const sessionInterval = setInterval(checkSession, 60000);
    unsubs.push(() => clearInterval(sessionInterval));

    // Sync Global Settings - use defaults when settings row doesn't exist
    // NOTE: The settings row must be created via SQL migration or admin panel.
    // The anon role does not have INSERT permission on the settings table.
    const unsubSettings = subscribeToRow<any>('settings', 'global', (data) => {
      if (!data) {
        console.warn('Settings row not found. Using defaults. Run the schema.sql INSERT to create it.');
        return;
      }
      setGlobalNotice(data.globalNotice ?? '');
      setIsMaintenance(data.isMaintenance ?? false);
      setMinWithdrawal(data.minWithdrawal || 55);
      setWithdrawalFee(data.withdrawalFee || 20);
      setDollarBuyRate(data.dollarBuyRate || 125.00);
      setDollarSellRate(data.dollarSellRate || 115.00);
      setSpinCost(data.spinCost ?? 2);
      setDailyReward(data.dailyReward ?? 1);
      setActiveFolders(data.activeFolders?.length ? data.activeFolders : ['folder-a', 'folder-b', 'folder-c', 'folder-d']);
      setEnabledFeatures(data.enabledFeatures?.length ? data.enabledFeatures : ['spin', 'daily-claim', 'leaderboard', 'ads-earn']);
      setEnabledSmmServices(data.enabledSmmServices?.length ? data.enabledSmmServices : ['fb-like', 'fb-star', 'fb-follow', 'tg-member', 'tg-view', 'tg-star', 'youtube-premium', 'meta-verified']);
      setEnabledCards(data.enabledCards?.length ? data.enabledCards : INCOME_CARDS.map(c => c.title));
      setTotalPaid(data.totalPaid || 550000);
      setActiveWorkerCount(data.activeWorkerCount || 12000);
      setGmailPassword(data.gmailPassword ?? '');
      setGmailReward(data.gmailReward || 10.00);
      setAdReward(data.adReward ?? 0.40);
      setDailyAdLimit(data.dailyAdLimit ?? 5);
      setDeliveryFee(data.deliveryFee || 120);
      setAdminGen1Rate(data.gen1Rate || 20.00);
      setAdminGen2Rate(data.gen2Rate || 5.00);
      setAdminGen3Rate(data.gen3Rate || 2.00);
      setActivationFee(data.activationFee || 25);
      setRechargeCommissionRate(data.rechargeCommissionRate || 20);
      setActivationDuration(data.activationDuration || 30);
      setReferralCommissionRate(data.referralCommissionRate || 5);
      setReferralActivationBonus(data.referralActivationBonus || 20);
      setTelegramLink(data.telegramLink || 'https://t.me/BDTKING999');
      setFacebookLink(data.facebookLink || 'https://facebook.com');
      setWhatsappLink(data.whatsappLink || 'https://wa.me/8801700000000');
      setShowWelcomeAnimation(data.showWelcomeAnimation ?? true);
      setRulesText(data.rulesText || 'Welcome to Top Earning! Please follow our rules.');
      setSmmPrices(data.smmPrices || {});
    });
    unsubs.push(unsubSettings);

    // Sync all collection tables
    unsubs.push(subscribeToTable<any>('tasks', (rows) => setDynamicTasks(rows), { orderBy: { column: 'createdAt', ascending: false } }));
    unsubs.push(subscribeToTable<GmailSubmission>('gmailSubmissions', (rows) => setGmailSubmissions(rows)));
    unsubs.push(subscribeToTable<MicrojobSubmission>('microjobSubmissions', (rows) => setMicrojobSubmissions(rows)));
    unsubs.push(subscribeToTable<TaskSubmission>('taskSubmissions', (rows) => setTaskSubmissions(rows)));
    unsubs.push(subscribeToTable<SubscriptionRequest>('subscriptionRequests', (rows) => setSubscriptionRequests(rows)));
    unsubs.push(subscribeToTable<any>('withdrawals', (rows) => setWithdrawals(rows)));
    unsubs.push(subscribeToTable<DollarBuyRequest>('dollarBuyRequests', (rows) => setDollarBuyRequests(rows)));
    unsubs.push(subscribeToTable<UserMessage>('messages', (rows) => setUserMessages(rows)));
    unsubs.push(subscribeToTable<RechargeRequest>('rechargeRequests', (rows) => setRechargeRequests(rows)));
    unsubs.push(subscribeToTable<DriveOffer>('driveOffers', (rows) => setDriveOffers(rows)));
    unsubs.push(subscribeToTable<DriveOfferRequest>('driveOfferRequests', (rows) => setDriveOfferRequests(rows)));
    unsubs.push(subscribeToTable<Product>('products', (rows) => setProducts(rows)));
    unsubs.push(subscribeToTable<ProductOrder>('productOrders', (rows) => setProductOrders(rows)));
    unsubs.push(subscribeToTable<LudoTournament>('ludoTournaments', (rows) => setLudoTournaments(rows)));
    unsubs.push(subscribeToTable<LudoSubmission>('ludoSubmissions', (rows) => setLudoSubmissions(rows)));
    unsubs.push(subscribeToTable<SocialSubmission>('socialSubmissions', (rows) => setAllSocialSubmissions(rows)));
    unsubs.push(subscribeToTable<SmmOrder>('smmOrders', (rows) => setSmmOrders(rows)));
    unsubs.push(subscribeToTable<UserProfile>('users', (rows) => setAllUsers(rows)));
    unsubs.push(subscribeToTable<NewsPost>('newsPosts', (rows) => setNewsPosts(rows), { orderBy: { column: 'timestamp', ascending: false } }));
    unsubs.push(subscribeToTable<GlobalUpload>('uploads', (rows) => setAllUploads(rows), { orderBy: { column: 'timestamp', ascending: false } }));

    return () => unsubs.forEach(fn => fn());
  }, []);

  // --- Global Image Upload Handler ---
  const uploadImage = async (file: File, context: string = 'general'): Promise<string> => {
    // Use the current user from component state (authenticated via Better Auth)
    if (!user?.id) throw new Error('User not authenticated');
    const currentUser = { id: user.id };

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${currentUser.id}/${fileName}`;

    try {
      const url = await uploadFile(file, filePath);

      // Save to uploads table for admin tracking
      await insertRow('uploads', {
        userId: currentUser.id,
        userName: user.name,
        url,
        context,
        timestamp: Date.now(),
        date: new Date().toISOString()
      });

      return url;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'storage/uploads');
      return '';
    }
  };

  useEffect(() => {
    const handleGlobalFileChange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'file' && target.files && target.files.length > 0) {
        const file = target.files[0];
        if (!file.type.startsWith('image/')) return;

        let context = 'general';
        if (target.id.includes('task')) context = 'task';
        else if (target.id.includes('profile')) context = 'profile';
        else if (target.id.includes('microjob')) context = 'microjob';
        else if (target.closest('[data-context]')) {
          context = target.closest('[data-context]')?.getAttribute('data-context') || 'general';
        }

        if (target.hasAttribute('data-global-handled')) return;
        target.setAttribute('data-global-handled', 'true');

        try {
          const url = await uploadImage(file, context);

          if (context === 'profile' && user.id) {
            await updateRow('users', user.id, {
              profilePic: url
            });
          }

          window.dispatchEvent(new CustomEvent('global-upload-complete', {
            detail: { url, context, targetId: target.id }
          }));
        } catch (error) {
          console.error('Global upload failed:', error);
        } finally {
          target.removeAttribute('data-global-handled');
        }
      }
    };

    document.addEventListener('change', handleGlobalFileChange, true);
    return () => document.removeEventListener('change', handleGlobalFileChange, true);
  }, [user.name]);

  const handleEmailRegister = async () => {
    if (!regData.email || !regData.password || !regData.name || !regData.phone) {
      alert('Please fill all required fields.');
      return;
    }
    if (regData.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (!regAccepted) {
      alert('Please accept the rules to continue.');
      return;
    }
    // Referral code is required for every signup outside the very
    // first bootstrap account. Because the client cannot read the
    // users table directly (RLS lockdown), we ask the server via
    // /api/referral-required whether bootstrap mode applies.
    const trimmedRefCode = regData.refCode.trim();
    if (!trimmedRefCode) {
      const required = await isReferralRequired();
      if (required) {
        alert('Referral code is required. Please enter the code of the person who invited you.');
        return;
      }
      // Bootstrap: users table is empty, skip refCode validation.
    } else {
      if (!/^\d{4,10}$/.test(trimmedRefCode)) {
        alert('Referral code must be a 6-digit number.');
        return;
      }
      const refValid = await validateReferralCode(trimmedRefCode);
      if (!refValid) {
        alert('This referral code is not valid. Please double-check and try again.');
        return;
      }
    }

    try {
      // Use server-side registration with referral code validation
      const result = await registerWithReferral({
        email: regData.email,
        password: regData.password,
        name: regData.name,
        phone: regData.phone,
        country: regData.country,
        age: regData.age,
        refCode: regData.refCode,
      });

      if (!result.success) {
        alert(result.error || 'Registration failed');
        return;
      }

      // With Clerk, signup is a two-step flow: we've just triggered an
      // email with a 6-digit verification code. Flip the overlay on so
      // the user can enter it. The Clerk webhook will create the DB
      // profile once the user is verified.
      if (result.needsEmailVerification) {
        setNeedsEmailVerification(true);
        setView('login');
        alert('We sent a verification code to your email. Enter it to finish signing up.');
        return;
      }

      alert('Registration successful!');
      setView('home');
    } catch (error: any) {
      console.error('Registration Error:', error);
      if (error?.message?.includes('already registered') || error?.message?.includes('already')) {
        alert('This email is already registered. Please sign in instead.');
      } else {
        alert(error.message || 'Registration failed. Please try again.');
      }
    }
  };

  const handlePasswordReset = async () => {
    const email = loginEmail || prompt('Enter your email address:');
    if (!email) return;
    try {
      await requestPasswordReset(
        email,
        `${window.location.origin}/reset-password`,
      );
      // Always show the same success message regardless of whether the
      // address exists -- this prevents user-enumeration via the reset form.
      alert(
        'If an account exists for this email, a password reset link has been sent. ' +
        'Please check your inbox (and spam folder).',
      );
    } catch (error: any) {
      // Generic message -- don't leak provider state to the user.
      console.error('[auth] password reset request failed:', error);
      alert('Could not start password reset right now. Please try again shortly.');
    }
  };

  // Admin-shell login (no rules checkbox, no phone-number lookup,
  // no Google sign-up). Used by the dedicated AdminLoginView rendered
  // on the admin subdomain when no session is active. We deliberately
  // keep this minimal: the admin login form only accepts an email and
  // a password, which mirrors how operators are provisioned.
  const [adminAuthSubmitting, setAdminAuthSubmitting] = useState(false);
  const handleAdminLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Enter your operator credentials to continue.');
      return;
    }
    setAdminAuthSubmitting(true);
    try {
      const { error: loginError } = await signIn.email({
        email: loginEmail,
        password: loginPassword,
      });
      if (loginError) throw loginError;
      // Stay on the admin shell; AdminView mounts as soon as the session
      // hydrates and `isAdmin` flips true.
      setShowWelcome(true);
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (error?.message?.includes('Invalid') || error?.message?.includes('credentials')) {
        alert('Invalid operator credentials.');
      } else {
        alert(error?.message || 'Sign-in failed. Try again shortly.');
      }
    } finally {
      setAdminAuthSubmitting(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert('Please enter your credentials');
      return;
    }
    if (!loginAccepted) {
      alert('Please accept the rules to continue.');
      return;
    }

    try {
      let emailToUse = loginEmail;

      // If input is not an email, assume it's a phone number and find associated email
      if (!loginEmail.includes('@')) {
        const phoneResults = await getRows('users', [{ column: 'phone', value: loginEmail }]);
        if (phoneResults && phoneResults.length > 0) {
          emailToUse = phoneResults[0].email;
        } else {
          alert('No account found with this phone number.');
          return;
        }
      }

      // Use Better Auth email sign-in
      const { error: loginError } = await signIn.email({
        email: emailToUse,
        password: loginPassword,
      });
      if (loginError) throw loginError;
      setShowWelcome(true);
      setView('home');
    } catch (error: any) {
      console.error('Login Error:', error);
      if (error?.message?.includes('Invalid') || error?.message?.includes('credentials')) {
        alert('Invalid email or password. Please check your credentials.');
      } else {
        alert(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // On the registration form, a referral code is always required
      // (the server makes the same decision via /api/register/google-profile).
      // We validate client-side first so users see the error before the
      // OAuth redirect, not after.
      //
      // NOTE: we deliberately DO NOT try to read `users` via the anon
      // key here -- the RLS lockdown (20260419_rls_lockdown.sql) revokes
      // anon SELECT on that table, so the count-based "bootstrap" check
      // that used to short-circuit this gate silently returned 0 and
      // let empty-refCode signups through. If you really need a first
      // bootstrap user, temporarily flip EMAIL_ENABLED-style or run the
      // first signup from the email/password form instead.
      if (isRegistering) {
        const trimmedRefCode = regData.refCode.trim();
        if (!trimmedRefCode) {
          // Ask the server whether we are in bootstrap mode (empty
          // users table). If not, demand a refCode before the OAuth
          // redirect so the user gets the error up-front.
          const required = await isReferralRequired();
          if (required) {
            alert('Referral code is required. Please enter the code of the person who invited you before continuing with Google.');
            return;
          }
          // Bootstrap: no refCode is fine; leave pendingReferralCode unset.
          localStorage.removeItem('pendingReferralCode');
        } else {
          if (!/^\d{4,10}$/.test(trimmedRefCode)) {
            alert('Referral code must be a 6-digit number.');
            return;
          }
          const isValid = await validateReferralCode(trimmedRefCode);
          if (!isValid) {
            alert('This referral code is not valid. Please double-check and try again.');
            return;
          }
          // Stash the validated code so the post-OAuth
          // /api/register/google-profile call knows which referrer to
          // attach.
          localStorage.setItem('pendingReferralCode', trimmedRefCode);
        }

        // CRITICAL: for new users we MUST go through Clerk's signUp
        // resource, not signIn -- otherwise Clerk returns a
        // `transferable` verification with `external_account_not_found`
        // and the OAuth flow stalls without ever creating a user (no
        // `user.created` webhook -> no Supabase row -> back to /login).
        // The custom profile fields piggy-back on `unsafeMetadata` so
        // the Clerk webhook can write them straight into the `users`
        // row. See src/lib/auth-client.ts#signUp.social.
        await signUp.social({
          provider: 'google',
          callbackURL: window.location.origin,
          metadata: {
            name: regData.name,
            phone: regData.phone,
            country: regData.country,
            age: regData.age,
            refCode: trimmedRefCode,
          },
        });
        return;
      }

      // Returning user: standard Clerk OAuth sign-in. The post-redirect
      // `completeOauthTransferIfNeeded` hook in checkSession will
      // transparently convert this into a sign-up if Clerk has no
      // matching user (and vice versa) so neither button can deadlock.
      await signIn.social({
        provider: 'google',
        callbackURL: window.location.origin,
      });
    } catch (error) {
      console.error('Login Error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const claimDaily = async () => {
    if (user.dailyClaimed) return;
    try {
      // Use server-side RPC for atomic daily reward claim
      const reward = await claimDailyReward(user.id);
      confetti({ particleCount: 100, spread: 70 });
      alert(`Claimed ৳ ${reward.toFixed(2)}!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const spin = async () => {
    if (user.mainBalance < spinCost) {
      alert('Insufficient balance!');
      return;
    }
    setIsSpinning(true);
    setResult(null);

    setTimeout(async () => {
      try {
        // Use server-side RPC for atomic spin with server-side randomness
        const win = await processSpin(user.id);

        setIsSpinning(false);
        setResult(win > 0 ? `৳ ${win.toFixed(2)}` : 'Better Luck Next Time!');
        if (win > 0) confetti({ particleCount: 150, spread: 70 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.id}`);
        setIsSpinning(false);
      }
    }, 2000);
  };

  const sendGlobalMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      const sanitizedMessage = sanitizeAndTrim(chatMessage, 1000);
      await insertRow('messages', {
        userId: user.id,
        userName: sanitizeAndTrim(user.name, 100),
        text: sanitizedMessage,
        sender: 'user',
        date: new Date().toLocaleTimeString()
      });
      setChatMessage('');
      confetti({ particleCount: 20, spread: 30 });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'messages');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsLoggedIn(false);
    setView('login');
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleSubmission = async (operation: () => Promise<void>, successMessage?: string) => {
    setIsSubmitting(true);
    setSubmissionProgress(0);

    const duration = 1500;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setSubmissionProgress((currentStep / steps) * 100);
      if (currentStep >= steps) clearInterval(timer);
    }, interval);

    try {
      await operation();
      // Wait for progress animation to finish if the operation was fast
      const elapsed = currentStep * interval;
      if (elapsed < duration) {
        await new Promise(resolve => setTimeout(resolve, duration - elapsed));
      }
      clearInterval(timer);
      setIsSubmitting(false);
      confetti({ particleCount: 150, spread: 70 });
      // Only show alert if a message is provided (callers can handle their own success UI)
      if (successMessage) {
        alert(successMessage);
      }
    } catch (e) {
      clearInterval(timer);
      setIsSubmitting(false);
      throw e;
    }
  };

  // --- Views ---

  const loginView = (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden bg-[#fcfaf7]">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#6366f1]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#7c3aed]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Hamburger Menu -- top-left, matching the post-login nav position */}
      <div ref={authMenuRef} className="absolute top-4 left-4 z-30">
        <button
          type="button"
          aria-label="Open menu"
          aria-haspopup="menu"
          aria-expanded={showAuthMenu}
          onClick={() => setShowAuthMenu((v) => !v)}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#7c3aed] border border-white/40 shadow-[0_8px_24px_-6px_rgba(99,102,241,0.45)] flex items-center justify-center text-white hover:shadow-[0_12px_28px_-4px_rgba(99,102,241,0.6)] hover:scale-105 active:scale-95 transition-all"
        >
          <Menu className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <AnimatePresence>
          {showAuthMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              role="menu"
              className="absolute left-0 mt-2 w-56 bg-white border border-[#6366f1]/20 rounded-2xl shadow-xl overflow-hidden"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowInfoModal('info');
                  setShowAuthMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#7c3aed] hover:bg-[#6366f1]/10 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Website Info</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  alert('Upcoming Feature!');
                  setShowAuthMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#7c3aed] hover:bg-[#6366f1]/10 transition-colors border-t border-[#6366f1]/10"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help Center</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowInfoModal('freelance');
                  setShowAuthMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#7c3aed] hover:bg-[#6366f1]/10 transition-colors border-t border-[#6366f1]/10"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Freelancing</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white border border-[#6366f1]/20 rounded-[40px] p-10 shadow-[0_32px_64px_-16px_rgba(99,102,241,0.15)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[#6366f1] to-[#7c3aed] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-6 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
              <Wallet className="w-10 h-10 text-white relative z-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Top Earning <span className="text-[#6366f1]">Elite</span></h1>

            {isRegistering ? (
              <div className="text-center">
                <p className="text-[#6366f1] font-black text-[10px] uppercase tracking-[0.4em] mb-2">The Future of Digital Work</p>
                <h2 className="text-lg font-bold text-slate-600">Join the Global Network</h2>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Start your journey to financial freedom today.</p>
                <div className="mt-4 p-3 bg-[#6366f1]/5 rounded-2xl border border-[#6366f1]/10">
                  <p className="text-[9px] font-black text-[#7c3aed] uppercase tracking-widest leading-relaxed">
                    স্মার্ট ইনকাম করুন, স্মার্টলি জীবন গড়ুন। আমাদের সাথে যুক্ত হয়ে প্রতিদিন আয় করুন এবং আপনার স্বপ্ন পূরণ করুন।
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 font-medium text-sm text-center">Institutional Grade Earning Platform</p>
            )}
          </div>

          <div className="space-y-5">
            {isRegistering ? (
              <>
                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={regData.name}
                      onChange={e => setRegData({ ...regData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <input
                      type="text"
                      placeholder="Mobile Number"
                      value={regData.phone}
                      onChange={e => setRegData({ ...regData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={regData.email}
                      onChange={e => setRegData({ ...regData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min 6 digit)"
                      value={regData.password}
                      onChange={e => setRegData({ ...regData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#6366f1] uppercase"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Again Password"
                      value={regData.confirmPassword}
                      onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <input
                      type="text"
                      placeholder="Referral Code (required for new users)"
                      value={regData.refCode}
                      onChange={e => setRegData({ ...regData, refCode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <select
                      value={regData.country}
                      onChange={e => setRegData({ ...regData, country: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all appearance-none"
                    >
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="India">India</option>
                      <option value="Pakistan">Pakistan</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 px-2">
                    <input
                      type="checkbox"
                      id="reg-terms"
                      checked={regAccepted}
                      onChange={e => setRegAccepted(e.target.checked)}
                      className="w-4 h-4 accent-[#6366f1]"
                    />
                    <label htmlFor="reg-terms" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer">
                      I accept all rules and conditions
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleEmailRegister}
                  className="w-full bg-gradient-to-r from-[#6366f1] to-[#7c3aed] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(99,102,241,0.3)] active:scale-95 transition-all mt-4"
                >
                  Register
                </button>

                <div className="flex items-center gap-4 my-5">
                  <div className="h-px bg-slate-100 flex-1" />
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Or</span>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-[#6366f1]/30 hover:text-[#7c3aed] transition-all shadow-sm active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" referrerPolicy="no-referrer" />
                  <span>Sign Up with Google</span>
                </button>

                <button onClick={() => setIsRegistering(false)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4 hover:text-[#6366f1] transition-colors">
                  Existing Member? <span className="text-[#6366f1] underline">Sign In</span>
                </button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <input
                      type="text"
                      placeholder="Number or Email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6366f1] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#6366f1]/50 focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#6366f1] uppercase"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="login-terms"
                        checked={loginAccepted}
                        onChange={e => setLoginAccepted(e.target.checked)}
                        className="w-4 h-4 accent-[#6366f1]"
                      />
                      <label htmlFor="login-terms" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer">
                        I accept all rules
                      </label>
                    </div>
                    <button
                      onClick={handlePasswordReset}
                      type="button"
                      className="text-[10px] font-black text-[#6366f1] uppercase tracking-widest hover:underline transition-all"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleEmailLogin}
                  className="w-full bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#6366f1] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.5)] active:scale-[0.98] transition-all mt-4 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                  <span className="relative z-10">Login Now</span>
                </button>

                <div className="flex items-center gap-4 my-6">
                  <div className="h-px bg-slate-100 flex-1" />
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Secure Gateway</span>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-[#6366f1]/30 hover:text-[#7c3aed] transition-all shadow-sm active:scale-95"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" referrerPolicy="no-referrer" />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    onClick={() => setIsRegistering(true)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all active:scale-95"
                  >
                    New Partner? <span className="underline">Apply Now</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center gap-6 opacity-60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6366f1]" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#6366f1]" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">99.9% Uptime</span>
          </div>
        </div>
      </motion.div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl border border-[#6366f1]/20"
            >
              <div className="w-16 h-16 bg-[#6366f1]/10 rounded-3xl flex items-center justify-center text-[#6366f1] mb-6 mx-auto">
                {showInfoModal === 'info' ? <Globe className="w-8 h-8" /> : <Briefcase className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-widest mb-4">
                {showInfoModal === 'info' ? 'Website Info' : 'Freelancing'}
              </h3>
              <div className="text-sm font-medium text-slate-600 leading-relaxed text-center space-y-4">
                {showInfoModal === 'info' ? (
                  <div className="space-y-4 text-right dir-rtl">
                    <p className="text-[#6366f1] font-black border-b border-[#6366f1]/10 pb-2">আমাদের সাইটের বৈশিষ্ট্যসমূহ:</p>
                    <div className="space-y-2">
                      <p className="font-bold text-slate-700">✨ প্রতিদিনের কাজ করে নিশ্চিত আয়।</p>
                      <p className="font-bold text-slate-700">✨ ফেসবুক এবং জিমেইল সেল করে বড় অংকের আয়।</p>
                      <p className="font-bold text-slate-700">✨ বিজ্ঞাপন দেখে সহজ ইনকাম।</p>
                      <p className="font-bold text-slate-700">✨ দ্রুত মোবাইল ব্যাংকিং এবং রিচার্জ সুবিধা।</p>
                      <p className="font-bold text-slate-700">✨ রেফার করে ৩ জেনারেশন পর্যন্ত লাইফটাইম কমিশন।</p>
                      <p className="font-bold text-slate-700">✨ ১০০% নিরাপদ এবং বিশ্বস্ত পেমেন্ট সিস্টেম।</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-right dir-rtl">
                    <p className="text-[#6366f1] font-black border-b border-[#6366f1]/10 pb-2">ফ্রিল্যান্সিং ক্যারিয়ার:</p>
                    <p className="font-bold text-slate-700 leading-relaxed">
                      ফ্রিল্যান্সিং হলো বর্তমান সময়ের সবচেয়ে জনপ্রিয় মুক্ত পেশা। আমাদের প্ল্যাটফর্মে আপনি ছোট ছোট কাজ (Micro Tasks) করে আপনার ফ্রিল্যান্সিং ক্যারিয়ার শুরু করতে পারেন।
                    </p>
                    <p className="font-bold text-slate-700 leading-relaxed">
                      ধৈর্য এবং পরিশ্রমের মাধ্যমে আপনি এখান থেকে ভালো অংকের টাকা আয় করতে পারবেন। আজই শুরু করুন আপনার সফলতার যাত্রা!
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowInfoModal(null)}
                className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // Local wrappers forwarding to the extracted shared components.
  // Keeping the original names + call-sites intact makes this an
  // opt-in migration -- the rest of this file does not need to change.
  const WelcomeOverlay = () => (
    <SharedWelcomeOverlay
      show={showWelcome}
      rulesText={rulesText}
      onDismiss={() => {
        setShowWelcome(false);
        sessionStorage.setItem('hasSeenWelcome', 'true');
      }}
    />
  );

  const SubmissionLoader = () => (
    <SharedSubmissionLoader isSubmitting={isSubmitting} submissionProgress={submissionProgress} />
  );

  const SuccessView = (props: {
    title: string;
    subtitle: string;
    details: { label: string; value: string; color?: string }[];
    onClose: () => void;
    colorClass?: string;
  }) => <SharedSuccessView {...props} />;

  const RestrictionScreen = () => (
    <SharedRestrictionScreen
      user={user}
      onLogout={async () => {
        await signOut();
        setView('login');
      }}
    />
  );

  const homeView = (
    <div className="min-h-screen pb-32 bg-slate-50">
      {/* Top Bar */}
      <div className="px-6 pt-12 flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg neon-border">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900 neon-text glitch-text" data-text="Top Earning">Top Earning</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNotifications(true)} className="p-3 glass rounded-2xl text-slate-700 relative">
            <Bell className="w-6 h-6" />
            {user.notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
          </button>
          <button onClick={() => setView('profile')} className="p-3 glass rounded-2xl text-slate-700">
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Feature 1: Daily Check-in */}
      {(enabledFeatures.includes('daily-claim') || isAdmin) && (
        <div className="px-6 mb-6">
          <button
            onClick={claimDaily}
            disabled={user.dailyClaimed}
            className={`w-full p-4 rounded-3xl flex items-center justify-between border transition-all ${user.dailyClaimed
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500/10 to-violet-600/10 border-indigo-500/30 text-indigo-600 neon-border'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${user.dailyClaimed ? 'bg-slate-200' : 'bg-indigo-500/20'}`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest">Daily Reward</p>
                <p className="text-[10px] font-medium opacity-60">{user.dailyClaimed ? 'Come back tomorrow' : `Claim your daily ৳ ${dailyReward.toFixed(2)}`}</p>
              </div>
            </div>
            {!user.dailyClaimed && <span className="text-sm font-black">+৳ {dailyReward.toFixed(2)}</span>}
          </button>
        </div>
      )}

      {/* Feature 2: Community Links */}
      <div className="px-6 mb-6">
        <div className="glass-card bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 blur-2xl rounded-full" />
          <div className="relative z-10">
            <h3 className="text-lg font-black mb-2">Join Our Community</h3>
            <p className="text-xs text-indigo-100 mb-6 leading-relaxed">Get the latest updates, payment proofs, and tips from our official community group.</p>
            <div className="flex gap-3">
              <a
                href={telegramLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-white text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Send className="w-3 h-3" />
                Telegram
              </a>
              <a
                href={facebookLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-white/20 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg active:scale-95 transition-all"
              >
                <Facebook className="w-3 h-3" />
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 3: Quick Access Grid */}
      <div className="px-6 grid grid-cols-3 gap-3 mb-8">
        {(enabledFeatures.includes('leaderboard') || isAdmin) && (
          <button onClick={() => setView('leaderboard')} className="glass-card p-4 flex flex-col items-center gap-2 border-white/40">
            <Trophy className="w-6 h-6 text-indigo-500" />
            <span className="text-[10px] font-black uppercase text-slate-600">Top</span>
          </button>
        )}
        {(enabledFeatures.includes('spin') || isAdmin) && (
          <button onClick={() => setView('spin')} className="glass-card p-4 flex flex-col items-center gap-2 border-white/40">
            <TrendingUp className="w-6 h-6 text-violet-600" />
            <span className="text-[10px] font-black uppercase text-slate-600">Spin</span>
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setView('admin')} className="glass-card p-4 flex flex-col items-center gap-2 border-white/40">
            <ShieldCheck className="w-6 h-6 text-pink-600" />
            <span className="text-[10px] font-black uppercase text-slate-600">VIP</span>
          </button>
        )}
        {/*
         * Admin "Support" entry was removed: live support is now provided
         * by the Tawk.to widget injected from index.html, so an in-app
         * support route is no longer needed. The SupportView module is
         * left in src/features/support for now in case we want to bring
         * back an admin reply console later.
         */}
      </div>

      {/* Hero Banner */}
      <div className="p-6 pt-0">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-[40px] p-8 bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-2xl neon-border"
        >
          <div className="relative z-10">
            <h2 className="text-3xl font-black leading-tight mb-2">Empower Your Wallet with Top Earning.</h2>
            <p className="text-indigo-50 text-sm font-medium mb-6 opacity-80">Join 12k+ active workers earning daily.</p>
            <div className="flex gap-3">
              <button onClick={() => setView('folder-a')} className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all">
                REGISTER NOW
              </button>
              <a
                href="https://t.me/WEB_BOT_LAB"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-black text-xs active:scale-95 transition-all flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                WATCH TUTORIAL
              </a>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        </motion.div>
      </div>

      {/* Trust Bar */}
      <div className="px-6 mb-8">
        <div className="glass flex justify-around p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Paid</p>
            <p className="text-lg font-black text-indigo-600">৳ {totalPaid.toLocaleString()}+</p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Workers</p>
            <p className="text-lg font-black text-violet-600">{(activeWorkerCount / 1000).toFixed(0)}k+</p>
          </div>
        </div>
      </div>

      {/* Live Notice */}
      <div className="px-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3 overflow-hidden shadow-sm">
          <div className="bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shrink-0">NOTICE</div>
          <div className="whitespace-nowrap animate-marquee text-xs font-bold text-slate-800">
            {globalNotice}
          </div>
        </div>
      </div>

      {/* Income Grid */}
      <div className="px-6 grid grid-cols-2 gap-4">
        {INCOME_CARDS.map((card, i) => (
          <motion.button
            key={i}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView(card.view as View)}
            className={`glass-card flex flex-col items-center text-center gap-3 group relative overflow-hidden border-white/40 shadow-sm ${(!enabledCards.includes(card.title) && !isAdmin) ? 'opacity-50 grayscale cursor-not-allowed' : ''
              }`}
            disabled={!enabledCards.includes(card.title) && !isAdmin}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:neon-border transition-all`}>
              {React.cloneElement(card.icon as React.ReactElement, { className: 'w-7 h-7 text-white' })}
            </div>
            <h4 className="font-bold text-sm text-slate-800">{card.title}</h4>
            {!enabledCards.includes(card.title) && !isAdmin && (
              <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center">
                <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded uppercase">Locked</span>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Platform Guidelines */}
      <div className="px-6 mb-8">
        <div className="glass-card border-slate-200 bg-slate-100/50 p-6">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Platform Guidelines
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                <span className="text-xs font-black text-indigo-600">01</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">One account per person. Multiple accounts will be banned without notice.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                <span className="text-xs font-black text-indigo-600">02</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Withdrawals are processed daily. Ensure your wallet details are correct.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                <span className="text-xs font-black text-indigo-600">03</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Refer friends to earn 3-generation lifetime bonuses on their earnings.</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div className="p-6 mt-4 pb-12 text-center">
        <div className="glass-card bg-indigo-500/5 border-indigo-500/10 mb-8">
          <h3 className="text-lg font-black text-indigo-600 mb-4">Why Choose Our Premium Platform?</h3>
          <div className="space-y-4 text-left">
            {[
              { text: 'Zero-Refer Withdrawal: You earn, you withdraw. No strings attached.', icon: <CheckCircle2 className="w-5 h-5 text-indigo-500" /> },
              { text: 'Instant Bonus: Get ৳ 20 instantly for every 1st Generation referral.', icon: <DollarSign className="w-5 h-5 text-indigo-500" /> },
              { text: 'Passive Income: Build a team and earn while you sleep through Network Marketing.', icon: <TrendingUp className="w-5 h-5 text-indigo-500" /> },
              { text: 'Micro-Freelancing: Diverse job categories from Facebook marketing to Gmail sales.', icon: <Briefcase className="w-5 h-5 text-indigo-500" /> },
              { text: 'Guaranteed Payments: Trusted payouts via Bkash & Nagad starting from just ৳ 55.', icon: <ShieldCheck className="w-5 h-5 text-indigo-500" /> }
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="mt-0.5">{item.icon}</div>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">SMARTTASK BD • PREMIUM EDITION</p>
      </div>
    </div>
  );

  // Forward to the extracted feature screen.  The props mirror the
  // closure variables the inline definition used to capture.
  const TopNewsView = () => (
    <SharedTopNewsView
      newsPosts={newsPosts}
      user={user}
      setView={setView}
      updateRow={updateRow}
    />
  );

  // Forward to the extracted DashboardView feature module.
  const DashboardView = () => (
    <SharedDashboardView
      user={user}
      setView={setView}
      allUsers={allUsers}
      referralCommissionRate={referralCommissionRate}
    />
  );

  // Forward to the extracted ReferralView feature module.
  const ReferralView = () => (
    <SharedReferralView
      user={user}
      setView={setView}
      referralActivationBonus={referralActivationBonus}
      referralCommissionRate={referralCommissionRate}
    />
  );

  // Forward to the extracted WorkStationView feature module.
  const workStationView = (
    <SharedWorkStationView
      setView={setView}
      activeFolders={activeFolders}
      isAdmin={isAdmin}
    />
  );

  // Forward to the extracted FinanceView feature module.
  const FinanceView = () => (
    <SharedFinanceView
      user={user}
      setView={setView}
      financeStep={financeStep}
      setFinanceStep={setFinanceStep}
      minWithdrawal={minWithdrawal}
      withdrawalFee={withdrawalFee}
      withdrawals={withdrawals}
      lastWithdrawal={lastWithdrawal}
      setLastWithdrawal={setLastWithdrawal}
      lastDeposit={lastDeposit}
      setLastDeposit={setLastDeposit}
      isSubmitting={isSubmitting}
      handleSubmission={handleSubmission}
      submitWithdrawal={submitWithdrawal}
      insertRow={insertRow}
      onOpenSidebar={() => setSidebarOpen(true)}
      onSelectIncomePeriod={(period, amount, title) => {
        setIncomeDetail({ period, amount, title });
        setView('income-detail');
      }}
    />
  );

  // Competitor-aligned restructure additions. Each view is exposed as
  // a zero-arg local component so the route blocks can do
  // `<AgentServicesView key="agent-services" />` (matching the pattern
  // already used for DashboardView, FinanceView, etc.).
  const AgentServicesView = () => (
    <SharedAgentServicesView
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const WithdrawView = () => (
    <SharedWithdrawView
      user={user}
      setView={setView}
      minWithdrawal={minWithdrawal}
      withdrawalFee={withdrawalFee}
      isSubmitting={isSubmitting}
      handleSubmission={handleSubmission}
      submitWithdrawal={submitWithdrawal}
      setLastWithdrawal={setLastWithdrawal}
      setFinanceStep={setFinanceStep}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const WithdrawHistoryView = () => (
    <SharedWithdrawHistoryView
      userId={user.id}
      withdrawals={withdrawals}
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const IncomeDetailView = () => (
    <SharedIncomeDetailView
      title={incomeDetail?.title ?? 'মোট ইনকাম'}
      amount={incomeDetail?.amount ?? user.totalEarned}
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const IncomeHistoryView = () => (
    <SharedIncomeHistoryView
      user={user}
      withdrawals={withdrawals}
      recharges={rechargeRequests}
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const BalanceHistoryView = () => (
    <SharedBalanceHistoryView
      user={user}
      withdrawals={withdrawals}
      recharges={rechargeRequests}
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const PaymentHistoryView = () => (
    <SharedPaymentHistoryView
      user={user}
      withdrawals={withdrawals}
      recharges={rechargeRequests}
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const AboutView = () => (
    <SharedAboutView
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const ReviewsView = () => (
    <SharedReviewsView
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );
  const PrivacyView = () => (
    <SharedPrivacyView
      setView={setView}
      onOpenSidebar={() => setSidebarOpen(true)}
    />
  );

  // Forward to the extracted SupportView feature module.
  const SupportView = () => (
    <SharedSupportView
      user={user}
      setView={setView}
      userMessages={userMessages}
      insertRow={insertRow}
    />
  );

  // Shared image upload helper (see src/lib/upload-media.ts).
  const uploadMedia = sharedUploadMedia;

  // Forward to the extracted FolderAView feature module.
  const FolderAView = () => (
    <SharedFolderAView
      user={user}
      setView={setView}
      microjobSubmissions={microjobSubmissions}
      dynamicTasks={dynamicTasks}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
      uploadMedia={uploadMedia}
    />
  );

  // Forward to the extracted FolderBView feature module.
  const FolderBView = () => (
    <SharedFolderBView
      user={user}
      setView={setView}
      taskSubmissions={taskSubmissions}
      dynamicTasks={dynamicTasks}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
      uploadMedia={uploadMedia}
    />
  );

  // Forward to the extracted FolderCView feature module.
  const FolderCView = () => (
    <SharedFolderCView
      user={user}
      setView={setView}
      gmailSubmissions={gmailSubmissions}
      dynamicTasks={dynamicTasks}
      gmailReward={gmailReward}
      gmailPassword={gmailPassword}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
    />
  );

  // Forward to the extracted FolderDView feature module.
  const FolderDView = () => (
    <SharedFolderDView
      setView={setView}
      dynamicTasks={dynamicTasks}
      adReward={adReward}
    />
  );

  // Forward to the extracted LeaderboardView feature module.
  const leaderboardView = <SharedLeaderboardView setView={setView} />;

  // Forward to the extracted SpinView feature module.
  const SpinView = () => <SharedSpinView setView={setView} spinCost={spinCost} />;

  // Forward to the extracted MobileBankingView feature module.
  const mobileBankingView = (
    <SharedMobileBankingView
      setView={setView}
      enabledFeatures={enabledFeatures}
      isAdmin={isAdmin}
    />
  );

  // Forward to the extracted MobileRechargeView feature module.
  const MobileRechargeView = () => (
    <SharedMobileRechargeView
      user={user}
      setView={setView}
      rechargeRequests={rechargeRequests}
      rechargeCommissionRate={rechargeCommissionRate}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
      updateRow={updateRow}
    />
  );

  // Forward to the extracted DriveOfferView feature module.
  const DriveOfferView = () => (
    <SharedDriveOfferView
      user={user}
      setView={setView}
      driveOffers={driveOffers}
      driveOfferRequests={driveOfferRequests}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
      updateRow={updateRow}
    />
  );

  // Forward to the extracted EcommerceView feature module.
  const EcommerceView = () => (
    <SharedEcommerceView
      user={user}
      setView={setView}
      products={products}
      productOrders={productOrders}
      deliveryFee={deliveryFee}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
      updateRow={updateRow}
    />
  );

  // Forward to the extracted DollarBuyView feature module.
  const DollarBuyView = () => (
    <SharedDollarBuyView
      user={user}
      setView={setView}
      dollarBuyRate={dollarBuyRate}
      dollarBuyRequests={dollarBuyRequests}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
      updateRow={updateRow}
    />
  );

  // Forward to the extracted SocialHubView feature module.
  const socialHubView = (
    <SharedSocialHubView
      user={user}
      setView={setView}
      setSelectedSocialJob={setSelectedSocialJob}
      updateRow={updateRow}
    />
  );

  // Forward to the extracted SocialJobView feature module.
  const SocialJobView = () => (
    <SharedSocialJobView
      user={user}
      setView={setView}
      selectedSocialJob={selectedSocialJob}
      allSocialSubmissions={allSocialSubmissions}
      insertRow={insertRow}
      uploadMedia={uploadMedia}
    />
  );

  // Forward to the extracted DollarSellView feature module.
  const DollarSellView = () => (
    <SharedDollarSellView
      user={user}
      setView={setView}
      dollarSellRate={dollarSellRate}
      withdrawals={withdrawals}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
      incrementFields={incrementFields}
    />
  );

  // Forward to the extracted OtpBuySellView feature module.
  const otpBuySellView = <SharedOtpBuySellView setView={setView} />;

  // Forward to the extracted AdsEarnView feature module.
  const AdsEarnView = () => (
    <SharedAdsEarnView
      user={user}
      setView={setView}
      dailyAdLimit={dailyAdLimit}
      adReward={adReward}
      updateRow={updateRow}
    />
  );

  // Forward to the extracted AccountActivationView feature module.
  const AccountActivationView = () => (
    <SharedAccountActivationView
      user={user}
      setView={setView}
      activationFee={activationFee}
      activationDuration={activationDuration}
      referralCommissionRate={referralCommissionRate}
      handleSubmission={handleSubmission}
    />
  );

  // Forward to the extracted GamingView feature module.
  const gamingView = <SharedGamingView setView={setView} />;

  // Forward to the extracted LudoEarnView feature module.
  const LudoEarnView = () => (
    <SharedLudoEarnView
      user={user}
      setView={setView}
      ludoTournaments={ludoTournaments}
      ludoSubmissions={ludoSubmissions}
      isSubmitting={isSubmitting}
      setIsSubmitting={setIsSubmitting}
      insertRow={insertRow}
      updateRow={updateRow}
      uploadMedia={uploadMedia}
    />
  );

  // Forward to the extracted SmmPanelView feature module.
  const SmmPanelView = () => (
    <SharedSmmPanelView
      user={user}
      setView={setView}
      isAdmin={isAdmin}
      enabledSmmServices={enabledSmmServices}
      smmOrders={smmOrders}
      isSubmitting={isSubmitting}
      setIsSubmitting={setIsSubmitting}
      insertRow={insertRow}
      updateRow={updateRow}
    />
  );

  // Forward to the extracted SubscriptionBoostingView feature module.
  const SubscriptionBoostingView = () => (
    <SharedSubscriptionBoostingView
      user={user}
      setView={setView}
      isAdmin={isAdmin}
      enabledSmmServices={enabledSmmServices}
      subscriptionRequests={subscriptionRequests}
      handleSubmission={handleSubmission}
      insertRow={insertRow}
      updateRow={updateRow}
    />
  );


  const profileView = (
    <div className="min-h-screen pb-32">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="User Profile">User Profile</h2>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 p-1 mb-4 shadow-xl relative group">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {(user as any).profilePic ? (
                <img src={(user as any).profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-14 h-14 text-indigo-500 group-hover:scale-110 transition-all" />
              )}
            </div>
            <label htmlFor="profile-pic-upload" className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-indigo-600 transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </label>
            <input
              type="file"
              accept="image/*"
              id="profile-pic-upload"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await uploadImage(file, 'profile');
                  if (url) {
                    await updateRow('users', user.id, { profilePic: url });
                  }
                } catch (err) {
                  console.error('Profile photo upload failed:', err);
                  alert('Failed to upload profile photo. Please try again.');
                }
              }}
            />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{user.name}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{user.id}</p>
        </div>

        <div className="space-y-4">
          {/* Feature 10: Language Switcher */}
          <div className="glass-card flex items-center justify-between border-white/40 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Interface Language</span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase shadow-md">EN</button>
              <button className="px-4 py-1.5 text-slate-400 rounded-lg text-[10px] font-black uppercase hover:text-slate-600 transition-all">BN</button>
            </div>
          </div>

          {[
            { label: 'Edit Profile', icon: <User className="w-5 h-5" /> },
            { label: 'Security Settings', icon: <ShieldCheck className="w-5 h-5" /> },
            { label: 'Payment Methods', icon: <CreditCard className="w-5 h-5" /> },
          ].map((item, i) => (
            <button key={i} className="w-full glass-card flex items-center justify-between group border-white/40 hover:border-indigo-500/30 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 border border-slate-100 transition-all">
                  {item.icon}
                </div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all" />
            </button>
          ))}

          <div className="pt-10 space-y-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">Network Uplinks</p>
            <div className="flex justify-center gap-8">
              {[
                { icon: <Send className="w-6 h-6" />, color: 'hover:text-blue-500', url: 'https://twitter.com/smarttaskbd' },
                { icon: <Globe className="w-6 h-6" />, color: 'hover:text-rose-500', url: 'https://instagram.com/smarttaskbd' },
                { icon: <Facebook className="w-6 h-6" />, color: 'hover:text-blue-700', url: 'https://facebook.com/smarttaskbd' },
              ].map((social, i) => (
                <a key={i} href={social.url} target="_blank" rel="noreferrer" className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 transition-all hover:scale-110 hover:border-indigo-200 ${social.color} shadow-md`}>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <button
            onClick={async () => { await signOut(); setIsLoggedIn(false); setView('login'); }}
            className="w-full py-5 bg-rose-500/5 text-rose-500 border border-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 mt-10 hover:bg-rose-500/10 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </button>
        </div>
      </div>
    </div>
  );

  const salarySheetView = (
    <div className="min-h-screen pb-32">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('finance')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Salary Sheet">Salary Sheet</h2>
        </div>
        <div className="glass-card mb-6 border-white/40 shadow-lg">
          <h3 className="text-xs font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" />
            Top Workers Rewards
          </h3>
          <div className="space-y-4">
            {[
              { rank: 'Rank 1', salary: '৳ 5,000', status: 'Fixed' },
              { rank: 'Rank 2', salary: '৳ 3,000', status: 'Fixed' },
              { rank: 'Rank 3', salary: '৳ 2,000', status: 'Fixed' },
              { rank: 'Rank 4-10', salary: '৳ 500', status: 'Bonus' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                <div>
                  <p className="text-xs font-black text-slate-900 tracking-wider">{item.rank}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black mt-1">{item.status} Salary</p>
                </div>
                <p className="text-indigo-600 font-black neon-text">{item.salary}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Feature 8: Withdrawal History */}
        <div className="glass-card border-white/40 shadow-lg">
          <h4 className="text-xs font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Withdrawal History
          </h4>
          <div className="text-center py-10 opacity-50">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">No previous logs found</p>
          </div>
        </div>
      </div>
    </div>
  );

  const settingsView = (
    <div className="min-h-screen pb-32">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="System Config">System Config</h2>
        </div>

        <div className="space-y-6">
          <div className="glass-card border-white/40 shadow-lg">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-6">Account Settings</h3>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Edit Profile</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all" />
              </button>
              <button className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Change Password</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all" />
              </button>
            </div>
          </div>

          <div className="glass-card border-white/40 shadow-lg">
            <h3 className="text-xs font-black text-violet-600 uppercase tracking-[0.3em] mb-6">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Push Notifications</span>
                <div className="w-10 h-5 bg-indigo-500 rounded-full relative shadow-md">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 opacity-50">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Premium Theme (Active)</span>
                <div className="w-10 h-5 bg-emerald-500 rounded-full relative shadow-md">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-5 bg-rose-500/5 text-rose-500 border border-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-rose-500/10 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </button>
        </div>
      </div>
    </div>
  );

  // --- Early return for the admin view ---
  // The consumer shell below clamps the layout to `max-w-md` (448px),
  // which is intentional for the mobile-first end-user app but breaks
  // the admin shell (256px sidebar + content cards). Render the admin
  // view at full viewport width, outside the consumer wrapper, when:
  //   - the active view is `'admin'` AND the user is a logged-in admin, or
  //   - we're sitting on the dedicated admin host but auth hasn't
  //     finished yet (we still want the admin shell, not the consumer
  //     skeleton, while resolving).
  // The existing permission guard at the top of the component already
  // bounces non-admins off the `'admin'` view, so this branch is only
  // reached by legitimate admins.
  if (isAuthReady && view === 'admin' && isLoggedIn && isAdmin) {
    return (
      <div className="admin-shell min-h-screen bg-slate-950 text-slate-100 font-sans">
        <SubmissionLoader />
        <Suspense fallback={<div className="p-8 text-slate-400">Loading admin shell…</div>}>
        <AdminView
          view={view}
          setView={setView}
          user={user}
          globalNotice={globalNotice}
          isMaintenance={isMaintenance}
          telegramLink={telegramLink}
          facebookLink={facebookLink}
          whatsappLink={whatsappLink}
          showWelcomeAnimation={showWelcomeAnimation}
          rulesText={rulesText}
          smmPrices={smmPrices}
          minWithdrawal={minWithdrawal}
          withdrawalFee={withdrawalFee}
          dollarBuyRate={dollarBuyRate}
          dollarSellRate={dollarSellRate}
          spinCost={spinCost}
          dailyReward={dailyReward}
          activeFolders={activeFolders}
          enabledFeatures={enabledFeatures}
          enabledSmmServices={enabledSmmServices}
          enabledCards={enabledCards}
          adminGen1Rate={adminGen1Rate}
          adminGen2Rate={adminGen2Rate}
          adminGen3Rate={adminGen3Rate}
          activationFee={activationFee}
          rechargeCommissionRate={rechargeCommissionRate}
          activationDuration={activationDuration}
          referralCommissionRate={referralCommissionRate}
          referralActivationBonus={referralActivationBonus}
          totalPaid={totalPaid}
          activeWorkerCount={activeWorkerCount}
          gmailPassword={gmailPassword}
          gmailReward={gmailReward}
          adReward={adReward}
          dailyAdLimit={dailyAdLimit}
          deliveryFee={deliveryFee}
          allUsers={allUsers}
          allSocialSubmissions={allSocialSubmissions}
          newsPosts={newsPosts}
          withdrawals={withdrawals}
          dollarBuyRequests={dollarBuyRequests}
          gmailSubmissions={gmailSubmissions}
          microjobSubmissions={microjobSubmissions}
          taskSubmissions={taskSubmissions}
          subscriptionRequests={subscriptionRequests}
          rechargeRequests={rechargeRequests}
          driveOffers={driveOffers}
          driveOfferRequests={driveOfferRequests}
          products={products}
          productOrders={productOrders}
          ludoTournaments={ludoTournaments}
          ludoSubmissions={ludoSubmissions}
          smmOrders={smmOrders}
          allUploads={allUploads}
          dynamicTasks={dynamicTasks}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          setSubmissionProgress={setSubmissionProgress}
        />
        </Suspense>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion={isLowPower ? 'always' : 'user'}>
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">

      <WelcomeOverlay />
      <SubmissionLoader />

      {/* Maintenance Mode Overlay */}
      {isMaintenance && !isAdmin && view !== 'admin' && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <ShieldCheck className="w-12 h-12 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest">Maintenance Mode</h2>
          <p className="text-sm text-slate-500 mb-8">We are currently updating our systems for a better experience. Please check back later.</p>
          <div className="w-full max-w-xs h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full bg-amber-500"
            />
          </div>
        </div>
      )}

      {/* Profile completion prompt -- shown when a signed-in user has
          no profile row yet (typically Google OAuth sign-in where the
          form fields were skipped or only partially filled). Collects
          name + phone + country + referral code so the Supabase row
          can be created with the same data the manual sign-up form
          captures. Blocks until submitted or signed out. */}
      {needsReferralCodePrompt && (
        <div className="fixed inset-0 z-[400] bg-white/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-[#6366f1]/20 rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(99,102,241,0.2)]">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6366f1] to-[#7c3aed] rounded-2xl flex items-center justify-center shadow-lg mb-6 mx-auto">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-900 text-center mb-2 uppercase tracking-widest">
              Complete Your Profile
            </h2>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              We need a few more details to finish creating your account.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setRefCodePromptError(null);

                const trimmedName = profilePromptName.trim();
                const trimmedPhone = profilePromptPhone.trim();
                const trimmedCountry = profilePromptCountry.trim() || 'Bangladesh';
                const code = refCodePromptValue.trim();

                if (!trimmedName) {
                  setRefCodePromptError('Please enter your full name.');
                  return;
                }
                if (!trimmedPhone) {
                  setRefCodePromptError('Please enter your mobile number.');
                  return;
                }
                if (!code) {
                  setRefCodePromptError('Please enter a referral code.');
                  return;
                }
                if (!/^\d{4,10}$/.test(code)) {
                  setRefCodePromptError('Referral code must be a 6-digit number.');
                  return;
                }

                setRefCodePromptSubmitting(true);
                try {
                  const valid = await validateReferralCode(code);
                  if (!valid) {
                    setRefCodePromptError('This referral code is not valid.');
                    return;
                  }
                  const result = await createGoogleProfile(code, {
                    name: trimmedName,
                    phone: trimmedPhone,
                    country: trimmedCountry,
                  });
                  if (!result.success) {
                    setRefCodePromptError(result.error || 'Failed to create profile. Please try again.');
                    return;
                  }
                  // Hydrate immediately so the rest of the app unblocks.
                  const data = await fetchMyProfile<UserProfile>();
                  if (data) {
                    setUser(data);
                    setNeedsReferralCodePrompt(false);
                    setRefCodePromptValue('');
                    setProfilePromptName('');
                    setProfilePromptPhone('');
                    setProfilePromptCountry('Bangladesh');
                    setRefCodePromptError(null);
                  } else {
                    setRefCodePromptError('Profile was created but could not be loaded. Please refresh.');
                  }
                } catch (err: any) {
                  setRefCodePromptError(err?.message || 'Unexpected error. Please try again.');
                } finally {
                  setRefCodePromptSubmitting(false);
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Full Name"
                value={profilePromptName}
                onChange={(e) => setProfilePromptName(e.target.value.slice(0, 100))}
                disabled={refCodePromptSubmitting}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-[#6366f1] rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-colors disabled:opacity-60"
              />
              <input
                type="tel"
                inputMode="tel"
                placeholder="Mobile Number"
                value={profilePromptPhone}
                onChange={(e) => setProfilePromptPhone(e.target.value.slice(0, 32))}
                disabled={refCodePromptSubmitting}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-[#6366f1] rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-colors disabled:opacity-60"
              />
              <select
                value={profilePromptCountry}
                onChange={(e) => setProfilePromptCountry(e.target.value)}
                disabled={refCodePromptSubmitting}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-[#6366f1] rounded-2xl text-sm font-bold text-slate-900 outline-none transition-colors disabled:opacity-60 appearance-none"
              >
                <option value="Bangladesh">Bangladesh</option>
                <option value="India">India</option>
                <option value="Pakistan">Pakistan</option>
              </select>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Referral Code (e.g. 100234)"
                value={refCodePromptValue}
                onChange={(e) => setRefCodePromptValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={refCodePromptSubmitting}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-[#6366f1] rounded-2xl text-center text-lg font-black tracking-[0.2em] text-slate-900 placeholder:text-slate-300 outline-none transition-colors disabled:opacity-60"
              />
              {refCodePromptError && (
                <p className="text-[11px] font-bold text-rose-600 text-center">{refCodePromptError}</p>
              )}
              <button
                type="submit"
                disabled={refCodePromptSubmitting}
                className="w-full py-4 bg-gradient-to-br from-[#6366f1] to-[#7c3aed] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60"
              >
                {refCodePromptSubmitting ? 'Verifying…' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signOut();
                  } catch (err) {
                    console.warn('signOut failed, forcing reload anyway:', err);
                  }
                  // Force a full reload so the cookie, in-memory auth
                  // state, and the session poll all get re-evaluated
                  // from scratch. Without this, Better Auth's cookie
                  // can still be present for the next session poll and
                  // re-open the modal.
                  window.location.assign('/');
                }}
                disabled={refCodePromptSubmitting}
                className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Email Verification Overlay (Clerk 6-digit code flow) */}
      {needsEmailVerification && view !== 'admin' && (
        <EmailVerificationOverlay
          onVerified={() => {
            setNeedsEmailVerification(false);
            setView('home');
          }}
          onCancel={async () => {
            try {
              await signOut();
            } catch { /* ignore */ }
            setNeedsEmailVerification(false);
            setView('login');
          }}
        />
      )}

      {/* Feature 5: Notification Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-sm p-8 relative shadow-2xl border-white/40"
            >
              <button onClick={() => setShowNotifications(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6 text-indigo-500" />
                Notifications
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {user.notifications.map(notif => (
                  <div key={notif.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-medium text-slate-700 mb-1">{notif.text}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{notif.date}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature 6: Live Support Chat Widget */}
      <div className="fixed bottom-24 right-6 z-[90]">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-2xl text-white active:scale-90 transition-all"
        >
          {showChat ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="fixed bottom-40 right-6 w-80 z-[90] glass-card p-0 overflow-hidden flex flex-col h-[400px] shadow-2xl border-white/40"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Live Support</span>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white">
              {userMessages.filter(m => m.userId === user.id).map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-2 bg-white">
              <input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendGlobalMessage()}
                placeholder="Type a message..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 flex-1 outline-none focus:border-indigo-500 shadow-inner"
              />
              <button onClick={sendGlobalMessage} className="p-2 bg-indigo-500 rounded-xl text-white shadow-md">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state while auth initializes */}
      {!isAuthReady && (
        <div className="fixed inset-0 z-[500] bg-[#fcfaf7] flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6366f1] to-[#7c3aed] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] mb-6 animate-pulse">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Loading...</p>
        </div>
      )}

      {isAuthReady && <AnimatePresence mode="wait">
        {view === 'reset-password' && (
          <div key="reset-password">
            <ResetPasswordView
              onReturnToLogin={() => {
                window.history.replaceState({}, '', '/');
                setView('login');
              }}
            />
          </div>
        )}
        {view !== 'reset-password' && isLoggedIn && user.status !== 'active' && !isAdmin && <RestrictionScreen />}
        {view === 'admin' && !isLoggedIn && (
          <div key="admin-login">
            <AdminLoginView
              email={loginEmail}
              password={loginPassword}
              onEmailChange={setLoginEmail}
              onPasswordChange={setLoginPassword}
              onSubmit={handleAdminLogin}
              onForgotPassword={handlePasswordReset}
              isSubmitting={adminAuthSubmitting}
            />
          </div>
        )}
        {view === 'login' && !isLoggedIn && loginView}
        {view === 'home' && (
          <RedesignedHomeView
            user={user}
            setView={setView}
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenSidebar={() => setSidebarOpen(true)}
            dailyReward={dailyReward}
            dailyClaimEnabled={enabledFeatures.includes('daily-claim') || isAdmin}
            onClaimDaily={claimDaily}
            globalNotice={globalNotice}
            totalPaid={totalPaid}
            activeWorkerCount={activeWorkerCount}
            enabledCards={enabledCards}
            isAdmin={isAdmin}
            telegramLink={telegramLink}
            facebookLink={facebookLink}
            whatsappLink={whatsappLink}
          />
        )}
        {view === 'dashboard' && <DashboardView key="dashboard" />}
        {view === 'referral' && <ReferralView key="referral" />}
        {view === 'top-news' && <TopNewsView key="top-news" />}
        {view === 'workstation' && workStationView}
        {view === 'finance' && <FinanceView key="finance" />}
        {view === 'support' && <SupportView key="support" />}
        {view === 'folder-a' && <FolderAView key="folder-a" />}
        {view === 'folder-b' && <FolderBView key="folder-b" />}
        {view === 'folder-c' && <FolderCView key="folder-c" />}
        {view === 'folder-d' && <FolderDView key="folder-d" />}
        {view === 'leaderboard' && leaderboardView}
        {view === 'spin' && <SpinView key="spin" />}
        {view === 'profile' && profileView}
        {view === 'salary-sheet' && salarySheetView}
        {view === 'admin' && isLoggedIn && isAdmin && (
          <Suspense fallback={null}>
          <AdminView
            view={view}
            setView={setView}
            user={user}
            globalNotice={globalNotice}
            isMaintenance={isMaintenance}
            telegramLink={telegramLink}
            facebookLink={facebookLink}
            whatsappLink={whatsappLink}
            showWelcomeAnimation={showWelcomeAnimation}
            rulesText={rulesText}
            smmPrices={smmPrices}
            minWithdrawal={minWithdrawal}
            withdrawalFee={withdrawalFee}
            dollarBuyRate={dollarBuyRate}
            dollarSellRate={dollarSellRate}
            spinCost={spinCost}
            dailyReward={dailyReward}
            activeFolders={activeFolders}
            enabledFeatures={enabledFeatures}
            enabledSmmServices={enabledSmmServices}
            enabledCards={enabledCards}
            adminGen1Rate={adminGen1Rate}
            adminGen2Rate={adminGen2Rate}
            adminGen3Rate={adminGen3Rate}
            activationFee={activationFee}
            rechargeCommissionRate={rechargeCommissionRate}
            activationDuration={activationDuration}
            referralCommissionRate={referralCommissionRate}
            referralActivationBonus={referralActivationBonus}
            totalPaid={totalPaid}
            activeWorkerCount={activeWorkerCount}
            gmailPassword={gmailPassword}
            gmailReward={gmailReward}
            adReward={adReward}
            dailyAdLimit={dailyAdLimit}
            deliveryFee={deliveryFee}
            allUsers={allUsers}
            allSocialSubmissions={allSocialSubmissions}
            newsPosts={newsPosts}
            withdrawals={withdrawals}
            dollarBuyRequests={dollarBuyRequests}
            gmailSubmissions={gmailSubmissions}
            microjobSubmissions={microjobSubmissions}
            taskSubmissions={taskSubmissions}
            subscriptionRequests={subscriptionRequests}
            rechargeRequests={rechargeRequests}
            driveOffers={driveOffers}
            driveOfferRequests={driveOfferRequests}
            products={products}
            productOrders={productOrders}
            ludoTournaments={ludoTournaments}
            ludoSubmissions={ludoSubmissions}
            smmOrders={smmOrders}
            allUploads={allUploads}
            dynamicTasks={dynamicTasks}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            setSubmissionProgress={setSubmissionProgress}
          />
          </Suspense>
        )}
        {view === 'settings' && settingsView}
        {view === 'mobile-banking' && mobileBankingView}
        {view === 'otp-buy-sell' && otpBuySellView}
        {view === 'mobile-recharge' && <MobileRechargeView key="mobile-recharge" />}
        {view === 'drive-offer' && <DriveOfferView key="drive-offer" />}
        {view === 'ecommerce' && <EcommerceView key="ecommerce" />}
        {view === 'dollar-sell' && <DollarSellView key="dollar-sell" />}
        {view === 'dollar-buy' && <DollarBuyView key="dollar-buy" />}
        {view === 'social-hub' && socialHubView}
        {view === 'subscription-boosting' && <SubscriptionBoostingView key="subscription-boosting" />}
        {view === 'smm-panel' && <SmmPanelView key="smm-panel" />}
        {view === 'account-activation' && <AccountActivationView key="account-activation" />}
        {view === 'gaming' && gamingView}
        {view === 'ludo-earn' && <LudoEarnView key="ludo-earn" />}
        {view === 'social-job' && <SocialJobView key="social-job" />}
        {view === 'agent-services' && <AgentServicesView key="agent-services" />}
        {view === 'withdraw' && <WithdrawView key="withdraw" />}
        {view === 'withdraw-history' && <WithdrawHistoryView key="withdraw-history" />}
        {view === 'income-detail' && <IncomeDetailView key="income-detail" />}
        {view === 'income-history' && <IncomeHistoryView key="income-history" />}
        {view === 'balance-history' && <BalanceHistoryView key="balance-history" />}
        {view === 'payment-history' && <PaymentHistoryView key="payment-history" />}
        {view === 'about' && <AboutView key="about" />}
        {view === 'reviews' && <ReviewsView key="reviews" />}
        {view === 'privacy' && <PrivacyView key="privacy" />}
      </AnimatePresence>}

      {/* Slide-in sidebar drawer (App-shell level — overlays every screen). */}
      {isAuthReady && isLoggedIn && view !== 'login' && view !== 'admin'
        && view !== 'reset-password'
        && !isOnAdminHost() && !needsEmailVerification && (
        <SharedSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          allUsers={allUsers}
          setView={setView}
        />
      )}

      {/* Bottom Navigation — redesigned 5-tab shell.
          Hidden on login, email verification, password reset, and the
          admin shell (both the dedicated admin subdomain and the
          legacy apex `/admin` route).

          Plan reference: §3 / §4 of
          `plans/user-friendly-ui-redesign-for-production-launch.md`. */}
      {isAuthReady && isLoggedIn && view !== 'login' && view !== 'admin'
        && view !== 'reset-password'
        && !isOnAdminHost() && !needsEmailVerification && (() => {
        const navTabs: BottomNavTab[] = [
          { key: 'home', label: 'হোম', icon: <HomeIcon className="w-5 h-5" /> },
          { key: 'workstation', label: 'কোর্স', icon: <EarnIcon className="w-5 h-5" /> },
          {
            key: 'agent-services',
            label: 'প্রোডাক্ট',
            icon: <ProductIcon className="w-6 h-6" />,
            centerFloating: true,
          },
          { key: 'finance', label: 'ওয়ালেট', icon: <WalletIcon className="w-5 h-5" /> },
          { key: 'referral', label: 'নেটওয়ার্ক', icon: <NetworkIcon className="w-5 h-5" /> },
        ];
        // Map detail-views back to their parent tab so the bottom nav
        // still highlights "Wallet" while the user is drilled into
        // Withdraw / Income Detail / etc.
        const VIEW_TO_TAB: Record<string, string> = {
          withdraw: 'finance',
          'withdraw-history': 'finance',
          'income-detail': 'finance',
          'income-history': 'finance',
          'balance-history': 'finance',
          'payment-history': 'finance',
        };
        const activeTab = navTabs.some(t => t.key === view)
          ? view
          : VIEW_TO_TAB[view] ?? '';
        return (
          <BottomNav
            tabs={navTabs}
            active={activeTab}
            onSelect={(key) => setView(key as View)}
          />
        );
      })()}

      {/* Global Styles for Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
    </MotionConfig>
  );
}
