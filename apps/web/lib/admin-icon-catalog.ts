import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    AlertCircle,
    AlignJustify,
    Aperture,
    AppWindow,
    Archive,
    ArrowUpRight,
    AtSign,
    BadgeCheck,
    Banknote,
    BarChart3,
    Bell,
    Blend,
    BookOpen,
    Bookmark,
    Bot,
    Boxes,
    Briefcase,
    Brush,
    Building2,
    Calendar,
    Camera,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Cloud,
    Code2,
    Compass,
    Contact2,
    CreditCard,
    Database,
    Download,
    Edit3,
    Eye,
    File,
    FileCode2,
    FileImage,
    FileSearch,
    Filter,
    Flag,
    Folder,
    FolderOpen,
    FolderSearch,
    Gift,
    Globe,
    GraduationCap,
    Grid3X3,
    Handshake,
    Heart,
    HelpCircle,
    Home,
    Image as ImageIcon,
    Inbox,
    KeyRound,
    Languages,
    Layers,
    LayoutDashboard,
    LayoutGrid,
    LifeBuoy,
    Lightbulb,
    Link2,
    ListChecks,
    Lock,
    Mail,
    MapPin,
    Megaphone,
    Menu,
    MessageSquare,
    Microscope,
    Monitor,
    MoonStar,
    Package,
    Palette,
    PanelLeft,
    PenTool,
    Phone,
    PieChart,
    Pin,
    Plug,
    Puzzle,
    Receipt,
    Rocket,
    Save,
    Scissors,
    Search,
    Send,
    Server,
    Settings,
    Shield,
    ShoppingBag,
    ShoppingCart,
    Sparkles,
    Star,
    Store,
    Tag,
    Target,
    Terminal,
    Timer,
    Trash2,
    Truck,
    Upload,
    User,
    UserRound,
    Users,
    Wand2,
    Wifi,
    Workflow,
    Wrench,
    FileText,
} from 'lucide-react';

export type AdminIconOption = {
    key: string;
    label: string;
    icon: LucideIcon;
    keywords: string[];
};

type IconCatalogEntry = {
    key: string;
    icon: LucideIcon;
    keywords?: string[];
};

function keyToWords(value: string): string[] {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
}

function keyToLabel(value: string): string {
    return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

const ICON_CATALOG: IconCatalogEntry[] = [
    { key: 'LayoutDashboard', icon: LayoutDashboard, keywords: ['overview', 'home', 'panel'] },
    { key: 'LayoutGrid', icon: LayoutGrid, keywords: ['grid', 'layout'] },
    { key: 'PanelLeft', icon: PanelLeft, keywords: ['sidebar', 'panel'] },
    { key: 'Grid3X3', icon: Grid3X3, keywords: ['blocks', 'tiles'] },
    { key: 'Layers', icon: Layers, keywords: ['sections', 'stack', 'builder'] },
    { key: 'AlignJustify', icon: AlignJustify, keywords: ['text', 'alignment'] },
    { key: 'Folder', icon: Folder, keywords: ['content', 'files', 'directory'] },
    { key: 'FolderOpen', icon: FolderOpen, keywords: ['content', 'open'] },
    { key: 'FolderSearch', icon: FolderSearch, keywords: ['browse', 'search'] },
    { key: 'Archive', icon: Archive, keywords: ['storage', 'history'] },
    { key: 'File', icon: File, keywords: ['document', 'page'] },
    { key: 'FileCode2', icon: FileCode2, keywords: ['code', 'template'] },
    { key: 'FileImage', icon: FileImage, keywords: ['asset', 'media'] },
    { key: 'FileSearch', icon: FileSearch, keywords: ['lookup', 'audit'] },
    { key: 'ClipboardList', icon: ClipboardList, keywords: ['tasks', 'checklist'] },
    { key: 'BookOpen', icon: BookOpen, keywords: ['knowledge', 'docs'] },
    { key: 'Bookmark', icon: Bookmark, keywords: ['save', 'favorite'] },
    { key: 'Globe', icon: Globe, keywords: ['website', 'public', 'discover'] },
    { key: 'MapPin', icon: MapPin, keywords: ['location', 'city'] },
    { key: 'Compass', icon: Compass, keywords: ['navigation', 'direction'] },
    { key: 'Home', icon: Home, keywords: ['landing', 'main'] },
    { key: 'Store', icon: Store, keywords: ['shop', 'marketplace'] },
    { key: 'ShoppingBag', icon: ShoppingBag, keywords: ['commerce', 'products'] },
    { key: 'ShoppingCart', icon: ShoppingCart, keywords: ['cart', 'checkout'] },
    { key: 'Package', icon: Package, keywords: ['sku', 'inventory'] },
    { key: 'Boxes', icon: Boxes, keywords: ['catalog', 'variants'] },
    { key: 'Truck', icon: Truck, keywords: ['shipping', 'delivery'] },
    { key: 'CreditCard', icon: CreditCard, keywords: ['payments', 'billing'] },
    { key: 'Banknote', icon: Banknote, keywords: ['money', 'finance'] },
    { key: 'Receipt', icon: Receipt, keywords: ['invoice', 'orders'] },
    { key: 'PieChart', icon: PieChart, keywords: ['reports', 'analytics'] },
    { key: 'BarChart3', icon: BarChart3, keywords: ['charts', 'metrics'] },
    { key: 'Activity', icon: Activity, keywords: ['tracking', 'health'] },
    { key: 'Target', icon: Target, keywords: ['goals', 'kpi'] },
    { key: 'Megaphone', icon: Megaphone, keywords: ['campaign', 'ads', 'marketing'] },
    { key: 'Sparkles', icon: Sparkles, keywords: ['featured', 'highlight', 'magic'] },
    { key: 'Wand2', icon: Wand2, keywords: ['automation', 'ai', 'assistant'] },
    { key: 'Bot', icon: Bot, keywords: ['kalpbodh', 'koshie', 'ai'] },
    { key: 'MessageSquare', icon: MessageSquare, keywords: ['chat', 'support'] },
    { key: 'Mail', icon: Mail, keywords: ['email', 'newsletter'] },
    { key: 'Send', icon: Send, keywords: ['push', 'publish'] },
    { key: 'Bell', icon: Bell, keywords: ['alerts', 'notifications'] },
    { key: 'Contact2', icon: Contact2, keywords: ['crm', 'contact'] },
    { key: 'Users', icon: Users, keywords: ['team', 'customers', 'accounts'] },
    { key: 'User', icon: User, keywords: ['profile', 'member'] },
    { key: 'UserRound', icon: UserRound, keywords: ['account', 'identity'] },
    { key: 'Briefcase', icon: Briefcase, keywords: ['business', 'agency'] },
    { key: 'Handshake', icon: Handshake, keywords: ['partners', 'deals'] },
    { key: 'Building2', icon: Building2, keywords: ['organization', 'company'] },
    { key: 'Palette', icon: Palette, keywords: ['branding', 'theme', 'colors'] },
    { key: 'Brush', icon: Brush, keywords: ['design', 'paint'] },
    { key: 'Blend', icon: Blend, keywords: ['color', 'palette'] },
    { key: 'Image', icon: ImageIcon, keywords: ['media', 'photos'] },
    { key: 'Camera', icon: Camera, keywords: ['gallery', 'images'] },
    { key: 'PenTool', icon: PenTool, keywords: ['editor', 'vector'] },
    { key: 'Scissors', icon: Scissors, keywords: ['trim', 'cut'] },
    { key: 'Tag', icon: Tag, keywords: ['taxonomy', 'labels'] },
    { key: 'Filter', icon: Filter, keywords: ['filters', 'search'] },
    { key: 'Search', icon: Search, keywords: ['lookup', 'find'] },
    { key: 'KeyRound', icon: KeyRound, keywords: ['auth', 'security'] },
    { key: 'Shield', icon: Shield, keywords: ['permissions', 'roles', 'admin'] },
    { key: 'CheckCircle2', icon: CheckCircle2, keywords: ['approved', 'status'] },
    { key: 'AlertCircle', icon: AlertCircle, keywords: ['warning', 'errors'] },
    { key: 'Lock', icon: Lock, keywords: ['privacy', 'secure'] },
    { key: 'Settings', icon: Settings, keywords: ['preferences', 'config'] },
    { key: 'Wrench', icon: Wrench, keywords: ['tools', 'maintenance'] },
    { key: 'Plug', icon: Plug, keywords: ['integration', 'connectors'] },
    { key: 'Workflow', icon: Workflow, keywords: ['pipeline', 'automation'] },
    { key: 'Database', icon: Database, keywords: ['registry', 'data', 'records'] },
    { key: 'Server', icon: Server, keywords: ['infra', 'backend'] },
    { key: 'Cloud', icon: Cloud, keywords: ['hosting', 'cloud'] },
    { key: 'Terminal', icon: Terminal, keywords: ['console', 'cli', 'debug'] },
    { key: 'Code2', icon: Code2, keywords: ['developer', 'engineering'] },
    { key: 'AppWindow', icon: AppWindow, keywords: ['app', 'window'] },
    { key: 'Monitor', icon: Monitor, keywords: ['desktop', 'screen'] },
    { key: 'Aperture', icon: Aperture, keywords: ['focus', 'lens'] },
    { key: 'MoonStar', icon: MoonStar, keywords: ['dark mode', 'appearance'] },
    { key: 'Lightbulb', icon: Lightbulb, keywords: ['ideas', 'tips'] },
    { key: 'Rocket', icon: Rocket, keywords: ['launch', 'growth'] },
    { key: 'Pin', icon: Pin, keywords: ['pinned', 'priority'] },
    { key: 'Flag', icon: Flag, keywords: ['milestone', 'country'] },
    { key: 'Clock3', icon: Clock3, keywords: ['schedule', 'time'] },
    { key: 'Timer', icon: Timer, keywords: ['duration', 'countdown'] },
    { key: 'Calendar', icon: Calendar, keywords: ['booking', 'events'] },
    { key: 'Inbox', icon: Inbox, keywords: ['messages', 'leads'] },
    { key: 'Save', icon: Save, keywords: ['persist', 'draft'] },
    { key: 'Edit3', icon: Edit3, keywords: ['pencil', 'modify'] },
    { key: 'Trash2', icon: Trash2, keywords: ['delete', 'remove'] },
    { key: 'Download', icon: Download, keywords: ['export'] },
    { key: 'Upload', icon: Upload, keywords: ['import'] },
    { key: 'AtSign', icon: AtSign, keywords: ['username', 'email'] },
    { key: 'BadgeCheck', icon: BadgeCheck, keywords: ['verified', 'quality'] },
    { key: 'Gift', icon: Gift, keywords: ['offers', 'rewards'] },
    { key: 'GraduationCap', icon: GraduationCap, keywords: ['education', 'learning'] },
    { key: 'Microscope', icon: Microscope, keywords: ['research', 'analysis'] },
    { key: 'Puzzle', icon: Puzzle, keywords: ['modules', 'extensions'] },
    { key: 'ArrowUpRight', icon: ArrowUpRight, keywords: ['external', 'launch'] },
    { key: 'Link2', icon: Link2, keywords: ['links', 'url'] },
    { key: 'Menu', icon: Menu, keywords: ['navigation', 'hamburger'] },
    { key: 'Eye', icon: Eye, keywords: ['preview', 'visibility'] },
    { key: 'LifeBuoy', icon: LifeBuoy, keywords: ['support', 'help'] },
    { key: 'HelpCircle', icon: HelpCircle, keywords: ['guide', 'faq'] },
    { key: 'Phone', icon: Phone, keywords: ['call', 'contact'] },
    { key: 'Heart', icon: Heart, keywords: ['favorites', 'likes'] },
    { key: 'Wifi', icon: Wifi, keywords: ['network', 'online'] },
    { key: 'ListChecks', icon: ListChecks, keywords: ['todos', 'tasks'] },
    { key: 'FileText', icon: FileText, keywords: ['document', 'page', 'form', 'text'] },
];

export const ADMIN_ICON_OPTIONS: AdminIconOption[] = ICON_CATALOG.map((entry) => {
    const baseWords = keyToWords(entry.key);
    const merged = Array.from(new Set([...baseWords, ...(entry.keywords || [])]));
    return {
        key: entry.key,
        label: keyToLabel(entry.key),
        icon: entry.icon,
        keywords: merged,
    };
});

export const ADMIN_ICON_COMPONENTS: Record<string, LucideIcon> = ADMIN_ICON_OPTIONS.reduce(
    (acc, option) => {
        acc[option.key] = option.icon;
        return acc;
    },
    {} as Record<string, LucideIcon>
);

const ICON_ALIASES: Record<string, string> = {
    FolderIcon: 'Folder',
    dashboard: 'LayoutDashboard',
    settings: 'Settings',
    users: 'Users',
    layout: 'LayoutGrid',
    'file-text': 'FileText',
};

export function resolveAdminIcon(icon?: string): LucideIcon | null {
    if (!icon) return null;
    const key = ICON_ALIASES[icon] || icon;
    return ADMIN_ICON_COMPONENTS[key] || null;
}

export const DEFAULT_ADMIN_ICON_KEY = 'Layers';
