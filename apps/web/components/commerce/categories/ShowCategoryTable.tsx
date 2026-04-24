"use client"

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    RefreshCw,
    ChevronRight,
    ChevronDown,
    FolderTree,
    Zap,
    Tag,
    X,
    Terminal,
    Database,
    Layers,
    Sparkles,
    ArrowRight,
    Boxes
} from 'lucide-react';
import { deleteCategory, fetchCategories, createCategory, updateCategory } from '@/hook/slices/commerce/category/categoryThunk';
import { CategoryType } from '@/hook/slices/commerce/category/categoryType';
import CategoryForm from './CategoryForm';
import { setCurrentCategories } from '@/hook/slices/commerce/category/categorySlice';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

interface TreeCategory extends CategoryType {
    children: TreeCategory[];
}

export default function ShowCategoryTable() {
    const dispatch = useDispatch<AppDispatch>();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const { allCategories, isLoading } = useSelector((state: RootState) => state.category);
    const { authUser } = useSelector((state: RootState) => state.auth);
    const { currentTenant } = useSelector((state: RootState) => state.tenant);

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const tree = useMemo(() => {
        const map = new Map<string, TreeCategory>();
        const roots: TreeCategory[] = [];

        allCategories.forEach((c) => {
            const id = c._id || c.id;
            if (id) map.set(id, { ...c, children: [] });
        });

        map.forEach((c) => {
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId)!.children.push(c);
            } else {
                roots.push(c);
            }
        });

        return roots;
    }, [allCategories]);

    const filteredTree = useMemo(() => {
        if (!searchTerm) return tree;
        const searchLower = searchTerm.toLowerCase();
        
        const filterNodes = (nodes: TreeCategory[]): TreeCategory[] => {
            return nodes.reduce((acc: TreeCategory[], node) => {
                const matches = node.name?.toLowerCase().includes(searchLower) || 
                               node.slug?.toLowerCase().includes(searchLower);
                const filteredChildren = filterNodes(node.children);
                if (matches || filteredChildren.length > 0) {
                    acc.push({ ...node, children: filteredChildren });
                }
                return acc;
            }, []);
        };
        return filterNodes(tree);
    }, [tree, searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`CONFIRM DESTRUCTION: Delete category "${name}" and all sub-nodes?`)) return;
        
        const tId = toast.loading("PURGING CATEGORY...");
        try {
            if (authUser?.access_token && currentTenant?.mongo_db_name) {
                await dispatch(deleteCategory({
                    id,
                    auth_token: authUser.access_token,
                    'x-tenant-db': currentTenant.mongo_db_name
                })).unwrap();
                toast.success("CATEGORY PURGED", { id: tId });
            }
        } catch (err) {
            toast.error("PURGE FAILURE", { id: tId });
        }
    };

    const handleRefresh = () => {
        if (authUser?.access_token && currentTenant?.mongo_db_name) {
            dispatch(fetchCategories({
                auth_token: authUser.access_token,
                'x-tenant-db': currentTenant.mongo_db_name
            }));
        }
    };

    const handleFormSubmit = async (data: any) => {
        if (!authUser?.access_token || !currentTenant?.mongo_db_name) return;

        const auth_token = authUser.access_token;
        const xTenantDb = currentTenant.mongo_db_name;
        const tId = toast.loading(editingCategory ? "Updating category..." : "Creating category...");

        try {
            if (editingCategory?._id || editingCategory?.id) {
                const id = (editingCategory._id || editingCategory.id) as string;
                await dispatch(updateCategory({
                    id,
                    categoryData: data,
                    auth_token,
                    "x-tenant-db": xTenantDb
                })).unwrap();
                toast.success("Category updated successfully", { id: tId });
            } else {
                await dispatch(createCategory({
                    categoryData: data,
                    auth_token,
                    "x-tenant-db": xTenantDb
                })).unwrap();
                toast.success("Category created successfully", { id: tId });
            }
            setIsFormOpen(false);
            setEditingCategory(null);
        } catch (err) {
            toast.error("Action failed", { id: tId });
        }
    };

    const renderRows = (nodes: TreeCategory[], level = 0) => {
        return nodes.map((category) => {
            const id = (category._id || category.id) as string;
            const hasChildren = category.children && category.children.length > 0;
            const isExpanded = expandedRows[id] || searchTerm.length > 0;
            const name = category.name || 'Unnamed Hub';

            return (
                <React.Fragment key={id}>
                    <TableRow className={`group border-slate-800/40 hover:bg-indigo-500/[0.03] transition-all duration-300 ${level > 0 ? "bg-slate-900/10" : ""}`}>
                        <TableCell className="px-8 py-5">
                            <div className="flex items-center gap-4" style={{ paddingLeft: `${level * 40}px` }}>
                                {hasChildren ? (
                                    <button 
                                        onClick={() => toggleRow(id)}
                                        className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all border ${isExpanded ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"}`}
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                ) : (
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500/50 transition-colors" />
                                    </div>
                                )}
                                
                                <div className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-all group-hover:scale-105 ${level === 0 ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-inner shadow-indigo-500/5" : "bg-slate-900/50 border-slate-800 text-slate-500"}`}>
                                    <FolderTree size={20} />
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <span className={`font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors ${level === 0 ? "text-base" : "text-sm"}`}>
                                        {name}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                                        /{category.slug}
                                    </span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {category.type || 'Standard'}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800">
                                <Zap size={12} className="text-indigo-400" />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    {category.children.length} Children
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right px-8">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button 
                                    className="h-10 w-10 bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-indigo-500/10"
                                    onClick={() => {
                                        dispatch(setCurrentCategories(category));
                                        setEditingCategory({ parentId: id } as any);
                                        setIsFormOpen(true);
                                    }}
                                    title="Add Sub-Category"
                                >
                                    <Plus size={18} />
                                </button>
                                <button 
                                    className="h-10 w-10 bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-cyan-500/10"
                                    onClick={() => {
                                        const parent = allCategories.find(c => (c._id === category.parentId || c.id === category.parentId));
                                        dispatch(setCurrentCategories(parent || null));
                                        setEditingCategory(category);
                                        setIsFormOpen(true);
                                    }}
                                    title="Edit Category"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    className="h-10 w-10 bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/50 transition-all flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-rose-500/10"
                                    onClick={() => handleDelete(id, name)}
                                    title="Delete Category"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                    {isExpanded && hasChildren && renderRows(category.children, level + 1)}
                </React.Fragment>
            );
        });
    };

    if (isFormOpen) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 backdrop-blur-3xl p-10 border border-slate-800 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] space-y-10"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
                            <Tag size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">
                                {editingCategory?._id || editingCategory?.id ? "Modify Category" : "New Category"}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Configure hierarchical logic and classification rules.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setIsFormOpen(false);
                            setEditingCategory(null);
                        }}
                        className="h-12 w-12 bg-slate-950/50 border border-slate-800 text-slate-500 hover:text-white transition-all flex items-center justify-center rounded-xl group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
                
                <CategoryForm 
                    initialData={editingCategory || {}} 
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setEditingCategory(null);
                    }}
                    isLoading={isLoading}
                    allCategories={allCategories}
                />
            </motion.div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 mt-4 relative z-10">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

             {/* Premium Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="px-0 py-12  rounded-[1rem] "
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-5 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
                            <Boxes className="w-12 h-12 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-white leading-none">
                                Taxonomy <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Matrix</span>
                            </h1>
                            <p className="text-slate-400 mt-4 text-md font-medium max-w-xl leading-relaxed">
                                Orchestrate your commerce hierarchy with <br/> logic-driven category nodes and automated mapping.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            className="group h-14 px-8 bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-sm transition-all duration-300 flex items-center gap-4 rounded-2xl overflow-hidden relative"
                            onClick={handleRefresh}
                        >
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <RefreshCw size={20} className={`${isLoading ? 'animate-spin' : ''} text-indigo-400`} /> Sync Repository
                        </button>
                        <button
                            className="group h-14 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)]"
                            onClick={() => {
                                dispatch(setCurrentCategories(null));
                                setIsFormOpen(true);
                            }}
                        >
                            <Plus size={22} strokeWidth={3} /> Add Hub Node
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Controls & Search */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-8 items-center justify-between bg-slate-900/30 backdrop-blur-md p-8 rounded-[1rem] border border-slate-800/50 shadow-2xl"
            >
                <div className="relative w-full sm:w-[500px] group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-300" size={20} />
                    <input
                        placeholder="IDENTIFY NODE BY NAME OR SERIAL SLUG..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-16 pl-16 pr-8 bg-slate-950/50 border border-slate-800 rounded-2xl text-sm font-bold tracking-tight text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all duration-300 shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-6 px-8 py-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Matrix Uplink Active</span>
                    </div>
                    <div className="w-[1px] h-4 bg-slate-800" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{allCategories.length} Nodes Indexed</span>
                </div>
            </motion.div>

            {/* Hierarchy Table */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[1rem] overflow-hidden shadow-2xl shadow-black/40"
            >
                <Table>
                    <TableHeader className="bg-slate-900/60 border-b border-slate-800/50 h-20">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-10">
                                Hierarchical Topology
                            </TableHead>
                            <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                                Protocol
                            </TableHead>
                            <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                                Connectivity
                            </TableHead>
                            <TableHead className="text-right text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-10">
                                Control
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && allCategories.length === 0 ? (
                            <TableRow className="border-none hover:bg-transparent">
                                <TableCell colSpan={4} className="h-80 text-center">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="h-12 w-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
                                        <span className="text-sm font-black uppercase tracking-[0.4em] text-slate-600 italic animate-pulse">Synchronizing Sector Matrix...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTree.length === 0 ? (
                            <TableRow className="border-none hover:bg-transparent">
                                <TableCell colSpan={4} className="h-80 text-center">
                                    <div className="flex flex-col items-center gap-8 opacity-20 group">
                                        <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                                            <FolderTree size={64} className="text-slate-400" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-[0.5em] text-slate-500">No Classification Nodes Detected</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            renderRows(filteredTree)
                        )}
                    </TableBody>
                </Table>
            </motion.div>
            
            {/* Premium Footer Intel */}
            <motion.footer 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-6 py-12"
            >
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
                <div className="flex items-center gap-4 px-6 py-2.5 bg-slate-900/40 rounded-full border border-slate-800/50 backdrop-blur-sm">
                    <Terminal size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                        Executive Console: Sector 7-G | Topology Integrity: Verified
                    </span>
                    <Sparkles size={14} className="text-indigo-500/40" />
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
            </motion.footer>
        </div>
    );
}
