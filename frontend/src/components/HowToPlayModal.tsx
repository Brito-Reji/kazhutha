import React, { useState } from 'react';
import { X, HelpCircle, Trophy, Zap, ChevronRight, ChevronLeft, ShieldAlert } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!isOpen) return null;

  const tabs = [
    { title: '🎯 Goal', id: 'goal' },
    { title: '🃏 Matching Suits', id: 'suits' },
    { title: '⚡ The Cut (Kettu)', id: 'cut' },
    { title: '💡 Quick Example', id: 'example' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      {/* modal box */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-lg">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>How to Play Kazhutha</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* tabs nav */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 min-w-[100px] text-xs font-bold py-2 px-2 rounded-lg transition-all text-center whitespace-nowrap ${
                activeTab === idx
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="p-5 overflow-y-auto flex-1 text-sm text-slate-300 space-y-4">
          {/* Tab 0: Goal */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <Trophy className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-400 text-base mb-1">Main Objective</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Empty your hand as fast as possible! The last player remaining with cards loses and becomes the <strong className="text-amber-300">Kazhutha (Donkey 🐴)</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Starting the Game</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 bg-slate-900 border border-slate-700 rounded-lg flex flex-col items-center justify-center font-bold text-slate-100 shadow-md">
                    <span className="text-xs">A</span>
                    <span className="text-lg text-slate-300">♠</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The player holding the <strong className="text-slate-200">Ace of Spades (♠A)</strong> goes first in round 1.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Matching Suits */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">Rule #1: Follow Suit</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The first player in a round plays a card to set the <strong className="text-amber-300">Lead Suit</strong> (e.g. ♠ Spades).
                  On your turn, you <strong className="text-amber-300">MUST</strong> play a card of that same suit if you have one!
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Card Ranks (High to Low)</h4>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs text-amber-400 font-bold justify-center py-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span>A</span> &gt; <span>K</span> &gt; <span>Q</span> &gt; <span>J</span> &gt; <span>10</span> &gt; <span>9</span> &gt; <span>8</span> &gt; <span>7</span> &gt; <span>6</span> &gt; <span>5</span> &gt; <span>4</span> &gt; <span>3</span> &gt; <span>2</span>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  If everyone plays the lead suit, all played cards are discarded, and the highest card holder leads the next round!
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: The Cut */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <Zap className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-400 text-base mb-1">Cutting (Kettu)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If you <strong className="text-red-300">do not have</strong> any cards of the lead suit, you can play <strong className="text-red-300">ANY card</strong> from another suit!
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">The Penalty</h4>
                <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                  <li>
                    When a player cuts, the round ends immediately.
                  </li>
                  <li>
                    The player who played the <strong className="text-amber-300">HIGHEST card of the lead suit</strong> must <strong className="text-red-400">pick up ALL cards</strong> played in that round into their hand!
                  </li>
                  <li>
                    The player who played the cut gets to start the next round.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Quick Example */}
          {activeTab === 3 && (
            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider text-center">
                  Round Example (Lead Suit: Spades ♠)
                </h4>

                <div className="grid grid-cols-3 gap-2 py-2">
                  {/* P1 */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">Player 1</span>
                    <div className="w-8 h-11 bg-slate-950 border border-slate-700 rounded flex flex-col items-center justify-center font-bold text-amber-400 text-xs shadow">
                      <span>K</span>
                      <span className="text-sm">♠</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Lead</span>
                  </div>

                  {/* P2 */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">Player 2</span>
                    <div className="w-8 h-11 bg-slate-950 border border-slate-700 rounded flex flex-col items-center justify-center font-bold text-amber-400 text-xs shadow">
                      <span>7</span>
                      <span className="text-sm">♠</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Followed</span>
                  </div>

                  {/* P3 */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center gap-1 border-red-500/40 bg-red-950/20">
                    <span className="text-[10px] text-red-300 font-bold">Player 3</span>
                    <div className="w-8 h-11 bg-slate-950 border border-red-500/50 rounded flex flex-col items-center justify-center font-bold text-red-400 text-xs shadow">
                      <span>5</span>
                      <span className="text-sm">♥</span>
                    </div>
                    <span className="text-[10px] text-red-400 font-bold">CUT! ⚡</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-amber-400">Result:</p>
                  <p>
                    Player 3 cut with ♥5 because they had no Spades.
                  </p>
                  <p>
                    👉 <strong className="text-slate-100">Player 1</strong> receives all 3 cards because ♠K was the highest Spade played!
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-400">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Tip: Save low cards of suits you lack so you can cut opponents holding high cards!</span>
              </div>
            </div>
          )}
        </div>

        {/* footer nav */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            disabled={activeTab === 0}
            onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="text-xs font-semibold text-slate-500">
            {activeTab + 1} / {tabs.length}
          </span>

          {activeTab < tabs.length - 1 ? (
            <button
              onClick={() => setActiveTab((prev) => Math.min(tabs.length - 1, prev + 1))}
              className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-md"
            >
              Got it!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
