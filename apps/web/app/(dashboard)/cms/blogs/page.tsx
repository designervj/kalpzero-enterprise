'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BlogsManagementPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-10 mt-4 relative z-10 animate-in fade-in duration-500">
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Blogs</h2>
                        <p className="text-slate-400 text-sm">Manage articles, authors, and categories.</p>
                    </div>
                </div>
                <Button className="bg-purple-500 hover:bg-purple-400 shadow-none text-white font-bold rounded-xl px-5">
                    <Plus size={18} className="mr-2" /> New Article
                </Button>
            </motion.header>

            <div className="relative max-w-sm">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input type="text" placeholder="Search blogs..." className="pl-11 bg-slate-900/40 border-slate-800 text-white rounded-xl h-11 focus:border-purple-500/50" />
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <BookOpen size={24} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No blogs found</h3>
                <p className="text-slate-400 max-w-sm mb-6">Publish your first article to start engaging with your audience.</p>
            </div>
        </div>
    );
}
