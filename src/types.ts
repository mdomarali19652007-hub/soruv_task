/**
 * Top-level shared types for the Top Earning / Smart Task SPA.
 *
 * These were previously inline at the top of src/App.tsx. They are
 * extracted here as phase 1 of breaking up the monolith; the runtime
 * behaviour is unchanged -- App.tsx now imports them from here.
 */

// ---------------------------------------------------------------
// DB / listener error plumbing (legacy "Firestore" naming kept
// for backwards compatibility, but the implementation is generic).
// ---------------------------------------------------------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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
  };
}

// Alias for the incremental rename to DB-agnostic naming. Both
// symbols refer to the same shape so call-sites can migrate at
// their own pace.
export type DbErrorInfo = FirestoreErrorInfo;

// ---------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------

export type View =
  | 'login'
  | 'home'
  | 'dashboard'
  | 'referral'
  | 'workstation'
  | 'finance'
  | 'support'
  | 'folder-a'
  | 'folder-b'
  | 'folder-c'
  | 'folder-d'
  | 'leaderboard'
  | 'spin'
  | 'profile'
  | 'salary-sheet'
  | 'admin'
  | 'settings'
  | 'ads-earn'
  | 'mobile-banking'
  | 'otp-buy-sell'
  | 'mobile-recharge'
  | 'drive-offer'
  | 'ecommerce'
  | 'dollar-sell'
  | 'dollar-buy'
  | 'social-hub'
  | 'subscription-boosting'
  | 'account-activation'
  | 'gaming'
  | 'ludo-earn'
  | 'smm-panel'
  | 'top-news'
  | 'social-job'
  | 'reset-password';

// ---------------------------------------------------------------
// Content / catalog types
// ---------------------------------------------------------------

export interface GlobalUpload {
  id: string;
  userId: string;
  userName: string;
  url: string;
  context: string;
  timestamp: number;
  date: string;
}

export interface NewsPost {
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

export interface Product {
  id: string;
  name: string;
  price: number;
  resellPrice?: number;
  profitPerUnit?: number;
  description?: string;
  image: string;
  category?: string;
  variants?: string;
  quantityOptions?: string;
}

// ---------------------------------------------------------------
// Transactional / submission types
// ---------------------------------------------------------------

export interface ProductOrder {
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

export interface SubscriptionRequest {
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

export interface SocialSubmission {
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

export interface GmailSubmission {
  id: string;
  userId: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reward: number;
  reason?: string;
}

export interface MicrojobSubmission {
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

export interface TaskSubmission {
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

export interface RechargeRequest {
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

export interface LudoTournament {
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

export interface LudoSubmission {
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

export interface DriveOffer {
  id: string;
  title: string;
  operator: string;
  price: number;
  description: string;
}

export interface DriveOfferRequest {
  id: string;
  userId: string;
  driveOfferId: string;
  phone: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reason?: string;
}

export interface SmmOrder {
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

export interface DollarBuyRequest {
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

// ---------------------------------------------------------------
// User + messaging
// ---------------------------------------------------------------

export interface UserProfile {
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
  /**
   * DB-backed admin flag. Sourced from `users.isAdmin`; falls back to
   * a short legacy email allowlist server-side for unmigrated deploys.
   */
  isAdmin?: boolean;
}

export interface UserMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  sender: 'user' | 'admin';
  date: string;
}
