import { CapabilityDefinition } from "@/app/(dashboard)/settings/tenant/tenantType";

export interface FeatureState {
    allFeatures: CapabilityDefinition[];
    currentFeature: CapabilityDefinition | null;
    isFetchedFeature: boolean;
    loading: boolean;
    error: string | null;
}
