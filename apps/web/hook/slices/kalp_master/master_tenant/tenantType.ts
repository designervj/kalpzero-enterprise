
 export interface RuntimeDocuments {
   kind: string;
   mode: string;
   database: string;
   collection_count: number;
   collections: Record<string, string>;
   bootstrap: {
     seeded_documents: any[];
     seeded_document_count: number;
     page_slugs: string[];
   };
 }
 export interface WebsiteDeployment {
   id?: string;
   provider?: string;
   status?: string;
   repo_name?: string | null;
   repo_url?: string | null;
   repo_id?: string | null;
   vercel_project_id?: string | null;
   vercel_project_name?: string | null;
   deployment_id?: string | null;
   deployment_url?: string | null;
   production_url?: string | null;
   message?: string | null;
   last_error?: string | null;
   metadata?: {
     tenant_slug?: string;
     tenant_display_name?: string;
     repo_name?: string;
     project_name?: string;
     admin_email?: string;
     requested_primary_domains?: string[];
     message?: string;
     github_full_name?: string;
     github_default_branch?: string;
     provisioning_failed?: boolean;
   };
   created_at?: string;
   updated_at?: string;
 }
export interface TenantSwitcherOption {
  id?: string;
  agency_id?: string;
  slug?: string;
  display_name?: string;
  infra_mode?: string;
  vertical_packs?: string[];
  business_type?: string | null;
  feature_flags?: string[];
  dedicated_profile_id?: string | null;
  mongo_db_name?: string;
  created_at?: string;
  runtime_documents?: RuntimeDocuments
  website_deployment?: WebsiteDeployment |null
  // Keep these for backward compatibility if needed, but mark as optional
  _id?: string;
  key?: string;
  name?: string;
  subscriptionLevel?: string;
  agencyId?: string | null;
}