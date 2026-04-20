import { Palette, Shield, Building2, Boxes, Globe, Mail, Bot, DollarSign, Sparkles, SlidersHorizontal, Plug, Layers, BookMarked } from 'lucide-react';

export const REGISTRY_TABS = [
    { key: 'themes', label: 'Theme Presets', icon: Palette, color: 'purple' },
    { key: 'roles', label: 'Roles', icon: Shield, color: 'cyan' },
    { key: 'templates', label: 'Business Templates', icon: Building2, color: 'emerald' },
    { key: 'attributes', label: 'Attribute Catalog', icon: BookMarked, color: 'orange' },
    { key: 'modules', label: 'Apps', icon: Boxes, color: 'blue' },
    { key: 'languages', label: 'Languages', icon: Globe, color: 'amber' },
    { key: 'emails', label: 'Email Templates', icon: Mail, color: 'rose' },
    { key: 'currencies', label: 'Currencies', icon: DollarSign, color: 'lime' },
    { key: 'prompts', label: 'AI Prompts', icon: Bot, color: 'violet' },
    { key: 'features', label: 'Features', icon: Sparkles, color: 'cyan' },
    { key: 'options', label: 'Options', icon: SlidersHorizontal, color: 'amber' },
    { key: 'plugins', label: 'Add-ons', icon: Plug, color: 'emerald' },
    { key: 'category-templates', label: 'Category Templates', icon: Layers, color: 'teal' },
];

interface RegistryTabsProps {
    activeTab: string;
    onTabChange: (tabKey: string) => void;
    dataCounts: Record<string, number>;
}

export function RegistryTabs({ activeTab, onTabChange, dataCounts }: RegistryTabsProps) {
    return (
        <div className="flex gap-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 overflow-x-auto">
            {REGISTRY_TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                const count = dataCounts[tab.key] || 0;

                return (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${active
                            ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/30 shadow-[0_0_12px_rgba(0,0,0,0.3)]`
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                            }`}
                    >
                        <Icon size={14} />
                        {tab.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? `bg-${tab.color}-500/30` : 'bg-slate-800'
                            }`}>
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
