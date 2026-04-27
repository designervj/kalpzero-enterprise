export interface Agency {
  id?: string;
  slug?: string;
  name?: string;
  region?: string;
  owner_user_id?: string;
  created_at?: string;
}

export interface AgencyState {
  allAgencies: Agency[];
  currentAgency: Agency | null;
  isFetchedAllAgencies: boolean;
  loading: boolean;
  error: string | null;
}
