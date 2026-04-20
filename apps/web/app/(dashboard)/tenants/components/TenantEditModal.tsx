"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Database,
  Globe,
  Mail,
  Save,
  Shield,
  User2,
  X,
} from "lucide-react";

import { getAppLabel } from "@/lib/app-labels";

import {
  deriveTenantDatabaseLabel,
  parseCommaSeparatedInput,
  toStringList,
  type TenantEditFormState,
  type TenantRecord,
} from "../tenantShared";
import { Button, Input, Label, Select } from "./TenantUi";

type TenantEditModalProps = {
  tenant: TenantRecord | null;
  form: TenantEditFormState | null;
  availableModuleKeys: string[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onToggleModule: (moduleKey: string) => void;
  onFieldChange: <K extends keyof TenantEditFormState>(
    key: K,
    value: TenantEditFormState[K],
  ) => void;
};

const PANEL_CLASSNAME =
  "rounded-3xl border border-slate-800 bg-slate-950/40 p-5";

const MODAL_FRAME_CLASSNAME =
  "mt-2 flex max-h-[calc(100vh-1rem)] w-full max-w-[1280px] flex-col " +
  "overflow-hidden rounded-3xl border border-slate-800 bg-[#050b17] " +
  "shadow-[0_40px_120px_rgba(0,0,0,0.65)] md:max-h-[calc(100vh-3rem)]";

const META_CARD_CLASSNAME =
  "rounded-2xl border border-slate-800 bg-black/20 p-4";

const RAW_SNAPSHOT_CLASSNAME =
  "mt-4 max-h-[min(48vh,520px)] overflow-auto rounded-2xl border " +
  "border-slate-800 bg-black/30 p-4 text-[11px] leading-6 text-slate-300";

export function TenantEditModal({
  tenant,
  form,
  availableModuleKeys,
  saving,
  onClose,
  onSave,
  onToggleModule,
  onFieldChange,
}: TenantEditModalProps) {
  useEffect(() => {
    if (!tenant || !form) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [tenant, form]);

  if (!tenant || !form || typeof document === "undefined") return null;

  const activeDomains = parseCommaSeparatedInput(form.primaryDomainsInput);
  const businessContexts = toStringList(tenant.businessContexts);

  return createPortal(
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm md:p-6">
      <div className="flex min-h-full items-start justify-center">
        <div className={MODAL_FRAME_CLASSNAME}>
          <div className="flex shrink-0 items-start justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-5">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">
                Tenant Control Surface
              </div>
              <h3 className="mt-2 text-2xl font-bold text-white">
                {tenant.name}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Review the full business structure, owner-admin access, public
                identity, and module permissions from one place.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-6">
            <div className="grid shrink-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className={META_CARD_CLASSNAME}>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  Tenant Key
                </div>
                <div className="mt-2 font-mono text-sm text-white">
                  {tenant.key}
                </div>
              </div>
              <div className={META_CARD_CLASSNAME}>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  Database
                </div>
                <div className="mt-2 text-sm text-white">
                  {deriveTenantDatabaseLabel(tenant)}
                </div>
              </div>
              <div className={META_CARD_CLASSNAME}>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  Workspace Mode
                </div>
                <div className="mt-2 text-sm text-white">
                  {tenant.provisioningMode === "lite_profile"
                    ? "Lite Profile"
                    : "Full Tenant"}
                </div>
              </div>
              <div className={META_CARD_CLASSNAME}>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  Users
                </div>
                <div className="mt-2 text-sm text-white">
                  {tenant.userCount ?? 0}
                </div>
              </div>
            </div>

            <div className="mt-6 grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div className="min-h-0 space-y-6 overflow-y-auto pr-1">
                <section className={PANEL_CLASSNAME}>
                  <div className="mb-5 flex items-center gap-2 text-white">
                    <Building2 size={16} className="text-cyan-300" />
                    <h4 className="font-semibold">Business Identity</h4>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Business name</Label>
                      <Input
                        value={form.name}
                        onChange={(event) =>
                          onFieldChange("name", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input
                        value={form.industry}
                        onChange={(event) =>
                          onFieldChange("industry", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Business type(s)</Label>
                      <Input
                        value={form.businessTypeInput}
                        onChange={(event) =>
                          onFieldChange("businessTypeInput", event.target.value)
                        }
                        placeholder="Comma separated business types"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subscription</Label>
                      <Select
                        value={form.subscriptionLevel}
                        onChange={(event) =>
                          onFieldChange("subscriptionLevel", event.target.value)
                        }
                      >
                        <option value="starter">starter</option>
                        <option value="pro">pro</option>
                        <option value="enterprise">enterprise</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Claim status</Label>
                      <Select
                        value={form.claimStatus}
                        onChange={(event) =>
                          onFieldChange("claimStatus", event.target.value)
                        }
                      >
                        <option value="free_unclaimed">free_unclaimed</option>
                        <option value="claimed">claimed</option>
                        <option value="suspended">suspended</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Account type</Label>
                      <Select
                        value={form.accountType}
                        onChange={(event) =>
                          onFieldChange("accountType", event.target.value)
                        }
                      >
                        <option value="business">business</option>
                        <option value="personal_portfolio">
                          personal_portfolio
                        </option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Provisioning mode</Label>
                      <Select
                        value={form.provisioningMode}
                        onChange={(event) =>
                          onFieldChange("provisioningMode", event.target.value)
                        }
                      >
                        <option value="full_tenant">full_tenant</option>
                        <option value="lite_profile">lite_profile</option>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className={PANEL_CLASSNAME}>
                  <div className="mb-5 flex items-center gap-2 text-white">
                    <Globe size={16} className="text-emerald-300" />
                    <h4 className="font-semibold">Public Identity</h4>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Primary domain(s)</Label>
                      <Input
                        value={form.primaryDomainsInput}
                        onChange={(event) =>
                          onFieldChange(
                            "primaryDomainsInput",
                            event.target.value,
                          )
                        }
                        placeholder="example.com, app.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Public slug</Label>
                      <Input
                        value={form.publicSlug}
                        onChange={(event) =>
                          onFieldChange("publicSlug", event.target.value)
                        }
                        placeholder="business-slug"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary language</Label>
                      <Input
                        value={form.primaryLanguage}
                        onChange={(event) =>
                          onFieldChange("primaryLanguage", event.target.value)
                        }
                        placeholder="en"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Languages</Label>
                      <Input
                        value={form.languagesInput}
                        onChange={(event) =>
                          onFieldChange("languagesInput", event.target.value)
                        }
                        placeholder="en, hi"
                      />
                    </div>
                  </div>
                </section>

                <section className={PANEL_CLASSNAME}>
                  <div className="mb-5 flex items-center gap-2 text-white">
                    <Shield size={16} className="text-amber-300" />
                    <h4 className="font-semibold">Owner Admin Access</h4>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Owner admin name</Label>
                      <Input
                        value={form.ownerAdminName}
                        onChange={(event) =>
                          onFieldChange("ownerAdminName", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Owner admin email</Label>
                      <Input
                        type="email"
                        value={form.ownerAdminEmail}
                        onChange={(event) =>
                          onFieldChange("ownerAdminEmail", event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className={META_CARD_CLASSNAME}>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                        <User2 size={12} />
                        Role
                      </div>
                      <div className="mt-2 text-sm text-white">
                        {tenant.ownerAdminUser?.role || "tenant_admin"}
                      </div>
                    </div>
                    <div className={META_CARD_CLASSNAME}>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                        <Mail size={12} />
                        Status
                      </div>
                      <div className="mt-2 text-sm text-white">
                        {tenant.ownerAdminUser?.status || "active"}
                      </div>
                    </div>
                    <div className={META_CARD_CLASSNAME}>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                        <Database size={12} />
                        Password
                      </div>
                      <div className="mt-2 text-sm text-slate-400">
                        Not retrievable after provisioning
                      </div>
                    </div>
                  </div>
                </section>

                <section className={PANEL_CLASSNAME}>
                  <div className="mb-5 flex items-center gap-2 text-white">
                    <Database size={16} className="text-cyan-300" />
                    <h4 className="font-semibold">Module Access</h4>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {availableModuleKeys.map((moduleKey) => {
                      const active = form.enabledModules.includes(moduleKey);

                      return (
                        <button
                          key={moduleKey}
                          type="button"
                          onClick={() => onToggleModule(moduleKey)}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                            active
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                              : "border-slate-800 bg-black/20 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">
                              {getAppLabel(moduleKey)}
                            </div>
                            <div
                              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                active
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-slate-800 text-slate-500"
                              }`}
                            >
                              {active ? "On" : "Off"}
                            </div>
                          </div>
                          <div className="mt-2 font-mono text-[11px] text-slate-500">
                            {moduleKey}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    Toggle module access here. The tenant record is updated in{" "}
                    <code>kalp_master.tenants</code> and the runtime sidebar
                    reads from the refreshed tenant snapshot.
                  </p>
                </section>
              </div>

              <div className="min-h-0 space-y-6 overflow-y-auto pr-1">
                <section className={PANEL_CLASSNAME}>
                  <h4 className="text-sm font-semibold text-white">
                    Tenant Summary
                  </h4>
                  <div className="mt-4 space-y-4 text-sm">
                    <div className={META_CARD_CLASSNAME}>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">
                        Active domains
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activeDomains.length > 0 ? (
                          activeDomains.map((domain) => (
                            <span
                              key={domain}
                              className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-200"
                            >
                              {domain}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">
                            No primary domain configured
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={META_CARD_CLASSNAME}>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">
                        Business contexts
                      </div>
                      <div className="mt-2 text-sm text-white">
                        {businessContexts.join(", ") || "Not derived yet"}
                      </div>
                    </div>
                    <div className={META_CARD_CLASSNAME}>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">
                        Provisioning target
                      </div>
                      <div className="mt-2 text-sm text-white">
                        {form.provisioningMode === "lite_profile"
                          ? "Shared admin panel with master-only storage"
                          : "Dedicated database with tenant-only workspace"}
                      </div>
                    </div>
                  </div>
                </section>

                <section className={PANEL_CLASSNAME}>
                  <h4 className="text-sm font-semibold text-white">
                    Raw Tenant Snapshot
                  </h4>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    This is the current master-registry structure for the
                    selected business. It helps you inspect everything before
                    saving changes.
                  </p>
                  <pre className={RAW_SNAPSHOT_CLASSNAME}>
                    {JSON.stringify(tenant, null, 2)}
                  </pre>
                </section>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/80 px-6 py-4">
            <div className="max-w-2xl text-xs leading-6 text-slate-500">
              Changes here update the tenant master record and the owner admin
              access metadata. The action bar stays pinned so you can save
              without scrolling to the end of the form.
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={saving}
                className="gap-2"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Workspace Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
