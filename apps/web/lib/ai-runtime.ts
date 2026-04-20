import { ObjectId } from "mongodb";
import { getMasterDb } from "@/lib/db";
import { decryptSecret } from "@/lib/secret-crypto";
import {
  OPENAI_API_KEY,
  OPENAI_DEFAULT_MODEL,
  OPENAI_IMAGE_MODEL,
  OPENAI_PRODUCT_GENERATION_MODEL,
  OPENAI_SITE_CONTENT_MODEL,
  OPENAI_SITE_PLANNER_MODEL,
} from "@/lib/server-env";

export type ResolvedAiRuntime = {
  apiKey: string;
  defaultModel: string;
  sitePlannerModel: string;
  siteContentModel: string;
  productGenerationModel: string;
  imageModel: string;
};

function readConfigString(
  config: Record<string, unknown>,
  keys: string[],
  fallback: string,
): string {
  for (const key of keys) {
    const value = config[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

export async function resolveTenantAiRuntime(
  tenantKey?: string,
): Promise<ResolvedAiRuntime> {
  const fallback: ResolvedAiRuntime = {
    apiKey: OPENAI_API_KEY,
    defaultModel: OPENAI_DEFAULT_MODEL,
    sitePlannerModel: OPENAI_SITE_PLANNER_MODEL,
    siteContentModel: OPENAI_SITE_CONTENT_MODEL,
    productGenerationModel: OPENAI_PRODUCT_GENERATION_MODEL,
    imageModel: OPENAI_IMAGE_MODEL,
  };

  if (!tenantKey) return fallback;

  try {
    const masterDb = await getMasterDb();

    const [tenant, aiProfile] = await Promise.all([
      masterDb.collection("tenants").findOne(
        { key: tenantKey },
        { projection: { infraAssignments: 1, agencyId: 1 } },
      ),
      masterDb.collection("tenant_ai_profiles").findOne(
        { tenantKey },
        { projection: { config: 1 } },
      ),
    ]);

    const config =
      aiProfile?.config && typeof aiProfile.config === "object"
        ? (aiProfile.config as Record<string, unknown>)
        : {};

    const resolvedModels: Omit<ResolvedAiRuntime, "apiKey"> = {
      defaultModel: readConfigString(
        config,
        ["defaultModel"],
        fallback.defaultModel,
      ),
      sitePlannerModel: readConfigString(
        config,
        ["sitePlannerModel", "planningModel", "defaultModel"],
        fallback.sitePlannerModel,
      ),
      siteContentModel: readConfigString(
        config,
        ["siteContentModel", "contentModel", "defaultModel"],
        fallback.siteContentModel,
      ),
      productGenerationModel: readConfigString(
        config,
        ["productGenerationModel", "productModel", "contentModel", "defaultModel"],
        fallback.productGenerationModel,
      ),
      imageModel: readConfigString(
        config,
        ["imageModel"],
        fallback.imageModel,
      ),
    };

    const infraAssignments =
      tenant?.infraAssignments && typeof tenant.infraAssignments === "object"
        ? (tenant.infraAssignments as Record<string, unknown>)
        : {};
    const infraAi =
      infraAssignments.ai && typeof infraAssignments.ai === "object"
        ? (infraAssignments.ai as Record<string, unknown>)
        : {};

    if (infraAi.mode === "agency_managed_ai") {
      const decrypted = decryptSecret(
        typeof infraAi.apiKeyEncrypted === "string"
          ? infraAi.apiKeyEncrypted
          : "",
      );
      if (decrypted) {
        return {
          apiKey: decrypted,
          defaultModel: readConfigString(
            infraAi,
            ["defaultModel"],
            resolvedModels.defaultModel,
          ),
          sitePlannerModel: readConfigString(
            infraAi,
            ["sitePlannerModel", "planningModel", "defaultModel"],
            resolvedModels.sitePlannerModel,
          ),
          siteContentModel: readConfigString(
            infraAi,
            ["siteContentModel", "contentModel", "defaultModel"],
            resolvedModels.siteContentModel,
          ),
          productGenerationModel: readConfigString(
            infraAi,
            ["productGenerationModel", "productModel", "contentModel", "defaultModel"],
            resolvedModels.productGenerationModel,
          ),
          imageModel: readConfigString(
            infraAi,
            ["imageModel"],
            resolvedModels.imageModel,
          ),
        };
      }
    }

    if (tenant?.agencyId && ObjectId.isValid(String(tenant.agencyId))) {
      const agency = await masterDb.collection("agencies").findOne(
        { _id: new ObjectId(String(tenant.agencyId)) },
        { projection: { infraProfile: 1 } },
      );
      const infraProfile =
        agency?.infraProfile && typeof agency.infraProfile === "object"
          ? (agency.infraProfile as Record<string, unknown>)
          : {};
      const agencyAi =
        infraProfile.ai && typeof infraProfile.ai === "object"
          ? (infraProfile.ai as Record<string, unknown>)
          : {};
      if (agencyAi.mode === "agency_managed_ai") {
        const decrypted = decryptSecret(
          typeof agencyAi.apiKeyEncrypted === "string"
            ? agencyAi.apiKeyEncrypted
            : "",
        );
        if (decrypted) {
          return {
            apiKey: decrypted,
            defaultModel: readConfigString(
              agencyAi,
              ["defaultModel"],
              resolvedModels.defaultModel,
            ),
            sitePlannerModel: readConfigString(
              agencyAi,
              ["sitePlannerModel", "planningModel", "defaultModel"],
              resolvedModels.sitePlannerModel,
            ),
            siteContentModel: readConfigString(
              agencyAi,
              ["siteContentModel", "contentModel", "defaultModel"],
              resolvedModels.siteContentModel,
            ),
            productGenerationModel: readConfigString(
              agencyAi,
              ["productGenerationModel", "productModel", "contentModel", "defaultModel"],
              resolvedModels.productGenerationModel,
            ),
            imageModel: readConfigString(
              agencyAi,
              ["imageModel"],
              resolvedModels.imageModel,
            ),
          };
        }
      }
    }

    return {
      apiKey: fallback.apiKey,
      ...resolvedModels,
    };
  } catch {
    return fallback;
  }
}
