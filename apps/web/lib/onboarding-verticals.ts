import { normalizeModuleList } from "@/lib/module-rules";

export type SupportedOnboardingVerticalPack = "commerce" | "hotel";
export type CandidateOnboardingDomain =
  | SupportedOnboardingVerticalPack
  | "travel"
  | "unsupported";

export interface OnboardingVerticalResolution {
  status: "pending" | "supported" | "unsupported" | "conflict";
  verticalPack: SupportedOnboardingVerticalPack | null;
  primaryBusinessType: string | null;
  businessDomains: CandidateOnboardingDomain[];
  message: string | null;
}

type BusinessTypeLike =
  | string
  | {
      key?: unknown;
      name?: unknown;
      type?: unknown;
      description?: unknown;
      businessContexts?: unknown;
      enabledModules?: unknown;
    };

const COMMERCE_KEYWORDS = [
  "apparel",
  "beauty retail",
  "catalog",
  "commerce",
  "cosmetic",
  "d2c",
  "ecommerce",
  "e-commerce",
  "fashion",
  "furniture",
  "inventory",
  "medicine product",
  "pharmacy",
  "product",
  "retail",
  "shop",
  "shopping",
  "skincare retail",
  "store",
  "supplement",
];

const HOTEL_KEYWORDS = [
  "banquet",
  "dining",
  "guest house",
  "guesthouse",
  "homestay",
  "hostel",
  "hospitality",
  "hotel",
  "lodge",
  "resort",
  "restaurant",
  "room",
  "stay",
  "vacation rental",
  "villa",
];

const TRAVEL_KEYWORDS = [
  "activity experience",
  "adventure",
  "departure",
  "destination",
  "excursion",
  "itinerary",
  "package",
  "tour",
  "travel",
  "trip",
];

const UNSUPPORTED_KEYWORDS = [
  "academy",
  "admission",
  "architect",
  "architecture",
  "brokerage",
  "clinic",
  "college",
  "construction",
  "consultation",
  "consulting",
  "coworking",
  "coworking space",
  "data solutions",
  "development project",
  "diagnostic",
  "doctor",
  "education",
  "engineering",
  "hospital",
  "interior",
  "investment",
  "it services",
  "medical",
  "mep",
  "office",
  "personal portfolio",
  "portfolio",
  "project",
  "property listing",
  "real estate",
  "residential",
  "saas",
  "school",
  "shared space",
  "software",
  "technology",
  "training",
];

function normalizeSignal(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function describeSelectedBusinessType(value: BusinessTypeLike | null | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidates = [value.name, value.key, value.type];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function inferDomainFromBusinessType(
  input: BusinessTypeLike,
): CandidateOnboardingDomain | null {
  const rawSignals =
    typeof input === "string"
      ? [input]
      : [input.name, input.key, input.type, input.description]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const contexts =
    typeof input === "object" && input
      ? normalizeModuleList((input as { businessContexts?: unknown }).businessContexts)
      : [];
  const signal = normalizeSignal([...rawSignals, ...contexts].join(" "));

  if (!signal) {
    return null;
  }

  if (hasKeyword(signal, TRAVEL_KEYWORDS)) {
    return "travel";
  }
  if (hasKeyword(signal, HOTEL_KEYWORDS)) {
    return "hotel";
  }
  if (hasKeyword(signal, COMMERCE_KEYWORDS)) {
    return "commerce";
  }
  if (hasKeyword(signal, UNSUPPORTED_KEYWORDS)) {
    return "unsupported";
  }

  const modules =
    typeof input === "object" && input
      ? normalizeModuleList((input as { enabledModules?: unknown }).enabledModules)
      : [];

  if (modules.includes("tour_management")) {
    return "travel";
  }
  if (modules.includes("hotel_management")) {
    return "hotel";
  }
  if (modules.includes("ecommerce")) {
    return "commerce";
  }

  return null;
}

function inferDomainFromModules(enabledModules: string[]): CandidateOnboardingDomain | null {
  const modules = normalizeModuleList(enabledModules);
  if (modules.includes("tour_management")) {
    return "travel";
  }
  if (modules.includes("hotel_management")) {
    return "hotel";
  }
  if (modules.includes("ecommerce")) {
    return "commerce";
  }
  return null;
}

export function resolveOnboardingVerticalSelection(
  selectedBusinessTypes: BusinessTypeLike[],
  enabledModules: string[],
): OnboardingVerticalResolution {
  const labels = selectedBusinessTypes
    .map((item) => describeSelectedBusinessType(item))
    .filter((value): value is string => Boolean(value));
  const businessDomains = Array.from(
    new Set(
      selectedBusinessTypes
        .map((item) => inferDomainFromBusinessType(item))
        .filter((value): value is CandidateOnboardingDomain => Boolean(value)),
    ),
  );
  const primaryBusinessType = labels[0] ?? null;

  if (businessDomains.includes("travel")) {
    return {
      status: "unsupported",
      verticalPack: null,
      primaryBusinessType,
      businessDomains,
      message:
        "Travel business types are detected, but travel onboarding is not live yet. Use a commerce/ecommerce or hotel business type.",
    };
  }

  const supportedDomains = businessDomains.filter(
    (value): value is SupportedOnboardingVerticalPack =>
      value === "commerce" || value === "hotel",
  );

  if (supportedDomains.length > 1) {
    return {
      status: "conflict",
      verticalPack: null,
      primaryBusinessType,
      businessDomains,
      message:
        "Selected business types span multiple verticals. Choose business types that all belong to the same onboarding vertical.",
    };
  }

  if (businessDomains.includes("unsupported")) {
    return {
      status: "unsupported",
      verticalPack: null,
      primaryBusinessType,
      businessDomains,
      message:
        "Selected business types do not map to the current onboarding pilot. Right now only commerce/ecommerce and hotel businesses can be onboarded here.",
    };
  }

  if (supportedDomains.length === 1) {
    return {
      status: "supported",
      verticalPack: supportedDomains[0],
      primaryBusinessType,
      businessDomains,
      message: null,
    };
  }

  if (labels.length > 0) {
    return {
      status: "unsupported",
      verticalPack: null,
      primaryBusinessType,
      businessDomains,
      message:
        "Selected business types do not map to the current onboarding pilot. Right now only commerce/ecommerce and hotel businesses can be onboarded here.",
    };
  }

  const moduleDomain = inferDomainFromModules(enabledModules);
  if (moduleDomain === "travel") {
    return {
      status: "unsupported",
      verticalPack: null,
      primaryBusinessType,
      businessDomains,
      message:
        "Selected apps point to travel onboarding, but that vertical is not live yet.",
    };
  }
  if (moduleDomain === "commerce" || moduleDomain === "hotel") {
    return {
      status: "supported",
      verticalPack: moduleDomain,
      primaryBusinessType,
      businessDomains,
      message: null,
    };
  }

  return {
    status: labels.length > 0 ? "unsupported" : "pending",
    verticalPack: null,
    primaryBusinessType,
    businessDomains,
    message:
      labels.length > 0
        ? "Select a business type that belongs to the current commerce/ecommerce or hotel onboarding pilot."
        : "Choose a business type so Kalp can resolve the correct onboarding vertical.",
  };
}
