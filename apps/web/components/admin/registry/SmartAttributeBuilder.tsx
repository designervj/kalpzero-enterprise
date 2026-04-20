'use client';

import { Plus, Trash2, GripVertical, X, Edit2, Check, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AttributeOption {
    label: string;
    value: string;
}

interface Attribute {
    key: string;
    label: string;
    type: 'text' | 'select' | 'boolean' | 'number';
    options?: string[];
    hint?: string;
    required?: boolean;
}

interface SmartAttributeBuilderProps {
    value: Attribute[];
    onChange: (value: Attribute[]) => void;
}

export function SmartAttributeBuilder({ value, onChange }: SmartAttributeBuilderProps) {
    const [attributes, setAttributes] = useState<Attribute[]>(value || []);

    useEffect(() => {
        setAttributes(value || []);
    }, [value]);

    const generateKey = (label: string) => {
        return label.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const addAttribute = () => {
        const newAttr: Attribute = {
            key: `new-attribute-${attributes.length + 1}`,
            label: 'New Attribute',
            type: 'text',
            options: [],
        };
        const next = [...attributes, newAttr];
        setAttributes(next);
        onChange(next);
    };

    const removeAttribute = (index: number) => {
        const next = attributes.filter((_, i) => i !== index);
        setAttributes(next);
        onChange(next);
    };

    const updateAttribute = (index: number, updates: Partial<Attribute>) => {
        const next = [...attributes];
        const updated = { ...next[index], ...updates };
        
        // Auto-generate key from label if label changed
        if (updates.label !== undefined) {
            updated.key = generateKey(updates.label);
        }
        
        next[index] = updated;
        setAttributes(next);
        onChange(next);
    };

    const handleOptionsChange = (index: number, optionsString: string) => {
        const options = optionsString.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        updateAttribute(index, { options, hint: options.join('; ') });
    };

    const moveAttribute = (index: number, direction: 'up' | 'down') => {
        const next = [...attributes];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return;
        
        const temp = next[index];
        next[index] = next[targetIndex];
        next[targetIndex] = temp;
        
        setAttributes(next);
        onChange(next);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Attributes ({attributes.length})</h3>
                <button
                    type="button"
                    onClick={addAttribute}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-[11px] font-bold hover:bg-cyan-500/20 transition-all"
                >
                    <Plus size={14} /> Add Attribute
                </button>
            </div>

            <div className="space-y-3">
                {attributes.map((attr, idx) => (
                    <div key={idx} className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-slate-700/60 hover:bg-slate-900/60">
                        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_120px_1fr_auto] gap-4 items-start">
                            <div className="flex flex-col gap-1 pt-6">
                                <button
                                    type="button"
                                    onClick={() => moveAttribute(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 text-slate-600 hover:text-cyan-400 disabled:opacity-0 transition-all"
                                >
                                    <ChevronDown className="rotate-180" size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveAttribute(idx, 'down')}
                                    disabled={idx === attributes.length - 1}
                                    className="p-1 text-slate-600 hover:text-cyan-400 disabled:opacity-0 transition-all"
                                >
                                    <ChevronDown size={14} />
                                </button>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Label</label>
                                <input
                                    value={attr.label}
                                    onChange={(e) => updateAttribute(idx, { label: e.target.value })}
                                    className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:border-cyan-500/50 outline-none"
                                    placeholder="Attribute Label"
                                />
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[10px] text-slate-600 font-mono">Key:</span>
                                    <code className="text-[10px] text-cyan-500/70 font-mono">{attr.key}</code>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Type</label>
                                <select
                                    value={attr.type}
                                    onChange={(e) => updateAttribute(idx, { type: e.target.value as any })}
                                    className="w-full bg-black/40 border border-slate-800 rounded px-2 py-2 text-xs text-white focus:border-cyan-500/50 outline-none appearance-none"
                                >
                                    <option value="text">Text</option>
                                    <option value="select">Select</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="number">Number</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                {attr.type === 'select' ? (
                                    <>
                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Options (comma separated)</label>
                                        <textarea
                                            value={attr.options?.join(', ') || ''}
                                            onChange={(e) => handleOptionsChange(idx, e.target.value)}
                                            className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:border-cyan-500/50 outline-none min-h-[60px]"
                                            placeholder="Small, Medium, Large"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Hint / Placeholder</label>
                                        <input
                                            value={attr.hint || ''}
                                            onChange={(e) => updateAttribute(idx, { hint: e.target.value })}
                                            className="w-full bg-black/40 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:border-cyan-500/50 outline-none"
                                            placeholder="e.g. Dimensions L x W x H"
                                        />
                                    </>
                                )}
                            </div>

                            <div className="flex items-center pt-6">
                                <button
                                    type="button"
                                    onClick={() => removeAttribute(idx)}
                                    className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {attributes.length === 0 && (
                    <div className="py-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
                        <p className="text-xs text-slate-500">No attributes defined. Click "Add Attribute" to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
