'use client';

import { useEffect, useState } from 'react';
import { Globe, Check, Star, ToggleLeft, ToggleRight, AlertCircle, FileText, Database } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { BUNDLED_LOCALES } from '@/lib/i18n/context';

type LanguageRecord = {
    _id?: string;
    code: string;
    name: string;
    nativeName?: string;
    flag?: string;
    status?: string;
    isDefault?: boolean;
    updatedAt?: string;
};

const BUNDLED_SET = new Set<string>(BUNDLED_LOCALES);

interface LanguageManagementViewProps {
    onToast?: (msg: string) => void;
}

export function LanguageManagementView({ onToast }: LanguageManagementViewProps) {
    const { t } = useTranslation();
    const [languages, setLanguages] = useState<LanguageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const showToast = (msg: string) => onToast?.(msg);

    const reload = async () => {
        try {
            const res = await fetch('/api/system/languages');
            const data = await res.json();
            if (Array.isArray(data)) setLanguages(data);
        } catch {
            /* silent */
        }
    };

    useEffect(() => {
        setLoading(true);
        reload().finally(() => setLoading(false));
    }, []);

    const toggleStatus = async (lang: LanguageRecord) => {
        if (lang.code === 'en') return; // English cannot be disabled
        const newStatus = lang.status === 'active' ? 'inactive' : 'active';
        setSaving(lang.code);
        try {
            const res = await fetch('/api/system/languages', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...lang, status: newStatus }),
            });
            if (res.ok) {
                showToast(newStatus === 'active' ? `${lang.name} enabled` : `${lang.name} disabled`);
                reload();
            } else {
                const body = await res.json().catch(() => ({}));
                showToast(body.error || 'Update failed');
            }
        } catch {
            showToast('Update failed');
        } finally {
            setSaving(null);
        }
    };

    const setDefault = async (lang: LanguageRecord) => {
        if (lang.code === 'en') return;
        if (lang.status !== 'active') {
            showToast('Enable the language before setting it as default.');
            return;
        }
        setSaving(`default-${lang.code}`);
        try {
            // Mark this as default, unmark others
            const updates = languages.map(l => ({
                ...l,
                isDefault: l.code === lang.code,
            }));
            await Promise.all(
                updates.map(l =>
                    fetch('/api/system/languages', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(l),
                    })
                )
            );
            showToast(`${lang.name} set as platform default`);
            reload();
        } catch {
            showToast('Update failed');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                <span className="font-mono text-xs uppercase tracking-widest text-slate-500">{t('common.loading')}</span>
            </div>
        );
    }

    if (languages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-16 gap-3 text-center">
                <Globe size={40} className="text-slate-600" />
                <p className="text-slate-500 text-sm">{t('langManagement.noLanguages')}</p>
                <p className="text-slate-600 text-xs max-w-sm">
                    Add languages via the System Registry → Languages tab first.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-3">
                <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300/80 leading-relaxed">
                    {t('langManagement.defaultNote')}
                    {' '}{t('langManagement.bundledNote')}
                </p>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-0 border-b border-slate-800 bg-black/30 px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                    <span className="w-10"> </span>
                    <span>{t('common.name')}</span>
                    <span>{t('langManagement.nativeName')}</span>
                    <span className="text-center px-4">{t('langManagement.translationFile')}</span>
                    <span className="text-center px-4">{t('langManagement.platformDefault')}</span>
                    <span className="text-center px-4">{t('common.status')}</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-800/60">
                    {languages.map(lang => {
                        const isBundled = BUNDLED_SET.has(lang.code);
                        const isEnglish = lang.code === 'en';
                        const isDefault = lang.isDefault || isEnglish;
                        const isActive = lang.status === 'active';
                        const isToggling = saving === lang.code;
                        const isSettingDefault = saving === `default-${lang.code}`;

                        return (
                            <div
                                key={lang.code}
                                className={`grid grid-cols-[auto_1fr_1fr_auto_auto_auto] items-center gap-0 px-5 py-4 transition-colors hover:bg-slate-900/30 ${isActive ? '' : 'opacity-50'}`}
                            >
                                {/* Flag */}
                                <div className="w-10 text-xl">{lang.flag || '🌐'}</div>

                                {/* Name */}
                                <div>
                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                        {lang.name}
                                        <span className="font-mono text-[10px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
                                            {lang.code}
                                        </span>
                                    </div>
                                </div>

                                {/* Native name */}
                                <div className="text-sm text-slate-400">
                                    {lang.nativeName || '—'}
                                </div>

                                {/* Translation file badge */}
                                <div className="flex justify-center px-4">
                                    {isBundled ? (
                                        <span
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[10px] font-semibold"
                                            title={t('langManagement.bundledNote')}
                                        >
                                            <FileText size={10} />
                                            {t('langManagement.bundled')}
                                        </span>
                                    ) : (
                                        <span
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded text-[10px] font-semibold"
                                            title={t('langManagement.dbOnlyNote')}
                                        >
                                            <Database size={10} />
                                            {t('langManagement.dbOnly')}
                                        </span>
                                    )}
                                </div>

                                {/* Default toggle */}
                                <div className="flex justify-center px-4">
                                    <button
                                        onClick={() => setDefault(lang)}
                                        disabled={isEnglish || isSettingDefault || !isActive}
                                        title={isEnglish ? t('langManagement.defaultNote') : t('langManagement.setDefault')}
                                        className={`p-1.5 rounded-md transition-colors disabled:cursor-not-allowed ${isDefault
                                                ? 'text-amber-400 bg-amber-500/10'
                                                : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10'
                                            }`}
                                    >
                                        {isSettingDefault ? (
                                            <div className="w-4 h-4 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                                        ) : (
                                            <Star size={15} className={isDefault ? 'fill-amber-400' : ''} />
                                        )}
                                    </button>
                                </div>

                                {/* Status toggle */}
                                <div className="flex items-center gap-2 justify-end px-4">
                                    {isEnglish ? (
                                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                            <Check size={10} /> Default
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => toggleStatus(lang)}
                                            disabled={isToggling}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-60 ${isActive
                                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400'
                                                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400'
                                                }`}
                                        >
                                            {isToggling ? (
                                                <div className="w-3 h-3 border border-current/40 border-t-current rounded-full animate-spin" />
                                            ) : isActive ? (
                                                <><ToggleRight size={13} />{t('common.enabled')}</>
                                            ) : (
                                                <><ToggleLeft size={13} />{t('common.disabled')}</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 px-1">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 bg-emerald-500/20 border border-emerald-500/30 rounded-sm" />
                    {t('langManagement.bundledNote')}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 bg-amber-500/20 border border-amber-500/30 rounded-sm" />
                    {t('langManagement.dbOnlyNote')}
                </span>
                <span className="flex items-center gap-1.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    {t('langManagement.platformDefault')}
                </span>
            </div>
        </div>
    );
}
