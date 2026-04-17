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
  uploadFile 
} from './lib/database';
import { sanitizeAndTrim } from './utils/sanitize';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface GlobalUpload {
  id: string;
  userId: string;
  userName: string;
  url: string;
  context: string;
  timestamp: number;
  date: string;
}

// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function buildFirestoreErrorInfo(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: undefined,
      email: undefined,
      emailVerified: undefined,
      isAnonymous: undefined,
      tenantId: undefined,
      providerInfo: []
    },
    operationType,
    path
  };
}

// Use for direct operations (create, update, delete) where failure should propagate
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Use for onSnapshot listener error callbacks - logs only, does not throw
// (listeners fire before auth is ready, so permission errors are expected)
function handleListenerError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  // Only log permission errors at warn level since they're expected before auth
  const msg = errInfo.error;
  if (msg.includes('permission') || msg.includes('Permission')) {
    console.warn('Firestore listener permission denied (user may not be authenticated yet):', path);
  } else {
    console.error('Firestore Listener Error:', JSON.stringify(errInfo));
  }
}
type View = 'login' | 'home' | 'dashboard' | 'referral' | 'workstation' | 'finance' | 'support' | 'folder-a' | 'folder-b' | 'folder-c' | 'folder-d' | 'leaderboard' | 'spin' | 'profile' | 'salary-sheet' | 'admin' | 'settings' | 'ads-earn' | 'mobile-banking' | 'otp-buy-sell' | 'mobile-recharge' | 'drive-offer' | 'ecommerce' | 'dollar-sell' | 'dollar-buy' | 'social-hub' | 'subscription-boosting' | 'account-activation' | 'gaming' | 'ludo-earn' | 'smm-panel' | 'top-news' | 'social-job';

interface NewsPost {
  id: string;
  authorName: string;
  authorBadge: boolean;
  content: string;
  imageUrl?: string;
  likes: string[];
  comments: {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
  }[];
  timestamp: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image: string;
  category?: string;
}

interface ProductOrder {
  id: string;
  userId: string;
  productId: string;
  address: string;
  phone: string;
  amount: number;
  deliveryFee?: number;
  totalPaid?: number;
  paymentStatus?: 'COD' | 'Paid';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  reason?: string;
}

interface SubscriptionRequest {
  id: string;
  userId: string;
  type: 'youtube' | 'telegram';
  email?: string;
  telegramId?: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reason?: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  country: string;
  age: number;
  referralCode: string;
  id: string;
  numericId: string;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  mainBalance: number;
  totalEarned: number;
  pendingPayout: number;
  referralLink: string;
  gen1Count: number;
  dailyClaimed: boolean;
  notifications: { id: string; text: string; date: string }[];
  taskHistory: { id: string; title: string; reward: number; date: string }[];
  achievements: { id: string; title: string; progress: number; goal: number }[];
  adWatches: { id: string; date: string; count: number }[];
  isActive: boolean;
  activationDate: string;
  activationExpiry: string;
  referralActiveCount: number;
  referredBy?: string;
  status: 'active' | 'banned' | 'suspended';
  restrictionReason: string;
  suspensionUntil: string;
  totalCommission: number;
  socialSubmissions: SocialSubmission[];
}

interface SocialSubmission {
  id: string;
  userId: string;
  userName: string;
  type: string;
  trxId: string;
  screenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  amount?: number;
}

interface GmailSubmission {
  id: string;
  userId: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reward: number;
  reason?: string;
}

interface MicrojobSubmission {
  id: string;
  userId: string;
  microjobId: string;
  userName: string;
  link: string;
  screenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reason?: string;
}

interface TaskSubmission {
  id: string;
  userId: string;
  taskType: string;
  userName: string;
  link?: string;
  screenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reward: number;
  taskId: string;
  reason?: string;
  category?: string;
}

interface RechargeRequest {
  id: string;
  userId: string;
  phone: string;
  operator: string;
  amount: number;
  type: 'Prepaid' | 'Postpaid';
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reason?: string;
}

interface LudoTournament {
  id: string;
  title: string;
  entryFee: number;
  prizePool: number;
  type: '1vs1' | '4player';
  rules: string;
  description: string;
  status: 'open' | 'closed' | 'ongoing' | 'completed';
  maxPlayers: number;
  currentPlayers: number;
  startTime: string;
  roomCode?: string;
  playerIds: string[];
}

interface LudoSubmission {
  id: string;
  userId: string;
  tournamentId: string;
  userName: string;
  ludoUsername: string;
  screenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  timestamp: number;
}

interface DriveOffer {
  id: string;
  title: string;
  operator: string;
  price: number;
  description: string;
}

interface DriveOfferRequest {
  id: string;
  userId: string;
  driveOfferId: string;
  phone: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reason?: string;
}

interface SmmOrder {
  id: string;
  userId: string;
  userName: string;
  service: string;
  link: string;
  amount: number; // Taka spent
  quantity: number; // Likes/Stars/etc received
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  date: string;
  timestamp: number;
}

interface DollarBuyRequest {
  id: string;
  userId: string;
  amount: number;
  price: number;
  method: string;
  wallet: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  timestamp: number;
  reason?: string;
}

// --- Constants ---
const INITIAL_USER: UserProfile = {
  name: 'Soruv Islam',
  email: 'soruvislam51@gmail.com',
  phone: '01700000000',
  country: 'Bangladesh',
  age: 20,
  referralCode: '',
  id: '#SSC2026-SR',
  numericId: '100001',
  rank: 'Bronze',
  mainBalance: 0.00,
  totalEarned: 0.00,
  pendingPayout: 0.00,
  referralLink: 'https://smarttask.bd/ref/soruv',
  gen1Count: 0,
  dailyClaimed: false,
  notifications: [
    { id: '1', text: 'Welcome to Top Earning!', date: '2026-04-01' },
    { id: '2', text: 'New Gmail Sell tasks added.', date: '2026-04-02' }
  ],
  taskHistory: [],
  achievements: [
    { id: '1', title: 'First Task', progress: 0, goal: 1 },
    { id: '2', title: 'Team Builder', progress: 0, goal: 10 }
  ],
  adWatches: [],
  isActive: false,
  activationDate: '',
  activationExpiry: '',
  referralActiveCount: 0,
  status: 'active',
  restrictionReason: '',
  suspensionUntil: '',
  totalCommission: 0.00,
  socialSubmissions: []
};

const INCOME_CARDS = [
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

interface UserMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  sender: 'user' | 'admin';
  date: string;
}

const SMM_SERVICES = [
  { id: 'fb-like', name: 'Facebook Likes', pricePer1k: 50, icon: <Facebook className="w-5 h-5" />, min: 100, tag: 'Popular', color: 'from-blue-500 to-blue-700' },
  { id: 'fb-star', name: 'Facebook Stars', pricePer1k: 5000, icon: <Sparkles className="w-5 h-5" />, min: 10, tag: 'Premium', color: 'from-amber-400 to-orange-600' },
  { id: 'fb-follow', name: 'Facebook Page Follow', pricePer1k: 200, icon: <Users className="w-5 h-5" />, min: 100, tag: 'High Quality', color: 'from-indigo-500 to-purple-700' },
  { id: 'tg-member', name: 'Telegram Members', pricePer1k: 150, icon: <Send className="w-5 h-5" />, min: 100, tag: 'Fast Start', color: 'from-sky-400 to-blue-600' },
  { id: 'tg-view', name: 'Telegram Channel Views', pricePer1k: 30, icon: <Globe className="w-5 h-5" />, min: 100, tag: 'Best Value', color: 'from-emerald-400 to-teal-600' },
  { id: 'tg-star', name: 'Telegram Stars', pricePer1k: 4500, icon: <Sparkles className="w-5 h-5" />, min: 10, tag: 'New', color: 'from-violet-500 to-fuchsia-700' },
];

export default function App() {
  const [view, setView] = useState<View>('login');
  const [selectedSocialJob, setSelectedSocialJob] = useState<{title: string, color: string, icon: any} | null>(null);
  const [financeStep, setFinanceStep] = useState<'form' | 'success' | 'deposit'>('form');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regData, setRegData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '', 
    refCode: '', 
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

  const isAdmin = user.email === 'soruvislam51@gmail.com';

  // --- Scroll to Top on View Change ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

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

  // --- Supabase Sync ---
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Auth state listener
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const supaUser = session.user;
        setIsLoggedIn(true);
        setNeedsEmailVerification(!supaUser.email_confirmed_at);

        // Subscribe to user profile
        const unsubUser = subscribeToRow<UserProfile>('users', supaUser.id, async (data) => {
          if (data) {
            // Check suspension expiry
            if (data.status === 'suspended' && data.suspensionUntil) {
              const expiry = new Date(data.suspensionUntil);
              if (new Date() > expiry) {
                await updateRow('users', supaUser.id, { status: 'active', restrictionReason: '', suspensionUntil: '' }).catch(() => {});
              }
            }
            // Admin Self-Healing
            if (data.email === 'soruvislam51@gmail.com' && data.status !== 'active') {
              await updateRow('users', supaUser.id, { status: 'active', restrictionReason: '', suspensionUntil: '' }).catch(() => {});
            }
            setUser(data);
          } else {
            // New user - create profile
            const newUser: UserProfile = {
              ...INITIAL_USER,
              id: supaUser.id,
              name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || 'User',
              email: supaUser.email || '',
            };
            await upsertRow('users', newUser).catch(e => console.warn('Failed to create user profile:', e));
          }
        });
        unsubs.push(unsubUser);
        setIsAuthReady(true);
      } else {
        setIsLoggedIn(false);
        setView('login');
        setIsAuthReady(true);
      }
    });
    unsubs.push(() => authSub.unsubscribe());

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
      setActiveFolders(data.activeFolders || []);
      setEnabledFeatures(data.enabledFeatures || []);
      setEnabledSmmServices(data.enabledSmmServices || ['fb-like', 'fb-star', 'fb-follow', 'tg-member', 'tg-view', 'tg-star', 'youtube-premium', 'meta-verified']);
      setEnabledCards(data.enabledCards || INCOME_CARDS.map(c => c.title));
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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('User not authenticated');
    
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
    if (!regData.email || !regData.password || !regData.name || !regData.phone || !regData.refCode) {
      alert('Please fill all required fields, including Referral Code.');
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

    try {
      // Check if referral code is valid (or allow first user without one)
      let referrerId = '';

      if (regData.refCode) {
        const refSnap = await getRows('users', [{ column: 'numericId', value: regData.refCode }]);
        if (!refSnap || refSnap.length === 0) {
          alert('Invalid Referral Code. Please enter a valid code.');
          return;
        }
        referrerId = refSnap[0].id;
      } else {
        // Allow registration without referral code only if no users exist (first user bootstrap)
        const existingUsers = await getRows('users');
        if (existingUsers && existingUsers.length > 0) {
          alert('Referral Code is required. Please enter a valid referral code.');
          return;
        }
        // First user - no referral needed
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: regData.email,
        password: regData.password,
        options: {
          data: { full_name: regData.name }
        }
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Registration failed');
      
      // Generate unique referral code (numeric ID)
      const generateNumericId = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      
      const newUser: UserProfile = {
        ...INITIAL_USER,
        id: signUpData.user.id,
        numericId: generateNumericId(),
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        country: regData.country,
        age: parseInt(regData.age) || 18,
        referralCode: '',
        referredBy: referrerId,
      };

      await upsertRow('users', newUser as any);

      // Increment gen1 count for referrer immediately (skip if no referrer)
      if (referrerId) {
        await incrementField('users', referrerId, 'gen1Count', 1);
      }

      setNeedsEmailVerification(true);
      alert('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      console.error('Registration Error:', error);
      alert(error.message);
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

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: loginPassword,
      });
      if (loginError) throw loginError;
      if (!loginData.user?.email_confirmed_at) {
        setNeedsEmailVerification(true);
      } else {
        setShowWelcome(true);
        setView('home');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (googleError) throw googleError;
      
      // After OAuth redirect, the onAuthStateChange listener handles user creation
      setShowWelcome(true);
      setView('home');
    } catch (error) {
      console.error('Login Error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const claimDaily = async () => {
    if (user.dailyClaimed) return;
    try {
      const userRef_id = user.id;
      await updateRow('users', userRef_id, {
        mainBalance: dailyReward,
        totalEarned: dailyReward,
        dailyClaimed: true
      });
      confetti({ particleCount: 100, spread: 70 });
      alert(`Claimed ৳ ${dailyReward.toFixed(2)}!`);
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
      const prizes = [0, 0.5, 1, 2, 5, 10, 0, 0.2];
      const win = prizes[Math.floor(Math.random() * prizes.length)];
      
      try {
        const userRef_id = user.id;
        await updateRow('users', userRef_id, {
          mainBalance: -spinCost + win,
          totalEarned: win
        });
        
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

  const handleLogout = () => {
    supabase.auth.signOut();
    setIsLoggedIn(false);
    setView('login');
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleSubmission = async (operation: () => Promise<void>, successMessage: string) => {
    setIsSubmitting(true);
    setSubmissionProgress(0);
    
    const duration = 3000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      setSubmissionProgress((currentStep / steps) * 100);
      if (currentStep >= steps) clearInterval(timer);
    }, interval);
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    try {
      await operation();
      setIsSubmitting(false);
      confetti({ particleCount: 150, spread: 70 });
      alert(successMessage);
    } catch (e) {
      setIsSubmitting(false);
      clearInterval(timer);
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
      
      {/* Info Buttons */}
      <div className="absolute top-8 left-0 right-0 px-8 flex justify-center gap-4 z-20">
        <button 
          onClick={() => setShowInfoModal('info')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-[#D4AF37]/20 rounded-2xl text-[9px] font-black text-[#C5A028] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/5 hover:bg-[#D4AF37] hover:text-white transition-all group active:scale-95"
        >
          <Info className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          <span>Website Info</span>
        </button>
        <button 
          onClick={() => alert('Upcoming Feature!')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-[#D4AF37]/20 rounded-2xl text-[9px] font-black text-[#C5A028] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/5 hover:bg-[#D4AF37] hover:text-white transition-all group active:scale-95"
        >
          <HelpCircle className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          <span>Help Center</span>
        </button>
        <button 
          onClick={() => setShowInfoModal('freelance')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-[#D4AF37]/20 rounded-2xl text-[9px] font-black text-[#C5A028] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/5 hover:bg-[#D4AF37] hover:text-white transition-all group active:scale-95"
        >
          <Briefcase className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          <span>Freelancing</span>
        </button>
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
                      onChange={e => setRegData({...regData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Mobile Number" 
                      value={regData.phone}
                      onChange={e => setRegData({...regData, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={regData.email}
                      onChange={e => setRegData({...regData, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password (min 6 digit)" 
                      value={regData.password}
                      onChange={e => setRegData({...regData, password: e.target.value})}
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
                      onChange={e => setRegData({...regData, confirmPassword: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Referral Code (Mandatory)" 
                      value={regData.refCode}
                      onChange={e => setRegData({...regData, refCode: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]/50 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <select 
                      value={regData.country}
                      onChange={e => setRegData({...regData, country: e.target.value})}
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
                  Registered
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

                  <div className="flex items-center gap-3 px-2">
                    <input 
                      type="checkbox" 
                      id="login-terms"
                      checked={loginAccepted}
                      onChange={e => setLoginAccepted(e.target.checked)}
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                    <label htmlFor="login-terms" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer">
                      I accept all rules and conditions
                    </label>
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

  const WelcomeOverlay = () => {
    const [step, setStep] = useState(1);
    
    if (!showWelcome) return null;

    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
        >
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -40 }}
              className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-[#D4AF37]/30 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D4AF37] via-[#C5A028] to-[#D4AF37]" />
              <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#D4AF37]/20">
                <Zap className="w-12 h-12 text-[#D4AF37] animate-pulse" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase glitch-text" data-text="SMART TASK">SMART TASK</h1>
              <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.3em] mb-12">Next-Gen Earning Platform</p>
              <button 
                onClick={() => setStep(2)}
                className="w-full py-5 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
              >
                GET STARTED
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -40 }}
              className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-[#D4AF37]/30 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D4AF37] via-[#C5A028] to-[#D4AF37]" />
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Platform Rules</h2>
              <div className="bg-slate-50 rounded-2xl p-4 mb-8 max-h-[200px] overflow-y-auto text-left">
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                  {rulesText}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowWelcome(false);
                  sessionStorage.setItem('hasSeenWelcome', 'true');
                }}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                I AGREE & ENTER
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const SubmissionLoader = () => (
    <AnimatePresence>
      {isSubmitting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-xl"
        >
          <div className="w-24 h-24 relative mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/10"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                animate={{ strokeDashoffset: 251.2 - (251.2 * submissionProgress) / 100 }}
                className="text-[#D4AF37]"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white font-black text-xl">
              {Math.ceil((3 * (100 - submissionProgress)) / 100)}s
            </div>
          </div>
          <h3 className="text-white font-black text-xl uppercase tracking-[0.3em] mb-2">প্রসেসিং হচ্ছে...</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">দয়া করে অপেক্ষা করুন</p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const SuccessView = ({ 
    title, 
    subtitle, 
    details, 
    onClose, 
    colorClass = "bg-emerald-500" 
  }: { 
    title: string; 
    subtitle: string; 
    details: { label: string; value: string; color?: string }[]; 
    onClose: () => void;
    colorClass?: string;
  }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-card border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className={`${colorClass} p-8 flex flex-col items-center text-white`}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest">{title}</h2>
          <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-tighter">{subtitle}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {details.map((d, i) => (
              <div key={i} className={`flex justify-between items-center ${i !== details.length - 1 ? 'border-b border-slate-50 pb-3' : ''}`}>
                <span className="text-[10px] font-black text-slate-400 uppercase">{d.label}</span>
                <span className={`text-[10px] font-black uppercase ${d.color || 'text-slate-900'}`}>{d.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-500 text-center italic">
              "Your submission is under review. Our team will verify it shortly."
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );

  const RestrictionScreen = () => (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card bg-white/10 border-white/20 p-8 max-w-sm w-full"
      >
        <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">
          Account {user.status}
        </h2>
        <p className="text-rose-200 text-xs font-bold mb-6 leading-relaxed">
          {user.restrictionReason || 'Your account has been restricted due to a policy violation.'}
        </p>
        
        {user.status === 'suspended' && user.suspensionUntil && (
          <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Suspension Ends</p>
            <p className="text-lg font-black text-white">
              {new Date(user.suspensionUntil).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <a 
            href="https://t.me/smarttask_support" 
            target="_blank" 
            rel="noreferrer"
            className="block w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Contact Support
          </a>
          <button 
            onClick={() => {
              supabase.auth.signOut();
              setView('login');
            }}
            className="block w-full bg-white/10 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 active:scale-95 transition-all"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </div>
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
            className={`w-full p-4 rounded-3xl flex items-center justify-between border transition-all ${
              user.dailyClaimed 
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
            className={`glass-card flex flex-col items-center text-center gap-3 group relative overflow-hidden border-white/40 shadow-sm ${
              (!enabledCards.includes(card.title) && !isAdmin) ? 'opacity-50 grayscale cursor-not-allowed' : ''
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

  const TopNewsView = () => {
    const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});

    const handleLike = async (postId: string) => {
      const post = newsPosts.find(p => p.id === postId);
      if (!post) return;

      const newLikes = post.likes.includes(user.id)
        ? post.likes.filter(id => id !== user.id)
        : [...post.likes, user.id];

      try {
        await updateRow('newsPosts', postId, { likes: newLikes });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `newsPosts/${postId}`);
      }
    };

    const handleComment = async (postId: string) => {
      const text = newComment[postId];
      if (!text?.trim()) return;

      const post = newsPosts.find(p => p.id === postId);
      if (!post) return;

      const comment = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        text: text.trim(),
        timestamp: Date.now()
      };

      try {
        await updateRow('newsPosts', postId, {
          comments: [...post.comments, comment]
        });
        setNewComment({ ...newComment, [postId]: '' });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `newsPosts/${postId}`);
      }
    };

    return (
      <div className="min-h-screen pb-32 bg-slate-100">
        <div className="p-4 pt-12 max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Top News</h2>
          </div>

          <div className="space-y-4">
            {newsPosts.map(post => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">
                    {post.authorName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-sm text-slate-900">{post.authorName}</h4>
                      {post.authorBadge && (
                        <div className="bg-blue-500 rounded-full p-0.5">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">{new Date(post.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Image */}
                {post.imageUrl && (
                  <div className="w-full aspect-video bg-slate-100">
                    <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}

                {/* Stats */}
                <div className="px-4 py-2 flex items-center justify-between border-t border-slate-50 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="bg-blue-500 rounded-full p-1">
                      <ThumbsUp className="w-2 h-2 text-white" />
                    </div>
                    <span>{post.likes.length}</span>
                  </div>
                  <div>{post.comments.length} comments</div>
                </div>

                {/* Actions */}
                <div className="px-2 py-1 flex items-center border-t border-slate-50">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                      post.likes.includes(user.id) ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${post.likes.includes(user.id) ? 'fill-current' : ''}`} />
                    <span className="text-xs font-bold">Like</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-bold">Comment</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
                    <Share2 className="w-4 h-4" />
                    <span className="text-xs font-bold">Share</span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="bg-slate-50 p-4 space-y-3">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                        {comment.userName[0]}
                      </div>
                      <div className="bg-white p-2 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex-1">
                        <h5 className="text-[10px] font-black text-slate-900">{comment.userName}</h5>
                        <p className="text-xs text-slate-700">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Comment Input */}
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment[post.id] || ''}
                      onChange={e => setNewComment({ ...newComment, [post.id]: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={() => handleComment(post.id)}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="min-h-screen pb-32">
        <div className="p-6 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Stats">Stats</h2>
            </div>
          </div>

          {/* Profile Card */}
          <div className="glass-card mb-8 relative overflow-hidden group border-white/40 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl neon-border">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{user.name}</h3>
                <p className="text-xs font-bold text-slate-500 mb-2">{user.id}</p>
                <div className="flex gap-2">
                  <span className="bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{user.rank} Rank</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    user.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20 cursor-pointer'
                  }`} onClick={() => !user.isActive && setView('account-activation')}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {user.isActive && (
                  <p className="text-[8px] font-black text-emerald-600 uppercase mt-2">
                    Expires: {new Date(user.activationExpiry).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Live Balance Grid */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="glass-card bg-gradient-to-br from-indigo-500/5 to-violet-600/5 border-indigo-500/10 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                  <Wallet className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-500/10 px-2 py-1 rounded-lg uppercase">Main Balance</span>
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">৳ {user.mainBalance.toFixed(2)}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Available Balance</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5 border-emerald-500/10 shadow-md">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Earned</p>
                <p className="text-xl font-black text-emerald-600">৳ {user.totalEarned.toFixed(2)}</p>
              </div>
              <div className="glass-card p-5 border-indigo-500/10 shadow-md">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pending</p>
                <p className="text-xl font-black text-indigo-600">৳ {user.pendingPayout.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Enhanced Referral Section */}
          <div className="glass-card mb-8 border-white/40 shadow-xl bg-gradient-to-br from-indigo-500/5 to-violet-600/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Referral Program
              </h3>
            </div>

            <div className="text-center mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Your Referral Code</p>
              <div 
                onClick={() => handleCopy(user.numericId)}
                className="relative inline-flex items-center gap-4 bg-white border-2 border-indigo-100 px-10 py-5 rounded-[32px] cursor-pointer hover:border-indigo-500 transition-all group shadow-sm active:scale-95"
              >
                <span className="text-4xl font-black text-indigo-600 tracking-[0.1em]">{user.numericId}</span>
                <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <Copy className="w-6 h-6 text-indigo-600" />
                </div>
                
                <AnimatePresence>
                  {copied && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, x: '-50%' }}
                      animate={{ opacity: 1, y: -60, x: '-50%' }}
                      exit={{ opacity: 0, y: -80, x: '-50%' }}
                      className="absolute left-1/2 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl whitespace-nowrap"
                    >
                      Copied Successfully!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button 
                onClick={() => {
                  const link = `${window.location.origin}?ref=${user.numericId}`;
                  handleCopy(link);
                }}
                className="mt-4 flex items-center gap-2 mx-auto text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Copy Referral Link
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-sm font-black text-slate-900">{allUsers.filter(u => u.referredBy === user.numericId).length}</p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Active</p>
                <p className="text-sm font-black text-emerald-600">{allUsers.filter(u => u.referredBy === user.numericId && u.isActive).length}</p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Earned</p>
                <p className="text-sm font-black text-indigo-600">৳ {user.totalCommission?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Referral Rules</p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-600 font-bold">Lifetime Commission</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase">{referralCommissionRate}%</p>
              </div>
              <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Earn from every task your team completes</p>
            </div>
          </div>

          {/* Achievements */}
          <div className="mt-8">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 px-2">Achievements</h3>
            <div className="space-y-3">
              {user.achievements.map((ach) => (
                <div key={ach.id} className="glass-card p-4 border-white/40 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-800 uppercase">{ach.title}</span>
                    <span className="text-[10px] font-bold text-indigo-600">{ach.progress}/{ach.goal}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-400 to-violet-600"
                      style={{ width: `${(ach.progress / ach.goal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task History */}
          <div className="mt-8">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 px-2">Recent Tasks</h3>
            {user.taskHistory.length === 0 ? (
              <div className="glass-card p-8 text-center border-white/40 shadow-sm">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No tasks completed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user.taskHistory.map(task => (
                  <div key={task.id} className="glass-card flex justify-between items-center p-4 border-white/40 shadow-sm">
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase">{task.title}</p>
                      <p className="text-[10px] font-bold text-slate-400">{task.date}</p>
                    </div>
                    <p className="text-emerald-600 font-black text-xs">+৳ {task.reward.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ReferralView = () => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="REFERRAL ZONE">REFERRAL ZONE</h2>
          </div>

          {/* Referral Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-5 border-indigo-500/10 shadow-md">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Active Referrals</p>
              <p className="text-xl font-black text-indigo-600">{user.referralActiveCount}</p>
            </div>
            <div className="glass-card p-5 border-emerald-500/10 shadow-md">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Bonus</p>
              <p className="text-xl font-black text-emerald-600">৳ {(user.referralActiveCount * referralActivationBonus).toFixed(2)}</p>
            </div>
          </div>

          {/* Referral Code & Link */}
          <div className="glass-card border-white/40 shadow-xl space-y-6 mb-8">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Your Referral Code</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black shadow-inner">
                  {user.numericId}
                </div>
                <button 
                  onClick={() => handleCopy(user.numericId)}
                  className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Referral Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[10px] text-slate-900 font-bold shadow-inner truncate">
                  {user.referralLink}
                </div>
                <button 
                  onClick={() => handleCopy(user.referralLink)}
                  className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            {copied && (
              <p className="text-[10px] font-black text-emerald-600 text-center uppercase animate-bounce">Copied to clipboard!</p>
            )}
          </div>

          {/* Referral Rules */}
          <div className="glass-card border-indigo-100 bg-indigo-50/30 p-6">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Referral Program Rules
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-indigo-600">1</span>
                </div>
                <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                  আপনার রেফারেল কোড ব্যবহার করে কেউ একাউন্ট খুললে আপনি সাথে সাথে বোনাস পাবেন না।
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-indigo-600">2</span>
                </div>
                <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                  যখন আপনার রেফার করা মেম্বার তার একাউন্ট ৳ ১০০ দিয়ে একটিভ করবে, তখন আপনি সাথে সাথে ৳ {referralActivationBonus} বোনাস পাবেন।
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-indigo-600">3</span>
                </div>
                <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                  এছাড়াও আপনার রেফার করা মেম্বারের প্রতিটি কাজ থেকে আপনি {referralCommissionRate}% লাইফটাইম কমিশন পাবেন।
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const workStationView = (
    <div className="min-h-screen pb-32">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Work Station">Work Station</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {[
            { id: 'folder-a', title: 'Micro Freelancing', desc: 'Small tasks, big rewards. Complete simple web jobs.', count: '142 Jobs', color: 'from-indigo-400 to-violet-600' },
            { id: 'folder-b', title: 'Social Media Marketing', desc: 'Like, follow, and share to earn instantly.', count: '89 Jobs', color: 'from-pink-400 to-rose-500' },
            { id: 'folder-c', title: 'Digital Asset Trading', desc: 'Buy and sell accounts, domains, and more.', count: '24 Assets', color: 'from-emerald-400 to-teal-600' },
            { id: 'folder-d', title: 'Team Management', desc: 'Manage your network and collect bonuses.', count: 'Active', color: 'from-purple-400 to-indigo-600' },
          ].map((item, i) => (
            <motion.button 
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView(item.id as View)}
              className={`glass-card text-left relative overflow-hidden group border-white/40 shadow-lg ${
                (!activeFolders.includes(item.id) && !isAdmin) ? 'opacity-50 grayscale cursor-not-allowed' : ''
              }`}
              disabled={!activeFolders.includes(item.id) && !isAdmin}
            >
              <div className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${item.color} opacity-5 group-hover:opacity-10 transition-all`} />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.count}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[80%]">{item.desc}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </div>
              {!activeFolders.includes(item.id) && !isAdmin && (
                <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center">
                  <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase">Locked by Admin</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="mt-8">
          <div className="glass-card border-indigo-500/20 bg-indigo-50/30 p-5">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Workstation Rules
            </h4>
            <ul className="space-y-3">
              <li className="text-[11px] text-slate-600 font-medium flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                Always provide accurate proof (screenshots/links) for tasks.
              </li>
              <li className="text-[11px] text-slate-600 font-medium flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                Fake submissions will lead to permanent account suspension.
              </li>
              <li className="text-[11px] text-slate-600 font-medium flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                Tasks are reviewed by admins within 24 hours.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const FinanceView = () => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'bKash' | 'Nagad' | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState('');
    const [lastWithdrawal, setLastWithdrawal] = useState<any>(null);

    const handleWithdraw = async () => {
      if (!user.isActive) {
        alert('Your account is not active. Please activate your account to withdraw funds.');
        setView('account-activation');
        return;
      }
      setError('');
      const val = parseFloat(amount);
      const fee = (val * withdrawalFee) / 100;
      
      if (!val || val < minWithdrawal) {
        setError(`Minimum withdrawal is ৳ ${minWithdrawal}`);
        return;
      }
      if (val > user.mainBalance) {
        setError('Insufficient balance');
        return;
      }
      if (!method) {
        setError('Please select a withdrawal method');
        return;
      }
      if (!accountNumber.trim()) {
        setError('Please enter your account number');
        return;
      }

      await handleSubmission(async () => {
        const withdrawalData = {
          userId: user.id,
          amount: val,
          receiveAmount: val - fee,
          fee: fee,
          method: `${method} (${accountNumber})`,
          status: 'pending' as const,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          timestamp: Date.now(),
          transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };

        await insertRow('withdrawals', withdrawalData);
        
        const userRef_id = user.id;
        await updateRow('users', userRef_id, {
          mainBalance: -val,
          pendingPayout: val
        });

        setLastWithdrawal(withdrawalData);
        setAmount('');
        setMethod(null);
        setAccountNumber('');
        setFinanceStep('success');
      }, 'Withdrawal request submitted successfully!');
    };

    const handleDeposit = async () => {
      setError('');
      const val = parseFloat(amount);
      if (!val || val < 10) {
        setError('Minimum deposit is ৳ 10');
        return;
      }
      if (!method) {
        setError('Please select a deposit method');
        return;
      }
      if (!accountNumber.trim()) {
        setError('Please enter your sender number');
        return;
      }

      await handleSubmission(async () => {
        const depositData = {
          userId: user.id,
          phone: accountNumber,
          operator: method,
          amount: val,
          type: 'Prepaid' as const,
          status: 'pending' as const,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now()
        };

        await insertRow('rechargeRequests', depositData);
        
        setAmount('');
        setMethod(null);
        setAccountNumber('');
        setFinanceStep('form');
      }, 'Deposit request submitted! Please ensure you have "Sent Money" to 01774397545. Admin will verify shortly.');
    };

    if (showHistory) {
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-black text-slate-900">Vault History</h2>
              </div>
            </div>

            <div className="space-y-4">
              {withdrawals.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No transaction logs</p>
                </div>
              ) : (
                withdrawals.map(w => (
                  <div key={w.id} className="glass-card border-white/40 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{w.method}</p>
                        <p className="text-lg font-black text-slate-900 mt-1">৳ {w.amount.toFixed(2)}</p>
                        {w.fee && (
                          <p className="text-[8px] font-bold text-slate-400 uppercase">
                            Fee: ৳ {w.fee.toFixed(2)} | Receive: ৳ {w.receiveAmount?.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                        w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        w.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {w.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{w.date}</p>
                      {w.reason && <p className="text-[8px] font-bold text-rose-500 uppercase">Note: {w.reason}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (financeStep === 'success') {
      return (
        <SuccessView 
          title="Withdrawal Success"
          subtitle="Your extraction has been logged"
          onClose={() => setFinanceStep('form')}
          colorClass="bg-indigo-600"
          details={[
            { label: 'Transaction ID', value: lastWithdrawal?.transactionId },
            { label: 'Date & Time', value: `${lastWithdrawal?.date} | ${lastWithdrawal?.time}` },
            { label: 'Method', value: lastWithdrawal?.method.split(' (')[0] },
            { label: 'Amount (TK)', value: `৳ ${lastWithdrawal?.amount.toFixed(2)}`, color: 'text-indigo-600' }
          ]}
        />
      );
    }

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="The Vault">The Vault</h2>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-indigo-600">
              <History className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Balance Display */}
            <div className="glass-card bg-gradient-to-br from-indigo-600 to-violet-700 border-none text-center py-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em] mb-3 opacity-80">Available for Extraction</p>
                <h3 className="text-5xl font-black text-white mb-6 drop-shadow-lg">৳ {user.mainBalance.toFixed(2)}</h3>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setFinanceStep('deposit')}
                    className="flex-1 bg-white text-indigo-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Deposit
                  </button>
                  <button 
                    onClick={() => setFinanceStep('form')}
                    className="flex-1 bg-white/20 backdrop-blur-md text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/30 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Withdraw
                  </button>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                    <p className="text-[8px] font-black text-indigo-100 uppercase mb-1">Pending</p>
                    <p className="text-sm font-black text-white">৳ {user.pendingPayout.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                    <p className="text-[8px] font-black text-indigo-100 uppercase mb-1">Total Earned</p>
                    <p className="text-sm font-black text-white">৳ {user.totalEarned.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Forms */}
            {financeStep === 'deposit' ? (
              <div className="glass-card border-white/40 shadow-lg p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Deposit Funds</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Add money to your wallet</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Amount (৳)</label>
                    {error && <p className="text-[10px] font-bold text-rose-500 mb-2 ml-1">{error}</p>}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">৳</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Min ৳ 10"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 pl-8 text-lg text-slate-900 font-black outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Sender Number</label>
                    <input 
                      type="text" 
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Your bKash/Nagad number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-900 font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setMethod('bKash')}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${method === 'bKash' ? 'border-pink-500 bg-pink-500/5' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black italic text-lg transition-all ${method === 'bKash' ? 'bg-pink-500 scale-110 shadow-lg shadow-pink-500/20' : 'bg-slate-200'}`}>bKash</div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${method === 'bKash' ? 'text-pink-600' : 'text-slate-500'}`}>bKash</span>
                    </button>
                    <button 
                      onClick={() => setMethod('Nagad')}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${method === 'Nagad' ? 'border-orange-500 bg-orange-500/5' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black italic text-lg transition-all ${method === 'Nagad' ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-500/20' : 'bg-slate-200'}`}>Nagad</div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${method === 'Nagad' ? 'text-orange-600' : 'text-slate-500'}`}>Nagad</span>
                    </button>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Deposit Rules & Instructions:</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-200">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Number (Personal)</span>
                          <code className="text-sm font-black text-emerald-600 tracking-widest">01774397545</code>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText('01774397545');
                            confetti({ particleCount: 30, spread: 50 });
                            alert('Number copied! Use "Send Money" only.');
                          }}
                          className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase active:scale-95 transition-all shadow-md flex items-center gap-2"
                        >
                          <Copy className="w-3 h-3" />
                          COPY
                        </button>
                      </div>
                      <ul className="space-y-2">
                        <li className="text-[9px] text-slate-600 flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>Only <span className="font-black text-rose-500">"Send Money"</span> is allowed. No Cash-in or Recharge.</span>
                        </li>
                        <li className="text-[9px] text-slate-600 flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>Minimum deposit amount is <span className="font-black">৳ 10</span>.</span>
                        </li>
                        <li className="text-[9px] text-slate-600 flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>Balance will be added to your account within <span className="font-black">30-60 minutes</span> after verification.</span>
                        </li>
                        <li className="text-[9px] text-slate-600 flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>Enter your sender number and amount accurately to avoid delays.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <button 
                    onClick={handleDeposit}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
                  >
                    Confirm Deposit
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card border-white/40 shadow-lg p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Min Limit</p>
                  <p className="text-sm font-black text-indigo-700">৳ {minWithdrawal}</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[8px] font-black text-rose-400 uppercase mb-1">Service Fee</p>
                  <p className="text-sm font-black text-rose-700">{withdrawalFee}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Initiate Extraction</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Secure payout to your mobile wallet</p>
                </div>
              </div>

              <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-3">Withdrawal Rules:</p>
                <ul className="space-y-2">
                  <li className="text-[9px] text-slate-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>Minimum withdrawal amount is <span className="font-black">৳ {minWithdrawal}</span>.</span>
                  </li>
                  <li className="text-[9px] text-slate-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>A service fee of <span className="font-black text-rose-500">{withdrawalFee}%</span> applies to every transaction (৳ 200 per ৳ 1000).</span>
                  </li>
                  <li className="text-[9px] text-slate-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>Payments are processed within <span className="font-black">24 hours</span> of request.</span>
                  </li>
                  <li className="text-[9px] text-slate-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>Ensure your bKash/Nagad number is correct. We are not responsible for wrong numbers.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Amount (৳)</label>
                  {error && <p className="text-[10px] font-bold text-rose-500 mb-2 ml-1">{error}</p>}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">৳</span>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder={`Min ৳ ${minWithdrawal}`}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 pl-8 text-lg text-slate-900 font-black outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  {parseFloat(amount) >= minWithdrawal && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                      <div>
                        <p className="text-[8px] font-black text-indigo-400 uppercase">Withdrawal Fee ({withdrawalFee}%)</p>
                        <p className="text-xs font-black text-indigo-600">- ৳ {((parseFloat(amount) * withdrawalFee) / 100).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-emerald-400 uppercase">You will receive</p>
                        <p className="text-sm font-black text-emerald-600">৳ {(parseFloat(amount) - (parseFloat(amount) * withdrawalFee) / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Account Number</label>
                  <input 
                    type="text" 
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Enter bKash/Nagad number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-900 font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setMethod('bKash')}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${method === 'bKash' ? 'border-pink-500 bg-pink-500/5' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black italic text-lg transition-all ${method === 'bKash' ? 'bg-pink-500 scale-110 shadow-lg shadow-pink-500/20' : 'bg-slate-200'}`}>bKash</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${method === 'bKash' ? 'text-pink-600' : 'text-slate-500'}`}>bKash Wallet</span>
                    {method === 'bKash' && <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setMethod('Nagad')}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${method === 'Nagad' ? 'border-orange-500 bg-orange-500/5' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black italic text-lg transition-all ${method === 'Nagad' ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-500/20' : 'bg-slate-200'}`}>Nagad</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${method === 'Nagad' ? 'text-orange-600' : 'text-slate-500'}`}>Nagad Wallet</span>
                    {method === 'Nagad' && <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />}
                  </button>
                </div>

                {/* Withdrawal Summary */}
                {amount && parseFloat(amount) >= minWithdrawal && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                  >
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Withdrawal Amount</span>
                      <span className="text-slate-900">৳ {parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-rose-500">
                      <span>Service Fee ({withdrawalFee}%)</span>
                      <span>- ৳ {((parseFloat(amount) * withdrawalFee) / 100).toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">You will receive</span>
                      <span className="text-lg font-black text-emerald-600">৳ {(parseFloat(amount) - (parseFloat(amount) * withdrawalFee) / 100).toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={handleWithdraw}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-700 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all neon-border"
                >
                  Confirm Extraction
                </button>
              </div>
            </div>
          )}

            {/* Withdrawal Rules */}
            <div className="glass-card bg-slate-50 border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h4 className="font-black text-sm text-slate-800 uppercase tracking-widest">Withdrawal Rules</h4>
              </div>
              <ul className="space-y-3">
                {[
                  `Minimum withdrawal amount is ৳ ${minWithdrawal}.`,
                  'Payments are processed within 1-24 hours.',
                  'Ensure your account number is correct before submitting.',
                  `Withdrawal fee: ${withdrawalFee}% (৳ 200 per ৳ 1000).`
                ].map((rule, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] font-medium text-slate-600 leading-tight">{rule}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SupportView = () => {
    const [msg, setMsg] = useState('');
    const myMessages = userMessages.filter(m => m.userId === user.id);

    const sendMessage = async () => {
      if (!msg.trim()) return;
      try {
        await insertRow('messages', {
          userId: user.id,
          userName: user.name,
          text: msg,
          sender: 'user',
          date: new Date().toLocaleTimeString()
        });
        setMsg('');
        confetti({ particleCount: 20, spread: 30 });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'messages');
      }
    };

    return (
      <div className="min-h-screen pb-32 flex flex-col">
        <div className="p-6 pt-12 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Support Uplink">Support Uplink</h2>
          </div>
          <div className="glass-card bg-indigo-500/5 border-white/40 mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Uplink Status</p>
                <h3 className="text-lg font-black text-slate-900">Online 24/7</h3>
                <p className="text-[10px] text-slate-400">Latency: 5-10ms</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-md" />
            </div>
            <div className="flex gap-3">
              <a 
                href="https://t.me/smarttask_support" 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600/10 text-indigo-600 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600/20 transition-all"
              >
                <Send className="w-3 h-3" />
                Telegram
              </a>
              <a 
                href="https://wa.me/8801700000000" 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600/20 transition-all"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-6 space-y-4 mb-4 relative z-10 scrollbar-hide">
          {myMessages.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No transmission logs found</p>
            </div>
          ) : (
            myMessages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl border transition-all ${
                  m.sender === 'user' 
                  ? 'bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border-indigo-500/30 text-slate-900 rounded-tr-none shadow-md' 
                  : 'bg-white border-slate-100 text-slate-600 rounded-tl-none shadow-sm'
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                  <p className={`text-[8px] mt-2 font-black uppercase tracking-tighter ${m.sender === 'user' ? 'text-indigo-600/60' : 'text-slate-400'}`}>
                    {m.date}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex-shrink-0 relative z-10">
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Enter message..." 
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              className="flex-grow bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"
            />
            <button 
              onClick={sendMessage}
              className="p-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl shadow-xl active:scale-90 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const uploadMedia = async (file: File): Promise<string> => {
    if (file.type.startsWith('video/')) {
      throw new Error('Video upload is not supported by the current image hosting service. Please upload an image instead.');
    }
    const formData = new FormData();
    formData.append('image', file);
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey) throw new Error('ImgBB API Key is missing. Please add it in settings.');
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    throw new Error(data.error?.message || 'Upload failed');
  };

  const FolderAView = () => {
    const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [submission, setSubmission] = useState({ userName: '', screenshot: '', link: '' });
    const [isUploading, setIsUploading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      setMessage(null);
      try {
        const url = await uploadMedia(file);
        setSubmission({ ...submission, screenshot: url });
        setMessage({ text: 'Screenshot uploaded successfully!', type: 'success' });
      } catch (err) {
        setMessage({ text: err instanceof Error ? err.message : 'Upload failed', type: 'error' });
      } finally {
        setIsUploading(false);
      }
    };

    const handleSubmit = async () => {
      setMessage(null);
      if (!submission.userName || !submission.screenshot) {
        setMessage({ text: 'Please fill all fields', type: 'error' });
        return;
      }
      await handleSubmission(async () => {
        const newSub: MicrojobSubmission = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          userId: user.id,
          microjobId: selectedTask.title,
          userName: submission.userName,
          link: submission.link,
          screenshot: submission.screenshot,
          status: 'pending',
          date: new Date().toLocaleString()
        };
        await insertRow('microjobSubmissions', newSub as any);
        setStep('success');
      }, 'Microjob submitted successfully!');
    };

    if (showHistory) {
      const mySubmissions = microjobSubmissions.filter(s => s.userId === user.id);
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Work History</h2>
            </div>

            <div className="space-y-4">
              {mySubmissions.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No work logs found</p>
                </div>
              ) : (
                mySubmissions.map(s => (
                  <div key={s.id} className="glass-card border-white/40 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{s.microjobId}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{s.date}</p>
                      </div>
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                        s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        s.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    {s.reason && <p className="text-[8px] font-bold text-rose-500 uppercase mt-2 pt-2 border-t border-slate-100">Note: {s.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (step === 'success') {
      return (
        <SuccessView 
          title="Work Submitted"
          subtitle="Microjob proof received"
          onClose={() => setStep('list')}
          colorClass="bg-indigo-500"
          details={[
            { label: 'Task', value: selectedTask?.title },
            { label: 'Reward', value: `৳ ${selectedTask?.reward.toFixed(2)}`, color: 'text-indigo-600' },
            { label: 'Status', value: 'Pending Review' }
          ]}
        />
      );
    }

    if (step === 'submit') {
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('list')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Submit Proof</h2>
            </div>
            <div className="glass-card space-y-4 border-white/40 shadow-lg">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4">
                <h4 className="text-sm font-black text-indigo-600 uppercase">{selectedTask.title}</h4>
                <p className="text-[10px] text-indigo-500 font-bold">Reward: ৳ {selectedTask.reward.toFixed(2)}</p>
                {selectedTask.link && (
                  <a 
                    href={selectedTask.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit Job Link
                  </a>
                )}
              </div>
              
              {message && (
                <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <p className="text-[10px] font-bold uppercase">{message.text}</p>
                </div>
              )}

              <div className="text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Username</label>
                <input 
                  type="text" 
                  placeholder="Your Social Username" 
                  value={submission.userName}
                  onChange={e => setSubmission({...submission, userName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Work Link</label>
                <input 
                  type="text" 
                  placeholder="Your Profile/Post Link" 
                  value={submission.link}
                  onChange={e => setSubmission({...submission, link: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Screenshot Proof</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload-a"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="screenshot-upload-a"
                    className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-indigo-500 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    ) : submission.screenshot ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Screenshot Ready</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Select from Gallery</span>
                      </div>
                    )}
                  </label>
                  {submission.screenshot && (
                    <p className="text-[8px] text-slate-400 mt-2 truncate px-2">URL: {submission.screenshot}</p>
                  )}
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                SUBMIT WORK
              </button>

              <div className="mt-6 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Submission Rules</h4>
                <ul className="space-y-2">
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                    Upload a clear screenshot of the completed task from your gallery.
                  </li>
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                    Ensure the screenshot shows your work clearly.
                  </li>
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                    Multiple fake submissions will result in a ban.
                  </li>
                </ul>
              </div>
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
              <button onClick={() => setView('workstation')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Micro Freelancing">Micro Freelancing</h2>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-indigo-600">
              <History className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            {dynamicTasks.filter(t => t.category === 'micro').length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">No microjobs available</p>
              </div>
            ) : (
              dynamicTasks.filter(t => t.category === 'micro').map((task, i) => (
                <div key={i} className="glass-card flex justify-between items-center border-white/40 shadow-sm hover:shadow-md transition-all">
                  <div className="flex-1 mr-4">
                    <h4 className="text-sm font-black text-slate-900 mb-1">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 mb-2">{task.desc}</p>
                    <button 
                      onClick={() => {
                        window.open(task.link, '_blank');
                        setSelectedTask(task);
                        setStep('submit');
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Task Link
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-600 font-black text-sm">৳ {task.reward.toFixed(2)}</p>
                    <button 
                      onClick={() => { setSelectedTask(task); setStep('submit'); }}
                      className="mt-2 bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const FolderBView = () => {
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [proof, setProof] = useState({ userName: '', screenshot: '', link: '' });
    const [isUploading, setIsUploading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      setMessage(null);
      try {
        const url = await uploadMedia(file);
        setProof({ ...proof, screenshot: url });
        setMessage({ text: 'Screenshot uploaded successfully!', type: 'success' });
      } catch (err) {
        setMessage({ text: err instanceof Error ? err.message : 'Upload failed', type: 'error' });
      } finally {
        setIsUploading(false);
      }
    };

    const handleSubmit = async () => {
      setMessage(null);
      if (!proof.userName || !proof.screenshot) {
        setMessage({ text: 'Please fill all fields', type: 'error' });
        return;
      }
      await handleSubmission(async () => {
        const newSub: TaskSubmission = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          userId: user.id,
          taskType: selectedTask.title,
          userName: proof.userName,
          link: proof.link,
          screenshot: proof.screenshot,
          status: 'pending',
          date: new Date().toLocaleString(),
          reward: selectedTask.reward || 2.00,
          taskId: selectedTask.id
        };
        await insertRow('taskSubmissions', newSub as any);
        setStep('success');
      }, 'Proof submitted successfully!');
    };

    if (step === 'success') {
      return (
        <SuccessView 
          title="Proof Submitted"
          subtitle="Social task logged"
          onClose={() => { setSelectedTask(null); setStep('list'); }}
          colorClass="bg-amber-500"
          details={[
            { label: 'Task', value: selectedTask?.title },
            { label: 'Reward', value: `৳ ${selectedTask?.reward.toFixed(2)}`, color: 'text-amber-600' },
            { label: 'Status', value: 'Pending Review' }
          ]}
        />
      );
    }

    if (showHistory) {
      const mySubmissions = taskSubmissions.filter(s => s.userId === user.id && s.category === 'social');
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Social History</h2>
            </div>

            <div className="space-y-4">
              {mySubmissions.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No social logs found</p>
                </div>
              ) : (
                mySubmissions.map(s => (
                  <div key={s.id} className="glass-card border-white/40 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{s.taskId}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{s.date}</p>
                      </div>
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                        s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        s.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    {s.reason && <p className="text-[8px] font-bold text-rose-500 uppercase mt-2 pt-2 border-t border-slate-100">Note: {s.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (selectedTask) {
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setSelectedTask(null)} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Submit Proof</h2>
            </div>
            <div className="glass-card space-y-4 border-white/40 shadow-lg">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-4">
                <h4 className="text-sm font-black text-amber-600 uppercase">{selectedTask.title}</h4>
                <p className="text-[10px] text-amber-500 font-bold">Reward: ৳ {selectedTask.reward.toFixed(2)}</p>
                {selectedTask.link && (
                  <a 
                    href={selectedTask.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-3 w-full py-2 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit Facebook Link
                  </a>
                )}
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <p className="text-[10px] font-bold uppercase">{message.text}</p>
                </div>
              )}

              <div className="text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Username</label>
                <input 
                  type="text" 
                  placeholder="Your Facebook Username" 
                  value={proof.userName}
                  onChange={e => setProof({...proof, userName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div className="text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Work Link</label>
                <input 
                  type="text" 
                  placeholder="Your Profile/Post Link" 
                  value={proof.link}
                  onChange={e => setProof({...proof, link: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div className="text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Screenshot Proof</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload-b"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="screenshot-upload-b"
                    className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-amber-500 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    ) : proof.screenshot ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Screenshot Ready</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Select from Gallery</span>
                      </div>
                    )}
                  </label>
                  {proof.screenshot && (
                    <p className="text-[8px] text-slate-400 mt-2 truncate px-2">URL: {proof.screenshot}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                SUBMIT PROOF
              </button>

              <div className="mt-6 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Submission Rules</h4>
                <ul className="space-y-2">
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    Upload a clear screenshot of the completed task from your gallery.
                  </li>
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    Ensure the screenshot shows your work clearly.
                  </li>
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    Multiple fake submissions will result in a ban.
                  </li>
                </ul>
              </div>
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
            <button onClick={() => setView('workstation')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Social Media">Social Media</h2>
          </div>
          <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-amber-600">
            <History className="w-6 h-6" />
          </button>
        </div>
          <div className="space-y-4">
            {dynamicTasks.filter(t => t.category === 'social').length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">No social tasks available</p>
              </div>
            ) : (
              dynamicTasks.filter(t => t.category === 'social').map((task, i) => (
                <div key={i} className="glass-card flex justify-between items-center border-white/40 shadow-sm hover:shadow-md transition-all">
                  <div className="flex-1 mr-4">
                    <h4 className="text-sm font-black text-slate-900 mb-1">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 mb-2">{task.desc}</p>
                    <button 
                      onClick={() => {
                        window.open(task.link, '_blank');
                        setSelectedTask(task);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Link
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-600 font-black text-sm">৳ {task.reward.toFixed(2)}</p>
                    <button 
                      onClick={() => { setSelectedTask(task); }}
                      className="mt-2 bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const FolderCView = () => {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showHistory, setShowHistory] = useState(false);

    const handleSubmit = async () => {
      if (!email.trim()) return;
      await handleSubmission(async () => {
        const newSub: GmailSubmission = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          userId: user.id,
          email,
          status: 'pending',
          date: new Date().toLocaleString(),
          reward: selectedTask ? selectedTask.reward : gmailReward
        };
        await insertRow('gmailSubmissions', newSub as any);
        setEmail('');
        setStep('success');
      }, 'Gmail submitted successfully!');
    };

    if (showHistory) {
      const mySubmissions = gmailSubmissions.filter(s => s.userId === user.id);
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Gmail History</h2>
            </div>

            <div className="space-y-4">
              {mySubmissions.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Gmail logs found</p>
                </div>
              ) : (
                mySubmissions.map(s => (
                  <div key={s.id} className="glass-card border-white/40 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{s.taskId}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{s.date}</p>
                      </div>
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                        s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        s.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    {s.reason && <p className="text-[8px] font-bold text-rose-500 uppercase mt-2 pt-2 border-t border-slate-100">Note: {s.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (step === 'success') {
      return (
        <SuccessView 
          title="Account Logged"
          subtitle="Gmail submission received"
          onClose={() => setStep('list')}
          colorClass="bg-rose-500"
          details={[
            { label: 'Account', value: email },
            { label: 'Reward', value: `৳ ${(selectedTask ? selectedTask.reward : gmailReward).toFixed(2)}`, color: 'text-rose-600' },
            { label: 'Status', value: 'Pending Review' }
          ]}
        />
      );
    }

    if (step === 'submit') {
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('list')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Submit Task</h2>
            </div>
            <div className="glass-card space-y-6 border-white/40 shadow-lg">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <h4 className="text-sm font-black text-rose-900 mb-1">{selectedTask?.title || 'Gmail Sale'}</h4>
                <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">Reward: ৳ {(selectedTask ? selectedTask.reward : gmailReward).toFixed(2)}</p>
                {selectedTask?.link && (
                  <a 
                    href={selectedTask.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-3 w-full py-2 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit Gmail Link
                  </a>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Gmail Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 text-sm text-black font-medium outline-none focus:border-indigo-500 shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
                >
                  SUBMIT WORK
                </button>

                <div className="mt-6 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Asset Rules</h4>
                  <ul className="space-y-2">
                    <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                      Gmail accounts must be verified and active.
                    </li>
                    <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                      Use the required app password provided in the dashboard.
                    </li>
                    <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                      Payments are made after account verification.
                    </li>
                  </ul>
                </div>
              </div>
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
              <button onClick={() => setView('workstation')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Digital Assets">Digital Assets</h2>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-rose-600">
              <History className="w-6 h-6" />
            </button>
          </div>
          <div className="glass-card mb-6 border-amber-500/20 bg-amber-50/50 shadow-sm">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Required App Password</p>
            <h3 className="text-xl font-black text-slate-900 mb-2">{gmailPassword}</h3>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Use this password for all your Gmail submissions.</p>
          </div>
          <div className="glass-card mb-6 border-white/40 shadow-lg">
            <h3 className="text-lg font-black text-slate-900 mb-2">Bulk Gmail Submission</h3>
            <p className="text-xs text-slate-500 mb-4">Submit your verified Gmail accounts for bulk sale.</p>
            <div className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Gmail Address</label>
                <input 
                  type="email" 
                  placeholder="example@gmail.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-black font-medium outline-none focus:border-amber-500 shadow-sm" 
                />
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                SUBMIT ACCOUNT (৳ {gmailReward.toFixed(2)})
              </button>
            </div>
          </div>

          {/* Dynamic Gmail Tasks */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Special Gmail Tasks</h3>
            {dynamicTasks.filter(t => t.category === 'gmail').length === 0 ? (
              <div className="text-center py-10 glass-card border-dashed border-slate-200">
                <p className="text-[8px] text-slate-400 uppercase font-bold">No special tasks available</p>
              </div>
            ) : (
              dynamicTasks.filter(t => t.category === 'gmail').map((task, i) => (
                <div key={i} className="glass-card flex justify-between items-center border-white/40 shadow-sm">
                  <div className="flex-1 mr-4">
                    <h4 className="text-sm font-black text-slate-900 mb-1">{task.title}</h4>
                    <p className="text-[10px] text-slate-500">{task.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-600 font-black text-sm">৳ {task.reward.toFixed(2)}</p>
                    <button 
                      onClick={() => { window.open(task.link, '_blank'); setSelectedTask(task); setStep('submit'); }}
                      className="mt-2 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-md active:scale-95 transition-all"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const FolderDView = () => {
    const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
    const [selectedTask, setSelectedTask] = useState<any>(null);

    if (step === 'success') {
      return (
        <SuccessView 
          title="Claim Successful"
          subtitle="Premium job logged"
          onClose={() => setStep('list')}
          colorClass="bg-indigo-600"
          details={[
            { label: 'Job', value: selectedTask?.title },
            { label: 'Reward', value: `৳ ${selectedTask?.reward.toFixed(2)}`, color: 'text-indigo-600' },
            { label: 'Status', value: 'Pending Review' }
          ]}
        />
      );
    }

    if (step === 'submit') {
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('list')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Claim Premium</h2>
            </div>
            <div className="glass-card space-y-6 border-white/40 shadow-lg">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="text-sm font-black text-indigo-900 mb-1">{selectedTask?.title}</h4>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Reward: ৳ {selectedTask?.reward.toFixed(2)}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">By claiming this premium job, you agree to the terms of the network marketing program.</p>
              <button 
                onClick={() => setStep('success')}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                CONFIRM CLAIM
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('workstation')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Team Stats">Team Stats</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 mb-8">
            {[
              { gen: '1st Generation', count: 0, rate: `৳ ${adReward.toFixed(2)}`, total: '৳ 0.00', color: 'indigo' },
              { gen: '2nd Generation', count: 0, rate: `৳ ${(adReward/4).toFixed(2)}`, total: '৳ 0.00', color: 'violet' },
              { gen: '3rd Generation', count: 0, rate: `৳ ${(adReward/10).toFixed(2)}`, total: '৳ 0.00', color: 'pink' },
            ].map((item, i) => (
              <div key={i} className="glass-card flex justify-between items-center border-white/40 shadow-sm">
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">{item.gen}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-${item.color}-500 animate-pulse`} />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.count} Active Workers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-${item.color}-600 font-black text-sm`}>{item.total}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Rate: {item.rate}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Premium Tasks */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Premium Income Jobs</h3>
            {dynamicTasks.filter(t => t.category === 'premium').length === 0 ? (
              <div className="text-center py-20 glass-card border-dashed border-slate-200 bg-indigo-50/30">
                <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">No premium jobs active</p>
              </div>
            ) : (
              dynamicTasks.filter(t => t.category === 'premium').map((task, i) => (
                <div key={i} className="glass-card flex justify-between items-center border-white/40 shadow-lg bg-gradient-to-br from-white to-indigo-50/30">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <h4 className="text-sm font-black text-slate-900">{task.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500">{task.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-600 font-black text-sm">৳ {task.reward.toFixed(2)}</p>
                    <button 
                      onClick={() => { window.open(task.link, '_blank'); setSelectedTask(task); setStep('submit'); }}
                      className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
                    >
                      Claim
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const leaderboardView = (
    <div className="min-h-screen pb-32">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Leaderboard">Leaderboard</h2>
        </div>
        <div className="space-y-4">
          {[
            { name: 'Ariful Islam', earned: '৳ 45,200', rank: 1 },
            { name: 'Mehedi Hasan', earned: '৳ 38,500', rank: 2 },
            { name: 'Sabbir Ahmed', earned: '৳ 32,100', rank: 3 },
            { name: 'Tanvir Hossain', earned: '৳ 28,900', rank: 4 },
            { name: 'Rashed Khan', earned: '৳ 25,400', rank: 5 },
          ].map((player, i) => (
            <div key={i} className={`glass-card flex items-center justify-between shadow-sm ${i < 3 ? 'border-amber-500/40 bg-amber-50/50' : 'border-white/40'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${
                  i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {player.rank}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{player.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Top Earner</p>
                </div>
              </div>
              <p className="text-amber-600 font-black">{player.earned}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SpinView = () => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const spin = () => {
      if (isSpinning) return;
      setIsSpinning(true);
      setResult(null);
      setTimeout(() => {
        const rewards = ['৳ 0.50', '৳ 1.00', '৳ 2.00', 'Try Again', '৳ 5.00'];
        const win = rewards[Math.floor(Math.random() * rewards.length)];
        setResult(win);
        setIsSpinning(false);
        if (win !== 'Try Again') {
          confetti({ particleCount: 50, spread: 60 });
        }
      }, 2000);
    };

    return (
      <div className="min-h-screen pb-32">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Spin & Win">Spin & Win</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div 
              animate={isSpinning ? { rotate: 360 * 5 } : {}}
              transition={isSpinning ? { duration: 2, ease: "easeInOut" } : {}}
              className="w-64 h-64 rounded-full border-8 border-amber-500/10 flex items-center justify-center relative mb-12 shadow-2xl bg-white"
            >
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-500/20 animate-spin-slow" />
              <TrendingUp className="w-20 h-20 text-amber-500" />
            </motion.div>
            
            {result && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-8 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">You Won</p>
                <h3 className="text-4xl font-black text-amber-600 neon-text">{result}</h3>
              </motion.div>
            )}

            <button 
              onClick={spin}
              disabled={isSpinning}
              className="px-12 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {isSpinning ? 'SPINNING...' : `SPIN NOW (৳ ${spinCost.toFixed(2)})`}
            </button>

            <div className="mt-12 w-full max-w-xs">
              <div className="glass-card border-amber-500/20 bg-amber-50/30 p-4">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  Spinning Rules
                </h4>
                <ul className="space-y-2">
                  <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    Each spin costs ৳ {spinCost.toFixed(2)} from your main balance.
                  </li>
                  <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    Rewards are added instantly to your wallet.
                  </li>
                  <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    Fair play system: Results are randomly generated.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const mobileBankingView = (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Mobile Banking">Mobile Banking</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {[
            { id: 'mobile-recharge', title: 'Mobile Recharge', desc: 'Recharge any mobile number instantly.', icon: <Smartphone className="w-8 h-8" />, color: 'from-indigo-500 to-blue-600' },
            { id: 'drive-offer', title: 'Drive Offer', desc: 'Exclusive internet and talk-time offers.', icon: <Zap className="w-8 h-8" />, color: 'from-amber-500 to-orange-600' },
          ].map((item, i) => (
            <motion.button 
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView(item.id as View)}
              className={`glass-card text-left relative overflow-hidden group border-white/40 shadow-lg p-6 ${
                (!enabledFeatures.includes(item.id) && !isAdmin) ? 'opacity-50 grayscale cursor-not-allowed' : ''
              }`}
              disabled={!enabledFeatures.includes(item.id) && !isAdmin}
            >
              <div className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${item.color} opacity-5 group-hover:opacity-10 transition-all`} />
              <div className="flex justify-between items-center relative z-10">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[80%]">{item.desc}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg text-white`}>
                  {item.icon}
                </div>
              </div>
              {!enabledFeatures.includes(item.id) && !isAdmin && (
                <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center">
                  <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase">Locked by Admin</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  const MobileRechargeView = () => {
    const [phone, setPhone] = useState('');
    const [operator, setOperator] = useState('GP');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'Prepaid' | 'Postpaid'>('Prepaid');
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRecharge, setLastRecharge] = useState<any>(null);

    const handleSubmit = async () => {
      setError(null);
      if (!phone || !amount) {
        setError('Please fill all fields');
        return;
      }
      const amt = parseFloat(amount);
      if (amt < 20) {
        setError('Minimum recharge is ৳ 20');
        return;
      }
      if (user.mainBalance < amt) {
        setError('Insufficient balance');
        return;
      }

      await handleSubmission(async () => {
        const rechargeData = {
          userId: user.id,
          phone,
          operator,
          amount: amt,
          type,
          status: 'pending',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          timestamp: Date.now(),
          transactionId: 'REC-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };
        await insertRow('rechargeRequests', rechargeData);
        
        // Deduct balance
        const userRef_id = user.id;
        await updateRow('users', userRef_id, {
          mainBalance: -amt
        });

        setLastRecharge(rechargeData);
        setStep('success');
      }, 'Mobile recharge request submitted successfully!');
    };

    if (showHistory) {
      const myRequests = rechargeRequests.filter(r => r.userId === user.id);
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Recharge History</h2>
            </div>
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No recharge logs</p>
                </div>
              ) : (
                myRequests.map(r => (
                  <div key={r.id} className="glass-card border-white/40 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{r.operator} • {r.type}</p>
                        <p className="text-lg font-black text-slate-900 mt-1">৳ {r.amount.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-slate-500">{r.phone}</p>
                      </div>
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                        r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        r.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{r.date}</p>
                      {r.reason && <p className="text-[8px] font-bold text-rose-500 uppercase">Note: {r.reason}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (step === 'success') {
      return (
        <SuccessView 
          title="Recharge Requested"
          subtitle="Mobile recharge logged"
          onClose={() => setStep('form')}
          colorClass="bg-indigo-600"
          details={[
            { label: 'Transaction ID', value: lastRecharge?.transactionId },
            { label: 'Date & Time', value: `${lastRecharge?.date} | ${lastRecharge?.time}` },
            { label: 'Phone', value: lastRecharge?.phone },
            { label: 'Amount', value: `৳ ${lastRecharge?.amount.toFixed(2)}`, color: 'text-indigo-600' },
            { label: 'Operator', value: lastRecharge?.operator }
          ]}
        />
      );
    }

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('mobile-banking')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Mobile Recharge">Mobile Recharge</h2>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-indigo-600">
              <History className="w-6 h-6" />
            </button>
          </div>

          <div className="glass-card border-white/40 shadow-xl space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Mobile Number</label>
                <input 
                  type="tel" 
                  placeholder="01XXXXXXXXX" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Operator</label>
                <div className="grid grid-cols-3 gap-2">
                  {['GP', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'].map(op => (
                    <button 
                      key={op}
                      onClick={() => setOperator(op)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${operator === op ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-500'}`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Amount (৳)</label>
                {error && <p className="text-[10px] font-bold text-rose-500 mb-2 ml-1">{error}</p>}
                <input 
                  type="number" 
                  placeholder="Min ৳ 20" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
                />
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-[10px] font-black text-emerald-600 mt-2 ml-1 uppercase">
                    Commission: ৳ {((parseFloat(amount) / 1000) * rechargeCommissionRate).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Prepaid', 'Postpaid'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setType(t as any)}
                      className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${type === t ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
            >
              RECHARGE NOW
            </button>

            <div className="mt-6 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Recharge Rules</h4>
              <ul className="space-y-2">
                <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Minimum recharge amount is ৳ 20.
                </li>
                <li className="text-[9px] text-indigo-600 font-black flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 shrink-0" />
                  প্রতি ১০০০ টাকা রিচার্জে ৳ {rechargeCommissionRate} কমিশন পাবেন।
                </li>
                <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Processing time: 10 minutes to 2 hours.
                </li>
                <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Ensure the mobile number is correct before submitting.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DriveOfferView = () => {
    const [phone, setPhone] = useState('');
    const [selectedOffer, setSelectedOffer] = useState<DriveOffer | null>(null);
    const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastOffer, setLastOffer] = useState<any>(null);

    const handleSubmit = async () => {
      setError(null);
      if (!phone || !selectedOffer) {
        setError('Please fill all fields');
        return;
      }
      if (user.mainBalance < selectedOffer.price) {
        setError('Insufficient balance');
        return;
      }

      await handleSubmission(async () => {
        const offerData = {
          userId: user.id,
          driveOfferId: selectedOffer.id,
          phone,
          amount: selectedOffer.price,
          status: 'pending',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          timestamp: Date.now(),
          transactionId: 'DRV-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };
        await insertRow('driveOfferRequests', offerData);
        
        // Deduct balance
        const userRef_id = user.id;
        await updateRow('users', userRef_id, {
          mainBalance: -selectedOffer.price
        });

        setLastOffer(offerData);
        setStep('success');
      }, 'Drive offer request submitted successfully!');
    };

    if (showHistory) {
      const myRequests = driveOfferRequests.filter(r => r.userId === user.id);
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Drive History</h2>
            </div>
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No drive logs</p>
                </div>
              ) : (
                myRequests.map(r => {
                  const offer = driveOffers.find(o => o.id === r.driveOfferId);
                  return (
                    <div key={r.id} className="glass-card border-white/40 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{offer?.title || 'Drive Offer'}</p>
                          <p className="text-lg font-black text-slate-900 mt-1">৳ {r.amount.toFixed(2)}</p>
                          <p className="text-[10px] font-bold text-slate-500">{r.phone}</p>
                        </div>
                        <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                          r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                          r.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                          'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase">{r.date}</p>
                        {r.reason && <p className="text-[8px] font-bold text-rose-500 uppercase">Note: {r.reason}</p>}
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

    if (step === 'success') {
      return (
        <SuccessView 
          title="Offer Requested"
          subtitle="Drive offer logged"
          onClose={() => setStep('list')}
          colorClass="bg-amber-600"
          details={[
            { label: 'Transaction ID', value: lastOffer?.transactionId },
            { label: 'Date & Time', value: `${lastOffer?.date} | ${lastOffer?.time}` },
            { label: 'Phone', value: lastOffer?.phone },
            { label: 'Amount', value: `৳ ${lastOffer?.amount.toFixed(2)}`, color: 'text-amber-600' },
            { label: 'Operator', value: selectedOffer?.operator }
          ]}
        />
      );
    }

    if (step === 'submit') {
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('list')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Confirm Purchase</h2>
            </div>
            <div className="glass-card border-white/40 shadow-xl space-y-6">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="text-sm font-black text-indigo-600 uppercase">{selectedOffer?.title}</h4>
                <p className="text-[10px] text-indigo-500 font-bold">{selectedOffer?.description}</p>
                <p className="text-lg font-black text-slate-900 mt-2">৳ {selectedOffer?.price.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Mobile Number</label>
                {error && <p className="text-[10px] font-bold text-rose-500 mb-2 ml-1">{error}</p>}
                <input 
                  type="tel" 
                  placeholder="01XXXXXXXXX" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
              >
                BUY NOW
              </button>

              <div className="mt-6 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Drive Offer Rules</h4>
                <ul className="space-y-2">
                  <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    ড্রাইভ অফার সচল হতে ১০ মিনিট থেকে ২ ঘণ্টা সময় লাগতে পারে।
                  </li>
                  <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    ভুল নাম্বারে অফার কিনলে কর্তৃপক্ষ দায়ী থাকবে না।
                  </li>
                  <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                    অফার সফল হওয়ার পর কোনো রিফান্ড হবে না।
                  </li>
                </ul>
              </div>
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
              <button onClick={() => setView('mobile-banking')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Drive Offer">Drive Offer</h2>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-indigo-600">
              <History className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {driveOffers.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No drive offers available</p>
              </div>
            ) : (
              driveOffers.map(offer => (
                <div key={offer.id} className="glass-card border-white/40 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{offer.title}</h4>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{offer.operator}</p>
                    </div>
                    <p className="text-lg font-black text-emerald-600">৳ {offer.price}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">{offer.description}</p>
                  <button 
                    onClick={() => { setSelectedOffer(offer); setStep('submit'); }}
                    className="w-full py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    Buy Offer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const EcommerceView = () => {
    const [step, setStep] = useState<'list' | 'submit' | 'success' | 'history'>('list');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [lastOrder, setLastOrder] = useState<any>(null);

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
          deliveryFee: deliveryFee,
          totalPaid: deliveryFee,
          paymentStatus: 'COD',
          status: 'pending',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          timestamp: Date.now(),
          orderId: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };

        const userRef_id = user.id;
        await updateRow('users', userRef_id, {
          mainBalance: -deliveryFee
        });

        await insertRow('productOrders', orderData);

        setLastOrder(orderData);
        setStep('success');
      }, 'Order placed successfully!');
    };

    if (step === 'success') {
      return (
        <SuccessView 
          title="Order Success"
          subtitle="Your transaction has been verified"
          onClose={() => setStep('list')}
          colorClass="bg-emerald-500"
          details={[
            { label: 'Order ID', value: lastOrder?.orderId },
            { label: 'Date & Time', value: `${lastOrder?.date} | ${lastOrder?.time}` },
            { label: 'Product', value: selectedProduct?.name },
            { label: 'Amount Paid', value: `৳ ${lastOrder?.amount.toFixed(2)}`, color: 'text-emerald-600' }
          ]}
        />
      );
    }

    if (step === 'submit') {
      return (
        <div className="min-h-screen pb-32 bg-slate-50">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('list')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
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
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="01XXXXXXXXX" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Shipping Address</label>
                <textarea 
                  placeholder="Full Address" 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
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
              <button onClick={() => setStep('list')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Order History</h2>
            </div>
            <div className="space-y-4">
              {productOrders.filter(o => o.userId === user.id).length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No orders yet</p>
                </div>
              ) : (
                productOrders.filter(o => o.userId === user.id).map(o => {
                  const product = products.find(p => p.id === o.productId);
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
                        <span className={`text-[7px] font-black uppercase px-2 py-1 rounded-full ${
                          o.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 
                          o.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 
                          o.status === 'processing' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
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
              <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
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
              প্রতিটি অর্ডারের জন্য ৳ {deliveryFee} অগ্রিম ডেলিভারি চার্জ আপনার ব্যালেন্স থেকে কেটে নেওয়া হবে। প্রোডাক্টের দাম ডেলিভারি ম্যানকে ক্যাশ অন ডেলিভারি (COD) হিসেবে দিতে হবে।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {products.length === 0 ? (
              <div className="col-span-2 text-center py-20">
                <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No products available</p>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="glass-card border-white/40 shadow-lg overflow-hidden flex flex-col p-0">
                  <div className="p-3 flex flex-col flex-1">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase line-clamp-1">{p.name}</h4>
                    <p className="text-xs font-black text-indigo-600 mt-1">৳ {p.price.toFixed(2)}</p>
                    <button 
                      onClick={() => handleBuy(p)}
                      className="mt-3 w-full py-2 bg-slate-900 text-white rounded-xl font-black text-[8px] uppercase tracking-widest active:scale-95 transition-all"
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
  };

  const DollarBuyView = () => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Binance');
    const [wallet, setWallet] = useState('');
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [error, setError] = useState('');
    const [lastBuy, setLastBuy] = useState<any>(null);

    const handleSubmit = async () => {
      const val = parseFloat(amount);
      if (!val || val <= 0) {
        setError('Valid amount required');
        return;
      }
      if (!wallet) {
        setError('Wallet address/ID required');
        return;
      }

      const totalPrice = val * dollarBuyRate;
      if (totalPrice > user.mainBalance) {
        setError('Insufficient balance in your account');
        return;
      }

      await handleSubmission(async () => {
        const buyData = {
          userId: user.id,
          amount: val,
          price: totalPrice,
          method: `${method}`,
          wallet: wallet,
          status: 'pending' as const,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          timestamp: Date.now(),
          orderId: 'BUY-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };

        await insertRow('dollarBuyRequests', buyData);
        
        const userRef_id = user.id;
        await updateRow('users', userRef_id, {
          mainBalance: -totalPrice
        });

        setLastBuy(buyData);
        setStep('success');
      }, 'Dollar buy request submitted successfully!');
    };

    if (step === 'success') {
      return (
        <SuccessView 
          title="Purchase Success"
          subtitle="Dollar buy request logged"
          onClose={() => setView('otp-buy-sell')}
          colorClass="bg-indigo-600"
          details={[
            { label: 'Order ID', value: lastBuy?.orderId },
            { label: 'Date & Time', value: `${lastBuy?.date} | ${lastBuy?.time}` },
            { label: 'Amount ($)', value: `$ ${lastBuy?.amount.toFixed(2)}` },
            { label: 'Total Paid', value: `৳ ${lastBuy?.price.toFixed(2)}`, color: 'text-indigo-600' },
            { label: 'Method', value: lastBuy?.method }
          ]}
        />
      );
    }

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('otp-buy-sell')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Buy Dollar</h2>
          </div>

          <div className="glass-card border-white/40 shadow-xl space-y-6">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
              <p className="text-[10px] font-black text-indigo-600 uppercase">Current Rate</p>
              <p className="text-2xl font-black text-slate-900">$1 = ৳ {dollarBuyRate.toFixed(2)}</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Dollar Amount ($)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
              />
              <p className="text-[8px] font-bold text-slate-400 mt-1 ml-1">Total Cost: ৳ {(parseFloat(amount) * dollarBuyRate || 0).toFixed(2)}</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Receive Method</label>
              <select 
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
              >
                <option value="Binance">Binance (Pay ID)</option>
                <option value="Trust Wallet">Trust Wallet (USDT BEP20)</option>
                <option value="Pyypl">Pyypl</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Your Wallet Address / Pay ID</label>
              <input 
                type="text" 
                placeholder="Where should we send?" 
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            {error && <p className="text-[10px] font-bold text-rose-500 text-center">{error}</p>}

            <button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
            >
              BUY DOLLARS NOW
            </button>

            <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Purchase Rules</h4>
              <ul className="space-y-2">
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Cost is deducted from your main balance.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Processing time: 1-12 hours.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Ensure your wallet details are 100% correct.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Buy History
            </h3>
            <div className="space-y-3">
              {dollarBuyRequests.filter(r => r.userId === user.id).length === 0 ? (
                <div className="glass-card text-center py-10 border-white/40">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No buy history found</p>
                </div>
              ) : (
                dollarBuyRequests
                  .filter(r => r.userId === user.id)
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map(r => (
                    <div key={r.id} className="glass-card border-white/40 shadow-sm flex justify-between items-center p-4">
                      <div>
                        <p className="text-xs font-black text-slate-900">${r.amount} via {r.method}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{r.date}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        r.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                        r.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {r.status}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const socialHubView = (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="SOCIAL HUB">SOCIAL HUB</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div 
            onClick={() => {
              confetti({ particleCount: 100, spread: 70 });
              alert('You claimed a FREE gift! +৳ 5.00 added to your balance.');
              const userRef_id = user.id;
              updateRow('users', userRef_id, { mainBalance: 5 });
            }}
            className="glass-card p-6 flex items-center justify-between border-amber-200 bg-amber-50/50 shadow-lg group relative overflow-hidden cursor-pointer active:scale-95 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-5 transition-all" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">FREE KOP</h3>
                <p className="text-[8px] font-bold text-amber-600 uppercase">Claim ৳ 5.00 Bonus</p>
              </div>
            </div>
            <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter relative z-10">Claim Now</span>
          </div>

          {[
            { title: 'Tiktok Earn', color: 'from-pink-500 to-rose-600', icon: <Music className="w-6 h-6" /> },
            { title: 'Teligram Earn', color: 'from-sky-400 to-blue-500', icon: <Send className="w-6 h-6" /> },
            { title: 'Taiping Work', color: 'from-slate-600 to-slate-800', icon: <Keyboard className="w-6 h-6" /> },
            { title: 'Inestragram job', color: 'from-purple-500 to-pink-500', icon: <Instagram className="w-6 h-6" /> },
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => {
                setSelectedSocialJob(item);
                setView('social-job');
              }}
              className="glass-card p-6 flex items-center justify-between border-white/40 shadow-lg group relative overflow-hidden cursor-pointer active:scale-95 transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-5 transition-all`} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{item.title}</h3>
              </div>
              <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter relative z-10">Open Job</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SocialJobView = () => {
    const [trxId, setTrxId] = useState('');
    const [screenshot, setScreenshot] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const payeerAccount = '59383883';

    if (!selectedSocialJob) return null;

    const handleSubmit = async () => {
      if (!trxId || !screenshot) {
        alert('Please provide both Transaction ID and Screenshot.');
        return;
      }

      setIsSubmitting(true);
      try {
        const submission: SocialSubmission = {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          type: selectedSocialJob.title,
          trxId,
          screenshot,
          status: 'pending',
          date: new Date().toISOString()
        };

        await insertRow('socialSubmissions', submission as any);
        alert('Submission successful! Please wait for admin approval.');
        setView('social-hub');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'socialSubmissions');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('social-hub')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 uppercase">{selectedSocialJob.title}</h2>
          </div>

          <div className="space-y-6">
            {/* Rules Section */}
            <div className="glass-card p-6 border-indigo-100 bg-indigo-50/30">
              <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                কাজের নিয়মাবলী (Rules)
              </h3>
              <ul className="space-y-3">
                {[
                  'এই কাজটি করতে হলে আপনাকে অবশ্যই আমাদের নিয়ম মেনে চলতে হবে।',
                  'ভুল তথ্য দিলে আপনার একাউন্ট ব্যান হতে পারে।',
                  'পেমেন্ট করার পর ট্রানজেকশন আইডি এবং স্ক্রিনশট জমা দিন।',
                  'এডমিন যাচাই করার পর আপনার একাউন্টে ব্যালেন্স যোগ হবে।',
                  'যেকোনো সমস্যার জন্য আমাদের টেলিগ্রাম বোটে যোগাযোগ করুন।'
                ].map((rule, i) => (
                  <li key={i} className="flex gap-3 text-xs font-bold text-slate-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px]">{i + 1}</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Telegram Bot Button */}
            <a 
              href="https://t.me/IMADMIN1_BOT" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full p-4 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Send className="w-5 h-5" />
              Contact Telegram Bot
            </a>

            {/* Payment Info */}
            <div className="glass-card p-6 border-white/40 shadow-xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payeer Account Number</p>
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl shadow-inner">
                <span className="text-xl font-black text-white tracking-widest">{payeerAccount}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(payeerAccount);
                    alert('Payeer account copied!');
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Click copy button and pay via Payeer</p>
            </div>

            {/* Submission Form */}
            <div className="glass-card p-6 border-white/40 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Submit Proof</h3>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Transaction ID (Trx ID)</label>
                <input 
                  type="text" 
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="Enter Transaction ID"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Screenshot URL</label>
                <input 
                  type="text" 
                  value={screenshot}
                  onChange={(e) => setScreenshot(e.target.value)}
                  placeholder="Paste Screenshot Link"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                />
                <p className="text-[8px] font-bold text-slate-400 mt-1 ml-2 uppercase">Upload to imgbb.com and paste link here</p>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                  isSubmitting ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white active:scale-95'
                }`}
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Now'}
              </button>
            </div>

            {/* History Section */}
            <div className="glass-card p-6 border-white/40 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                Submission History
              </h3>
              <div className="space-y-3">
                {allSocialSubmissions.filter(s => s.userId === user.id && s.type === selectedSocialJob.title).length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No history found</p>
                ) : (
                  allSocialSubmissions
                    .filter(s => s.userId === user.id && s.type === selectedSocialJob.title)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(s => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase">{s.trxId}</p>
                          <p className="text-[8px] text-slate-400 font-bold">{new Date(s.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${
                          s.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                          s.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DollarSellView = () => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Binance');
    const [wallet, setWallet] = useState('');
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [lastSell, setLastSell] = useState<any>(null);

    const adminDetails = {
      'Binance': '737474885',
      'USDT (BEP20)': 'OXGGCCGCCGG'
    };

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setError('Valid amount required');
        return;
      }
      if (!wallet) {
        setError('Wallet address/ID required');
        return;
      }

      await handleSubmission(async () => {
        const sellData = {
          userId: user.id,
          amount: parseFloat(amount) * dollarSellRate,
          method: `Dollar Sell (${method}) - ${wallet}`,
          status: 'pending',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          timestamp: Date.now(),
          transactionId: 'SEL-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };

        await insertRow('withdrawals', sellData);
        setLastSell(sellData);
        setStep('success');
      }, 'Dollar sell request submitted successfully!');
    };

    if (step === 'success') {
      return (
        <SuccessView 
          title="Submission Received"
          subtitle="Dollar sell request logged"
          onClose={() => setView('otp-buy-sell')}
          colorClass="bg-emerald-600"
          details={[
            { label: 'Transaction ID', value: lastSell?.transactionId },
            { label: 'Date & Time', value: `${lastSell?.date} | ${lastSell?.time}` },
            { label: 'Amount ($)', value: `$ ${parseFloat(amount).toFixed(2)}` },
            { label: 'Estimated TK', value: `৳ ${lastSell?.amount.toFixed(2)}`, color: 'text-emerald-600' },
            { label: 'Method', value: method }
          ]}
        />
      );
    }

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('otp-buy-sell')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Sell Dollar</h2>
          </div>

          <div className="glass-card border-white/40 shadow-xl space-y-6">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <p className="text-[10px] font-black text-emerald-600 uppercase">Current Rate</p>
              <p className="text-2xl font-black text-slate-900">$1 = ৳ {dollarSellRate.toFixed(2)}</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Dollar Amount ($)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-emerald-500 shadow-inner"
              />
              <p className="text-[8px] font-bold text-slate-400 mt-1 ml-1">You will receive: ৳ {(parseFloat(amount) * dollarSellRate || 0).toFixed(2)}</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Payment Method</label>
              <select 
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-emerald-500 shadow-inner"
              >
                <option value="Binance">Binance (Pay ID)</option>
                <option value="USDT (BEP20)">USDT (BEP20)</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase">Admin {method === 'Binance' ? 'Pay ID' : 'Address'}</p>
                {copied && <span className="text-[8px] font-black text-emerald-500 uppercase animate-pulse">Copied!</span>}
              </div>
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <code className="text-xs font-black text-slate-900 break-all">
                  {adminDetails[method as keyof typeof adminDetails]}
                </code>
                <button 
                  onClick={() => handleCopy(adminDetails[method as keyof typeof adminDetails])}
                  className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[8px] font-bold text-slate-400 italic">Send your dollars to this {method === 'Binance' ? 'ID' : 'Address'} first, then submit your details below.</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Your Wallet Address / Pay ID</label>
              <input 
                type="text" 
                placeholder="Enter your sender details" 
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>

            {error && <p className="text-[10px] font-bold text-rose-500 text-center">{error}</p>}

            <button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
            >
              SUBMIT SELL REQUEST
            </button>

            <div className="mt-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Exchange Rules</h4>
              <ul className="space-y-2">
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1 shrink-0" />
                  Rate is fixed at ৳ {dollarSellRate.toFixed(2)} per Dollar.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1 shrink-0" />
                  Processing time: 1-6 hours.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1 shrink-0" />
                  Double check your Pay ID/Wallet address.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              Sell History
            </h3>
            <div className="space-y-3">
              {withdrawals.filter(w => w.userId === user.id && w.method.startsWith('Dollar Sell')).length === 0 ? (
                <div className="glass-card text-center py-10 border-white/40">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No sell history found</p>
                </div>
              ) : (
                withdrawals
                  .filter(w => w.userId === user.id && w.method.startsWith('Dollar Sell'))
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map(w => (
                    <div key={w.id} className="glass-card border-white/40 shadow-sm flex justify-between items-center p-4">
                      <div>
                        <p className="text-xs font-black text-slate-900">{w.method.split(' - ')[0]}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{w.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600">৳ {w.amount}</p>
                        <div className={`mt-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest inline-block ${
                          w.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                          w.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {w.status}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const otpBuySellView = (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="BUY SELL">BUY SELL</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { title: 'DOLLAR BUY', color: 'from-indigo-500 to-violet-600', icon: <DollarSign className="w-6 h-6" />, view: 'dollar-buy' },
            { title: 'DOLLAR SELL', color: 'from-emerald-500 to-teal-600', icon: <DollarSign className="w-6 h-6" />, view: 'dollar-sell' },
            { title: 'WHATSAPP SELL', color: 'from-emerald-500 to-green-600', icon: <MessageCircle className="w-6 h-6" /> },
            { title: 'TELEGRAM SELL', color: 'from-sky-500 to-blue-600', icon: <Send className="w-6 h-6" /> },
            { title: 'KYC BY SELL', color: 'from-purple-500 to-indigo-600', icon: <ShieldCheck className="w-6 h-6" /> },
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => item.view && setView(item.view as View)}
              className={`glass-card p-6 flex items-center justify-between border-white/40 shadow-lg group relative overflow-hidden ${item.view ? 'cursor-pointer active:scale-95' : ''} transition-all`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-5 transition-all`} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{item.title}</h3>
              </div>
              {item.view ? (
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-all" />
              ) : (
                <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter relative z-10">Upcoming</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AdsEarnView = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayWatch = user.adWatches.find(w => w.date === today) || { id: today, date: today, count: 0 };
    const [isWatching, setIsWatching] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const watchAd = async () => {
      setMessage(null);
      if (todayWatch.count >= dailyAdLimit) {
        setMessage({ text: 'Daily ad limit reached!', type: 'error' });
        return;
      }
      setIsWatching(true);
      setTimeout(async () => {
        setIsWatching(false);
        const newCount = todayWatch.count + 1;
        const newAdWatches = user.adWatches.filter(w => w.date !== today);
        newAdWatches.push({ ...todayWatch, count: newCount });
        
        try {
          const userRef_id = user.id;
          await updateRow('users', userRef_id, {
            mainBalance: adReward,
            totalEarned: adReward,
            adWatches: newAdWatches
          });
          confetti({ particleCount: 50, spread: 60 });
          setMessage({ text: `Ad watched! You earned ৳ ${adReward.toFixed(2)}`, type: 'success' });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${user.id}`);
        }
      }, 5000);
    };

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Ads Earn">Ads Earn</h2>
          </div>
          
          {message && (
            <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              <p className="text-xs font-bold uppercase tracking-widest">{message.text}</p>
            </div>
          )}

          <div className="glass-card text-center py-10 mb-8 border-white/40 shadow-lg">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Today's Progress</p>
            <h3 className="text-4xl font-black text-slate-900 mb-4">{todayWatch.count} / {dailyAdLimit}</h3>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden max-w-[200px] mx-auto">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(todayWatch.count / dailyAdLimit) * 100}%` }}
                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>

          <div className="glass-card border-indigo-500/20 bg-indigo-50/50 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <PlayCircle className="w-6 h-6 text-indigo-600" />
              <h4 className="font-black text-sm text-slate-800 uppercase tracking-widest">Monetag Ads</h4>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Watch short video ads to earn instant rewards. Each ad pays ৳ {adReward.toFixed(2)}. Watch 10 ads to earn ৳ 4.00.</p>
            <div className="space-y-3">
              <button 
                onClick={watchAd}
                disabled={isWatching || todayWatch.count >= dailyAdLimit}
                className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all ${
                  isWatching || todayWatch.count >= dailyAdLimit 
                  ? 'bg-slate-200 text-slate-400' 
                  : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
                }`}
              >
                {isWatching ? 'WATCHING AD...' : todayWatch.count >= dailyAdLimit ? 'LIMIT REACHED' : 'VIEW ADS'}
              </button>
              <a 
                href="https://monetag.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-full py-3 border border-indigo-200 text-indigo-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Visit Ad Network
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-indigo-100">
              <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Earning Rules</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-50">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase">Daily Limit</p>
                    <p className="text-[8px] text-slate-400 font-bold">You can watch up to {dailyAdLimit} ads per day.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-50">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase">Instant Reward</p>
                    <p className="text-[8px] text-slate-400 font-bold">Earn ৳ {adReward.toFixed(2)} for every successful ad view.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AccountActivationView = () => {
    const [isActivating, setIsActivating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleActivate = async () => {
      if (user.mainBalance < activationFee) {
        alert(`Insufficient balance. You need ৳ ${activationFee} to activate.`);
        return;
      }

    await handleSubmission(async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + activationDuration);

      const userRef_id = user.id;
      await updateRow('users', userRef_id, {
        mainBalance: -activationFee,
        isActive: true,
        activationDate: new Date().toISOString(),
        activationExpiry: expiryDate.toISOString(),
        notifications: [
          { 
            id: Date.now().toString(), 
            text: `Account Activated! Your account is now active until ${expiryDate.toLocaleDateString()}.`, 
            date: new Date().toISOString().split('T')[0] 
          },
          ...user.notifications
        ]
      });

      // Referral Bonus on Activation
      if (user.referredBy) {
        const referrerRef_id = user.referredBy;
        const referrerData = await getRow('users', referrerRef_id) as UserProfile | null;
        if (referrerData) {
          await updateRow('users', referrerRef_id, {
            mainBalance: referralActivationBonus,
            totalEarned: referralActivationBonus,
            referralActiveCount: 1,
            notifications: [
              { 
                id: Date.now().toString(), 
                text: `Referral Activation Bonus! You earned ৳ ${referralActivationBonus} from ${user.name}'s activation.`, 
                date: new Date().toISOString().split('T')[0] 
              },
              ...referrerData.notifications
            ]
          });
        }
      }

      setShowSuccess(true);
    }, 'Account activated successfully!');
  };

    if (showSuccess) {
      return (
        <SuccessView 
          title="Account Activated!"
          subtitle="You now have full access to withdrawals"
          onClose={() => setView('home')}
          colorClass="bg-emerald-600"
          details={[
            { label: 'Fee Paid', value: `৳ ${activationFee}` },
            { label: 'Expiry Date', value: new Date(user.activationExpiry).toLocaleDateString() }
          ]}
        />
      );
    }

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Account Activation</h2>
          </div>

          <div className="glass-card border-white/40 shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Activate Your Account</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
              To unlock withdrawal features and earn referral commissions, you must activate your account.
            </p>

            <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activation Fee</span>
                <span className="text-lg font-black text-indigo-600">৳ {activationFee}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validity</span>
                <span className="text-lg font-black text-slate-900">{activationDuration} Days</span>
              </div>
            </div>

            <div className="space-y-4 text-left mb-8">
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Check className="w-3 h-3" />
                </div>
                <p className="text-[10px] font-bold text-slate-600">Unlock Unlimited Withdrawals</p>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Check className="w-3 h-3" />
                </div>
                <p className="text-[10px] font-bold text-slate-600">Earn {referralCommissionRate}% Lifetime Commission from Referrals</p>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Check className="w-3 h-3" />
                </div>
                <p className="text-[10px] font-bold text-slate-600">Priority Support Access</p>
              </div>
            </div>

            <button 
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {isActivating ? 'Activating...' : `ACTIVATE NOW - ৳ ${activationFee}`}
            </button>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-4">Fee will be deducted from your main balance</p>
          </div>
        </div>
      </div>
    );
  };

  const gamingView = (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 pt-12 pb-24 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        
        <div className="relative z-10">
          <button onClick={() => setView('home')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white mb-6 active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Gaming Zone</h1>
          <p className="text-purple-100 text-xs font-bold uppercase tracking-widest opacity-80">Play & Earn Real Money</p>
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => setView('ludo-earn')}
            className="glass-card p-6 flex items-center gap-6 border-white/40 shadow-xl group hover:scale-[1.02] transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ludo Earn</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Tournaments</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="glass-card p-6 flex items-center gap-6 border-white/40 shadow-xl opacity-60 grayscale">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Free Fire</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upcoming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LudoEarnView = () => {
    const [selectedTournament, setSelectedTournament] = useState<LudoTournament | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [ludoUsername, setLudoUsername] = useState('');
    const [ludoTab, setLudoTab] = useState<'all' | 'my' | 'history'>('all');

    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedInfoTournament, setSelectedInfoTournament] = useState<LudoTournament | null>(null);

    const handleJoin = async (tournament: LudoTournament) => {
      if (user.mainBalance < tournament.entryFee) {
        alert('Insufficient balance to join this tournament.');
        return;
      }
      
      if (tournament.currentPlayers >= tournament.maxPlayers) {
        alert('Tournament is full.');
        return;
      }

      if (tournament.playerIds?.includes(user.id)) {
        alert('You have already joined this tournament.');
        return;
      }

      try {
        setIsSubmitting(true);
        const userRef_id = user.id;
        // admin op: ludoTournaments

        await updateRow('users', userRef_id, {
          mainBalance: -tournament.entryFee
        });

        await updateRow('ludoTournaments', tournament.id, {
          currentPlayers: 1,
          playerIds: [...(tournament.playerIds || []), user.id]
        });

        alert('Successfully joined the tournament!');
        setIsSubmitting(false);
      } catch (e) {
        setIsSubmitting(false);
        alert('Error joining tournament.');
      }
    };

    const handleSubmitResult = async () => {
      if (!screenshotUrl || !ludoUsername || !selectedTournament) {
        alert('Please provide all details (Screenshot & Ludo Username).');
        return;
      }

      try {
        setIsSubmitting(true);
        await insertRow('ludoSubmissions', {
          userId: user.id,
          userName: user.name,
          ludoUsername: ludoUsername,
          tournamentId: selectedTournament.id,
          screenshot: screenshotUrl,
          status: 'pending',
          date: new Date().toISOString().split('T')[0],
          timestamp: Date.now()
        });

        alert('Result submitted successfully! Admin will verify soon.');
        setShowSubmitModal(false);
        setScreenshotUrl('');
        setLudoUsername('');
        setIsSubmitting(false);
      } catch (e) {
        setIsSubmitting(false);
        alert('Error submitting result.');
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-rose-600 pt-12 pb-24 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
          <button onClick={() => setView('gaming')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white mb-6 active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Ludo Earn</h1>
          <p className="text-orange-100 text-xs font-bold uppercase tracking-widest opacity-80">Win Big with Ludo</p>
          
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setLudoTab('all')}
              className={`flex-1 min-w-[100px] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                ludoTab === 'all' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white/20 text-white'
              }`}
            >
              All Matches
            </button>
            <button 
              onClick={() => setLudoTab('my')}
              className={`flex-1 min-w-[100px] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                ludoTab === 'my' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white/20 text-white'
              }`}
            >
              My Matches
            </button>
            <button 
              onClick={() => setLudoTab('history')}
              className={`flex-1 min-w-[100px] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                ludoTab === 'history' ? 'bg-white text-orange-600 shadow-lg' : 'bg-white/20 text-white'
              }`}
            >
              History
            </button>
          </div>
        </div>

        <div className="px-6 -mt-12 space-y-4">
          {ludoTab === 'history' ? (
            <div className="space-y-4">
              {ludoSubmissions.filter(s => s.userId === user.id).length === 0 ? (
                <div className="glass-card p-12 text-center border-white/40 shadow-xl">
                  <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No history found</p>
                </div>
              ) : (
                ludoSubmissions.filter(s => s.userId === user.id).map(s => (
                  <div key={s.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                        s.status === 'approved' ? 'bg-emerald-500 shadow-emerald-500/20' :
                        s.status === 'rejected' ? 'bg-rose-500 shadow-rose-500/20' :
                        'bg-amber-500 shadow-amber-500/20'
                      }`}>
                        {s.status === 'approved' ? <Check className="w-6 h-6" /> : 
                         s.status === 'rejected' ? <X className="w-6 h-6" /> : 
                         <Activity className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Match Result</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${
                        s.status === 'approved' ? 'text-emerald-600' :
                        s.status === 'rejected' ? 'text-rose-600' :
                        'text-amber-600'
                      }`}>
                        {s.status}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ludo ID: {s.ludoUsername}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            ludoTournaments.filter(t => ludoTab === 'all' ? true : t.playerIds?.includes(user.id)).length === 0 ? (
            <div className="glass-card p-12 text-center border-white/40 shadow-xl">
              <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No tournaments found</p>
            </div>
          ) : (
            ludoTournaments
              .filter(t => ludoTab === 'all' ? true : t.playerIds?.includes(user.id))
              .map(t => {
                const hasJoined = t.playerIds?.includes(user.id);
                return (
                  <div key={t.id} className="glass-card p-6 border-white/40 shadow-xl space-y-4 relative overflow-hidden">
                    {hasJoined && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest shadow-lg">
                        Joined
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{t.title}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.type === '1vs1' ? '2 Players' : '4 Players'} • {t.status}</p>
                      </div>
                      <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                        ৳ {t.prizePool}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Entry Fee</p>
                        <p className="text-sm font-black text-slate-800">৳ {t.entryFee}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Players</p>
                        <p className="text-sm font-black text-slate-800">{t.currentPlayers}/{t.maxPlayers}</p>
                      </div>
                    </div>

                    {hasJoined && t.roomCode && (
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-bold text-emerald-600 uppercase mb-1">Room Code</p>
                          <p className="text-lg font-black text-emerald-900 tracking-[0.2em]">{t.roomCode}</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(t.roomCode || '');
                            alert('Room Code Copied!');
                          }}
                          className="p-3 bg-white rounded-xl shadow-sm text-emerald-600 active:scale-90 transition-all"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          setSelectedInfoTournament(t);
                          setShowInfoModal(true);
                        }}
                        className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border border-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Match Rules
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {!hasJoined ? (
                        <button 
                          onClick={() => handleJoin(t)}
                          disabled={t.currentPlayers >= t.maxPlayers || t.status !== 'open'}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-rose-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                          Join Tournament
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200"
                        >
                          Already Joined
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedTournament(t);
                          setShowSubmitModal(true);
                        }}
                        className="px-6 bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                        Submit Proof
                      </button>
                    </div>
                  </div>
                );
              })
          ))}
        </div>

        {/* Info Modal */}
        <AnimatePresence>
          {showInfoModal && selectedInfoTournament && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInfoModal(false)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Match Rules</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tournament Details</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {selectedInfoTournament.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match Rules (ম্যাচ নিয়মাবলী)</p>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                      <div className="space-y-2">
                        <p className="text-[10px] text-indigo-900 font-bold leading-relaxed italic">
                          {selectedInfoTournament.rules || "Standard Ludo rules apply."}
                        </p>
                        <div className="pt-2 border-t border-indigo-200/50 space-y-1.5">
                          <p className="text-[9px] text-indigo-700 font-bold flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                            ম্যাচ শুরু হওয়ার ১০ মিনিট আগে রুম কোড দেওয়া হবে।
                          </p>
                          <p className="text-[9px] text-indigo-700 font-bold flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                            গেম শেষ হওয়ার পর স্ক্রিনশট জমা দিতে হবে।
                          </p>
                          <p className="text-[9px] text-indigo-700 font-bold flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                            কোনো প্রকার চিটিং করলে আইডি ব্যান করা হবে।
                          </p>
                          <p className="text-[9px] text-indigo-700 font-bold flex items-center gap-2">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                            সঠিক লুডু ইউজারনেম ব্যবহার করতে হবে।
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Entry Fee</p>
                      <p className="text-xs font-black text-slate-800">৳ {selectedInfoTournament.entryFee}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Prize Pool</p>
                      <p className="text-xs font-black text-emerald-600">৳ {selectedInfoTournament.prizePool}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Got it, Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Submit Modal */}
        <AnimatePresence>
          {showSubmitModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSubmitModal(false)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-rose-600" />
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Submit Win Proof</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Upload your winning screenshot</p>
                
                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Your Ludo Username" 
                      value={ludoUsername}
                      onChange={e => setLudoUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 outline-none focus:border-orange-500 transition-all"
                    />
                  </div>

                  <div className="relative group">
                    <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setScreenshotUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                  {screenshotUrl && (
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-200">
                      <img src={screenshotUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setScreenshotUrl('')} className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleSubmitResult}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Result'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const SmmPanelView = () => {
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [link, setLink] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [showHistory, setShowHistory] = useState(false);

    const services = SMM_SERVICES.filter(s => isAdmin || enabledSmmServices.includes(s.id));

    const currentService = services.find(s => s.id === selectedService);
    const calculatedQuantity = currentService ? Math.floor((amount / currentService.pricePer1k) * 1000) : 0;

    const handleOrder = async () => {
      if (!selectedService || !link || amount <= 0) {
        alert('Please fill all fields');
        return;
      }

      if (user.mainBalance < amount) {
        alert('Insufficient balance');
        return;
      }

      if (currentService && calculatedQuantity < currentService.min) {
        alert(`Minimum order is ${currentService.min} for this service`);
        return;
      }

      try {
        setIsSubmitting(true);
        const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Deduct balance
        const userRef_id = user.id;
        await updateRow('users', userRef_id, {
          mainBalance: -amount
        });

        // Create order
        await insertRow('smmOrders', {
          id: orderId,
          userId: user.id,
          userName: user.name,
          service: currentService?.name || selectedService,
          link,
          amount,
          quantity: calculatedQuantity,
          status: 'pending',
          date: new Date().toLocaleString(),
          timestamp: Date.now()
        });

        alert('Order submitted successfully!');
        setLink('');
        setAmount(0);
        setSelectedService(null);
        setIsSubmitting(false);
        confetti({ particleCount: 100, spread: 70 });
      } catch (e) {
        setIsSubmitting(false);
        handleFirestoreError(e, OperationType.CREATE, 'smmOrders');
      }
    };

    if (showHistory) {
      const myOrders = smmOrders.filter(o => o.userId === user.id);
      return (
        <div className="min-h-screen pb-32 bg-[#F8FAFC]">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setShowHistory(false)} className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Order History</h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Track your growth</p>
              </div>
            </div>
            <div className="space-y-4">
              {myOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                  <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No orders found</p>
                </div>
              ) : (
                myOrders.map(o => (
                  <div key={o.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{o.service}</p>
                          <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase border ${
                            o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                            o.status === 'cancelled' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{o.date}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                            <p className="text-xs font-black text-indigo-600 tracking-tight">৳ {o.amount}</p>
                          </div>
                          <div className="w-px h-6 bg-slate-100" />
                          <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                            <p className="text-xs font-black text-slate-900 tracking-tight">{o.quantity}</p>
                          </div>
                        </div>
                        <p className="text-[8px] text-slate-400 mt-3 font-medium truncate max-w-[200px] bg-slate-50 p-2 rounded-lg border border-slate-100">{o.link}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen pb-32 bg-[#F8FAFC]">
        <div className="p-6 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('subscription-boosting')} className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Growth Engine</h2>
                <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Professional SMM Services</p>
              </div>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm border border-slate-100">
              <History className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {!selectedService ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-indigo-600 rounded-[32px] text-white shadow-xl shadow-indigo-500/20 mb-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">Service Catalog</p>
                  <h3 className="text-xl font-black tracking-tight uppercase">Select Your Boost</h3>
                </div>
                {services.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedService(s.id)}
                    className="bg-white p-5 rounded-[32px] flex items-center gap-5 border border-slate-100 shadow-sm group hover:border-indigo-500 transition-all relative overflow-hidden"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {s.icon}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.name}</h3>
                        <span className="text-[6px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md uppercase tracking-widest border border-indigo-100">{s.tag}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">৳ {s.pricePer1k} <span className="opacity-50">/ 1k</span></p>
                    </div>
                    <div className="ml-auto w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 bg-gradient-to-br ${currentService?.color} rounded-[40px] text-white shadow-2xl relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30">
                      {currentService?.icon}
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/30">
                        ৳ {currentService?.pricePer1k} / 1k
                      </span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-black mb-1 tracking-tighter uppercase">{currentService?.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[8px] opacity-80 font-black uppercase tracking-[0.3em]">Instant Delivery Active</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8">
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Target Destination Link</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="https://facebook.com/post/..." 
                        value={link}
                        onChange={e => setLink(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                      />
                      <Globe className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Investment Amount (৳)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={amount || ''}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xl font-black outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">BDT</span>
                    </div>
                  </div>

                  {amount > 0 && (
                    <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Estimated Growth Result</p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-4xl font-black text-indigo-600 tracking-tighter">{calculatedQuantity.toLocaleString()}</p>
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-2">{currentService?.name.split(' ').pop()}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-4">
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Non-Drop</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Fast Start</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedService(null)}
                      className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
                    >
                      BACK
                    </button>
                    <button 
                      onClick={handleOrder}
                      disabled={isSubmitting || amount <= 0}
                      className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'PROCESSING...' : `CONFIRM ORDER - ৳ ${amount}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SubscriptionBoostingView = () => {
    const [step, setStep] = useState<'list' | 'youtube' | 'telegram' | 'meta' | 'success'>('list');
    const [email, setEmail] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const handleSubscribe = async (type: 'youtube' | 'telegram', price: number) => {
      if (user.mainBalance < price) {
        alert('Insufficient balance');
        return;
      }

      if (type === 'youtube' && !email.trim()) {
        alert('Please enter your email');
        return;
      }

      if (type === 'telegram' && !telegramId.trim()) {
        alert('Please enter your Telegram User ID');
        return;
      }

      await handleSubmission(async () => {
        const newReq: SubscriptionRequest = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          userId: user.id,
          type,
          email: type === 'youtube' ? email : undefined,
          telegramId: type === 'telegram' ? telegramId : undefined,
          price,
          status: 'pending',
          date: new Date().toLocaleString()
        };

        // Deduct balance
        const userRef_id = user.id;
        await updateRow('users', userRef_id, {
          mainBalance: -price
        });

        await insertRow('subscriptionRequests', newReq as any);
        setStep('success');
      }, 'Subscription request submitted successfully!');
    };

    if (showHistory) {
      const myRequests = subscriptionRequests.filter(r => r.userId === user.id);
      return (
        <div className="min-h-screen pb-32 bg-[#F8FAFC]">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setShowHistory(false)} className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sub History</h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Premium Access Log</p>
              </div>
            </div>
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                  <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No history found</p>
                </div>
              ) : (
                myRequests.map(r => (
                  <div key={r.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{r.type} PREMIUM</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{r.date}</p>
                        <p className="text-xs font-black text-indigo-600 mt-3 tracking-tight">৳ {r.price}</p>
                      </div>
                      <span className={`text-[7px] font-black px-3 py-1 rounded-full uppercase border ${
                        r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        r.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    {r.reason && <p className="text-[8px] font-bold text-rose-500 uppercase mt-3 pt-3 border-t border-slate-50">Note: {r.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    if (step === 'youtube') {
      return (
        <div className="min-h-screen pb-32 bg-[#F8FAFC]">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('list')} className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">YouTube Premium</h2>
                <p className="text-[8px] font-bold text-rose-600 uppercase tracking-[0.2em]">Ad-free Experience</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-gradient-to-br from-rose-500 to-rose-700 rounded-[32px] text-white shadow-2xl shadow-rose-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30">
                    <Youtube className="w-8 h-8" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/30">1 Month Access</span>
                </div>
                <h3 className="text-4xl font-black mb-1 tracking-tighter">৳ 55.00</h3>
                <p className="text-[8px] opacity-80 font-black uppercase tracking-[0.3em]">Premium Individual Plan</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50">
                  <h4 className="text-[8px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4">Activation Rules</h4>
                  <ul className="space-y-3">
                    <li className="text-[10px] text-slate-600 font-bold flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      আপনার ইউটিউব ইমেইলটি নিচে দিন।
                    </li>
                    <li className="text-[10px] text-slate-600 font-bold flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      পেমেন্ট সফল হওয়ার ২৪ ঘণ্টার মধ্যে প্রিমিয়াম একটিভ হবে।
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">YouTube Account Email</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="example@gmail.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-black outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner"
                    />
                    <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>

                <button 
                  onClick={() => handleSubscribe('youtube', 55)}
                  disabled={isSubmitting}
                  className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'PROCESSING...' : 'CONFIRM PURCHASE - ৳ 55'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 'telegram') {
      return (
        <div className="min-h-screen pb-32 bg-[#F8FAFC]">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('list')} className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Telegram Premium</h2>
                <p className="text-[8px] font-bold text-sky-600 uppercase tracking-[0.2em]">Exclusive Features</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-[32px] text-white shadow-2xl shadow-sky-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30">
                    <Send className="w-8 h-8" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/30">1 Month Access</span>
                </div>
                <h3 className="text-4xl font-black mb-1 tracking-tighter">৳ 550.00</h3>
                <p className="text-[8px] opacity-80 font-black uppercase tracking-[0.3em]">Premium Subscription</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-sky-50/50 rounded-3xl border border-sky-100/50">
                  <h4 className="text-[8px] font-black text-sky-500 uppercase tracking-[0.3em] mb-4">Activation Rules</h4>
                  <ul className="space-y-3">
                    <li className="text-[10px] text-slate-600 font-bold flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                      Enter your Telegram User ID correctly.
                    </li>
                    <li className="text-[10px] text-slate-600 font-bold flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                      Activation takes up to 24 hours.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Telegram User ID</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789" 
                      value={telegramId}
                      onChange={e => setTelegramId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-black outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
                    />
                    <Smartphone className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>

                <button 
                  onClick={() => handleSubscribe('telegram', 550)}
                  disabled={isSubmitting}
                  className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-sky-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'PROCESSING...' : 'CONFIRM PURCHASE - ৳ 550'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 'meta') {
      return (
        <div className="min-h-screen pb-32 bg-[#F8FAFC]">
          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep('list')} className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Meta Verified</h2>
                <p className="text-[8px] font-bold text-blue-600 uppercase tracking-[0.2em]">Official Verification</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[32px] text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-12 h-12" />
                    <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/30">Official Badge</span>
                </div>
                <h3 className="text-3xl font-black mb-1 tracking-tighter uppercase">Meta Verified</h3>
                <p className="text-[8px] opacity-80 font-black uppercase tracking-[0.3em]">Identity Verification Service</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                  <h4 className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Service Details</h4>
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                    Meta Verified provides account verification with a blue badge, increased account protection, and direct support. 
                    To get Meta Verified through us, please contact our developer directly on Telegram for manual processing.
                  </p>
                </div>

                <a 
                  href="https://t.me/your_devlopar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Send className="w-4 h-4" />
                  CONTACT DEVELOPER
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (step === 'success') {
      return (
        <SuccessView 
          title="Order Placed"
          subtitle="Subscription request sent"
          onClose={() => { setStep('list'); setEmail(''); setTelegramId(''); }}
          colorClass="bg-indigo-600"
          details={[
            { label: 'Status', value: 'Pending Review' },
            { label: 'Time', value: 'Within 24 Hours' }
          ]}
        />
      );
    }

    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Boosting Hub</h2>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-slate-700">
              <History className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(isAdmin || enabledSmmServices.some(s => ['fb-like', 'fb-star', 'fb-follow', 'tg-member', 'tg-view', 'tg-star'].includes(s))) && (
              <button 
                onClick={() => setView('smm-panel')}
                className="glass-card border-white/40 shadow-lg p-6 flex items-center justify-between hover:scale-[1.02] transition-all group bg-gradient-to-br from-indigo-500/5 to-blue-600/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-all">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-900 uppercase">SMM Panel</h3>
                    <p className="text-[10px] text-slate-400 font-bold">FB Likes, Stars, TG Members</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            )}

            {(isAdmin || enabledSmmServices.includes('youtube-premium')) && (
              <button 
                onClick={() => setStep('youtube')}
                className="glass-card border-white/40 shadow-lg p-6 flex items-center justify-between hover:scale-[1.02] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:rotate-6 transition-all">
                    <Youtube className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-900 uppercase">YouTube Premium</h3>
                    <p className="text-[10px] text-slate-400 font-bold">৳ 55.00 / Month</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            )}

            {(isAdmin || enabledSmmServices.includes('telegram-premium')) && (
              <button 
                onClick={() => setStep('telegram')}
                className="glass-card border-white/40 shadow-lg p-6 flex items-center justify-between hover:scale-[1.02] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:rotate-6 transition-all">
                    <Send className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Telegram Premium</h3>
                    <p className="text-[10px] text-slate-400 font-bold">৳ 550.00 / Month</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            )}

            {(isAdmin || enabledSmmServices.includes('meta-verified')) && (
              <button 
                onClick={() => setStep('meta')}
                className="glass-card border-white/40 shadow-lg p-6 flex items-center justify-between hover:scale-[1.02] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-all relative">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-900 uppercase">Meta Verified</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Blue Badge • Identity Verification</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            )}
          </div>

          <div className="mt-8 p-6 glass-card border-indigo-100 bg-indigo-50/30">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-6 h-6 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase">Web Bot By Ara</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mb-6 leading-relaxed">
                Get custom web bots and automation tools developed by Ara. High performance and full admin control.
              </p>
              <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                <RefreshCw className="w-3 h-3" />
                Update Now
              </button>
            </div>
          </div>
        </div>
    );
  };

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
    const [activeAdminTab, setActiveAdminTab] = useState<'gmail' | 'facebook' | 'withdrawals' | 'microjobs' | 'tasks' | 'recharge' | 'drive-requests' | 'drive-offers' | 'products' | 'product-orders' | 'dollar-buy' | 'deposits' | 'users' | 'ludo' | 'smm' | 'news' | 'social' | 'uploads'>('gmail');
    const [isUploading, setIsUploading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [referralSearch, setReferralSearch] = useState('');
    const [balanceAmount, setBalanceAmount] = useState(0);
    const [newUserName, setNewUserName] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [selectedMicrojobs, setSelectedMicrojobs] = useState<string[]>([]);
    const [newNews, setNewNews] = useState({ content: '', imageUrl: '' });

    const postNews = async () => {
      if (!newNews.content.trim()) return;
      try {
        await insertRow('newsPosts', {
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
        // We don't want to scroll to top of page, just ensure the tab content is visible
        // But the user said "fix the jumping to top", so we should probably NOT scroll to top
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
        const userRef_id = userId;
        await updateRow('users', userRef_id, { 
          status, 
          restrictionReason: reason,
          suspensionUntil
        });
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
        for (const u of suspendedUsers) {
          const userRef_id = u.id;
          await updateRow('users', userRef_id, { 
            status: 'active', 
            restrictionReason: '',
            suspensionUntil: ''
          });
          count++;
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
        const userData = await getRow('users', userRef_id) as UserProfile | null;
        if (userData) {
          if (userData.referredBy) {
            const referrerRef_id = userData.referredBy;
            const referrerData = await getRow('users', referrerRef_id) as UserProfile | null;
            if (referrerData) {
              const commission = (amount * referralCommissionRate) / 100;
              if (commission > 0) {
                await updateRow('users', referrerRef_id, {
                  mainBalance: commission,
                  totalEarned: commission,
                  totalCommission: commission,
                  notifications: [
                    { 
                      id: Date.now().toString(), 
                      text: `Referral Commission! You earned ৳ ${commission.toFixed(2)} from ${userData.name}'s ${source}.`, 
                      date: new Date().toISOString().split('T')[0] 
                    },
                    ...referrerData.notifications
                  ]
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
    const [newProduct, setNewProduct] = useState({ name: '', price: 0, description: '', category: '' });

    const saveChanges = async () => {
      try {
        const settingsRef_id = 'global';
        await upsertRow('settings', {
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

        const userRef_id = adminUser.id;
        await upsertRow('users', adminUser);

        confetti({ particleCount: 150, spread: 70 });
        alert('All changes saved and applied successfully!');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'admin/save');
      }
    };

    const handleGmailAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid account' : undefined;
      try {
        // table: gmailSubmissions, id: id
        await updateRow('gmailSubmissions', id, { status: action, reason });
        
        if (action === 'approved') {
          const s = gmailSubmissions.find(s => s.id === id);
          if (s) {
            const reward = s.reward || gmailReward;
            const userRef_id = s.userId;
            const userData = await getRow('users', userRef_id) as UserProfile | null;
            if (userData) {
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + reward,
                totalEarned: userData.totalEarned + reward
              });
              await processReferralCommission(s.userId, reward, 'Gmail Submission');
            }
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
        // table: microjobSubmissions, id: id
        await updateRow('microjobSubmissions', id, { status: action, reason });
        
        if (action === 'approved') {
          const s = microjobSubmissions.find(s => s.id === id);
          if (s) {
            const userRef_id = s.userId;
            const userData = await getRow('users', userRef_id) as UserProfile | null;
            if (userData) {
              // Find the task to get the reward
              const task = dynamicTasks.find(t => t.id === s.microjobId || t.title === s.microjobId);
              const reward = task ? task.reward : 5.00;
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + reward,
                totalEarned: userData.totalEarned + reward
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
        // table: taskSubmissions, id: id
        await updateRow('taskSubmissions', id, { status: action, reason });
        
        if (action === 'approved') {
          const s = taskSubmissions.find(s => s.id === id);
          if (s) {
            const reward = s.reward || 2.00;
            const userRef_id = s.userId;
            const userData = await getRow('users', userRef_id) as UserProfile | null;
            if (userData) {
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + reward,
                totalEarned: userData.totalEarned + reward
              });
              await processReferralCommission(s.userId, reward, 'Task');
            }
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `taskSubmissions/${id}`);
      }
    };

    const handleWithdrawAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Policy violation' : undefined;
      
      try {
        // admin op: withdrawals
        await updateRow('withdrawals', id, { status: action, reason });

        const w = withdrawals.find(w => w.id === id);
        if (w) {
          const userRef_id = w.userId;
          const userData = await getRow('users', userRef_id) as UserProfile | null;
          if (userData) {
            if (action === 'approved') {
              await updateRow('users', userRef_id, {
                pendingPayout: Math.max(0, userData.pendingPayout - w.amount),
                notifications: [
                  { id: Date.now().toString(), text: `Withdrawal Approved: ৳${w.amount}`, date: new Date().toISOString().split('T')[0] },
                  ...userData.notifications
                ]
              });
            } else {
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + w.amount,
                pendingPayout: Math.max(0, userData.pendingPayout - w.amount),
                notifications: [
                  { id: Date.now().toString(), text: `Withdrawal Rejected: ${reason}`, date: new Date().toISOString().split('T')[0] },
                  ...userData.notifications
                ]
              });
            }
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `withdrawals/${id}`);
      }
    };

    const handleRechargeAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid request' : undefined;
      try {
        // admin op: rechargeRequests
        await updateRow('rechargeRequests', id, { status: action, reason });
        
        const r = rechargeRequests.find(r => r.id === id);
        if (r) {
          const userRef_id = r.userId;
          const userData = await getRow('users', userRef_id) as UserProfile | null;
          if (userData) {
            if (action === 'approved') {
              // For deposits, we ADD to balance when approved
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + r.amount,
                totalEarned: userData.totalEarned + r.amount,
                notifications: [
                  { id: Date.now().toString(), text: `Deposit Approved: ৳${r.amount}`, date: new Date().toISOString().split('T')[0] },
                  ...userData.notifications
                ]
              });
            } else {
              // For deposits, if rejected, we just notify
              await updateRow('users', userRef_id, {
                notifications: [
                  { id: Date.now().toString(), text: `Deposit Rejected: ${reason}`, date: new Date().toISOString().split('T')[0] },
                  ...userData.notifications
                ]
              });
            }
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `rechargeRequests/${id}`);
      }
    };

    const handleDriveOfferRequestAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid request' : undefined;
      try {
        // admin op: driveOfferRequests
        await updateRow('driveOfferRequests', id, { status: action, reason });
        
        if (action === 'rejected') {
          const r = driveOfferRequests.find(r => r.id === id);
          if (r) {
            const userRef_id = r.userId;
            const userData = await getRow('users', userRef_id) as UserProfile | null;
            if (userData) {
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + r.amount
              });
            }
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
        // admin op: smmOrders
        await updateRow('smmOrders', id, { status: action });
        
        if (action === 'cancelled') {
          const o = smmOrders.find(o => o.id === id);
          if (o) {
            const userRef_id = o.userId;
            const userData = await getRow('users', userRef_id) as UserProfile | null;
            if (userData) {
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + o.amount,
                notifications: [
                  { id: Date.now().toString(), text: `SMM Order Cancelled: ${reason}. Refunded ৳${o.amount}`, date: new Date().toISOString().split('T')[0] },
                  ...userData.notifications
                ]
              });
            }
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
        // admin op: dollarBuyRequests
        await updateRow('dollarBuyRequests', id, { status: action, reason });
        
        if (action === 'rejected') {
          const r = dollarBuyRequests.find(r => r.id === id);
          if (r) {
            const userRef_id = r.userId;
            const userData = await getRow('users', userRef_id) as UserProfile | null;
            if (userData) {
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + r.price
              });
            }
          }
        }
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `dollarBuyRequests/${id}`);
      }
    };

    const seedSampleProduct = async () => {
      const sample = {
        name: "Premium Smart Watch Z10",
        price: 2450,
        description: "High-quality waterproof smart watch with heart rate monitoring, sleep tracking, and 10-day battery life.",
        category: "Electronics"
      };
      try {
        await insertRow('products', { ...sample, image: '' });
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
        await insertRow('products', { ...newProduct, image: '' });
        setNewProduct({ name: '', price: 0, description: '', category: '' });
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'products');
      }
    };

    const deleteProduct = async (id: string) => {
      if (!confirm('Delete this product?')) return;
      try {
        await deleteRow('products', id);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
      }
    };

    const handleProductOrderAction = async (id: string, action: 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
      const reason = action === 'cancelled' ? prompt('Enter cancellation reason:') || 'Out of stock' : undefined;
      try {
        // admin op: productOrders
        await updateRow('productOrders', id, { status: action, reason });
        
        if (action === 'cancelled') {
          const o = productOrders.find(o => o.id === id);
          if (o) {
            const userRef_id = o.userId;
            const userData = await getRow('users', userRef_id) as UserProfile | null;
            if (userData) {
              await updateRow('users', userRef_id, {
                mainBalance: userData.mainBalance + o.amount
              });
            }
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
        await insertRow('driveOffers', newDriveOffer);
        setNewDriveOffer({ title: '', operator: 'GP', price: 0, description: '' });
        alert('Drive offer added successfully!');
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'driveOffers');
      }
    };

    const deleteDriveOffer = async (id: string) => {
      try {
        await deleteRow('driveOffers', id);
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
        await insertRow('tasks', newTask);
        setNewTask({ title: '', reward: 0, desc: '', link: '', category: 'micro' });
        alert('Task added successfully!');
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'tasks');
      }
    };

    const deleteTask = async (id: string) => {
      try {
        await deleteRow('tasks', id);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `tasks/${id}`);
      }
    };

    const handleSubscriptionAction = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
      try {
        // table: subscriptionRequests, id: id
        await updateRow('subscriptionRequests', id, { status, reason });
        
        const sub = subscriptionRequests.find(r => r.id === id);
        if (sub && status === 'rejected') {
          // Refund balance
          const userRef_id = sub.userId;
          await updateRow('users', userRef_id, {
            mainBalance: sub.price
          });
        }
        
        alert(`Subscription ${status}`);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'subscriptionRequests');
      }
    };

    const handleSocialAction = async (id: string, action: 'approved' | 'rejected') => {
      const reason = action === 'rejected' ? prompt('Enter rejection reason:') || 'Invalid proof' : undefined;
      try {
        // table: socialSubmissions, id: id
        await updateRow('socialSubmissions', id, { status: action, reason });
        
        const s = allSocialSubmissions.find(s => s.id === id);
        if (s && action === 'approved') {
          const userRef_id = s.userId;
          const userData = await getRow('users', userRef_id) as UserProfile | null;
          if (userData) {
            await updateRow('users', userRef_id, {
              notifications: [
                { id: Date.now().toString(), text: `Social Job Approved: ${s.type}`, date: new Date().toISOString().split('T')[0] },
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
        await deleteRow('uploads', id);
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
                  onClick={() => setActiveAdminTab('withdrawals')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-rose-500 hover:bg-rose-50/30"
                >
                  <CreditCard className="w-5 h-5 text-rose-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Withdraw</span>
                </button>
                <button 
                  onClick={() => setActiveAdminTab('recharge')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-blue-500 hover:bg-blue-50/30"
                >
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Recharge</span>
                </button>
                <button 
                  onClick={() => setActiveAdminTab('products')}
                  className="p-4 rounded-2xl border bg-white border-slate-100 text-slate-600 flex flex-col items-center justify-center gap-2 transition-all hover:border-pink-500 hover:bg-pink-50/30"
                >
                  <ShoppingBag className="w-5 h-5 text-pink-500" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-center">Products</span>
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
                        <span className="text-slate-800 font-black">USER_{item.userId.slice(0,4)}</span>
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
                      onClick={() => setAdminUser({...adminUser, mainBalance: adminUser.mainBalance + balanceAmount})}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase"
                    >
                      Add
                    </button>
                    <button 
                      onClick={() => setAdminUser({...adminUser, mainBalance: Math.max(0, adminUser.mainBalance - balanceAmount)})}
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
                        setAdminUser({...adminUser, name: e.target.value});
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
                        setAdminUser({...adminUser, password: e.target.value});
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
                      onChange={e => setAdminUser({...adminUser, email: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-black font-bold outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Age</label>
                    <input 
                      type="number" 
                      value={adminUser.age} 
                      onChange={e => setAdminUser({...adminUser, age: parseInt(e.target.value) || 0})}
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
                      onChange={e => setAdminUser({...adminUser, mainBalance: parseFloat(e.target.value) || 0})}
                      className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-4 text-sm text-emerald-700 font-black outline-none focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Total Earned (৳)</label>
                    <input 
                      type="number" 
                      value={adminUser.totalEarned} 
                      onChange={e => setAdminUser({...adminUser, totalEarned: parseFloat(e.target.value) || 0})}
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
                      onChange={e => setAdminUser({...adminUser, pendingPayout: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-sm text-slate-900 outline-none focus:border-indigo-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Rank</label>
                    <input 
                      type="text" 
                      value={adminUser.rank} 
                      onChange={e => setAdminUser({...adminUser, rank: e.target.value})}
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
                    onClick={() => setAdminUser({...adminUser, isActive: !adminUser.isActive})}
                    className={`w-14 h-7 rounded-full relative transition-all duration-300 ${adminUser.isActive ? 'bg-indigo-500 shadow-md' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${adminUser.isActive ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <button 
                  onClick={async () => {
                    if (confirm(`Are you sure you want to DELETE user ${adminUser.email}? This cannot be undone.`)) {
                      try {
                        await deleteRow('users', adminUser.id);
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
                        className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${
                          adminFeatures.includes(f.id) 
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
                        className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${
                          adminEnabledCards.includes(c.title) 
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
                        className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${
                          adminSmmServices.includes(s.id) 
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
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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
                    onClick={() => setActiveAdminTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 relative ${
                      activeAdminTab === tab.id 
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
                            <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest border ${
                              u.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            }`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest border ${
                              u.status === 'active' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
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
                                  await updateRow('users', userRef_id, { isActive: !u.isActive });
                                  alert(`User ${u.isActive ? 'deactivated' : 'activated'} successfully!`);
                                } catch (e) {
                                  handleFirestoreError(e, OperationType.UPDATE, `users/${u.id}`);
                                }
                              }}
                              className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest text-white shadow-sm active:scale-95 transition-all ${
                                u.isActive ? 'bg-rose-500' : 'bg-emerald-500'
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Image URL (Optional)</label>
                      <input 
                        type="text"
                        value={newNews.imageUrl}
                        onChange={e => setNewNews({ ...newNews, imageUrl: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 outline-none focus:border-indigo-500"
                        placeholder="https://example.com/image.jpg"
                      />
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
                              await deleteRow('newsPosts', post.id);
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
                              onChange={e => setAdminSmmPrices({...adminSmmPrices, [service.id]: parseFloat(e.target.value) || 0})}
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
                                <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase border ${
                                  o.status === 'processing' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
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
                            <button onClick={() => handleWithdrawAction(w.id, 'approved')} className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleWithdrawAction(w.id, 'rejected')} className="p-2 bg-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
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
                            <button onClick={() => handleRechargeAction(r.id, 'approved')} className="p-2 bg-emerald-500/20 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleRechargeAction(r.id, 'rejected')} className="p-2 bg-rose-500/20 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
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
                        <input type="text" placeholder="e.g. Daily Mega Match" id="ludo-title" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Entry Fee (৳)</label>
                        <input type="number" placeholder="50" id="ludo-fee" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Prize Pool (৳)</label>
                        <input type="number" placeholder="90" id="ludo-prize" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Match Type</label>
                        <select id="ludo-type" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none">
                          <option value="1vs1">1vs1 (2 Players)</option>
                          <option value="4player">4 Players</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Rules & Description</label>
                      <textarea placeholder="Enter match rules and details..." id="ludo-desc" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all h-32 resize-none" />
                    </div>

                    <button 
                      onClick={async () => {
                        const title = (document.getElementById('ludo-title') as HTMLInputElement).value;
                        const fee = parseFloat((document.getElementById('ludo-fee') as HTMLInputElement).value);
                        const prize = parseFloat((document.getElementById('ludo-prize') as HTMLInputElement).value);
                        const type = (document.getElementById('ludo-type') as HTMLSelectElement).value;
                        const desc = (document.getElementById('ludo-desc') as HTMLTextAreaElement).value;
                        
                        if (!title || !fee || !prize) return alert('Fill all fields');
                        
                        await insertRow('ludoTournaments', {
                          title, entryFee: fee, prizePool: prize, type, description: desc, rules: 'ম্যাচ শুরু হওয়ার ১০ মিনিট আগে রুম কোড দেওয়া হবে। গেম শেষ হওয়ার পর স্ক্রিনশট জমা দিতে হবে। কোনো প্রকার চিটিং করলে আইডি ব্যান করা হবে। সঠিক লুডু ইউজারনেম ব্যবহার করতে হবে।',
                          status: 'open', maxPlayers: type === '1vs1' ? 2 : 4, currentPlayers: 0, startTime: new Date().toISOString(),
                          playerIds: []
                        });
                        alert('Tournament Created!');
                        (document.getElementById('ludo-title') as HTMLInputElement).value = '';
                        (document.getElementById('ludo-fee') as HTMLInputElement).value = '';
                        (document.getElementById('ludo-prize') as HTMLInputElement).value = '';
                        (document.getElementById('ludo-desc') as HTMLTextAreaElement).value = '';
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
                                <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase border ${
                                  t.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
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
                                await updateRow('ludoTournaments', t.id, { status: e.target.value });
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
                                    await updateRow('ludoTournaments', t.id, { roomCode: e.target.value });
                                  }}
                                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-bold outline-none focus:border-indigo-500"
                                />
                                <button 
                                  onClick={async () => {
                                    if (confirm('Delete this tournament?')) {
                                      await deleteRow('ludoTournaments', t.id);
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
                                  const userRef_id = s.userId;
                                  const userData = await getRow('users', userRef_id) as UserProfile | null;
                                  if (userData) {
                                    await updateRow('users', userRef_id, {
                                      mainBalance: userData.mainBalance + tournament.prizePool,
                                      totalEarned: userData.totalEarned + tournament.prizePool
                                    });
                                  }
                                  await updateRow('ludoSubmissions', s.id, { status: 'approved' });
                                  alert('Submission Approved & Prize Paid!');
                                }}
                                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Approve & Pay
                              </button>
                              <button 
                                onClick={async () => {
                                  await updateRow('ludoSubmissions', s.id, { status: 'rejected' });
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
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="number" 
                        placeholder="Reward (৳)" 
                        value={newTask.reward}
                        onChange={e => setNewTask({...newTask, reward: parseFloat(e.target.value) || 0})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <select 
                        value={newTask.category}
                        onChange={e => setNewTask({...newTask, category: e.target.value as any})}
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
                      onChange={e => setNewTask({...newTask, link: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <textarea 
                      placeholder="Description" 
                      value={newTask.desc}
                      onChange={e => setNewTask({...newTask, desc: e.target.value})}
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
                            <button onClick={() => handleRechargeAction(r.id, 'approved')} className="p-2 bg-emerald-500/20 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleRechargeAction(r.id, 'rejected')} className="p-2 bg-rose-500/20 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X className="w-4 h-4" /></button>
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
                      onChange={e => setNewDriveOffer({...newDriveOffer, title: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="number" 
                        placeholder="Price (৳)" 
                        value={newDriveOffer.price}
                        onChange={e => setNewDriveOffer({...newDriveOffer, price: parseFloat(e.target.value) || 0})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <select 
                        value={newDriveOffer.operator}
                        onChange={e => setNewDriveOffer({...newDriveOffer, operator: e.target.value})}
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
                      onChange={e => setNewDriveOffer({...newDriveOffer, description: e.target.value})}
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
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="number" 
                        placeholder="Price (৳)" 
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <input 
                        type="text" 
                        placeholder="Category" 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <textarea 
                      placeholder="Description" 
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-indigo-500 resize-none"
                      rows={2}
                    />
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
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Product Inventory</h5>
                    <div className="space-y-3">
                      {products.map(p => (
                        <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{p.name}</p>
                              <p className="text-[8px] text-slate-400 uppercase font-bold">৳{p.price}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteProduct(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <X className="w-4 h-4" />
                          </button>
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
              <User className="w-14 h-14 text-indigo-500 group-hover:scale-110 transition-all" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
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
            onClick={() => { supabase.auth.signOut(); setIsLoggedIn(false); setView('login'); }}
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
                const { data: { user: _checkUser } } = await supabase.auth.getUser(); if (_checkUser) {
                  
                  if (_checkUser.email_confirmed_at) {
                    setNeedsEmailVerification(false);
                    setView('home');
                  } else {
                    alert('Email not verified yet. Please check your inbox.');
                  }
                }
              }}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              I HAVE VERIFIED
            </button>
            <button 
              onClick={async () => {
                const { data: { user: _checkUser } } = await supabase.auth.getUser(); if (_checkUser) {
                  await supabase.auth.resend({ type: 'signup', email: _checkUser.email || '' });
                  alert('Verification email resent!');
                }
              }}
              className="w-full py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              RESEND EMAIL
            </button>
            <button 
              onClick={() => {
                supabase.auth.signOut();
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
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${
                    msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'
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

      <AnimatePresence mode="wait">
        {isLoggedIn && user.status !== 'active' && !isAdmin && <RestrictionScreen />}
        {view === 'login' && loginView}
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
      </AnimatePresence>

      {/* Bottom Navigation */}
      {isLoggedIn && (
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
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 ${
                  view === item.id ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600'
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
