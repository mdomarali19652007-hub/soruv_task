/**
 * Ludo tournament screen -- browse open tournaments, join, view rules,
 * and submit a winning screenshot.
 *
 * Phase 7 extraction from src/App.tsx. All writes still go through the
 * legacy updateRow/insertRow helpers so behavior is byte-for-byte the
 * same as before the split.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  History,
  Info,
  Trophy,
  User,
  X,
} from 'lucide-react';
import type { LudoSubmission, LudoTournament, UserProfile, View } from '../../types';

interface Props {
  user: Pick<UserProfile, 'id' | 'name' | 'mainBalance'>;
  setView: (view: View) => void;
  ludoTournaments: LudoTournament[];
  ludoSubmissions: LudoSubmission[];
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
  uploadMedia: (file: File) => Promise<string>;
}

type LudoTab = 'all' | 'my' | 'history';

export function LudoEarnView({
  user,
  setView,
  ludoTournaments,
  ludoSubmissions,
  isSubmitting,
  setIsSubmitting,
  insertRow,
  updateRow,
  uploadMedia,
}: Props) {
  const [selectedTournament, setSelectedTournament] = useState<LudoTournament | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [ludoUsername, setLudoUsername] = useState('');
  const [ludoTab, setLudoTab] = useState<LudoTab>('all');
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

      await updateRow('users', user.id, {
        mainBalance: -tournament.entryFee,
      });

      await updateRow('ludoTournaments', tournament.id, {
        currentPlayers: 1,
        playerIds: [...(tournament.playerIds || []), user.id],
      });

      alert('Successfully joined the tournament!');
      setIsSubmitting(false);
    } catch {
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
        ludoUsername,
        tournamentId: selectedTournament.id,
        screenshot: screenshotUrl,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
      });

      alert('Result submitted successfully! Admin will verify soon.');
      setShowSubmitModal(false);
      setScreenshotUrl('');
      setLudoUsername('');
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
      alert('Error submitting result.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-rose-600 pt-12 pb-24 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <button
          onClick={() => setView('gaming')}
          className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white mb-6 active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
          Ludo Earn
        </h1>
        <p className="text-orange-100 text-xs font-bold uppercase tracking-widest opacity-80">
          Win Big with Ludo
        </p>

        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 no-scrollbar">
          {(['all', 'my', 'history'] as LudoTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setLudoTab(tab)}
              className={`flex-1 min-w-[100px] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                ludoTab === tab ? 'bg-white text-orange-600 shadow-lg' : 'bg-white/20 text-white'
              }`}
            >
              {tab === 'all' ? 'All Matches' : tab === 'my' ? 'My Matches' : 'History'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-4">
        {ludoTab === 'history' ? (
          <div className="space-y-4">
            {ludoSubmissions.filter((s) => s.userId === user.id).length === 0 ? (
              <div className="glass-card p-12 text-center border-white/40 shadow-xl">
                <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  No history found
                </p>
              </div>
            ) : (
              ludoSubmissions
                .filter((s) => s.userId === user.id)
                .map((s) => (
                  <div
                    key={s.id}
                    className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                          s.status === 'approved'
                            ? 'bg-emerald-500 shadow-emerald-500/20'
                            : s.status === 'rejected'
                              ? 'bg-rose-500 shadow-rose-500/20'
                              : 'bg-amber-500 shadow-amber-500/20'
                        }`}
                      >
                        {s.status === 'approved' ? (
                          <Check className="w-6 h-6" />
                        ) : s.status === 'rejected' ? (
                          <X className="w-6 h-6" />
                        ) : (
                          <Activity className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                          Match Result
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          {s.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          s.status === 'approved'
                            ? 'text-emerald-600'
                            : s.status === 'rejected'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                        }`}
                      >
                        {s.status}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        Ludo ID: {s.ludoUsername}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : ludoTournaments.filter((t) => (ludoTab === 'all' ? true : t.playerIds?.includes(user.id)))
            .length === 0 ? (
          <div className="glass-card p-12 text-center border-white/40 shadow-xl">
            <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              No tournaments found
            </p>
          </div>
        ) : (
          ludoTournaments
            .filter((t) => (ludoTab === 'all' ? true : t.playerIds?.includes(user.id)))
            .map((t) => {
              const hasJoined = t.playerIds?.includes(user.id);
              return (
                <div
                  key={t.id}
                  className="glass-card p-6 border-white/40 shadow-xl space-y-4 relative overflow-hidden"
                >
                  {hasJoined && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest shadow-lg">
                      Joined
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                        {t.title}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {t.type === '1vs1' ? '2 Players' : '4 Players'} • {t.status}
                      </p>
                    </div>
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                      ৳ {t.prizePool}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">
                        Entry Fee
                      </p>
                      <p className="text-sm font-black text-slate-800">৳ {t.entryFee}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Players</p>
                      <p className="text-sm font-black text-slate-800">
                        {t.currentPlayers}/{t.maxPlayers}
                      </p>
                    </div>
                  </div>

                  {hasJoined && t.roomCode && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-bold text-emerald-600 uppercase mb-1">
                          Room Code
                        </p>
                        <p className="text-lg font-black text-emerald-900 tracking-[0.2em]">
                          {t.roomCode}
                        </p>
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
        )}
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
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                    Match Rules
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    Tournament Details
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Description
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {selectedInfoTournament.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Match Rules (ম্যাচ নিয়মাবলী)
                  </p>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <div className="space-y-2">
                      <p className="text-[10px] text-indigo-900 font-bold leading-relaxed italic">
                        {selectedInfoTournament.rules || 'Standard Ludo rules apply.'}
                      </p>
                      <div className="pt-2 border-t border-indigo-200/50 space-y-1.5">
                        <p className="text-[9px] text-indigo-700 font-bold flex items-center gap-2">
                          <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                          ম্যাচ শুরু হওয়ার ১০ মিনিট আগে রুম কোড দেওয়া হবে।
                        </p>
                        <p className="text-[9px] text-indigo-700 font-bold flex items-center gap-2">
                          <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                          গেম শেষ হওয়ার পর স্ক্রিনশট জমা দিতে হবে।
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
                    <p className="text-xs font-black text-slate-800">
                      ৳ {selectedInfoTournament.entryFee}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[7px] font-black text-slate-400 uppercase mb-1">
                      Prize Pool
                    </p>
                    <p className="text-xs font-black text-emerald-600">
                      ৳ {selectedInfoTournament.prizePool}
                    </p>
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
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
                Submit Win Proof
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                Upload your winning screenshot
              </p>

              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Your Ludo Username"
                    value={ludoUsername}
                    onChange={(e) => setLudoUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-12 text-sm text-slate-900 outline-none focus:border-orange-500 transition-all"
                  />
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="ludo-screenshot-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadMedia(file);
                        setScreenshotUrl(url);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Upload failed');
                      }
                    }}
                  />
                  <label
                    htmlFor="ludo-screenshot-upload"
                    className="w-full flex items-center justify-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-orange-500 transition-all"
                  >
                    {screenshotUrl ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">
                          Screenshot Uploaded
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Upload Screenshot
                        </span>
                      </div>
                    )}
                  </label>
                </div>
                {screenshotUrl && (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-200">
                    <img
                      src={screenshotUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setScreenshotUrl('')}
                      className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg"
                    >
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
}
