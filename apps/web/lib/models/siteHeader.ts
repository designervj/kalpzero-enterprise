import { ObjectId, Db } from "mongodb";
import { getTenantDb } from "@/lib/db";

export interface SiteHeaderDocument {
  _id?: ObjectId;
  siteId: string;
  templateType: "header";
  name: string;
  html: string;
  css: string;
  isActive: boolean;
  updatedAt: Date;
}

/**
 * Retrieves the current active global header for a site.
 */
export async function getActiveSiteHeader(
  tenantKey: string,
): Promise<SiteHeaderDocument | null> {
  const db = await getTenantDb(tenantKey);
  const header = await db
    .collection<SiteHeaderDocument>("templates")
    .findOne({ siteId: tenantKey, templateType: "header", isActive: true });
  return header ? JSON.parse(JSON.stringify(header)) : null;
}

/**
 * Retrieves all saved headers for a site.
 */
export async function getAllSiteHeaders(
  tenantKey: string,
): Promise<SiteHeaderDocument[]> {
 
  const db = await getTenantDb(tenantKey);
  const headers = await db
    .collection<SiteHeaderDocument>("templates")
    .find({ siteId: tenantKey, templateType: "header" })
    .sort({ updatedAt: -1 })
    .toArray();
  return JSON.parse(JSON.stringify(headers));
}

/**
 * Retrieves a specific header by ID.
 */
export async function getSiteHeaderById(
  tenantKey: string,
  id: string | ObjectId,
): Promise<SiteHeaderDocument | null> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return null;
  const db = await getTenantDb(tenantKey);

  const header = await db.collection<SiteHeaderDocument>("templates").findOne({
    _id: new ObjectId(id),
    siteId: tenantKey,
    templateType: "header",
  });
  return header ? JSON.parse(JSON.stringify(header)) : null;
}

/**
 * Saves or updates a site header.
 */
export async function saveSiteHeader(
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


  // If this header is being set to active, deactivate all others first
  if (payload.isActive) {
    await db
      .collection("templates")
      .updateMany(
        { siteId: tenantKey, templateType: "header" },
        { $set: { isActive: false } },
      );
  }

  const { id, ...data } = payload;
  const filter = id
    ? { _id: new ObjectId(id), siteId: tenantKey, templateType: "header" }
    : { name: payload.name, siteId: tenantKey, templateType: "header" };

  const result = await db.collection("templates").updateOne(
    filter,
    {
      $set: {
        ...data,
        siteId: tenantKey,
        templateType: "header",
        isActive: payload.isActive ?? false,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  return result.modifiedCount > 0 || result.upsertedCount > 0;
}

/**
 * Activates a specific site header.
 */
export async function activateSiteHeader(
  tenantKey: string,
  id: string | ObjectId,
): Promise<boolean> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return false;
  const db = await getTenantDb(tenantKey);

  // Deactivate all others
  await db
    .collection("templates")
    .updateMany(
      { siteId: tenantKey, templateType: "header" },
      { $set: { isActive: false } },
    );

  // Activate specific one
  const result = await db
    .collection("templates")
    .updateOne(
      { _id: new ObjectId(id), siteId: tenantKey, templateType: "header" },
      { $set: { isActive: true, updatedAt: new Date() } },
    );

  return result.modifiedCount > 0;
}

/**
 * Deletes a site header.
 */
export async function deleteSiteHeader(
  tenantKey: string,
  id: string | ObjectId,
): Promise<boolean> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return false;
  const db = await getTenantDb(tenantKey);
  const result = await db.collection("templates").deleteOne({
    _id: new ObjectId(id),
    siteId: tenantKey,
    templateType: "header",
  });
  return result.deletedCount > 0;
}

/**
 * Clears the active site header.
 */
export async function clearSiteHeader(tenantKey: string): Promise<boolean> {
  const db = await getTenantDb(tenantKey);
  const result = await db
    .collection("templates")
    .updateMany(
      { siteId: tenantKey, templateType: "header" },
      { $set: { isActive: false, updatedAt: new Date() } },
    );
  return result.modifiedCount > 0;
}
