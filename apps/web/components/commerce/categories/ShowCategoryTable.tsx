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
    Terminal
} from 'lucide-react';
import { deleteCategory, fetchCategories, createCategory, updateCategory } from '@/hook/slices/commerce/category/categoryThunk';
import { CategoryType } from '@/hook/slices/commerce/category/categoryType';
import CategoryForm from './CategoryForm';
import { setCurrentCategories } from '@/hook/slices/commerce/category/categorySlice';

interface TreeCategory extends CategoryType {
    children: TreeCategory[];
}

export default function ShowCategoryTable() {
    const dispatch = useDispatch<AppDispatch>();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const { allCategories, isLoading, isError } = useSelector((state: RootState) => state.category);
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

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        if (authUser?.access_token && currentTenant?.mongo_db_name) {
            await dispatch(deleteCategory({
                id,
                auth_token: authUser.access_token,
                'x-tenant-db': currentTenant.mongo_db_name
            }));
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

        if (editingCategory?._id || editingCategory?.id) {
            const id = (editingCategory._id || editingCategory.id) as string;
            await dispatch(updateCategory({
                id,
                categoryData: data,
                auth_token,
                "x-tenant-db": xTenantDb
            }));
        } else {
            await dispatch(createCategory({
                categoryData: data,
                auth_token,
                "x-tenant-db": xTenantDb
            }));
        }
        setIsFormOpen(false);
        setEditingCategory(null);
        // handleRefresh();
    };

    const renderRows = (nodes: TreeCategory[], level = 0) => {
        return nodes.map((category) => {
            const id = (category._id || category.id) as string;
            const hasChildren = category.children && category.children.length > 0;
            const isExpanded = expandedRows[id] || searchTerm.length > 0;
            const name = category.name || 'Unnamed Hub';

            return (
                <React.Fragment key={id}>
                    <TableRow className={`group border-slate-900/40 hover:bg-indigo-500/[0.02] transition-all duration-300 ${level > 0 ? "bg-slate-900/10" : ""}`}>
                        <TableCell className="w-full sm:w-[50%] px-8 py-6">
                            <div className="flex items-center gap-4" style={{ paddingLeft: `${level * 48}px` }}>
                                {hasChildren ? (
                                    <button 
                                        onClick={() => toggleRow(id)}
                                        className={`flex items-center justify-center w-6 h-6 rounded-sm transition-all border ${isExpanded ? "bg-indigo-500/10 border-indigo-500 text-indigo-500" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"}`}
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                ) : (
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                                    </div>
                                )}
                                
                                <div className={`flex items-center justify-center w-10 h-10 rounded-sm border ${level === 0 ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-400" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
                                    <FolderTree size={18} />
                                </div>

                                <div className="flex flex-col">
                                    <span className={`font-black text-slate-100 uppercase tracking-tight group-hover:text-indigo-400 transition-colors ${level === 0 ? "text-sm" : "text-xs"}`}>
                                        {name}
                                    </span>
                                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest italic">
                                        /{category.slug}
                                    </span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-900 border border-slate-800 rounded-none italic">
                                {category.type || 'product'} Logic
                            </span>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-indigo-500/40" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {category.children.length} Sub-Nodes
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right px-8">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    className="h-9 w-9 bg-slate-900 border border-slate-800 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center"
                                    onClick={() => {
                                        dispatch(setCurrentCategories(category));
                                        setEditingCategory({ parentId: id } as any);
                                        setIsFormOpen(true);
                                    }}
                                    title="Add Sub-Category"
                                >
                                    <Plus size={16} />
                                </button>
                                <button 
                                    className="h-9 w-9 bg-slate-900 border border-slate-800 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center"
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
                                    className="h-9 w-9 bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all flex items-center justify-center"
                                    onClick={() => handleDelete(id)}
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
            <div className="bg-slate-950/60 p-8 border-l-4 border-indigo-500 space-y-8 shadow-2xl shadow-black/60 animate-in slide-in-from-top-4 duration-500 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-900 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Tag size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">
                                {editingCategory?._id || editingCategory?.id ? "Modify Category" : " New Category"}
                            </h3>
                            {/* <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic mt-1">
                                Configure hierarchical logic and network accessibility.
                            </p> */}
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setIsFormOpen(false);
                            setEditingCategory(null);
                        }}
                        className="h-10 w-10 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white transition-all flex items-center justify-center"
                    >
                        <X size={18} />
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
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* Tactical Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-900 pb-8">
                <div className="space-y-2">
                    {/* <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter leading-none italic">
                        Sector <span className="text-indigo-500">Taxonomy</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic flex items-center gap-2">
                        <Database size={12} className="text-indigo-500" /> System hierarchy for asset categorization and navigation.
                    </p> */}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        className="h-12 px-6 bg-slate-900 border border-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-3"
                        onClick={handleRefresh}
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Sync Matrix
                    </button>
                    <button
                        className="h-12 px-10 bg-indigo-600 text-white hover:bg-indigo-500 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-indigo-900/20"
                        onClick={() => {
                            dispatch(setCurrentCategories(null));
                            setIsFormOpen(true);
                        }}
                    >
                        <Plus size={18} /> Add Category
                    </button>
                </div>
            </div>

            {/* Stats Cluster */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "Network Hubs", val: stats.all, icon: Boxes, color: "text-indigo-500" },
                    { label: "Asset Nodes", val: stats.product, icon: Package, color: "text-emerald-500" },
                    { label: "Intel Nodes", val: stats.intel, icon: FileText, color: "text-blue-500" },
                    { label: "Sub-Structures", val: stats.structures, icon: Zap, color: "text-indigo-400" },
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-900 p-5 rounded-none shadow-2xl shadow-black/40 group hover:border-indigo-500/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">
                                {stat.label}
                            </span>
                            <stat.icon size={14} className={`${stat.icon === Zap ? 'text-indigo-400' : stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <div className="text-3xl font-black text-slate-100 tracking-widest">
                            {stat.val < 10 ? `0${stat.val}` : stat.val}
                        </div>
                    </div>
                ))}
            </div> */}

            {/* Controls & Search */}
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-slate-950 p-5 rounded-none border border-slate-900 shadow-2xl shadow-black/40">
                <div className="relative w-full sm:w-[400px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        placeholder="SEARCH HIERARCHY MATRIX..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 bg-slate-900 border border-slate-800 rounded-sm text-xs font-black uppercase tracking-widest text-slate-200 placeholder:text-slate-700 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Matrix Status:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Link</span>
                    </div>
                </div>
            </div>

            {/* Hierarchy Table */}
            <div className="bg-slate-950 border border-slate-900 rounded-none overflow-hidden shadow-2xl shadow-black/80">
                <Table>
                    <TableHeader className="bg-slate-900/60 border-b border-slate-900">
                        <TableRow className="hover:bg-transparent border-none h-16">
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 px-8">
                                Hierarchical Structure
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
                                Protocol
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
                                Connectivity
                            </TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 px-8">
                                Hub Calibration
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && allCategories.length === 0 ? (
                            <TableRow className="border-none hover:bg-transparent">
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="h-8 w-8 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin shadow-lg shadow-indigo-500/20" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic animate-pulse">Syncing Taxonomy Matrix...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTree.length === 0 ? (
                            <TableRow className="border-none hover:bg-transparent">
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-6 opacity-10 italic text-slate-700">
                                        <FolderTree size={48} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Inventory Nodes Not Localized</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            renderRows(filteredTree)
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {/* Footer Intel */}
            <div className="flex items-center justify-between opacity-40">
                <div className="flex items-center gap-3">
                    <Terminal size={14} className="text-indigo-500" />
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">Sector Access Level: Authorized Level-4 | Taxonomy Sync: Active</span>
                </div>
                <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Allied Surplus System Terminal v1.0.42</div>
            </div>
        </div>
    );
}