'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import type {
    TravelActivityCatalogDto,
    TravelFaqDto,
    TravelGuidelineDto,
    TravelHotelCatalogDto,
    TravelItineraryDayDto,
    TravelPackageDto,
    TravelTransferCatalogDto,
} from '@/lib/contracts/travel';
import { normalizeTravelPackageInput } from '@/lib/travel-utils';
import type { SourceEntityRefDto } from '@/lib/contracts/source';
import { SourceRow } from '@/components/source/SourceRow';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';
import { PackageSummary } from '@/components/travel/PackageSummary';
import { DayBlock } from '@/components/travel/DayBlock';
import { LayoutGrid, List } from 'lucide-react';

type StatusValue = 'draft' | 'published' | 'archived';

interface CatalogOption {
    _id: string;
    name: string;
    subtitle: string;
}

function makeId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function deepMergeRecord<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
    const output: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(patch)) {
        const current = output[key];
        if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            current &&
            typeof current === 'object' &&
            !Array.isArray(current)
        ) {
            output[key] = deepMergeRecord(current as Record<string, unknown>, value as Record<string, unknown>);
            continue;
        }
        output[key] = value;
    }
    return output as T;
}

function createEmptyDay(dayNumber: number): TravelItineraryDayDto {
    return {
        id: makeId('day'),
        dayNumber,
        title: `Day ${dayNumber}`,
        city: '',
        dayType: 'sightseeing',
        mealsIncluded: [],
        notes: '',
        description: '',
        hotelStays: [],
        activities: [],
        transfers: [],
    };
}

function createEmptyForm(): TravelPackageDto {
    return {
        slug: '',
        title: '',
        destination: '',
        tripDuration: '3 Days / 2 Nights',
        travelStyle: 'Premium',
        tourType: '',
        exclusivityLevel: 'Premium',
        price: {
            currency: 'INR',
            amount: 0,
        },
        shortDescription: '',
        longDescription: '',
        availability: {
            availableMonths: [],
            fixedDepartureDates: [],
            blackoutDates: [],
        },
        inclusions: [],
        exclusions: [],
        knowBeforeYouGo: [],
        additionalInfo: {
            aboutDestination: '',
            quickInfo: {
                destinationsCovered: '',
                duration: '',
                startPoint: '',
                endPoint: '',
            },
            experiencesCovered: [],
            notToMiss: [],
        },
        faqs: [],
        itinerary: [createEmptyDay(1)],
        sourceRefs: [],
        status: 'draft',
    };
}

function normalizeCatalogOptions<T extends { _id?: string | number | { toString(): string } }>(
    rows: T[],
    getName: (item: T) => string,
    getSubtitle: (item: T) => string
): CatalogOption[] {
    return rows
        .map((row) => {
            const id = typeof row._id === 'string' ? row._id : row._id?.toString() || '';
            return {
                _id: id,
                name: getName(row),
                subtitle: getSubtitle(row),
            };
        })
        .filter(option => option._id && option.name);
}

export default function TravelPackageFormPage() {
    const { currentProfile, isScopedRoleView } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const router = useRouter();
    const searchParams = useSearchParams();
    const packageId = searchParams.get('id');
    const isEdit = Boolean(packageId);

    const [form, setForm] = useState<TravelPackageDto>(createEmptyForm);
    const [loading, setLoading] = useState(Boolean(packageId));
    const [saving, setSaving] = useState(false);
    const [sourceEnabled, setSourceEnabled] = useState(false);
    const [sourceRefs, setSourceRefs] = useState<SourceEntityRefDto[]>([]);

    const [hotels, setHotels] = useState<CatalogOption[]>([]);
    const [activities, setActivities] = useState<CatalogOption[]>([]);
    const [transfers, setTransfers] = useState<CatalogOption[]>([]);

    const [inclusionInput, setInclusionInput] = useState('');
    const [exclusionInput, setExclusionInput] = useState('');
    const [faqQuestion, setFaqQuestion] = useState('');
    const [faqAnswer, setFaqAnswer] = useState('');
    const [guidelineInput, setGuidelineInput] = useState('');
    const [viewMode, setViewMode] = useState<'builder' | 'summary'>('builder');
    const [experienceInput, setExperienceInput] = useState('');
    const [notToMissInput, setNotToMissInput] = useState('');

    const fetchCatalogs = useCallback(async () => {
        const [hotelRes, activityRes, transferRes] = await Promise.all([
            fetch('/api/travel/catalog/hotels'),
            fetch('/api/travel/catalog/activities'),
            fetch('/api/travel/catalog/transfers'),
        ]);
        const [hotelJson, activityJson, transferJson] = await Promise.all([
            hotelRes.json(),
            activityRes.json(),
            transferRes.json(),
        ]);

        setHotels(
            normalizeCatalogOptions<TravelHotelCatalogDto>(
                Array.isArray(hotelJson) ? hotelJson : [],
                item => item.hotelName || '',
                item => [item.city || '', item.starRating ? `${item.starRating}★` : ''].filter(Boolean).join(' · ')
            )
        );
        setActivities(
            normalizeCatalogOptions<TravelActivityCatalogDto>(
                Array.isArray(activityJson) ? activityJson : [],
                item => item.title || '',
                item => [item.location || '', item.defaultDuration || ''].filter(Boolean).join(' · ')
            )
        );
        setTransfers(
            normalizeCatalogOptions<TravelTransferCatalogDto>(
                Array.isArray(transferJson) ? transferJson : [],
                item => item.title || '',
                item => [item.from || '', item.to || '', item.vehicleType || ''].filter(Boolean).join(' -> ')
            )
        );
    }, []);

    useEffect(() => {
        fetchCatalogs().catch(console.error);
    }, [fetchCatalogs]);

    useEffect(() => {
        fetch('/api/settings/tenant')
            .then((res) => res.json())
            .then((tenant) => {
                const enabledModules = Array.isArray(tenant?.enabledModules) ? tenant.enabledModules : [];
                const flags = tenant?.featureFlags && typeof tenant.featureFlags === 'object'
                    ? tenant.featureFlags as Record<string, unknown>
                    : {};
                const moduleEnabled = enabledModules.includes('source');
                const sourceModuleEnabled = flags.sourceModuleEnabled !== false;
                const sourcePilotTravel = flags.sourcePilotTravel !== false;
                setSourceEnabled(moduleEnabled && sourceModuleEnabled && sourcePilotTravel);
            })
            .catch(() => setSourceEnabled(false));
    }, []);

    useEffect(() => {
        if (!packageId) return;
        setLoading(true);
        fetch(`/api/travel/packages/${packageId}`)
            .then(res => res.json())
            .then((data) => {
                if (data && !data.error) {
                    const normalized = normalizeTravelPackageInput(data);
                    setForm(normalized);
                    const refs = Array.isArray(normalized.sourceRefs)
                        ? normalized.sourceRefs.map((sourceId) => ({
                            sourceId,
                            inputType: 'text' as const,
                            createdAt: new Date().toISOString(),
                            label: `SRC-${sourceId.slice(-6)}`,
                        }))
                        : [];
                    setSourceRefs(refs);
                }
            })
            .finally(() => setLoading(false));
    }, [packageId]);

    const updateField = <K extends keyof TravelPackageDto>(key: K, value: TravelPackageDto[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const updateItineraryDay = (index: number, updater: (day: TravelItineraryDayDto) => TravelItineraryDayDto) => {
        setForm(prev => {
            const next = prev.itinerary.map((day, dayIndex) => dayIndex === index ? updater(day) : day);
            return { ...prev, itinerary: next };
        });
    };

    const addDay = () => {
        setForm(prev => ({
            ...prev,
            itinerary: [...prev.itinerary, createEmptyDay(prev.itinerary.length + 1)],
        }));
    };

    const removeDay = (index: number) => {
        setForm(prev => {
            const days = prev.itinerary.filter((_, dayIndex) => dayIndex !== index);
            const reNumbered = days.map((day, dayIndex) => ({ ...day, dayNumber: dayIndex + 1 }));
            return { ...prev, itinerary: reNumbered.length > 0 ? reNumbered : [createEmptyDay(1)] };
        });
    };

    const toggleMeal = (dayIndex: number, meal: 'Breakfast' | 'Lunch' | 'Dinner') => {
        updateItineraryDay(dayIndex, (day) => {
            const has = day.mealsIncluded.includes(meal);
            return {
                ...day,
                mealsIncluded: has
                    ? day.mealsIncluded.filter(item => item !== meal)
                    : [...day.mealsIncluded, meal],
            };
        });
    };

    const addFaq = () => {
        if (!faqQuestion.trim() || !faqAnswer.trim()) return;
        const faq: TravelFaqDto = { id: makeId('faq'), question: faqQuestion.trim(), answer: faqAnswer.trim() };
        setForm(prev => ({ ...prev, faqs: [...prev.faqs, faq] }));
        setFaqQuestion('');
        setFaqAnswer('');
    };

    const addGuideline = () => {
        if (!guidelineInput.trim()) return;
        const point: TravelGuidelineDto = { id: makeId('guide'), point: guidelineInput.trim() };
        setForm(prev => ({ ...prev, knowBeforeYouGo: [...prev.knowBeforeYouGo, point] }));
        setGuidelineInput('');
    };

    const addStringItem = (target: 'inclusions' | 'exclusions', value: string, reset: () => void) => {
        if (!value.trim()) return;
        setForm(prev => ({ ...prev, [target]: [...prev[target], value.trim()] }));
        reset();
    };

    const addAdditionalListItem = (target: 'experiencesCovered' | 'notToMiss', value: string, reset: () => void) => {
        if (!value.trim()) return;
        setForm(prev => ({
            ...prev,
            additionalInfo: {
                ...prev.additionalInfo,
                [target]: [...prev.additionalInfo[target], value.trim()],
            },
        }));
        reset();
    };

    const savePackage = async (status: StatusValue) => {
        if (!canMutate) return;
        if (!form.title.trim() || !form.destination.trim()) {
            alert('Title and destination are required.');
            return;
        }

        setSaving(true);
        try {
            const payload: TravelPackageDto = { ...form, status };
            const method = isEdit ? 'PUT' : 'POST';
            const url = isEdit ? `/api/travel/packages/${packageId}` : '/api/travel/packages';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || data?.error) {
                alert(data?.error || 'Failed to save package.');
                return;
            }

            const entityId = isEdit ? packageId : (typeof data?.id === 'string' ? data.id : '');
            if (entityId && sourceRefs.length > 0) {
                await Promise.all(
                    sourceRefs.map((ref) =>
                        fetch(`/api/sources/${ref.sourceId}/link-entity`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                entityType: 'travel_package',
                                entityId,
                                targetType: 'travel_package',
                                fieldsApplied: [],
                            }),
                        }).catch(() => null)
                    )
                );
            }

            router.push('/travel/packages');
            router.refresh();
        } finally {
            setSaving(false);
        }
    };

    const durationHint = useMemo(() => `${form.itinerary.length} day${form.itinerary.length > 1 ? 's' : ''} configured`, [form.itinerary.length]);

    if (loading) {
        return <div className="py-20 text-center text-slate-500 text-sm">Loading package...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!canMutate && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {isScopedRoleView ? 'Scoped role view is read-only. Switch role to edit travel packages.' : 'This role is read-only for travel package mutations.'}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/travel/packages" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2">
                        <ArrowLeft size={14} /> Back to packages
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{isEdit ? 'Edit Package' : 'Create Package'}</h1>
                    <p className="text-sm text-slate-400 mt-1">Build itinerary-driven travel offerings with linked master catalog references.</p>
                </div>
            </div>

            <fieldset disabled={!canMutate} className="space-y-8">
            <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-5">
                <SourceRow
                    targetType="travel_package"
                    enabled={sourceEnabled && canMutate}
                    currentValues={form as unknown as Record<string, unknown>}
                    refs={sourceRefs}
                    onRefsChange={(refs) => {
                        setSourceRefs(refs);
                        setForm((prev) => ({ ...prev, sourceRefs: refs.map((item) => item.sourceId) }));
                    }}
                    onApplyPatch={(patch) => {
                        setForm((prev) => {
                            const merged = deepMergeRecord(prev as unknown as Record<string, unknown>, patch);
                            const normalized = normalizeTravelPackageInput(merged);
                            if (typeof prev._id !== 'undefined') {
                                normalized._id = prev._id;
                            }
                            return normalized;
                        });
                    }}
                />
                <h2 className="text-lg font-semibold text-white">1. Basic Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white" placeholder="Package Title"
                        value={form.title} onChange={(event) => updateField('title', event.target.value)} />
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white" placeholder="Destination"
                        value={form.destination} onChange={(event) => updateField('destination', event.target.value)} />
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white" placeholder="Trip Duration"
                        value={form.tripDuration} onChange={(event) => updateField('tripDuration', event.target.value)} />
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white" placeholder="Travel Style"
                        value={form.travelStyle} onChange={(event) => updateField('travelStyle', event.target.value)} />
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white" placeholder="Exclusivity Level"
                        value={form.exclusivityLevel} onChange={(event) => updateField('exclusivityLevel', event.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                        <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white" placeholder="Currency"
                            value={form.price.currency}
                            onChange={(event) => updateField('price', { ...form.price, currency: event.target.value })} />
                        <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white" type="number" placeholder="Amount"
                            value={String(form.price.amount)}
                            onChange={(event) => updateField('price', { ...form.price, amount: Number(event.target.value) || 0 })} />
                    </div>
                    <textarea className="md:col-span-2 bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white min-h-[70px]" placeholder="Short Description"
                        value={form.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} />
                    <textarea className="md:col-span-2 bg-black/40 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white min-h-[120px]" placeholder="Full Description"
                        value={form.longDescription} onChange={(event) => updateField('longDescription', event.target.value)} />
                </div>
            </section>

            <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                    <div className="flex items-center gap-6">
                        <h2 className="text-lg font-semibold text-white">2. Itinerary Builder</h2>
                        <div className="flex bg-black/40 p-1 rounded-lg border border-slate-800">
                            <button 
                                onClick={() => setViewMode('builder')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'builder' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <LayoutGrid size={12} /> Builder
                            </button>
                            <button 
                                onClick={() => setViewMode('summary')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'summary' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <List size={12} /> Summary
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-bold text-cyan-400/80 bg-cyan-500/5 border border-cyan-500/10 px-3 py-1.5 rounded-full uppercase tracking-tighter">{durationHint}</div>
                        <button
                            onClick={addDay}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <Plus size={14} /> Add Day
                        </button>
                    </div>
                </div>
                {viewMode === 'summary' ? (
                    <PackageSummary data={form} />
                ) : (
                    <div className="space-y-6">
                        {form.itinerary.map((day, dayIndex) => (
                            <DayBlock 
                                key={day.id}
                                day={day}
                                index={dayIndex}
                                hotels={hotels}
                                activities={activities}
                                onUpdate={(updater) => updateItineraryDay(dayIndex, updater)}
                                onRemove={() => removeDay(dayIndex)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">3. Inclusions & Exclusions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-emerald-300">Inclusions</p>
                        {form.inclusions.map((item, index) => (
                            <div key={`${item}-${index}`} className="flex items-center justify-between text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                <span>{item}</span>
                                <button onClick={() => updateField('inclusions', form.inclusions.filter((_, idx) => idx !== index))} className="text-xs text-rose-200">Remove</button>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input value={inclusionInput} onChange={(event) => setInclusionInput(event.target.value)}
                                className="flex-1 bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Add inclusion" />
                            <button onClick={() => addStringItem('inclusions', inclusionInput, () => setInclusionInput(''))}
                                className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm">Add</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider text-rose-300">Exclusions</p>
                        {form.exclusions.map((item, index) => (
                            <div key={`${item}-${index}`} className="flex items-center justify-between text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                                <span>{item}</span>
                                <button onClick={() => updateField('exclusions', form.exclusions.filter((_, idx) => idx !== index))} className="text-xs text-rose-200">Remove</button>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input value={exclusionInput} onChange={(event) => setExclusionInput(event.target.value)}
                                className="flex-1 bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Add exclusion" />
                            <button onClick={() => addStringItem('exclusions', exclusionInput, () => setExclusionInput(''))}
                                className="px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm">Add</button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">4. FAQs</h2>
                {form.faqs.map((faq, index) => (
                    <div key={faq.id} className="border border-slate-700/70 rounded-lg p-3 space-y-1">
                        <div className="text-sm text-white font-medium">{faq.question}</div>
                        <div className="text-sm text-slate-300">{faq.answer}</div>
                        <button className="text-xs text-rose-300" onClick={() => updateField('faqs', form.faqs.filter((_, idx) => idx !== index))}>Remove</button>
                    </div>
                ))}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)}
                        className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Question" />
                    <input value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)}
                        className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Answer" />
                </div>
                <button onClick={addFaq} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200">Add FAQ</button>
            </section>

            <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">5. Know Before You Go</h2>
                {form.knowBeforeYouGo.map((point, index) => (
                    <div key={point.id} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2 text-sm text-slate-200">
                        <span>{point.point}</span>
                        <button className="text-xs text-rose-300" onClick={() => updateField('knowBeforeYouGo', form.knowBeforeYouGo.filter((_, idx) => idx !== index))}>Remove</button>
                    </div>
                ))}
                <div className="flex gap-2">
                    <input value={guidelineInput} onChange={(event) => setGuidelineInput(event.target.value)}
                        className="flex-1 bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Add guideline point" />
                    <button onClick={addGuideline} className="px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 text-sm">Add</button>
                </div>
            </section>

            <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">6. Additional Information</h2>
                <textarea className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white min-h-[100px]" placeholder="About Destination"
                    value={form.additionalInfo.aboutDestination}
                    onChange={(event) => setForm(prev => ({ ...prev, additionalInfo: { ...prev.additionalInfo, aboutDestination: event.target.value } }))} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Destinations Covered"
                        value={form.additionalInfo.quickInfo.destinationsCovered}
                        onChange={(event) => setForm(prev => ({
                            ...prev,
                            additionalInfo: { ...prev.additionalInfo, quickInfo: { ...prev.additionalInfo.quickInfo, destinationsCovered: event.target.value } },
                        }))} />
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Duration"
                        value={form.additionalInfo.quickInfo.duration}
                        onChange={(event) => setForm(prev => ({
                            ...prev,
                            additionalInfo: { ...prev.additionalInfo, quickInfo: { ...prev.additionalInfo.quickInfo, duration: event.target.value } },
                        }))} />
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Start Point"
                        value={form.additionalInfo.quickInfo.startPoint}
                        onChange={(event) => setForm(prev => ({
                            ...prev,
                            additionalInfo: { ...prev.additionalInfo, quickInfo: { ...prev.additionalInfo.quickInfo, startPoint: event.target.value } },
                        }))} />
                    <input className="bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="End Point"
                        value={form.additionalInfo.quickInfo.endPoint}
                        onChange={(event) => setForm(prev => ({
                            ...prev,
                            additionalInfo: { ...prev.additionalInfo, quickInfo: { ...prev.additionalInfo.quickInfo, endPoint: event.target.value } },
                        }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-violet-300 uppercase tracking-wider mb-2">Experiences Covered</p>
                        {form.additionalInfo.experiencesCovered.map((item, index) => (
                            <div key={`${item}-${index}`} className="flex items-center justify-between bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-slate-200 mb-1">
                                <span>{item}</span>
                                <button className="text-xs text-rose-300" onClick={() => setForm(prev => ({
                                    ...prev,
                                    additionalInfo: { ...prev.additionalInfo, experiencesCovered: prev.additionalInfo.experiencesCovered.filter((_, idx) => idx !== index) },
                                }))}>Remove</button>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input value={experienceInput} onChange={(event) => setExperienceInput(event.target.value)}
                                className="flex-1 bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Add experience" />
                            <button onClick={() => addAdditionalListItem('experiencesCovered', experienceInput, () => setExperienceInput(''))}
                                className="px-3 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-200 text-sm">Add</button>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-rose-300 uppercase tracking-wider mb-2">Not To Miss</p>
                        {form.additionalInfo.notToMiss.map((item, index) => (
                            <div key={`${item}-${index}`} className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 text-sm text-slate-200 mb-1">
                                <span>{item}</span>
                                <button className="text-xs text-rose-300" onClick={() => setForm(prev => ({
                                    ...prev,
                                    additionalInfo: { ...prev.additionalInfo, notToMiss: prev.additionalInfo.notToMiss.filter((_, idx) => idx !== index) },
                                }))}>Remove</button>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input value={notToMissInput} onChange={(event) => setNotToMissInput(event.target.value)}
                                className="flex-1 bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Add highlight" />
                            <button onClick={() => addAdditionalListItem('notToMiss', notToMissInput, () => setNotToMissInput(''))}
                                className="px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 text-sm">Add</button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex items-center justify-end gap-3 pb-8">
                <Link href="/travel/packages" className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm">Cancel</Link>
                <button
                    disabled={saving || !canMutate}
                    onClick={() => savePackage('draft')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm disabled:opacity-60"
                >
                    <Save size={15} />
                    Save Draft
                </button>
                <button
                    disabled={saving || !canMutate}
                    onClick={() => savePackage('published')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-black font-semibold text-sm disabled:opacity-60"
                >
                    <Save size={15} />
                    {isEdit ? 'Update & Publish' : 'Create & Publish'}
                </button>
            </div>
            </fieldset>
        </div>
    );
}
