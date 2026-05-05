/**
 * WithdrawView — competitor-aligned discrete withdraw screen.
 *
 * Extracted from `FinanceView` so the Wallet tab can stay a slim
 * dashboard. Re-uses the same `submitWithdrawal` RPC + validation
 * rules, just laid out as a focused single-purpose form.
 *
 * Layout (top -> bottom):
 *   - "View History" link card -> opens `withdraw-history`
 *   - solid indigo balance card
 *   - WITHDRAWAL REQUEST form (method dropdown, type dropdown, account
 *     number, amount, password, summary, submit)
 *   - footer pill explaining the processing window
 */
import { useState, type ReactNode } from 'react';
import { ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import { isValidMobileWallet, sanitizeAccountNumber } from '../../utils/sanitize';
import { TopHeader } from '../../components/ui';
import type { UserProfile, View } from '../../types';
import type { WithdrawalRecord } from '../finance/FinanceView';

type Method = 'bKash' | 'Nagad' | 'Rocket';
type RecipientType = 'Personal' | 'Agent';

interface Props {
  user: Pick<UserProfile, 'id' | 'isActive' | 'mainBalance'>;
  setView: (view: View) => void;
  minWithdrawal: number;
  withdrawalFee: number;
  isSubmitting: boolean;
  handleSubmission: (action: () => Promise<void>, successMsg?: string) => Promise<void>;
  submitWithdrawal: (
    userId: string,
    amount: number,
    method: string,
    accountNumber: string,
  ) => Promise<unknown>;
  setLastWithdrawal: (record: WithdrawalRecord | null) => void;
  setFinanceStep: (step: 'form' | 'success' | 'deposit' | 'deposit-success') => void;
  onOpenSidebar?: () => void;
}

export function WithdrawView({
  user,
  setView,
  minWithdrawal,
  withdrawalFee,
  isSubmitting,
  handleSubmission,
  submitWithdrawal,
  setLastWithdrawal,
  setFinanceStep,
  onOpenSidebar,
}: Props) {
  const [method, setMethod] = useState<Method>('bKash');
  const [type, setType] = useState<RecipientType>('Personal');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const numericAmount = parseFloat(amount) || 0;
  const fee = (numericAmount * withdrawalFee) / 100;
  const total = numericAmount + 0; // service charge is taken from the amount; total deduction == amount.
  const receive = numericAmount - fee;

  const submit = async () => {
    setError('');
    if (!user.isActive) {
      setError('আপনার অ্যাকাউন্ট অ্যাক্টিভ নয়। উইথড্র করতে আগে অ্যাকাউন্ট অ্যাক্টিভ করুন।');
      setView('account-activation');
      return;
    }
    if (!numericAmount || numericAmount < minWithdrawal) {
      setError(`সর্বনিম্ন উইথড্র ৳ ${minWithdrawal}`);
      return;
    }
    if (numericAmount > user.mainBalance) {
      setError('পর্যাপ্ত ব্যালেন্স নেই');
      return;
    }
    const sanitized = sanitizeAccountNumber(accountNumber);
    if (!sanitized || !isValidMobileWallet(sanitized)) {
      setError('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন');
      return;
    }
    if (!password || password.length < 4) {
      setError('পাসওয়ার্ড দিন');
      return;
    }

    await handleSubmission(async () => {
      await submitWithdrawal(user.id, numericAmount, method, sanitized);
      setLastWithdrawal({
        userId: user.id,
        amount: numericAmount,
        receiveAmount: receive,
        fee,
        method: `${method} (${sanitized}) — ${type}`,
        status: 'pending',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      });
      setAmount('');
      setAccountNumber('');
      setPassword('');
      setFinanceStep('success');
      setView('finance');
    });
  };

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="উইথড্র রিকোয়েস্ট"
        showBack
        onBack={() => setView('finance')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Top link to history */}
        <button
          type="button"
          onClick={() => setView('withdraw-history')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white inline-flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <span className="flex-1 text-left">
            <span className="block text-sm font-semibold text-slate-900">উইথড্র হিস্ট্রি দেখুন</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              আপনার আগের রিকোয়েস্ট ও তাদের স্ট্যাটাস
            </span>
          </span>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Balance card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-5 shadow-[0_16px_36px_-12px_rgba(99,102,241,0.55)]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-100/80">
            উপলব্ধ ব্যালেন্স
          </p>
          <p className="text-3xl font-bold tabular-nums mt-1">
            ৳ {user.mainBalance.toFixed(2)}
          </p>
        </div>

        {/* Form section */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
              WITHDRAWAL REQUEST
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              নিচের তথ্য সঠিকভাবে পূরণ করুন।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="পেমেন্ট মেথড"
              value={method}
              onChange={(v) => setMethod(v as Method)}
              options={[
                { value: 'bKash', label: 'bKash' },
                { value: 'Nagad', label: 'Nagad' },
                { value: 'Rocket', label: 'Rocket' },
              ]}
            />
            <FormSelect
              label="অ্যাকাউন্ট টাইপ"
              value={type}
              onChange={(v) => setType(v as RecipientType)}
              options={[
                { value: 'Personal', label: 'Personal' },
                { value: 'Agent', label: 'Agent' },
              ]}
            />
          </div>

          <FormInput
            label="রিসিপিয়েন্ট নম্বর"
            type="tel"
            placeholder="০১XXXXXXXXX"
            value={accountNumber}
            onChange={setAccountNumber}
          />
          <FormInput
            label={`উইথড্র অ্যামাউন্ট (সর্বনিম্ন ৳ ${minWithdrawal})`}
            type="number"
            placeholder={`Min ৳ ${minWithdrawal}`}
            value={amount}
            onChange={setAmount}
            prefix="৳"
          />
          <FormInput
            label="পাসওয়ার্ড"
            type="password"
            placeholder="আপনার পাসওয়ার্ড"
            value={password}
            onChange={setPassword}
            icon={<Lock className="w-4 h-4 text-slate-400" />}
          />

          {/* Summary */}
          {numericAmount > 0 && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-[12px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">সার্ভিস চার্জ ({withdrawalFee}%)</span>
                <span className="font-semibold text-rose-600 tabular-nums">
                  ৳ {fee.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">আপনি পাবেন</span>
                <span className="font-semibold text-emerald-600 tabular-nums">
                  ৳ {Math.max(0, receive).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-indigo-100">
                <span className="font-semibold text-slate-800">মোট কর্তন</span>
                <span className="font-bold text-indigo-700 tabular-nums">
                  ৳ {total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.99] transition-all"
          >
            {isSubmitting ? 'প্রসেস হচ্ছে...' : 'কনফার্ম উইথড্র'}
          </button>

          <p className="text-center text-[11px] text-slate-500 bg-slate-50 rounded-full py-2 px-3">
            পেমেন্ট ৩-৫ কর্মদিবসের মধ্যে প্রসেস হবে
          </p>
        </section>
      </main>
    </div>
  );
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function FormSelect({ label, value, onChange, options }: FormSelectProps) {
  return (
    <label className="block text-[11px] font-semibold text-slate-600">
      <span className="block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  icon?: ReactNode;
}

function FormInput({ label, value, onChange, placeholder, type = 'text', prefix, icon }: FormInputProps) {
  return (
    <label className="block text-[11px] font-semibold text-slate-600">
      <span className="block mb-1">{label}</span>
      <span className="relative block">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            {prefix}
          </span>
        )}
        {icon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all ${prefix ? 'pl-7' : 'pl-3'} ${icon ? 'pr-9' : 'pr-3'}`}
        />
      </span>
    </label>
  );
}
