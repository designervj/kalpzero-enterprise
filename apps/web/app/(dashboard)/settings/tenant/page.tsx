"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Check,
  RefreshCw,
  Palette,
  Boxes,
  Flag,
  Building2,
  Globe,
  Sparkles,
  Languages,
  ImageUp,
  Upload,
  Trash2,
  Info,
  Lock,
  Crown,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import {
  enforceModuleSelectionRules,
  toggleModuleWithRules,
} from "@/lib/module-rules";
import { SmartColorPicker } from "@/components/ui/smart-color-picker";
import { useAuth } from "@/components/AuthProvider";
import { getAppLabel } from "@/lib/app-labels";
import { HelpTip } from "@/components/HelpTip";
import { AgencyPlanTier, BrandAssetKey, BrandAssetSpec, CapabilityDefinition, Tenant, TenantSettingsFormState } from "./tenantType";
import { normalizeBrandKit, normalizeBusinessContextKey, normalizeContextArray, readFileAsDataUrl, validateBrandAssetFile } from "./util/allTenantUtil";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import { updateTenant } from "@/hook/slices/kalp_master/master_tenant/TenantThunk";
import GetAllLanguage from "@/components/system/language/GetAllLanguage";
import GetAllTheme from "@/components/system/theme/GetAllTheme";
import GetAllFeatures from "@/components/system/feature/GetAllFeatures";
import GetAllOptions from "@/components/system/options/GetAllOptions";
import GetAllPlugin from "@/components/system/plugins/GetAllPlugin";

const ALL_MODULES = [
  "website",
  "branding",
  "products",
  "ecommerce",
  "bookings",
  "marketing",
  "blog",
  "portfolio",
  "media",
  "invoicing",
  "source",
  "kalpbodh",
  "hotel_management",
  "tour_management",
];

const BRAND_ASSET_SPECS: BrandAssetSpec[] = [
  {
    key: "light",
    label: "Logo (For Light Background)",
    guidance: "Recommended 1200x400, transparent PNG/SVG preferred, max 2 MB.",
    accept: ".png,.jpg,.jpeg,.webp,.svg",
    acceptLabel: "PNG, JPG, WEBP, SVG",
    maxBytes: 2 * 1024 * 1024,
  },
  {
    key: "dark",
    label: "Logo (For Dark Background)",
    guidance: "Recommended 1200x400, transparent PNG/SVG preferred, max 2 MB.",
    accept: ".png,.jpg,.jpeg,.webp,.svg",
    acceptLabel: "PNG, JPG, WEBP, SVG",
    maxBytes: 2 * 1024 * 1024,
  },
  {
    key: "thumbnail",
    label: "Thumbnail / App Icon",
    guidance: "Recommended 512x512 square, max 1 MB.",
    accept: ".png,.jpg,.jpeg,.webp,.svg",
    acceptLabel: "PNG, JPG, WEBP, SVG",
    maxBytes: 1024 * 1024,
  },
  {
    key: "favicon",
    label: "Favicon",
    guidance:
      "Recommended 64x64 or 128x128. Prefer .ico, .png, or .svg, max 512 KB.",
    accept: ".ico,.png,.svg,.webp",
    acceptLabel: "ICO, PNG, SVG, WEBP",
    maxBytes: 512 * 1024,
  },
];



export default function TenantSettings() {
  const authCtx = useAuth();
  const { t } = useTranslation();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [assetFeedback, setAssetFeedback] = useState<Record<string, string>>(
    {},
  );
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);
  const [themePresets, setThemePresets] = useState<any[]>([]);
  const [availableAgencyPlans, setAvailableAgencyPlans] = useState<
    AgencyPlanTier[]
  >([]);
  const [capabilityDefinitions, setCapabilityDefinitions] = useState<{
    features: CapabilityDefinition[];
    options: CapabilityDefinition[];
    plugins: CapabilityDefinition[];
  }>({
    features: [],
    options: [],
    plugins: [],
  });
  const [form, setForm] = useState<TenantSettingsFormState>({
    name: "",
    industry: "",
    googleAnalyticsId: "",
    businessType: "",
    accountType: "business",
    provisioningMode: "full_tenant",
    subscriptionLevel: "starter",
    agencyPlanKey: "",
    primary: "#00f0ff",
    secondary: "#8b5cf6",
    accent: "#10b981",
    background: "#030712",
    enabledModules: [] as string[],
    enabledFeatures: [] as string[],
    enabledOptions: [] as string[],
    enabledPlugins: [] as string[],
    featureFlags: {} as Record<string, boolean>,
    languages: [] as string[],
    primaryLanguage: "en",
    aiRuntime: {
      defaultModel: "gpt-4o-mini",
      fallbackModels: [],
      temperature: 0.4,
      managedConnectorEnabled: true,
      byokConnectorEnabled: false,
    },
    claimStatus: "free_unclaimed",
    publicProfile: {
      slug: "",
      visibility: "public",
      headline: "",
      summary: "",
      seoTitle: "",
      seoDescription: "",
      canonicalDomain: "",
      subdomain: "",
    },
    commercePublishPolicy: {
      cartEnabled: true,
      checkoutEnabled: true,
      includeTransactionalInSitemap: false,
      transactionalNoindex: true,
    },
    brandKit: {
      logo: {
        primary: "",
        light: "",
        dark: "",
        icon: "",
        thumbnail: "",
        favicon: "",
      },
    },
  });
  const sessionRole = authCtx.user?.role || authCtx.sessionRole;
  const isTenantAdminSession = sessionRole === "tenant_admin";
  const canManageCapabilityChanges =
    !isTenantAdminSession &&
    tenant?.permissions?.canManageCapabilities !== false;
  const canManageTenantInfraAndPlan =
    !isTenantAdminSession &&
    tenant?.permissions?.canManageTenantInfraAndPlan === true;
  const agencySupportLabel =
    typeof tenant?.agencyName === "string" && tenant.agencyName.trim()
      ? tenant.agencyName
      : "Agency Admin";

  const { allThemes } = useSelector((state: RootState) => state.theme)
  const { allFeatures } = useSelector((state: RootState) => state.feature)
  const { allOptions } = useSelector((state: RootState) => state.option)
  const { allPlugin } = useSelector((state: RootState) => state.plugin)
  const { allLanguage } = useSelector((state: RootState) => state.language)
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (allThemes.length > 0) {
      setThemePresets(allThemes)
    }

    if (allLanguage.length > 0) {
      setAvailableLanguages(allLanguage)
    }
    if (allFeatures.length > 0 && allOptions.length > 0 && allPlugin.length > 0) {
      setCapabilityDefinitions({
        features: allFeatures,
        options: allOptions,
        plugins: allPlugin,
      })
    }
  }, [allThemes, allFeatures, allOptions, allPlugin, allLanguage])
  useEffect(() => {
    // Load tenant settings, available languages from kalp_system, and theme presets
    Promise.all([
      fetch("/api/settings/tenant").then((r) => r.json()),
      // fetch("/api/system/languages").then((r) => r.json()),
      // fetch("/api/system/themes").then((r) => r.json()),
      // fetch("/api/system/features").then((r) => r.json()),
      // fetch("/api/system/options").then((r) => r.json()),
      // fetch("/api/system/plugins").then((r) => r.json()),
    ])
      .then(([data]) => {
        const normalizedBrandKit = normalizeBrandKit(data.brandKit);
        setTenant(data);
        setAvailableAgencyPlans(
          Array.isArray(data.availableAgencyPlans)
            ? data.availableAgencyPlans
            : [],
        );
        // setAvailableLanguages(Array.isArray(langs) ? langs : []);
        // setThemePresets(Array.isArray(themes) ? themes : []);
        // setCapabilityDefinitions({
        //   features: Array.isArray(features) ? features : [],
        //   options: Array.isArray(options) ? options : [],
        //   plugins: Array.isArray(plugins) ? plugins : [],
        // });
        setForm({
          name: data.name || "",
          industry: data.industry || "",
          businessType: data.businessType || "",
          googleAnalyticsId: data.googleAnalyticsId || "",
          accountType:
            data.accountType === "personal_portfolio"
              ? "personal_portfolio"
              : "business",
          provisioningMode:
            data.provisioningMode === "lite_profile"
              ? "lite_profile"
              : "full_tenant",
          subscriptionLevel: data.subscriptionLevel || "starter",
          agencyPlanKey: data.agencyPlanKey || "",
          primary: data.brand?.primary || "#00f0ff",
          secondary: data.brand?.secondary || "#8b5cf6",
          accent: data.brand?.accent || "#10b981",
          background: data.brand?.background || "#030712",
          enabledModules: data.enabledModules || [],
          enabledFeatures: data.enabledFeatures || [],
          enabledOptions: data.enabledOptions || [],
          enabledPlugins: data.enabledPlugins || [],
          featureFlags: data.featureFlags || {},
          languages: data.languages || ["en"],
          primaryLanguage: data.primaryLanguage || "en",
          aiRuntime: {
            defaultModel: data.aiRuntime?.defaultModel || "gpt-4o-mini",
            fallbackModels: Array.isArray(data.aiRuntime?.fallbackModels)
              ? data.aiRuntime.fallbackModels
              : [],
            temperature:
              typeof data.aiRuntime?.temperature === "number"
                ? data.aiRuntime.temperature
                : 0.4,
            managedConnectorEnabled:
              data.aiRuntime?.managedConnectorEnabled !== false,
            byokConnectorEnabled: data.aiRuntime?.byokConnectorEnabled === true,
          },
          claimStatus: data.claimStatus || "free_unclaimed",
          publicProfile: {
            slug: data.publicProfile?.slug || "",
            visibility: data.publicProfile?.visibility || "public",
            headline: data.publicProfile?.headline || data.name || "",
            summary: data.publicProfile?.summary || "",
            seoTitle: data.publicProfile?.seoTitle || "",
            seoDescription: data.publicProfile?.seoDescription || "",
            canonicalDomain: data.publicProfile?.canonicalDomain || "",
            subdomain: data.publicProfile?.subdomain || "",
          },
          commercePublishPolicy: {
            cartEnabled:
              data.frontendProfile?.commercePublishPolicy?.cartEnabled !==
              false,
            checkoutEnabled:
              data.frontendProfile?.commercePublishPolicy?.checkoutEnabled !==
              false,
            includeTransactionalInSitemap:
              data.frontendProfile?.commercePublishPolicy
                ?.includeTransactionalInSitemap === true,
            transactionalNoindex:
              data.frontendProfile?.commercePublishPolicy
                ?.transactionalNoindex !== false,
          },
          brandKit: normalizedBrandKit,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleModule = (mod: string) => {
    if (!canManageCapabilityChanges) return;
    setForm((f) => {
      const nextModules = toggleModuleWithRules(f.enabledModules, mod);
      return {
        ...f,
        enabledModules: enforceModuleSelectionRules(nextModules).modules,
      };
    });
  };
  const toggleEnabledFeature = (key: string) => {
    if (!canManageCapabilityChanges) return;
    setForm((f) => ({
      ...f,
      enabledFeatures: f.enabledFeatures.includes(key)
        ? f.enabledFeatures.filter((item) => item !== key)
        : [...f.enabledFeatures, key],
    }));
  };
  const toggleEnabledOption = (key: string) => {
    if (!canManageCapabilityChanges) return;
    setForm((f) => ({
      ...f,
      enabledOptions: f.enabledOptions.includes(key)
        ? f.enabledOptions.filter((item) => item !== key)
        : [...f.enabledOptions, key],
    }));
  };
  const toggleEnabledPlugin = (key: string) => {
    if (!canManageCapabilityChanges) return;
    setForm((f) => ({
      ...f,
      enabledPlugins: f.enabledPlugins.includes(key)
        ? f.enabledPlugins.filter((item) => item !== key)
        : [...f.enabledPlugins, key],
    }));
  };
  const toggleFlag = (flag: string) => {
    if (!canManageCapabilityChanges) return;
    setForm((f) => ({
      ...f,
      featureFlags: { ...f.featureFlags, [flag]: !f.featureFlags[flag] },
    }));
  };
  const toggleLanguage = (code: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(code)
        ? f.languages.filter((l) => l !== code)
        : [...f.languages, code],
    }));
  };

  const applyPreset = (preset: any) => {
    setForm((f) => ({
      ...f,
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent || f.accent,
      background: preset.background,
    }));
  };

  const setBrandAssetValue = (key: BrandAssetKey, value: string) => {
    setForm((prev) => {
      const normalizedBrandKit = normalizeBrandKit(prev.brandKit);
      const nextLogo = {
        ...normalizedBrandKit.logo,
        [key]: value,
      };
      // Keep legacy icon key aligned with thumbnail usage.
      if (key === "thumbnail") nextLogo.icon = value;
      return {
        ...prev,
        brandKit: {
          ...normalizedBrandKit,
          logo: nextLogo,
        },
      };
    });
  };

  const clearBrandAsset = (key: BrandAssetKey) => {
    setBrandAssetValue(key, "");
    setAssetFeedback((prev) => ({ ...prev, [key]: "" }));
  };

  const handleAssetFileSelect = async (
    key: BrandAssetKey,
    files: FileList | null,
  ) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const spec = BRAND_ASSET_SPECS.find((item) => item.key === key);
    if (!spec) return;

    const error = validateBrandAssetFile(file, spec);
    if (error) {
      setAssetFeedback((prev) => ({ ...prev, [key]: error }));
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setBrandAssetValue(key, dataUrl);
      setAssetFeedback((prev) => ({
        ...prev,
        [key]: `Uploaded: ${file.name}`,
      }));
    } catch (readError) {
      const message =
        readError instanceof Error
          ? readError.message
          : "Unable to process file.";
      setAssetFeedback((prev) => ({ ...prev, [key]: message }));
    }
  };

  const handleSave = async () => {
    const normalizedBrandKit = normalizeBrandKit(form.brandKit);
    if (!normalizedBrandKit.logo.icon && normalizedBrandKit.logo.thumbnail) {
      normalizedBrandKit.logo.icon = normalizedBrandKit.logo.thumbnail;
    }

    const payload: Tenant = {
      name: form.name,
      industry: form.industry,
      googleAnalyticsId: form.googleAnalyticsId,
      businessType: form.businessType,
      brand: {
        primary: form.primary,
        secondary: form.secondary,
        accent: form.accent,
        background: form.background,
      },
      languages: form.languages,
      primaryLanguage: form.primaryLanguage,
      publicProfile: form.publicProfile,
      brandKit: normalizedBrandKit,
    };

    if (canManageCapabilityChanges) {
      payload.enabledModules = form.enabledModules;
      payload.enabledFeatures = form.enabledFeatures;
      payload.enabledOptions = form.enabledOptions;
      payload.enabledPlugins = form.enabledPlugins;
      payload.featureFlags = form.featureFlags;
      payload.aiRuntime = form.aiRuntime;
      payload.frontendProfile = {
        commercePublishPolicy: form.commercePublishPolicy,
      };
    }

    if (canManageTenantInfraAndPlan) {
      payload.accountType = form.accountType;
      payload.provisioningMode = form.provisioningMode;
      payload.subscriptionLevel = form.subscriptionLevel;
      payload.claimStatus = form.claimStatus;
      if (form.agencyPlanKey) {
        payload.agencyPlanKey = form.agencyPlanKey;
      }
    }
    console.log("payload data", payload);
    setSaving(true);
    // await fetch("/api/settings/tenant", {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    const response = await dispatch(updateTenant(payload));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
          {t("common.loading")}
        </span>
      </div>
    );

  const commonFlags = [
    "hasBookingEngine",
    "hasEcommerce",
    "hasPortfolio",
    "hasBlog",
    "hasInvoicing",
    "hasMarketing",
    "hasMediaLibrary",
    "hasBrandKit",
    "sourceModuleEnabled",
    "sourcePilotTravel",
    "sourcePilotProducts",
    "customerCoreEnabled",
  ];
  const enabledModuleSet = new Set(form.enabledModules);
  const activeContextSet = new Set(
    [
      ...normalizeContextArray(tenant?.activeBusinessContexts),
      ...normalizeContextArray(tenant?.businessContexts),
      normalizeBusinessContextKey(form.businessType || ""),
      normalizeBusinessContextKey(form.industry || ""),
    ].filter(Boolean),
  );
  const matchesCapabilityContext = (item: CapabilityDefinition) => {
    if (
      !Array.isArray(item.businessContexts) ||
      item.businessContexts.length === 0
    )
      return true;
    if (activeContextSet.size === 0) return false;
    return item.businessContexts.some((context) =>
      activeContextSet.has(normalizeBusinessContextKey(context)),
    );
  };
  const activeFeatures = capabilityDefinitions.features.filter(
    (feature) =>
      enabledModuleSet.has(feature.moduleKey) &&
      feature.status !== "disabled" &&
      matchesCapabilityContext(feature),
  );
  const activeFeatureSet = new Set(form.enabledFeatures);
  const activeOptions = capabilityDefinitions.options.filter(
    (option) =>
      enabledModuleSet.has(option.moduleKey) &&
      option.status !== "disabled" &&
      (!option.parentKey || activeFeatureSet.has(option.parentKey)) &&
      matchesCapabilityContext(option),
  );
  const activePlugins = capabilityDefinitions.plugins.filter(
    (plugin) =>
      enabledModuleSet.has(plugin.moduleKey) &&
      plugin.status !== "disabled" &&
      matchesCapabilityContext(plugin),
  );
  return (
    <>
      {/* get all language */}
      <GetAllLanguage />
      {/* get all theme */}
      <GetAllTheme />
      {/* get all feature */}
      <GetAllFeatures />
      {/* get all option */}
      <GetAllOptions />
      {/* get all plugin */}
      <GetAllPlugin />
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t("settings.title")}
              </h2>
              <p className="text-slate-400 text-xs font-mono">
                Tenant: {tenant?.key} • Configuration
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] ${saved ? "bg-emerald-500 text-black" : "bg-cyan-500 text-black hover:bg-cyan-400"}`}
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : saved ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            {saving
              ? t("common.loading")
              : saved
                ? "Saved!"
                : t("settings.saveSettings")}
          </button>
        </div>

        {/* Identity Section */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-cyan-400" />{" "}
            {t("settings.tenantIdentity")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Industry
              </label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Business Type
              </label>
              <input
                type="text"
                value={form.businessType}
                onChange={(e) =>
                  setForm({ ...form, businessType: e.target.value })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Account Type
              </label>
              <select
                value={form.accountType}
                disabled={!canManageTenantInfraAndPlan}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accountType: e.target.value as
                      | "business"
                      | "personal_portfolio",
                  })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="business">Business</option>
                <option value="personal_portfolio">Personal Portfolio</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Provisioning Mode
              </label>
              <select
                value={form.provisioningMode}
                disabled={!canManageTenantInfraAndPlan}
                onChange={(e) =>
                  setForm({
                    ...form,
                    provisioningMode: e.target.value as
                      | "full_tenant"
                      | "lite_profile",
                  })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="full_tenant">Full Tenant (Dedicated DB)</option>
                <option value="lite_profile">
                  Lite Profile (No Dedicated DB)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Subscription
              </label>
              {availableAgencyPlans.length > 0 ? (
                <select
                  value={form.agencyPlanKey || form.subscriptionLevel}
                  disabled={!canManageTenantInfraAndPlan}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      agencyPlanKey: e.target.value,
                      subscriptionLevel: e.target.value,
                    })
                  }
                  className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {availableAgencyPlans.map((plan) => (
                    <option key={plan.key} value={plan.key}>
                      {plan.name} ({plan.key})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={form.subscriptionLevel}
                  disabled={!canManageTenantInfraAndPlan}
                  onChange={(e) =>
                    setForm({ ...form, subscriptionLevel: e.target.value })
                  }
                  className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Public Slug
              </label>
              <input
                type="text"
                value={form.publicProfile.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    publicProfile: {
                      ...form.publicProfile,
                      slug: e.target.value,
                    },
                  })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                placeholder="my-business"
              />
              <div className="text-[10px] text-slate-500 mt-1">
                Public URL: /business/{form.publicProfile.slug || tenant?.key}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Public Visibility
              </label>
              <select
                value={form.publicProfile.visibility}
                onChange={(e) =>
                  setForm({
                    ...form,
                    publicProfile: {
                      ...form.publicProfile,
                      visibility: e.target.value,
                    },
                  })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none appearance-none cursor-pointer"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Claim Status
              </label>
              <select
                value={form.claimStatus}
                disabled={!canManageTenantInfraAndPlan}
                onChange={(e) =>
                  setForm({ ...form, claimStatus: e.target.value })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="free_unclaimed">Free / Unclaimed</option>
                <option value="claimed_pending">Claim Pending</option>
                <option value="claimed_active">Claimed Active</option>
                <option value="claimed_inactive">Claimed Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Public Headline
              </label>
              <input
                type="text"
                value={form.publicProfile.headline}
                onChange={(e) =>
                  setForm({
                    ...form,
                    publicProfile: {
                      ...form.publicProfile,
                      headline: e.target.value,
                    },
                  })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Canonical Domain
              </label>
              <input
                type="text"
                value={form.publicProfile.canonicalDomain}
                onChange={(e) =>
                  setForm({
                    ...form,
                    publicProfile: {
                      ...form.publicProfile,
                      canonicalDomain: e.target.value,
                    },
                  })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                placeholder="https://brand.example.com"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Google Analytics Tracking ID
              </label>
              <input
                type="text"
                value={form.googleAnalyticsId}
                onChange={(e) =>
                  setForm({ ...form, googleAnalyticsId: e.target.value })
                }
                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                placeholder="G-XXXXXXXXXX"
              />
              <div className="text-[10px] text-slate-500 mt-1">
                Check analytics directly on your Google Analytics account.
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
              Public Summary
            </label>
            <textarea
              value={form.publicProfile.summary}
              onChange={(e) =>
                setForm({
                  ...form,
                  publicProfile: {
                    ...form.publicProfile,
                    summary: e.target.value,
                  },
                })
              }
              rows={3}
              className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              placeholder="Short description for SEO and public profile."
            />
          </div>
          {!canManageTenantInfraAndPlan && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <Crown size={12} />
              Plan, account type, and claim controls are managed by{" "}
              {agencySupportLabel}.
            </div>
          )}
        </div>

        {/* Commerce Publish Policy */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <Globe size={16} className="text-cyan-400" /> Public Commerce Routes
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Control cart and checkout publishing for public storefront routes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: "cartEnabled",
                label: "Enable Cart Route",
                hint: "Allow /cart/<slug> public access.",
              },
              {
                key: "checkoutEnabled",
                label: "Enable Checkout Route",
                hint: "Allow /checkout/<slug> public access.",
              },
              {
                key: "includeTransactionalInSitemap",
                label: "Include In Sitemap",
                hint: "Expose cart/checkout URLs in sitemap.xml.",
              },
              {
                key: "transactionalNoindex",
                label: "Transactional Noindex",
                hint: "Set noindex on cart and checkout metadata.",
              },
            ].map((item) => (
              <label
                key={item.key}
                className={`flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${canManageCapabilityChanges
                    ? "border-slate-700/80 bg-black/20"
                    : "border-slate-800 bg-black/20 opacity-70"
                  }`}
              >
                <input
                  type="checkbox"
                  disabled={!canManageCapabilityChanges}
                  checked={Boolean(
                    form.commercePublishPolicy[
                    item.key as keyof typeof form.commercePublishPolicy
                    ],
                  )}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      commercePublishPolicy: {
                        ...prev.commercePublishPolicy,
                        [item.key]: e.target.checked,
                      },
                    }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {item.label}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {item.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {!canManageCapabilityChanges && (
            <p className="mt-4 text-xs text-amber-200 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <Lock size={12} />
              Route publishing policy is managed by {agencySupportLabel}.
            </p>
          )}
        </div>

        {/* Brand Colors + Preset Loader */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Palette size={16} className="text-purple-400" />{" "}
            {t("settings.brandColors")}
          </h3>
          {/* Preset Quick-Apply */}
          {themePresets.length > 0 && (
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1">
                <Sparkles size={10} /> Load Preset
              </label>
              <div className="flex flex-wrap gap-2">
                {themePresets.map((preset: any) => (
                  <button
                    key={preset.key}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:border-purple-500/30 hover:text-white transition-all"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    ></div>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 gap-6">
            {(
              [
                ["primary", "Primary", form.primary],
                ["secondary", "Secondary", form.secondary],
                ["accent", "Accent", form.accent],
                ["background", "Background", form.background],
              ] as const
            ).map(([key, label, value]) => (
              <div key={key} className="flex items-center gap-3">
                <SmartColorPicker
                  value={value}
                  onChange={(next) => setForm({ ...form, [key]: next })}
                  variant="dark"
                  className="w-[184px]"
                />
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                    {label}
                  </label>
                  <span className="text-xs font-mono text-slate-300">
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 h-12 rounded-lg overflow-hidden flex">
            <div
              className="flex-1"
              style={{ backgroundColor: form.primary }}
            ></div>
            <div
              className="flex-1"
              style={{ backgroundColor: form.secondary }}
            ></div>
            <div
              className="flex-1"
              style={{ backgroundColor: form.accent }}
            ></div>
            <div
              className="flex-1"
              style={{ backgroundColor: form.background }}
            ></div>
          </div>
        </div>

        {/* Brand Assets */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <ImageUp size={16} className="text-cyan-400" /> Brand Assets
          </h3>
          <p className="text-xs text-slate-500 mb-4 flex items-start gap-2">
            <Info size={14} className="mt-0.5 text-slate-400" />
            Upload directly or paste URL/data URI. These assets are stored in
            tenant `brandKit.logo` and used for public and white-label rendering.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRAND_ASSET_SPECS.map((spec) => {
              const normalizedBrandKit = normalizeBrandKit(form.brandKit);
              const currentValue =
                typeof normalizedBrandKit.logo?.[spec.key] === "string"
                  ? normalizedBrandKit.logo[spec.key]
                  : "";
              const hasPreview =
                typeof currentValue === "string" &&
                currentValue.trim().length > 0;

              return (
                <div
                  key={spec.key}
                  className="rounded-lg border border-slate-700/60 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Building2 className="w-8 h-8 text-cyan-400 p-1.5 bg-cyan-400/10 rounded-lg" />
                      {t("settings.tenantIdentity", "Business Settings")}
                    </h2>
                    {tenant?.key && (
                      <div className="font-mono text-sm px-3 py-1 bg-slate-900 border border-slate-700 rounded-md text-slate-400">
                        Key:{" "}
                        <span className="text-indigo-400 font-bold">
                          {tenant.key}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-8">
                    <HelpTip topicKey="business_settings" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white">
                      {spec.label}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {spec.acceptLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {spec.guidance}
                  </p>

                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => setBrandAssetValue(spec.key, e.target.value)}
                    placeholder="https://cdn.example.com/logo.svg or upload file"
                    className="mt-3 w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs cursor-pointer hover:bg-cyan-500/15 transition-colors">
                      <Upload size={12} />
                      Upload
                      <input
                        type="file"
                        accept={spec.accept}
                        className="hidden"
                        onChange={(e) => {
                          handleAssetFileSelect(spec.key, e.currentTarget.files);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => clearBrandAsset(spec.key)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/40 border border-slate-700 text-slate-300 text-xs hover:border-slate-500 transition-colors"
                    >
                      <Trash2 size={12} />
                      Clear
                    </button>
                  </div>

                  {assetFeedback[spec.key] && (
                    <p className="mt-2 text-[10px] text-slate-400">
                      {assetFeedback[spec.key]}
                    </p>
                  )}

                  <div className="mt-3 h-20 rounded-lg border border-slate-700/70 bg-slate-950/60 flex items-center justify-center overflow-hidden">
                    {hasPreview ? (
                      <img
                        src={currentValue}
                        alt={`${spec.label} preview`}
                        className={`${spec.key === "favicon" ? "w-10 h-10" : "max-h-16 max-w-full"} object-contain`}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        No asset selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Languages Section */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe size={16} className="text-blue-400" />{" "}
            {t("settings.languages")}
            <span className="text-[10px] text-slate-500 font-normal ml-2">
              {form.languages.length} selected
            </span>
          </h3>
          {/* Primary Language */}
          <div className="mb-4">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              {t("settings.primaryLanguage")}
            </label>
            <select
              value={form.primaryLanguage}
              onChange={(e) =>
                setForm({ ...form, primaryLanguage: e.target.value })
              }
              className="bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer appearance-none"
            >
              {availableLanguages
                .filter((l) => form.languages.includes(l.code))
                .map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} ({l.nativeName})
                  </option>
                ))}
            </select>
          </div>
          {/* Language Toggles */}
          <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
            {t("settings.additionalLanguages")}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableLanguages.map((lang) => {
              const active = form.languages.includes(lang.code);
              const isPrimary = form.primaryLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => !isPrimary && toggleLanguage(lang.code)}
                  disabled={isPrimary}
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${active ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-black/30 border-slate-700/50 text-slate-500 hover:border-slate-600"} ${isPrimary ? "ring-1 ring-blue-500/50" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span className="font-medium text-xs">{lang.name}</span>
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${active ? "border-blue-400 bg-blue-400" : "border-slate-600"}`}
                  >
                    {active && <Check size={10} className="text-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enabled Apps */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Boxes size={16} className="text-emerald-400" /> Enabled Apps
            <span className="text-[10px] text-slate-500 font-normal ml-2">
              {form.enabledModules.length} of {ALL_MODULES.length} active
            </span>
          </h3>
          {canManageCapabilityChanges ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {ALL_MODULES.map((mod) => {
                const active = form.enabledModules.includes(mod);
                return (
                  <button
                    key={mod}
                    onClick={() => toggleModule(mod)}
                    className={`p-3 rounded-lg border text-sm font-semibold transition-all text-left ${active ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.1)]" : "bg-black/30 border-slate-700/50 text-slate-500 hover:border-slate-600"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{getAppLabel(mod)}</span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${active ? "border-cyan-400 bg-cyan-400" : "border-slate-600"}`}
                      >
                        {active && <Check size={10} className="text-black" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <Lock size={12} />
                App access is locked for Tenant Admin. Contact{" "}
                {agencySupportLabel}.
              </div>
              <div className="flex flex-wrap gap-2">
                {form.enabledModules.map((moduleKey) => (
                  <span
                    key={moduleKey}
                    className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-200"
                  >
                    {getAppLabel(moduleKey)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {!canManageCapabilityChanges && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Crown size={16} className="text-amber-300" /> Plan & Access
              Governance
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              App access, advanced features, AI runtime, and system flags are
              governed by your agency policy.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <Lock size={12} />
              Contact {agencySupportLabel} to enable premium features or change
              plan-controlled access.
            </div>
          </div>
        )}

        {/* Features */}
        {canManageCapabilityChanges && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400" /> Features
              <span className="text-[10px] text-slate-500 font-normal ml-2">
                {form.enabledFeatures.length} selected
              </span>
            </h3>
            {activeFeatures.length === 0 ? (
              <div className="text-xs text-slate-500">
                No active feature definitions for enabled apps.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activeFeatures.map((feature) => {
                  const active = form.enabledFeatures.includes(feature.key);
                  return (
                    <button
                      key={feature.key}
                      onClick={() => toggleEnabledFeature(feature.key)}
                      className={`p-3 rounded-lg border text-sm font-semibold transition-all text-left ${active ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-black/30 border-slate-700/50 text-slate-500 hover:border-slate-600"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{feature.label}</span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${active ? "border-cyan-400 bg-cyan-400" : "border-slate-600"}`}
                        >
                          {active && <Check size={10} className="text-black" />}
                        </div>
                      </div>
                      <div className="text-[10px] mt-1 font-mono opacity-75">
                        {getAppLabel(feature.moduleKey)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Options */}
        {canManageCapabilityChanges && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Boxes size={16} className="text-amber-400" /> Options
              <span className="text-[10px] text-slate-500 font-normal ml-2">
                {form.enabledOptions.length} selected
              </span>
            </h3>
            {activeOptions.length === 0 ? (
              <div className="text-xs text-slate-500">
                No option definitions available. Enable parent features first.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activeOptions.map((option) => {
                  const active = form.enabledOptions.includes(option.key);
                  return (
                    <button
                      key={option.key}
                      onClick={() => toggleEnabledOption(option.key)}
                      className={`p-3 rounded-lg border text-sm font-semibold transition-all text-left ${active ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-black/30 border-slate-700/50 text-slate-500 hover:border-slate-600"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${active ? "border-amber-400 bg-amber-400" : "border-slate-600"}`}
                        >
                          {active && <Check size={10} className="text-black" />}
                        </div>
                      </div>
                      <div className="text-[10px] mt-1 font-mono opacity-75">
                        {getAppLabel(option.moduleKey)}
                        {option.parentKey ? ` • ${option.parentKey}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add-ons */}
        {canManageCapabilityChanges && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flag size={16} className="text-emerald-400" /> Add-ons
              <span className="text-[10px] text-slate-500 font-normal ml-2">
                {form.enabledPlugins.length} selected
              </span>
            </h3>
            {activePlugins.length === 0 ? (
              <div className="text-xs text-slate-500">
                No add-on definitions available for enabled apps.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activePlugins.map((plugin) => {
                  const active = form.enabledPlugins.includes(plugin.key);
                  return (
                    <button
                      key={plugin.key}
                      onClick={() => toggleEnabledPlugin(plugin.key)}
                      className={`p-3 rounded-lg border text-sm font-semibold transition-all text-left ${active ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-black/30 border-slate-700/50 text-slate-500 hover:border-slate-600"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{plugin.label}</span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${active ? "border-emerald-400 bg-emerald-400" : "border-slate-600"}`}
                        >
                          {active && <Check size={10} className="text-black" />}
                        </div>
                      </div>
                      <div className="text-[10px] mt-1 font-mono opacity-75">
                        {getAppLabel(plugin.moduleKey)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AI Runtime */}
        {canManageCapabilityChanges && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-violet-300" /> AI Runtime
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              If KalpAI reports model access issues, update model preferences
              here. For provider credential or plan issues, escalate to Super
              Admin support with copied diagnostics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                  Preferred Model
                </label>
                <input
                  type="text"
                  value={form.aiRuntime.defaultModel}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      aiRuntime: {
                        ...prev.aiRuntime,
                        defaultModel: e.target.value,
                      },
                    }))
                  }
                  placeholder="gpt-4o-mini"
                  className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                  Fallback Models (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.aiRuntime.fallbackModels.join(", ")}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      aiRuntime: {
                        ...prev.aiRuntime,
                        fallbackModels: Array.from(
                          new Set(
                            e.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          ),
                        ),
                      },
                    }))
                  }
                  placeholder="gpt-4.1-mini, gpt-4o-mini"
                  className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={form.aiRuntime.temperature}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      aiRuntime: {
                        ...prev.aiRuntime,
                        temperature: Math.max(
                          0,
                          Math.min(1, Number(e.target.value) || 0),
                        ),
                      },
                    }))
                  }
                  className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {[
                {
                  key: "managedConnectorEnabled",
                  label: "Managed Connector (platform key)",
                },
                {
                  key: "byokConnectorEnabled",
                  label: "BYOK Connector (tenant key)",
                },
              ].map((item) => {
                const key = item.key as
                  | "managedConnectorEnabled"
                  | "byokConnectorEnabled";
                const isOn = Boolean(form.aiRuntime[key]);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        aiRuntime: {
                          ...prev.aiRuntime,
                          [key]: !isOn,
                        },
                      }))
                    }
                    className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-all ${isOn ? "bg-violet-500/10 border-violet-500/30 text-violet-300" : "bg-black/30 border-slate-700/50 text-slate-500 hover:border-slate-600"}`}
                  >
                    <span className="font-medium">{item.label}</span>
                    <div
                      className={`w-8 h-4 rounded-full relative transition-all ${isOn ? "bg-violet-500" : "bg-slate-700"}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${isOn ? "left-4" : "left-0.5"}`}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* System Flags */}
        {canManageCapabilityChanges && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flag size={16} className="text-amber-400" /> System Flags
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {commonFlags.map((flag) => {
                const isOn = !!form.featureFlags[flag];
                return (
                  <button
                    key={flag}
                    onClick={() => toggleFlag(flag)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-all ${isOn ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-black/30 border-slate-700/50 text-slate-500 hover:border-slate-600"}`}
                  >
                    <span className="font-mono">{flag.replace("has", "")}</span>
                    <div
                      className={`w-8 h-4 rounded-full relative transition-all ${isOn ? "bg-emerald-500" : "bg-slate-700"}`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${isOn ? "left-4" : "left-0.5"}`}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}