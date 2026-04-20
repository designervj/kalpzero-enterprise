'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Trash2, Pencil, Save, X, Layers, ListChecks, Tag, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';

type FormType = 'simple' | 'subscription' | 'multi_step';
type FieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';

type FormField = {
    id: string;
    label: string;
    name: string;
    type: FieldType;
    required: boolean;
    options?: string[];
};

type FormStep = {
    id: string;
    title: string;
    fields: FormField[];
};

type FormUsagePolicy = {
    acceptSubmissions: boolean;
    allowAnonymous: boolean;
    collectAttribution: boolean;
    dedupeByEmail: boolean;
    dedupeWindowHours: number;
    allowedSurfaces: string[];
};

type FormAnalytics = {
    submissionsTotal?: number;
    submissionsLast7Days?: number;
    submissionsLast30Days?: number;
    lastSubmittedAt?: string | null;
    lastSubmittedSurface?: string | null;
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
];

const FORM_TEMPLATES = [
    { key: 'glass', label: 'Glass' },
    { key: 'minimal', label: 'Minimal' },
    { key: 'split', label: 'Split' },
];

const EMPTY_FIELD: FormField = {
    id: '',
    label: '',
    name: '',
    type: 'text',
    required: false,
    options: [],
};

const DEFAULT_USAGE_POLICY: FormUsagePolicy = {
    acceptSubmissions: true,
    allowAnonymous: true,
    collectAttribution: true,
    dedupeByEmail: false,
    dedupeWindowHours: 24,
    allowedSurfaces: ['website', 'landing', 'checkout', 'manual'],
};

function normalizeSurface(input: string): string {
    return input.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

export default function FormsPage() {
    const { currentProfile, isScopedRoleView } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const [forms, setForms] = useState<Array<Record<string, unknown>>>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formType, setFormType] = useState<FormType>('simple');
    const [formMeta, setFormMeta] = useState({ title: '', slug: '', status: 'draft', templateKey: 'glass', description: '' });
    const [fields, setFields] = useState<FormField[]>([]);
    const [steps, setSteps] = useState<FormStep[]>([]);
    const [fieldDraft, setFieldDraft] = useState<FormField>(EMPTY_FIELD);
    const [optionDraft, setOptionDraft] = useState('');
    const [stepTitle, setStepTitle] = useState('');
    const [activeStepId, setActiveStepId] = useState<string | null>(null);
    const [usagePolicy, setUsagePolicy] = useState<FormUsagePolicy>(DEFAULT_USAGE_POLICY);
    const [surfaceDraft, setSurfaceDraft] = useState('');

    const fetchForms = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/forms?${params}`);
        const data = await res.json();
        if (Array.isArray(data)) setForms(data);
        setLoading(false);
    };

    useEffect(() => { fetchForms(); }, [statusFilter]);

    useEffect(() => {
        if (formType !== 'subscription') return;
        if (fields.length > 0 || steps.length > 0) return;
        setFields([
            {
                id: crypto.randomUUID(),
                label: 'Email',
                name: 'email',
                type: 'email',
                required: true,
                options: [],
            },
            {
                id: crypto.randomUUID(),
                label: 'Full Name',
                name: 'full_name',
                type: 'text',
                required: false,
                options: [],
            },
        ]);
    }, [formType, fields.length, steps.length]);

    useEffect(() => {
        if (formType !== 'multi_step') {
            setActiveStepId(null);
            return;
        }
        if (steps.length === 0) {
            setActiveStepId(null);
            return;
        }
        const exists = steps.some(step => step.id === activeStepId);
        if (!exists) {
            setActiveStepId(steps[0].id);
        }
    }, [formType, steps, activeStepId]);

    useEffect(() => {
        if (!canMutate && showForm) {
            setShowForm(false);
        }
    }, [canMutate, showForm]);

    const resetForm = () => {
        setFormMeta({ title: '', slug: '', status: 'draft', templateKey: 'glass', description: '' });
        setFormType('simple');
        setFields([]);
        setSteps([]);
        setFieldDraft(EMPTY_FIELD);
        setOptionDraft('');
        setUsagePolicy(DEFAULT_USAGE_POLICY);
        setSurfaceDraft('');
        setStepTitle('');
        setActiveStepId(null);
        setEditingId(null);
        setShowForm(false);
    };

    const slugFromTitle = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const addField = (target: 'simple' | 'step', stepId?: string) => {
        const baseLabel = fieldDraft.label.trim();
        if (!baseLabel) return;
        const id = crypto.randomUUID();
        const name = fieldDraft.name.trim() || slugFromTitle(baseLabel).replace(/-/g, '_');
        const nextField: FormField = {
            ...fieldDraft,
            id,
            name,
            label: baseLabel,
            options: fieldDraft.type === 'select' || fieldDraft.type === 'checkbox'
                ? (fieldDraft.options || []).filter(Boolean)
                : [],
        };

        if (target === 'simple') {
            setFields(prev => [...prev, nextField]);
        } else if (stepId) {
            setSteps(prev => prev.map(step => step.id === stepId ? { ...step, fields: [...step.fields, nextField] } : step));
        }

        setFieldDraft(EMPTY_FIELD);
        setOptionDraft('');
    };

    const removeField = (target: 'simple' | 'step', id: string, stepId?: string) => {
        if (target === 'simple') {
            setFields(prev => prev.filter(field => field.id !== id));
        } else if (stepId) {
            setSteps(prev => prev.map(step => step.id === stepId ? { ...step, fields: step.fields.filter(field => field.id !== id) } : step));
        }
    };

    const addStep = () => {
        const title = stepTitle.trim();
        if (!title) return;
        setSteps(prev => [...prev, { id: crypto.randomUUID(), title, fields: [] }]);
        setStepTitle('');
    };

    const addOption = () => {
        const next = optionDraft.trim();
        if (!next) return;
        setFieldDraft(prev => ({ ...prev, options: [...(prev.options || []), next] }));
        setOptionDraft('');
    };

    const removeOption = (value: string) => {
        setFieldDraft(prev => ({ ...prev, options: (prev.options || []).filter(opt => opt !== value) }));
    };

    const removeStep = (id: string) => {
        setSteps(prev => prev.filter(step => step.id !== id));
    };

    const moveStep = (id: string, direction: 'up' | 'down') => {
        setSteps(prev => {
            const idx = prev.findIndex(step => step.id === id);
            if (idx === -1) return prev;
            const nextIndex = direction === 'up' ? idx - 1 : idx + 1;
            if (nextIndex < 0 || nextIndex >= prev.length) return prev;
            const copy = [...prev];
            const [item] = copy.splice(idx, 1);
            copy.splice(nextIndex, 0, item);
            return copy;
        });
    };

    const moveFieldInPool = (id: string, direction: 'up' | 'down') => {
        setFields(prev => {
            const idx = prev.findIndex(field => field.id === id);
            if (idx === -1) return prev;
            const nextIndex = direction === 'up' ? idx - 1 : idx + 1;
            if (nextIndex < 0 || nextIndex >= prev.length) return prev;
            const copy = [...prev];
            const [item] = copy.splice(idx, 1);
            copy.splice(nextIndex, 0, item);
            return copy;
        });
    };

    const moveFieldInStep = (stepId: string, fieldId: string, direction: 'up' | 'down') => {
        setSteps(prev => prev.map(step => {
            if (step.id !== stepId) return step;
            const idx = step.fields.findIndex(field => field.id === fieldId);
            if (idx === -1) return step;
            const nextIndex = direction === 'up' ? idx - 1 : idx + 1;
            if (nextIndex < 0 || nextIndex >= step.fields.length) return step;
            const copy = [...step.fields];
            const [item] = copy.splice(idx, 1);
            copy.splice(nextIndex, 0, item);
            return { ...step, fields: copy };
        }));
    };

    const assignFieldToStep = (fieldId: string, stepId: string) => {
        const field = fields.find(item => item.id === fieldId);
        if (!field) return;
        setFields(prev => prev.filter(item => item.id !== fieldId));
        setSteps(prev => prev.map(step => step.id === stepId ? { ...step, fields: [...step.fields, field] } : step));
    };

    const moveFieldToPool = (stepId: string, fieldId: string) => {
        let extracted: FormField | null = null;
        setSteps(prev => prev.map(step => {
            if (step.id !== stepId) return step;
            const nextFields = step.fields.filter(field => {
                if (field.id === fieldId) {
                    extracted = field;
                    return false;
                }
                return true;
            });
            return { ...step, fields: nextFields };
        }));
        if (extracted) {
            setFields(prev => [...prev, extracted as FormField]);
        }
    };

    const addSurface = () => {
        const normalized = normalizeSurface(surfaceDraft);
        if (!normalized) return;
        setUsagePolicy(prev => ({
            ...prev,
            allowedSurfaces: Array.from(new Set([...(prev.allowedSurfaces || []), normalized])),
        }));
        setSurfaceDraft('');
    };

    const removeSurface = (surface: string) => {
        setUsagePolicy(prev => ({
            ...prev,
            allowedSurfaces: (prev.allowedSurfaces || []).filter(item => item !== surface),
        }));
    };

    const handleSubmit = async () => {
        if (!canMutate) return;
        const payload = {
            title: formMeta.title,
            slug: formMeta.slug || slugFromTitle(formMeta.title),
            status: formMeta.status,
            type: formType,
            fields,
            steps,
            templateKey: formMeta.templateKey,
            description: formMeta.description,
            usagePolicy,
            surfaceBindings: usagePolicy.allowedSurfaces,
        };

        if (editingId) {
            await fetch(`/api/forms/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        resetForm();
        fetchForms();
    };

    const handleEdit = (item: Record<string, unknown>) => {
        if (!canMutate) return;
        const recordId = typeof item._id === 'string' ? item._id : '';
        if (!recordId) return;
        setEditingId(recordId);
        setFormMeta({
            title: typeof item.title === 'string' ? item.title : '',
            slug: typeof item.slug === 'string' ? item.slug : '',
            status: typeof item.status === 'string' ? item.status : 'draft',
            templateKey: typeof item.templateKey === 'string' ? item.templateKey : 'glass',
            description: typeof item.description === 'string' ? item.description : '',
        });
        setFormType(typeof item.type === 'string' ? item.type as FormType : 'simple');
        setFields(Array.isArray(item.fields) ? item.fields as FormField[] : []);
        setSteps(Array.isArray(item.steps) ? item.steps as FormStep[] : []);
        const rawPolicy = item.usagePolicy && typeof item.usagePolicy === 'object'
            ? item.usagePolicy as Partial<FormUsagePolicy>
            : {};
        const normalizedSurfaces = Array.isArray(rawPolicy.allowedSurfaces)
            ? rawPolicy.allowedSurfaces.filter((surface): surface is string => typeof surface === 'string').map(surface => normalizeSurface(surface)).filter(Boolean)
            : [];
        setUsagePolicy({
            acceptSubmissions: typeof rawPolicy.acceptSubmissions === 'boolean' ? rawPolicy.acceptSubmissions : DEFAULT_USAGE_POLICY.acceptSubmissions,
            allowAnonymous: typeof rawPolicy.allowAnonymous === 'boolean' ? rawPolicy.allowAnonymous : DEFAULT_USAGE_POLICY.allowAnonymous,
            collectAttribution: typeof rawPolicy.collectAttribution === 'boolean' ? rawPolicy.collectAttribution : DEFAULT_USAGE_POLICY.collectAttribution,
            dedupeByEmail: typeof rawPolicy.dedupeByEmail === 'boolean' ? rawPolicy.dedupeByEmail : DEFAULT_USAGE_POLICY.dedupeByEmail,
            dedupeWindowHours: typeof rawPolicy.dedupeWindowHours === 'number' ? rawPolicy.dedupeWindowHours : DEFAULT_USAGE_POLICY.dedupeWindowHours,
            allowedSurfaces: normalizedSurfaces.length > 0 ? normalizedSurfaces : DEFAULT_USAGE_POLICY.allowedSurfaces,
        });
        setSurfaceDraft('');
        if (Array.isArray(item.steps) && item.steps.length > 0) {
            const firstStep = item.steps[0] as { id?: unknown };
            setActiveStepId(typeof firstStep.id === 'string' ? firstStep.id : null);
        } else {
            setActiveStepId(null);
        }
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!canMutate) return;
        if (!id) return;
        if (!confirm('Delete this form?')) return;
        await fetch(`/api/forms/${id}`, { method: 'DELETE' });
        fetchForms();
    };

    const handleDuplicate = async (id: string) => {
        if (!canMutate) return;
        if (!id) return;
        await fetch(`/api/forms/${id}/duplicate`, { method: 'POST' });
        fetchForms();
    };

    const handlePreview = (id: string) => {
        if (!id) return;
        window.open(`/forms/preview/${id}`, '_blank', 'noopener,noreferrer');
    };

    const handleResponses = (id: string) => {
        if (!id) return;
        window.open(`/forms/${id}/responses`, '_blank', 'noopener,noreferrer');
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return forms;
        const query = search.toLowerCase();
        return forms.filter((item) => {
            const title = typeof item?.title === 'string' ? item.title.toLowerCase() : '';
            const slug = typeof item?.slug === 'string' ? item.slug.toLowerCase() : '';
            return title.includes(query) || slug.includes(query);
        });
    }, [forms, search]);

    const activeStepIndex = steps.findIndex(step => step.id === activeStepId);
    const activeStep = activeStepIndex >= 0 ? steps[activeStepIndex] : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!canMutate && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {isScopedRoleView ? 'Scoped role view is read-only. Switch role to create or modify forms.' : 'This role is read-only for form mutations.'}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                        <FileText size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Forms</h2>
                        <p className="text-slate-400 text-xs font-mono">{forms.length} forms • builder</p>
                    </div>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    disabled={!canMutate}
                >
                    <Plus size={16} /> New Form
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 max-w-sm">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search forms..."
                    />
                </div>
                {['', 'published', 'draft', 'archived'].map((status) => (
                    <button
                        key={status || 'all'}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${statusFilter === status ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}
                    >
                        {status || 'All'}
                    </button>
                ))}
            </div>

            {showForm && (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold">{editingId ? 'Edit Form' : 'Create Form'}</h3>
                        <button onClick={resetForm} className="text-slate-500 hover:text-white"><X size={18} /></button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="mb-1">Title</Label>
                            <Input
                                type="text"
                                value={formMeta.title}
                                onChange={(event) => setFormMeta(prev => ({ ...prev, title: event.target.value }))}
                                placeholder="Contact Form"
                            />
                        </div>
                        <div>
                            <Label className="mb-1">Slug</Label>
                            <Input
                                type="text"
                                value={formMeta.slug}
                                onChange={(event) => setFormMeta(prev => ({ ...prev, slug: event.target.value }))}
                                placeholder="contact-form"
                            />
                        </div>
                        <div>
                            <Label className="mb-1">Type</Label>
                            <Select
                                value={formType}
                                onChange={(event) => {
                                    const nextType = event.target.value as FormType;
                                    setFormType(nextType);
                                    if (nextType !== 'multi_step') setSteps([]);
                                }}
                            >
                                <option value="simple">Simple Form</option>
                                <option value="subscription">Subscription Form</option>
                                <option value="multi_step">Multi Step Form</option>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="mb-1">Status</Label>
                            <Select
                                value={formMeta.status}
                                onChange={(event) => setFormMeta(prev => ({ ...prev, status: event.target.value }))}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1">Template</Label>
                            <Select
                                value={formMeta.templateKey}
                                onChange={(event) => setFormMeta(prev => ({ ...prev, templateKey: event.target.value }))}
                            >
                                {FORM_TEMPLATES.map((tpl) => (
                                    <option key={tpl.key} value={tpl.key}>{tpl.label}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="mb-1">Description</Label>
                        <Textarea
                            value={formMeta.description}
                            onChange={(event) => setFormMeta(prev => ({ ...prev, description: event.target.value }))}
                            placeholder="Explain when this form is used and where it appears."
                        />
                    </div>

                    <div className="border border-slate-800 rounded-xl p-4 space-y-4 bg-slate-950/40">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Layers size={16} className="text-cyan-400" />
                            <span>Fields</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <Input
                                value={fieldDraft.label}
                                onChange={(event) => setFieldDraft(prev => ({ ...prev, label: event.target.value }))}
                                placeholder="Field label"
                            />
                            <Input
                                value={fieldDraft.name}
                                onChange={(event) => setFieldDraft(prev => ({ ...prev, name: event.target.value }))}
                                placeholder="Field name"
                            />
                            <Select
                                value={fieldDraft.type}
                                onChange={(event) => {
                                    const nextType = event.target.value as FieldType;
                                    setFieldDraft(prev => ({
                                        ...prev,
                                        type: nextType,
                                        options: nextType === 'select' || nextType === 'checkbox' ? prev.options : [],
                                    }));
                                    if (nextType !== 'select' && nextType !== 'checkbox') {
                                        setOptionDraft('');
                                    }
                                }}
                            >
                                {FIELD_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </Select>
                        </div>

                        {(fieldDraft.type === 'select' || fieldDraft.type === 'checkbox') && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={optionDraft}
                                        onChange={(event) => setOptionDraft(event.target.value)}
                                        placeholder="Add option"
                                    />
                                    <Button variant="secondary" size="sm" onClick={addOption}>
                                        <Tag size={12} /> Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(fieldDraft.options || []).map((opt) => (
                                        <Badge key={opt} className="gap-2 normal-case tracking-normal">
                                            {opt}
                                            <button onClick={() => removeOption(opt)} className="text-slate-400 hover:text-rose-400">×</button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={fieldDraft.required}
                                    onChange={(event) => setFieldDraft(prev => ({ ...prev, required: event.target.checked }))}
                                />
                                Required
                            </label>
                            <Button variant="secondary" size="sm" onClick={() => addField('simple')}>
                                {formType === 'multi_step' ? 'Add to Library' : 'Add Field'}
                            </Button>
                        </div>

                        {formType === 'multi_step' && (
                            <div className="border-t border-slate-800 pt-4 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <Layers size={16} className="text-cyan-400" />
                                            <span>Field Library</span>
                                        </div>
                                        {fields.length === 0 ? (
                                            <div className="text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg px-3 py-4">
                                                Add fields above to build your library. Assign them to steps below.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {fields.map((field) => (
                                                    <div key={field.id} className="border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-slate-400">
                                                        <div>
                                                            <div className="text-slate-200">{field.label}</div>
                                                            <div className="text-[10px] uppercase tracking-widest">{field.type}{field.required ? ' · required' : ''}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Select
                                                                value=""
                                                                onChange={(event) => {
                                                                    if (event.target.value) {
                                                                        assignFieldToStep(field.id, event.target.value);
                                                                    }
                                                                }}
                                                                className="h-8 text-xs"
                                                            >
                                                                <option value="">Assign step</option>
                                                                {steps.map((step) => (
                                                                    <option key={step.id} value={step.id}>{step.title}</option>
                                                                ))}
                                                            </Select>
                                                            <Button variant="ghost" size="sm" onClick={() => moveFieldInPool(field.id, 'up')}>↑</Button>
                                                            <Button variant="ghost" size="sm" onClick={() => moveFieldInPool(field.id, 'down')}>↓</Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <ListChecks size={16} className="text-emerald-400" />
                                            <span>Steps</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={stepTitle}
                                                onChange={(event) => setStepTitle(event.target.value)}
                                                placeholder="Step title"
                                            />
                                            <Button onClick={addStep} size="sm">Add Step</Button>
                                        </div>
                                        {steps.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Button variant="secondary" size="sm" onClick={() => {
                                                    if (activeStepIndex > 0) setActiveStepId(steps[activeStepIndex - 1].id);
                                                }}>
                                                    Prev
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={() => {
                                                    if (activeStepIndex < steps.length - 1) setActiveStepId(steps[activeStepIndex + 1].id);
                                                }}>
                                                    Next
                                                </Button>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {steps.map((step) => (
                                                <div key={step.id} className={`border rounded-lg px-3 py-2 text-xs flex items-center justify-between ${step.id === activeStepId ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-slate-800'}`}>
                                                    <button onClick={() => setActiveStepId(step.id)} className="text-left flex-1">
                                                        <div className="text-slate-200 font-semibold">{step.title}</div>
                                                        <div className="text-[10px] text-slate-500">{step.fields.length} fields</div>
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => moveStep(step.id, 'up')}>↑</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => moveStep(step.id, 'down')}>↓</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}>
                                                            <Trash2 size={12} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {activeStep && (
                                            <div className="border border-slate-800 rounded-lg p-3 space-y-2">
                                                <div className="text-sm text-slate-200 font-semibold">Active Step: {activeStep.title}</div>
                                                {activeStep.fields.length === 0 ? (
                                                    <div className="text-xs text-slate-500">Assign fields from the library.</div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {activeStep.fields.map((field) => (
                                                            <div key={field.id} className="flex items-center justify-between text-xs text-slate-400 border border-slate-800 rounded-lg px-3 py-2">
                                                                <span>{field.label} · {field.type} {field.required ? '(required)' : ''}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Button variant="ghost" size="sm" onClick={() => moveFieldInStep(activeStep.id, field.id, 'up')}>↑</Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => moveFieldInStep(activeStep.id, field.id, 'down')}>↓</Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => moveFieldToPool(activeStep.id, field.id)}>
                                                                        <Trash2 size={12} />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {formType !== 'multi_step' && (
                        <div className="space-y-2">
                            {fields.map((field) => (
                                <div key={field.id} className="flex items-center justify-between text-xs text-slate-400 border border-slate-800 rounded-lg px-3 py-2">
                                    <span>{field.label} · {field.type} {field.required ? '(required)' : ''}</span>
                                    <button onClick={() => removeField('simple', field.id)} className="text-slate-500 hover:text-rose-400">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <BarChart3 size={16} className="text-cyan-400" />
                            <span>Submission Policy</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={usagePolicy.acceptSubmissions}
                                    onChange={(event) => setUsagePolicy(prev => ({ ...prev, acceptSubmissions: event.target.checked }))}
                                />
                                Accept submissions
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={usagePolicy.allowAnonymous}
                                    onChange={(event) => setUsagePolicy(prev => ({ ...prev, allowAnonymous: event.target.checked }))}
                                />
                                Allow anonymous submissions
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={usagePolicy.collectAttribution}
                                    onChange={(event) => setUsagePolicy(prev => ({ ...prev, collectAttribution: event.target.checked }))}
                                />
                                Collect attribution metadata
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={usagePolicy.dedupeByEmail}
                                    onChange={(event) => setUsagePolicy(prev => ({ ...prev, dedupeByEmail: event.target.checked }))}
                                />
                                Dedupe by email
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                            <div>
                                <Label className="mb-1">Dedupe Window (Hours)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={720}
                                    value={usagePolicy.dedupeWindowHours}
                                    onChange={(event) => {
                                        const value = parseInt(event.target.value || '24', 10);
                                        setUsagePolicy(prev => ({ ...prev, dedupeWindowHours: Number.isNaN(value) ? 24 : Math.max(1, Math.min(720, value)) }));
                                    }}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label className="mb-1">Allowed Surfaces</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={surfaceDraft}
                                        onChange={(event) => setSurfaceDraft(event.target.value)}
                                        placeholder="website / landing / checkout / manual"
                                    />
                                    <Button type="button" size="sm" variant="secondary" onClick={addSurface}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {usagePolicy.allowedSurfaces.map((surface) => (
                                        <Badge key={surface} className="gap-2 normal-case tracking-normal">
                                            {surface}
                                            <button type="button" onClick={() => removeSurface(surface)} className="text-slate-400 hover:text-rose-400">×</button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleSubmit} variant="default" disabled={!canMutate}>
                        <Save size={14} /> {editingId ? 'Update Form' : 'Create Form'}
                    </Button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">No forms yet. Create your first form.</div>
            ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Form</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Fields</TableHead>
                                <TableHead>Submissions</TableHead>
                                <TableHead>Reuse</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((item) => {
                                const record = item as Record<string, unknown>;
                                const formId = typeof record._id === 'string' ? record._id : '';
                                const type = typeof record.type === 'string' ? record.type : 'simple';
                                const status = typeof record.status === 'string' ? record.status : 'draft';
                                const title = typeof record.title === 'string' ? record.title : 'Untitled Form';
                                const slug = typeof record.slug === 'string' ? record.slug : '';
                                const fieldsCount = type === 'multi_step'
                                    ? (Array.isArray(record.steps) ? record.steps.length : 0)
                                    : (Array.isArray(record.fields) ? record.fields.length : 0);
                                const analytics = (record.analytics && typeof record.analytics === 'object'
                                    ? record.analytics
                                    : {}) as FormAnalytics;
                                const usage = (record.usagePolicy && typeof record.usagePolicy === 'object'
                                    ? record.usagePolicy
                                    : {}) as Partial<FormUsagePolicy>;
                                const submissionsTotal = typeof analytics.submissionsTotal === 'number' ? analytics.submissionsTotal : 0;
                                const lastSubmitted = analytics.lastSubmittedAt ? new Date(analytics.lastSubmittedAt).toLocaleDateString() : 'Never';
                                const surfaceCount = Array.isArray(usage.allowedSurfaces) ? usage.allowedSurfaces.length : 0;

                                return (
                                <TableRow key={formId}>
                                    <TableCell className="text-white font-semibold">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                                <FileText size={16} />
                                            </div>
                                            <div>
                                                <div>{title}</div>
                                                <div className="text-xs text-slate-500 font-mono">/{slug}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="uppercase text-xs text-slate-400">{type}</TableCell>
                                    <TableCell>
                                        <Badge>{status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-xs">
                                        {fieldsCount}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400">
                                        <div>{submissionsTotal}</div>
                                        <div className="text-[10px] text-slate-600">{lastSubmitted}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400">
                                        <div>{surfaceCount} surfaces</div>
                                        <div className="text-[10px] text-slate-600">{usage.dedupeByEmail ? 'dedupe:on' : 'dedupe:off'}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handlePreview(formId)}>
                                                View
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleResponses(formId)}>
                                                Responses
                                            </Button>
                                            {canMutate && (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(formId)}>
                                                        Duplicate
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(formId)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
