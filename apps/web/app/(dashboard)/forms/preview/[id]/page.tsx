import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { getTenantDb } from '@/lib/db';

type FormField = {
    id: string;
    label: string;
    name: string;
    type: string;
    required?: boolean;
    options?: string[];
};

type FormStep = {
    id: string;
    title: string;
    fields: FormField[];
};

type FormRecord = {
    title?: string;
    description?: string;
    type?: string;
    templateKey?: string;
    fields?: FormField[];
    steps?: FormStep[];
};

function renderField(field: FormField) {
    const common = 'w-full rounded-lg border border-slate-800 bg-black/40 px-3 py-2 text-sm text-slate-200';
    if (field.type === 'textarea') {
        return <textarea className={common} placeholder={field.label} rows={4} disabled />;
    }
    if (field.type === 'select') {
        return (
            <select className={common} disabled>
                <option>{field.label}</option>
                {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        );
    }
    if (field.type === 'checkbox') {
        return (
            <div className="space-y-2">
                {(field.options || ['Option']).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-300">
                        <input type="checkbox" disabled />
                        {opt}
                    </label>
                ))}
            </div>
        );
    }
    const inputType = field.type === 'phone' ? 'tel' : field.type;
    return <input className={common} type={inputType} placeholder={field.label} disabled />;
}

function TemplateShell({ title, description, children, templateKey }: { title: string; description: string; children: React.ReactNode; templateKey: string }) {
    const base = 'min-h-screen px-6 py-10';
    if (templateKey === 'minimal') {
        return (
            <div className={`${base} bg-slate-950 text-slate-100`}>
                <div className="max-w-2xl mx-auto space-y-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Form Preview</p>
                        <h1 className="text-3xl font-bold text-white mt-2">{title}</h1>
                        <p className="text-sm text-slate-400 mt-2">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        );
    }
    if (templateKey === 'split') {
        return (
            <div className={`${base} bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100`}>
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
                    <div className="space-y-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Form Preview</p>
                        <h1 className="text-4xl font-bold">{title}</h1>
                        <p className="text-sm text-slate-400">{description}</p>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
                            Template: Split
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                        {children}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className={`${base} bg-[#030712] text-slate-100`}>
            <div className="max-w-3xl mx-auto space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Form Preview</p>
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                <p className="text-sm text-slate-400">{description}</p>
                {children}
            </div>
        </div>
    );
}

export default async function FormPreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return notFound();

    const cookieStore = await cookies();
    const tenantKey = cookieStore.get('kalp_active_tenant')?.value || 'demo';
    const db = await getTenantDb(tenantKey);
    const form = await db.collection('forms').findOne({ _id: new ObjectId(id) }) as FormRecord | null;
    if (!form) return notFound();

    const title = form.title || 'Form Preview';
    const description = form.description || '';
    const templateKey = form.templateKey || 'glass';
    const fields = Array.isArray(form.fields) ? form.fields : [];
    const steps = Array.isArray(form.steps) ? form.steps : [];

    return (
        <TemplateShell title={title} description={description} templateKey={templateKey}>
            <div className="space-y-6">
                {form.type === 'multi_step' && steps.length > 0 ? (
                    steps.map((step, index) => (
                        <div key={step.id} className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                                    {index + 1}
                                </span>
                                <span className="font-semibold">{step.title}</span>
                            </div>
                            <div className="space-y-3">
                                {step.fields.map((field) => (
                                    <div key={field.id} className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-slate-500">{field.label}</label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="space-y-3">
                        {fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-slate-500">{field.label}</label>
                                {renderField(field)}
                            </div>
                        ))}
                    </div>
                )}
                <button className="w-full rounded-lg bg-cyan-500 text-black py-2 text-sm font-semibold" disabled>
                    Submit
                </button>
            </div>
        </TemplateShell>
    );
}
