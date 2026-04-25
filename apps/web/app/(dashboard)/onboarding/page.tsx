"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  Sparkles,
  Box,
  CheckCircle2,
  ArrowRight,
  Activity,
  ArrowLeft,
  Palette,
  Database,
  Folder,
  Bot,
  Send,
  ShoppingBag,
  Calendar,
  Megaphone,
  FileText,
  Image,
  Receipt,
  Languages,
  Check,
  BedDouble,
  Map,
  Upload,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  enforceModuleSelectionRules,
  toggleModuleWithRules,
} from "@/lib/module-rules";
import {
  DEFAULT_ADMIN_THEME,
  mergeAdminTheme,
} from "@/lib/admin-theme";
import { getAppLabel } from "@/lib/app-labels";
import { TagInput } from "@/components/ui/tag-input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import {
  createAgency,
  createTenant,
  isApiError,
  register,
  syncTenantWebsite,
  type TenantDto,
  type TenantWebsiteDomainDto,
} from "@/lib/api";

const STEPS = [
  {
    id: "business",
    title: "Business Identity",
    description:
      "Define the business profile, primary admin owner, and onboarding mode before anything is provisioned.",
    icon: Building2,
  },
  {
    id: "branding",
    title: "Brand & Admin",
    description:
      "Upload the tenant brand and verify how it will appear across the admin panel and seeded frontend.",
    icon: Palette,
  },
  {
    id: "languages",
    title: "Languages",
    description:
      "Choose the operating languages that shape the default workspace and public experience.",
    icon: Languages,
  },
  {
    id: "modules",
    title: "App Selection",
    description:
      "Review the module stack, keep only what this business needs, and shape the initial operating system.",
    icon: Box,
  },
  {
    id: "ai",
    title: "AI Assistant",
    description:
      "Use the copilot to explain selections, spot gaps, and review the setup before final deployment.",
    icon: Bot,
  },
  {
    id: "review",
    title: "Review",
    description:
      "Validate the final workspace plan, database mode, credentials, and deployment details.",
    icon: Sparkles,
  },
];

const ALL_MODULES = [
  {
    key: "website",
    label: "Website",
    icon: Globe,
    color: "cyan",
    desc: "CMS, pages, domains",
  },
  {
    key: "branding",
    label: "Branding & Design",
    icon: Palette,
    color: "purple",
    desc: "Logo, colors, guidelines",
  },
  {
    key: "products",
    label: "Products",
    icon: ShoppingBag,
    color: "emerald",
    desc: "Catalog, variants, attributes",
  },
  {
    key: "ecommerce",
    label: "E-Commerce",
    icon: ShoppingBag,
    color: "amber",
    desc: "Cart, checkout, payments",
  },
  {
    key: "bookings",
    label: "Bookings",
    icon: Calendar,
    color: "rose",
    desc: "Appointments, scheduling",
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: Megaphone,
    color: "orange",
    desc: "Campaigns, coupons, email",
  },
  {
    key: "blog",
    label: "Blog & Content",
    icon: FileText,
    color: "sky",
    desc: "Posts, categories, SEO",
  },
  {
    key: "media",
    label: "Media Library",
    icon: Image,
    color: "violet",
    desc: "Images, videos, documents",
  },
  {
    key: "portfolio",
    label: "Portfolio",
    icon: Folder,
    color: "teal",
    desc: "Projects, case studies",
  },
  {
    key: "invoicing",
    label: "Invoicing",
    icon: Receipt,
    color: "lime",
    desc: "Bills, payments, tracking",
  },
  {
    key: "kalpbodh",
    label: "KalpAI",
    icon: Bot,
    color: "indigo",
    desc: "Role-aware AI analysis and planning",
  },
  {
    key: "hotel_management",
    label: "Hotel Management",
    icon: BedDouble,
    color: "pink",
    desc: "Rooms, housekeeping, pricing, front desk",
  },
  {
    key: "tour_management",
    label: "Tour Management",
    icon: Map,
    color: "green",
    desc: "Tours, departures, itineraries, travelers",
  },
];

const AI_QUICK_PROMPTS = [
  "Explain why these modules were selected",
  "Suggest any missing modules for this business",
  "Recommend category and attribute setup",
  "Should this stay full tenant or be lighter",
] as const;

function normalizeAiResponseContent(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type DeploymentSummary = {
  tenantKey: string;
  tenantName: string;
  agencySlug: string;
  provisioningMode: "full_tenant" | "lite_profile";
  loginUrl: string;
  ownerAdminEmail: string;
  ownerAdminPassword: string;
  primaryDomains: string[];
  websiteProvider: string | null;
  websiteStatus: string;
  websiteUrl: string | null;
  repoUrl: string | null;
  platformUrl: string | null;
  platformHost: string | null;
  websiteMessage: string | null;
  domains: TenantWebsiteDomainDto[];
  ownerAccountMessage: string | null;
  publicSlug: string;
  databaseMode: string;
  databaseName: string;
};

type SupportedVerticalPack = "commerce" | "hotel";

function slugifyValue(value: string, fallback: string, maxLength = 80) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-{2,}/g, "-");
  const trimmed = normalized.slice(0, maxLength).replace(/-$/g, "");
  return trimmed || fallback;
}

function normalizeDomain(value: string) {
  let host = value.trim().toLowerCase();
  if (!host) {
    return "";
  }
  host = host.replace(/^https?:\/\//, "");
  host = host.split("/", 1)[0] ?? "";
  host = host.split(":", 1)[0] ?? "";
  return host.replace(/^\.+|\.+$/g, "");
}

function normalizePrimaryDomains(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeDomain(value))
        .filter((value) => value.includes("."))
    )
  );
}

function normalizeLanguageCode(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-");
}

function buildSelectedLanguageOption(availableLanguages: any[], code: string) {
  const normalizedCode = normalizeLanguageCode(code);
  const matched = availableLanguages.find(
    (language: any) => normalizeLanguageCode(String(language?.code ?? "")) === normalizedCode,
  );

  if (matched) {
    return {
      ...matched,
      code: normalizedCode,
      name: matched.name || normalizedCode.toUpperCase(),
      nativeName: matched.nativeName || matched.name || normalizedCode.toUpperCase(),
      flag: matched.flag || "🌐",
    };
  }

  return {
    code: normalizedCode,
    name: normalizedCode.toUpperCase(),
    nativeName: "Custom language code",
    flag: "🌐",
  };
}

function buildPlatformUrlFallback(tenantSlug: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const hostname = window.location.hostname.toLowerCase();
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  const rootHost = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  if (!rootHost.includes(".")) {
    return null;
  }

  return `${window.location.protocol}//${tenantSlug}.${rootHost}`;
}

function inferVerticalPack(selectedBusinessTypes: any[], enabledModules: string[]): SupportedVerticalPack {
  const tokens = [
    ...selectedBusinessTypes.flatMap((item) => {
      if (typeof item === "string") {
        return [item];
      }
      return [item?.name, item?.key, item?.type].filter(Boolean);
    }),
    ...enabledModules,
  ]
    .map((value) => String(value).toLowerCase())
    .join(" ");

  if (/(hotel|hospitality|stay|room|resort|property)/.test(tokens)) {
    return "hotel";
  }

  if (/(travel|tour|trip|package)/.test(tokens)) {
    throw new Error(
      "Travel onboarding is not live in this workflow yet. Use a commerce or hotel business configuration."
    );
  }

  return "commerce";
}

function buildFeatureFlags(enabledModules: string[], featureFlags: Record<string, boolean>, primaryDomains: string[]) {
  const flags = Object.entries(featureFlags)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => key);

  if (enabledModules.includes("website")) {
    flags.push("seo-suite");
  }
  if (primaryDomains.length > 0) {
    flags.push("custom-domain");
  }
  if (enabledModules.includes("kalpbodh")) {
    flags.push("tenant-ai-governance");
  }

  return Array.from(new Set(flags));
}

function buildDeploymentSummary(
  tenant: TenantDto,
  options: {
    agencySlug: string;
    businessName: string;
    provisioningMode: "full_tenant" | "lite_profile";
    ownerAdminEmail: string;
    ownerAdminPassword: string;
    primaryDomains: string[];
    ownerAccountMessage?: string | null;
  }
): DeploymentSummary {
  const websiteDeployment = tenant.website_deployment;
  const platformUrl =
    websiteDeployment?.platform_url ??
    buildPlatformUrlFallback(tenant.slug);
  const platformHost =
    websiteDeployment?.platform_host ??
    (platformUrl ? new URL(platformUrl).host : null);
  return {
    tenantKey: tenant.slug,
    tenantName: options.businessName || "Unnamed Business",
    agencySlug: options.agencySlug,
    provisioningMode: options.provisioningMode,
    loginUrl: "/login",
    ownerAdminEmail: options.ownerAdminEmail,
    ownerAdminPassword: options.ownerAdminPassword,
    primaryDomains: options.primaryDomains,
    websiteProvider: websiteDeployment?.provider ?? null,
    websiteStatus: websiteDeployment?.status ?? "disabled",
    websiteUrl: websiteDeployment?.production_url ?? `${window.location.origin}/${tenant.slug}`,
    repoUrl: websiteDeployment?.repo_url ?? null,
    platformUrl,
    platformHost,
    websiteMessage: websiteDeployment?.message ?? null,
    domains: websiteDeployment?.domains ?? [],
    ownerAccountMessage: options.ownerAccountMessage ?? null,
    publicSlug: tenant.slug,
    databaseMode: tenant.infra_mode === "dedicated" ? "dedicated" : "shared",
    databaseName:
      tenant.runtime_documents?.database ??
      (tenant.infra_mode === "dedicated"
        ? `kalpzero_runtime__tenant__${tenant.slug}`
        : "shared runtime database"),
  };
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { session, status, token } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSyncingDomains, setIsSyncingDomains] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wizardShellRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Data loaded from kalp_system
  const [industries, setIndustries] = useState<any[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [landingTemplates, setLandingTemplates] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    businessName: "",
    accountType: "business" as "business" | "personal_portfolio",
    provisioningMode: "full_tenant" as "full_tenant" | "lite_profile",
    industry: "",
    businessType: [] as any[],
    primaryDomains: [] as string[],
    brand: {
      primary: "#00f0ff",
      secondary: "#8b5cf6",
      accent: "#00f0ff",
      background: "#030712",
      foreground: "#ffffff",
      muted: "#1e293b",
      mutedForeground: "#94a3b8",
      border: "#334155",
      input: "#0f172a",
      ring: "#00f0ff",
      fonts: {
        heading: "Inter",
        body: "Inter",
      },
      customCSS: "",
      logo: {
        url: "",
        width: 200,
        height: 60,
      },
      buttonRadius: "0.5rem",
    },
    enabledModules: ["branding", "website"] as string[],
    categorySeedPreset: [] as string[],
    attributePool: [] as string[],
    featureFlags: {} as Record<string, boolean>,
    languages: ["en"] as string[],
    primaryLanguage: "en",
    defaultLandingTemplateKey: "",
    ownerAdminName: "",
    ownerAdminEmail: "",
    ownerAdminPassword: "",
    adminTheme: mergeAdminTheme(DEFAULT_ADMIN_THEME),
    businessContexts: [],
  });

  const [attributeCatalog, setAttributeCatalog] = useState<any>(null);
  const [selectedInfoBt, setSelectedInfoBt] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [languageQuery, setLanguageQuery] = useState("");
  const [deploymentResult, setDeploymentResult] =
    useState<DeploymentSummary | null>(null);

  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [aiMessages, setAiMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canProvision =
    status === "authenticated" &&
    (session?.role === "platform_admin" || session?.role === "platform_owner");

  useEffect(() => {
    if (status === "anonymous") {
      router.push("/login");
    }
  }, [router, status]);

  // Load data from kalp_system on mount
  useEffect(() => {
    setIsLoadingData(true);
    Promise.all([
      fetch("/api/system/templates").then((r) => r.json()),
      fetch("/api/system/languages").then((r) => r.json()),
      fetch("/api/system/landing-templates").then((r) => r.json()),
      fetch("/api/system/business-attributes")
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([templates, langs, landing, attrCatalog]) => {
        setIndustries(Array.isArray(templates) ? templates : []);
        setAvailableLanguages(Array.isArray(langs) ? langs : []);
        setAttributeCatalog(attrCatalog);
        const landingList = Array.isArray(landing) ? landing : [];
        setLandingTemplates(landingList);
        if (landingList.length > 0) {
          setFormData((prev) => ({
            ...prev,
            defaultLandingTemplateKey:
              prev.defaultLandingTemplateKey || landingList[0]?.key || "",
          }));
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingData(false));
  }, []);

  // When industry changes, load the matching business types
  useEffect(() => {
    if (formData.industry) {
      const match = industries.find(
        (t: any) => t.industry === formData.industry,
      );
      setBusinessTypes(match?.businessTypes || []);
      setFormData((prev) => ({
        ...prev,
        businessType: [],
        categorySeedPreset: [],
        attributePool: [],
        featureFlags: {},
      }));
    }
  }, [formData.industry, industries]);

  // When business types are updated, re-calculate merged settings
  useEffect(() => {
    if (formData.businessType.length > 0 && businessTypes.length > 0) {
      let mergedModules = ["branding", "website", "kalpbodh"];
      let mergedAttributes = [] as string[];
      let mergedSeedPresets = [] as string[];
      let mergedFlags = {} as Record<string, boolean>;

      formData.businessType.forEach((btObj: any) => {
        const btName = typeof btObj === "string" ? btObj : btObj.name;
        const template = businessTypes.find(
          (bt: any) =>
            bt.name === btName ||
            bt.key === btName ||
            bt.key === (typeof btObj === "object" ? btObj.key : ""),
        );
        if (template) {
          const pooledAttributes = Array.isArray(template.attributePool)
            ? template.attributePool
            : [];
          const presets = Array.isArray(template.attributeSetPreset)
            ? template.attributeSetPreset
            : template.attributeSetPreset
              ? [template.attributeSetPreset]
              : [];

          const presetAttributes = presets.flatMap((p: any) =>
            Array.isArray(p.attributes)
              ? p.attributes
                .map((attribute: any) =>
                  typeof attribute?.key === "string"
                    ? attribute.key.trim()
                    : "",
                )
                .filter(Boolean)
              : [],
          );

          mergedModules = [
            ...new Set([...mergedModules, ...(template.enabledModules || [])]),
          ];
          mergedAttributes = [
            ...new Set([
              ...mergedAttributes,
              ...pooledAttributes,
              ...presetAttributes,
            ]),
          ];
          mergedSeedPresets = [
            ...new Set([
              ...mergedSeedPresets,
              ...(template.categorySeedPreset || []),
            ]),
          ];
          mergedFlags = { ...mergedFlags, ...(template.featureFlags || {}) };
        }
      });

      const moduleResolution = enforceModuleSelectionRules(mergedModules);
      setFormData((prev) => ({
        ...prev,
        enabledModules:
          prev.provisioningMode === "lite_profile"
            ? enforceModuleSelectionRules(["website", "branding", "kalpbodh"])
              .modules
            : [...moduleResolution.modules],
        categorySeedPreset: mergedSeedPresets,
        attributePool: mergedAttributes,
        featureFlags: mergedFlags,
      }));
    }
  }, [formData.businessType, businessTypes, formData.provisioningMode]);

  useEffect(() => {
    const firstBt = formData.businessType[0];
    const primaryBt = typeof firstBt === "string" ? firstBt : firstBt?.name;
    if (!primaryBt) return;
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const businessTypeKey = normalize(primaryBt);
    const matched = landingTemplates.find((template: any) => {
      const typeKey =
        typeof template?.businessType === "string"
          ? normalize(template.businessType)
          : "";
      return typeKey === businessTypeKey;
    });
    if (!matched?.key) return;
    setFormData((prev) => ({
      ...prev,
      defaultLandingTemplateKey: prev.defaultLandingTemplateKey || matched.key,
    }));
  }, [formData.businessType, landingTemplates]);

  useEffect(() => {
    if (formData.provisioningMode !== "lite_profile") return;
    const liteModules = enforceModuleSelectionRules([
      "website",
      "branding",
      "kalpbodh",
    ]).modules;
    const hasDiff =
      liteModules.length !== formData.enabledModules.length ||
      liteModules.some(
        (item, index) => formData.enabledModules[index] !== item,
      );
    if (!hasDiff) return;
    setFormData((prev) => ({ ...prev, enabledModules: liteModules }));
  }, [formData.provisioningMode, formData.enabledModules]);

  // AI greeting when entering the AI step
  useEffect(() => {
    if (activeStep === 4 && aiMessages.length === 0) {
      const typesStr = formData.businessType
        .map((bt: any) => (typeof bt === "string" ? bt : bt.name))
        .join(" & ");
      const greeting =
        formData.businessType.length > 0
          ? `Welcome. You're setting up a ${typesStr} business in the ${formData.industry} industry. I've pre-configured ${formData.enabledModules.length} app(s) and ${formData.languages.length} language(s) for you.\n\nUse this section to understand why apps were selected, ask for missing recommendations, or review setup choices before deployment.`
          : `Welcome! Tell me about your business and I'll help configure the best setup for you.`;
      setAiMessages([{ role: "assistant", content: greeting }]);
    }
  }, [
    activeStep,
    formData.businessType,
    formData.industry,
    formData.enabledModules.length,
    formData.languages.length,
    aiMessages.length,
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      wizardShellRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeStep, deploymentResult]);

  const submitAiPrompt = async (prompt: string) => {
    const userMsg = prompt.trim();
    if (!userMsg || aiLoading) return;
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are the Kalp-Zero AI assistant helping set up a ${formData.businessType
                .map((bt: any) => (typeof bt === "string" ? bt : bt.name))
                .join(
                  ", ",
                )} business in ${formData.industry}. Enabled apps: ${formData.enabledModules.join(", ")}. Attribute pool: ${formData.attributePool.join(", ")}. Be concise, helpful, and suggest configurations. Use plain text only, no markdown formatting. Respond in 3 to 5 short bullets or a short paragraph, never a long essay.`,
            },
            ...aiMessages,
            { role: "user", content: userMsg },
          ],
        }),
      });
      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: normalizeAiResponseContent(
            data.reply ||
              data.message ||
              "I can help you configure your workspace. What would you like to know?",
          ),
        },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I can help configure your workspace. Ask me about apps, attributes, or best practices for your business type!",
        },
      ]);
    }
    setAiLoading(false);
  };

  const handleAiSend = async () => {
    await submitAiPrompt(aiInput);
  };

  const handleNext = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (deploymentResult) return;
    if (activeStep > 0) {
      setActiveStep((s) => s - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (deploymentResult) return;
    // Allow navigation to completed steps or the next step
    if (index <= activeStep + 1 || index < activeStep) {
      setActiveStep(index);
    }
  };

  const toggleLanguage = (code: string) => {
    const normalizedCode = normalizeLanguageCode(code);
    if (!normalizedCode) {
      return;
    }

    setFormData((prev) => {
      const currentLanguages = Array.from(
        new Set(prev.languages.map(normalizeLanguageCode).filter(Boolean)),
      );

      if (currentLanguages.includes(normalizedCode)) {
        if (currentLanguages.length === 1) {
          return prev;
        }
        const nextLanguages = currentLanguages.filter(
          (item) => item !== normalizedCode,
        );
        return {
          ...prev,
          languages: nextLanguages,
          primaryLanguage:
            normalizeLanguageCode(prev.primaryLanguage) === normalizedCode
              ? nextLanguages[0] ?? prev.primaryLanguage
              : prev.primaryLanguage,
        };
      }

      return {
        ...prev,
        languages: [...currentLanguages, normalizedCode],
        primaryLanguage:
          normalizeLanguageCode(prev.primaryLanguage) || normalizedCode,
      };
    });
  };

  const addLanguage = (value: string) => {
    const normalizedValue = normalizeLanguageCode(value);
    if (!normalizedValue) {
      return;
    }

    setFormData((prev) => {
      const currentLanguages = Array.from(
        new Set(prev.languages.map(normalizeLanguageCode).filter(Boolean)),
      );
      if (currentLanguages.includes(normalizedValue)) {
        return {
          ...prev,
          primaryLanguage:
            normalizeLanguageCode(prev.primaryLanguage) || normalizedValue,
        };
      }
      return {
        ...prev,
        languages: [...currentLanguages, normalizedValue],
        primaryLanguage:
          normalizeLanguageCode(prev.primaryLanguage) || normalizedValue,
      };
    });
  };

  const removeLanguage = (value: string) => {
    const normalizedValue = normalizeLanguageCode(value);
    if (!normalizedValue) {
      return;
    }

    setFormData((prev) => {
      const currentLanguages = Array.from(
        new Set(prev.languages.map(normalizeLanguageCode).filter(Boolean)),
      );
      if (currentLanguages.length <= 1) {
        return prev;
      }
      const nextLanguages = currentLanguages.filter(
        (item) => item !== normalizedValue,
      );
      return {
        ...prev,
        languages: nextLanguages,
        primaryLanguage:
          normalizeLanguageCode(prev.primaryLanguage) === normalizedValue
            ? nextLanguages[0] ?? prev.primaryLanguage
            : prev.primaryLanguage,
      };
    });
  };

  const commitLanguageQuery = () => {
    const trimmedQuery = languageQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    const exactMatch = availableLanguages.find((language: any) => {
      const normalizedQuery = normalizeLanguageCode(trimmedQuery);
      const values = [
        String(language?.code ?? ""),
        String(language?.name ?? ""),
        String(language?.nativeName ?? ""),
      ]
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      return (
        values.includes(trimmedQuery.toLowerCase()) ||
        values.includes(normalizedQuery)
      );
    });

    addLanguage(
      exactMatch?.code ||
        (filteredLanguages.length === 1 ? filteredLanguages[0]?.code : "") ||
        trimmedQuery,
    );
    setLanguageQuery("");
  };

  const toggleModule = (mod: string) => {
    setFormData((prev) => ({
      ...prev,
      enabledModules: toggleModuleWithRules(prev.enabledModules, mod),
    }));
  };

  const toggleBusinessType = (bt: any) => {
    const btName: string = bt.name;
    setFormData((prev) => ({
      ...prev,
      businessType: prev.businessType.find((b: any) => b.name === btName)
        ? prev.businessType.filter((b: any) => b.name !== btName)
        : [...prev.businessType, bt],
    }));
  };

  const showBtInfo = (bt: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const catalogEntry = attributeCatalog?.industries
      ?.flatMap((i: any) => i.businessTypes)
      ?.find((cbt: any) => cbt.key === bt.key || cbt.name === bt.name);
    setSelectedInfoBt(catalogEntry || bt);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData((prev) => ({
          ...prev,
          brand: {
            ...prev.brand,
            logo: {
              ...prev.brand.logo,
              url: result,
            },
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview("");
    setFormData((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        logo: {
          ...prev.brand.logo,
          url: "",
        },
      },
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeploy = async () => {
    if (!token || !canProvision) {
      alert("Log in as a platform admin before onboarding a business.");
      return;
    }

    if (
      !formData.ownerAdminEmail ||
      !formData.ownerAdminPassword ||
      formData.ownerAdminPassword.length < 8
    ) {
      alert(
        "Owner admin email and password (minimum 8 characters) are required to create tenant access.",
      );
      return;
    }
    setIsDeploying(true);
    const tenantSlug = slugifyValue(
      formData.businessName,
      `business-${Date.now().toString().slice(-6)}`,
      64,
    );
    const agencySlug = slugifyValue(`${tenantSlug}-agency`, `agency-${tenantSlug}`, 80);
    const primaryDomains = normalizePrimaryDomains(formData.primaryDomains);
    const normalizedLanguages = Array.from(
      new Set(formData.languages.map(normalizeLanguageCode).filter(Boolean)),
    );
    const resolvedPrimaryLanguage =
      normalizeLanguageCode(formData.primaryLanguage) ||
      normalizedLanguages[0] ||
      "en";
    const onboardingLanguages = Array.from(
      new Set([resolvedPrimaryLanguage, ...normalizedLanguages].filter(Boolean)),
    );
    const websiteFeatureFlags = buildFeatureFlags(
      formData.enabledModules,
      formData.featureFlags,
      primaryDomains,
    );
    const verticalPack = inferVerticalPack(formData.businessType, formData.enabledModules);
    const infraMode = formData.provisioningMode === "lite_profile" ? "shared" : "dedicated";
    const adminEmail = formData.ownerAdminEmail.trim().toLowerCase();
    let ownerAccountMessage: string | null = null;

    try {
      try {
        await createAgency(token, {
          slug: agencySlug,
          name: `${formData.businessName || "Business"} Agency`,
          region: "in",
          owner_user_id: adminEmail || session?.email || "platform-admin@kalptree.xyz",
        });
      } catch (error) {
        if (!isApiError(error) || error.status !== 409) {
          throw error;
        }
      }

      const tenant = await createTenant(token, {
        agency_slug: agencySlug,
        slug: tenantSlug,
        display_name: formData.businessName || "Unnamed Business",
        infra_mode: infraMode,
        vertical_pack: verticalPack,
        business_type: verticalPack,
        admin_email: adminEmail,
        primary_domains: primaryDomains,
        languages: onboardingLanguages,
        primary_language: resolvedPrimaryLanguage,
        dedicated_profile_id:
          infraMode === "dedicated" ? "dedicated-infra-demo" : undefined,
        feature_flags: websiteFeatureFlags,
      });

      try {
        await register({
          email: adminEmail,
          password: formData.ownerAdminPassword,
          tenant_slug: tenant.slug,
        });
      } catch (error) {
        ownerAccountMessage =
          error instanceof Error
            ? error.message
            : "The workspace is ready, but owner login creation needs attention.";
      }

      setDeploymentResult(
        buildDeploymentSummary(tenant, {
          agencySlug,
          businessName: formData.businessName,
          provisioningMode: formData.provisioningMode,
          ownerAdminEmail: adminEmail,
          ownerAdminPassword: formData.ownerAdminPassword,
          primaryDomains,
          ownerAccountMessage,
        })
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Tenant provisioning failed.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSyncDomains = async () => {
    if (!token || !deploymentResult) {
      return;
    }

    setIsSyncingDomains(true);
    try {
      const tenant = await syncTenantWebsite(token, deploymentResult.publicSlug);
      setDeploymentResult(
        buildDeploymentSummary(tenant, {
          agencySlug: deploymentResult.agencySlug,
          businessName: deploymentResult.tenantName,
          provisioningMode: deploymentResult.provisioningMode,
          ownerAdminEmail: deploymentResult.ownerAdminEmail,
          ownerAdminPassword: deploymentResult.ownerAdminPassword,
          primaryDomains: deploymentResult.primaryDomains,
          ownerAccountMessage: deploymentResult.ownerAccountMessage,
        })
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Domain sync failed.");
    } finally {
      setIsSyncingDomains(false);
    }
  };

  const ActiveIcon = STEPS[activeStep].icon;
  const selectedIndustry = industries.find(
    (g: any) => g.industry === formData.industry,
  );
  const currentLogoUrl = logoPreview || formData.brand.logo.url;
  const selectedModules = ALL_MODULES.filter((mod) =>
    formData.enabledModules.includes(mod.key),
  );
  const inactiveModules = ALL_MODULES.length - selectedModules.length;
  const isLiteProfile = formData.provisioningMode === "lite_profile";
  const activeStepMeta = STEPS[activeStep];
  const nextStepMeta = STEPS[activeStep + 1] ?? null;
  const completionPercent = Math.round(
    ((activeStep + 1) / STEPS.length) * 100,
  );
  const normalizedLanguageQuery = languageQuery.trim().toLowerCase();
  const selectedLanguageOptions = Array.from(
    new Set(formData.languages.map(normalizeLanguageCode).filter(Boolean)),
  ).map((code) => buildSelectedLanguageOption(availableLanguages, code));
  const filteredLanguages = availableLanguages.filter((language: any) => {
    if (!normalizedLanguageQuery) {
      return true;
    }
    const haystack = [
      language?.code,
      language?.name,
      language?.nativeName,
      language?.flag,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedLanguageQuery);
  });
  const modulePresetLabel =
    formData.businessType.length > 0
      ? formData.businessType
          .map((bt: any) => (typeof bt === "string" ? bt : bt.name))
          .join(" • ")
      : "Custom selection";
  const businessLabel = formData.businessName || "New Business Workspace";
  const currentStepLabel = `Step ${activeStep + 1} of ${STEPS.length}`;
  const modeLabel = isLiteProfile ? "Lite Profile" : "Full Tenant";
  const languageCount = selectedLanguageOptions.length;

  return (
    <div
      ref={wizardShellRef}
      className="relative flex min-h-screen items-start justify-center overflow-y-auto bg-[#030712] px-4 py-6 md:px-6 md:py-10"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px]"
          style={{ backgroundColor: `${formData.brand.primary}10` }}
        ></div>
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px]"
          style={{ backgroundColor: `${formData.brand.secondary}10` }}
        ></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,#030712_100%)]"></div>
      </div>

      <div className="w-full max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] bg-[#030712]/60 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
          {/* Left Sidebar - Step Tracker */}
          <div className="relative overflow-hidden border-b border-white/5 bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(2,6,23,0.72))] p-6 md:p-10 lg:border-b-0 lg:border-r">
            <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent hidden lg:block"></div>
            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <Activity className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter text-white">
                    Kalp<span className="font-light opacity-30">ZERO</span>
                  </h1>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                    Tenant Onboarding Flow
                  </div>
                </div>
              </div>

              <div className="mb-10 rounded-3xl border border-white/5 bg-black/30 p-5 shadow-[0_20px_60px_-40px_rgba(6,182,212,0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">
                      Current Build
                    </div>
                    <div className="mt-2 text-lg font-bold text-white">
                      {businessLabel}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {modeLabel}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-cyan-500/20 bg-cyan-500/10 text-[10px] uppercase tracking-widest text-cyan-200"
                  >
                    {completionPercent}%
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
                    <span>{currentStepLabel}</span>
                    <span>{selectedModules.length} apps</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-6 lg:space-y-8">
                {STEPS.map((step, idx) => {
                  const isActive = idx === activeStep;
                  const isPast = idx < activeStep;
                  const isClickable =
                    !deploymentResult &&
                    (idx <= activeStep || idx === activeStep + 1);
                  const StepIcon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(idx)}
                      disabled={!isClickable}
                      className={`group flex w-full items-start gap-4 rounded-2xl px-3 py-2.5 text-left transition-all duration-500 ${isClickable
                          ? "cursor-pointer hover:opacity-100"
                          : "cursor-not-allowed"
                        } ${isActive ? "bg-white/[0.04]" : ""}`}
                      style={{ opacity: isActive || isPast ? 1 : 0.36 }}
                    >
                      <div className="relative flex-shrink-0">
                        {idx !== STEPS.length - 1 && (
                          <div
                            className={`absolute top-10 left-1/2 -translate-x-1/2 w-[2px] h-8 lg:h-10 transition-colors duration-500 ${isPast ? "bg-emerald-500/40" : "bg-slate-800"
                              }`}
                          ></div>
                        )}
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-500 ${isPast
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                              : "border-slate-800 text-slate-500 bg-slate-900/50"
                            } ${isClickable ? "group-hover:scale-110" : ""}`}
                          style={
                            isActive
                              ? {
                                borderColor: formData.brand.primary,
                                backgroundColor: `${formData.brand.primary}15`,
                                color: formData.brand.primary,
                                boxShadow: `0 0 30px ${formData.brand.primary}30`,
                                transform: "scale(1.1)",
                              }
                              : {}
                          }
                        >
                          {isPast ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <StepIcon size={18} />
                          )}
                        </div>
                      </div>
                      <div className="pt-2 flex-1 min-w-0">
                        <div
                          className={`text-xs font-bold uppercase tracking-wider mb-1 transition-colors truncate ${isActive ? "text-white" : "text-slate-500"
                            }`}
                        >
                          {step.title}
                        </div>
                        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                          Phase 0{idx + 1}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Area - Main Content */}
          <div className="relative bg-[#030712]/20 p-4 md:p-8 lg:p-10">
            <div className="relative isolate flex min-h-[720px] flex-col overflow-hidden rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,15,30,0.96),rgba(4,9,20,0.88))] shadow-[0_50px_120px_-70px_rgba(6,182,212,0.45)]">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_70%)]"></div>
                <div className="absolute -right-20 top-28 h-56 w-56 rounded-full bg-cyan-500/8 blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[12%] h-64 w-64 rounded-full bg-sky-500/8 blur-3xl"></div>
                <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-cyan-500/15 to-transparent"></div>
              </div>

              <div className="relative z-10 border-b border-white/6 px-6 py-6 md:px-8 lg:px-10">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                  <div className="flex items-start gap-4">
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-slate-900/60 shadow-2xl"
                      style={{ color: formData.brand.primary }}
                    >
                      <div className="absolute -inset-1 rounded-[18px] bg-cyan-500/20 blur opacity-60"></div>
                      <ActiveIcon
                        size={26}
                        className="relative z-10 animate-in zoom-in-50 duration-500"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">
                        {currentStepLabel}
                      </div>
                      <div className="mt-1 text-2xl font-black tracking-tight text-white">
                        {activeStepMeta.title}
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                        {activeStepMeta.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-emerald-200">
                          {isLiteProfile
                            ? "Shared admin access"
                            : "Dedicated tenant workspace"}
                        </div>
                        <div className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-cyan-200">
                          {modeLabel}
                        </div>
                        <div className="rounded-full border border-slate-700 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-300">
                          {businessLabel}
                        </div>
                        <div className="rounded-full border border-slate-700 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-300">
                          {selectedModules.length} active apps
                        </div>
                        {nextStepMeta && !deploymentResult && (
                          <div className="rounded-full border border-slate-700 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-300">
                            Next: {nextStepMeta.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full rounded-3xl border border-white/6 bg-black/20 p-5 shadow-[0_30px_80px_-50px_rgba(6,182,212,0.45)]">
                    <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-500">
                      <span>Progress</span>
                      <span>{completionPercent}% complete</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-900/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      ></div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[
                        {
                          label: "Industry",
                          value: selectedIndustry?.icon
                            ? `${selectedIndustry.icon} ${formData.industry || "Pending"}`
                            : formData.industry || "Pending",
                        },
                        {
                          label: "Languages",
                          value: `${languageCount} active`,
                        },
                        {
                          label: "Modules",
                          value: `${selectedModules.length} enabled`,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-white/5 bg-slate-950/70 px-3 py-3"
                        >
                          <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
                            {item.label}
                          </div>
                          <div className="mt-2 text-sm font-semibold leading-5 text-white">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex-1 px-6 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
                <div className="w-full max-w-5xl">
                {/* Step 0: Business Identity */}
                {activeStep === 0 && (
                  <div className="animate-in slide-in-from-right-4 fade-in duration-500 space-y-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Business Identity
                      </h2>
                      <p className="text-slate-400 text-sm md:text-base">
                        Select your industry to auto-configure apps and
                        attribute sets.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* Account Type */}
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                          Account Type
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            {
                              key: "business",
                              label: "Business",
                              hint: "Full organization workspace",
                            },
                            {
                              key: "personal_portfolio",
                              label: "Personal Portfolio",
                              hint: "Professional profile and portfolio",
                            },
                          ].map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  accountType: option.key as
                                    | "business"
                                    | "personal_portfolio",
                                  provisioningMode:
                                    option.key === "personal_portfolio"
                                      ? "lite_profile"
                                      : prev.provisioningMode,
                                }))
                              }
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.02] ${formData.accountType === option.key
                                  ? "border-cyan-500/40 bg-cyan-900/20"
                                  : "border-slate-800 bg-black/30 hover:border-slate-600"
                                }`}
                            >
                              <div className="text-sm font-semibold text-white">
                                {option.label}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                {option.hint}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Provisioning Mode */}
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                          Provisioning Mode
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            {
                              key: "lite_profile",
                              label: "Lite Profile",
                              hint: "No dedicated database (free public profile)",
                            },
                            {
                              key: "full_tenant",
                              label: "Full Tenant",
                              hint: "Dedicated tenant database + full operations",
                            },
                          ].map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  provisioningMode: option.key as
                                    | "full_tenant"
                                    | "lite_profile",
                                }))
                              }
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.02] ${formData.provisioningMode === option.key
                                  ? "border-cyan-500/40 bg-cyan-900/20"
                                  : "border-slate-800 bg-black/30 hover:border-slate-600"
                                }`}
                            >
                              <div className="text-sm font-semibold text-white">
                                {option.label}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                {option.hint}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Business Name */}
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessName: e.target.value,
                            })
                          }
                          className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all font-medium"
                          style={
                            {
                              "--tw-ring-color": `${formData.brand.primary}80`,
                            } as any
                          }
                          placeholder="e.g. Grand Horizon Hotels"
                        />
                      </div>

                      {/* Industry Sector */}
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                          Industry Sector
                        </label>
                        {isLoadingData ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className="p-4 rounded-xl border border-slate-800 bg-black/30 animate-pulse"
                              >
                                <div className="w-8 h-8 bg-slate-700 rounded mb-2"></div>
                                <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {industries.map((ind: any) => (
                              <button
                                key={ind.industry}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    industry: ind.industry,
                                  }))
                                }
                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.02] ${formData.industry === ind.industry
                                    ? "border-cyan-500/40 bg-cyan-900/20 shadow-[0_0_12px_rgba(0,240,255,0.1)]"
                                    : "border-slate-800 bg-black/30 hover:border-slate-600"
                                  }`}
                              >
                                <div className="text-2xl mb-2">{ind.icon}</div>
                                <div className="text-xs font-semibold text-white leading-tight">
                                  {ind.industry}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Business Type */}
                      {businessTypes.length > 0 && (
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                          <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                            Business Type
                          </label>
                          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                            {businessTypes.map((bt: any) => {
                              const isSelected = formData.businessType.find(
                                (b: any) => b.name === bt.name,
                              );
                              return (
                                <div key={bt.key} className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => toggleBusinessType(bt)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 hover:scale-[1.01] ${isSelected
                                        ? "border-cyan-500/40 bg-cyan-900/15"
                                        : "border-slate-800 bg-black/20 hover:border-slate-600"
                                      }`}
                                  >
                                    <span className="text-xl flex-shrink-0">
                                      {bt.icon}
                                    </span>
                                    <div className="flex-1 min-w-0 pr-8">
                                      <div className="text-sm font-semibold text-white">
                                        {bt.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {bt.description ||
                                          `${bt.enabledModules?.length || 0} apps pre-configured`}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2
                                        size={18}
                                        className="text-cyan-400 flex-shrink-0"
                                      />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => showBtInfo(bt, e)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-cyan-400 transition-colors z-10"
                                    title="Learn more"
                                  >
                                    <Activity size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Default Front Template */}
                      {landingTemplates.length > 0 && (
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                            Default Front Template
                          </label>
                          <select
                            value={formData.defaultLandingTemplateKey}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                defaultLandingTemplateKey: e.target.value,
                              }))
                            }
                            className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2"
                            style={
                              {
                                "--tw-ring-color": `${formData.brand.primary}80`,
                              } as any
                            }
                          >
                            {landingTemplates.map((template: any) => (
                              <option
                                key={template.key || template._id}
                                value={template.key}
                              >
                                {template.name}{" "}
                                {template.businessType
                                  ? `(${template.businessType})`
                                  : ""}
                              </option>
                            ))}
                          </select>
                          <p className="mt-2 text-[10px] text-slate-500">
                            This template is used as the default frontend
                            starter after onboarding.
                          </p>
                        </div>
                      )}

                      {/* Primary Domains */}
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                          Primary Domains
                        </label>
                        <TagInput
                          value={formData.primaryDomains}
                          onChange={(val) =>
                            setFormData({ ...formData, primaryDomains: val })
                          }
                          placeholder="e.g. example.com, .net, shop"
                        />
                        <p className="mt-2 text-[10px] text-slate-500">
                          Add multiple domains. Suffixes like &quot;.com&quot;
                          auto-convert to &quot;default.com&quot;.
                        </p>
                      </div>

                      {/* Business Admin Access */}
                      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 space-y-3">
                        <label className="block text-xs uppercase tracking-widest text-cyan-300 font-semibold">
                          Business Admin Access
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={formData.ownerAdminName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ownerAdminName: e.target.value,
                              })
                            }
                            className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            placeholder="Owner admin name"
                          />
                          <input
                            type="email"
                            value={formData.ownerAdminEmail}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ownerAdminEmail: e.target.value.toLowerCase(),
                              })
                            }
                            className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            placeholder="owner@business.com"
                          />
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={formData.ownerAdminPassword}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  ownerAdminPassword: e.target.value,
                                })
                              }
                              className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-3 pr-10 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                              placeholder="Minimum 8 characters"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 Transition-colors"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          This account becomes the primary Business Admin for
                          this workspace and will use these credentials to sign
                          in after onboarding.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Brand Logo */}
                {activeStep === 1 && (
                  <div className="animate-in slide-in-from-right-4 fade-in duration-500 space-y-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Brand Logo
                      </h2>
                      <p className="text-slate-400 text-sm md:text-base">
                        Upload your business logo to personalize your workspace.
                      </p>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                      <div className="space-y-6">
                        <div className="relative">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />

                          {!currentLogoUrl ? (
                            <label
                              htmlFor="logo-upload"
                              className="flex h-72 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-black/30 transition-all hover:border-cyan-500/40 hover:bg-black/40 group"
                            >
                              <div className="flex flex-col items-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 transition-all group-hover:scale-110 group-hover:bg-cyan-900/20">
                                  <Upload className="h-8 w-8 text-slate-500 group-hover:text-cyan-400" />
                                </div>
                                <p className="mb-1 text-white font-semibold">
                                  Click to upload logo
                                </p>
                                <p className="text-xs text-slate-500">
                                  PNG, JPG, SVG up to 10MB
                                </p>
                              </div>
                            </label>
                          ) : (
                            <div className="relative rounded-2xl border-2 border-slate-700 bg-black/30 p-8">
                              <button
                                onClick={removeLogo}
                                className="absolute top-4 right-4 rounded-full bg-red-500/10 p-2 text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300"
                                title="Remove logo"
                                type="button"
                              >
                                <X size={20} />
                              </button>
                              <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 px-6">
                                <img
                                  src={currentLogoUrl}
                                  alt="Logo preview"
                                  className="max-h-28 max-w-full object-contain"
                                />
                              </div>
                              <div className="mt-5 flex flex-wrap items-center gap-3">
                                <label
                                  htmlFor="logo-upload"
                                  className="cursor-pointer rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-700"
                                >
                                  Change Logo
                                </label>
                                <span className="text-xs text-slate-500">
                                  Stored for tenant admin header and default
                                  website branding.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                          <p className="text-sm text-blue-200/80">
                            <strong className="text-blue-300">Tip:</strong> For
                            best results, use a transparent PNG with your logo
                            on a clear background. Recommended dimensions:
                            400x120px or a similar wide ratio.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                          <div className="text-sm font-semibold text-emerald-300">
                            Full Tenant Logo Sync
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-400">
                            This logo is saved with the tenant branding and is
                            used in the business admin panel and the initial
                            frontend website experience automatically.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-black/30 p-5">
                          <div className="text-[10px] uppercase tracking-widest text-slate-500">
                            Admin Panel Preview
                          </div>
                          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                              {currentLogoUrl ? (
                                <img
                                  src={currentLogoUrl}
                                  alt="Admin logo preview"
                                  className="max-h-8 max-w-8 object-contain"
                                />
                              ) : (
                                <Activity className="h-5 w-5 text-cyan-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white">
                                {formData.businessName || "Your Business"}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Business Admin Workspace
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-black/30 p-5">
                          <div className="text-[10px] uppercase tracking-widest text-slate-500">
                            Frontend Website Preview
                          </div>
                          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
                            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {currentLogoUrl ? (
                                  <img
                                    src={currentLogoUrl}
                                    alt="Website logo preview"
                                    className="h-9 max-w-[120px] object-contain"
                                  />
                                ) : (
                                  <div className="text-sm font-semibold text-white">
                                    {formData.businessName || "Your Brand"}
                                  </div>
                                )}
                              </div>
                              <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-wider text-cyan-300">
                                Live
                              </div>
                            </div>
                            <div className="px-4 py-6">
                              <div className="text-lg font-semibold text-white">
                                {formData.businessName || "Your Brand"} online
                                experience
                              </div>
                              <p className="mt-2 text-sm text-slate-400">
                                Your seeded frontend will start with this brand
                                identity so the business website is not launched
                                with KalpZERO branding.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Languages */}
                {activeStep === 2 && (
                  <div className="animate-in slide-in-from-right-4 fade-in duration-500 space-y-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Languages
                      </h2>
                      <p className="text-slate-400 text-sm md:text-base">
                        Choose which languages your business will support.
                        Search by name or code, then keep one language as the
                        default for the workspace.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-black/30 p-5">
                      <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold">
                        Find or Add Language
                      </label>
                      <div className="mt-3 flex flex-col gap-3 md:flex-row">
                        <input
                          type="text"
                          value={languageQuery}
                          onChange={(e) => setLanguageQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitLanguageQuery();
                            }
                          }}
                          className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2"
                          style={
                            {
                              "--tw-ring-color": `${formData.brand.primary}80`,
                            } as any
                          }
                          placeholder="Type english, hindi, en, hi, fr"
                        />
                        <button
                          type="button"
                          onClick={commitLanguageQuery}
                          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/20"
                        >
                          Add Language
                        </button>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">
                        If the exact language is not in the registry yet, you
                        can still save its code manually and refine it later.
                      </p>
                      {selectedLanguageOptions.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedLanguageOptions.map((language) => {
                            const isPrimary =
                              normalizeLanguageCode(formData.primaryLanguage) ===
                              language.code;
                            const canRemove = !isPrimary && selectedLanguageOptions.length > 1;
                            return (
                              <div
                                key={language.code}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                                  isPrimary
                                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
                                    : "border-slate-700 bg-slate-900/70 text-slate-200"
                                }`}
                              >
                                <span>{language.flag || "🌐"}</span>
                                <span className="font-medium">
                                  {language.name}
                                </span>
                                <span className="text-slate-500">
                                  {language.code}
                                </span>
                                {isPrimary ? (
                                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-cyan-200">
                                    Primary
                                  </span>
                                ) : null}
                                {canRemove ? (
                                  <button
                                    type="button"
                                    onClick={() => removeLanguage(language.code)}
                                    className="rounded-full p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                                    aria-label={`Remove ${language.name}`}
                                  >
                                    <X size={12} />
                                  </button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>

                    {/* Primary Language */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                        Primary Language
                      </label>
                      <select
                        value={formData.primaryLanguage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primaryLanguage: normalizeLanguageCode(
                              e.target.value,
                            ),
                          })
                        }
                        className="bg-black/50 border border-slate-700/80 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 cursor-pointer appearance-none w-full max-w-sm"
                        style={
                          {
                            "--tw-ring-color": `${formData.brand.primary}80`,
                          } as any
                        }
                      >
                        {selectedLanguageOptions.map((l: any) => (
                            <option key={l.code} value={l.code}>
                              {l.flag} {l.name} ({l.nativeName})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Additional Languages */}
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                        Available Languages
                      </label>
                      {isLoadingData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-black/30 animate-pulse"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-700 rounded"></div>
                                <div>
                                  <div className="h-3 bg-slate-700 rounded w-20 mb-1"></div>
                                  <div className="h-2 bg-slate-700 rounded w-16"></div>
                                </div>
                              </div>
                              <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>
                            </div>
                          ))}
                        </div>
                      ) : filteredLanguages.length === 0 ? (
                        <div className="rounded-2xl border border-slate-800 bg-black/30 p-5 text-sm text-slate-400">
                          No language matched <span className="text-white">&quot;{languageQuery}&quot;</span>.
                          Add it above as a custom code if you still want to continue.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {filteredLanguages.map((lang: any) => {
                            const normalizedCode = normalizeLanguageCode(
                              String(lang.code ?? ""),
                            );
                            const active = selectedLanguageOptions.some(
                              (item) => item.code === normalizedCode,
                            );
                            const isPrimary =
                              normalizeLanguageCode(formData.primaryLanguage) ===
                              normalizedCode;
                            return (
                              <button
                                key={normalizedCode}
                                onClick={() =>
                                  !isPrimary && toggleLanguage(normalizedCode)
                                }
                                disabled={isPrimary}
                                className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all ${active
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                    : "bg-black/30 border-slate-800 text-slate-500 hover:border-slate-600"
                                  } ${isPrimary
                                    ? "ring-2 ring-blue-500/50"
                                    : "hover:scale-[1.02] cursor-pointer"
                                  }`}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="text-xl">{lang.flag}</span>
                                  <div className="text-left">
                                    <div className="font-semibold text-xs">
                                      {lang.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {lang.nativeName}
                                    </div>
                                  </div>
                                </span>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active
                                      ? "border-blue-400 bg-blue-400"
                                      : "border-slate-600"
                                    }`}
                                >
                                  {active && (
                                    <Check size={12} className="text-black" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: App Selection */}
                {activeStep === 3 && (
                  <div className="animate-in slide-in-from-right-4 fade-in duration-500 space-y-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        App Selection
                      </h2>
                      <p className="text-slate-400 text-sm md:text-base">
                        {formData.businessType.length > 0 ? (
                          <>
                            Apps auto-selected for{" "}
                            <span className="text-cyan-400 font-semibold">
                              {formData.businessType
                                .map((bt: any) =>
                                  typeof bt === "string" ? bt : bt.name,
                                )
                                .join(" & ")}
                            </span>
                            . Toggle to customize.
                          </>
                        ) : (
                          "Select the apps to activate in this workspace."
                        )}
                      </p>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)]">
                      <div className="space-y-4">
                        <div className="rounded-3xl border border-cyan-500/15 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(5,10,22,0.88))] p-5 shadow-[0_30px_90px_-60px_rgba(6,182,212,0.6)]">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">
                            Workspace Summary
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Active Apps
                              </div>
                              <div className="mt-2 text-3xl font-black text-white">
                                {selectedModules.length}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Available
                              </div>
                              <div className="mt-2 text-3xl font-black text-white">
                                {inactiveModules}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-slate-500">
                              Preset Source
                            </div>
                            <div className="mt-2 text-sm font-semibold text-white">
                              {modulePresetLabel}
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                              Modules are pre-selected from the business type template, but full-tenant onboarding lets you refine them before deployment.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                              Selected Modules
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {selectedModules.length} active
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedModules.map((mod) => {
                              const ModIcon = mod.icon;
                              return (
                                <button
                                  key={mod.key}
                                  type="button"
                                  onClick={() => toggleModule(mod.key)}
                                  disabled={isLiteProfile}
                                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest transition-all ${
                                    isLiteProfile
                                      ? "cursor-not-allowed border-emerald-500/15 bg-emerald-500/10 text-emerald-300"
                                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:border-cyan-400/40 hover:text-cyan-200"
                                  }`}
                                >
                                  <ModIcon size={12} />
                                  <span>{mod.label}</span>
                                  {!isLiteProfile && <X size={12} />}
                                </button>
                              );
                            })}
                            {selectedModules.length === 0 && (
                              <div className="rounded-xl border border-slate-800 bg-black/20 px-3 py-2 text-[11px] text-slate-500">
                                No modules selected yet.
                              </div>
                            )}
                          </div>
                          {!isLiteProfile && (
                            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                              Click a selected chip to remove it from the workspace before deployment.
                            </p>
                          )}
                        </div>

                        {isLiteProfile && (
                          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-xs leading-relaxed text-amber-200">
                            Lite profile mode keeps only the core website, branding, and KalpAI apps active until claim or upgrade.
                          </div>
                        )}
                      </div>

                      <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                              Module Library
                            </div>
                            <div className="mt-2 text-sm text-slate-400">
                              Toggle the apps that should ship with this tenant workspace.
                            </div>
                          </div>
                          <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-cyan-200">
                            Full Tenant Customization
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar md:grid-cols-2 lg:grid-cols-3 max-h-[min(52vh,560px)]">
                          {ALL_MODULES.map((mod) => {
                            const active = formData.enabledModules.includes(
                              mod.key,
                            );
                            const ModIcon = mod.icon;
                            return (
                              <button
                                key={mod.key}
                                type="button"
                                onClick={() => toggleModule(mod.key)}
                                disabled={isLiteProfile}
                                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                                  active
                                    ? "border-cyan-500/30 bg-cyan-900/10 shadow-[0_20px_50px_-35px_rgba(6,182,212,0.45)]"
                                    : "border-slate-800 bg-black/30 hover:border-slate-600 hover:bg-slate-950/70"
                                } ${
                                  isLiteProfile
                                    ? "cursor-not-allowed opacity-80"
                                    : "cursor-pointer hover:-translate-y-0.5"
                                }`}
                              >
                                {active && (
                                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400"></div>
                                )}
                                <div className="mb-4 flex items-start justify-between gap-3">
                                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                                    active
                                      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
                                      : "border-slate-800 bg-slate-900/60 text-slate-500"
                                  }`}>
                                    <ModIcon size={18} />
                                  </div>
                                  <div
                                    className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${
                                      active
                                        ? "bg-emerald-500/15 text-emerald-300"
                                        : "bg-slate-800 text-slate-500"
                                    }`}
                                  >
                                    {active ? "Enabled" : "Available"}
                                  </div>
                                </div>
                                <div className="text-sm font-bold text-white">
                                  {mod.label}
                                </div>
                                <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                  {mod.desc}
                                </div>
                                <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-600 transition-colors group-hover:text-slate-400">
                                  {isLiteProfile
                                    ? "Locked in lite profile"
                                    : active
                                      ? "Click to remove"
                                      : "Click to enable"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: AI Assistant */}
                {activeStep === 4 && (
                  <div className="animate-in slide-in-from-right-4 fade-in duration-500 space-y-6 pt-1">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        AI Assistant
                      </h2>
                      <p className="text-slate-400 text-sm md:text-base">
                        Ask questions about your setup, get app suggestions, or
                        skip this step and deploy directly.
                      </p>
                    </div>

                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)]">
                      <div className="space-y-4">
                        <div className="rounded-3xl border border-cyan-500/20 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(5,10,22,0.88))] p-5 shadow-[0_30px_90px_-60px_rgba(6,182,212,0.6)]">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">
                            What this section is for
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-400">
                            This is an optional setup copilot. It helps the
                            business owner understand why modules were selected,
                            what else might be needed, and what each app
                            actually does before the workspace is deployed.
                          </p>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Active Apps
                              </div>
                              <div className="mt-2 text-2xl font-black text-white">
                                {selectedModules.length}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Languages
                              </div>
                              <div className="mt-2 text-2xl font-black text-white">
                                {formData.languages.length}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                            Ask it to
                          </div>
                          <div className="mt-3 space-y-2 text-sm text-slate-300">
                            <div>Explain why a module was selected</div>
                            <div>Suggest missing modules or languages</div>
                            <div>Recommend category or attribute setup</div>
                            <div>Review if this tenant should stay lite or full</div>
                          </div>
                          <p className="mt-4 text-[11px] text-slate-500">
                            Skipping this step does not block provisioning.
                          </p>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                            Quick Prompts
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {AI_QUICK_PROMPTS.map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() => {
                                  void submitAiPrompt(prompt);
                                }}
                                disabled={aiLoading}
                                className="rounded-xl border border-slate-700 bg-black/30 px-3 py-2 text-left text-[11px] leading-relaxed text-slate-300 transition-all hover:border-cyan-500/30 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/50 p-4 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.9)]">
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-black/30 px-4 py-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">
                              Kalp Setup Copilot
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              Tenant planning assistant
                            </div>
                          </div>
                          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-emerald-300">
                            {aiLoading ? "Thinking" : "Ready"}
                          </div>
                        </div>

                        <div className="mt-4 flex h-[min(62vh,620px)] min-h-[420px] flex-col">
                          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-[#02050d] p-4 space-y-3 custom-scrollbar">
                            {aiMessages.map((msg, i) => (
                              <div
                                key={i}
                                className={`flex ${
                                  msg.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[88%] rounded-2xl border px-4 py-3 text-sm leading-relaxed break-words ${
                                    msg.role === "user"
                                      ? "border-cyan-500/30 bg-cyan-500/20 text-cyan-100"
                                      : "border-slate-700 bg-slate-800/80 text-slate-200"
                                  }`}
                                >
                                  <div
                                    className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] ${
                                      msg.role === "user"
                                        ? "text-cyan-200/80"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {msg.role === "user" ? "You" : "Kalp Copilot"}
                                  </div>
                                  <div
                                    className={`space-y-2 ${
                                      msg.role === "assistant"
                                        ? "max-h-[320px] overflow-y-auto pr-1 custom-scrollbar"
                                        : ""
                                    }`}
                                  >
                                    {(msg.role === "assistant"
                                      ? normalizeAiResponseContent(msg.content)
                                      : msg.content
                                    )
                                      .split("\n")
                                      .map((line, lineIndex) =>
                                        line.trim() ? (
                                          <p
                                            key={`${i}-${lineIndex}`}
                                            className="text-sm leading-7"
                                          >
                                            {line}
                                          </p>
                                        ) : (
                                          <div
                                            key={`${i}-${lineIndex}`}
                                            className="h-2"
                                          ></div>
                                        ),
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {aiLoading && (
                              <div className="flex justify-start">
                                <div className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3">
                                  <div className="flex gap-1">
                                    <div className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"></div>
                                    <div
                                      className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
                                      style={{ animationDelay: "0.1s" }}
                                    ></div>
                                    <div
                                      className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
                                      style={{ animationDelay: "0.2s" }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>

                          <div className="mt-4 flex shrink-0 gap-2">
                            <input
                              type="text"
                              value={aiInput}
                              onChange={(e) => setAiInput(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleAiSend()
                              }
                              className="flex-1 rounded-xl border border-slate-700 bg-black/50 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                              placeholder="Ask about your setup..."
                            />
                            <button
                              onClick={handleAiSend}
                              disabled={aiLoading || !aiInput.trim()}
                              className="flex flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                              type="button"
                            >
                              <Send size={18} />
                            </button>
                          </div>
                          <p className="mt-3 text-[11px] text-slate-500">
                            Ask for app rationale, missing recommendations, or setup review before you continue.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Deploy */}
                {activeStep === 5 && (
                  <div className="animate-in slide-in-from-right-4 fade-in duration-700">
                    {deploymentResult ? (
                      <div className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/10">
                            <div className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-2xl"></div>
                            <CheckCircle2 className="relative z-10 h-10 w-10 text-emerald-300" />
                          </div>
                          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                            Workspace Ready
                          </h2>
                          <p className="mt-3 max-w-2xl text-sm md:text-base font-medium text-slate-400">
                            Kalp created the business workspace for{" "}
                            <span className="font-black text-white">
                              {deploymentResult.tenantName}
                            </span>
                            , synced the website repo, and prepared the live
                            website URL shown below.
                          </p>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                          <div className="space-y-4">
                            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-[10px] uppercase tracking-widest text-emerald-300/80">
                                    Business Admin Access
                                  </div>
                                  <div className="mt-3 text-2xl font-black text-white">
                                    {deploymentResult.tenantName}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">
                                    Tenant key:{" "}
                                    <span className="font-mono text-slate-200">
                                      {deploymentResult.tenantKey}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                                  {currentLogoUrl ? (
                                    <img
                                      src={currentLogoUrl}
                                      alt={`${deploymentResult.tenantName} logo`}
                                      className="max-h-10 max-w-10 object-contain"
                                    />
                                  ) : (
                                    <Activity
                                      size={22}
                                      style={{ color: formData.brand.primary }}
                                    />
                                  )}
                                </div>
                              </div>

                              <div className="mt-5 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                    Login Email
                                  </div>
                                  <div className="mt-2 break-all font-mono text-sm text-white">
                                    {deploymentResult.ownerAdminEmail}
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                                  <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                    Login Password
                                  </div>
                                  <div className="mt-2 break-all font-mono text-sm text-white">
                                    {deploymentResult.ownerAdminPassword}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4 text-xs leading-relaxed text-slate-300">
                                The uploaded business logo is now the default
                                identity for the admin workspace and the first
                                business website build.
                              </div>
                              {deploymentResult.ownerAccountMessage ? (
                                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-100">
                                  {deploymentResult.ownerAccountMessage}
                                </div>
                              ) : null}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                  Website Delivery
                                </div>
                                <div className="mt-4 space-y-4 text-sm">
                                  <div>
                                    <div className="text-slate-500">Website Status</div>
                                    <div className="mt-1 text-white">
                                      {deploymentResult.websiteStatus}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500">Live Website</div>
                                    {deploymentResult.websiteUrl ? (
                                      <a
                                        href={deploymentResult.websiteUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 block break-all font-mono text-cyan-300 underline-offset-4 hover:underline"
                                      >
                                        {deploymentResult.websiteUrl}
                                      </a>
                                    ) : (
                                      <div className="mt-1 text-slate-500">Pending</div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-slate-500">Platform Host</div>
                                    {deploymentResult.platformUrl ? (
                                      <a
                                        href={deploymentResult.platformUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 block break-all font-mono text-cyan-300 underline-offset-4 hover:underline"
                                      >
                                        {deploymentResult.platformUrl}
                                      </a>
                                    ) : deploymentResult.platformHost ? (
                                      <div className="mt-1 break-all font-mono text-white">
                                        {deploymentResult.platformHost}
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-slate-500">Pending</div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-slate-500">GitHub Repo</div>
                                    {deploymentResult.repoUrl ? (
                                      <a
                                        href={deploymentResult.repoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 block break-all font-mono text-cyan-300 underline-offset-4 hover:underline"
                                      >
                                        {deploymentResult.repoUrl}
                                      </a>
                                    ) : (
                                      <div className="mt-1 text-slate-500">Pending</div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-slate-500">Login Page</div>
                                    <div className="mt-1 font-mono text-white">
                                      {deploymentResult.loginUrl}
                                    </div>
                                  </div>
                                  {deploymentResult.websiteMessage ? (
                                    <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/10 px-3 py-3 text-xs leading-relaxed text-cyan-100">
                                      {deploymentResult.websiteMessage}
                                    </div>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={handleSyncDomains}
                                    disabled={isSyncingDomains}
                                    className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                                      isSyncingDomains
                                        ? "cursor-wait border-slate-700 bg-slate-900 text-slate-400"
                                        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:border-cyan-400 hover:bg-cyan-500/20"
                                    }`}
                                  >
                                    {isSyncingDomains ? "Syncing Domains..." : "Sync Domains & SSL"}
                                  </button>
                                </div>
                              </div>

                              <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                  Database
                                </div>
                                <div className="mt-4 space-y-4 text-sm">
                                  <div>
                                    <div className="text-slate-500">
                                      Workspace Mode
                                    </div>
                                    <div className="mt-1 text-white">
                                      {deploymentResult.provisioningMode ===
                                      "full_tenant"
                                        ? "Full Tenant"
                                        : "Lite Profile"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500">
                                      Database Mode
                                    </div>
                                    <div className="mt-1 text-white">
                                      {deploymentResult.databaseMode}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500">
                                      Database Name
                                    </div>
                                    <div className="mt-1 break-all font-mono text-white">
                                      {deploymentResult.databaseName}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-500">Agency Slug</div>
                                    <div className="mt-1 font-mono text-white">
                                      {deploymentResult.agencySlug}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
                              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Connected Domains
                              </div>
                              <div className="mt-4 space-y-3">
                                {deploymentResult.domains.length > 0 ? (
                                  deploymentResult.domains.map((domain) => (
                                    <div
                                      key={domain.id}
                                      className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-xs"
                                    >
                                      <div className="font-mono text-cyan-100">
                                        {domain.host}
                                      </div>
                                      <div className="mt-1 text-slate-300">
                                        {domain.domain_kind} • SSL {domain.ssl_status}
                                        {domain.is_primary ? " • primary" : ""}
                                      </div>
                                      {typeof domain.metadata?.message === "string" ? (
                                        <div className="mt-2 leading-relaxed text-slate-400">
                                          {domain.metadata.message}
                                        </div>
                                      ) : null}
                                    </div>
                                  ))
                                ) : (
                                  <div className="rounded-full border border-slate-800 bg-black/20 px-3 py-2 text-xs text-slate-500">
                                    No connected domains stored yet
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
                              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Workspace Summary
                              </div>
                              <div className="mt-4 space-y-4 text-sm">
                                <div>
                                  <div className="text-slate-500">Tenant Slug</div>
                                  <div className="mt-1 font-mono text-white">
                                    {deploymentResult.publicSlug}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-slate-500">Website Provider</div>
                                  <div className="mt-1 text-white">
                                    {deploymentResult.websiteProvider ?? "not configured"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-slate-500">Selected Modules</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {selectedModules.map((module) => (
                                      <div
                                        key={module.key}
                                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-200"
                                      >
                                        {module.label}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-3xl border border-cyan-500/15 bg-cyan-500/5 p-6">
                              <div className="text-sm font-semibold text-cyan-200">
                                What the AI Assistant step was for
                              </div>
                              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                                It is an optional onboarding copilot. It helps
                                explain the selected modules, suggest missing
                                apps or languages, and review setup choices
                                before deployment. It does not provision
                                anything by itself.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="w-24 h-24 rounded-3xl border-2 flex items-center justify-center mb-8 relative group"
                          style={{
                            backgroundColor: `${formData.brand.primary}10`,
                            borderColor: `${formData.brand.primary}30`,
                          }}
                        >
                          <div className="absolute -inset-4 bg-cyan-500/10 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                          <Database
                            className="w-10 h-10 relative z-10"
                            style={{ color: formData.brand.primary }}
                          />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter">
                          Ready for Provisioning
                        </h2>
                        <p className="text-slate-500 mb-10 text-sm md:text-base max-w-md mx-auto font-medium">
                          Kalp-Zero will now orchestrate a dedicated, isolated
                          workspace for{" "}
                          <span className="text-white font-black">
                            {formData.businessName || "Your Business"}
                          </span>
                          .
                        </p>

                        {/* Summary Cards */}
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl">
                          <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Industry
                              </span>
                              <span className="text-xs font-bold text-white">
                                {selectedIndustry?.icon}{" "}
                                {formData.industry || "Not selected"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Account
                              </span>
                              <span className="text-xs font-bold text-cyan-400">
                                {formData.accountType === "personal_portfolio"
                                  ? "Portfolio"
                                  : "Business"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Mode
                              </span>
                              <Badge
                                variant="outline"
                                className="h-5 text-[8px] font-bold"
                              >
                                {formData.provisioningMode === "lite_profile"
                                  ? "Lite"
                                  : "Full Tenant"}
                              </Badge>
                            </div>
                          </div>

                          <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Identity
                              </span>
                              <div className="flex gap-1.5">
                                <div
                                  className="w-3 h-3 rounded-full border border-white/10"
                                  style={{
                                    backgroundColor: formData.brand.primary,
                                  }}
                                ></div>
                                <div
                                  className="w-3 h-3 rounded-full border border-white/10"
                                  style={{
                                    backgroundColor: formData.brand.secondary,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Ecosystem
                              </span>
                              <span className="text-xs font-bold text-emerald-400">
                                {formData.enabledModules.length} Modules
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Admin
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                                {formData.ownerAdminEmail || "Not set"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>

              {/* Footer Navigation */}
              <div className="relative z-10 border-t border-white/6 bg-[linear-gradient(180deg,rgba(2,6,23,0.05),rgba(2,6,23,0.34))] px-6 py-5 md:px-8 lg:px-10">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                      Workflow
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {deploymentResult
                        ? "Workspace is live and business admin access is ready."
                        : nextStepMeta
                          ? `Next up: ${nextStepMeta.title}`
                          : "Final provisioning checkpoint"}
                    </div>
                    <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-500">
                      {deploymentResult
                        ? "Use the generated access details to log into the tenant workspace and continue configuration."
                        : activeStepMeta.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <button
                      onClick={handleBack}
                      disabled={
                        activeStep === 0 || isDeploying || !!deploymentResult
                      }
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeStep === 0 || isDeploying
                          ? "cursor-not-allowed text-slate-700"
                          : deploymentResult
                            ? "cursor-not-allowed text-slate-700"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                        }`}
                    >
                      <ArrowLeft size={16} />
                      <span className="hidden sm:inline">Back</span>
                    </button>

                    <div className="flex gap-3">
                  {activeStep === STEPS.length - 1 && deploymentResult ? (
                    <>
                      {deploymentResult.websiteUrl ? (
                        <a
                          href={deploymentResult.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 text-xs font-black uppercase tracking-wider text-cyan-100 transition-all hover:border-cyan-300 hover:text-white"
                        >
                          <Globe size={16} />
                          <span>Open Website</span>
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => router.push("/tenants")}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-200 transition-all hover:border-cyan-400/30 hover:text-white"
                      >
                        <Building2 size={16} />
                        <span>View Tenants</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(deploymentResult.loginUrl)}
                        className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition-all hover:bg-cyan-400"
                      >
                        <span>Go to Login</span>
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : activeStep < STEPS.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={isDeploying}
                      className={`group relative overflow-hidden rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wider shadow-lg transition-all md:px-8 md:py-4 ${activeStep === 4
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                          : "bg-white text-black hover:bg-cyan-400"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"></div>
                      <span className="relative z-10 flex items-center gap-2">
                        <span>{activeStep === 4 ? "Skip" : "Continue"}</span>
                        <ArrowRight size={16} />
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="flex items-center gap-3 rounded-xl bg-emerald-500 px-8 py-3 text-[10px] font-black uppercase tracking-wider text-black shadow-2xl shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:px-10 md:py-5"
                    >
                      {isDeploying ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"></div>
                          <span>Provisioning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Deploy Workspace</span>
                        </>
                      )}
                    </button>
                  )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Dialog */}
      {selectedInfoBt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedInfoBt.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedInfoBt.name}
                    </h3>
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">
                      Business Blueprint
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInfoBt(null)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {selectedInfoBt.description ||
                      "Pre-configured workspace optimized for this specific business model."}
                  </p>
                </div>

                {selectedInfoBt.attributeSetPreset && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Included Attribute Sets
                    </h4>
                    <div className="space-y-4">
                      {(Array.isArray(selectedInfoBt.attributeSetPreset)
                        ? selectedInfoBt.attributeSetPreset
                        : [selectedInfoBt.attributeSetPreset]
                      ).map((set: any, idx: number) => (
                        <div key={set.key || idx}>
                          <div className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-widest">
                            {set.name || "Default Set"}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {set.attributes?.map((attr: any) => (
                              <span
                                key={attr.key}
                                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300"
                              >
                                {attr.label || attr.key}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    App Ecosystem
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedInfoBt.enabledModules || []).map((m: string) => (
                      <div
                        key={m}
                        className="flex items-center gap-2 px-3 py-2 bg-black/20 border border-slate-800/50 rounded-lg"
                      >
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-xs text-slate-400">
                          {getAppLabel(m)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedInfoBt(null)}
                className="w-full mt-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
