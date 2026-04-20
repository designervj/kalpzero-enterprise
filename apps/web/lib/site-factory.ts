import type {
  AiSiteFactoryBlueprint,
  AiSiteFactoryCatalogBlueprint,
  AiSiteFactoryFaqBlueprint,
  AiSiteFactoryModelsUsed,
  AiSiteFactoryOfferingBlueprint,
  AiSiteFactoryPageBlueprint,
  AiSiteFactoryPageSection,
  AiSiteFactoryTestimonialBlueprint,
} from "@/lib/contracts/ai";
import type { ResolvedAiRuntime } from "@/lib/ai-runtime";
import { KALP_AUTO_SITE_FACTORY } from "@/lib/server-env";

export type SiteFactoryContext = {
  tenantKey: string;
  tenantName: string;
  industry: string;
  businessTypes: string[];
  businessContexts: string[];
  accountType: string;
  enabledModules: string[];
  primaryDomains: string[];
  logoUrl: string;
  ownerEmail: string;
  brief: string;
  brand: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
};

type SiteFactoryTrack = AiSiteFactoryBlueprint["track"];

type ChatJsonRequestOptions = {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
};

type GeneratedImageDraft = {
  alt: string;
  prompt: string;
  mimeType: string;
  base64: string;
  model: string;
};

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeSlug(value: string, fallback: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return normalized || fallback;
}

function toSku(value: string, index: number): string {
  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 18);
  return `${normalized || "ITEM"}-${String(index + 1).padStart(2, "0")}`;
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inferTrack(context: SiteFactoryContext): SiteFactoryTrack {
  const fingerprint = [
    context.accountType,
    context.industry,
    ...context.businessTypes,
    ...context.businessContexts,
    ...context.enabledModules,
  ]
    .join(" ")
    .toLowerCase();

  if (
    /(travel|tour|hotel|hospitality|vacation|itinerary|resort)/.test(
      fingerprint,
    )
  ) {
    return "travel";
  }
  if (
    context.accountType === "personal_portfolio" ||
    /(portfolio|resume|creator|freelancer|photographer|artist|student)/.test(
      fingerprint,
    )
  ) {
    return "portfolio";
  }
  if (
    context.enabledModules.includes("ecommerce") ||
    /(ecommerce|retail|store|shop|fashion|apparel|catalog)/.test(fingerprint)
  ) {
    return "commerce";
  }
  return "business";
}

function defaultPrimaryDomain(context: SiteFactoryContext): string {
  return context.primaryDomains[0] || `${context.tenantKey}.site`;
}

function buildDefaultSections(
  title: string,
  body: string,
  bullets: string[],
): AiSiteFactoryPageSection[] {
  return [
    {
      title,
      body,
      bullets,
    },
  ];
}

function buildFallbackOfferings(
  track: SiteFactoryTrack,
  context: SiteFactoryContext,
): AiSiteFactoryOfferingBlueprint[] {
  const industryLabel = context.industry || "business";
  if (track === "travel") {
    return [
      {
        name: "Royal Rajasthan Escape",
        sku: "TRAVEL-RAJ-01",
        type: "service",
        category: "Packages",
        price: 24999,
        description:
          "A curated Rajasthan itinerary with stays, transfers, and guided local experiences.",
      },
      {
        name: "Weekend Heritage Stay",
        sku: "TRAVEL-STAY-02",
        type: "service",
        category: "Stays",
        price: 12999,
        description:
          "Short-stay package for premium hotel experiences, breakfast, and concierge support.",
      },
      {
        name: "Adventure Activity Pass",
        sku: "TRAVEL-ACT-03",
        type: "service",
        category: "Activities",
        price: 6999,
        description:
          "Bundled activities, transfers, and add-on support for experience-led travelers.",
      },
      {
        name: "Custom Group Tour Planning",
        sku: "TRAVEL-GRP-04",
        type: "service",
        category: "Tours",
        price: 39999,
        description:
          "Private itinerary design for families, schools, or corporate groups.",
      },
    ];
  }

  if (track === "commerce") {
    return [
      {
        name: `${context.tenantName} Signature Collection`,
        sku: "SHOP-SIG-01",
        type: "physical",
        category: "Featured",
        price: 1999,
        description: `Flagship ${industryLabel.toLowerCase()} item crafted as the hero product for your storefront.`,
      },
      {
        name: "Best Seller Bundle",
        sku: "SHOP-BND-02",
        type: "physical",
        category: "Bundles",
        price: 3499,
        description:
          "Bundled offer designed to improve conversion and average order value.",
      },
      {
        name: "Seasonal Drop",
        sku: "SHOP-SEA-03",
        type: "physical",
        category: "Seasonal",
        price: 2499,
        description:
          "Limited run product concept for campaigns and launch announcements.",
      },
      {
        name: "Premium Edition",
        sku: "SHOP-PRM-04",
        type: "physical",
        category: "Premium",
        price: 4999,
        description:
          "Higher-end version with stronger margins and premium positioning.",
      },
    ];
  }

  return [
    {
      name: "Strategy Consultation",
      sku: "SERVICE-STR-01",
      type: "service",
      category: "Consulting",
      price: 4999,
      description:
        "Discovery-led consulting session to understand goals, constraints, and next steps.",
    },
    {
      name: "Implementation Package",
      sku: "SERVICE-IMP-02",
      type: "service",
      category: "Delivery",
      price: 14999,
      description:
        "Execution package that turns the approved plan into a delivered outcome.",
    },
    {
      name: "Ongoing Support Plan",
      sku: "SERVICE-SUP-03",
      type: "service",
      category: "Support",
      price: 7999,
      description:
        "Retainer-style support for maintenance, optimization, and reporting.",
    },
    {
      name: `${context.tenantName} Premium Service`,
      sku: "SERVICE-PRM-04",
      type: "service",
      category: "Premium",
      price: 19999,
      description:
        "Premium engagement offering tailored for clients who need higher-touch delivery.",
    },
  ];
}

function buildFallbackSecondaryPages(
  track: SiteFactoryTrack,
  context: SiteFactoryContext,
): AiSiteFactoryPageBlueprint[] {
  const offeringWord =
    track === "travel"
      ? "Packages"
      : track === "commerce"
        ? "Products"
        : "Services";

  return [
    {
      slug: "about",
      title: "About",
      type: "about",
      heroTitle: `About ${context.tenantName}`,
      heroSubtitle: `Learn how ${context.tenantName} helps clients in ${context.industry || "its industry"} with a clear delivery process and dependable results.`,
      sections: buildDefaultSections(
        "Built around clarity and execution",
        `${context.tenantName} combines domain understanding with structured delivery so every engagement moves from inquiry to action without confusion.`,
        [
          "Clear positioning for your audience",
          "Operationally structured delivery",
          "Consistent communication and support",
        ],
      ),
      primaryCtaLabel: "Talk to our team",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: `View ${offeringWord}`,
      secondaryCtaHref: `/${normalizeSlug(offeringWord, "offerings")}`,
      metaDescription: `About ${context.tenantName} and how the business delivers value.`,
      keywords: ["about", context.tenantName, context.industry || "business"],
    },
    {
      slug: normalizeSlug(
        track === "commerce"
          ? "products"
          : track === "travel"
            ? "packages"
            : "services",
        "offerings",
      ),
      title: offeringWord,
      type: track === "commerce" ? "landing" : "page",
      heroTitle: `${offeringWord} designed for real client needs`,
      heroSubtitle:
        track === "travel"
          ? "Browse curated travel-ready experiences, stays, and support formats."
          : track === "commerce"
            ? "Explore the core catalog your storefront can launch with immediately."
            : "Review the service stack that can be packaged, priced, and sold from the website.",
      sections: buildDefaultSections(
        `What we offer`,
        `This page presents the core ${offeringWord.toLowerCase()} for ${context.tenantName}, written for quick decision-making and strong conversion.`,
        [
          "Clear scope and delivery framing",
          "Structured pricing anchors",
          "Call-to-action ready layout",
        ],
      ),
      primaryCtaLabel: track === "commerce" ? "Start shopping" : "Request details",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "Read about us",
      secondaryCtaHref: "/about",
      metaDescription: `${offeringWord} available from ${context.tenantName}.`,
      keywords: [offeringWord.toLowerCase(), context.tenantName, context.industry || "business"],
    },
    {
      slug: "contact",
      title: "Contact",
      type: "contact",
      heroTitle: `Start with ${context.tenantName}`,
      heroSubtitle:
        context.ownerEmail
          ? `Share your requirement and the team can respond at ${context.ownerEmail}.`
          : "Share your requirement and the team can respond with the right next step.",
      sections: buildDefaultSections(
        "How to begin",
        "Use this page to collect the highest-quality inquiries and route them into your sales or support workflow.",
        [
          "Short contact form with qualification fields",
          "Fast CTA for WhatsApp, call, or email",
          "Domain and trust details for confidence",
        ],
      ),
      primaryCtaLabel: "Send inquiry",
      primaryCtaHref: "#contact-form",
      secondaryCtaLabel: "Return home",
      secondaryCtaHref: "/home",
      metaDescription: `Contact ${context.tenantName} for inquiries, planning, or bookings.`,
      keywords: ["contact", context.tenantName, context.industry || "business"],
    },
  ];
}

function buildFallbackFaqs(track: SiteFactoryTrack): AiSiteFactoryFaqBlueprint[] {
  if (track === "travel") {
    return [
      {
        question: "Can packages be customized?",
        answer:
          "Yes. Dates, duration, hotel preferences, and activity mix can be adjusted before confirmation.",
      },
      {
        question: "Do you support group tours?",
        answer:
          "Yes. Group itineraries, corporate trips, and family travel plans can be structured separately.",
      },
      {
        question: "How do payments and confirmations work?",
        answer:
          "You can define advance payment terms, balance collection, and booking confirmation inside the admin workflow.",
      },
    ];
  }

  if (track === "commerce") {
    return [
      {
        question: "Can the catalog be updated later?",
        answer:
          "Yes. Products, pricing, descriptions, and images can all be updated from the admin panel.",
      },
      {
        question: "Can I launch with draft products first?",
        answer:
          "Yes. The AI generator can create starter draft items so you can refine them before going live.",
      },
      {
        question: "Will this support future campaigns?",
        answer:
          "Yes. The structure is built so you can add banners, seasonal drops, and promotional landing pages later.",
      },
    ];
  }

  return [
    {
      question: "Can I edit the AI-generated website later?",
      answer:
        "Yes. The generated pages are meant to be reviewed and refined in the builders after creation.",
    },
    {
      question: "Can I add more offerings later?",
      answer:
        "Yes. Products, services, packages, and supporting pages can be added manually at any time.",
    },
    {
      question: "Is the generated content final?",
      answer:
        "No. Treat it as a strong first draft that accelerates launch and reduces manual setup time.",
    },
  ];
}

function buildFallbackTestimonials(
  context: SiteFactoryContext,
): AiSiteFactoryTestimonialBlueprint[] {
  return [
    {
      quote: `${context.tenantName} made the experience clear, responsive, and easy to move forward with.`,
      author: "Early Client Story",
    },
    {
      quote:
        "The presentation felt professional and the next steps were obvious from the first visit.",
      author: "Website Visitor Insight",
    },
    {
      quote:
        "The offer structure and clarity of information helped us take a decision much faster.",
      author: "Buyer Feedback",
    },
  ];
}

function buildFallbackBlueprint(
  context: SiteFactoryContext,
): AiSiteFactoryBlueprint {
  const track = inferTrack(context);
  const offeringWord =
    track === "travel"
      ? "journey"
      : track === "commerce"
        ? "catalog"
        : track === "portfolio"
          ? "portfolio"
          : "service";

  const offerings = buildFallbackOfferings(track, context);
  const homepage: AiSiteFactoryPageBlueprint = {
    slug: "home",
    title: "Home",
    type: "landing",
    heroTitle:
      track === "travel"
        ? `Plan your next trip with ${context.tenantName}`
        : track === "commerce"
          ? `Launch your ${context.tenantName} ${offeringWord} online`
          : `Grow with ${context.tenantName}`,
    heroSubtitle:
      context.brief ||
      `${context.tenantName} helps clients in ${context.industry || "its industry"} with a clearer offer, stronger website presence, and an easier path to conversion.`,
    sections: [
      {
        title: "Why choose us",
        body: `${context.tenantName} is positioned to communicate value clearly, showcase the right ${offeringWord}s, and route inquiries into action.`,
        bullets: [
          "Clear brand-led messaging",
          "Builder-ready pages that can be edited visually",
          "Conversion-focused content structure",
        ],
      },
      {
        title: "What gets launched",
        body:
          "This AI-first setup creates the essential website and starter business data so the team can review instead of building from zero.",
        bullets: [
          "Homepage and supporting pages",
          "Starter offerings for the catalog",
          "Draft catalog artifact for publication flows",
        ],
      },
    ],
    primaryCtaLabel: track === "commerce" ? "Browse catalog" : "Start now",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "Learn more",
    secondaryCtaHref: "/about",
    metaDescription: `${context.tenantName} official website for ${context.industry || "business"} enquiries, offerings, and contact.`,
    keywords: [context.tenantName, context.industry || "business", offeringWord],
    isHomepage: true,
  };

  return {
    summary: `${context.tenantName} launch blueprint for ${context.industry || "business"} using the ${track} content track.`,
    track,
    homepage,
    secondaryPages: buildFallbackSecondaryPages(track, context),
    offerings,
    testimonials: buildFallbackTestimonials(context),
    faqs: buildFallbackFaqs(track),
    catalog:
      context.enabledModules.includes("products") ||
      context.enabledModules.includes("ecommerce")
        ? {
            title: `${context.tenantName} Catalog`,
            slug: "catalog",
            intro: `A starter ${offeringWord} catalog for ${context.tenantName}.`,
            metaDescription: `Catalog for ${context.tenantName}.`,
          }
        : null,
    notes: [
      "AI fallback blueprint was used.",
      "Review generated copy before publishing broadly.",
    ],
  };
}

function parseJsonObject(value: string): Record<string, unknown> {
  const trimmed = value.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("AI response did not contain valid JSON.");
  }
}

function mergeNotes(...noteGroups: Array<string[] | undefined>): string[] {
  return Array.from(
    new Set(
      noteGroups
        .flatMap((group) => group || [])
        .map((note) => normalizeString(note))
        .filter(Boolean),
    ),
  );
}

async function requestStructuredChatJson(
  options: ChatJsonRequestOptions,
): Promise<Record<string, unknown>> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      temperature: options.temperature ?? 0.35,
      max_tokens: options.maxTokens ?? 2600,
      messages: [
        {
          role: "system",
          content: options.systemPrompt,
        },
        {
          role: "user",
          content: options.userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "OpenAI structured request failed.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parseJsonObject(payload.choices?.[0]?.message?.content || "");
}

async function generateHeroImageDraft(input: {
  apiKey: string;
  model: string;
  context: SiteFactoryContext;
  blueprint: AiSiteFactoryBlueprint;
}): Promise<GeneratedImageDraft | null> {
  const { apiKey, model, context, blueprint } = input;
  if (!apiKey || !model) return null;

  const prompt = [
    "Create a premium website hero image for a business homepage.",
    `Business: ${context.tenantName}`,
    `Industry: ${context.industry || blueprint.track}`,
    `Track: ${blueprint.track}`,
    `Headline: ${blueprint.homepage.heroTitle}`,
    `Supporting copy: ${blueprint.homepage.heroSubtitle}`,
    "Style: modern, brand-safe, commercially polished, cinematic lighting, no embedded text, no watermarks.",
    "Composition: wide hero banner, clean focal point, suitable for website landing section.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1536x1024",
      quality: "high",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "OpenAI image generation failed.");
  }

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const base64 = payload.data?.[0]?.b64_json || "";
  if (!base64) return null;

  return {
    alt: `${context.tenantName} homepage hero visual`,
    prompt,
    mimeType: "image/png",
    base64,
    model,
  };
}

function normalizeSection(value: unknown): AiSiteFactoryPageSection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const title = normalizeString(row.title);
  const body = normalizeString(row.body);
  if (!title && !body) return null;
  return {
    title: title || "Section",
    body,
    bullets: normalizeStringArray(row.bullets).slice(0, 6),
  };
}

function normalizePage(
  value: unknown,
  fallbackSlug: string,
  fallbackTitle: string,
  type = "page",
): AiSiteFactoryPageBlueprint {
  const row =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const slug = normalizeSlug(normalizeString(row.slug), fallbackSlug);
  const title = normalizeString(row.title) || fallbackTitle;
  const sections = Array.isArray(row.sections)
    ? row.sections
        .map(normalizeSection)
        .filter((item): item is AiSiteFactoryPageSection => Boolean(item))
        .slice(0, 6)
    : [];

  return {
    slug,
    title,
    type: normalizeString(row.type) || type,
    heroTitle: normalizeString(row.heroTitle) || title,
    heroSubtitle: normalizeString(row.heroSubtitle),
    heroImageUrl: normalizeString(row.heroImageUrl) || undefined,
    heroImageAlt: normalizeString(row.heroImageAlt) || undefined,
    sections:
      sections.length > 0
        ? sections
        : buildDefaultSections(
            title,
            normalizeString(row.heroSubtitle) || `${title} content for the website.`,
            [],
          ),
    primaryCtaLabel: normalizeString(row.primaryCtaLabel) || "Get started",
    primaryCtaHref: normalizeString(row.primaryCtaHref) || "/contact",
    secondaryCtaLabel: normalizeString(row.secondaryCtaLabel) || "",
    secondaryCtaHref: normalizeString(row.secondaryCtaHref) || "",
    metaDescription:
      normalizeString(row.metaDescription) ||
      normalizeString(row.heroSubtitle) ||
      `${title} page`,
    keywords: normalizeStringArray(row.keywords).slice(0, 8),
    isHomepage: row.isHomepage === true,
  };
}

function normalizeOfferings(
  value: unknown,
  fallback: AiSiteFactoryOfferingBlueprint[],
): AiSiteFactoryOfferingBlueprint[] {
  if (!Array.isArray(value)) return fallback;

  const items = value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      const name = normalizeString(row.name);
      if (!name) return null;
      return {
        name,
        sku: normalizeString(row.sku) || toSku(name, index),
        type: normalizeString(row.type) || "service",
        category: normalizeString(row.category) || "General",
        price:
          typeof row.price === "number" && Number.isFinite(row.price)
            ? row.price
            : Number(row.price || 0) || 0,
        description:
          normalizeString(row.description) ||
          `${name} for ${normalizeString(row.category) || "general use"}.`,
      } satisfies AiSiteFactoryOfferingBlueprint;
    })
    .filter(
      (item): item is AiSiteFactoryOfferingBlueprint => Boolean(item),
    );

  return items.length > 0 ? items.slice(0, 8) : fallback;
}

function normalizeFaqs(
  value: unknown,
  fallback: AiSiteFactoryFaqBlueprint[],
): AiSiteFactoryFaqBlueprint[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      const question = normalizeString(row.question);
      const answer = normalizeString(row.answer);
      if (!question || !answer) return null;
      return { question, answer } satisfies AiSiteFactoryFaqBlueprint;
    })
    .filter((item): item is AiSiteFactoryFaqBlueprint => Boolean(item));
  return items.length > 0 ? items.slice(0, 8) : fallback;
}

function normalizeTestimonials(
  value: unknown,
  fallback: AiSiteFactoryTestimonialBlueprint[],
): AiSiteFactoryTestimonialBlueprint[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      const quote = normalizeString(row.quote);
      const author = normalizeString(row.author);
      if (!quote || !author) return null;
      return { quote, author } satisfies AiSiteFactoryTestimonialBlueprint;
    })
    .filter(
      (item): item is AiSiteFactoryTestimonialBlueprint => Boolean(item),
    );
  return items.length > 0 ? items.slice(0, 6) : fallback;
}

function normalizeCatalog(
  value: unknown,
  fallback: AiSiteFactoryCatalogBlueprint | null,
): AiSiteFactoryCatalogBlueprint | null {
  if (!fallback) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const row = value as Record<string, unknown>;
  return {
    title: normalizeString(row.title) || fallback.title,
    slug: normalizeSlug(normalizeString(row.slug), fallback.slug),
    intro: normalizeString(row.intro) || fallback.intro,
    metaDescription:
      normalizeString(row.metaDescription) || fallback.metaDescription,
  };
}

function normalizeBlueprint(
  raw: Record<string, unknown>,
  context: SiteFactoryContext,
): AiSiteFactoryBlueprint {
  const fallback = buildFallbackBlueprint(context);
  const trackValue = normalizeString(raw.track);
  const track: SiteFactoryTrack =
    trackValue === "travel" ||
    trackValue === "commerce" ||
    trackValue === "portfolio" ||
    trackValue === "business"
      ? trackValue
      : fallback.track;

  const homepage = normalizePage(
    raw.homepage,
    fallback.homepage.slug,
    fallback.homepage.title,
    fallback.homepage.type,
  );
  homepage.isHomepage = true;

  const secondaryPagesInput = Array.isArray(raw.secondaryPages)
    ? raw.secondaryPages
    : [];
  const usedSlugs = new Set([homepage.slug]);
  const secondaryPages = secondaryPagesInput
    .map((item, index) =>
      normalizePage(
        item,
        fallback.secondaryPages[index]?.slug || `page-${index + 1}`,
        fallback.secondaryPages[index]?.title || `Page ${index + 1}`,
      ),
    )
    .filter((page) => {
      if (usedSlugs.has(page.slug)) return false;
      usedSlugs.add(page.slug);
      return true;
    });

  return {
    summary: normalizeString(raw.summary) || fallback.summary,
    track,
    homepage,
    secondaryPages:
      secondaryPages.length > 0 ? secondaryPages.slice(0, 5) : fallback.secondaryPages,
    offerings: normalizeOfferings(raw.offerings, fallback.offerings),
    testimonials: normalizeTestimonials(raw.testimonials, fallback.testimonials),
    faqs: normalizeFaqs(raw.faqs, fallback.faqs),
    catalog: normalizeCatalog(raw.catalog, fallback.catalog || null),
    notes: normalizeStringArray(raw.notes).slice(0, 8),
  };
}

function buildAiPrompt(context: SiteFactoryContext): string {
  return [
    "Generate a business website launch blueprint for KalpTree.",
    "Return JSON only. No markdown. No code fences.",
    "Keep copy specific, realistic, and commercially useful.",
    "Avoid fake certifications, fake awards, or impossible metrics.",
    "If details are missing, make reasonable startup-friendly assumptions.",
    "Create:",
    "- 1 homepage",
    "- 3 supporting pages",
    "- 4 to 6 offerings",
    "- 3 testimonials",
    "- 3 to 5 FAQs",
    "- optional catalog metadata if products/ecommerce modules are enabled",
    "Use this exact JSON shape:",
    JSON.stringify(
      {
        summary: "string",
        track: "business | commerce | travel | portfolio",
        homepage: {
          slug: "home",
          title: "Home",
          type: "landing",
          heroTitle: "string",
          heroSubtitle: "string",
          primaryCtaLabel: "string",
          primaryCtaHref: "/contact",
          secondaryCtaLabel: "string",
          secondaryCtaHref: "/about",
          metaDescription: "string",
          keywords: ["string"],
          isHomepage: true,
          sections: [
            { title: "string", body: "string", bullets: ["string"] },
          ],
        },
        secondaryPages: [
          {
            slug: "about",
            title: "About",
            type: "page",
            heroTitle: "string",
            heroSubtitle: "string",
            primaryCtaLabel: "string",
            primaryCtaHref: "/contact",
            secondaryCtaLabel: "string",
            secondaryCtaHref: "/home",
            metaDescription: "string",
            keywords: ["string"],
            sections: [
              { title: "string", body: "string", bullets: ["string"] },
            ],
          },
        ],
        offerings: [
          {
            name: "string",
            sku: "string",
            type: "service",
            category: "string",
            price: 1999,
            description: "string",
          },
        ],
        testimonials: [{ quote: "string", author: "string" }],
        faqs: [{ question: "string", answer: "string" }],
        catalog: {
          title: "string",
          slug: "catalog",
          intro: "string",
          metaDescription: "string",
        },
        notes: ["string"],
      },
      null,
      2,
    ),
    "Tenant context:",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

function buildContentRefinePrompt(
  context: SiteFactoryContext,
  blueprint: AiSiteFactoryBlueprint,
): string {
  return [
    "Refine the website copy for this KalpTree blueprint.",
    "Return JSON only. No markdown. No code fences.",
    "Preserve page slugs, page count, track, and CTA href structure.",
    "Improve headline clarity, hero subtitles, section copy, FAQs, testimonials, and note strings.",
    "Do not invent fake claims, awards, certifications, or impossible numbers.",
    "Keep offerings and catalog consistent with the provided blueprint.",
    "Use this JSON shape:",
    JSON.stringify(blueprint, null, 2),
    "Tenant context:",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

function buildOfferingsRefinePrompt(
  context: SiteFactoryContext,
  offerings: AiSiteFactoryOfferingBlueprint[],
): string {
  return [
    "Refine these starter business offerings for KalpTree.",
    "Return JSON only. No markdown. No code fences.",
    "Keep the same number of offerings and preserve each SKU.",
    "Improve names, categories, descriptions, type, and startup-friendly pricing realism.",
    "Do not invent inventory counts, reviews, or fake certifications.",
    "Use this exact JSON shape:",
    JSON.stringify({ offerings }, null, 2),
    "Tenant context:",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

function applyContentRefinement(
  base: AiSiteFactoryBlueprint,
  refined: AiSiteFactoryBlueprint,
): AiSiteFactoryBlueprint {
  return {
    ...base,
    summary: refined.summary || base.summary,
    homepage: {
      ...base.homepage,
      ...refined.homepage,
    },
    secondaryPages:
      refined.secondaryPages.length > 0
        ? refined.secondaryPages
        : base.secondaryPages,
    testimonials:
      refined.testimonials.length > 0
        ? refined.testimonials
        : base.testimonials,
    faqs: refined.faqs.length > 0 ? refined.faqs : base.faqs,
    catalog: refined.catalog || base.catalog,
    notes: mergeNotes(base.notes, refined.notes),
  };
}

export async function generateSiteFactoryBlueprint(input: {
  context: SiteFactoryContext;
  aiRuntime: ResolvedAiRuntime;
}): Promise<{
  blueprint: AiSiteFactoryBlueprint;
  source: "openai" | "fallback";
  model: string;
  modelsUsed: AiSiteFactoryModelsUsed;
  heroImage: GeneratedImageDraft | null;
  error?: string;
}> {
  const { context, aiRuntime } = input;
  const fallback = buildFallbackBlueprint(context);
  const modelsUsed: AiSiteFactoryModelsUsed = {
    planner: aiRuntime.sitePlannerModel,
    content: aiRuntime.siteContentModel,
    products: aiRuntime.productGenerationModel,
    image: aiRuntime.imageModel,
  };

  if (!KALP_AUTO_SITE_FACTORY || !aiRuntime.apiKey) {
    return {
      blueprint: fallback,
      source: "fallback",
      model: aiRuntime.sitePlannerModel,
      modelsUsed,
      heroImage: null,
    };
  }

  try {
    const parsed = await requestStructuredChatJson({
      apiKey: aiRuntime.apiKey,
      model: aiRuntime.sitePlannerModel,
      systemPrompt:
        "You are a website launch planner for KalpTree. Return valid JSON only.",
      userPrompt: buildAiPrompt(context),
      temperature: 0.4,
      maxTokens: 2600,
    });
    let blueprint = normalizeBlueprint(parsed, context);
    const warnings: string[] = [];

    try {
      const refinedContentRaw = await requestStructuredChatJson({
        apiKey: aiRuntime.apiKey,
        model: aiRuntime.siteContentModel,
        systemPrompt:
          "You refine business website copy for KalpTree. Return valid JSON only.",
        userPrompt: buildContentRefinePrompt(context, blueprint),
        temperature: 0.45,
        maxTokens: 2600,
      });
      blueprint = applyContentRefinement(
        blueprint,
        normalizeBlueprint(refinedContentRaw, context),
      );
    } catch (error: unknown) {
      warnings.push(
        `Content refinement skipped: ${
          error instanceof Error ? error.message : "unknown content error"
        }`,
      );
    }

    try {
      const refinedOfferingsRaw = await requestStructuredChatJson({
        apiKey: aiRuntime.apiKey,
        model: aiRuntime.productGenerationModel,
        systemPrompt:
          "You refine starter products and services for KalpTree. Return valid JSON only.",
        userPrompt: buildOfferingsRefinePrompt(context, blueprint.offerings),
        temperature: 0.35,
        maxTokens: 1800,
      });
      blueprint = {
        ...blueprint,
        offerings: normalizeOfferings(
          refinedOfferingsRaw.offerings,
          blueprint.offerings,
        ),
      };
    } catch (error: unknown) {
      warnings.push(
        `Offering refinement skipped: ${
          error instanceof Error ? error.message : "unknown offering error"
        }`,
      );
    }

    let heroImage: GeneratedImageDraft | null = null;
    try {
      heroImage = await generateHeroImageDraft({
        apiKey: aiRuntime.apiKey,
        model: aiRuntime.imageModel,
        context,
        blueprint,
      });
    } catch (error: unknown) {
      warnings.push(
        `Hero image generation skipped: ${
          error instanceof Error ? error.message : "unknown image error"
        }`,
      );
    }

    if (warnings.length > 0) {
      blueprint = {
        ...blueprint,
        notes: mergeNotes(blueprint.notes, warnings),
      };
    }

    return {
      blueprint,
      source: "openai",
      model: aiRuntime.sitePlannerModel,
      modelsUsed,
      heroImage,
      ...(warnings.length > 0 ? { error: warnings.join(" | ") } : {}),
    };
  } catch (error: unknown) {
    return {
      blueprint: fallback,
      source: "fallback",
      model: aiRuntime.sitePlannerModel,
      modelsUsed,
      heroImage: null,
      error:
        error instanceof Error
          ? error.message
          : "AI blueprint generation failed.",
    };
  }
}

function renderLogo(context: SiteFactoryContext): string {
  if (!context.logoUrl) return "";
  return `<img src="${htmlEscape(context.logoUrl)}" alt="${htmlEscape(
    context.tenantName,
  )} logo" class="kt-logo" />`;
}

function renderBullets(items: string[]): string {
  if (items.length === 0) return "";
  return `<ul class="kt-bullets">${items
    .map((item) => `<li>${htmlEscape(item)}</li>`)
    .join("")}</ul>`;
}

function renderOfferingsGrid(offerings: AiSiteFactoryOfferingBlueprint[]): string {
  if (offerings.length === 0) return "";
  return `
    <section class="kt-section">
      <div class="kt-shell">
        <div class="kt-section-heading">
          <span class="kt-chip">Featured Offerings</span>
          <h2>Offerings ready for your workspace</h2>
          <p>These starter items were generated to give your business an immediate launch baseline.</p>
        </div>
        <div class="kt-grid kt-grid-3">
          ${offerings
            .map(
              (item) => `
                <article class="kt-card">
                  <div class="kt-card-meta">${htmlEscape(item.category)}</div>
                  <h3>${htmlEscape(item.name)}</h3>
                  <p>${htmlEscape(item.description)}</p>
                  <div class="kt-price">${item.price > 0 ? `INR ${item.price.toLocaleString()}` : "Custom Quote"}</div>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderTestimonials(
  testimonials: AiSiteFactoryTestimonialBlueprint[],
): string {
  if (testimonials.length === 0) return "";
  return `
    <section class="kt-section kt-section-alt">
      <div class="kt-shell">
        <div class="kt-section-heading">
          <span class="kt-chip">Proof & Trust</span>
          <h2>What your website can communicate</h2>
        </div>
        <div class="kt-grid kt-grid-3">
          ${testimonials
            .map(
              (item) => `
                <article class="kt-card">
                  <p class="kt-quote">"${htmlEscape(item.quote)}"</p>
                  <div class="kt-card-meta">${htmlEscape(item.author)}</div>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderFaqs(faqs: AiSiteFactoryFaqBlueprint[]): string {
  if (faqs.length === 0) return "";
  return `
    <section class="kt-section">
      <div class="kt-shell">
        <div class="kt-section-heading">
          <span class="kt-chip">FAQ</span>
          <h2>Common questions</h2>
        </div>
        <div class="kt-stack">
          ${faqs
            .map(
              (item) => `
                <details class="kt-faq">
                  <summary>${htmlEscape(item.question)}</summary>
                  <p>${htmlEscape(item.answer)}</p>
                </details>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderSections(page: AiSiteFactoryPageBlueprint): string {
  return page.sections
    .map(
      (section) => `
        <section class="kt-section">
          <div class="kt-shell">
            <div class="kt-two-col">
              <div>
                <span class="kt-chip">Section</span>
                <h2>${htmlEscape(section.title)}</h2>
              </div>
              <div>
                <p>${htmlEscape(section.body)}</p>
                ${renderBullets(section.bullets)}
              </div>
            </div>
          </div>
        </section>
      `,
    )
    .join("");
}

export function renderSiteFactoryPageHtml(input: {
  context: SiteFactoryContext;
  page: AiSiteFactoryPageBlueprint;
  offerings?: AiSiteFactoryOfferingBlueprint[];
  testimonials?: AiSiteFactoryTestimonialBlueprint[];
  faqs?: AiSiteFactoryFaqBlueprint[];
}): string {
  const { context, page, offerings = [], testimonials = [], faqs = [] } = input;
  const domain = defaultPrimaryDomain(context);
  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return `
<style>
  :root {
    --kt-primary: ${context.brand.primary};
    --kt-secondary: ${context.brand.secondary};
    --kt-accent: ${context.brand.accent};
    --kt-background: ${context.brand.background};
    --kt-foreground: ${context.brand.foreground};
    --kt-muted: ${context.brand.muted};
    --kt-border: ${context.brand.border};
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: var(--kt-background); color: var(--kt-foreground); }
  .kt-page { background:
      radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 30%),
      radial-gradient(circle at bottom right, rgba(255,255,255,0.04), transparent 30%),
      var(--kt-background); color: var(--kt-foreground); }
  .kt-shell { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
  .kt-header { position: sticky; top: 0; z-index: 10; backdrop-filter: blur(18px); background: rgba(5,11,23,0.72); border-bottom: 1px solid var(--kt-border); }
  .kt-header-inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px 0; }
  .kt-brand { display: flex; align-items: center; gap: 14px; font-weight: 700; letter-spacing: -0.02em; }
  .kt-logo { width: 52px; height: 52px; object-fit: contain; border-radius: 14px; background: rgba(255,255,255,0.05); padding: 6px; border: 1px solid var(--kt-border); }
  .kt-nav { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; }
  .kt-nav a { color: var(--kt-muted); text-decoration: none; font-size: 14px; }
  .kt-nav .kt-btn { margin-left: 10px; }
  .kt-hero { padding: 72px 0 40px; }
  .kt-hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 28px; align-items: stretch; }
  .kt-chip { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid var(--kt-border); color: var(--kt-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; }
  .kt-hero-copy h1 { margin: 18px 0 14px; font-size: clamp(38px, 6vw, 72px); line-height: 0.98; letter-spacing: -0.05em; }
  .kt-hero-copy p { margin: 0; font-size: 18px; line-height: 1.7; color: var(--kt-muted); max-width: 720px; }
  .kt-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
  .kt-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border-radius: 14px; text-decoration: none; font-weight: 700; border: 1px solid transparent; }
  .kt-btn-primary { background: linear-gradient(135deg, var(--kt-primary), var(--kt-secondary)); color: #08111c; }
  .kt-btn-secondary { border-color: var(--kt-border); color: var(--kt-foreground); background: rgba(255,255,255,0.02); }
  .kt-hero-card, .kt-card, .kt-faq { border: 1px solid var(--kt-border); background: rgba(7, 14, 28, 0.68); border-radius: 24px; box-shadow: 0 22px 60px rgba(0,0,0,0.22); }
  .kt-hero-card { padding: 24px; }
  .kt-hero-media { width: 100%; height: 240px; object-fit: cover; border-radius: 18px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 18px; }
  .kt-hero-card h2 { margin: 0 0 12px; font-size: 24px; }
  .kt-hero-card p, .kt-card p, .kt-faq p { color: var(--kt-muted); line-height: 1.7; }
  .kt-meta-list { display: grid; gap: 12px; margin-top: 18px; }
  .kt-meta-item { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; }
  .kt-section { padding: 38px 0; }
  .kt-section-alt { background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); }
  .kt-section-heading { max-width: 760px; margin-bottom: 24px; }
  .kt-section-heading h2, .kt-two-col h2 { margin: 14px 0 10px; font-size: clamp(28px, 4vw, 46px); line-height: 1.05; letter-spacing: -0.04em; }
  .kt-section-heading p { color: var(--kt-muted); line-height: 1.7; }
  .kt-grid { display: grid; gap: 18px; }
  .kt-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .kt-card { padding: 22px; }
  .kt-card h3 { margin: 10px 0; font-size: 22px; }
  .kt-card-meta, .kt-price { font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--kt-accent); }
  .kt-price { margin-top: 14px; }
  .kt-quote { font-size: 18px; color: var(--kt-foreground); }
  .kt-two-col { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 24px; align-items: start; }
  .kt-bullets { margin: 18px 0 0; padding-left: 20px; color: var(--kt-muted); line-height: 1.7; }
  .kt-stack { display: grid; gap: 14px; }
  .kt-faq { padding: 18px 20px; }
  .kt-faq summary { cursor: pointer; font-weight: 700; }
  .kt-footer { padding: 36px 0 56px; color: var(--kt-muted); }
  .kt-footer-grid { display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; border-top: 1px solid var(--kt-border); padding-top: 22px; }
  @media (max-width: 960px) {
    .kt-hero-grid, .kt-two-col, .kt-grid-3, .kt-footer-grid { grid-template-columns: 1fr; }
    .kt-header-inner { flex-direction: column; align-items: flex-start; }
  }
</style>
<div class="kt-page">
  <header class="kt-header">
    <div class="kt-shell kt-header-inner">
      <div class="kt-brand">
        ${renderLogo(context)}
        <div>
          <div>${htmlEscape(context.tenantName)}</div>
          <div style="font-size:12px;color:var(--kt-muted);">${htmlEscape(context.industry || "Business Website")}</div>
        </div>
      </div>
      <nav class="kt-nav">
        ${navLinks
          .map(
            (item) =>
              `<a href="${item.href}">${htmlEscape(item.label)}</a>`,
          )
          .join("")}
        <a class="kt-btn kt-btn-primary" href="${htmlEscape(
          page.primaryCtaHref || "/contact",
        )}">${htmlEscape(page.primaryCtaLabel || "Get Started")}</a>
      </nav>
    </div>
  </header>
  <section class="kt-hero">
    <div class="kt-shell kt-hero-grid">
      <div class="kt-hero-copy">
        <span class="kt-chip">${htmlEscape(context.industry || "Business")} Launch</span>
        <h1>${htmlEscape(page.heroTitle)}</h1>
        <p>${htmlEscape(page.heroSubtitle)}</p>
        <div class="kt-actions">
          <a class="kt-btn kt-btn-primary" href="${htmlEscape(
            page.primaryCtaHref,
          )}">${htmlEscape(page.primaryCtaLabel)}</a>
          ${
            page.secondaryCtaLabel && page.secondaryCtaHref
              ? `<a class="kt-btn kt-btn-secondary" href="${htmlEscape(page.secondaryCtaHref)}">${htmlEscape(page.secondaryCtaLabel)}</a>`
              : ""
          }
        </div>
      </div>
      <aside class="kt-hero-card">
        ${
          page.heroImageUrl
            ? `<img class="kt-hero-media" src="${htmlEscape(page.heroImageUrl)}" alt="${htmlEscape(
                page.heroImageAlt || page.heroTitle,
              )}" />`
            : ""
        }
        <span class="kt-chip">Business Snapshot</span>
        <h2>${htmlEscape(context.tenantName)}</h2>
        <p>${htmlEscape(context.brief || `Official website for ${context.tenantName}.`)}</p>
        <div class="kt-meta-list">
          <div class="kt-meta-item">
            <strong>Primary Domain</strong>
            <div>${htmlEscape(domain)}</div>
          </div>
          <div class="kt-meta-item">
            <strong>Enabled Modules</strong>
            <div>${htmlEscape(context.enabledModules.join(", ") || "website")}</div>
          </div>
          ${
            context.ownerEmail
              ? `<div class="kt-meta-item"><strong>Contact</strong><div>${htmlEscape(
                  context.ownerEmail,
                )}</div></div>`
              : ""
          }
        </div>
      </aside>
    </div>
  </section>
  ${renderSections(page)}
  ${page.isHomepage ? renderOfferingsGrid(offerings) : ""}
  ${page.isHomepage ? renderTestimonials(testimonials) : ""}
  ${page.isHomepage ? renderFaqs(faqs) : ""}
  <footer class="kt-footer">
    <div class="kt-shell kt-footer-grid">
      <div>
        <strong>${htmlEscape(context.tenantName)}</strong>
        <div>Generated with KalpTree AI Site Factory and ready for builder refinement.</div>
      </div>
      <div>${htmlEscape(domain)}</div>
    </div>
  </footer>
</div>
  `;
}

export function renderCatalogHtml(input: {
  context: SiteFactoryContext;
  catalog: AiSiteFactoryCatalogBlueprint;
  offerings: AiSiteFactoryOfferingBlueprint[];
}): string {
  const { context, catalog, offerings } = input;
  return `
    <section style="padding:48px 24px;background:${context.brand.background};color:${context.brand.foreground};font-family:Inter,system-ui,sans-serif;">
      <div style="max-width:1040px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;">
          <div>
            <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:${context.brand.accent};">Catalog</div>
            <h1 style="margin:10px 0 12px;font-size:44px;line-height:1.05;">${htmlEscape(catalog.title)}</h1>
            <p style="margin:0;color:${context.brand.muted};max-width:680px;line-height:1.7;">${htmlEscape(catalog.intro)}</p>
          </div>
          ${
            context.logoUrl
              ? `<img src="${htmlEscape(context.logoUrl)}" alt="${htmlEscape(
                  context.tenantName,
                )}" style="width:84px;height:84px;object-fit:contain;border-radius:20px;border:1px solid ${context.brand.border};padding:10px;background:rgba(255,255,255,0.03);" />`
              : ""
          }
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:28px;">
          ${offerings
            .map(
              (item) => `
                <article style="border:1px solid ${context.brand.border};border-radius:20px;padding:20px;background:rgba(255,255,255,0.03);">
                  <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${context.brand.accent};">${htmlEscape(item.category)}</div>
                  <h3 style="margin:10px 0 8px;font-size:22px;">${htmlEscape(item.name)}</h3>
                  <p style="margin:0;color:${context.brand.muted};line-height:1.7;">${htmlEscape(item.description)}</p>
                  <div style="margin-top:14px;font-weight:700;">${item.price > 0 ? `INR ${item.price.toLocaleString()}` : "Custom Quote"}</div>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
