'use client';

import { useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Image as ImageIcon, 
  Package, 
  Maximize, 
  ChevronDown,
  MoreVertical,
  Zap,
  Layout
} from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export default function CampaignsPage() {
  const { themeMode } = useTheme();

  const cardClass = useMemo(() => 
    `rounded-[24px] border transition-all duration-300 ${
      themeMode === 'light' 
        ? 'border-slate-200 bg-white shadow-sm' 
        : 'border-slate-800/80 bg-slate-900/40 shadow-inner'
    }`, [themeMode]);

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ${themeMode === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-5xl font-black tracking-tighter italic font-serif mb-2">Campaigns</h1>
        <p className={`text-sm ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
          Start from our suggestions or prompt to create a new campaign.
        </p>
      </div>

      {/* Generator Prompt Section */}
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-[32px] border p-6 transition-all shadow-2xl ${
            themeMode === 'light' 
                ? 'bg-white border-slate-200 shadow-indigo-500/5' 
                : 'bg-slate-950 border-slate-800 shadow-cyan-500/10'
        }`}>
            <textarea 
                className={`w-full h-24 bg-transparent border-0 focus:ring-0 text-xl font-medium resize-none placeholder-slate-500 ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                }`}
                placeholder="Describe the campaign you want to create..."
            />
            
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100/10">
                <div className="flex items-center gap-2">
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                        themeMode === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'
                    }`}>
                        <Package size={16} />
                        Product
                    </button>
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                        themeMode === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'
                    }`}>
                        <ImageIcon size={16} />
                        Images
                    </button>
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                        themeMode === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'
                    }`}>
                        <Maximize size={16} />
                        Aspect Ratio
                        <ChevronDown size={14} />
                    </button>
                </div>
                
                <button className={`flex items-center gap-2 px-8 py-3 rounded-full bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 transition-all`}>
                    <Sparkles size={16} />
                    Generate Ideas
                </button>
            </div>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest">
            Pomelli AI can make mistakes, so double-check it.
        </p>
      </div>

      {/* Suggestions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>
                <Zap size={18} className="text-indigo-500" />
                Suggestions based on Business DNA
            </h3>
            <button className="text-xs font-bold text-indigo-500 hover:underline">View All Suggestions</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
                { title: "Scale without the burnout.", desc: "Addressing the mental fatigue and operational burnout caused by managing fragmented agency systems.", img: "https://picsum.photos/seed/1/400/600" },
                { title: "Scale sustainable digital ecosystems.", desc: "Leveraging World Environment Day to metaphorically link the brand's 'Tree' identity with sustainable growth.", img: "https://picsum.photos/seed/2/400/600" },
                { title: "Automate your React delivery.", desc: "Highlighting the efficiency of white-labeled multi-tenant architecture to eliminate manual deployment.", img: "https://picsum.photos/seed/3/400/600" }
            ].map((card, i) => (
                <div key={i} className={`${cardClass} overflow-hidden group hover:border-indigo-500 transition-all cursor-pointer`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-slate-900">
                        <img src={card.img} alt={card.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                            <MoreVertical size={18} />
                        </button>
                        
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-2">
                                <Layout size={12} /> Social Media Ad
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">{card.title}</h4>
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{card.desc}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Drafts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Your Drafts</h3>
            <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors">
                <Plus size={14} /> New Draft
            </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[4, 5, 6].map(i => (
                <div key={i} className={`aspect-square rounded-2xl border flex items-center justify-center ${
                    themeMode === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900/50 border-slate-800'
                }`}>
                    <ImageIcon size={24} className="text-slate-300" />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
