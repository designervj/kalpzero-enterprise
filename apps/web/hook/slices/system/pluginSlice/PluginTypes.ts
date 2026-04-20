import { CapabilityDefinition } from "@/app/(dashboard)/settings/tenant/tenantType";



export interface PluginState {
    allPlugin: CapabilityDefinition[];
    currentPlugin: CapabilityDefinition | null;
    isFetchedPlugin: boolean;
    loading: boolean;
    error: string | null;
}
