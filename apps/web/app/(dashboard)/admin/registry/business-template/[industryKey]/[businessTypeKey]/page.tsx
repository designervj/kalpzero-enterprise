'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessTemplateEditor } from '@/components/admin/registry/BusinessTemplateEditor';
import { Check, Loader2, X } from 'lucide-react';

interface EditBusinessTypePageProps {
    params: Promise<{
        industryKey: string;
        businessTypeKey: string;
    }>;
}

export default function EditBusinessTypePage({ params }: EditBusinessTypePageProps) {
    const { industryKey, businessTypeKey } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [industryDoc, setIndustryDoc] = useState<any>(null);
    const [businessType, setBusinessType] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/system/templates');
                const data = await res.json();
                if (!res.ok) throw new Error('Failed to fetch templates');

                // Find industry by key or normalized name
                const industry = data.find((i: any) => 
                    i.key === industryKey || 
                    i.industry.toLowerCase().replace(/\s+/g, '-') === industryKey
                );

                if (!industry) throw new Error('Industry not found');

                const bt = industry.businessTypes?.find((b: any) => b.key === businessTypeKey);
                if (!bt) throw new Error('Business Type not found');

                setIndustryDoc(industry);
                setBusinessType({
                    ...bt,
                    industry: industry.industry,
                    industryKey: industry.key || industryKey,
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [industryKey, businessTypeKey]);

    const handleSave = async (updatedBt: any) => {
        setSaving(true);
        try {
            // Re-fetch to get latest state if needed, but here we'll just update based on what we have
            const updatedTypes = industryDoc.businessTypes.map((bt: any) => 
                bt.key === businessTypeKey ? updatedBt : bt
            );

            const res = await fetch('/api/system/templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: industryDoc._id,
                    industry: updatedBt.industry, // Support changing industry name
                    industryKey: updatedBt.industryKey,
                    businessTypes: updatedTypes,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save changes');
            }

            router.push('/admin/registry?tab=templates');
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Loading Template Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
                    <X size={24} />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Configuration Error</h2>
                <p className="text-sm text-slate-400 max-w-md">{error}</p>
                <button 
                    onClick={() => router.push('/admin/registry')}
                    className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all"
                >
                    Back to Registry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <BusinessTemplateEditor
                initialData={businessType}
                onSave={handleSave}
                onCancel={() => router.push('/admin/registry')}
                saving={saving}
            />
        </div>
    );
}
