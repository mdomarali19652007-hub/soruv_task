/**
 * AdminView — extracted from src/App.tsx so the function reference is
 * stable across App re-renders. While AdminView lived inside the App
 * function body, every parent re-render (Supabase realtime updates,
 * keystrokes elsewhere on the page, etc.) created a new function
 * reference, which React treated as a different component type and
 * unmounted/remounted the entire admin tree. That wiped out every
 * local input value (active tab, typed Global Notice, balance amount,
 * etc.) on every refresh. See the Admin Panel Audit and Remediation
 * Plan, item 1a.
 *
 * This module is a verbatim move of the original component body. The
 * only change is that values previously captured from the parent App
 * closure are now passed in as props.
 */

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Briefcase, Check, CheckCircle2, CreditCard, DollarSign,
  ExternalLink, Facebook, History, Image as ImageIcon, Loader2, Mail,
  Newspaper, Package, PlusCircle, RefreshCw, Search, ShoppingBag,
  Smartphone, Trash2, Trophy, Upload, User, Users, UserX,
  Wifi, X, Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  adminInsert, adminUpdate, adminDelete, adminUpsert,
  adminIncrement, adminIncrementFields, adminGetRow,
} from '../../lib/admin-api';
import { processWithdrawal, processDeposit } from '../../lib/database';
import { uploadMedia } from '../../lib/upload-media';
import { handleFirestoreError } from '../../utils/db-errors';
import { OperationType } from '../../types';
import type {
  UserProfile, GmailSubmission, MicrojobSubmission, TaskSubmission,
  SubscriptionRequest, RechargeRequest, DriveOffer, DriveOfferRequest,
  Product, ProductOrder, LudoTournament, LudoSubmission, SmmOrder,
  GlobalUpload, NewsPost, DollarBuyRequest, SocialSubmission, View,
} from '../../types';
import { INCOME_CARDS, SMM_SERVICES } from '../../constants';

export interface AdminViewProps {
  // Navigation
  view: View;
  setView: (v: View) => void;
  // Admin's own user
  user: UserProfile;
  // Settings (read for default values; persisted via adminUpsert from inside)
  globalNotice: string;
  isMaintenance: boolean;
  telegramLink: string;
  facebookLink: string;
  whatsappLink: string;
  showWelcomeAnimation: boolean;
  rulesText: string;
  smmPrices: { [key: string]: number };
  minWithdrawal: number;
  withdrawalFee: number;
  dollarBuyRate: number;
  dollarSellRate: number;
  spinCost: number;
  dailyReward: number;
  activeFolders: string[];
  enabledFeatures: string[];
  enabledSmmServices: string[];
  enabledCards: string[];
  adminGen1Rate: number;
  adminGen2Rate: number;
  adminGen3Rate: number;
  activationFee: number;
  rechargeCommissionRate: number;
  activationDuration: number;
  referralCommissionRate: number;
  referralActivationBonus: number;
  totalPaid: number;
  activeWorkerCount: number;
  gmailPassword: string;
  gmailReward: number;
  adReward: number;
  dailyAdLimit: number;
  deliveryFee: number;
  // Live data tables (subscriptions in App)
  allUsers: UserProfile[];
  allSocialSubmissions: SocialSubmission[];
  newsPosts: NewsPost[];
  withdrawals: { id: string; amount: number; receiveAmount?: number; fee?: number; method: string; status: 'pending' | 'approved' | 'rejected'; date: string; reason?: string; userId: string; timestamp: number; [key: string]: unknown }[];
  dollarBuyRequests: DollarBuyRequest[];
  gmailSubmissions: GmailSubmission[];
  microjobSubmissions: MicrojobSubmission[];
  taskSubmissions: TaskSubmission[];
  subscriptionRequests: SubscriptionRequest[];
  rechargeRequests: RechargeRequest[];
  driveOffers: DriveOffer[];
  driveOfferRequests: DriveOfferRequest[];
  products: Product[];
  productOrders: ProductOrder[];
  ludoTournaments: LudoTournament[];
  ludoSubmissions: LudoSubmission[];
  smmOrders: SmmOrder[];
  allUploads: GlobalUpload[];
  dynamicTasks: { id: string; title: string; reward: number; desc: string; link: string; category: 'micro' | 'social' | 'gmail' | 'premium' }[];
  // App-level submission state used by some admin actions
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  setSubmissionProgress: (n: number) => void;
}

export function AdminView(props: AdminViewProps) {
  const {
    view, setView, user,
    globalNotice, isMaintenance, telegramLink, facebookLink, whatsappLink,
    showWelcomeAnimation, rulesText, smmPrices, minWithdrawal, withdrawalFee,
    dollarBuyRate, dollarSellRate, spinCost, dailyReward, activeFolders,
    enabledFeatures, enabledSmmServices, enabledCards,
    adminGen1Rate, adminGen2Rate, adminGen3Rate,
    activationFee, rechargeCommissionRate, activationDuration,
    referralCommissionRate, referralActivationBonus,
    totalPaid, activeWorkerCount,
    gmailPassword, gmailReward, adReward, dailyAdLimit, deliveryFee,
    allUsers, allSocialSubmissions, newsPosts, withdrawals,
    dollarBuyRequests, gmailSubmissions, microjobSubmissions, taskSubmissions,
    subscriptionRequests, rechargeRequests, driveOffers, driveOfferRequests,
    products, productOrders, ludoTournaments, ludoSubmissions, smmOrders,
    allUploads, dynamicTasks,
    isSubmitting, setIsSubmitting, setSubmissionProgress,
  } = props;
  const [adminUser] = useState(user);
  const [notice, setNotice] = useState(globalNotice);
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
  const [activeAdminTab, setActiveAdminTab] = useState<'gmail' | 'facebook' | 'withdrawals' | 'microjobs' | 'tasks' | 'drive-requests' | 'drive-offers' | 'products' | 'product-orders' | 'dollar-buy' | 'deposits' | 'users' | 'ludo' | 'smm' | 'news' | 'social' | 'uploads' | 'subscriptions'>('gmail');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
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
  // Skip the scrollIntoView on the initial mount: the parent App's
  // own `useEffect(() => window.scrollTo(0, 0), [view])` already puts
  // us at the top of the admin page when we navigate in. Without this
  // guard the first render would smooth-scroll down to the tab content
  // (well below the page header), which felt like the page was loading
  // already scrolled to the bottom.
  const didMountAdminTabRef = useRef(false);

  useEffect(() => {
    if (!didMountAdminTabRef.current) {
      didMountAdminTabRef.current = true;
      return;
    }
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
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Fee (৳)</label>
                  <input
                    type="number"
                    value={adminDeliveryFee}
                    onChange={e => setAdminDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-900 font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                <div>
                  <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Maintenance Mode</p>
                  <p className="text-[10px] text-slate-500 mt-1">Lock all application features for non-admins</p>
                </div>
                <button
                  onClick={() => setAdminMaintenance(!adminMaintenance)}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 ${adminMaintenance ? 'bg-rose-500 shadow-md' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${adminMaintenance ? 'right-1' : 'left-1'}`} />
                </button>
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
                  <button
                    onClick={addProduct}
                    className="w-full py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all bg-pink-500 hover:bg-pink-600"
                  >
                    Add Product
                  </button>
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
        </div>
      </div>
    </div>
  );
}
