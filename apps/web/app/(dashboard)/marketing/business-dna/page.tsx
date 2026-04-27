'use client';

import { useMemo, useState, useRef } from 'react';
import { 
  Dna, 
  Palette, 
  Type, 
  Tag, 
  Sparkles, 
  Target, 
  MessageSquare,
  Upload,
  RefreshCw,
  Camera,
  Edit2,
  Check,
  Plus,
  X,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export default function BusinessDnaPage() {
  const { themeMode } = useTheme();
  
  // Brand States
  const [brandName, setBrandName] = useState("KalpTree");
  const [isEditingBrandName, setIsEditingBrandName] = useState(false);
  const [tagline, setTagline] = useState("Plant the seed of your digital future.");
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  
  // Lists
  const [activeValues, setActiveValues] = useState(['Scalability', 'Technological Empowerment', 'Infinite Growth', 'Structural Reliability']);
  const [fonts, setFonts] = useState([
    { name: 'Fraunces', family: 'font-serif' },
    { name: 'Outfit', family: 'font-sans' }
  ]);
  const [colors, setColors] = useState(['#020617', '#ffffff', '#ec4899', '#3b82f6', '#94a3b8']);
  const [brandImages, setBrandImages] = useState([1, 2, 3, 4, 5, 6]);

  // Upload Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const altLogoInputRef = useRef<HTMLInputElement>(null);
  const brandImageInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [activeModal, setActiveModal] = useState<'fonts' | 'colors' | 'value' | null>(null);

  const cardClass = useMemo(() => 
    `rounded-[24px] border transition-all duration-300 ${
      themeMode === 'light' 
        ? 'border-slate-200 bg-white shadow-sm hover:shadow-md' 
        : 'border-slate-800/80 bg-slate-900/40 shadow-inner hover:border-slate-700'
    }`, [themeMode]);

  const handleAddValue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newVal = formData.get('value') as string;
    if (newVal && !activeValues.includes(newVal)) {
        setActiveValues([...activeValues, newVal]);
    }
    setActiveModal(null);
  };

  const handleFileUpload = (type: 'logo' | 'alt' | 'brand') => {
    if (type === 'logo') logoInputRef.current?.click();
    if (type === 'alt') altLogoInputRef.current?.click();
    if (type === 'brand') brandImageInputRef.current?.click();
  };

  return (
    <div className={`space-y-8 animate-in fade-in duration-700 ${themeMode === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* Hidden Inputs */}
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" />
      <input type="file" ref={altLogoInputRef} className="hidden" accept="image/*" />
      <input type="file" ref={brandImageInputRef} className="hidden" accept="image/*" onChange={() => setBrandImages([...brandImages, Date.now()])} />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto py-4">
        <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-2xl ${themeMode === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                <Dna size={32} />
            </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Your Business DNA</h1>
        <p className={`text-sm ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
          This is a snapshot of your business that we'll use to create consistent social media campaigns and brand experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Identity */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`${cardClass} p-8 relative group`}>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="shrink-0 relative group/logo cursor-pointer" onClick={() => handleFileUpload('logo')}>
                    <div className={`w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                        themeMode === 'light' ? 'bg-slate-50 border-slate-200 group-hover/logo:border-indigo-400' : 'bg-slate-950 border-slate-800 group-hover/logo:border-cyan-400'
                    }`}>
                        <img 
                          src="/img/img.svg" 
                          alt="Logo" 
                          className="w-20 h-20 object-contain grayscale opacity-50 group-hover/logo:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-center mt-2 uppercase tracking-widest text-slate-500">Change Logo</div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      {isEditingBrandName ? (
                        <input 
                          autoFocus
                          className="text-3xl font-black bg-transparent border-b-2 border-indigo-500 outline-none w-full"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          onBlur={() => setIsEditingBrandName(false)}
                        />
                      ) : (
                        <h2 className="text-3xl font-black cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setIsEditingBrandName(true)}>
                          {brandName}
                        </h2>
                      )}
                      <button onClick={() => setIsEditingBrandName(!isEditingBrandName)} className="text-slate-400 hover:text-indigo-500 transition-colors">
                        {isEditingBrandName ? <Check size={18} /> : <Edit2 size={16} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
                        <Tag size={12} />
                        https://kalptree.xyz/
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div 
                            onClick={() => setActiveModal('fonts')}
                            className={`p-4 rounded-xl border group/picker cursor-pointer transition-all ${themeMode === 'light' ? 'bg-slate-50 border-slate-100 hover:border-indigo-200 shadow-sm' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                                  <Type size={12} /> Typography
                              </div>
                              <Edit2 size={12} className="opacity-0 group-hover/picker:opacity-100 transition-opacity" />
                            </div>
                            <div className="space-y-2">
                                {fonts.map((f, i) => (
                                    <div key={i} className={`text-xl ${f.family}`}>Aa <span className="text-xs ml-2 opacity-50 font-sans">{f.name}</span></div>
                                ))}
                            </div>
                        </div>
                        <div 
                            onClick={() => setActiveModal('colors')}
                            className={`p-4 rounded-xl border group/color cursor-pointer transition-all ${themeMode === 'light' ? 'bg-slate-50 border-slate-100 hover:border-indigo-200 shadow-sm' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                                  <Palette size={12} /> Color Palette
                              </div>
                              <Edit2 size={12} className="opacity-0 group-hover/color:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {colors.map(c => (
                                    <div key={c} className="flex flex-col items-center gap-1 group/coloritem">
                                        <div 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setColors(colors.filter(x => x !== c));
                                          }}
                                          className="w-10 h-10 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:scale-110 transition-transform relative overflow-hidden" 
                                          style={{ backgroundColor: c }}
                                        >
                                            <div className="absolute inset-0 bg-rose-500/80 opacity-0 group-hover/coloritem:opacity-100 flex items-center justify-center transition-opacity">
                                              <X size={14} className="text-white" />
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-mono font-bold text-slate-500 uppercase">{c}</div>
                                    </div>
                                ))}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveModal('colors'); }}
                                  className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all ${
                                    themeMode === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/50'
                                  }`}
                                >
                                  <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardClass} p-6 relative group`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Sparkles size={14} className="text-indigo-500" /> Tagline
                  </h3>
                  <button onClick={() => setIsEditingTagline(!isEditingTagline)} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-500">
                    {isEditingTagline ? <Check size={16} /> : <Edit2 size={14} />}
                  </button>
                </div>
                {isEditingTagline ? (
                  <textarea 
                    autoFocus
                    className="w-full bg-transparent border-b border-indigo-500 text-2xl font-serif italic text-indigo-600 outline-none resize-none"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    onBlur={() => setIsEditingTagline(false)}
                    rows={2}
                  />
                ) : (
                  <p className="text-2xl font-serif italic text-indigo-600">"{tagline}"</p>
                )}
            </div>
            <div className={`${cardClass} p-6`}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <Target size={14} className="text-emerald-500" /> Brand Values
                </h3>
                <div className="flex flex-wrap gap-2">
                    {activeValues.map(v => (
                        <button 
                          key={v} 
                          onClick={() => setActiveValues(activeValues.filter(x => x !== v))}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600`}
                        >
                            {v}
                        </button>
                    ))}
                    <button 
                        onClick={() => setActiveModal('value')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold border border-dashed flex items-center gap-1 ${
                        themeMode === 'light' ? 'border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600' : 'border-slate-700 text-slate-500 hover:border-cyan-400 hover:text-cyan-400'
                        }`}
                    >
                      <Plus size={10} /> Add Value
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* Assets Side Panel */}
        <div className="space-y-6">
            <div className={`${cardClass} p-6`}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                    <Camera size={14} className="text-rose-500" /> Brand Images
                </h3>
                
                <div className={`rounded-2xl p-4 mb-6 ${themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-800/50'}`}>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {brandImages.map(i => (
                            <div key={i} className="aspect-square rounded-lg bg-slate-200 overflow-hidden group/img relative">
                                <img src={`https://picsum.photos/seed/${i + 10}/200`} alt="Brand" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setBrandImages(brandImages.filter(x => x !== i))}
                                  className="absolute inset-0 bg-rose-500/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <X size={16} className="text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="text-xs font-bold mb-1">Generated Assets</div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Images based on your Brand DNA profiles.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleFileUpload('brand')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-dashed transition-all ${
                        themeMode === 'light' ? 'border-slate-300 hover:border-indigo-400 hover:bg-white shadow-sm' : 'border-slate-700 hover:border-cyan-400 hover:bg-slate-800'
                        }`}
                    >
                        <Upload size={18} className="text-slate-400" />
                        <span className="text-[10px] font-bold">Upload New</span>
                    </button>
                    <div 
                        onClick={() => handleFileUpload('alt')}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center group/alt cursor-pointer transition-all ${themeMode === 'light' ? 'bg-white border-slate-100 hover:border-indigo-200' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                    >
                        <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white mb-2 font-black italic relative overflow-hidden">
                          KT
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/alt:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload size={14} />
                          </div>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Logo Alt</div>
                    </div>
                </div>
            </div>

            <button className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95">
                <RefreshCw size={16} />
                Regenerate DNA Profile
            </button>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
            <div className={`relative w-full max-w-md rounded-[32px] border p-8 shadow-2xl animate-in zoom-in-95 duration-200 ${
                themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black capitalize">{activeModal} Picker</h3>
                    <button onClick={() => setActiveModal(null)}><X size={20} /></button>
                </div>

                {activeModal === 'fonts' && (
                    <div className="space-y-3">
                        {['Fraunces', 'Outfit', 'Inter', 'Playfair Display', 'Poppins'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => {
                                    setFonts([{ name: f, family: f.includes('Fraunces') || f.includes('Playfair') ? 'font-serif' : 'font-sans' }, fonts[1]]);
                                    setActiveModal(null);
                                }}
                                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                                    themeMode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                                }`}
                            >
                                <span className={f.includes('Fraunces') || f.includes('Playfair') ? 'font-serif' : 'font-sans'}>{f}</span>
                                <ChevronRight size={14} />
                            </button>
                        ))}
                    </div>
                )}

                {activeModal === 'colors' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-5 gap-3">
                            {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'].map(c => (
                                <button 
                                    key={c} 
                                    onClick={() => {
                                        if (!colors.includes(c)) setColors([...colors, c]);
                                        setActiveModal(null);
                                    }}
                                    className="w-10 h-10 rounded-full border-2 border-white shadow-md hover:scale-110 transition-all"
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        
                        <div className="pt-6 border-t border-slate-100/10">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Custom Hex Code</label>
                            <form 
                                className="flex gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const val = (e.currentTarget.elements.namedItem('hex') as HTMLInputElement).value;
                                    if (val && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) {
                                        if (!colors.includes(val)) setColors([...colors, val]);
                                        setActiveModal(null);
                                    }
                                }}
                            >
                                <input 
                                    name="hex"
                                    placeholder="#000000"
                                    className={`flex-1 px-4 py-2 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm ${
                                        themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                                    }`}
                                />
                                <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                                    Add
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeModal === 'value' && (
                    <form onSubmit={handleAddValue} className="space-y-4">
                        <input 
                            name="value" 
                            autoFocus
                            placeholder="Enter brand value..."
                            className={`w-full px-4 py-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 ${
                                themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                            }`}
                        />
                        <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700">
                            Add Brand Value
                        </button>
                    </form>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
