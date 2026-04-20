'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Truck, DollarSign, Check, X, Save, RefreshCw, Eye, EyeOff, AlertCircle, CheckCircle2, HelpCircle, ChevronDown, ChevronUp, Zap, Plus, Receipt, TrendingUp, Percent, Globe } from 'lucide-react';

/* ─── Default exchange rates vs USD ────────────────── */
const DEFAULT_RATES: Record<string, number> = {
    EUR: 0.92, GBP: 0.79, INR: 83.50, AED: 3.67, AUD: 1.53,
    CAD: 1.38, JPY: 149.50, SGD: 1.34, BRL: 5.05, CNY: 7.23,
    CHF: 0.90, USD: 1.0,
};

/* ─── Gateway & Provider Definitions ────────────────── */
const GATEWAYS = [
    {
        key: 'razorpay', name: 'Razorpay', logo: '🇮🇳',
        description: 'India\'s most popular payment gateway. Supports UPI, cards, wallets, and netbanking.',
        currencies: ['INR', 'USD'],
        fields: [
            { key: 'apiKey', label: 'API Key', placeholder: 'rzp_test_...', help: 'Find this in Razorpay Dashboard → Settings → API Keys' },
            { key: 'secretKey', label: 'Secret Key', placeholder: 'Your secret key', help: 'Keep this private. Never share it.', secret: true },
            { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...', help: 'Razorpay Dashboard → Webhooks → Secret', secret: true },
        ],
        features: ['UPI', 'Cards', 'Net Banking', 'Wallets', 'Auto-Refunds', 'Subscriptions'],
        color: '#0A2540',
    },
    {
        key: 'stripe', name: 'Stripe', logo: '💳',
        description: 'Global payments platform. Accept payments in 135+ currencies with advanced fraud protection.',
        currencies: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'],
        fields: [
            { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_test_...', help: 'Stripe Dashboard → Developers → API Keys (safe to share)' },
            { key: 'secretKey', label: 'Secret Key', placeholder: 'sk_test_...', help: 'Keep this secret. Never expose in frontend code.', secret: true },
            { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_...', help: 'Stripe Dashboard → Developers → Webhooks', secret: true },
        ],
        features: ['135+ Currencies', '3D Secure', 'Subscriptions', 'Invoicing', 'Fraud Protection', 'Apple Pay'],
        color: '#635BFF',
    },
    {
        key: 'paypal', name: 'PayPal', logo: '🅿️',
        description: 'Trusted globally by 400M+ users. Accept PayPal, cards, and buy-now-pay-later.',
        currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'],
        fields: [
            { key: 'clientId', label: 'Client ID', placeholder: 'Your PayPal Client ID', help: 'PayPal Developer Dashboard → My Apps → REST API apps' },
            { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your secret', help: 'Same page as Client ID. Keep private.', secret: true },
        ],
        features: ['Global Reach', 'Buyer Protection', 'One-Touch', 'Pay Later', 'Venmo (US)'],
        color: '#003087',
    },
];

const SHIPPERS = [
    {
        key: 'ups', name: 'UPS', logo: '📦',
        description: 'Global shipping leader. Real-time rates, tracking, and label printing in 220+ countries.',
        fields: [
            { key: 'accountNumber', label: 'Account Number', placeholder: 'Your UPS account #', help: 'Found on your UPS invoice or online profile' },
            { key: 'apiKey', label: 'API Key', placeholder: 'Your API key', help: 'UPS Developer Kit → My Apps' },
            { key: 'secretKey', label: 'Secret Key', placeholder: 'Your secret', help: 'Generated when you create a UPS app', secret: true },
            { key: 'accessLicense', label: 'Access License', placeholder: 'License number', help: 'Obtained from UPS technology registration' },
        ],
        features: ['220+ Countries', 'Rate Calculator', 'Tracking', '🏷️ Label Printing', 'Returns', 'Freight'],
        color: '#351C15',
    },
    {
        key: 'usps', name: 'USPS', logo: '🇺🇸',
        description: 'US Postal Service. Affordable domestic rates with tracking and label generation.',
        fields: [
            { key: 'userId', label: 'User ID', placeholder: 'USPS Web Tools user ID', help: 'Register at USPS Web Tools → registration' },
            { key: 'apiKey', label: 'API Key', placeholder: 'Your API key', help: 'Provided after Web Tools registration approval' },
        ],
        features: ['Domestic Rates', 'Priority Mail', 'Tracking', '🏷️ Label Printing', 'Flat Rate', 'Media Mail'],
        color: '#333366',
    },
];

const TAX_REGIONS = [
    { code: 'IN', name: '🇮🇳 India', regions: ['All States', 'GST'] },
    { code: 'US', name: '🇺🇸 United States', regions: ['All States', 'CA', 'NY', 'TX', 'FL', 'WA'] },
    { code: 'EU', name: '🇪🇺 European Union', regions: ['All EU', 'DE', 'FR', 'IT', 'ES', 'NL'] },
    { code: 'GB', name: '🇬🇧 United Kingdom', regions: ['All UK'] },
    { code: 'AU', name: '🇦🇺 Australia', regions: ['All States'] },
];

interface CurrencyRate {
    code: string;
    rateFromPrimary: number;
    markupPercent: number;
    roundingRule: 'none' | 'nearest_whole' | 'nearest_99' | 'nearest_50';
}

interface TaxRate {
    id: string; region: string; subregion: string; rate: number;
    taxClass: 'standard' | 'reduced' | 'exempt'; label: string;
}

export default function PaymentsShippingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [section, setSection] = useState<'payments' | 'shipping' | 'currencies' | 'tax'>('payments');
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    const [payments, setPayments] = useState<any>({});
    const [shipping, setShipping] = useState<any>({});
    const [currencies, setCurrencies] = useState<string[]>(['USD']);
    const [primaryCurrency, setPrimaryCurrency] = useState('USD');
    const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
    const [currencyRates, setCurrencyRates] = useState<Record<string, CurrencyRate>>({});

    const [expandedGateway, setExpandedGateway] = useState<string | null>(null);
    const [expandedShipper, setExpandedShipper] = useState<string | null>(null);
    const [expandedRate, setExpandedRate] = useState<string | null>(null);

    // Tax state
    const [taxMode, setTaxMode] = useState<'inclusive' | 'exclusive'>('exclusive');
    const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
    const [newTaxRate, setNewTaxRate] = useState<{ region: string; subregion: string; rate: string; taxClass: string; label: string }>({
        region: 'IN', subregion: 'All States', rate: '18', taxClass: 'standard', label: 'GST',
    });

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    useEffect(() => {
        Promise.all([
            fetch('/api/settings/payments').then(r => r.json()),
            fetch('/api/system/currencies').then(r => r.json()),
            fetch('/api/commerce/currency-rates').then(r => r.json()).catch(() => ({})),
            fetch('/api/commerce/tax-rates').then(r => r.json()).catch(() => ({ mode: 'exclusive', rates: [] })),
        ]).then(([config, sysCurrencies, ratesData, taxData]) => {
            setPayments(config.payments || {});
            setShipping(config.shipping || {});
            setCurrencies(config.currencies || ['USD']);
            setPrimaryCurrency(config.primaryCurrency || 'USD');
            setAvailableCurrencies(Array.isArray(sysCurrencies) ? sysCurrencies : []);
            setCurrencyRates(ratesData.rates || {});
            setTaxMode(taxData.mode || 'exclusive');
            setTaxRates(Array.isArray(taxData.rates) ? taxData.rates : []);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                fetch('/api/settings/payments', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payments, shipping, currencies, primaryCurrency }),
                }),
                fetch('/api/commerce/currency-rates', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rates: currencyRates }),
                }),
                fetch('/api/commerce/tax-rates', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: taxMode, rates: taxRates }),
                }),
            ]);
            showToast('Settings saved successfully!');
        } catch { showToast('Failed to save.'); }
        setSaving(false);
    };

    const updateGateway = (key: string, field: string, value: any) => {
        setPayments((prev: any) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
    };

    const updateShipper = (key: string, field: string, value: any) => {
        setShipping((prev: any) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
    };

    const updateShippingRules = (field: string, value: any) => {
        setShipping((prev: any) => ({ ...prev, rules: { ...(prev.rules || {}), [field]: value } }));
    };

    const toggleCurrency = (code: string) => {
        if (code === primaryCurrency) return;
        const willEnable = !currencies.includes(code);
        setCurrencies(prev => willEnable ? [...prev, code] : prev.filter(c => c !== code));
        if (willEnable && !currencyRates[code]) {
            setCurrencyRates(prev => ({
                ...prev,
                [code]: {
                    code,
                    rateFromPrimary: DEFAULT_RATES[code] ?? 1.0,
                    markupPercent: 0,
                    roundingRule: 'nearest_99',
                },
            }));
        }
    };

    const updateRate = (code: string, field: keyof CurrencyRate, value: any) => {
        setCurrencyRates(prev => ({ ...prev, [code]: { ...(prev[code] || { code, rateFromPrimary: 1, markupPercent: 0, roundingRule: 'none' }), [field]: value } }));
    };

    const addTaxRate = () => {
        const entry: TaxRate = {
            id: `tax_${Date.now()}`,
            region: newTaxRate.region,
            subregion: newTaxRate.subregion,
            rate: parseFloat(newTaxRate.rate) || 0,
            taxClass: newTaxRate.taxClass as TaxRate['taxClass'],
            label: newTaxRate.label || `${newTaxRate.rate}% Tax`,
        };
        setTaxRates(prev => [...prev, entry]);
        setNewTaxRate({ region: 'IN', subregion: 'All States', rate: '18', taxClass: 'standard', label: 'GST' });
    };

    const removeTaxRate = (id: string) => setTaxRates(prev => prev.filter(t => t.id !== id));

    const primarySymbol = availableCurrencies.find(c => c.code === primaryCurrency)?.symbol || '$';

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
            <span className="font-mono text-xs uppercase tracking-widest text-slate-500">Loading configuration...</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-xl animate-in slide-in-from-right duration-300">
                    <CheckCircle2 size={14} /> {toast}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Payments & Shipping</h2>
                        <p className="text-slate-400 text-xs">Configure how your business accepts payments and ships orders.</p>
                    </div>
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-black rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save All Changes
                </button>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 overflow-x-auto">
                {([
                    { key: 'payments', label: 'Payment Gateways', icon: CreditCard, count: Object.values(payments).filter((g: any) => g?.enabled).length },
                    { key: 'shipping', label: 'Shipping Providers', icon: Truck, count: Object.values(shipping).filter((s: any) => typeof s === 'object' && s?.enabled).length },
                    { key: 'currencies', label: 'Currencies', icon: DollarSign, count: currencies.length },
                    { key: 'tax', label: 'Tax', icon: Receipt, count: taxRates.length },
                ] as const).map(tab => {
                    const Icon = tab.icon;
                    const active = section === tab.key;
                    return (
                        <button key={tab.key} onClick={() => setSection(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                            <Icon size={14} /> {tab.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald-500/30' : 'bg-slate-800'}`}>{tab.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* ─── PAYMENTS TAB ─── */}
            {section === 'payments' && (
                <div className="space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                        <HelpCircle size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-300/80">
                            <strong className="text-blue-400">How it works:</strong> Enable a gateway, paste your API keys, and you're ready to accept payments. Use <strong>Test Mode</strong> first to verify everything works before going live. You only need <strong>one gateway</strong> to start.
                        </div>
                    </div>

                    {GATEWAYS.map(gw => {
                        const config = payments[gw.key] || {};
                        const isEnabled = config.enabled || false;
                        const isExpanded = expandedGateway === gw.key;
                        return (
                            <div key={gw.key} className={`rounded-xl border transition-all ${isEnabled ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/40'}`}>
                                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedGateway(isExpanded ? null : gw.key)}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{gw.logo}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-white">{gw.name}</span>
                                                {isEnabled && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">{config.testMode ? '🟡 Test Mode' : '🟢 Live'}</span>}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{gw.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={(e) => { e.stopPropagation(); updateGateway(gw.key, 'enabled', !isEnabled); }}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`}></div>
                                        </button>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-5 pb-5 border-t border-slate-800/50 pt-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                                        <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                                            <div>
                                                <div className="text-xs font-bold text-white">Mode</div>
                                                <div className="text-[10px] text-slate-500">Use Test Mode to try payments without real charges</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold ${config.testMode ? 'text-amber-400' : 'text-slate-500'}`}>Test</span>
                                                <button onClick={() => updateGateway(gw.key, 'testMode', !config.testMode)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors ${config.testMode ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${config.testMode ? 'translate-x-0.5' : 'translate-x-[22px]'}`}></div>
                                                </button>
                                                <span className={`text-[10px] font-bold ${!config.testMode ? 'text-emerald-400' : 'text-slate-500'}`}>Live</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {gw.fields.map(field => (
                                                <div key={field.key}>
                                                    <label className="block text-xs font-semibold text-slate-400 mb-1">{field.label}</label>
                                                    <div className="relative">
                                                        <input
                                                            type={field.secret && !showSecrets[`${gw.key}_${field.key}`] ? 'password' : 'text'}
                                                            value={config[field.key] || ''}
                                                            onChange={e => updateGateway(gw.key, field.key, e.target.value)}
                                                            placeholder={field.placeholder}
                                                            className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 pr-10"
                                                        />
                                                        {field.secret && (
                                                            <button onClick={() => setShowSecrets(prev => ({ ...prev, [`${gw.key}_${field.key}`]: !prev[`${gw.key}_${field.key}`] }))}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                                                {showSecrets[`${gw.key}_${field.key}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><HelpCircle size={10} /> {field.help}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                            {gw.features.map(f => (
                                                <span key={f} className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">{f}</span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span>Currencies:</span>
                                            {gw.currencies.map(c => <span key={c} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-mono">{c}</span>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── SHIPPING TAB ─── */}
            {section === 'shipping' && (
                <div className="space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                        <HelpCircle size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-300/80">
                            <strong className="text-blue-400">How it works:</strong> Enable a shipping provider and enter your credentials to get <strong>live shipping rates</strong> at checkout. Set up <strong>Shipping Rules</strong> below for flat rates and free shipping thresholds.
                        </div>
                    </div>

                    {SHIPPERS.map(sp => {
                        const config = shipping[sp.key] || {};
                        const isEnabled = config.enabled || false;
                        const isExpanded = expandedShipper === sp.key;
                        return (
                            <div key={sp.key} className={`rounded-xl border transition-all ${isEnabled ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/40'}`}>
                                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedShipper(isExpanded ? null : sp.key)}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{sp.logo}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-white">{sp.name}</span>
                                                {isEnabled && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">🟢 Active</span>}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{sp.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={(e) => { e.stopPropagation(); updateShipper(sp.key, 'enabled', !isEnabled); }}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`}></div>
                                        </button>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-5 pb-5 border-t border-slate-800/50 pt-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-3">
                                            {sp.fields.map(field => (
                                                <div key={field.key}>
                                                    <label className="block text-xs font-semibold text-slate-400 mb-1">{field.label}</label>
                                                    <div className="relative">
                                                        <input
                                                            type={field.secret && !showSecrets[`${sp.key}_${field.key}`] ? 'password' : 'text'}
                                                            value={config[field.key] || ''}
                                                            onChange={e => updateShipper(sp.key, field.key, e.target.value)}
                                                            placeholder={field.placeholder}
                                                            className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 pr-10"
                                                        />
                                                        {field.secret && (
                                                            <button onClick={() => setShowSecrets(prev => ({ ...prev, [`${sp.key}_${field.key}`]: !prev[`${sp.key}_${field.key}`] }))}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                                                {showSecrets[`${sp.key}_${field.key}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><HelpCircle size={10} /> {field.help}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 mb-1">Label Format</label>
                                            <div className="flex gap-2">
                                                {['PDF', 'ZPL', 'PNG'].map(fmt => (
                                                    <button key={fmt} onClick={() => updateShipper(sp.key, 'labelFormat', fmt)}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${(config.labelFormat || 'PDF') === fmt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700/50 hover:text-slate-300'}`}>
                                                        {fmt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {sp.features.map(f => (
                                                <span key={f} className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Shipping Rules */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-5">
                        <div className="flex items-center gap-3">
                            <Zap size={18} className="text-amber-400" />
                            <div>
                                <h3 className="text-sm font-bold text-white">Shipping Rules</h3>
                                <p className="text-[10px] text-slate-500">Set default behavior. These apply when a provider is unavailable or as fallback.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Free Shipping Over</label>
                                <div className="flex items-center bg-black/50 border border-slate-700/80 rounded-lg overflow-hidden">
                                    <span className="px-3 py-2.5 text-sm text-slate-500 bg-slate-800/50 border-r border-slate-700">{primarySymbol}</span>
                                    <input type="number" value={shipping.rules?.freeShippingThreshold || 0}
                                        onChange={e => updateShippingRules('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                                        className="flex-1 bg-transparent px-3 py-2.5 text-white text-sm focus:outline-none" placeholder="0" />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">Set to 0 to disable free shipping</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Flat Rate Fallback</label>
                                <div className="flex items-center bg-black/50 border border-slate-700/80 rounded-lg overflow-hidden">
                                    <span className="px-3 py-2.5 text-sm text-slate-500 bg-slate-800/50 border-r border-slate-700">{primarySymbol}</span>
                                    <input type="number" value={shipping.rules?.flatRate || 0}
                                        onChange={e => updateShippingRules('flatRate', parseFloat(e.target.value) || 0)}
                                        className="flex-1 bg-transparent px-3 py-2.5 text-white text-sm focus:outline-none" placeholder="0" />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">Used when API rates are unavailable</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Default Method</label>
                                <select value={shipping.rules?.defaultMethod || 'standard'}
                                    onChange={e => updateShippingRules('defaultMethod', e.target.value)}
                                    className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none cursor-pointer appearance-none">
                                    <option value="standard">Standard Shipping</option>
                                    <option value="express">Express Shipping</option>
                                    <option value="overnight">Overnight</option>
                                    <option value="economy">Economy</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">Pre-selected at checkout</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── CURRENCIES TAB ─── */}
            {section === 'currencies' && (
                <div className="space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                        <HelpCircle size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-300/80">
                            <strong className="text-blue-400">About Currencies:</strong> Choose which currencies your business accepts. The <strong>primary currency</strong> is used for your default pricing and reports. Set an <strong>exchange rate</strong> for each enabled currency so prices are accurately converted at checkout.
                        </div>
                    </div>

                    {/* Primary Currency */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Primary Currency</label>
                        <select value={primaryCurrency} onChange={e => { setPrimaryCurrency(e.target.value); if (!currencies.includes(e.target.value)) setCurrencies(prev => [...prev, e.target.value]); }}
                            className="bg-black/50 border border-slate-700/80 rounded-lg px-4 py-3 text-white text-sm focus:outline-none cursor-pointer appearance-none w-full max-w-sm">
                            {availableCurrencies.filter(c => currencies.includes(c.code)).map((c: any) => (
                                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name} ({c.symbol})</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1.5">This is your store's default currency for pricing and reports. Rate is always 1:1.</p>
                    </div>

                    {/* Currency Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {availableCurrencies.map((curr: any) => {
                            const active = currencies.includes(curr.code);
                            const isPrimary = primaryCurrency === curr.code;
                            const isExpanded = expandedRate === curr.code && active && !isPrimary;
                            const rate = currencyRates[curr.code];
                            return (
                                <div key={curr.code} className={`rounded-xl border transition-all ${active ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/40 opacity-60 hover:opacity-80'} ${isPrimary ? 'ring-1 ring-emerald-500/50' : ''}`}>
                                    {/* Currency header row */}
                                    <button
                                        onClick={() => {
                                            if (!isPrimary) {
                                                toggleCurrency(curr.code);
                                                if (!active) setExpandedRate(curr.code);
                                                else setExpandedRate(null);
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-4 text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{curr.flag}</span>
                                            <div>
                                                <div className="text-sm font-bold text-white">{curr.code} <span className="text-slate-400 font-normal">{curr.symbol}</span></div>
                                                <div className="text-[10px] text-slate-500">{curr.name}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isPrimary && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Primary</span>}
                                            {active && !isPrimary && rate && (
                                                <span className="text-[9px] text-slate-400 font-mono">×{rate.rateFromPrimary}</span>
                                            )}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'}`}>
                                                {active && <Check size={12} className="text-black" />}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Exchange Rate Config (expandable, shown when active) */}
                                    {active && !isPrimary && (
                                        <div className="border-t border-slate-800/60">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedRate(isExpanded ? null : curr.code)}
                                                className="w-full flex items-center justify-between px-4 py-2 text-[10px] text-slate-400 hover:text-slate-200 transition"
                                            >
                                                <span className="flex items-center gap-1"><TrendingUp size={10} /> Exchange Rate Settings</span>
                                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                            </button>

                                            {isExpanded && (
                                                <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-1 duration-150">
                                                    {/* Rate */}
                                                    <div>
                                                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">1 {primaryCurrency} = ? {curr.code}</label>
                                                        <div className="flex items-center bg-black/30 border border-slate-700 rounded-lg overflow-hidden">
                                                            <span className="px-2.5 py-2 text-[11px] text-slate-500 bg-slate-800/60 border-r border-slate-700 font-mono">×</span>
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                min="0.001"
                                                                value={rate?.rateFromPrimary ?? DEFAULT_RATES[curr.code] ?? 1}
                                                                onChange={e => updateRate(curr.code, 'rateFromPrimary', parseFloat(e.target.value) || 1)}
                                                                className="flex-1 bg-transparent px-2.5 py-2 text-white text-xs font-mono focus:outline-none"
                                                            />
                                                        </div>
                                                        <p className="text-[9px] text-slate-600 mt-0.5">Default pre-filled. Update monthly for accuracy.</p>
                                                    </div>

                                                    {/* Markup */}
                                                    <div>
                                                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Markup %</label>
                                                        <div className="flex items-center bg-black/30 border border-slate-700 rounded-lg overflow-hidden">
                                                            <input
                                                                type="number"
                                                                step="0.5"
                                                                min="0"
                                                                max="30"
                                                                value={rate?.markupPercent ?? 0}
                                                                onChange={e => updateRate(curr.code, 'markupPercent', parseFloat(e.target.value) || 0)}
                                                                className="flex-1 bg-transparent px-2.5 py-2 text-white text-xs font-mono focus:outline-none"
                                                            />
                                                            <span className="px-2.5 py-2 text-[11px] text-slate-500 bg-slate-800/60 border-l border-slate-700 font-mono">%</span>
                                                        </div>
                                                        <p className="text-[9px] text-slate-600 mt-0.5">Added to cover FX fees (0–30%)</p>
                                                    </div>

                                                    {/* Rounding */}
                                                    <div>
                                                        <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Price Rounding</label>
                                                        <select
                                                            value={rate?.roundingRule ?? 'nearest_99'}
                                                            onChange={e => updateRate(curr.code, 'roundingRule', e.target.value)}
                                                            className="w-full bg-black/30 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-[11px] focus:outline-none cursor-pointer appearance-none"
                                                        >
                                                            <option value="none">No rounding</option>
                                                            <option value="nearest_whole">Nearest whole number</option>
                                                            <option value="nearest_99">Nearest .99 (e.g. 19.99)</option>
                                                            <option value="nearest_50">Nearest .50</option>
                                                        </select>
                                                    </div>

                                                    {/* Preview */}
                                                    {rate && (
                                                        <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-[10px]">
                                                            <div className="text-slate-500 mb-1">Preview: 100 {primaryCurrency}</div>
                                                            <div className="text-white font-mono font-bold">
                                                                {curr.symbol}{(100 * rate.rateFromPrimary * (1 + (rate.markupPercent || 0) / 100)).toFixed(2)} {curr.code}
                                                            </div>
                                                            <div className="text-slate-600 mt-0.5">Rate: ×{rate.rateFromPrimary} + {rate.markupPercent || 0}% markup</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── TAX TAB ─── */}
            {section === 'tax' && (
                <div className="space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                        <HelpCircle size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-300/80">
                            <strong className="text-blue-400">About Tax:</strong> Configure tax rates by region. Tax is applied during checkout. Choose whether prices are shown <strong>inclusive</strong> (tax already in price) or <strong>exclusive</strong> (tax added at checkout).
                        </div>
                    </div>

                    {/* Tax Mode */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <h3 className="text-sm font-bold text-white mb-1">Tax Display Mode</h3>
                        <p className="text-[11px] text-slate-500 mb-4">How prices are shown to customers</p>
                        <div className="flex gap-3">
                            {(['exclusive', 'inclusive'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setTaxMode(mode)}
                                    className={`flex-1 rounded-lg border p-4 text-left transition-all ${taxMode === mode ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'}`}
                                >
                                    <div className={`text-sm font-bold mb-1 capitalize ${taxMode === mode ? 'text-emerald-300' : 'text-white'}`}>{mode}</div>
                                    <p className="text-[11px] text-slate-400">
                                        {mode === 'exclusive'
                                            ? 'Prices shown without tax. Tax is added separately at checkout. Common for B2B.'
                                            : 'Tax is already included in the displayed price. Customer sees final price upfront. Common for retail.'}
                                    </p>
                                    {taxMode === mode && (
                                        <span className="inline-flex items-center gap-1 mt-2 text-[9px] font-bold uppercase text-emerald-400">
                                            <Check size={10} /> Active
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add Tax Rate */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Plus size={14} className="text-emerald-400" /> Add Tax Rate
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Region</label>
                                <select value={newTaxRate.region} onChange={e => setNewTaxRate(p => ({ ...p, region: e.target.value }))}
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none cursor-pointer appearance-none">
                                    {TAX_REGIONS.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Sub-region</label>
                                <select value={newTaxRate.subregion} onChange={e => setNewTaxRate(p => ({ ...p, subregion: e.target.value }))}
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none cursor-pointer appearance-none">
                                    {(TAX_REGIONS.find(r => r.code === newTaxRate.region)?.regions || []).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Rate %</label>
                                <div className="flex items-center bg-black/50 border border-slate-700 rounded-lg overflow-hidden">
                                    <input type="number" min="0" max="100" step="0.5" value={newTaxRate.rate}
                                        onChange={e => setNewTaxRate(p => ({ ...p, rate: e.target.value }))}
                                        className="flex-1 bg-transparent px-3 py-2 text-white text-xs focus:outline-none" />
                                    <span className="px-2 py-2 text-[11px] text-slate-500 bg-slate-800/60 border-l border-slate-700">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Tax Class</label>
                                <select value={newTaxRate.taxClass} onChange={e => setNewTaxRate(p => ({ ...p, taxClass: e.target.value }))}
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none cursor-pointer appearance-none">
                                    <option value="standard">Standard</option>
                                    <option value="reduced">Reduced</option>
                                    <option value="exempt">Exempt</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Label</label>
                                <input value={newTaxRate.label} onChange={e => setNewTaxRate(p => ({ ...p, label: e.target.value }))}
                                    placeholder="GST, VAT, Sales Tax..."
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none placeholder-slate-600" />
                            </div>
                        </div>
                        <button onClick={addTaxRate}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition">
                            <Plus size={12} /> Add Rate
                        </button>
                    </div>

                    {/* Tax Rate Table */}
                    {taxRates.length > 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-800/60">
                                <h3 className="text-sm font-bold text-white">Active Tax Rates</h3>
                            </div>
                            <div className="divide-y divide-slate-800/60">
                                {taxRates.map(rate => (
                                    <div key={rate.id} className="px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Globe size={14} className="text-slate-500" />
                                            <div>
                                                <div className="text-sm font-semibold text-white">{rate.label} — {rate.rate}%</div>
                                                <div className="text-[10px] text-slate-500">{rate.region} · {rate.subregion} · <span className="capitalize">{rate.taxClass}</span></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${rate.taxClass === 'standard' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : rate.taxClass === 'reduced' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                                                {rate.taxClass}
                                            </span>
                                            <button onClick={() => removeTaxRate(rate.id)}
                                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition">
                                                <X size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500 text-sm">
                            No tax rates configured. Add your first rate above.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
