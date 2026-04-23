/**
 * Work Station landing -- routes into the four folder feature modules
 * (Micro Freelancing, Social Media Marketing, Digital Asset Trading,
 * Team Management). Folder activation is still controlled by the admin
 * `activeFolders` toggle, overridable for admins.
 *
 * Phase 9 extraction from src/App.tsx. Companion to the FolderA/B/C/D
 * modules extracted in earlier phases.
 */

import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, FolderOpen, ShieldCheck } from 'lucide-react';
import type { View } from '../../types';

interface Props {
  setView: (view: View) => void;
  activeFolders: string[];
  isAdmin: boolean;
}

const FOLDERS = [
  {
    id: 'folder-a',
    title: 'Micro Freelancing',
    desc: 'Small tasks, big rewards. Complete simple web jobs.',
    count: '142 Jobs',
    color: 'from-indigo-400 to-violet-600',
  },
  {
    id: 'folder-b',
    title: 'Social Media Marketing',
    desc: 'Like, follow, and share to earn instantly.',
    count: '89 Jobs',
    color: 'from-pink-400 to-rose-500',
  },
  {
    id: 'folder-c',
    title: 'Digital Asset Trading',
    desc: 'Buy and sell accounts, domains, and more.',
    count: '24 Assets',
    color: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'folder-d',
    title: 'Team Management',
    desc: 'Manage your network and collect bonuses.',
    count: 'Active',
    color: 'from-purple-400 to-indigo-600',
  },
];

export function WorkStationView({ setView, activeFolders, isAdmin }: Props) {
  return (
    <div className="min-h-screen pb-32">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView('home')}
            className="p-3 glass rounded-2xl text-slate-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2
            className="text-2xl font-black neon-text text-slate-900 glitch-text"
            data-text="Work Station"
          >
            Work Station
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {FOLDERS.map((item, i) => {
            const locked = !activeFolders.includes(item.id) && !isAdmin;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView(item.id as View)}
                className={`glass-card text-left relative overflow-hidden group border-white/40 shadow-lg ${
                  locked ? 'opacity-50 grayscale cursor-not-allowed' : ''
                }`}
                disabled={locked}
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${item.color} opacity-5 group-hover:opacity-10 transition-all`}
                />
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        {item.count}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[80%]">
                      {item.desc}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </div>
                </div>
                {locked && (
                  <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center">
                    <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase">
                      Locked by Admin
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
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
}
