import { ObjectId, Db } from "mongodb";
import { getTenantDb } from "@/lib/db";

export type NavigationItemType = "link" | "dropdown" | "mega";
export type NavigationItemTarget = "_self" | "_blank";

export interface MegaMenuColumn {
  title: string;
  links: {
    label: string;
    url: string;
    target?: NavigationItemTarget;
  }[];
}

export interface NavigationItem {
  id: string; // Internal UUID or unique string for drag and drop
  label: string;
  url: string;
  target: NavigationItemTarget;
  type: NavigationItemType;
  children?: NavigationItem[];
  megaMenuColumns?: MegaMenuColumn[];
}

export interface NavigationDocument {
  _id?: ObjectId;
  siteId: string; // Equivalent to tenantKey
  name: string; // e.g., "Primary Menu", "Footer Menu"
  items: NavigationItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Retrieves all navigations for a specific site (tenant).
 */
export async function getNavigationsBySite(
  tenantKey: string,
): Promise<NavigationDocument[]> {
  const db = await getTenantDb(tenantKey);
  const navigations = await db
    .collection<NavigationDocument>("navigations")
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();
  return JSON.parse(JSON.stringify(navigations));
}

/**
 * Retrieves a specific navigation by its ID within a tenant database.
 */
export async function getNavigationById(
  tenantKey: string,
  id: string | ObjectId,
): Promise<NavigationDocument | null> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return null;
  const db = await getTenantDb(tenantKey);
  const nav = await db
    .collection<NavigationDocument>("navigations")
    .findOne({ _id: new ObjectId(id) });
  return nav ? JSON.parse(JSON.stringify(nav)) : null;
}

/**
 * Creates a new navigation menu.
 */
export async function createNavigation(
  tenantKey: string,
  payload: Omit<
    NavigationDocument,
    "_id" | "siteId" | "createdAt" | "updatedAt"
  >,
): Promise<ObjectId> {
  const db = await getTenantDb(tenantKey);
  const now = new Date();
  const doc: NavigationDocument = {
    ...payload,
    siteId: tenantKey,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection("navigations").insertOne(doc);
  return result.insertedId;
}

/**
 * Updates an existing navigation menu.
 */
export async function updateNavigation(
  tenantKey: string,
  id: string | ObjectId,
  payload: Partial<
    Omit<NavigationDocument, "_id" | "siteId" | "createdAt" | "updatedAt">
  >,
): Promise<boolean> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return false;
  const db = await getTenantDb(tenantKey);
  const result = await db.collection("navigations").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...payload,
        updatedAt: new Date(),
      },
    },
  );
  return result.modifiedCount > 0;
}

/**
 * Deletes a navigation menu.
 */
export async function deleteNavigation(
  tenantKey: string,
  id: string | ObjectId,
): Promise<boolean> {
  if (!id || (typeof id === "string" && !ObjectId.isValid(id))) return false;
  const db = await getTenantDb(tenantKey);
  const result = await db
    .collection("navigations")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
