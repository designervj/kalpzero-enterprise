'use client';

import { useMemo, useState, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  Layers, 
  Maximize, 
  Download,
  Share2,
  Trash2,
  Plus,
  ArrowRight,
  X,
  Upload,
  Check,
  Loader2
} from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export default function PhotoshootPage() {
  const { themeMode } = useTheme();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardClass = useMemo(() => 
    `rounded-[32px] border transition-all duration-500 relative ${
      themeMode === 'light' 
        ? 'border-slate-200 bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5' 
        : 'border-slate-800/80 bg-slate-900/40 shadow-inner hover:border-cyan-500/40'
    }`, [themeMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate "AI Background Removal" delay
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        setSelectedImage(url);
        setIsUploading(false);
        setUploadStep(2);
      }, 1500);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ${themeMode === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
            <ImageIcon size={32} className="text-indigo-500" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter italic font-serif mb-3">Photoshoot</h1>
        <p className={`text-base max-w-2xl mx-auto ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
          Choose a guided template for professional product shots or use our flexible editor to create anything you can imagine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Creation Box 1 */}
        <div className={`${cardClass} p-8 flex flex-col`}>
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black mb-2">Create a product photoshoot</h2>
                    <p className={`text-sm ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Choose a product image and templates to get professional shots.</p>
                </div>
                <div className={`p-3 rounded-2xl ${themeMode === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    <Camera size={24} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                    "https://picsum.photos/seed/p1/200/200",
                    "https://picsum.photos/seed/p2/200/200",
                    "https://picsum.photos/seed/p3/200/200",
                    "https://picsum.photos/seed/p4/200/200",
                    "https://picsum.photos/seed/p5/200/200"
                ].map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-slate-100 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all">
                        <img src={img} alt="Template" className="w-full h-full object-cover" />
                    </div>
                ))}
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    themeMode === 'light' ? 'bg-slate-50 border-slate-200 hover:bg-white hover:border-indigo-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-cyan-400'
                }`}>
                    <Plus size={24} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add New</span>
                </button>
            </div>

            <button className="mt-auto w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                Start Photoshoot
                <ArrowRight size={16} />
            </button>
        </div>

        {/* Creation Box 2 */}
        <div className={`${cardClass} p-8 flex flex-col`}>
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black mb-2">Generate or edit an image</h2>
                    <p className={`text-sm ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Describe the image you want with a prompt or edit an existing one.</p>
                </div>
                <div className={`p-3 rounded-2xl ${themeMode === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    <Sparkles size={24} />
                </div>
            </div>

            <div className={`relative flex-1 rounded-[24px] overflow-hidden group min-h-[300px] ${
                themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
            }`}>
                <img src="https://picsum.photos/seed/gen1/800/600" alt="Generated" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 group-hover:translate-y-0 transition-transform">
                    <div className="flex items-center gap-2">
                        <button className="flex-1 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold hover:bg-white/20 transition-all">
                            Edit Image
                        </button>
                        <button className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                            Save to Brand DNA
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex gap-3">
                <button className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border ${
                    themeMode === 'light' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                }`}>
                    Manual Editor
                </button>
                <button className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700`}>
                    Regenerate
                </button>
            </div>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsUploadModalOpen(false)} />
          
          <div className={`relative w-full max-w-2xl rounded-[40px] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${
            themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-black tracking-tight">New Photoshoot Asset</h3>
                  <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Upload your product image to start generating high-quality shots.
                  </p>
                </div>
                <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className={`p-2 rounded-full transition-colors ${themeMode === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Step Indicators */}
                <div className="flex items-center gap-4">
                  {[1, 2].map(step => (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        uploadStep >= step 
                          ? 'bg-indigo-600 text-white' 
                          : themeMode === 'light' ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {uploadStep > step ? <Check size={14} /> : step}
                      </div>
                      <span className={`text-[10px] uppercase font-black tracking-widest ${
                        uploadStep >= step ? 'text-indigo-600' : 'text-slate-500'
                      }`}>
                        {step === 1 ? 'Upload' : 'Details'}
                      </span>
                      {step === 1 && <div className={`w-12 h-px ${uploadStep > 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
                    </div>
                  ))}
                </div>

                {uploadStep === 1 ? (
                  <div className={`aspect-video rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center p-12 text-center group cursor-pointer transition-all ${
                    themeMode === 'light' ? 'bg-slate-50 border-slate-200 hover:border-indigo-400' : 'bg-slate-950 border-slate-800 hover:border-cyan-500'
                  }`} onClick={triggerUpload}>
                    <div className={`w-16 h-16 rounded-3xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110 ${
                      themeMode === 'light' ? 'bg-white shadow-lg text-indigo-600' : 'bg-slate-900 shadow-xl text-cyan-400'
                    }`}>
                      {isUploading ? <Loader2 size={28} className="animate-spin" /> : <Upload size={28} />}
                    </div>
                    <h4 className="text-xl font-bold mb-2">{isUploading ? 'Removing Background...' : 'Drop your image here'}</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">Supports JPG, PNG and WEBP. Max size 5MB. Background removal is automatic.</p>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex gap-8">
                        <div className={`w-32 h-32 rounded-2xl overflow-hidden border-2 border-indigo-500/20 shrink-0 ${
                            themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
                        }`}>
                            {selectedImage && <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Name</label>
                                <input 
                                    type="text" 
                                    className={`w-full px-4 py-2 rounded-xl border bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                                    themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                                    }`}
                                    placeholder="e.g. Summer Perfume Bottle"
                                    defaultValue="Uploaded Product"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</label>
                                <select className={`w-full px-4 py-2 rounded-xl border bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                                    themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'
                                    }`}>
                                    <option>Cosmetics</option>
                                    <option>Electronics</option>
                                    <option>Fashion</option>
                                    <option>Food & Drink</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => setUploadStep(1)}
                        className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border ${
                          themeMode === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-white'
                        }`}
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => {
                          setIsUploadModalOpen(false);
                          setUploadStep(1);
                        }}
                        className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                      >
                        Confirm & Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Gallery */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-2">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Layers size={18} className="text-indigo-500" />
                    Recent Creations
                </h3>
                <p className="text-xs text-slate-500 mt-1">Images generated for your campaigns and website.</p>
            </div>
            <div className="flex items-center gap-2">
                <button className={`p-2 rounded-lg border ${themeMode === 'light' ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}>
                    <Maximize size={16} className="text-slate-500" />
                </button>
                <button className={`p-2 rounded-lg border ${themeMode === 'light' ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}>
                    <Download size={16} className="text-slate-500" />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(i => (
                <div key={i} className={`${cardClass} overflow-hidden aspect-square group cursor-pointer border-0`}>
                    <img src={`https://picsum.photos/seed/${i + 20}/300/300`} alt="Recent" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all">
                            <Share2 size={14} />
                        </button>
                        <button className="p-2 rounded-full bg-rose-500/80 backdrop-blur-md text-white hover:bg-rose-600 transition-all">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
