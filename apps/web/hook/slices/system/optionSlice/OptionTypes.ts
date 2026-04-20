import { CapabilityDefinition } from "@/app/(dashboard)/settings/tenant/tenantType";


export interface OptionState {
    allOptions: CapabilityDefinition[];
    currentOption: CapabilityDefinition | null;
    isFetchedOption: boolean;
    loading: boolean;
    error: string | null;
}
