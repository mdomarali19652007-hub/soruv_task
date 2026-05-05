/**
 * Account activation flow -- one-time fee that unlocks withdrawals
 * and referral commissions.
 *
 * Phase 2 extraction out of src/App.tsx. The original relied on a
 * `handleSubmission` helper defined inline in the monolith (which
 * orchestrates the submission loader + success messaging). That helper
 * is now passed in as a prop so this feature module stays agnostic
 * of the outer shell.
 */

import { useState } from 'react';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { activateAccount } from '../../lib/database';
import { SuccessView } from '../../components/SuccessView';
import type { UserProfile, View } from '../../types';
import { useFeedback } from '../../components/feedback/FeedbackProvider';

interface Props {
  user: Pick<UserProfile, 'id' | 'mainBalance' | 'activationExpiry'>;
  setView: (view: View) => void;
  activationFee: number;
  activationDuration: number;
  referralCommissionRate: number;
  /**
   * Wraps an async submission with the app-wide loader + toast behaviour.
   * Mirrors the helper that lives in src/App.tsx.
   */
  handleSubmission: (action: () => Promise<void>, successMsg: string) => Promise<void>;
}

export function AccountActivationView({
  user,
  setView,
  activationFee,
  activationDuration,
  referralCommissionRate,
  handleSubmission,
}: Props) {
  const fb = useFeedback();
  // Preserved from the original (setter was unused; kept to match behaviour).
  const [isActivating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleActivate = async () => {
    if (user.mainBalance < activationFee) {
      fb.showToast(`Insufficient balance. You need ৳ ${activationFee} to activate.`, 'error');
      return;
    }

    await handleSubmission(async () => {
      await activateAccount(user.id);
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
          { label: 'Expiry Date', value: new Date(user.activationExpiry).toLocaleDateString() },
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
              <p className="text-[10px] font-bold text-slate-600">
                Earn {referralCommissionRate}% Lifetime Commission from Referrals
              </p>
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
}
