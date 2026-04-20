export type KalpBodhMessageRole = 'system' | 'user' | 'assistant';
export type KalpBodhSessionStatus = 'active' | 'closed' | 'archived';
export type KalpBodhProviderIssueCode =
    | 'MODEL_ACCESS_DENIED'
    | 'INVALID_API_KEY'
    | 'INSUFFICIENT_QUOTA'
    | 'RATE_LIMITED'
    | 'NETWORK_OR_PROVIDER'
    | 'UNKNOWN';

export interface KalpBodhScopeDto {
    sessionRole: string;
    roleView: string;
    roleLabel: string;
    bodhHint: string;
    tenantKey: string;
    businessContexts: string[];
    enabledModules: string[];
    canPinArtifacts: boolean;
}

export interface KalpBodhSessionDto {
    _id?: unknown;
    tenantKey: string;
    title: string;
    status: KalpBodhSessionStatus;
    roleView: string;
    tags: string[];
    contextTags: string[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    lastMessageAt: Date;
    expiresAt: Date;
}

export interface KalpBodhMessageDto {
    _id?: unknown;
    sessionId: string;
    tenantKey: string;
    role: KalpBodhMessageRole;
    content: string;
    source: 'openai' | 'fallback' | 'system';
    createdAt: Date;
    expiresAt: Date;
    roleView: string;
    metadata?: Record<string, unknown>;
}

export interface KalpBodhSuggestionDto {
    key: string;
    label: string;
    prompt: string;
    roleScopes: string[];
    moduleScopes: string[];
    priority: number;
}

export interface KalpBodhBootstrapDto {
    scope: KalpBodhScopeDto;
    suggestions: KalpBodhSuggestionDto[];
    terminologyPack: {
        key: string;
        name: string;
        labels: Record<string, string>;
    };
    retentionPolicy: {
        key: string;
        sessionTtlDays: number;
        artifactTtlDays: number;
        autoPurgeEnabled: boolean;
    };
}

export interface KalpBodhIssueAdviceDto {
    code: KalpBodhProviderIssueCode;
    title: string;
    message: string;
    tenantAction: string;
    adminAction: string;
    supportAction: string;
    diagnostics: {
        tenantKey: string;
        roleView: string;
        model: string;
        provider: 'openai';
        projectId?: string;
        timestamp: string;
        rawMessage: string;
    };
}

export interface KalpBodhUsageDto {
    tenantKey: string;
    from: string;
    to: string;
    totals: {
        sessions: number;
        messages: number;
        userMessages: number;
        assistantMessages: number;
        openAiReplies: number;
        fallbackReplies: number;
    };
    byRoleView: Array<{ roleView: string; sessions: number; messages: number }>;
    byActor: Array<{ actorUserId: string; messages: number }>;
    daily: Array<{ date: string; messages: number; openAiReplies: number; fallbackReplies: number }>;
}
