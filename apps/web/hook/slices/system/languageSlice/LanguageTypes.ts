export interface Language {
    _id: string;
    name: string;
    code: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface LanguageState {
    allLanguage: Language[];
    currentLanguage: Language | null;
    isFetchedLanguage: boolean;
    loading: boolean;
    error: string | null;
}
