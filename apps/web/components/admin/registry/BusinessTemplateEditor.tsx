'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, X, Info, Layers, Boxes, List, Eye, Download, AlertCircle, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SmartAttributeBuilder } from './SmartAttributeBuilder';
import { AdminIconPicker } from '@/components/ui/admin-icon-picker';
import { DEFAULT_ADMIN_ICON_KEY } from '@/lib/admin-icon-catalog';
import { toggleModuleWithRules } from '@/lib/module-rules';

const TEMPLATE_MODULE_OPTIONS = [
    { key: 'website', label: 'Website' },
    { key: 'branding', label: 'Branding' },
    { key: 'products', label: 'Products' },
    { key: 'ecommerce', label: 'E-Commerce' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'blog', label: 'Blog' },
    { key: 'media', label: 'Media' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'invoicing', label: 'Invoicing' },
];

const attributeSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    label: z.string().min(1, 'Label is required'),
    type: z.enum(['text', 'select', 'boolean', 'number']),
    options: z.array(z.string()).default([]),
    hint: z.string().default(''),
    required: z.boolean().default(false),
});

const businessTemplateSchema = z.object({
    industry: z.string().min(2, 'Industry name is required'),
    industryKey: z.string().min(2, 'Industry key is required'),
    key: z.string().min(2, 'Business type key is required'),
    name: z.string().min(2, 'Name is required'),
    icon: z.string().default(DEFAULT_ADMIN_ICON_KEY),
    description: z.string().optional(),
    enabledModules: z.array(z.string()).default([]),
    featureFlags: z.record(z.string(), z.boolean()).default({}),
    attributePool: z.array(z.string()).default([]),
    attributeSetPreset: z.array(z.object({
        key: z.string(),
        name: z.string(),
        appliesTo: z.string(),
        attributes: z.array(attributeSchema),
    })),
    categorySeedPreset: z.array(z.string()).default([]),
    businessContexts: z.array(z.string()).default([]),
});

type BusinessTemplateFormValues = z.infer<typeof businessTemplateSchema>;

interface BusinessTemplateEditorProps {
    initialData?: Partial<BusinessTemplateFormValues>;
    onSave: (data: BusinessTemplateFormValues) => void;
    onCancel: () => void;
    saving?: boolean;
    isNested?: boolean;
    hideIndustryFields?: boolean;
}

export function BusinessTemplateEditor({
    initialData,
    onSave,
    onCancel,
    saving = false,
    isNested = false,
    hideIndustryFields = false,
}: BusinessTemplateEditorProps) {
    const [activeTab, setActiveTab] = useState<'basic' | 'modules' | 'attributes' | 'seed' | 'review'>('basic');
    const [showJsonPreview, setShowJsonPreview] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState('');

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<BusinessTemplateFormValues>({
        resolver: zodResolver(businessTemplateSchema) as any,
        defaultValues: {
            industry: initialData?.industry || '',
            industryKey: initialData?.industryKey || '',
            key: initialData?.key || '',
            name: initialData?.name || '',
            icon: initialData?.icon || DEFAULT_ADMIN_ICON_KEY,
            description: initialData?.description || '',
            enabledModules: initialData?.enabledModules || [],
            featureFlags: (initialData?.featureFlags || {
                hasEcommerce: false,
                hasInvoicing: false,
                hasMarketing: false,
                hasInventory: false,
                hasBookingEngine: false,
            }) as Record<string, boolean>,
            attributePool: initialData?.attributePool || [],
            attributeSetPreset: Array.isArray(initialData?.attributeSetPreset) 
                ? initialData.attributeSetPreset.map(p => ({
                    key: p.key || `${initialData?.key || 'new'}-${p.name?.toLowerCase().replace(/\s+/g, '-') || 'core'}`,
                    name: p.name || 'Core Attributes',
                    appliesTo: p.appliesTo || 'product',
                    attributes: p.attributes || [],
                }))
                : [
                    {
                        key: (initialData?.attributeSetPreset as any)?.key || `${initialData?.key || 'new'}-core`,
                        name: (initialData?.attributeSetPreset as any)?.name || 'Core Attributes',
                        appliesTo: (initialData?.attributeSetPreset as any)?.appliesTo || 'product',
                        attributes: (initialData?.attributeSetPreset as any)?.attributes || [],
                    }
                ],
            categorySeedPreset: initialData?.categorySeedPreset || [],
            businessContexts: initialData?.businessContexts || [],
        },
    });

    const formValues = watch();

    const handleModuleToggle = (moduleKey: string) => {
        const currentModules = formValues.enabledModules || [];
        const nextModules = toggleModuleWithRules(currentModules, moduleKey);
        setValue('enabledModules', nextModules);

        // Sync feature flags based on modules
        const nextFlags = { ...formValues.featureFlags };
        if (moduleKey === 'ecommerce') nextFlags.hasEcommerce = nextModules.includes('ecommerce');
        if (moduleKey === 'invoicing') nextFlags.hasInvoicing = nextModules.includes('invoicing');
        if (moduleKey === 'marketing') nextFlags.hasMarketing = nextModules.includes('marketing');
        setValue('featureFlags', nextFlags);
    };

    const { fields: presetFields, append: appendPreset, remove: removePreset } = useFieldArray({
        control,
        name: 'attributeSetPreset',
    });

    const handleAttributesChange = (index: number, attributes: any[]) => {
        setValue(`attributeSetPreset.${index}.attributes` as any, attributes);
        
        // Flatten all attributes from all presets to sync attributePool
        const allAttributes = watch('attributeSetPreset').flatMap(p => p.attributes || []);
        setValue('attributePool', Array.from(new Set(allAttributes.map(a => a.key))));
    };

    const handleSeedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const seeds = e.target.value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        setValue('categorySeedPreset', seeds);
    };

    const exportJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formValues, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${formValues.key || 'business-template'}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportJson = () => {
        try {
            setImportError('');
            const parsed = JSON.parse(importJson);
            
            // If it's a full industry template
            if (parsed.industry && Array.isArray(parsed.businessTypes)) {
                setValue('industry', parsed.industry || formValues.industry);
                setValue('industryKey', parsed.industryKey || formValues.industryKey);
                setValue('icon', parsed.icon || formValues.icon);
                setValue('businessContexts', parsed.businessContexts || formValues.businessContexts);
                
                // If we are editing a specific business type, try to find it in the import
                if (formValues.key) {
                    const match = parsed.businessTypes.find((bt: any) => bt.key === formValues.key);
                    if (match) {
                        applyBusinessTypeData(match);
                    } else if (parsed.businessTypes.length === 1) {
                         applyBusinessTypeData(parsed.businessTypes[0]);
                    }
                } else if (parsed.businessTypes.length === 1) {
                    applyBusinessTypeData(parsed.businessTypes[0]);
                }
            } 
            // If it's a single business type object
            else if (parsed.name && (parsed.attributeSetPreset || parsed.enabledModules)) {
                applyBusinessTypeData(parsed);
            }
            else {
                throw new Error('Invalid JSON format. Expected an industry template or business type object.');
            }

            setShowImportModal(false);
            setImportJson('');
        } catch (err: any) {
            setImportError(err.message);
        }
    };

    const applyBusinessTypeData = (data: any) => {
        if (data.name) setValue('name', data.name);
        if (data.key) setValue('key', data.key);
        if (data.icon) setValue('icon', data.icon);
        if (data.description) setValue('description', data.description);
        if (Array.isArray(data.enabledModules)) setValue('enabledModules', data.enabledModules);
        if (data.featureFlags) setValue('featureFlags', data.featureFlags);
        if (Array.isArray(data.attributePool)) setValue('attributePool', data.attributePool);
        if (Array.isArray(data.attributeSetPreset)) setValue('attributeSetPreset', data.attributeSetPreset);
        if (Array.isArray(data.categorySeedPreset)) setValue('categorySeedPreset', data.categorySeedPreset);
        if (Array.isArray(data.businessContexts)) setValue('businessContexts', data.businessContexts);
    };

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: Info },
        { id: 'modules', label: 'Modules & Flags', icon: Boxes },
        { id: 'attributes', label: 'Attributes', icon: List },
        { id: 'seed', label: 'Seed Data', icon: Layers },
        { id: 'review', label: 'Review & Save', icon: Eye },
    ];

    const onFormSubmit = (data: BusinessTemplateFormValues) => {
        // Auto-generate businessContexts if not provided or to ensure they are correct
        const businessContexts = [data.key, data.industryKey];
        onSave({ 
            ...data, 
            businessContexts 
        } as any);
    };

    // Live sync with parent in nested mode
    useEffect(() => {
        if (isNested) {
            const subscription = watch((value) => {
                // Only sync if we have a valid key (or it's a new one being built)
                const businessContexts = [value.key || '', value.industryKey || ''];
                onSave({ ...value, businessContexts } as any);
            });
            return () => subscription.unsubscribe();
        }
    }, [watch, onSave, isNested]);

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className={`flex flex-col ${isNested ? 'w-full' : 'h-full overflow-hidden max-h-[calc(100vh-120px)] rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl'}`}>
            {/* Header */}
            {!isNested && (
                <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/60 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-cyan-400">
                            <Save size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                {initialData?.name ? `Edit ${initialData.name}` : 'Create Business Template'}
                            </h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                Registry • {formValues.industry || 'Unnamed Industry'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={exportJson}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-800 hover:text-slate-200 transition-all"
                        >
                            <Download size={14} /> Export JSON
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-bold hover:bg-cyan-500/10 transition-all"
                        >
                            <Upload size={14} /> Import JSON
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowJsonPreview(!showJsonPreview)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${showJsonPreview ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                            <Layers size={14} /> {showJsonPreview ? 'Hide JSON' : 'Preview JSON'}
                        </button>
                        <div className="h-6 w-px bg-slate-800 mx-1" />
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-slate-500 hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Import JSON Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <Upload size={18} className="text-cyan-400" />
                                <h3 className="text-sm font-bold text-white">Import Business Template JSON</h3>
                            </div>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-4">
                            <p className="text-xs text-slate-400">
                                Paste the JSON representation of an industry or a single business type below.
                            </p>
                            <textarea
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                className="flex-1 w-full bg-black/40 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-400/90 focus:border-cyan-500/40 outline-none resize-none min-h-[300px]"
                                placeholder='{ "name": "Real Estate", ... }'
                            />
                            {importError && (
                                <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase bg-rose-500/5 p-2 rounded border border-rose-500/20">
                                    <AlertCircle size={14} />
                                    {importError}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleImportJson}
                                className="px-6 py-2 rounded-xl bg-cyan-500 text-black text-xs font-black shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
                            >
                                Apply JSON
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex-1 flex overflow-hidden ${isNested ? 'flex-col overflow-y-auto' : ''}`}>
                {/* Sidebar Navigation - Only if not nested */}
                {!isNested && (
                    <div className="w-64 border-r border-slate-800 bg-slate-900/20 p-4 space-y-1 overflow-y-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                    {errors[tab.id as keyof typeof errors] && <AlertCircle size={14} className="ml-auto text-rose-500" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Content Area */}
                <div className={`flex-1 flex ${isNested ? 'flex-col' : 'overflow-hidden'}`}>
                    <div className={`flex-1 transition-all ${isNested ? 'p-8 space-y-12' : `p-6 overflow-y-auto ${showJsonPreview ? 'w-1/2' : 'w-full'}`}`}>
                        
                        {/* Section: Basic Info */}
                        {(activeTab === 'basic' || isNested) && (
                            <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-300">
                                {isNested && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <Info size={16} className="text-cyan-400" />
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Basic Configuration</h4>
                                    </div>
                                )}

                                {!hideIndustryFields && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Industry Name</label>
                                            <input
                                                {...register('industry')}
                                                className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none"
                                                placeholder="e.g. Retail & Commerce"
                                            />
                                            {errors.industry && <p className="text-[10px] text-rose-400 uppercase font-bold">{errors.industry.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Industry Key (Slug)</label>
                                            <input
                                                {...register('industryKey')}
                                                className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none font-mono"
                                                placeholder="retail-and-commerce"
                                            />
                                            {errors.industryKey && <p className="text-[10px] text-rose-400 uppercase font-bold">{errors.industryKey.message}</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Business Type Name</label>
                                        <input
                                            {...register('name')}
                                            className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none"
                                            placeholder="e.g. Fashion Apparel"
                                        />
                                        {errors.name && <p className="text-[10px] text-rose-400 uppercase font-bold">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Type Key (Slug)</label>
                                        <input
                                            {...register('key')}
                                            className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none font-mono"
                                            placeholder="fashion-apparel"
                                        />
                                        {errors.key && <p className="text-[10px] text-rose-400 uppercase font-bold">{errors.key.message}</p>}
                                    </div>
                                </div>

                                <AdminIconPicker
                                    value={formValues.icon || DEFAULT_ADMIN_ICON_KEY}
                                    onChange={(val) => setValue('icon', val)}
                                    label="Business Icon"
                                />

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Description</label>
                                    <textarea
                                        {...register('description')}
                                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none min-h-[100px]"
                                        placeholder="Briefly describe this business type..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Section: Modules & Flags */}
                        {(activeTab === 'modules' || isNested) && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                {isNested && (
                                    <div className="flex items-center gap-2 mt-8 mb-4">
                                        <Boxes size={16} className="text-cyan-400" />
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Modules & Feature Flags</h4>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Enabled Modules</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {TEMPLATE_MODULE_OPTIONS.map(module => {
                                            const active = formValues.enabledModules.includes(module.key);
                                            return (
                                                <button
                                                    key={module.key}
                                                    type="button"
                                                    onClick={() => handleModuleToggle(module.key)}
                                                    className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${active ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                                >
                                                    <span className="text-[10px] font-bold">{module.label}</span>
                                                    {active && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Feature Flags</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            'hasBookingEngine', 
                                            'hasEcommerce', 
                                            'hasInvoicing', 
                                            'hasMarketing', 
                                            'hasPortfolio', 
                                            'hasInventory'
                                        ].map((flag) => {
                                            const val = formValues.featureFlags?.[flag as keyof typeof formValues.featureFlags] || false;
                                            return (
                                                <div key={flag} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-black/20 group hover:border-slate-700 transition-all">
                                                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200">{flag}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue(`featureFlags.${flag}` as any, !val)}
                                                        className={`w-10 h-5 rounded-full transition-all relative ${val ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800'}`}
                                                    >
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${val ? 'right-1' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section: Attributes */}
                        {(activeTab === 'attributes' || isNested) && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-8">
                                {isNested && (
                                    <div className="flex items-center gap-2 mt-8 mb-6">
                                        <List size={16} className="text-cyan-400" />
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Business Attribute Sets</h4>
                                    </div>
                                )}
                                
                                {presetFields.map((field, index) => (
                                    <div key={field.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-6 relative group/preset">
                                        <button
                                            type="button"
                                            onClick={() => removePreset(index)}
                                            className="absolute top-4 right-4 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover/preset:opacity-100"
                                        >
                                            <X size={16} />
                                        </button>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Set Name</label>
                                                <input
                                                    {...register(`attributeSetPreset.${index}.name` as const)}
                                                    className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none"
                                                    placeholder="e.g. Dimensions & Weight"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Internal Key</label>
                                                <input
                                                    {...register(`attributeSetPreset.${index}.key` as const)}
                                                    className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none font-mono"
                                                    placeholder="dimensions-weight"
                                                />
                                            </div>
                                        </div>

                                        <SmartAttributeBuilder
                                            value={watch(`attributeSetPreset.${index}.attributes`) || []}
                                            onChange={(attrs) => handleAttributesChange(index, attrs)}
                                        />
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => appendPreset({
                                        name: 'New Attribute Set',
                                        key: `set-${Date.now()}`,
                                        appliesTo: 'product',
                                        attributes: []
                                    })}
                                    className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:border-slate-700 hover:text-slate-400 hover:bg-slate-800/20 transition-all flex items-center justify-center gap-2 font-bold text-xs"
                                >
                                    <List size={16} /> Add Another Attribute Set
                                </button>
                            </div>
                        )}

                        {/* Section: Seed Data */}
                        {(activeTab === 'seed' || isNested) && (
                            <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-300">
                                {isNested && (
                                    <div className="flex items-center gap-2 mt-8 mb-4">
                                        <Layers size={16} className="text-cyan-400" />
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Seed Data & Presets</h4>
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Category Seed Preset (comma separated)</label>
                                    <textarea
                                        value={formValues.categorySeedPreset?.join(', ') || ''}
                                        onChange={handleSeedChange}
                                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none min-h-[120px] font-mono"
                                        placeholder="Residential, Commercial, Corporate, Retail..."
                                    />
                                    <p className="text-[10px] text-slate-500">These categories will be pre-created when a tenant uses this template.</p>
                                </div>
                            </div>
                        )}

                        {/* Section: Review (Only if not nested) */}
                        {!isNested && activeTab === 'review' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/40">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                                        <Eye size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ready to save?</h3>
                                    <p className="text-sm text-slate-400 mb-6">You've configured {formValues.enabledModules.length} modules and {formValues.attributePool.length} attributes for {formValues.name}.</p>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border border-slate-800 bg-black/20">
                                        <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Attributes Overview</h4>
                                        <ul className="space-y-1">
                                            {formValues.attributePool.slice(0, 10).map(key => (
                                                <li key={key} className="text-[10px] font-mono text-cyan-400/70">{key}</li>
                                            ))}
                                            {formValues.attributePool.length > 10 && <li className="text-[10px] text-slate-600">...and {formValues.attributePool.length - 10} more</li>}
                                        </ul>
                                    </div>
                                    <div className="p-4 rounded-xl border border-slate-800 bg-black/20">
                                        <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Modules Overview</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formValues.enabledModules.map(m => (
                                                <span key={m} className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[9px] text-slate-400 uppercase font-bold">{m}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Buffer space for scrolling */}
                        {isNested && <div className="h-20" />}
                    </div>

                    {!isNested && showJsonPreview && (
                        <div className="w-1/2 border-l border-slate-800 bg-black overflow-hidden flex flex-col animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">live_json_preview</span>
                                <code className="text-[9px] text-cyan-500 font-mono italic">read-only</code>
                            </div>
                            <pre className="flex-1 overflow-auto p-4 text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                                {JSON.stringify(formValues, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Mobile Nav could go here if needed, but sidebar is enough */}
        </form>
    );
}
