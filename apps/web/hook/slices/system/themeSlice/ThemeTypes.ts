export interface Theme {
    _id: string;
    name: string;
    description: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        error: string;
    };
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ThemeState {
    allThemes: Theme[];
    currentTheme: Theme | null;
    isFetchedTheme: boolean;
    loading: boolean;
    error: string | null;
}
