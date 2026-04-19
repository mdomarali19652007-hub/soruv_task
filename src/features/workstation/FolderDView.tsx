/**
 * Team Stats / Network Marketing folder (category = 'premium').
 *
 * Phase 5 extraction from src/App.tsx. Unlike the other folder views,
 * this one does not write any submission; "Confirm Claim" just moves
 * the local step machine to 'success' and displays the reward summary.
 * Preserved verbatim from the original monolith.
 */

import { useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import type { View } from '../../types';
import type { DynamicTask } from './FolderAView';

interface Props {
  setView: (view: View) => void;
  dynamicTasks: DynamicTask[];
  adReward: number;
}

interface GenerationRow {
  gen: string;
  count: number;
  rate: string;
  total: string;
  color: string;
}

export function FolderDView({ setView, dynamicTasks, adReward }: Props) {
  const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
  const [selectedTask, setSelectedTask] = useState<DynamicTask | null>(null);

  const generations: GenerationRow[] = [
    { gen: '1st Generation', count: 0, rate: `৳ ${adReward.toFixed(2)}`, total: '৳ 0.00', color: 'indigo' },
    { gen: '2nd Generation', count: 0, rate: `৳ ${(adReward / 4).toFixed(2)}`, total: '৳ 0.00', color: 'violet' },
    { gen: '3rd Generation', count: 0, rate: `৳ ${(adReward / 10).toFixed(2)}`, total: '৳ 0.00', color: 'pink' },
  ];

  if (step === 'success') {
    return (
      <SuccessView
        title="Claim Successful"
        subtitle="Premium job logged"
        onClose={() => setStep('list')}
        colorClass="bg-indigo-600"
        details={[
          { label: 'Job', value: selectedTask?.title ?? '' },
          { label: 'Reward', value: `৳ ${selectedTask?.reward.toFixed(2) ?? '0.00'}`, color: 'text-indigo-600' },
          { label: 'Status', value: 'Pending Review' },
        ]}
      />
    );
  }

  if (step === 'submit') {
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('list')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Claim Premium</h2>
          </div>
          <div className="glass-card space-y-6 border-white/40 shadow-lg">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h4 className="text-sm font-black text-indigo-900 mb-1">{selectedTask?.title}</h4>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">
                Reward: ৳ {selectedTask?.reward.toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              By claiming this premium job, you agree to the terms of the network marketing program.
            </p>
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
          <button
            onClick={() => setView('workstation')}
            className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Team Stats">
            Team Stats
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 mb-8">
          {generations.map((item, i) => (
            <div key={i} className="glass-card flex justify-between items-center border-white/40 shadow-sm">
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-1">{item.gen}</h4>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full bg-${item.color}-500 animate-pulse`} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {item.count} Active Workers
                  </p>
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
          {dynamicTasks.filter((t) => t.category === 'premium').length === 0 ? (
            <div className="text-center py-20 glass-card border-dashed border-slate-200 bg-indigo-50/30">
              <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">No premium jobs active</p>
            </div>
          ) : (
            dynamicTasks
              .filter((t) => t.category === 'premium')
              .map((task, i) => (
                <div
                  key={i}
                  className="glass-card flex justify-between items-center border-white/40 shadow-lg bg-gradient-to-br from-white to-indigo-50/30"
                >
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
                      onClick={() => {
                        if (task.link) window.open(task.link, '_blank');
                        setSelectedTask(task);
                        setStep('submit');
                      }}
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
}
