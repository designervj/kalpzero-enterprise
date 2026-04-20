"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Edit3,
  Plus,
  Rocket,
  Server,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { canRoleMutateUi } from "@/lib/role-scope";
import {
  buildEditForm,
  describeBusinessType,
  deriveTenantDatabaseLabel,
  KNOWN_MODULE_KEYS,
  parseApiError,
  parseCommaSeparatedInput,
  toStringList,
  type DeleteState,
  type TenantEditFormState,
  type TenantRecord,
} from "./tenantShared";
import {
  Badge,
  Button,
  ScopedReadOnlyNotice,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/TenantUi";
import { TenantDeleteModal } from "./components/TenantDeleteModal";
import { TenantEditModal } from "./components/TenantEditModal";

const PAGE_ICON_CLASSNAME =
  "mb-4 inline-flex items-center justify-center rounded-xl border " +
  "border-emerald-500/20 bg-emerald-500/10 p-2 " +
  "shadow-[0_0_20px_rgba(16,185,129,0.1)]";

const ONBOARDING_BUTTON_CLASSNAME =
  "gap-2 border-purple-500/50 text-purple-300 " +
  "shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:border-purple-400 " +
  "hover:bg-purple-500/10 hover:text-purple-200";

const CREATE_BUTTON_CLASSNAME =
  "gap-2 border-emerald-500/40 text-emerald-300 " +
  "shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:border-emerald-400 " +
  "hover:bg-emerald-500/10 hover:text-emerald-200";

const SUBSCRIPTION_BADGE_CLASSNAME =
  "border border-emerald-500/30 bg-emerald-500/10 text-[9px] " +
  "uppercase tracking-widest text-emerald-400";

export default function TenantIdentitiesPage() {
  const { currentProfile, isScopedRoleView } = useAuth();
  const canMutate = canRoleMutateUi(currentProfile);
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [editForm, setEditForm] = useState<TenantEditFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const availableModuleKeys = useMemo(() => {
    const keys = new Set<string>(KNOWN_MODULE_KEYS);
    tenants.forEach((tenant) =>
      toStringList(tenant.enabledModules).forEach((key) => keys.add(key)),
    );
    return Array.from(keys);
  }, [tenants]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/tenants", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTenants();
  }, []);

  useEffect(() => {
    if (!canMutate) {
      setEditingTenant(null);
      setDeleteState(null);
      setEditForm(null);
    }
  }, [canMutate]);

  const handleCreateDemo = async () => {
    if (!canMutate) return;
    const rand = Math.floor(Math.random() * 9000) + 1000;
    await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: `beta_${rand}`,
        name: `Kalp Beta Organization ${rand}`,
        subscriptionLevel: "pro",
        ownerAdmin: {
          name: `Beta Admin ${rand}`,
          email: `beta${rand}@example.local`,
          password: `Beta${rand}!kalp`,
        },
      }),
    });
    await fetchTenants();
  };

  const handleImpersonate = async (tenantKey: string) => {
    await fetch("/api/auth/switch-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantKey }),
    });
    window.location.href = "/";
  };

  const openEditModal = (tenant: TenantRecord) => {
    if (!canMutate) return;
    setEditingTenant(tenant);
    setEditForm(buildEditForm(tenant));
    setError("");
  };

  const closeEditModal = () => {
    setEditingTenant(null);
    setEditForm(null);
    setError("");
  };

  const updateEditForm = <K extends keyof TenantEditFormState>(
    key: K,
    value: TenantEditFormState[K],
  ) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleModule = (moduleKey: string) => {
    if (!editForm) return;
    setEditForm((prev) => {
      if (!prev) return prev;
      const nextModules = prev.enabledModules.includes(moduleKey)
        ? prev.enabledModules.filter((item) => item !== moduleKey)
        : [...prev.enabledModules, moduleKey];
      return { ...prev, enabledModules: nextModules };
    });
  };

  const handleUpdateTenant = async () => {
    if (!canMutate || !editingTenant || !editForm) return;
    setSaving(true);
    setError("");

    const parsedLanguages = parseCommaSeparatedInput(editForm.languagesInput);
    const nextLanguages = editForm.primaryLanguage.trim()
      ? Array.from(
          new Set([editForm.primaryLanguage.trim(), ...parsedLanguages]),
        )
      : parsedLanguages;
    const parsedBusinessTypes = parseCommaSeparatedInput(
      editForm.businessTypeInput,
    );

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTenant._id,
          key: editingTenant.key,
          name: editForm.name.trim(),
          subscriptionLevel: editForm.subscriptionLevel,
          industry: editForm.industry.trim(),
          businessType:
            parsedBusinessTypes.length <= 1
              ? parsedBusinessTypes[0] || ""
              : parsedBusinessTypes,
          claimStatus: editForm.claimStatus,
          accountType: editForm.accountType,
          provisioningMode: editForm.provisioningMode,
          primaryDomain: parseCommaSeparatedInput(editForm.primaryDomainsInput),
          languages: nextLanguages,
          primaryLanguage: editForm.primaryLanguage.trim() || "en",
          publicProfile: {
            slug: editForm.publicSlug.trim(),
          },
          ownerAdminName: editForm.ownerAdminName.trim(),
          ownerAdminEmail: editForm.ownerAdminEmail.trim().toLowerCase(),
          enabledModules: editForm.enabledModules,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to update tenant."));
      }
      showToast("Tenant workspace updated");
      closeEditModal();
      await fetchTenants();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update tenant.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!canMutate || !deleteState) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/tenants?id=${encodeURIComponent(deleteState.tenant._id)}&purgeTenantDb=${deleteState.purgeTenantDb ? "1" : "0"}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to delete tenant."));
      }
      showToast(
        deleteState.purgeTenantDb
          ? "Business and tenant database deleted"
          : "Business deleted",
      );
      setDeleteState(null);
      await fetchTenants();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete tenant.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleDeletePurge = (nextValue: boolean) => {
    setDeleteState((prev) =>
      prev ? { ...prev, purgeTenantDb: nextValue } : prev,
    );
  };

  return (
    <div className="relative z-10 mx-auto mt-6 max-w-6xl space-y-10 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black shadow-xl">
          {toast}
        </div>
      )}

      <header className="relative flex items-center justify-between">
        <div>
          <div className={PAGE_ICON_CLASSNAME}>
            <Building2 className="h-6 w-6 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
            Tenant <span className="text-emerald-400">Identities</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Platform Owner control center reading directly from{" "}
            <code className="text-emerald-400">kalp_master</code>. Edit a
            business to review the full tenant structure, owner admin details,
            module access, and provisioning metadata.
          </p>
        </div>

        <div className="flex gap-4">
          {canMutate ? (
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/onboarding")}
                className={ONBOARDING_BUTTON_CLASSNAME}
              >
                <Rocket size={16} /> Business Onboarding Flow
              </Button>
              <Button
                onClick={handleCreateDemo}
                variant="secondary"
                className={CREATE_BUTTON_CLASSNAME}
              >
                <Plus size={16} /> Mint New Tenant
              </Button>
            </>
          ) : null}
        </div>
      </header>

      <ScopedReadOnlyNotice
        visible={!canMutate && isScopedRoleView}
        message="Read-only scoped view is active. Tenant create/edit/delete actions are disabled for this role context."
      />

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-20 text-emerald-500/50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500"></div>
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
              Decrypting Master Registry...
            </span>
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-10 text-center text-sm italic text-slate-500">
            No tenants established in the master registry.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Business Type</TableHead>
                <TableHead>Claim</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800">
                        <Server size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-slate-200">
                          {tenant.name}
                          <Badge className={SUBSCRIPTION_BADGE_CLASSNAME}>
                            {tenant.subscriptionLevel}
                          </Badge>
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          namespace: {deriveTenantDatabaseLabel(tenant)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {tenant.subscriptionLevel || "starter"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {tenant.industry || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {describeBusinessType(tenant.businessType) || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        tenant.claimStatus === "claimed"
                          ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                          : tenant.claimStatus === "suspended"
                            ? "border-rose-500/30 bg-rose-500/20 text-rose-400"
                            : "border-slate-500/30 bg-slate-500/20 text-slate-300"
                      }
                    >
                      {tenant.claimStatus || "free_unclaimed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {tenant.createdAt
                      ? new Date(tenant.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canMutate ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(tenant)}
                            title="Edit tenant"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteState({
                                tenant,
                                purgeTenantDb: false,
                              })
                            }
                            title="Delete tenant"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImpersonate(tenant.key)}
                        className="gap-2"
                      >
                        Impersonate <ArrowRight size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <TenantEditModal
        tenant={editingTenant}
        form={editForm}
        availableModuleKeys={availableModuleKeys}
        saving={saving}
        onClose={closeEditModal}
        onSave={handleUpdateTenant}
        onToggleModule={toggleModule}
        onFieldChange={updateEditForm}
      />

      <TenantDeleteModal
        deleteState={deleteState}
        deleting={deleting}
        onClose={() => setDeleteState(null)}
        onConfirm={handleDeleteTenant}
        onTogglePurge={toggleDeletePurge}
      />
    </div>
  );
}
