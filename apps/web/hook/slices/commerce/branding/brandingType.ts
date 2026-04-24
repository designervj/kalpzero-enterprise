
export interface Logo {
  id?: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface CompanyInfo {
  name?: string;
  tagline?: string;
  foundedYear?: string;
}

export interface Location {
  id?: number;
  name?: string;
  address?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface ContactInfo {
  primaryEmail?: string;
  supportEmail?: string;
  phoneDisplay?: boolean;
}

export interface SocialMedia {
  platform?: string;
  url?: string;
  icon?: string;
  enabled?: boolean;
}

export interface LegalInfo {
  companyLegalName?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  copyrightText?: string;
}

export interface Language {
  code?: string;
  name?: string;
  enabled?: boolean;
}

export interface Currency {
  code?: string;
  symbol?: string;
  name?: string;
  enabled?: boolean;
}

export interface LanguageConfig {
  available?: Language[];
  default?: string;
}

export interface CurrencyConfig {
  available?: Currency[];
  default?: string;
}

export interface BrandingType {
  id?: string;
  name?: string;
  logos?: Logo[];
  companyInfo?: CompanyInfo;
  locations?: Location[];
  contact?: ContactInfo;
  socialMedia?: SocialMedia[];
  legal?: LegalInfo;
  languages?: LanguageConfig;
  currencies?: CurrencyConfig;
}