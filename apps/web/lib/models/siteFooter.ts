import { ObjectId, Db } from "mongodb";
import { getTenantDb } from "@/lib/db";

export interface SiteFooterDocument {
  _id?: ObjectId;
  siteId: string;
  templateType: "footer";
  name: string;
  html: string;
  css: string;
  isActive: boolean;
  updatedAt: Date;
}

/**
 * Retrieves the current active global footer for a site.
 */
export async function getActiveSiteFooter(
  tenantKey: string,
): Promise<SiteFooterDocument | null> {
  const db = await getTenantDb(tenantKey);
  const footer = await db
    .collection<SiteFooterDocument>("templates")
    .findOne({ siteId: tenantKey, templateType: "footer", isActive: true });
  return footer ? JSON.parse(JSON.stringify(footer)) : null;
}

/**
 * Retrieves all saved footers for a site.
 */
export async function getAllSiteFooters(
  tenantKey: string,
): Promise<SiteFooterDocument[]> {
  const db = await getTenantDb(tenantKey);
  const footers = await db
    .collection<SiteFooterDocument>("templates")
    .find({ siteId: tenantKey, templateType: "footer" })
    .sort({ updatedAt: -1 })
    .toArray();
  return JSON.parse(JSON.stringify(footers));
}

/**
 * Retrieves a specific footer by ID.
 */
export async function getSiteFooterById(
  tenantKey: string,
  id: string | ObjectId,
): Promise<SiteFooterDocument | null> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return null;
  const db = await getTenantDb(tenantKey);
  const footer = await db.collection<SiteFooterDocument>("templates").findOne({
    _id: new ObjectId(id),
    siteId: tenantKey,
    templateType: "footer",
  });
  return footer ? JSON.parse(JSON.stringify(footer)) : null;
}

/**
 * Saves or updates a site footer.
 */
export async function saveSiteFooter(
  tenantKey: string,
  payload: {
    id?: string | ObjectId;
    name: string;
    html: string;
    css: string;
    isActive?: boolean;
  },
): Promise<boolean> {
  const db = await getTenantDb(tenantKey);
  const now = new Date();

  // If this footer is being set to active, deactivate all others first
  if (payload.isActive) {
    await db
      .collection("templates")
      .updateMany(
        { siteId: tenantKey, templateType: "footer" },
        { $set: { isActive: false } },
      );
  }

  const { id, ...data } = payload;
  const filter = id
    ? { _id: new ObjectId(id), siteId: tenantKey, templateType: "footer" }
    : { name: payload.name, siteId: tenantKey, templateType: "footer" };

  const result = await db.collection("templates").updateOne(
    filter,
    {
      $set: {
        ...data,
        siteId: tenantKey,
        templateType: "footer",
        isActive: payload.isActive ?? false,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  return result.modifiedCount > 0 || result.upsertedCount > 0;
}

/**
 * Activates a specific site footer.
 */
export async function activateSiteFooter(
  tenantKey: string,
  id: string | ObjectId,
): Promise<boolean> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return false;
  const db = await getTenantDb(tenantKey);

  // Deactivate all others
  await db
    .collection("templates")
    .updateMany(
      { siteId: tenantKey, templateType: "footer" },
      { $set: { isActive: false } },
    );

  // Activate specific one
  const result = await db
    .collection("templates")
    .updateOne(
      { _id: new ObjectId(id), siteId: tenantKey, templateType: "footer" },
      { $set: { isActive: true, updatedAt: new Date() } },
    );

  return result.modifiedCount > 0;
}

/**
 * Deletes a site footer.
 */
export async function deleteSiteFooter(
  tenantKey: string,
  id: string | ObjectId,
): Promise<boolean> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return false;
  const db = await getTenantDb(tenantKey);
  const result = await db.collection("templates").deleteOne({
    _id: new ObjectId(id),
    siteId: tenantKey,
    templateType: "footer",
  });
  return result.deletedCount > 0;
}

/**
 * Clears the active site footer.
 */
export async function clearSiteFooter(tenantKey: string): Promise<boolean> {
  const db = await getTenantDb(tenantKey);
  const result = await db
    .collection("templates")
    .updateMany(
      { siteId: tenantKey, templateType: "footer" },
      { $set: { isActive: false, updatedAt: new Date() } },
    );
  return result.modifiedCount > 0;
}
