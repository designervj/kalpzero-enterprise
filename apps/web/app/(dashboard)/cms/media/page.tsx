'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MediaManagementPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-10 mt-4 relative z-10 animate-in fade-in duration-500">
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Media Library</h2>
                        <p className="text-slate-400 text-sm">Upload and organize your assets.</p>
                    </div>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-none rounded-xl px-5">
                    <Upload size={18} className="mr-2" /> Upload Assets
                </Button>
            </motion.header>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 border-dashed rounded-2xl p-24 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <ImageIcon size={24} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Drop your files here</h3>
                <p className="text-slate-400 max-w-sm mb-6">Supports images, videos, and documents up to 50MB.</p>
                <Button variant="secondary" className="rounded-xl">Browse Files</Button>
            </div>
        </div>
    );
}
