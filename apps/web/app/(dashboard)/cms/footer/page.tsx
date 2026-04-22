'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PanelBottom, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FooterManagementPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-10 mt-4 relative z-10 animate-in fade-in duration-500">
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                        <PanelBottom size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Footer Configuration</h2>
                        <p className="text-slate-400 text-sm">Manage secondary links and copyright information.</p>
                    </div>
                </div>
                <Button className="bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-none rounded-xl px-5">
                    <Save size={18} className="mr-2" /> Save Changes
                </Button>
            </motion.header>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-8">
                <p className="text-slate-400">Footer builder coming soon...</p>
            </div>
        </div>
    );
}
