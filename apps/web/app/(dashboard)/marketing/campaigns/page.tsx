'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Image as ImageIcon, 
  Package, 
  Maximize, 
  ChevronDown,
  MoreVertical,
  Zap,
  Layout,
  X,
  Upload,
  Check
} from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

// Portal Component
const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
};

export default function CampaignsPage() {
  const { themeMode } = useTheme();
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [isAspectRatioOpen, setIsAspectRatioOpen] = useState(false);
  
  // Form States
  const [productUrl, setProductUrl] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('Story (9:16)');
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const cardClass = useMemo(() => 
    `rounded-[24px] border transition-all duration-300 ${
      themeMode === 'light' 
        ? 'border-slate-200 bg-white shadow-sm' 
        : 'border-slate-800/80 bg-slate-900/40 shadow-inner'
    }`, [themeMode]);

  const modalOverlayClass = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm";
  const modalContentClass = `w-full max-w-lg rounded-[32px] border p-8 shadow-2xl relative transition-all duration-500 ${
    themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
  }`;

  const dummyProducts = [
    { id: 1, name: "Neural Interface V2", price: "$1,299", category: "Hardware", img: "https://picsum.photos/seed/p1/100" },
    { id: 2, name: "Quantum Processor", price: "$899", category: "Components", img: "https://picsum.photos/seed/p2/100" },
    { id: 3, name: "Holographic Display", price: "$2,499", category: "Output", img: "https://picsum.photos/seed/p3/100" },
    { id: 4, name: "Synaptic Link", price: "$499", category: "Accessories", img: "https://picsum.photos/seed/p4/100" },
    { id: 5, name: "Bio-Battery Pro", price: "$150", category: "Power", img: "https://picsum.photos/seed/p5/100" },
  ];

  const filteredProducts = dummyProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ${themeMode === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* Header */}
      <div className="text-center  pt-0">
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
            
            <div className="flex flex-wrap items-center justify-between gap-4 mt-0 pt-0 border-t border-slate-100/10">
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100/10">
                    <button 
                        onClick={() => setIsProductModalOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                        themeMode === 'light' 
                            ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' 
                            : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                    }`}>
                        <Package size={16} />
                        Product
                    </button>
                    <button 
                        onClick={() => setIsImagesModalOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                        themeMode === 'light' 
                            ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' 
                            : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                    }`}>
                        <ImageIcon size={16} />
                        Images
                    </button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setIsAspectRatioOpen(!isAspectRatioOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                            themeMode === 'light' 
                                ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' 
                                : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                        }`}>
                            <Maximize size={16} />
                            {selectedAspectRatio}
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isAspectRatioOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isAspectRatioOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={`absolute bottom-full mb-2 left-0 w-48 rounded-2xl border p-2 shadow-xl z-50 ${
                                        themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                                    }`}
                                >
                                    {['Story (9:16)', 'Square (1:1)', 'Feed (4:5)'].map((ratio) => (
                                        <button
                                            key={ratio}
                                            onClick={() => {
                                                setSelectedAspectRatio(ratio);
                                                setIsAspectRatioOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                                                selectedAspectRatio === ratio
                                                    ? 'bg-indigo-600 text-white'
                                                    : themeMode === 'light' ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'
                                            }`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
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

      {/* Modals Section - Rendered via Portal to cover full screen */}
      <Portal>
        <AnimatePresence>
          {/* Product Modal */}
        {isProductModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={modalOverlayClass}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`${modalContentClass} max-w-xl`}
            >
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-black mb-2">Select Product</h3>
              <p className={`text-sm mb-6 font-medium ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Add a product via URL or select from your existing catalog.
              </p>

              <div className="space-y-6">
                {/* URL Input Section */}
                <div className="space-y-3">
                    <label className={`text-[10px] uppercase font-black tracking-widest ${themeMode === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Add from URL
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={productUrl}
                            onChange={(e) => setProductUrl(e.target.value)}
                            placeholder="www.yourbusiness.com/products/..."
                            className={`flex-1 px-5 py-3.5 rounded-2xl border focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm ${
                                themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                            }`}
                        />
                        <button 
                            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 transition-all"
                        >
                            Fetch
                        </button>
                    </div>
                </div>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${themeMode === 'light' ? 'border-slate-100' : 'border-slate-800'}`}></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
                        <span className={`px-4 ${themeMode === 'light' ? 'bg-white text-slate-300' : 'bg-slate-900 text-slate-600'}`}>OR</span>
                    </div>
                </div>

                {/* Existing Products Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className={`text-[10px] uppercase font-black tracking-widest ${themeMode === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Choose from Catalog
                        </label>
                        <input 
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search catalog..."
                            className={`px-4 py-2 rounded-full border text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 transition-all ${
                                themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                            }`}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto pr-2 scrollbar-hide">
                        {filteredProducts.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedProductId(p.id)}
                                className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                                    selectedProductId === p.id
                                        ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500'
                                        : themeMode === 'light' ? 'border-slate-100 bg-slate-50 hover:border-slate-300' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                                }`}
                            >
                                <img src={p.img} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-black">{p.name}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.category}</div>
                                </div>
                                <div className="text-sm font-black text-indigo-500">{p.price}</div>
                                {selectedProductId === p.id && (
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                        <Check size={12} strokeWidth={4} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100/10">
                    <button 
                        onClick={() => setIsProductModalOpen(false)}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                            themeMode === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                        }`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            // Logic to add product
                            setIsProductModalOpen(false);
                        }}
                        className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                        Add Product
                    </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Images Modal */}
        {isImagesModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={modalOverlayClass}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`${modalContentClass} max-w-2xl`}
            >
              <button 
                onClick={() => setIsImagesModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-black mb-2">Select images</h3>
              <p className={`text-sm mb-6 font-medium ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Select images for your campaign. ({selectedImages.length}/6 selected)
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {/* Upload Button */}
                <button className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 group transition-all ${
                    themeMode === 'light' ? 'border-slate-200 hover:border-indigo-500 bg-slate-50' : 'border-slate-800 hover:border-indigo-500 bg-slate-950'
                }`}>
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                    </div>
                    <span className="text-xs font-bold">Upload Images</span>
                </button>

                {/* Dummy Images */}
                {[1, 2, 3, 4, 5].map((id) => (
                  <div 
                    key={id}
                    onClick={() => {
                        if (selectedImages.includes(id)) {
                            setSelectedImages(selectedImages.filter(i => i !== id));
                        } else if (selectedImages.length < 6) {
                            setSelectedImages([...selectedImages, id]);
                        }
                    }}
                    className={`aspect-square rounded-2xl border-2 relative overflow-hidden cursor-pointer transition-all ${
                        selectedImages.includes(id) 
                            ? 'border-indigo-500 scale-[0.98]' 
                            : themeMode === 'light' ? 'border-transparent' : 'border-transparent'
                    }`}
                  >
                    <img src={`https://picsum.photos/seed/${id + 10}/200`} alt="Gallery" className="w-full h-full object-cover" />
                    {selectedImages.includes(id) && (
                        <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                <Check size={16} strokeWidth={4} />
                            </div>
                        </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-100/10">
                <button 
                    onClick={() => setSelectedImages([])}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-500 transition-colors"
                >
                    Deselect All
                </button>
                <button 
                    onClick={() => setIsImagesModalOpen(false)}
                    className="px-10 py-3 rounded-full bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 transition-all"
                >
                    Looks Good
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
