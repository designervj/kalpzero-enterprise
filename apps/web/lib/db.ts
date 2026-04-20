import { MongoClient, Db } from "mongodb";
import dns from "node:dns/promises";
import { decryptSecret } from "./secret-crypto";
import { MONGODB_URI } from "./server-env";

type DnsWithResultOrder = typeof dns & {
  setDefaultResultOrder?: (order: "ipv4first" | "verbatim") => void;
};

// Fix for Node.js 18+ DNS resolution issues on some Windows setups/networks
const dnsWithResultOrder = dns as DnsWithResultOrder;
if (dnsWithResultOrder.setDefaultResultOrder) {
  dnsWithResultOrder.setDefaultResultOrder("ipv4first");
}

/**
 * Global DNS servers to ensure SRV records can be resolved reliably.
 * Cloudflare and Google DNS as fallbacks.
 */
const externalClientCache = new Map<string, MongoClient>();
const externalClientPromises = new Map<string, Promise<MongoClient>>();
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (e) {
  console.warn("Failed to set custom DNS servers", e);
}

/**
 * In development, we use a global variable to maintain the connection
 * across Hot Module Replacement (HMR). In production, it's fine to
 * use a module-level variable, but for safety, we'll use the global pattern.
 */
interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoClient?: MongoClient;
}

const globalWithMongo = global as unknown as GlobalWithMongo;

export async function connectToDatabase(): Promise<MongoClient> {
  // If we already have a client, return it
  if (globalWithMongo._mongoClient) {
    return globalWithMongo._mongoClient;
  }

  // If we have a promise in flight, wait for it
  if (!globalWithMongo._mongoClientPromise) {
    const opts = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      family: 4,
      tls: true,
    };

    globalWithMongo._mongoClientPromise = MongoClient.connect(
      MONGODB_URI,
      opts,
    ).then((client) => {
      globalWithMongo._mongoClient = client;
      return client;
    });
  }

  return globalWithMongo._mongoClientPromise;
}

async function connectToExternalDatabase(uri: string): Promise<MongoClient> {
  const normalized = uri.trim();
  if (!normalized) throw new Error("External Mongo URI is required.");

  const cached = externalClientCache.get(normalized);
  if (cached) return cached;

  const pending = externalClientPromises.get(normalized);
  if (pending) return pending;

  const promise = MongoClient.connect(normalized, {})
    .then((client) => {
      externalClientCache.set(normalized, client);
      externalClientPromises.delete(normalized);
      return client;
    })
    .catch((error) => {
      externalClientPromises.delete(normalized);
      throw error;
    });

  externalClientPromises.set(normalized, promise);
  return promise;
}

/**
 * Kalp-Zero Database Strategy Multiplexer
 * ========================================
 * 1) kalp_master: platform control (tenants, plans, subscriptions, flags)
 * 2) kalp_system: global reusable templates (roles, presets, definitions)
 * 3) kalp_tenant_<id>: isolated tenant data
 */

export async function getMasterDb(): Promise<Db> {
  const client = await connectToDatabase();
  return client.db("kalp_master");
}

export async function getSystemDb(): Promise<Db> {
  const client = await connectToDatabase();
  return client.db("kalp_system");
}

export async function getTenantDb(tenantId: string): Promise<Db> {
  if (!tenantId)
    throw new Error("tenantId is required to access a tenant database.");

  // Ensure the tenant string is clean to prevent injection attacks on DB names
  const cleanTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, "");
  const defaultDbName = `kalp_tenant_${cleanTenantId}`;
  const defaultClient = await connectToDatabase();

  try {
    const masterDb = defaultClient.db("kalp_master");
    const tenant = await masterDb
      .collection("tenants")
      .findOne(
        { key: cleanTenantId },
        { projection: { infraAssignments: 1, dbProfile: 1 } },
      );

    const infraAssignments =
      tenant?.infraAssignments && typeof tenant.infraAssignments === "object"
        ? (tenant.infraAssignments as Record<string, unknown>)
        : {};
    const infraDatabase =
      infraAssignments.database && typeof infraAssignments.database === "object"
        ? (infraAssignments.database as Record<string, unknown>)
        : {};

    if (infraDatabase.mode === "agency_managed_mongo") {
      const mongoUriEncrypted =
        typeof infraDatabase.mongoUriEncrypted === "string"
          ? infraDatabase.mongoUriEncrypted
          : "";
      const mongoUri = decryptSecret(mongoUriEncrypted);
      const databaseName =
        typeof infraDatabase.databaseName === "string" &&
        infraDatabase.databaseName.trim().length > 0
          ? infraDatabase.databaseName.trim()
          : defaultDbName;
      if (mongoUri) {
        const externalClient = await connectToExternalDatabase(mongoUri);
        return externalClient.db(databaseName);
      }
    }

    const legacyDbProfile =
      tenant?.dbProfile && typeof tenant.dbProfile === "object"
        ? (tenant.dbProfile as Record<string, unknown>)
        : {};
    if (legacyDbProfile.mode === "self") {
      const legacyUri =
        typeof legacyDbProfile.mongodbUri === "string"
          ? legacyDbProfile.mongodbUri.trim()
          : "";
      const legacyDbName =
        typeof legacyDbProfile.databaseName === "string" &&
        legacyDbProfile.databaseName.trim().length > 0
          ? legacyDbProfile.databaseName.trim()
          : defaultDbName;
      if (legacyUri) {
        const externalClient = await connectToExternalDatabase(legacyUri);
        return externalClient.db(legacyDbName);
      }
    }
  } catch (error) {
    console.warn(
      `[db] Falling back to default cluster for tenant "${cleanTenantId}" due to resolver error.`,
      error,
    );
  }

  return defaultClient.db(defaultDbName);
}
