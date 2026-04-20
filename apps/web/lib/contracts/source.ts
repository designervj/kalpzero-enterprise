export type SourceInputType = 'link' | 'text' | 'json' | 'file';

export type SourceParseStatus = 'ready' | 'pending_manual' | 'error';

export interface SourceOriginDto {
    url?: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
    note?: string;
}

export interface SourceExtractedFieldDto {
    fieldPath: string;
    label: string;
    suggestedValue: string | number | boolean | null;
    confidence: number;
    reason: string;
    targetType?: string;
}

export interface SourceLinkedEntityDto {
    entityType: string;
    entityId: string;
    linkedAt: string | Date;
    linkedBy: string;
}

export interface SourceRecordDto {
    _id?: string | number | { toString(): string };
    inputType: SourceInputType;
    origin: SourceOriginDto;
    raw: Record<string, unknown>;
    normalized: Record<string, unknown>;
    status: SourceParseStatus;
    parserVersion: string;
    warnings: string[];
    confidence: number;
    extractedFields: SourceExtractedFieldDto[];
    linkedEntities: SourceLinkedEntityDto[];
    createdBy: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}

export interface SourceApplyChangeDto {
    fieldPath: string;
    currentValue: unknown;
    suggestedValue: unknown;
    hasConflict: boolean;
    selected: boolean;
}

export interface SourceApplyPreviewDto {
    sourceId: string;
    targetType: string;
    changes: SourceApplyChangeDto[];
    conflicts: number;
}

export interface SourceEntityRefDto {
    sourceId: string;
    inputType: SourceInputType;
    createdAt: string;
    label?: string;
}

export interface SourceApplicationDto {
    _id?: string | number | { toString(): string };
    sourceId: string;
    targetType: string;
    entityType?: string;
    entityId?: string;
    fieldsApplied: string[];
    payload?: Record<string, unknown>;
    createdBy: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}
