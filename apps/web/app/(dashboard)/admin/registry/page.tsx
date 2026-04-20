"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Check,
  Database,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
} from "lucide-react";

import { REGISTRY_TABS } from "@/components/admin/registry/RegistryTabs";
import { CapabilityDefinitionsView } from "@/components/admin/registry/CapabilityDefinitionsView";
import { CategoryTemplatesView } from "@/components/admin/registry/CategoryTemplatesView";
import { AttributesCatalogView } from "@/components/admin/registry/AttributesCatalogView";
import { CurrenciesView } from "@/components/admin/registry/CurrenciesView";
import { EmailsView } from "@/components/admin/registry/EmailsView";
import { LanguagesView } from "@/components/admin/registry/LanguagesView";
import { ModulesView } from "@/components/admin/registry/ModulesView";
import { PromptsView } from "@/components/admin/registry/PromptsView";
import { RolesView } from "@/components/admin/registry/RolesView";
import { TemplatesView } from "@/components/admin/registry/TemplatesView";
import { ThemesView } from "@/components/admin/registry/ThemesView";

const REGISTRY_ENDPOINTS: Record<string, string> = {
  themes: "/api/system/themes",
  roles: "/api/system/roles",
  templates: "/api/system/templates",
  attributes: "/api/system/attributes",
  modules: "/api/system/modules",
  languages: "/api/system/languages",
  emails: "/api/system/emails",
  currencies: "/api/system/currencies",
  prompts: "/api/system/prompts",
  features: "/api/system/features",
  options: "/api/system/options",
  plugins: "/api/system/plugins",
  "category-templates": "/api/system/category-templates",
};

type RegistryItem = Record<string, unknown> & { _id?: string };

type ReleaseStatus = {
  currentVersion: string;
  latestCandidate: string | null;
  latestCandidateStatus: string | null;
  latestCandidateCreatedAt: string | null;
  latestRelease: string | null;
  latestReleaseAt: string | null;
  checksSummary: {
    total: number;
    passed: number;
    failed: number;
  };
};

function asRegistryItems(value: unknown): RegistryItem[] {
  return Array.isArray(value) ? (value as RegistryItem[]) : [];
}

export default function SystemRegistryPage() {
  const [data, setData] = useState<Record<string, RegistryItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RegistryItem>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [releaseStatus, setReleaseStatus] = useState<ReleaseStatus | null>(
    null,
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/system/releases/status")
      .then((r) => r.json())
      .then((releases) => {
        if (releases && !releases.error) {
          setReleaseStatus(releases as ReleaseStatus);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dataCounts = useMemo(
    () =>
      Object.keys(data).reduce(
        (acc, key) => {
          acc[key] = Array.isArray(data[key]) ? data[key].length : 0;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [data],
  );

  const registrySections = useMemo(
    () => REGISTRY_TABS.filter((tab) => Boolean(REGISTRY_ENDPOINTS[tab.key])),
    [],
  );

  const reload = async (tab: string) => {
    if (!REGISTRY_ENDPOINTS[tab]) return;
    const res = await fetch(REGISTRY_ENDPOINTS[tab]).then((r) => r.json());
    setData((prev) => ({ ...prev, [tab]: asRegistryItems(res) }));
  };

  const runMutation = async (
    tab: string,
    method: "POST" | "PUT" | "DELETE",
    payload?: RegistryItem,
    id?: string,
  ) => {
    const endpoint = REGISTRY_ENDPOINTS[tab];
    if (!endpoint) return;

    const url =
      method === "DELETE"
        ? `${endpoint}?id=${encodeURIComponent(id || "")}`
        : endpoint;
    const res = await fetch(url, {
      method,
      headers:
        method === "DELETE"
          ? undefined
          : { "Content-Type": "application/json" },
      body: method === "DELETE" ? undefined : JSON.stringify(payload || {}),
    });

    let responseBody: Record<string, unknown> | null = null;
    try {
      responseBody = (await res.json()) as Record<string, unknown>;
    } catch {
      responseBody = null;
    }

    if (!res.ok) {
      throw new Error(
        typeof responseBody?.error === "string"
          ? responseBody.error
          : `Failed to ${method.toLowerCase()} ${tab}.`,
      );
    }

    return responseBody;
  };

  const handleDelete = async (tab: string, id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await runMutation(tab, "DELETE", undefined, id);
      showToast("Deleted");
      reload(tab);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleSaveEdit = async (
    tab: string,
    customForm?: RegistryItem,
    isNew?: boolean,
  ) => {
    setSaving(true);
    const payload = customForm || editForm;
    const method: "POST" | "PUT" = isNew ? "POST" : "PUT";

    try {
      await runMutation(tab, method, payload);
      setEditingId(null);
      showToast(method === "POST" ? "Created" : "Updated");
      reload(tab);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // Lazy load data if not present
        if (!data[key] || data[key].length === 0) {
          reload(key);
        }
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(
      new Set(registrySections.map((section) => section.key)),
    );
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const renderSectionContent = (tabKey: string, items: RegistryItem[]) => {
    if (tabKey === "themes") {
      return (
        <ThemesView
          items={items}
          editingId={editingId}
          editForm={editForm}
          setEditingId={setEditingId}
          setEditForm={setEditForm}
          onSave={(payload?: RegistryItem) =>
            handleSaveEdit("themes", payload || editForm)
          }
          onDelete={(id: string) => handleDelete("themes", id)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "roles") {
      return (
        <RolesView
          items={items}
          onCreate={(payload: RegistryItem) =>
            handleSaveEdit("roles", payload, true)
          }
          onUpdate={(payload: RegistryItem) => handleSaveEdit("roles", payload)}
          onDelete={(id: string) => handleDelete("roles", id)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "templates") {
      return (
        <TemplatesView
          items={items}
          onDelete={(id: string) => handleDelete("templates", id)}
          onReload={() => reload("templates")}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "modules") {
      return (
        <ModulesView
          items={items}
          onCreate={(payload: RegistryItem) =>
            handleSaveEdit("modules", payload, true)
          }
          onUpdate={(payload: RegistryItem) =>
            handleSaveEdit("modules", payload)
          }
          onDelete={(id: string) => handleDelete("modules", id)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "languages") {
      return (
        <LanguagesView
          items={items}
          onCreate={(payload: RegistryItem) =>
            handleSaveEdit("languages", payload, true)
          }
          onUpdate={(payload: RegistryItem) =>
            handleSaveEdit("languages", payload)
          }
          onDelete={(id: string) => handleDelete("languages", id)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "emails") {
      return (
        <EmailsView
          items={items}
          onCreate={(payload: RegistryItem) =>
            handleSaveEdit("emails", payload, true)
          }
          onUpdate={(payload: RegistryItem) =>
            handleSaveEdit("emails", payload)
          }
          onDelete={(id: string) => handleDelete("emails", id)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "currencies") {
      return (
        <CurrenciesView
          items={items}
          onCreate={(payload: RegistryItem) =>
            handleSaveEdit("currencies", payload, true)
          }
          onUpdate={(payload: RegistryItem) =>
            handleSaveEdit("currencies", payload)
          }
          onDelete={(id: string) => handleDelete("currencies", id)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "prompts") {
      return (
        <PromptsView
          items={items}
          editingId={editingId}
          editForm={editForm}
          setEditingId={setEditingId}
          setEditForm={setEditForm}
          onSave={() => handleSaveEdit("prompts")}
          onDelete={(id: string) => handleDelete("prompts", id)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "features" || tabKey === "options" || tabKey === "plugins") {
      return (
        <CapabilityDefinitionsView
          items={items}
          capabilityLabel={
            tabKey === "features"
              ? "feature"
              : tabKey === "options"
                ? "option"
                : "add-on"
          }
          onCreate={(payload: RegistryItem) =>
            handleSaveEdit(tabKey, payload, true)
          }
          onUpdate={(payload: RegistryItem) => handleSaveEdit(tabKey, payload)}
          onDelete={(id: string) => handleDelete(tabKey, id)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "category-templates") {
      return (
        <CategoryTemplatesView
          items={items}
          onCreate={(payload) =>
            handleSaveEdit("category-templates", payload, true)
          }
          onUpdate={(payload) => handleSaveEdit("category-templates", payload)}
          saving={saving}
          viewMode={viewMode}
        />
      );
    }
    if (tabKey === "attributes") {
      return <AttributesCatalogView />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-500" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Loading System Registry...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black shadow-xl animate-in slide-in-from-right duration-300">
          <Check size={14} /> {toast}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">System Registry</h2>
            <p className="font-mono text-xs text-slate-400">
              kalp_system • {Object.keys(dataCounts).length} collections •{" "}
              {Object.values(dataCounts).reduce((a, b) => a + b, 0)} records
            </p>
          </div>
        </div>
        <div className="min-w-[280px] rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Release Status
          </div>
          {releaseStatus ? (
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current</span>
                <span className="font-mono text-white">
                  {releaseStatus.currentVersion}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Candidate</span>
                <span className="font-mono text-cyan-300">
                  {releaseStatus.latestCandidate || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Candidate Status</span>
                <span
                  className={
                    releaseStatus.latestCandidateStatus === "candidate_ready"
                      ? "font-semibold text-emerald-300"
                      : "font-semibold text-amber-300"
                  }
                >
                  {releaseStatus.latestCandidateStatus || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Checks</span>
                <span className="font-mono text-white">
                  {releaseStatus.checksSummary.passed}/
                  {releaseStatus.checksSummary.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Latest Release</span>
                <span className="font-mono text-purple-300">
                  {releaseStatus.latestRelease || "-"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500">
              Release tracker unavailable.
            </div>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500/40"
          >
            <Maximize2 size={12} />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500/40"
          >
            <Minimize2 size={12} />
            Collapse All
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition-colors ${viewMode === "list" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            <List size={12} /> List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition-colors ${viewMode === "grid" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            <LayoutGrid size={12} /> Grid
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {registrySections.map((section) => {
          const Icon = section.icon;
          const isOpen = expandedSections.has(section.key);
          const items = data[section.key] || [];
          return (
            <section
              key={section.key}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/35"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md border border-slate-700 bg-slate-900 p-2 text-slate-300">
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {section.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {items.length} records
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                    {items.length}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-slate-800 overflow-x-auto">
                  {renderSectionContent(section.key, items)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
