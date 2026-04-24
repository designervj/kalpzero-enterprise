export interface AttributeOption {
  key?: string;
  label?: string;
  type?: string; // e.g. "select"
  options?: string[];
  enabled?: boolean;
}

export interface AttributeSetItem {
  id?: string;
  _id?: string;
  key?: string;
  name?: string;
  appliesTo?: string; // e.g. "product"
  description?: string;
  attributes?: AttributeOption[];
  vertical_bindings?: string[]; 
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Support for the tactical UI component
export interface AttributeFieldDraft {
  key: string;
  label: string;
  type: string;
  options: string;
  enabled: boolean;
}

export interface AttributeSetDraft {
  name: string;
  key: string;
  appliesTo: string;
  vertical_bindings: string;
  description: string;
  attributes: AttributeFieldDraft[];
}

export type AttributeSetRecord = AttributeSetItem;
