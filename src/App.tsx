import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { sanitizeAndTrim, isValidMobileWallet, sanitizeAccountNumber, generateTransactionId } from './utils/sanitize';
import {
  authClient,
  signIn,
  signOut,
  useSession,
  registerWithReferral,
  createGoogleProfile,
  validateReferralCode,
  requestPasswordReset,
  fetchMyProfile,
} from './lib/auth-client';
import { ResetPasswordView } from './features/auth/ResetPasswordView';

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
    // We detect the path at startup so the SPA can render the reset view
    // without pulling in a router dependency.
    if (typeof window !== 'undefined' && window.location.pathname === '/reset-password') {
      return 'reset-password';
    }
    return 'login';
  });
  const [selectedSocialJob, setSelectedSocialJob] = useState<{ title: string, color: string, icon: any } | null>(null);
  const [financeStep, setFinanceStep] = useState<'form' | 'success' | 'deposit' | 'deposit-success'>('form');
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
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>(['spin', 'daily-claim', 'leaderboard', 'support', 'ads-earn']);
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
  const [dynamicTasks, setDynamicTasks] = useState<{ id: string; title: string; reward: number; desc: string; link: string; category: 'micro' | 'social' }[]>([]);
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

  // --- Login Animation ---
  useEffect(() => {
    if (isLoggedIn && view === 'home') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#6366f1', '#a855f7']
      });
    }
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

            // For Google OAuth users, ensure profile exists before the
            // first /api/me. If we have a pending referral code, use it.
            const pendingRefCode = localStorage.getItem('pendingReferralCode');
            if (pendingRefCode) {
              localStorage.removeItem('pendingReferralCode');
              await createGoogleProfile(pendingRefCode).catch(e =>
                console.warn('Failed to create Google profile:', e)
              );
            }

            // Hydrate. If the profile still does not exist, the OAuth
            // user has not yet provided a referral code -- surface the
            // refCode prompt instead of silently creating an orphan row.
            const profile = await hydrateProfile(authUser.id);
            if (!profile) {
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
      setEnabledFeatures(data.enabledFeatures?.length ? data.enabledFeatures : ['spin', 'daily-claim', 'leaderboard', 'support', 'ads-earn']);
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
    unsubs.push(subscribeToTable<any>('tasks', (rows) => setDynamicTasks(rows)));
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
    // first bootstrap account. The server enforces this too (/api/register
    // returns 400 when users already exist), but validating here gives
    // users an immediate error instead of a delayed network round-trip.
    const trimmedRefCode = regData.refCode.trim();
    if (!trimmedRefCode) {
      alert('Referral code is required. Please enter the code of the person who invited you.');
      return;
    }
    if (!/^\d{4,10}$/.test(trimmedRefCode)) {
      alert('Referral code must be a 6-digit number.');
      return;
    }
    const refValid = await validateReferralCode(trimmedRefCode);
    if (!refValid) {
      alert('This referral code is not valid. Please double-check and try again.');
      return;
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

      // Auto-login after registration
      await signIn.email({
        email: regData.email,
        password: regData.password,
      });

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
          alert('Referral code is required. Please enter the code of the person who invited you before continuing with Google.');
          return;
        }
        if (!/^\d{4,10}$/.test(trimmedRefCode)) {
          alert('Referral code must be a 6-digit number.');
          return;
        }
        const isValid = await validateReferralCode(trimmedRefCode);
        if (!isValid) {
          alert('This referral code is not valid. Please double-check and try again.');
          return;
        }
        // Stash the validated code so the post-OAuth /api/register/google-profile
        // call knows which referrer to attach.
        localStorage.setItem('pendingReferralCode', trimmedRefCode);
      }

      // Use Better Auth Google OAuth
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
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#C5A028]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Hamburger Menu -- top-left, matching the post-login nav position */}
      <div ref={authMenuRef} className="absolute top-4 left-4 z-30">
        <button
          type="button"
          aria-label="Open menu"
          aria-haspopup="menu"
          aria-expanded={showAuthMenu}
          onClick={() => setShowAuthMenu((v) => !v)}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#C5A028] border border-white/40 shadow-[0_8px_24px_-6px_rgba(212,175,55,0.45)] flex items-center justify-center text-white hover:shadow-[0_12px_28px_-4px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition-all"
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
              className="absolute left-0 mt-2 w-56 bg-white border border-[#D4AF37]/20 rounded-2xl shadow-xl overflow-hidden"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowInfoModal('info');
                  setShowAuthMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#C5A028] hover:bg-[#D4AF37]/10 transition-colors"
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
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#C5A028] hover:bg-[#D4AF37]/10 transition-colors border-t border-[#D4AF37]/10"
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
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#C5A028] hover:bg-[#D4AF37]/10 transition-colors border-t border-[#D4AF37]/10"
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
        <div className="bg-white border border-[#D4AF37]/20 rounded-[40px] p-10 shadow-[0_32px_64px_-16px_rgba(212,175,55,0.15)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#C5A028] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.3)] mb-6 relative group">
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
              <Wallet className="w-10 h-10 text-white relative z-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Top Earning <span className="text-[#D4AF37]">Elite</span></h1>

            {isRegistering ? (
              <div className="text-center">
                <p className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.4em] mb-2">The Future of Digital Work</p>
                <h2 className="text-lg font-bold text-slate-600">Join the Global Network</h2>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Start your journey to financial freedom today.</p>
                <div className="mt-4 p-3 bg-[#D4AF37]/5 rounded-2xl border border-[#D4AF37]/10">
                  <p className="text-[9px] font-black text-[#C5A028] uppercase tracking-widest leading-relaxed">
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
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={regData.name}
                      onChange={e => setRegData({ ...regData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type="text"
                      placeholder="Mobile Number"
                      value={regData.phone}
                      onChange={e => setRegData({ ...regData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={regData.email}
                      onChange={e => setRegData({ ...regData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min 6 digit)"
                      value={regData.password}
                      onChange={e => setRegData({ ...regData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#D4AF37] uppercase"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Again Password"
                      value={regData.confirmPassword}
                      onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type="text"
                      placeholder="Referral Code (required for new users)"
                      value={regData.refCode}
                      onChange={e => setRegData({ ...regData, refCode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <select
                      value={regData.country}
                      onChange={e => setRegData({ ...regData, country: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all appearance-none"
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
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                    <label htmlFor="reg-terms" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer">
                      I accept all rules and conditions
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleEmailRegister}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(212,175,55,0.3)] active:scale-95 transition-all mt-4"
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
                  className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-[#D4AF37]/30 hover:text-[#C5A028] transition-all shadow-sm active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" referrerPolicy="no-referrer" />
                  <span>Sign Up with Google</span>
                </button>

                <button onClick={() => setIsRegistering(false)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4 hover:text-[#D4AF37] transition-colors">
                  Existing Member? <span className="text-[#D4AF37] underline">Sign In</span>
                </button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type="text"
                      placeholder="Number or Email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#D4AF37] uppercase"
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
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <label htmlFor="login-terms" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer">
                        I accept all rules
                      </label>
                    </div>
                    <button
                      onClick={handlePasswordReset}
                      type="button"
                      className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest hover:underline transition-all"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleEmailLogin}
                  className="w-full bg-gradient-to-r from-[#D4AF37] via-[#C5A028] to-[#D4AF37] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(212,175,55,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(212,175,55,0.5)] active:scale-[0.98] transition-all mt-4 relative overflow-hidden group"
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
                    className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-[#D4AF37]/30 hover:text-[#C5A028] transition-all shadow-sm active:scale-95"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" referrerPolicy="no-referrer" />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    onClick={() => setIsRegistering(true)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all active:scale-95"
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
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
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
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl border border-[#D4AF37]/20"
            >
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-3xl flex items-center justify-center text-[#D4AF37] mb-6 mx-auto">
                {showInfoModal === 'info' ? <Globe className="w-8 h-8" /> : <Briefcase className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-widest mb-4">
                {showInfoModal === 'info' ? 'Website Info' : 'Freelancing'}
              </h3>
              <div className="text-sm font-medium text-slate-600 leading-relaxed text-center space-y-4">
                {showInfoModal === 'info' ? (
                  <div className="space-y-4 text-right dir-rtl">
                    <p className="text-[#D4AF37] font-black border-b border-[#D4AF37]/10 pb-2">আমাদের সাইটের বৈশিষ্ট্যসমূহ:</p>
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
                    <p className="text-[#D4AF37] font-black border-b border-[#D4AF37]/10 pb-2">ফ্রিল্যান্সিং ক্যারিয়ার:</p>
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
        {isAdmin && (
          <button onClick={() => setView('support')} className="glass-card p-4 flex flex-col items-center gap-2 border-white/40">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span className="text-[10px] font-black uppercase text-slate-600">Support</span>
          </button>
        )}
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

  const AdminView = () => {
    const [adminUser, setAdminUser] = useState(user);
    const [selectedUserEmail, setSelectedUserEmail] = useState(user.email);
    const [notice, setNotice] = useState(globalNotice);
    const [adminReply, setAdminReply] = useState('');
    const [adminMinWithdrawal, setAdminMinWithdrawal] = useState(minWithdrawal);
    const [adminWithdrawalFee, setAdminWithdrawalFee] = useState(withdrawalFee);
    const [adminDollarBuyRate, setAdminDollarBuyRate] = useState(dollarBuyRate);
    const [adminDollarSellRate, setAdminDollarSellRate] = useState(dollarSellRate);
    const [adminSpinCost, setAdminSpinCost] = useState(spinCost);
    const [adminDailyReward, setAdminDailyReward] = useState(dailyReward);
    const [adminGmailPassword, setAdminGmailPassword] = useState(gmailPassword);
    const [adminGmailReward, setAdminGmailReward] = useState(gmailReward);
    const [adminAdReward, setAdminAdReward] = useState(adReward);
    const [adminDailyAdLimit, setAdminDailyAdLimit] = useState(dailyAdLimit);
    const [adminDeliveryFee, setAdminDeliveryFee] = useState(deliveryFee);
    const [adminTelegramLink, setAdminTelegramLink] = useState(telegramLink);
    const [adminFacebookLink, setAdminFacebookLink] = useState(facebookLink);
    const [adminWhatsappLink, setAdminWhatsappLink] = useState(whatsappLink);
    const [adminShowWelcomeAnimation, setAdminShowWelcomeAnimation] = useState(showWelcomeAnimation);
    const [adminRulesText, setAdminRulesText] = useState(rulesText);
    const [adminSmmPrices, setAdminSmmPrices] = useState(smmPrices);
    const [localGen1Rate, setLocalGen1Rate] = useState(adminGen1Rate);
    const [localGen2Rate, setLocalGen2Rate] = useState(adminGen2Rate);
    const [localGen3Rate, setLocalGen3Rate] = useState(adminGen3Rate);
    const [adminActivationFee, setAdminActivationFee] = useState(activationFee);
    const [adminRechargeCommissionRate, setAdminRechargeCommissionRate] = useState(rechargeCommissionRate);
    const [adminActivationDuration, setAdminActivationDuration] = useState(activationDuration);
    const [adminReferralCommissionRate, setAdminReferralCommissionRate] = useState(referralCommissionRate);
    const [adminReferralActivationBonus, setAdminReferralActivationBonus] = useState(referralActivationBonus);
    const [adminMaintenance, setAdminMaintenance] = useState(isMaintenance);
    const [adminFolders, setAdminFolders] = useState(activeFolders);
    const [adminFeatures, setAdminFeatures] = useState(enabledFeatures);
    const [adminSmmServices, setAdminSmmServices] = useState(enabledSmmServices);
    const [adminEnabledCards, setAdminEnabledCards] = useState(enabledCards);
    const [adminTotalPaid, setAdminTotalPaid] = useState(totalPaid);
    const [adminActiveWorkerCount, setAdminActiveWorkerCount] = useState(activeWorkerCount);
    const [activeAdminTab, setActiveAdminTab] = useState<'gmail' | 'facebook' | 'withdrawals' | 'microjobs' | 'tasks' | 'recharge' | 'drive-requests' | 'drive-offers' | 'products' | 'product-orders' | 'dollar-buy' | 'deposits' | 'users' | 'ludo' | 'smm' | 'news' | 'social' | 'uploads' | 'subscriptions'>('gmail');
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [referralSearch, setReferralSearch] = useState('');
    const [balanceAmount, setBalanceAmount] = useState(0);
    const [newUserName, setNewUserName] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [selectedMicrojobs, setSelectedMicrojobs] = useState<string[]>([]);
    const [newNews, setNewNews] = useState({ content: '', imageUrl: '' });
    const [ludoForm, setLudoForm] = useState({ title: '', fee: '', prize: '', type: '1vs1', desc: '' });

    const postNews = async () => {
      if (!newNews.content.trim()) return;
      try {
        await adminInsert('newsPosts', {
          authorName: 'Owner',
          authorBadge: true,
          content: newNews.content.trim(),
          imageUrl: newNews.imageUrl.trim(),
          likes: [],
          comments: [],
          timestamp: Date.now()
        });
        setNewNews({ content: '', imageUrl: '' });
        alert('News posted successfully!');
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'newsPosts');
      }
    };
    const tabContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (tabContentRef.current && activeAdminTab) {
        tabContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, [activeAdminTab]);

    const handleUserStatus = async (userId: string, status: 'active' | 'banned' | 'suspended') => {
      const reason = status !== 'active' ? prompt(`Enter reason for ${status}:`) || 'Policy violation' : '';
      let suspensionUntil = '';
      if (status === 'suspended') {
        const days = parseInt(prompt('Enter suspension duration in days:', '3') || '3');
        const date = new Date();
        date.setDate(date.getDate() + days);
        suspensionUntil = date.toISOString();
      }

      try {
        // Update app-level user status via admin API (bypasses RLS)
        await adminUpdate('users', userId, {
          status,
          restrictionReason: reason,
          suspensionUntil
        });

        // For bans, also call server-side API to revoke Better Auth sessions
        // so the banned user is kicked out immediately (not after session expiry)
        if (status === 'banned') {
          try {
            await fetch('/api/admin/users/' + userId + '/ban', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ reason })
            });
          } catch (banErr) {
            console.error('Failed to revoke auth sessions for banned user:', banErr);
          }
        } else if (status === 'suspended') {
          // Revoke sessions for suspended users too
          try {
            await fetch('/api/admin/users/' + userId + '/revoke-sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
          } catch (revokeErr) {
            console.error('Failed to revoke auth sessions for suspended user:', revokeErr);
          }
        }

        alert(`User ${status} successfully!`);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
      }
    };

    const reactivateAllUsers = async () => {
      const suspendedUsers = allUsers.filter(u => u.status !== 'active');
      if (suspendedUsers.length === 0) {
        alert('No suspended or banned accounts found.');
        return;
      }

      if (!confirm(`Are you sure you want to reactivate ALL ${suspendedUsers.length} suspended/banned accounts?`)) return;

      setIsSubmitting(true);
      setSubmissionProgress(0);

      try {
        let count = 0;
        const CHUNK_SIZE = 10;
        // Process in batches of CHUNK_SIZE for performance (was previously sequential)
        for (let i = 0; i < suspendedUsers.length; i += CHUNK_SIZE) {
          const chunk = suspendedUsers.slice(i, i + CHUNK_SIZE);
          await Promise.all(chunk.map(u =>
            adminUpdate('users', u.id, {
              status: 'active',
              restrictionReason: '',
              suspensionUntil: ''
            })
          ));
          count += chunk.length;
          setSubmissionProgress((count / suspendedUsers.length) * 100);
        }
        alert(`Successfully reactivated ${count} accounts!`);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'bulk-users');
      } finally {
        setIsSubmitting(false);
        setSubmissionProgress(0);
      }
    };

    const processReferralCommission = async (userId: string, amount: number, source: string) => {
      try {
        const userRef_id = userId;
        const userData = await adminGetRow('users', userRef_id) as UserProfile | null;
        if (userData) {
          if (userData.referredBy) {
            const referrerRef_id = userData.referredBy;
            const referrerData = await adminGetRow('users', referrerRef_id) as UserProfile | null;
            if (referrerData) {
              const commission = (amount * referralCommissionRate) / 100;
              if (commission > 0) {
                // Use atomic increment for balance fields via admin API
                await adminIncrementFields('users', referrerRef_id, {
                  mainBalance: commission,
                  totalEarned: commission,
                  totalCommission: commission
                });
              }
            }
          }
        }
      } catch (e) {
        console.error('Referral Commission Error:', e);
      }
    };

    const [newTask, setNewTask] = useState({ title: '', reward: 0, desc: '', link: '', category: 'micro' as 'micro' | 'social' | 'gmail' | 'premium' });
    const [newDriveOffer, setNewDriveOffer] = useState({ title: '', operator: 'GP', price: 0, description: '' });
    const [newProduct, setNewProduct] = useState({ name: '', price: 0, resellPrice: 0, profitPerUnit: 0, description: '', category: '', image: '', variants: '', quantityOptions: '' });

    const saveChanges = async () => {
      try {
        const settingsRef_id = 'global';
        await adminUpsert('settings', {
          id: settingsRef_id,
          globalNotice: notice,
          isMaintenance: adminMaintenance,
          minWithdrawal: adminMinWithdrawal,
          withdrawalFee: adminWithdrawalFee,
          spinCost: adminSpinCost,
          dailyReward: adminDailyReward,
          activeFolders: adminFolders,
          enabledFeatures: adminFeatures,
          enabledSmmServices: adminSmmServices,
          enabledCards: adminEnabledCards,
          totalPaid: adminTotalPaid,
          activeWorkerCount: adminActiveWorkerCount,
          gmailPassword: adminGmailPassword,
          gmailReward: adminGmailReward,
          adReward: adminAdReward,
          dailyAdLimit: adminDailyAdLimit,
          deliveryFee: adminDeliveryFee,
          telegramLink: adminTelegramLink,
          facebookLink: adminFacebookLink,
          whatsappLink: adminWhatsappLink,
          showWelcomeAnimation: adminShowWelcomeAnimation,
          rulesText: adminRulesText,
          smmPrices: adminSmmPrices,
          gen1Rate: localGen1Rate,
          gen2Rate: localGen2Rate,
          gen3Rate: localGen3Rate,
          dollarBuyRate: adminDollarBuyRate,
          dollarSellRate: adminDollarSellRate,
          activationFee: adminActivationFee,
          rechargeCommissionRate: adminRechargeCommissionRate,
          activationDuration: adminActivationDuration,
          referralCommissionRate: adminReferralCommissionRate,
          referralActivationBonus: adminReferralActivationBonus
        });

        // Only update admin-editable profile fields, NOT financial fields.
        // Upserting the full adminUser object risks overwriting balance changes
        // made by other operations between page load and save.
        const { mainBalance, totalEarned, totalCommission, ...safeAdminFields } = adminUser;
        await adminUpsert('users', safeAdminFields);

        confetti({ particleCount: 150, spread: 70 });
        alert('All changes saved and applied successfully!');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'admin/save');
      }
    };

    const handleGmailAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid account' : undefined;
      try {
        await adminUpdate('gmailSubmissions', id, { status: action, reason });

        if (action === 'approved') {
          const s = gmailSubmissions.find(s => s.id === id);
          if (s) {
            const reward = s.reward || gmailReward;
            const userRef_id = s.userId;
            await adminIncrementFields('users', userRef_id, {
              mainBalance: reward,
              totalEarned: reward
            });
            await processReferralCommission(s.userId, reward, 'Gmail Submission');
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `gmailSubmissions/${id}`);
      }
    };

    const handleMicrojobAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Incomplete work' : undefined;
      try {
        await adminUpdate('microjobSubmissions', id, { status: action, reason });

        if (action === 'approved') {
          const s = microjobSubmissions.find(s => s.id === id);
          if (s) {
            const userRef_id = s.userId;
            const userData = await adminGetRow('users', userRef_id) as UserProfile | null;
            if (userData) {
              const task = dynamicTasks.find(t => t.id === s.microjobId || t.title === s.microjobId);
              const reward = task ? task.reward : 5.00;
              await adminIncrementFields('users', userRef_id, {
                mainBalance: reward,
                totalEarned: reward
              });
              await processReferralCommission(s.userId, reward, 'Microjob');
            }
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `microjobSubmissions/${id}`);
      }
    };

    const handleBulkTaskAction = async (action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason for all selected:') || 'Incomplete work' : undefined;
      setIsSubmitting(true);
      try {
        for (const id of selectedTasks) {
          await handleTaskAction(id, action);
        }
        setSelectedTasks([]);
        alert(`Successfully ${action} selected tasks!`);
      } catch (e) {
        console.error('Bulk Task Error:', e);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleBulkMicrojobAction = async (action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason for all selected:') || 'Incomplete work' : undefined;
      setIsSubmitting(true);
      try {
        for (const id of selectedMicrojobs) {
          await handleMicrojobAction(id, action);
        }
        setSelectedMicrojobs([]);
        alert(`Successfully ${action} selected microjobs!`);
      } catch (e) {
        console.error('Bulk Microjob Error:', e);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleTaskAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Proof not valid' : undefined;
      try {
        await adminUpdate('taskSubmissions', id, { status: action, reason });

        if (action === 'approved') {
          const s = taskSubmissions.find(s => s.id === id);
          if (s) {
            const reward = s.reward || 2.00;
            const userRef_id = s.userId;
            await adminIncrementFields('users', userRef_id, {
              mainBalance: reward,
              totalEarned: reward
            });
            await processReferralCommission(s.userId, reward, 'Task');
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `taskSubmissions/${id}`);
      }
    };

    const handleWithdrawAction = async (id: string, action: 'approved' | 'rejected') => {
      // Prevent double-clicks
      if (processingIds.has(id)) return;
      setProcessingIds(prev => new Set(prev).add(id));

      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Policy violation' : '';

      try {
        // Use server-side RPC for atomic withdrawal processing with proper locking
        await processWithdrawal(id, action, reason);
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `withdrawals/${id}`);
      } finally {
        setProcessingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };

    const handleRechargeAction = async (id: string, action: 'approved' | 'rejected') => {
      // Prevent double-clicks
      if (processingIds.has(id)) return;
      setProcessingIds(prev => new Set(prev).add(id));

      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid request' : '';
      try {
        // Use server-side RPC for atomic deposit processing with proper locking
        await processDeposit(id, action, reason);
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `rechargeRequests/${id}`);
      } finally {
        setProcessingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };

    const handleDriveOfferRequestAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid request' : undefined;
      try {
        await adminUpdate('driveOfferRequests', id, { status: action, reason });

        if (action === 'rejected') {
          const r = driveOfferRequests.find(r => r.id === id);
          if (r) {
            await adminIncrement('users', r.userId, 'mainBalance', r.amount);
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `driveOfferRequests/${id}`);
      }
    };

    const handleSmmAction = async (id: string, action: 'processing' | 'completed' | 'cancelled') => {
      const reason = action === 'cancelled' ? prompt('Enter cancellation reason:') || 'Invalid link' : undefined;
      try {
        await adminUpdate('smmOrders', id, { status: action });

        if (action === 'cancelled') {
          const o = smmOrders.find(o => o.id === id);
          if (o) {
            await adminIncrement('users', o.userId, 'mainBalance', o.amount);
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `smmOrders/${id}`);
      }
    };

    const handleDollarBuyAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid request' : undefined;
      try {
        await adminUpdate('dollarBuyRequests', id, { status: action, reason });

        if (action === 'rejected') {
          const r = dollarBuyRequests.find(r => r.id === id);
          if (r) {
            await adminIncrement('users', r.userId, 'mainBalance', r.price);
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `dollarBuyRequests/${id}`);
      }
    };

    const seedSampleProduct = async () => {
      const samples = [
        { name: 'Premium Smart Watch Z10', price: 1850, resellPrice: 2450, profitPerUnit: 600, description: 'Waterproof smart watch, heart rate + sleep tracking, 10-day battery', category: 'Electronics', variants: 'Black, Silver, Rose Gold', quantityOptions: '1x, 2x, 5x' },
        { name: 'Wireless Earbuds Pro X3', price: 650, resellPrice: 950, profitPerUnit: 300, description: 'Bluetooth 5.3 earbuds, ANC, 30hr battery with case', category: 'Electronics', variants: 'White, Black', quantityOptions: '1x, 3x, 10x' },
        { name: 'LED Ring Light 10"', price: 380, resellPrice: 550, profitPerUnit: 170, description: '10-inch ring light with tripod, 3 color modes, USB powered', category: 'Accessories', variants: '10 inch, 12 inch', quantityOptions: '1x, 2x' },
        { name: 'Phone Holder Car Mount', price: 180, resellPrice: 320, profitPerUnit: 140, description: '360 rotation, dashboard + air vent mount, universal fit', category: 'Accessories', variants: 'Standard, Premium (Suction)', quantityOptions: '1x, 5x, 10x' },
        { name: 'Portable Mini Fan USB', price: 150, resellPrice: 280, profitPerUnit: 130, description: 'Rechargeable mini desk fan, 3 speeds, quiet motor', category: 'Gadgets', variants: 'White, Pink, Blue', quantityOptions: '1x, 3x, 10x' },
      ];
      const sample = samples[Math.floor(Math.random() * samples.length)];
      try {
        await adminInsert('products', { ...sample, image: '' });
        confetti({ particleCount: 100, spread: 70 });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'products');
      }
    };

    const addProduct = async () => {
      if (!newProduct.name || newProduct.price <= 0) {
        alert('Please fill all required fields');
        return;
      }
      try {
        const productData = {
          ...newProduct,
          profitPerUnit: (newProduct.resellPrice || 0) > 0 ? (newProduct.resellPrice - newProduct.price) : newProduct.profitPerUnit
        };
        await adminInsert('products', productData);
        setNewProduct({ name: '', price: 0, resellPrice: 0, profitPerUnit: 0, description: '', category: '', image: '', variants: '', quantityOptions: '' });
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'products');
      }
    };

    const deleteProduct = async (id: string) => {
      if (!confirm('Delete this product?')) return;
      try {
        await adminDelete('products', id);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
      }
    };

    const handleProductOrderAction = async (id: string, action: 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
      const reason = action === 'cancelled' ? prompt('Enter cancellation reason:') || 'Out of stock' : undefined;
      try {
        await adminUpdate('productOrders', id, { status: action, reason });

        if (action === 'cancelled') {
          const o = productOrders.find(o => o.id === id);
          if (o) {
            await adminIncrement('users', o.userId, 'mainBalance', o.amount);
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `productOrders/${id}`);
      }
    };

    const addDriveOffer = async () => {
      if (!newDriveOffer.title || !newDriveOffer.price) return;
      try {
        await adminInsert('driveOffers', newDriveOffer);
        setNewDriveOffer({ title: '', operator: 'GP', price: 0, description: '' });
        alert('Drive offer added successfully!');
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'driveOffers');
      }
    };

    const deleteDriveOffer = async (id: string) => {
      try {
        await adminDelete('driveOffers', id);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `driveOffers/${id}`);
      }
    };

    const toggleFolder = (id: string) => {
      setAdminFolders(prev =>
        prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      );
    };

    const toggleFeature = (id: string) => {
      setAdminFeatures(prev =>
        prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      );
    };

    const toggleCard = (title: string) => {
      setAdminEnabledCards(prev =>
        prev.includes(title) ? prev.filter(c => c !== title) : [...prev, title]
      );
    };

    const addTask = async () => {
      if (!newTask.title || !newTask.link) return;
      try {
        await adminInsert('tasks', newTask);
        setNewTask({ title: '', reward: 0, desc: '', link: '', category: 'micro' });
        alert('Task added successfully!');
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'tasks');
      }
    };

    const deleteTask = async (id: string) => {
      try {
        await adminDelete('tasks', id);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `tasks/${id}`);
      }
    };

    const handleSubscriptionAction = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
      try {
        await adminUpdate('subscriptionRequests', id, { status, reason });

        const sub = subscriptionRequests.find(r => r.id === id);
        if (sub && status === 'rejected') {
          await adminIncrement('users', sub.userId, 'mainBalance', sub.price);
        }

        alert(`Subscription ${status}`);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'subscriptionRequests');
      }
    };

    const handleSocialAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid proof' : undefined;
      try {
        await adminUpdate('socialSubmissions', id, { status: action, reason });

        const s = allSocialSubmissions.find(s => s.id === id);
        if (s && action === 'approved') {
          const reward = s.amount || 0;
          if (reward > 0) {
            await adminIncrementFields('users', s.userId, {
              mainBalance: reward,
              totalEarned: reward
            });
            await processReferralCommission(s.userId, reward, 'Social Job');
          }
          const userData = await adminGetRow('users', s.userId) as UserProfile | null;
          if (userData) {
            await adminUpdate('users', s.userId, {
              notifications: [
                { id: Date.now().toString(), text: `Social Job Approved: ${s.type}${reward > 0 ? ` (+৳${reward})` : ''}`, date: new Date().toISOString().split('T')[0] },
                ...userData.notifications
              ]
            });
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `socialSubmissions/${id}`);
      }
    };

    const handleDeleteUpload = async (id: string) => {
      if (!confirm('Are you sure you want to delete this upload record?')) return;
      try {
        await adminDelete('uploads', id);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `uploads/${id}`);
      }
    };

    return (
      <div className="min-h-screen pb-32">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 neon-text glitch-text" data-text="Admin Terminal">Admin Terminal</h2>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                System Override Active
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mb-8">
            <div className="glass px-4 py-2 rounded-xl border-white/40 shadow-sm text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase">Users</p>
              <p className="text-xs font-black text-slate-900 font-mono">{allUsers.length}</p>
            </div>
            <div className="glass px-4 py-2 rounded-xl border-white/40 shadow-sm text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase">Paid</p>
              <p className="text-xs font-black text-emerald-600 font-mono">৳{totalPaid}</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Quick System Actions */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-500/20 shadow-sm">⚡</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Live Control Hub</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAdminMaintenance(!adminMaintenance)}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${adminMaintenance ? 'bg-rose-500 border-rose-400 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-600 hover:border-rose-500'}`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Maintenance</span>
                </button>
                <button
                  onClick={() => setView('home')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
                >
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Live Site</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('tasks')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
                >
                  <PlusCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Add Task</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('withdrawals')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-amber-500 hover:bg-amber-50/30"
                >
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Payouts</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('recharge')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
                >
                  <Smartphone className="w-5 h-5 text-indigo-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Recharge</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('drive-requests')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-amber-500 hover:bg-amber-50/30"
                >
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Drive Req</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('drive-offers')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
                >
                  <PlusCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">D-Offers</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('products')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-pink-500 hover:bg-pink-50/30"
                >
                  <ShoppingBag className="w-5 h-5 text-pink-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Products</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('product-orders')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
                >
                  <Package className="w-5 h-5 text-indigo-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Orders</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('tasks')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
                >
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Tasks</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('microjobs')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-emerald-500 hover:bg-emerald-50/30"
                >
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Microjobs</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('users')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
                >
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Users</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('ludo')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-orange-500 hover:bg-orange-50/30"
                >
                  <Trophy className="w-5 h-5 text-orange-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Ludo</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('smm')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
                >
                  <Zap className="w-5 h-5 text-indigo-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">SMM Panel</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('news')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
                >
                  <Newspaper className="w-5 h-5 text-indigo-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Top News</span>
                </button>
              </div>
            </section>

            {/* System Health Monitor */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-sm border border-emerald-500/20 shadow-sm">📊</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">System Health</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card border-white/40 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase">Live</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Server Latency</p>
                  <p className="text-xl font-black text-slate-900 font-mono">24ms</p>
                </div>
                <div className="glass-card border-white/40 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Wifi className="w-4 h-4 text-indigo-500" />
                    <span className="text-[8px] font-black text-indigo-500 uppercase">Stable</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Links</p>
                  <p className="text-xl font-black text-slate-900 font-mono">{dynamicTasks.length}</p>
                </div>
              </div>
            </section>

            {/* Live Activity Feed */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-sm border border-emerald-500/20 shadow-sm">📡</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Live Activity Feed</h3>
              </div>
              <div className="glass-card border-white/40 shadow-lg p-0 overflow-hidden">
                <div className="h-32 overflow-y-auto p-4 space-y-2 font-mono text-[9px]">
                  {[...gmailSubmissions, ...taskSubmissions, ...microjobSubmissions, ...withdrawals]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10)
                    .map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-500 border-b border-slate-50 pb-1 last:border-0">
                        <span className="text-indigo-500 font-bold">[{new Date(item.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-slate-800 font-black">USER_{item.userId.slice(0, 4)}</span>
                        <span>performed</span>
                        <span className="px-1 bg-slate-100 rounded text-slate-600 uppercase">{'amount' in item ? 'WITHDRAWAL' : 'SUBMISSION'}</span>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* System Configuration */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-500/20 shadow-sm">⚙️</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">System Configuration</h3>
              </div>
              <div className="glass-card border-white/40 shadow-lg space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gmail Password</label>
                    <input
                      type="text"
                      value={adminGmailPassword}
                      onChange={e => setAdminGmailPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Withdrawal</label>
                    <input
                      type="number"
                      value={adminMinWithdrawal}
                      onChange={e => setAdminMinWithdrawal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Withdrawal Fee (%)</label>
                    <input
                      type="number"
                      value={adminWithdrawalFee}
                      onChange={e => setAdminWithdrawalFee(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Dollar Buy Rate</label>
                    <input
                      type="number"
                      value={adminDollarBuyRate}
                      onChange={e => setAdminDollarBuyRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Dollar Sell Rate</label>
                    <input
                      type="number"
                      value={adminDollarSellRate}
                      onChange={e => setAdminDollarSellRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Spin Cost</label>
                    <input
                      type="number"
                      value={adminSpinCost}
                      onChange={e => setAdminSpinCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Reward</label>
                    <input
                      type="number"
                      value={adminDailyReward}
                      onChange={e => setAdminDailyReward(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gen 1 Rate</label>
                    <input
                      type="number"
                      value={localGen1Rate}
                      onChange={e => setLocalGen1Rate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gen 2 Rate</label>
                    <input
                      type="number"
                      value={localGen2Rate}
                      onChange={e => setLocalGen2Rate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gen 3 Rate</label>
                    <input
                      type="number"
                      value={localGen3Rate}
                      onChange={e => setLocalGen3Rate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Paid (৳)</label>
                    <input
                      type="number"
                      value={adminTotalPaid}
                      onChange={e => setAdminTotalPaid(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Workers</label>
                    <input
                      type="number"
                      value={adminActiveWorkerCount}
                      onChange={e => setAdminActiveWorkerCount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Gmail Reward</label>
                    <input
                      type="number"
                      value={adminGmailReward}
                      onChange={e => setAdminGmailReward(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Ad Reward</label>
                    <input
                      type="number"
                      value={adminAdReward}
                      onChange={e => setAdminAdReward(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Ad Limit</label>
                    <input
                      type="number"
                      value={adminDailyAdLimit}
                      onChange={e => setAdminDailyAdLimit(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Telegram Link</label>
                    <input
                      type="text"
                      value={adminTelegramLink}
                      onChange={e => setAdminTelegramLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Facebook Link</label>
                    <input
                      type="text"
                      value={adminFacebookLink}
                      onChange={e => setAdminFacebookLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Link</label>
                    <input
                      type="text"
                      value={adminWhatsappLink}
                      onChange={e => setAdminWhatsappLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Show Welcome Animation</label>
                    <select
                      value={adminShowWelcomeAnimation ? 'yes' : 'no'}
                      onChange={e => setAdminShowWelcomeAnimation(e.target.value === 'yes')}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Activation Fee</label>
                    <input
                      type="number"
                      value={adminActivationFee}
                      onChange={e => setAdminActivationFee(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Recharge Commission (Per 1000)</label>
                    <input
                      type="number"
                      value={adminRechargeCommissionRate}
                      onChange={e => setAdminRechargeCommissionRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Activation Duration (Days)</label>
                    <input
                      type="number"
                      value={adminActivationDuration}
                      onChange={e => setAdminActivationDuration(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Referral Commission (%)</label>
                    <input
                      type="number"
                      value={adminReferralCommissionRate}
                      onChange={e => setAdminReferralCommissionRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Referral Activation Bonus</label>
                    <input
                      type="number"
                      value={adminReferralActivationBonus}
                      onChange={e => setAdminReferralActivationBonus(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Rules Text</label>
                  <textarea
                    value={adminRulesText}
                    onChange={e => setAdminRulesText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-black font-bold outline-none focus:border-indigo-500 resize-none"
                    rows={4}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Global Notice</label>
                  <textarea
                    value={notice}
                    onChange={e => setNotice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-black font-bold outline-none focus:border-indigo-500 resize-none"
                    rows={2}
                  />
                </div>
                <button
                  onClick={saveChanges}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Apply System Changes
                </button>
              </div>
            </section>

            {/* User Management */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-500/20 shadow-sm">01</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">User Management</h3>
              </div>
              <div className="glass-card space-y-5 border-white/40 shadow-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Search by Email/Name</label>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-black font-bold outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Search by Referral ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ID..."
                        value={referralSearch}
                        onChange={e => setReferralSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-black font-bold outline-none focus:border-indigo-500 shadow-sm"
                      />
                      <button
                        onClick={() => {
                          const u = allUsers.find(u => u.numericId === referralSearch);
                          if (u) {
                            setAdminUser(u);
                            setSelectedUserEmail(u.email);
                            setNewUserName(u.name);
                            setNewUserPassword(u.password || '');
                          } else {
                            alert('User not found!');
                          }
                        }}
                        className="bg-indigo-600 text-white px-4 rounded-2xl font-bold text-xs"
                      >
                        Find
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Select User</label>
                  <select
                    value={selectedUserEmail}
                    onChange={(e) => {
                      const u = allUsers.find(u => u.email === e.target.value);
                      if (u) {
                        setAdminUser(u);
                        setSelectedUserEmail(u.email);
                        setNewUserName(u.name);
                        setNewUserPassword(u.password || '');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-black font-bold outline-none focus:border-indigo-500 shadow-sm"
                  >
                    {allUsers.filter(u =>
                      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.name.toLowerCase().includes(userSearch.toLowerCase())
                    ).map(u => (
                      <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase">Balance Control</h4>
                    <p className="text-[10px] font-bold text-indigo-600">Current: ৳{adminUser.mainBalance.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={balanceAmount}
                      onChange={e => setBalanceAmount(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-500"
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => setAdminUser({ ...adminUser, mainBalance: adminUser.mainBalance + balanceAmount })}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAdminUser({ ...adminUser, mainBalance: Math.max(0, adminUser.mainBalance - balanceAmount) })}
                      className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Change Name</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={e => {
                        setNewUserName(e.target.value);
                        setAdminUser({ ...adminUser, name: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-black font-bold outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Change Password</label>
                    <input
                      type="text"
                      value={newUserPassword}
                      onChange={e => {
                        setNewUserPassword(e.target.value);
                        setAdminUser({ ...adminUser, password: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-black font-bold outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Email Address</label>
                    <input
                      type="text"
                      value={adminUser.email}
                      onChange={e => setAdminUser({ ...adminUser, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-black font-bold outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Age</label>
                    <input
                      type="number"
                      value={adminUser.age}
                      onChange={e => setAdminUser({ ...adminUser, age: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-black font-bold outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Main Balance (৳)</label>
                    <input
                      type="number"
                      value={adminUser.mainBalance}
                      onChange={e => setAdminUser({ ...adminUser, mainBalance: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4 text-sm text-emerald-700 font-black outline-none focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Total Earned (৳)</label>
                    <input
                      type="number"
                      value={adminUser.totalEarned}
                      onChange={e => setAdminUser({ ...adminUser, totalEarned: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-4 text-sm text-indigo-700 font-black outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Pending Payout (৳)</label>
                    <input
                      type="number"
                      value={adminUser.pendingPayout}
                      onChange={e => setAdminUser({ ...adminUser, pendingPayout: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Rank</label>
                    <input
                      type="text"
                      value={adminUser.rank}
                      onChange={e => setAdminUser({ ...adminUser, rank: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                  <div>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Account Activation</p>
                    <p className="text-[10px] text-slate-500 mt-1">{adminUser.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <button
                    onClick={() => setAdminUser({ ...adminUser, isActive: !adminUser.isActive })}
                    className={`w-14 h-7 rounded-full relative transition-all duration-300 ${adminUser.isActive ? 'bg-indigo-500 shadow-md' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${adminUser.isActive ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (confirm(`Are you sure you want to DELETE user ${adminUser.email}? This cannot be undone.`)) {
                      try {
                        await adminDelete('users', adminUser.id);
                        alert('User deleted successfully!');
                        // Refresh users list or select another user
                      } catch (e) {
                        handleFirestoreError(e, OperationType.DELETE, `users/${adminUser.id}`);
                      }
                    }
                  }}
                  className="w-full py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                >
                  Delete User Account
                </button>
              </div>
            </section>

            {/* Global Settings */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 font-black text-sm border border-purple-500/20 shadow-sm">02</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Global Configuration</h3>
              </div>
              <div className="glass-card space-y-5 border-white/40 shadow-lg">
                <div className="flex items-center justify-between p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                  <div>
                    <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Maintenance Mode</p>
                    <p className="text-[10px] text-slate-500 mt-1">Lock all application features</p>
                  </div>
                  <button
                    onClick={() => setAdminMaintenance(!adminMaintenance)}
                    className={`w-14 h-7 rounded-full relative transition-all duration-300 ${adminMaintenance ? 'bg-rose-500 shadow-md' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${adminMaintenance ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Global Notice Broadcast</label>
                  <textarea
                    value={notice}
                    onChange={e => setNotice(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 resize-none shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Min Withdrawal (৳)</label>
                    <input
                      type="number"
                      value={adminMinWithdrawal}
                      onChange={e => setAdminMinWithdrawal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Spin Cost (৳)</label>
                    <input
                      type="number"
                      value={adminSpinCost}
                      onChange={e => setAdminSpinCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Daily Reward (৳)</label>
                    <input
                      type="number"
                      value={adminDailyReward}
                      onChange={e => setAdminDailyReward(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Ad Reward (৳)</label>
                    <input
                      type="number"
                      value={adminAdReward}
                      onChange={e => setAdminAdReward(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Delivery Fee (৳)</label>
                    <input
                      type="number"
                      value={adminDeliveryFee}
                      onChange={e => setAdminDeliveryFee(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Feature Toggles */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-sm border border-emerald-500/20 shadow-sm">03</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Feature Matrix</h3>
              </div>
              <div className="glass-card space-y-6 border-white/40 shadow-lg">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-4 block">Core Modules</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'spin', label: 'Spin & Win' },
                      { id: 'daily-claim', label: 'Daily Claim' },
                      { id: 'leaderboard', label: 'Leaderboard' },
                      { id: 'support', label: 'Support Chat' },
                      { id: 'ads-earn', label: 'Ads Earn' },
                      { id: 'mobile-recharge', label: 'Mobile Recharge' },
                      { id: 'drive-offer', label: 'Drive Offer' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => toggleFeature(f.id)}
                        className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${adminFeatures.includes(f.id)
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-md'
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-4 block">Income Cards</label>
                  <div className="grid grid-cols-2 gap-3">
                    {INCOME_CARDS.map(c => (
                      <button
                        key={c.title}
                        onClick={() => toggleCard(c.title)}
                        className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${adminEnabledCards.includes(c.title)
                            ? 'bg-indigo-500 border-indigo-400 text-white shadow-md'
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-4 block">SMM & Boosting Services</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'fb-like', label: 'FB Likes' },
                      { id: 'fb-star', label: 'FB Stars' },
                      { id: 'fb-follow', label: 'FB Follow' },
                      { id: 'tg-member', label: 'TG Members' },
                      { id: 'tg-view', label: 'TG Views' },
                      { id: 'tg-star', label: 'TG Stars' },
                      { id: 'youtube-premium', label: 'YT Premium' },
                      { id: 'meta-verified', label: 'Meta Verified' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (adminSmmServices.includes(s.id)) {
                            setAdminSmmServices(adminSmmServices.filter(id => id !== s.id));
                          } else {
                            setAdminSmmServices([...adminSmmServices, s.id]);
                          }
                        }}
                        className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${adminSmmServices.includes(s.id)
                            ? 'bg-violet-500 border-violet-400 text-white shadow-md'
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Submissions Management */}
            <section className="space-y-4" ref={tabContentRef}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-black text-sm border border-amber-500/20 shadow-sm">04</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Submission Control</h3>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-nowrap gap-2 overflow-x-scroll pb-2 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                {[
                  { id: 'gmail', label: 'Gmail', icon: <Mail className="w-3 h-3" />, count: gmailSubmissions.filter(s => s.status === 'pending').length },
                  { id: 'facebook', label: 'Social', icon: <Facebook className="w-3 h-3" />, count: taskSubmissions.filter(s => s.status === 'pending' && (s.taskType.toLowerCase().includes('fb') || s.taskType.toLowerCase().includes('facebook'))).length },
                  { id: 'microjobs', label: 'Micro', icon: <Briefcase className="w-3 h-3" />, count: microjobSubmissions.filter(s => s.status === 'pending').length },
                  { id: 'products', label: 'Products', icon: <ShoppingBag className="w-3 h-3" />, count: 0 },
                  { id: 'product-orders', label: 'Orders', icon: <Package className="w-3 h-3" />, count: productOrders.filter(o => o.status === 'pending').length },
                  { id: 'drive-offers', label: 'D-Offers', icon: <Wifi className="w-3 h-3" />, count: 0 },
                  { id: 'drive-requests', label: 'D-Requests', icon: <Smartphone className="w-3 h-3" />, count: driveOfferRequests.filter(r => r.status === 'pending').length },
                  { id: 'dollar-buy', label: 'D-Buy', icon: <DollarSign className="w-3 h-3" />, count: dollarBuyRequests.filter(r => r.status === 'pending').length },
                  { id: 'deposits', label: 'Deposits', icon: <PlusCircle className="w-3 h-3" />, count: rechargeRequests.filter(r => r.status === 'pending').length },
                  { id: 'withdrawals', label: 'Payouts', icon: <CreditCard className="w-3 h-3" />, count: withdrawals.filter(w => w.status === 'pending').length },
                  { id: 'subscriptions', label: 'Boosting', icon: <Zap className="w-3 h-3" />, count: subscriptionRequests.filter(r => r.status === 'pending').length },
                  { id: 'ludo', label: 'Ludo', icon: <Trophy className="w-3 h-3" />, count: ludoSubmissions.filter(s => s.status === 'pending').length },
                  { id: 'social', label: 'Social Job', icon: <Users className="w-3 h-3" />, count: allSocialSubmissions.filter(s => s.status === 'pending').length },
                  { id: 'uploads', label: 'Uploads', icon: <Upload className="w-3 h-3" />, count: allUploads.length },
                  { id: 'tasks', label: 'Manage', icon: <PlusCircle className="w-3 h-3" />, count: 0 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAdminTab(tab.id as typeof activeAdminTab)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 relative ${activeAdminTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-lg scale-105 z-10'
                        : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white animate-bounce">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Gmail Submissions */}
              {activeAdminTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-500/20 shadow-sm">👥</div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">User Management</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={reactivateAllUsers}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                        Reactivate All
                      </button>
                      <div className="relative w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search Ref Code..."
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-[10px] font-bold outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {allUsers
                      .filter(u => !userSearch || u.numericId.includes(userSearch))
                      .map(u => (
                        <div key={u.id} className="glass-card border-white/40 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center relative">
                                <User className="w-6 h-6 text-slate-400" />
                                {u.status !== 'active' && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                                    <UserX className="w-2 h-2" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800 uppercase">{u.name}</p>
                                <p className="text-[8px] font-bold text-slate-400">{u.email} • ID: {u.numericId}</p>
                                <p className="text-[8px] font-bold text-indigo-600 uppercase">Balance: ৳ {u.mainBalance.toFixed(2)}</p>
                                {u.status !== 'active' && (
                                  <p className="text-[7px] font-bold text-rose-500 uppercase mt-1">
                                    {u.status}: {u.restrictionReason}
                                    {u.status === 'suspended' && ` (Until ${new Date(u.suspensionUntil).toLocaleDateString()})`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex gap-1">
                                <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest border ${u.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                  }`}>
                                  {u.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest border ${u.status === 'active' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                                    u.status === 'banned' ? 'bg-slate-900 text-white border-slate-900' :
                                      'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  }`}>
                                  {u.status}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      const userRef_id = u.id;
                                      await adminUpdate('users', userRef_id, { isActive: !u.isActive });
                                      alert(`User ${u.isActive ? 'deactivated' : 'activated'} successfully!`);
                                    } catch (e) {
                                      handleFirestoreError(e, OperationType.UPDATE, `users/${u.id}`);
                                    }
                                  }}
                                  className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest text-white shadow-sm active:scale-95 transition-all ${u.isActive ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`}
                                >
                                  {u.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                {u.status === 'active' ? (
                                  <>
                                    <button
                                      onClick={() => handleUserStatus(u.id, 'suspended')}
                                      className="text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest text-white bg-amber-500 shadow-sm active:scale-95 transition-all"
                                    >
                                      Suspend
                                    </button>
                                    <button
                                      onClick={() => handleUserStatus(u.id, 'banned')}
                                      className="text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest text-white bg-slate-900 shadow-sm active:scale-95 transition-all"
                                    >
                                      Ban
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleUserStatus(u.id, 'active')}
                                    className="text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest text-white bg-indigo-600 shadow-sm active:scale-95 transition-all"
                                  >
                                    Unban / Unsuspend
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeAdminTab === 'news' && (
                <div className="space-y-6">
                  <div className="glass-card border-white/40 shadow-lg p-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Post New News (Facebook Style)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Content / Description</label>
                        <textarea
                          value={newNews.content}
                          onChange={e => setNewNews({ ...newNews, content: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 outline-none focus:border-indigo-500 min-h-[150px]"
                          placeholder="What's on your mind, Owner?"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Image (Optional)</label>
                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="news-image-upload"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const url = await uploadMedia(file);
                                  setNewNews(prev => ({ ...prev, imageUrl: url }));
                                } catch (err) {
                                  alert(err instanceof Error ? err.message : 'Upload failed');
                                }
                              }}
                            />
                            <label
                              htmlFor="news-image-upload"
                              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-blue-500 transition-all"
                            >
                              {newNews.imageUrl ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Image Ready</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="w-5 h-5 text-slate-300" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Upload Image from Gallery</span>
                                </div>
                              )}
                            </label>
                          </div>
                          {newNews.imageUrl && (
                            <div className="flex items-center gap-2">
                              <p className="text-[8px] text-slate-400 truncate flex-1">{newNews.imageUrl}</p>
                              <button onClick={() => setNewNews(prev => ({ ...prev, imageUrl: '' }))} className="text-rose-500 hover:text-rose-600">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <input
                            type="text"
                            value={newNews.imageUrl}
                            onChange={e => setNewNews({ ...newNews, imageUrl: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                            placeholder="Or paste image URL manually"
                          />
                        </div>
                      </div>
                      <button
                        onClick={postNews}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                        Post to Top News
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Manage Posts</h3>
                    {newsPosts.map(post => (
                      <div key={post.id} className="glass-card border-white/40 shadow-sm p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Newspaper className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 line-clamp-1">{post.content}</p>
                            <p className="text-[10px] text-slate-400">{new Date(post.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this post?')) {
                              try {
                                await adminDelete('newsPosts', post.id);
                              } catch (e) {
                                handleFirestoreError(e, OperationType.DELETE, `newsPosts/${post.id}`);
                              }
                            }
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeAdminTab === 'gmail' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-500" />
                    Gmail Submissions
                  </h4>

                  {/* Live Inventory Summary */}
                  <div className="mb-6 p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Active Gmail Tasks</p>
                      <p className="text-lg font-black text-rose-600">{dynamicTasks.filter(t => t.category === 'gmail').length}</p>
                    </div>
                    <button onClick={() => setActiveAdminTab('tasks')} className="p-2 bg-white rounded-xl shadow-sm text-rose-500 hover:scale-110 transition-all">
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {gmailSubmissions.filter(s => s.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending Gmails</p>
                    ) : (
                      gmailSubmissions.filter(s => s.status === 'pending').map(s => (
                        <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-xs font-black text-slate-900">{s.email}</p>
                            <p className="text-[10px] text-slate-400">User: {s.userId}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleGmailAction(s.id, 'approved')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleGmailAction(s.id, 'rejected')} className="p-2 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Subscription Requests */}
              {activeAdminTab === 'subscriptions' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    Subscription Requests
                  </h4>
                  <div className="space-y-3">
                    {subscriptionRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending requests</p>
                    ) : (
                      subscriptionRequests.filter(r => r.status === 'pending').map(r => (
                        <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase">{r.type} PREMIUM</p>
                              <p className="text-[10px] text-indigo-600 font-bold">৳ {r.price}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">User: {r.userId}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleSubscriptionAction(r.id, 'approved')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                              <button onClick={() => handleSubscriptionAction(r.id, 'rejected')} className="p-2 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-600 font-bold">
                              {r.type === 'youtube' ? `Email: ${r.email}` : `Telegram ID: ${r.telegramId}`}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Facebook Submissions */}
              {activeAdminTab === 'facebook' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook Submissions
                  </h4>

                  {/* Live Inventory Summary */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Active FB Tasks</p>
                      <p className="text-lg font-black text-blue-600">{dynamicTasks.filter(t => t.category === 'social').length}</p>
                    </div>
                    <button onClick={() => setActiveAdminTab('tasks')} className="p-2 bg-white rounded-xl shadow-sm text-blue-500 hover:scale-110 transition-all">
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {taskSubmissions.filter(s => s.status === 'pending' && (s.taskType.toLowerCase().includes('fb') || s.taskType.toLowerCase().includes('facebook'))).length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending Facebook tasks</p>
                    ) : (
                      taskSubmissions.filter(s => s.status === 'pending' && (s.taskType.toLowerCase().includes('fb') || s.taskType.toLowerCase().includes('facebook'))).map(s => (
                        <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-black text-slate-900">{s.taskType}</p>
                              <p className="text-[10px] text-slate-400">User: {s.userName} ({s.userId})</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleTaskAction(s.id, 'approved')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                              <button onClick={() => handleTaskAction(s.id, 'rejected')} className="p-2 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                          {s.screenshot && (
                            <a href={s.screenshot} target="_blank" rel="noreferrer" className="block w-full h-32 rounded-xl overflow-hidden border border-slate-100 relative group">
                              <img src={s.screenshot} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-all" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <ExternalLink className="w-6 h-6 text-white" />
                              </div>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Microjob Submissions */}
              {activeAdminTab === 'microjobs' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    Microjob Submissions
                  </h4>

                  {/* Live Inventory Summary */}
                  <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Microjobs</p>
                      <p className="text-lg font-black text-indigo-600">{dynamicTasks.filter(t => t.category === 'micro').length}</p>
                    </div>
                    <button onClick={() => setActiveAdminTab('tasks')} className="p-2 bg-white rounded-xl shadow-sm text-indigo-500 hover:scale-110 transition-all">
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {microjobSubmissions.filter(s => s.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending Microjobs</p>
                    ) : (
                      microjobSubmissions.filter(s => s.status === 'pending').map(s => (
                        <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-black text-slate-900">{s.microjobId}</p>
                              <p className="text-[10px] text-slate-400">User: {s.userName} ({s.userId})</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleMicrojobAction(s.id, 'approved')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                              <button onClick={() => handleMicrojobAction(s.id, 'rejected')} className="p-2 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                          {s.screenshot && (
                            <a href={s.screenshot} target="_blank" rel="noreferrer" className="block w-full h-32 rounded-xl overflow-hidden border border-slate-100 relative group">
                              <img src={s.screenshot} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-all" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <ExternalLink className="w-6 h-6 text-white" />
                              </div>
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Dollar Buy Requests */}
              {activeAdminTab === 'dollar-buy' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-500" />
                    Dollar Buy Requests
                  </h4>
                  <div className="space-y-3">
                    {dollarBuyRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending buy requests</p>
                    ) : (
                      dollarBuyRequests.filter(r => r.status === 'pending').map(r => (
                        <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-xs font-black text-slate-900">${r.amount} via {r.method}</p>
                            <p className="text-[10px] text-slate-400">User: {r.userId}</p>
                            <p className="text-[10px] text-indigo-600 font-bold">Wallet: {r.wallet}</p>
                            <p className="text-[10px] text-emerald-600 font-bold">Cost: ৳{r.price}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleDollarBuyAction(r.id, 'approved')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleDollarBuyAction(r.id, 'rejected')} className="p-2 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SMM Panel Management */}
              {activeAdminTab === 'smm' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="glass-card border-white/40 shadow-lg">
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      SMM Panel Prices
                    </h4>
                    <div className="space-y-4">
                      {SMM_SERVICES.map(service => (
                        <div key={service.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${service.color} rounded-lg flex items-center justify-center text-white`}>
                              {service.icon}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 uppercase">{service.name}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Base: ৳{service.pricePer1k}/1k</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400">৳</span>
                            <input
                              type="number"
                              value={adminSmmPrices[service.id] || service.pricePer1k}
                              onChange={e => setAdminSmmPrices({ ...adminSmmPrices, [service.id]: parseFloat(e.target.value) || 0 })}
                              className="w-20 bg-white border border-slate-200 rounded-xl p-2 text-[10px] font-bold outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Zap className="w-5 h-5 text-indigo-500" />
                        SMM Panel Orders
                      </h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Manage growth services</p>
                    </div>
                    <div className="px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Orders</p>
                      <p className="text-lg font-black text-indigo-600">{smmOrders.filter(o => o.status === 'pending' || o.status === 'processing').length}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {smmOrders.filter(o => o.status === 'pending' || o.status === 'processing').length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                        <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">No active orders</p>
                      </div>
                    ) : (
                      smmOrders.filter(o => o.status === 'pending' || o.status === 'processing').map(o => (
                        <div key={o.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:border-indigo-500 transition-all group">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{o.service}</p>
                                <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase border ${o.status === 'processing' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                  }`}>
                                  {o.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div>
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                                  <p className="text-xs font-black text-emerald-600 tracking-tight">৳ {o.amount}</p>
                                </div>
                                <div className="w-px h-6 bg-slate-100" />
                                <div>
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                                  <p className="text-xs font-black text-slate-900 tracking-tight">{o.quantity.toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Link</p>
                                <p className="text-[9px] text-slate-600 font-medium break-all">{o.link}</p>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[8px] font-black uppercase">
                                  {o.userName.charAt(0)}
                                </div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ordered by {o.userName}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              {o.status === 'pending' && (
                                <button
                                  onClick={() => handleSmmAction(o.id, 'processing')}
                                  className="w-24 py-2.5 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                  <Zap className="w-3 h-3" />
                                  START
                                </button>
                              )}
                              {o.status === 'processing' && (
                                <button
                                  onClick={() => handleSmmAction(o.id, 'completed')}
                                  className="w-24 py-2.5 bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                  <Check className="w-3 h-3" />
                                  FINISH
                                </button>
                              )}
                              <button
                                onClick={() => handleSmmAction(o.id, 'cancelled')}
                                className="w-24 py-2.5 bg-white text-rose-600 border border-rose-100 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <X className="w-3 h-3" />
                                CANCEL
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Withdrawals */}
              {activeAdminTab === 'withdrawals' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    Withdrawal Requests
                  </h4>
                  <div className="space-y-3">
                    {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending withdrawals</p>
                    ) : (
                      withdrawals.filter(w => w.status === 'pending').map(w => (
                        <div key={w.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <div>
                            <div className="flex flex-col">
                              <p className="text-xs font-black text-slate-900">৳ {w.amount}</p>
                              {w.fee && (
                                <p className="text-[8px] font-bold text-slate-400 uppercase">
                                  Receive: ৳ {w.receiveAmount} | Fee: ৳ {w.fee}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400">{w.method}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleWithdrawAction(w.id, 'approved')} disabled={processingIds.has(w.id)} className={`p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all ${processingIds.has(w.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>{processingIds.has(w.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</button>
                            <button onClick={() => handleWithdrawAction(w.id, 'rejected')} disabled={processingIds.has(w.id)} className={`p-2 bg-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all ${processingIds.has(w.id) ? 'opacity-50 cursor-not-allowed' : ''}`}><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Deposits (Recharge Requests) */}
              {activeAdminTab === 'deposits' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-500" />
                    Deposit Requests
                  </h4>
                  <div className="space-y-3">
                    {rechargeRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending deposits</p>
                    ) : (
                      rechargeRequests.filter(r => r.status === 'pending').map(r => (
                        <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-xs font-black text-slate-900">৳ {r.amount}</p>
                            <p className="text-[10px] text-slate-400">{r.operator} • {r.phone} • {r.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRechargeAction(r.id, 'approved')} disabled={processingIds.has(r.id)} className={`p-2 bg-emerald-500/20 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all ${processingIds.has(r.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>{processingIds.has(r.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</button>
                            <button onClick={() => handleRechargeAction(r.id, 'rejected')} disabled={processingIds.has(r.id)} className={`p-2 bg-rose-500/20 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all ${processingIds.has(r.id) ? 'opacity-50 cursor-not-allowed' : ''}`}><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Ludo Tournament Management */}
              {activeAdminTab === 'ludo' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Create Tournament */}
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Create Tournament</h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Setup new match</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Tournament Title</label>
                        <input type="text" placeholder="e.g. Daily Mega Match" value={ludoForm.title} onChange={e => setLudoForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Entry Fee (৳)</label>
                        <input type="number" placeholder="50" value={ludoForm.fee} onChange={e => setLudoForm(f => ({ ...f, fee: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Prize Pool (৳)</label>
                        <input type="number" placeholder="90" value={ludoForm.prize} onChange={e => setLudoForm(f => ({ ...f, prize: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Match Type</label>
                        <select value={ludoForm.type} onChange={e => setLudoForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none">
                          <option value="1vs1">1vs1 (2 Players)</option>
                          <option value="4player">4 Players</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Rules & Description</label>
                      <textarea placeholder="Enter match rules and details..." value={ludoForm.desc} onChange={e => setLudoForm(f => ({ ...f, desc: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all h-32 resize-none" />
                    </div>

                    <button
                      onClick={async () => {
                        const fee = parseFloat(ludoForm.fee);
                        const prize = parseFloat(ludoForm.prize);

                        if (!ludoForm.title || !fee || !prize) return alert('Fill all fields');

                        await adminInsert('ludoTournaments', {
                          title: ludoForm.title, entryFee: fee, prizePool: prize, type: ludoForm.type, description: ludoForm.desc, rules: 'ম্যাচ শুরু হওয়ার ১০ মিনিট আগে রুম কোড দেওয়া হবে। গেম শেষ হওয়ার পর স্ক্রিনশট জমা দিতে হবে। কোনো প্রকার চিটিং করলে আইডি ব্যান করা হবে। সঠিক লুডু ইউজারনেম ব্যবহার করতে হবে।',
                          status: 'open', maxPlayers: ludoForm.type === '1vs1' ? 2 : 4, currentPlayers: 0, startTime: new Date().toISOString(),
                          playerIds: []
                        });
                        alert('Tournament Created!');
                        setLudoForm({ title: '', fee: '', prize: '', type: '1vs1', desc: '' });
                      }}
                      className="w-full mt-8 bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      Create Tournament
                    </button>
                  </div>

                  {/* Active Tournaments Management */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Manage Tournaments</h3>
                      <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">
                        {ludoTournaments.length} Total
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {ludoTournaments.map(t => (
                        <div key={t.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-indigo-500 transition-all group">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{t.title}</p>
                                <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase border ${t.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    t.status === 'ongoing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-slate-50 text-slate-400 border-slate-100'
                                  }`}>
                                  {t.status}
                                </span>
                              </div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.type} • {t.currentPlayers}/{t.maxPlayers} Players Joined</p>
                            </div>
                            <select
                              value={t.status}
                              onChange={async (e) => {
                                await adminUpdate('ludoTournaments', t.id, { status: e.target.value });
                              }}
                              className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-[8px] font-black uppercase outline-none focus:border-indigo-500"
                            >
                              <option value="open">Open</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="space-y-2">
                              <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-2">Match Room Code</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Enter Room Code"
                                  defaultValue={t.roomCode || ''}
                                  onBlur={async (e) => {
                                    await adminUpdate('ludoTournaments', t.id, { roomCode: e.target.value });
                                  }}
                                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-bold outline-none focus:border-indigo-500"
                                />
                                <button
                                  onClick={async () => {
                                    if (confirm('Delete this tournament?')) {
                                      await adminDelete('ludoTournaments', t.id);
                                    }
                                  }}
                                  className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-2">Joined Players ({t.playerIds?.length || 0})</p>
                              <div className="flex flex-wrap gap-1.5">
                                {t.playerIds?.length === 0 ? (
                                  <p className="text-[8px] text-slate-300 font-bold uppercase">No players yet</p>
                                ) : (
                                  t.playerIds?.map(pid => (
                                    <span key={pid} className="text-[7px] bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-600 font-black shadow-sm">{pid}</span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submissions */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Pending Submissions</h3>
                      <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-100">
                        {ludoSubmissions.filter(s => s.status === 'pending').length} Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {ludoSubmissions.filter(s => s.status === 'pending').length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                          <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">No pending results</p>
                        </div>
                      ) : (
                        ludoSubmissions.filter(s => s.status === 'pending').map(s => (
                          <div key={s.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-xs font-black uppercase">
                                  {s.userName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{s.userName}</p>
                                  <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest">Ludo ID: {s.ludoUsername}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tournament ID</p>
                                <p className="text-[9px] font-bold text-slate-600">{s.tournamentId}</p>
                              </div>
                            </div>

                            <a href={s.screenshot} target="_blank" rel="noreferrer" className="block w-full h-64 rounded-2xl overflow-hidden border border-slate-100 relative group">
                              <img src={s.screenshot} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="Proof" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <ExternalLink className="w-6 h-6 text-white" />
                              </div>
                            </a>

                            <div className="flex gap-3">
                              <button
                                onClick={async () => {
                                  const tournament = ludoTournaments.find(t => t.id === s.tournamentId);
                                  if (!tournament) return;
                                  // Use atomic increment for prize payout
                                  await adminIncrementFields('users', s.userId, {
                                    mainBalance: tournament.prizePool,
                                    totalEarned: tournament.prizePool
                                  });
                                  await adminUpdate('ludoSubmissions', s.id, { status: 'approved' });
                                  alert('Submission Approved & Prize Paid!');
                                }}
                                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Approve & Pay
                              </button>
                              <button
                                onClick={async () => {
                                  await adminUpdate('ludoSubmissions', s.id, { status: 'rejected' });
                                  alert('Submission Rejected');
                                }}
                                className="flex-1 bg-white text-rose-600 border border-rose-100 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeAdminTab === 'tasks' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-indigo-500" />
                    Add New Task
                  </h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Task Title"
                      value={newTask.title}
                      onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Reward (৳)"
                        value={newTask.reward}
                        onChange={e => setNewTask({ ...newTask, reward: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <select
                        value={newTask.category}
                        onChange={e => setNewTask({ ...newTask, category: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      >
                        <option value="micro">Microjob (Folder A)</option>
                        <option value="social">Social Media (Folder B)</option>
                        <option value="gmail">Gmail Marketing (Folder C)</option>
                        <option value="premium">Premium Income (Folder D)</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Task Link"
                      value={newTask.link}
                      onChange={e => setNewTask({ ...newTask, link: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <textarea
                      placeholder="Description"
                      value={newTask.desc}
                      onChange={e => setNewTask({ ...newTask, desc: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 resize-none"
                      rows={2}
                    />
                    <button
                      onClick={addTask}
                      className="w-full py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    >
                      Add Task to System
                    </button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Task Inventory</h5>
                    <div className="space-y-3">
                      {dynamicTasks.map(t => (
                        <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-black text-slate-900">{t.title}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold">{t.category} • ৳{t.reward}</p>
                          </div>
                          <button onClick={() => deleteTask(t.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recharge Requests */}
              {activeAdminTab === 'recharge' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    Recharge Requests
                  </h4>
                  <div className="space-y-3">
                    {rechargeRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending recharges</p>
                    ) : (
                      rechargeRequests.filter(r => r.status === 'pending').map(r => (
                        <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <div>
                            <p className="text-xs font-black text-slate-900">৳ {r.amount}</p>
                            <p className="text-[10px] text-slate-400">{r.operator} • {r.phone} • {r.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRechargeAction(r.id, 'approved')} disabled={processingIds.has(r.id)} className={`p-2 bg-emerald-500/20 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all ${processingIds.has(r.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>{processingIds.has(r.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</button>
                            <button onClick={() => handleRechargeAction(r.id, 'rejected')} disabled={processingIds.has(r.id)} className={`p-2 bg-rose-500/20 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all ${processingIds.has(r.id) ? 'opacity-50 cursor-not-allowed' : ''}`}><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Drive Offer Requests */}
              {activeAdminTab === 'drive-requests' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Drive Offer Requests
                  </h4>
                  <div className="space-y-3">
                    {driveOfferRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending drive requests</p>
                    ) : (
                      driveOfferRequests.filter(r => r.status === 'pending').map(r => {
                        const offer = driveOffers.find(o => o.id === r.driveOfferId);
                        return (
                          <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                            <div>
                              <p className="text-xs font-black text-slate-900">{offer?.title || 'Drive Offer'}</p>
                              <p className="text-[10px] text-slate-400">৳ {r.amount} • {r.phone}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleDriveOfferRequestAction(r.id, 'approved')} className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                              <button onClick={() => handleDriveOfferRequestAction(r.id, 'rejected')} className="p-2 bg-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Drive Offer Management */}
              {activeAdminTab === 'drive-offers' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-500" />
                    Manage Drive Offers
                  </h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Offer Title"
                      value={newDriveOffer.title}
                      onChange={e => setNewDriveOffer({ ...newDriveOffer, title: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Price (৳)"
                        value={newDriveOffer.price}
                        onChange={e => setNewDriveOffer({ ...newDriveOffer, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <select
                        value={newDriveOffer.operator}
                        onChange={e => setNewDriveOffer({ ...newDriveOffer, operator: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      >
                        <option value="GP">GP</option>
                        <option value="Robi">Robi</option>
                        <option value="Banglalink">Banglalink</option>
                        <option value="Teletalk">Teletalk</option>
                        <option value="Airtel">Airtel</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Description"
                      value={newDriveOffer.description}
                      onChange={e => setNewDriveOffer({ ...newDriveOffer, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 resize-none"
                      rows={2}
                    />
                    <button
                      onClick={addDriveOffer}
                      className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    >
                      Add Drive Offer
                    </button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Drive Offers</h5>
                    <div className="space-y-3">
                      {driveOffers.map(o => (
                        <div key={o.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-black text-slate-900">{o.title}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold">{o.operator} • ৳{o.price}</p>
                          </div>
                          <button onClick={() => deleteDriveOffer(o.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Management */}
              {activeAdminTab === 'products' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-pink-500" />
                    Manage Products
                  </h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={newProduct.name}
                      onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        placeholder="Sell Price (৳)"
                        value={newProduct.price || ''}
                        onChange={e => {
                          const price = parseFloat(e.target.value) || 0;
                          const profit = (newProduct.resellPrice || 0) > 0 ? (newProduct.resellPrice - price) : 0;
                          setNewProduct({ ...newProduct, price, profitPerUnit: profit > 0 ? profit : 0 });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Resell Price (৳)"
                        value={newProduct.resellPrice || ''}
                        onChange={e => {
                          const resell = parseFloat(e.target.value) || 0;
                          const profit = resell > 0 && newProduct.price > 0 ? (resell - newProduct.price) : 0;
                          setNewProduct({ ...newProduct, resellPrice: resell, profitPerUnit: profit > 0 ? profit : 0 });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col items-center justify-center">
                        <span className="text-[7px] font-black text-emerald-500 uppercase">Profit</span>
                        <span className="text-xs font-black text-emerald-700">৳ {(newProduct.profitPerUnit || 0).toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Category (e.g. Electronics)"
                        value={newProduct.category}
                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Qty Options (e.g. 1x, 3x, 10x)"
                        value={newProduct.quantityOptions}
                        onChange={e => setNewProduct({ ...newProduct, quantityOptions: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Variants (e.g. Black, White, Red | S, M, L)"
                      value={newProduct.variants}
                      onChange={e => setNewProduct({ ...newProduct, variants: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <textarea
                      placeholder="Short description (1-2 lines max)"
                      value={newProduct.description}
                      onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 resize-none"
                      rows={2}
                      maxLength={150}
                    />
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Product Image</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="product-image-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadMedia(file);
                              setNewProduct(prev => ({ ...prev, image: url }));
                            } catch (err) {
                              alert(err instanceof Error ? err.message : 'Upload failed');
                            }
                          }}
                        />
                        <label
                          htmlFor="product-image-upload"
                          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-pink-500 transition-all"
                        >
                          {newProduct.image ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">Image Uploaded</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Upload Product Image</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addProduct}
                        className="flex-1 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all bg-pink-500 hover:bg-pink-600"
                      >
                        Add Product
                      </button>
                      <button
                        onClick={seedSampleProduct}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
                        title="Post AI Sample Product"
                      >
                        <Zap className="w-4 h-4" />
                        AI POST
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Product Inventory ({products.length})</h5>
                    <div className="space-y-3">
                      {products.map(p => (
                        <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              {p.image ? (
                                <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                                  <ShoppingBag className="w-5 h-5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">{p.name}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-[8px] text-slate-400 font-bold">Sell: <span className="text-indigo-600">৳{p.price}</span></span>
                                  {p.resellPrice ? <span className="text-[8px] text-slate-400 font-bold">Resell: <span className="text-emerald-600">৳{p.resellPrice}</span></span> : null}
                                  {(p.profitPerUnit ?? 0) > 0 ? <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+৳{p.profitPerUnit}</span> : null}
                                </div>
                                {p.category && <span className="text-[7px] text-slate-400 font-bold uppercase">{p.category}</span>}
                                {p.variants && <p className="text-[7px] text-slate-400 mt-0.5">Variants: {p.variants}</p>}
                              </div>
                            </div>
                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Orders */}
              {activeAdminTab === 'product-orders' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    Product Orders
                  </h4>
                  <div className="space-y-6">
                    {/* Pending Orders */}
                    <div>
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pending Orders</h5>
                      <div className="space-y-3">
                        {productOrders.filter(o => o.status === 'pending').length === 0 ? (
                          <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No pending orders</p>
                        ) : (
                          productOrders.filter(o => o.status === 'pending').map(o => {
                            const product = products.find(p => p.id === o.productId);
                            return (
                              <div key={o.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-black text-slate-900">{product?.name || 'Product'}</p>
                                    <p className="text-[10px] text-slate-400">৳ {o.amount} • {o.phone}</p>
                                    {o.paymentStatus === 'COD' && (
                                      <p className="text-[8px] font-black text-rose-500 uppercase mt-1">Cash on Delivery</p>
                                    )}
                                  </div>
                                  <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase">Pending</span>
                                </div>
                                <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <span className="font-black uppercase text-[8px] block mb-1">Address:</span>
                                  {o.address}
                                </p>
                                <div className="flex gap-2">
                                  <button onClick={() => handleProductOrderAction(o.id, 'processing')} className="flex-1 py-2 bg-indigo-500 text-white rounded-xl font-black text-[8px] uppercase tracking-widest">Process Order</button>
                                  <button onClick={() => handleProductOrderAction(o.id, 'cancelled')} className="p-2 bg-rose-500/20 text-rose-500 rounded-xl"><X className="w-4 h-4" /></button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Processing Orders */}
                    <div>
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Processing Orders</h5>
                      <div className="space-y-3">
                        {productOrders.filter(o => o.status === 'processing').length === 0 ? (
                          <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No orders in processing</p>
                        ) : (
                          productOrders.filter(o => o.status === 'processing').map(o => {
                            const product = products.find(p => p.id === o.productId);
                            return (
                              <div key={o.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-black text-slate-900">{product?.name || 'Product'}</p>
                                    <p className="text-[10px] text-slate-400">৳ {o.amount} • {o.phone}</p>
                                  </div>
                                  <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full uppercase">Processing</span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleProductOrderAction(o.id, 'delivered')} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-black text-[8px] uppercase tracking-widest">Mark Delivered</button>
                                  <button onClick={() => handleProductOrderAction(o.id, 'cancelled')} className="p-2 bg-rose-500/20 text-rose-500 rounded-xl"><X className="w-4 h-4" /></button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Job Submissions */}
              {activeAdminTab === 'social' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Social Job Submissions
                  </h4>
                  <div className="space-y-4">
                    {allSocialSubmissions.filter(s => s.status === 'pending').length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-8 uppercase font-bold">No pending submissions</p>
                    ) : (
                      allSocialSubmissions.filter(s => s.status === 'pending').map(s => (
                        <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-black text-slate-900">{s.userName}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{s.type}</p>
                            </div>
                            <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase">Pending</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                            <p className="text-[10px] font-bold text-slate-600">Trx ID: <span className="text-indigo-600 font-black">{s.trxId}</span></p>
                            <a href={s.screenshot} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black text-indigo-500 uppercase flex items-center gap-1 hover:underline">
                              <ExternalLink className="w-3 h-3" /> View Screenshot
                            </a>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSocialAction(s.id, 'approved')} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-black text-[8px] uppercase tracking-widest">Approve</button>
                            <button onClick={() => handleSocialAction(s.id, 'rejected')} className="flex-1 py-2 bg-rose-500 text-white rounded-xl font-black text-[8px] uppercase tracking-widest">Reject</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Global Uploads Tracking */}
              {activeAdminTab === 'uploads' && (
                <div className="glass-card border-white/40 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-500" />
                    Global Image Uploads
                  </h4>
                  <div className="space-y-4">
                    {allUploads.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-8 uppercase font-bold">No uploads found</p>
                    ) : (
                      allUploads.map(u => (
                        <div key={u.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-black text-slate-900">{u.userName || 'Unknown'}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{u.context}</p>
                            </div>
                            <button onClick={() => handleDeleteUpload(u.id)} className="p-2 text-rose-500 hover:bg-rose-50/50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="relative group aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                            <img
                              src={u.url}
                              alt="Upload"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <a
                              href={u.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest"
                            >
                              View Full Size
                            </a>
                          </div>
                          <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase">
                            <span>{new Date(u.timestamp).toLocaleString()}</span>
                            <span className="text-indigo-500">{u.userId.slice(0, 8)}...</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>

            <button
              onClick={saveChanges}
              className="w-full py-5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
            >
              Commit System Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  return (
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

      {/* Referral code prompt -- shown when a signed-in user has no
          profile row yet (typically first Google OAuth sign-in without
          a pending referral code). Blocks until they enter a valid
          code or sign out. */}
      {needsReferralCodePrompt && (
        <div className="fixed inset-0 z-[400] bg-white/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-[#D4AF37]/20 rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(212,175,55,0.2)]">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#C5A028] rounded-2xl flex items-center justify-center shadow-lg mb-6 mx-auto">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-900 text-center mb-2 uppercase tracking-widest">
              Referral Code Required
            </h2>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Enter the referral code of the person who invited you to finish creating your account.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const code = refCodePromptValue.trim();
                setRefCodePromptError(null);
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
                  const result = await createGoogleProfile(code);
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
              className="space-y-4"
            >
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="e.g. 100234"
                value={refCodePromptValue}
                onChange={(e) => setRefCodePromptValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={refCodePromptSubmitting}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-[#D4AF37] rounded-2xl text-center text-lg font-black tracking-[0.2em] text-slate-900 placeholder:text-slate-300 outline-none transition-colors disabled:opacity-60"
              />
              {refCodePromptError && (
                <p className="text-[11px] font-bold text-rose-600 text-center">{refCodePromptError}</p>
              )}
              <button
                type="submit"
                disabled={refCodePromptSubmitting}
                className="w-full py-4 bg-gradient-to-br from-[#D4AF37] to-[#C5A028] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60"
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

      {/* Email Verification Overlay */}
      {needsEmailVerification && view !== 'admin' && (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-12 h-12 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest">VERIFY YOUR EMAIL</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            We've sent a verification link to your email. Please verify your account to continue.
          </p>
          <div className="w-full space-y-4">
            <button
              onClick={async () => {
                // Re-check session to see if email is verified
                const sessionResult = await authClient.getSession();
                const sess = sessionResult?.data;
                if (sess?.user?.emailVerified) {
                  setNeedsEmailVerification(false);
                  setView('home');
                } else {
                  alert('Email not verified yet. Please check your inbox.');
                }
              }}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              I HAVE VERIFIED
            </button>
            <button
              onClick={async () => {
                // Better Auth handles email verification via its built-in flow
                alert('Please check your inbox for the verification email. If you did not receive it, try logging in again.');
              }}
              className="w-full py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              RESEND EMAIL
            </button>
            <button
              onClick={async () => {
                await signOut();
                setNeedsEmailVerification(false);
                setView('login');
              }}
              className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest"
            >
              LOGOUT & TRY AGAIN
            </button>
          </div>
        </div>
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
          <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#C5A028] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.3)] mb-6 animate-pulse">
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
        {view === 'login' && !isLoggedIn && loginView}
        {view === 'home' && homeView}
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
        {view === 'admin' && <AdminView key="admin" />}
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
      </AnimatePresence>}

      {/* Bottom Navigation - hide on login view and email verification */}
      {isAuthReady && isLoggedIn && view !== 'login' && !needsEmailVerification && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-6 py-4 z-50">
          <div className="glass rounded-[32px] p-2 flex justify-between items-center border border-white/40 shadow-2xl">
            {[
              { id: 'home', icon: <Globe className="w-6 h-6" />, label: 'Home' },
              { id: 'dashboard', icon: <LayoutDashboard className="w-6 h-6" />, label: 'Stats' },
              { id: 'workstation', icon: <FolderOpen className="w-6 h-6" />, label: 'Work' },
              { id: 'finance', icon: <CreditCard className="w-6 h-6" />, label: 'Wallet' },
              { id: 'settings', icon: <Settings className="w-6 h-6" />, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${view === item.id ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {item.icon}
                {view === item.id && <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

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
  );
}
