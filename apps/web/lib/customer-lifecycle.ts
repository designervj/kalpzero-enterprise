import type { Db } from 'mongodb';

type CustomerSignal = {
    customerId?: string;
    id?: string;
    _id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    source?: string;
};

type CustomerDocument = {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    source?: string;
    createdAt?: Date | string;
    lifecycle?: {
        firstSeenAt?: Date | string;
        lastSeenAt?: Date | string;
        totalOrders?: number;
        totalInvoices?: number;
        totalBookings?: number;
    };
};

export interface ResolvedCustomerIdentity {
    customerId: string;
    customer: {
        name: string;
        email: string;
        phone: string;
    };
    created: boolean;
}

interface EnsureCustomerOptions {
    createIfMissing?: boolean;
    fallbackSource?: string;
}

function normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value: unknown): string {
    return normalizeString(value).toLowerCase();
}

function normalizePhone(value: unknown): string {
    return normalizeString(value);
}

function normalizeName(value: unknown): string {
    return normalizeString(value);
}

function createCustomerId(prefix = 'cus'): string {
    return `${Date.now()}-${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseDate(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
}

function mapSignal(input: unknown): CustomerSignal {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    const raw = input as Record<string, unknown>;
    const nestedCustomer = raw.customer && typeof raw.customer === 'object'
        ? raw.customer as Record<string, unknown>
        : null;

    return {
        customerId:
            normalizeString(raw.customerId)
            || normalizeString(raw.id)
            || normalizeString(raw._id)
            || normalizeString(nestedCustomer?.customerId)
            || normalizeString(nestedCustomer?.id)
            || normalizeString(nestedCustomer?._id),
        id: normalizeString(raw.id),
        _id: normalizeString(raw._id),
        name:
            normalizeName(raw.name)
            || normalizeName(raw.fullName)
            || normalizeName(raw.customerName)
            || normalizeName(nestedCustomer?.name)
            || normalizeName(nestedCustomer?.fullName),
        fullName: normalizeName(raw.fullName) || normalizeName(raw.name) || normalizeName(nestedCustomer?.fullName),
        email: normalizeEmail(raw.email) || normalizeEmail(raw.customerEmail) || normalizeEmail(nestedCustomer?.email),
        phone: normalizePhone(raw.phone) || normalizePhone(raw.customerPhone) || normalizePhone(nestedCustomer?.phone),
        source: normalizeString(raw.source),
    };
}

async function findCustomerBySignal(db: Db, signal: CustomerSignal): Promise<CustomerDocument | null> {
    const customersCol = db.collection<CustomerDocument>('customers');
    const directId = normalizeString(signal.customerId || signal.id || signal._id);
    if (directId) {
        const direct = await customersCol.findOne({ _id: directId });
        if (direct) return direct;
    }

    if (signal.email) {
        const byEmail = await customersCol.findOne({ email: signal.email });
        if (byEmail) return byEmail;
    }

    if (signal.phone) {
        const byPhone = await customersCol.findOne({ phone: signal.phone });
        if (byPhone) return byPhone;
    }

    const candidateName = signal.fullName || signal.name || '';
    if (candidateName) {
        const escaped = candidateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const byName = await customersCol.findOne({ fullName: { $regex: `^${escaped}$`, $options: 'i' } });
        if (byName) return byName;
    }

    return null;
}

function buildLinkedRecordOrFilters(customer: CustomerDocument): Array<Record<string, unknown>> {
    const filters: Array<Record<string, unknown>> = [];
    const id = normalizeString(customer._id);
    const email = normalizeEmail(customer.email);
    const phone = normalizePhone(customer.phone);
    const name = normalizeName(customer.fullName);

    if (id) {
        filters.push(
            { customerId: id },
            { 'customerId.value': id },
            { 'customer.customerId': id },
            { 'customer.id': id },
            { 'customer._id': id }
        );
    }
    if (email) {
        filters.push(
            { customerEmail: email },
            { 'customer.email': email }
        );
    }
    if (phone) {
        filters.push(
            { customerPhone: phone },
            { 'customer.phone': phone }
        );
    }
    if (name) {
        filters.push(
            { customerName: name },
            { 'customer.name': name },
            { 'customer.fullName': name }
        );
    }

    const unique = new Map<string, Record<string, unknown>>();
    for (const filter of filters) {
        const key = JSON.stringify(filter);
        if (!unique.has(key)) unique.set(key, filter);
    }
    return Array.from(unique.values());
}

async function getCollectionStats(
    db: Db,
    collectionName: string,
    customer: CustomerDocument
): Promise<{ count: number; firstSeen: Date | null; lastSeen: Date | null }> {
    const orFilters = buildLinkedRecordOrFilters(customer);
    if (orFilters.length === 0) {
        return { count: 0, firstSeen: null, lastSeen: null };
    }

    const collection = db.collection(collectionName);
    const query = orFilters.length === 1 ? orFilters[0] : { $or: orFilters };

    const [count, firstDoc, lastDoc] = await Promise.all([
        collection.countDocuments(query),
        collection.find(query, { projection: { createdAt: 1 } }).sort({ createdAt: 1 }).limit(1).next(),
        collection.find(query, { projection: { createdAt: 1 } }).sort({ createdAt: -1 }).limit(1).next(),
    ]);

    return {
        count,
        firstSeen: parseDate(firstDoc?.createdAt),
        lastSeen: parseDate(lastDoc?.createdAt),
    };
}

export async function findCustomerIdBySignal(db: Db, input: unknown): Promise<string | null> {
    const signal = mapSignal(input);
    const customer = await findCustomerBySignal(db, signal);
    return customer?._id || null;
}

export async function ensureCustomerIdentity(
    db: Db,
    input: unknown,
    actorId?: string,
    options: EnsureCustomerOptions = {}
): Promise<ResolvedCustomerIdentity | null> {
    const { createIfMissing = true, fallbackSource = 'system' } = options;
    const signal = mapSignal(input);
    const name = signal.fullName || signal.name || '';
    const email = signal.email || '';
    const phone = signal.phone || '';
    const source = signal.source || fallbackSource;

    if (!name && !email && !phone && !signal.customerId) return null;

    const customersCol = db.collection<CustomerDocument>('customers');
    let existing = await findCustomerBySignal(db, signal);
    let created = false;
    if (!existing && !createIfMissing) return null;

    const now = new Date();
    if (!existing) {
        const requestedId = normalizeString(signal.customerId || signal.id || signal._id);
        const customerId = requestedId || createCustomerId('cus');
        const doc: CustomerDocument = {
            _id: customerId,
            fullName: name,
            email,
            phone,
            source,
            lifecycle: {
                firstSeenAt: now,
                lastSeenAt: now,
                totalOrders: 0,
                totalInvoices: 0,
                totalBookings: 0,
            },
            createdAt: now,
        };

        const writeResult = await customersCol.updateOne(
            { _id: customerId },
            {
                $setOnInsert: {
                    ...doc,
                    status: 'active',
                    tags: [],
                    createdBy: actorId || 'system',
                },
                $set: {
                    updatedAt: now,
                    updatedBy: actorId || 'system',
                },
            },
            { upsert: true }
        );
        created = writeResult.upsertedCount > 0;

        existing = await customersCol.findOne({ _id: customerId });
    } else {
        const patch: Record<string, unknown> = {
            updatedAt: now,
            updatedBy: actorId || 'system',
        };

        if (!normalizeString(existing.fullName) && name) patch.fullName = name;
        if (!normalizeString(existing.email) && email) patch.email = email;
        if (!normalizeString(existing.phone) && phone) patch.phone = phone;
        if (!normalizeString(existing.source) && source) patch.source = source;

        if (Object.keys(patch).length > 2) {
            await customersCol.updateOne({ _id: existing._id }, { $set: patch });
            existing = await customersCol.findOne({ _id: existing._id });
        }
    }

    if (!existing) return null;

    return {
        customerId: existing._id,
        customer: {
            name: normalizeName(existing.fullName) || name,
            email: normalizeEmail(existing.email) || email,
            phone: normalizePhone(existing.phone) || phone,
        },
        created,
    };
}

export function buildCustomerReferencePatch(identity: ResolvedCustomerIdentity): Record<string, unknown> {
    const normalizedName = normalizeName(identity.customer.name);
    const normalizedEmail = normalizeEmail(identity.customer.email);
    const normalizedPhone = normalizePhone(identity.customer.phone);

    return {
        customerId: identity.customerId,
        customerName: normalizedName,
        customerEmail: normalizedEmail,
        customerPhone: normalizedPhone,
        customer: {
            customerId: identity.customerId,
            id: identity.customerId,
            _id: identity.customerId,
            name: normalizedName,
            fullName: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
        },
    };
}

export async function recomputeCustomerLifecycleBatch(
    db: Db,
    customerIds: Array<string | null | undefined>,
    actorId?: string
): Promise<void> {
    const uniqueIds = Array.from(
        new Set(
            customerIds
                .map((entry) => normalizeString(entry))
                .filter(Boolean)
        )
    );

    for (const customerId of uniqueIds) {
        await recomputeCustomerLifecycle(db, customerId, actorId);
    }
}

export async function recomputeCustomerLifecycle(
    db: Db,
    customerId: string,
    actorId?: string
): Promise<void> {
    const normalizedId = normalizeString(customerId);
    if (!normalizedId) return;

    const customersCol = db.collection<CustomerDocument>('customers');
    const customer = await customersCol.findOne({ _id: normalizedId });
    if (!customer) return;

    const [orderStats, invoiceStats, bookingStats] = await Promise.all([
        getCollectionStats(db, 'orders', customer),
        getCollectionStats(db, 'invoices', customer),
        getCollectionStats(db, 'bookings', customer),
    ]);

    const firstCandidates = [
        orderStats.firstSeen,
        invoiceStats.firstSeen,
        bookingStats.firstSeen,
        parseDate(customer.lifecycle?.firstSeenAt),
        parseDate(customer.createdAt),
    ].filter((entry): entry is Date => entry instanceof Date);
    const lastCandidates = [
        orderStats.lastSeen,
        invoiceStats.lastSeen,
        bookingStats.lastSeen,
        parseDate(customer.lifecycle?.lastSeenAt),
    ].filter((entry): entry is Date => entry instanceof Date);

    const firstSeenAt = firstCandidates.length > 0
        ? new Date(Math.min(...firstCandidates.map(entry => entry.getTime())))
        : new Date();
    const lastSeenAt = lastCandidates.length > 0
        ? new Date(Math.max(...lastCandidates.map(entry => entry.getTime())))
        : firstSeenAt;

    await customersCol.updateOne(
        { _id: normalizedId },
        {
            $set: {
                lifecycle: {
                    firstSeenAt,
                    lastSeenAt,
                    totalOrders: orderStats.count,
                    totalInvoices: invoiceStats.count,
                    totalBookings: bookingStats.count,
                },
                updatedAt: new Date(),
                updatedBy: actorId || 'system',
            },
        }
    );
}
