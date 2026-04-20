import type { Db } from 'mongodb';
import { enforceModuleSelectionRules, normalizeModuleList } from '@/lib/module-rules';

type TenantLike = {
    key?: unknown;
    industry?: unknown;
    businessType?: unknown;
    businessContexts?: unknown;
    activeBusinessContexts?: unknown;
    enabledModules?: unknown;
    languages?: unknown;
};

export type EnsureTenantKalpBodhInput = {
    masterDb: Db;
    systemDb: Db;
    tenant: TenantLike;
    actorUserId?: string;
    forceSync?: boolean;
};

function normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter(Boolean)
        )
    );
}

function resolveBusinessContexts(tenant: TenantLike): string[] {
    const active = normalizeStringArray(tenant.activeBusinessContexts);
    if (active.length > 0) return active;
    return normalizeStringArray(tenant.businessContexts);
}

function resolveEnabledModules(tenant: TenantLike): string[] {
    const base = normalizeModuleList(tenant.enabledModules);
    base.push('kalpbodh');
    return enforceModuleSelectionRules(base).modules;
}

function inferTerminologyPack(languages: string[]): string {
    if (languages.includes('hi')) return 'kalp_local_pack';
    return 'global_english_pack';
}

type SystemTemplateSelection = {
    agentProfileKey: string;
    policyProfileKey: string;
    budgetProfileKey: string;
    retentionPolicyKey: string;
};

async function resolveSystemTemplates(systemDb: Db): Promise<SystemTemplateSelection> {
    const [
        agentProfile,
        policyProfile,
        budgetProfile,
        retentionPolicy,
    ] = await Promise.all([
        systemDb.collection('ai_agent_profiles').findOne({ key: 'kalpbodh_default', active: { $ne: false } }, { projection: { key: 1 } }),
        systemDb.collection('ai_policy_profiles').findOne({ key: 'tenant_role_scoped', active: { $ne: false } }, { projection: { key: 1 } }),
        systemDb.collection('ai_budget_profiles').findOne({ key: 'starter_managed', active: { $ne: false } }, { projection: { key: 1 } }),
        systemDb.collection('retention_policy_templates').findOne({ key: 'kalpbodh_default_ttl', active: { $ne: false } }, { projection: { key: 1 } }),
    ]);

    return {
        agentProfileKey: normalizeString(agentProfile?.key) || 'kalpbodh_default',
        policyProfileKey: normalizeString(policyProfile?.key) || 'tenant_role_scoped',
        budgetProfileKey: normalizeString(budgetProfile?.key) || 'starter_managed',
        retentionPolicyKey: normalizeString(retentionPolicy?.key) || 'kalpbodh_default_ttl',
    };
}

export async function ensureTenantKalpBodhGovernance(input: EnsureTenantKalpBodhInput): Promise<void> {
    const { masterDb, systemDb, tenant, actorUserId, forceSync = false } = input;
    const tenantKey = normalizeString(tenant.key);
    if (!tenantKey) return;

    const now = new Date();
    const industry = normalizeString(tenant.industry);
    const businessType = normalizeString(tenant.businessType);
    const businessContexts = resolveBusinessContexts(tenant);
    const enabledModules = resolveEnabledModules(tenant);
    const languages = normalizeStringArray(tenant.languages);
    const terminologyPackKey = inferTerminologyPack(languages);
    const systemTemplates = await resolveSystemTemplates(systemDb);

    const aiProfilesCol = masterDb.collection('tenant_ai_profiles');
    const terminologyCol = masterDb.collection('tenant_terminology_bindings');
    const retentionCol = masterDb.collection('tenant_retention_policies');

    const [existingAiProfile, existingTerminologyBinding, existingRetentionBinding] = await Promise.all([
        aiProfilesCol.findOne({ tenantKey }, { projection: { _id: 1, config: 1, status: 1 } }),
        terminologyCol.findOne({ tenantKey }, { projection: { _id: 1, packKey: 1 } }),
        retentionCol.findOne({ tenantKey }, { projection: { _id: 1, templateKey: 1 } }),
    ]);

    const aiConfig = existingAiProfile?.config && typeof existingAiProfile.config === 'object'
        ? existingAiProfile.config as Record<string, unknown>
        : {};

    const nextAiConfig = {
        agentProfileKey: forceSync ? systemTemplates.agentProfileKey : (normalizeString(aiConfig.agentProfileKey) || systemTemplates.agentProfileKey),
        policyProfileKey: forceSync ? systemTemplates.policyProfileKey : (normalizeString(aiConfig.policyProfileKey) || systemTemplates.policyProfileKey),
        budgetProfileKey: forceSync ? systemTemplates.budgetProfileKey : (normalizeString(aiConfig.budgetProfileKey) || systemTemplates.budgetProfileKey),
        retentionPolicyKey: forceSync ? systemTemplates.retentionPolicyKey : (normalizeString(aiConfig.retentionPolicyKey) || systemTemplates.retentionPolicyKey),
        interactionMode: normalizeString(aiConfig.interactionMode) || 'role_scoped_assist',
        defaultTemperature: typeof aiConfig.defaultTemperature === 'number' ? aiConfig.defaultTemperature : 0.4,
        defaultModel: normalizeString(aiConfig.defaultModel) || 'gpt-4o-mini',
        managedConnectorEnabled: aiConfig.managedConnectorEnabled !== false,
        byokConnectorEnabled: aiConfig.byokConnectorEnabled === true,
        scopes: {
            enabledModules,
            businessContexts,
            industry,
            businessType,
        },
    };

    await aiProfilesCol.updateOne(
        { tenantKey },
        {
            $set: {
                tenantKey,
                status: forceSync ? 'active' : (normalizeString(existingAiProfile?.status) || 'active'),
                config: nextAiConfig,
                updatedAt: now,
                updatedBy: actorUserId || 'system',
            },
            $setOnInsert: {
                createdAt: now,
                createdBy: actorUserId || 'system',
            },
        },
        { upsert: true }
    );

    await terminologyCol.updateOne(
        { tenantKey },
        {
            $set: {
                tenantKey,
                packKey: forceSync
                    ? terminologyPackKey
                    : (normalizeString(existingTerminologyBinding?.packKey) || terminologyPackKey),
                source: forceSync ? 'system_sync' : (existingTerminologyBinding ? 'tenant_override' : 'system_default'),
                updatedAt: now,
                updatedBy: actorUserId || 'system',
            },
            $setOnInsert: {
                createdAt: now,
                createdBy: actorUserId || 'system',
            },
        },
        { upsert: true }
    );

    await retentionCol.updateOne(
        { tenantKey },
        {
            $set: {
                tenantKey,
                templateKey: forceSync
                    ? systemTemplates.retentionPolicyKey
                    : (normalizeString(existingRetentionBinding?.templateKey) || systemTemplates.retentionPolicyKey),
                mode: 'template_bound',
                updatedAt: now,
                updatedBy: actorUserId || 'system',
            },
            $setOnInsert: {
                createdAt: now,
                createdBy: actorUserId || 'system',
            },
        },
        { upsert: true }
    );
}
