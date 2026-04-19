/**
 * Support uplink (live chat with admin).
 *
 * Phase 5 extraction from src/App.tsx. Posts into `messages` and
 * renders the logged-in user's thread pulled from the provided
 * `userMessages` array.
 */

import { useState } from 'react';
import { ArrowLeft, MessageCircle, MessageSquare, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserMessage, UserProfile, View } from '../../types';
import { OperationType } from '../../types';
import { handleDbError } from '../../utils/db-errors';

interface Props {
  user: Pick<UserProfile, 'id' | 'name'>;
  setView: (view: View) => void;
  userMessages: UserMessage[];
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  telegramLink?: string;
  whatsappLink?: string;
}

export function SupportView({
  user,
  setView,
  userMessages,
  insertRow,
  telegramLink = 'https://t.me/smarttask_support',
  whatsappLink = 'https://wa.me/8801700000000',
}: Props) {
  const [msg, setMsg] = useState('');
  const myMessages = userMessages.filter((m) => m.userId === user.id);

  const sendMessage = async () => {
    if (!msg.trim()) return;
    try {
      await insertRow('messages', {
        userId: user.id,
        userName: user.name,
        text: msg,
        sender: 'user',
        date: new Date().toLocaleTimeString(),
      });
      setMsg('');
      confetti({ particleCount: 20, spread: 30 });
    } catch (e) {
      handleDbError(e, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="min-h-screen pb-32 flex flex-col">
      <div className="p-6 pt-12 relative z-10 flex-shrink-0">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setView('home')}
            className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Support Uplink">
            Support Uplink
          </h2>
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
              href={telegramLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600/10 text-indigo-600 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600/20 transition-all"
            >
              <Send className="w-3 h-3" />
              Telegram
            </a>
            <a
              href={whatsappLink}
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
          myMessages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-4 rounded-2xl border transition-all ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border-indigo-500/30 text-slate-900 rounded-tr-none shadow-md'
                    : 'bg-white border-slate-100 text-slate-600 rounded-tl-none shadow-sm'
                }`}
              >
                <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                <p
                  className={`text-[8px] mt-2 font-black uppercase tracking-tighter ${
                    m.sender === 'user' ? 'text-indigo-600/60' : 'text-slate-400'
                  }`}
                >
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
            onChange={(e) => setMsg(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
}
