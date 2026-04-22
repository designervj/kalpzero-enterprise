'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { 
    LayoutTemplate, 
    FileText, 
    BookOpen, 
    Image as ImageIcon, 
    PanelTop, 
    PanelBottom,
    ChevronRight,
    Sparkles
} from 'lucide-react';

interface CmsModule {
    label: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    colorClass: string;
}

const cmsModules: CmsModule[] = [
    {
        label: "Website Pages",
        description: "Create, edit, and manage static and dynamic landing pages.",
        href: "/cms/pages",
        icon: <FileText className="w-6 h-6" />,
        colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
    },
    {
        label: "Blog Posts",
        description: "Publish articles, manage authors, and organize content categories.",
        href: "/cms/blogs",
        icon: <BookOpen className="w-6 h-6" />,
        colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
        label: "Media Library",
        description: "Upload and organize images, videos, and downloadable assets.",
        href: "/cms/media",
        icon: <ImageIcon className="w-6 h-6" />,
        colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
        label: "Header Navigation",
        description: "Configure main menus, mega-menus, and top-bar elements.",
        href: "/cms/header",
        icon: <PanelTop className="w-6 h-6" />,
        colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
        label: "Footer Layout",
        description: "Manage footer links, copyright text, and secondary navigation.",
        href: "/cms/footer",
        icon: <PanelBottom className="w-6 h-6" />,
        colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/20"
    }
];

export default function CmsHubPage() {
    // Animation variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 mt-4 relative z-10">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* Header Section */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="px-6 py-8 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-md rounded-3xl"
            >
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20 shadow-sm">
                        <LayoutTemplate className="w-8 h-8 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-3">
                            Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400">Studio</span>
                        </h2>
                    </div>
                </div>
                <p className="text-slate-400 mt-2 text-base max-w-3xl leading-relaxed ml-1 font-medium">
                    Centralized hub for managing your public-facing assets. Create pages, publish blogs, and structure your global site navigation.
                </p>
            </motion.header>

            {/* Grid Section */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6 px-2"
            >
                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-pink-400" />
                            Site Elements
                        </h3>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/50 to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {cmsModules.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 hover:shadow-lg transition-all duration-500 overflow-hidden"
                            >
                                {/* Hover gradient background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Hover glow effect */}
                                <div className="absolute -inset-px rounded-2xl border border-white/0 group-hover:border-white/5 transition-colors duration-500 pointer-events-none"></div>
                                
                                <div className="relative z-10 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-3 rounded-xl bg-slate-950/80 shadow-inner border group-hover:scale-110 transition-transform duration-500 ${item.colorClass}`}>
                                            {item.icon}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors duration-300">
                                            {item.label}
                                        </h4>
                                        <p className="text-sm text-slate-400 mt-2 leading-relaxed group-hover:text-slate-300 transition-colors duration-300 font-medium">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
