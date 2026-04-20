export type AiProviderIssueCode =
    | 'MODEL_ACCESS_DENIED'
    | 'INVALID_API_KEY'
    | 'INSUFFICIENT_QUOTA'
    | 'RATE_LIMITED'
    | 'NETWORK_OR_PROVIDER'
    | 'UNKNOWN';

export interface AiProviderIssueAdvice {
    code: AiProviderIssueCode;
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

function normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export function extractOpenAiProjectId(errorMessage: string): string {
    const match = errorMessage.match(/project\s+[`'"]?([a-z0-9_\-]+)[`'"]?/i);
    return match?.[1] || '';
}

export function classifyAiProviderIssue(errorMessage: string): AiProviderIssueCode {
    const message = errorMessage.toLowerCase();

    if (
        message.includes('does not have access to model')
        || message.includes('model_not_found')
        || message.includes('not have access to model')
    ) {
        return 'MODEL_ACCESS_DENIED';
    }
    if (message.includes('incorrect api key') || message.includes('invalid_api_key') || message.includes('api key')) {
        return 'INVALID_API_KEY';
    }
    if (message.includes('insufficient_quota') || message.includes('quota') || message.includes('billing')) {
        return 'INSUFFICIENT_QUOTA';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
        return 'RATE_LIMITED';
    }
    if (message.includes('ssl') || message.includes('network') || message.includes('connection')) {
        return 'NETWORK_OR_PROVIDER';
    }
    return 'UNKNOWN';
}

export function buildAiProviderIssueAdvice(input: {
    errorMessage: string;
    tenantKey: string;
    roleView: string;
    model: string;
}): AiProviderIssueAdvice {
    const errorMessage = normalizeString(input.errorMessage) || 'AI provider request failed.';
    const code = classifyAiProviderIssue(errorMessage);
    const projectId = extractOpenAiProjectId(errorMessage);

    const shared = {
        diagnostics: {
            tenantKey: input.tenantKey,
            roleView: input.roleView,
            model: input.model,
            provider: 'openai' as const,
            projectId: projectId || undefined,
            timestamp: new Date().toISOString(),
            rawMessage: errorMessage,
        },
        supportAction: 'If the issue persists, contact support and share the copied diagnostics payload.',
    };

    if (code === 'MODEL_ACCESS_DENIED') {
        return {
            code,
            title: 'Model Access Is Not Enabled',
            message: `The configured model \`${input.model}\` is not available for the current OpenAI project.`,
            tenantAction: 'Tenant/Agency Admin: open Tenant Settings -> AI Runtime and switch to a model your plan can access.',
            adminAction: 'Super Admin: verify OPENAI API project permissions and allowed models for this workspace.',
            ...shared,
        };
    }
    if (code === 'INVALID_API_KEY') {
        return {
            code,
            title: 'AI Credential Error',
            message: 'OpenAI credentials are invalid or unavailable in this deployment.',
            tenantAction: 'Tenant users cannot fix this locally. Notify platform admin.',
            adminAction: 'Super Admin: rotate OPENAI_API_KEY and verify project-level key scope.',
            ...shared,
        };
    }
    if (code === 'INSUFFICIENT_QUOTA') {
        return {
            code,
            title: 'AI Quota Exhausted',
            message: 'The provider quota or billing limit has been reached.',
            tenantAction: 'Check plan limits and AI credit usage in your tenant dashboard.',
            adminAction: 'Super Admin: top-up/adjust provider billing or move tenant to a higher AI budget profile.',
            ...shared,
        };
    }
    if (code === 'RATE_LIMITED') {
        return {
            code,
            title: 'AI Rate Limit Reached',
            message: 'Too many requests were sent to the provider in a short window.',
            tenantAction: 'Retry after a short delay and reduce burst usage.',
            adminAction: 'Super Admin: tune request throttling and per-tenant request limits.',
            ...shared,
        };
    }
    if (code === 'NETWORK_OR_PROVIDER') {
        return {
            code,
            title: 'AI Network/Provider Error',
            message: 'The assistant could not reach the provider due to a network or provider issue.',
            tenantAction: 'Retry shortly. If repeated, share diagnostics with admin.',
            adminAction: 'Super Admin: verify egress/network policy and provider service health.',
            ...shared,
        };
    }

    return {
        code,
        title: 'AI Provider Error',
        message: 'The request could not be completed with the current provider settings.',
        tenantAction: 'Retry once and then notify your admin with diagnostics.',
        adminAction: 'Super Admin: inspect provider logs and tenant AI runtime configuration.',
        ...shared,
    };
}
