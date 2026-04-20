export type ModuleDependencyRule = {
    key: string;
    requires: string[];
    note: string;
};

export const MODULE_DEPENDENCY_RULES: ModuleDependencyRule[] = [
    {
        key: 'ecommerce',
        requires: ['invoicing'],
        note: 'E-Commerce requires Invoicing for transaction billing lifecycle.',
    },
    {
        key: 'invoicing',
        requires: ['ecommerce'],
        note: 'Invoicing is supported only when E-Commerce is active.',
    },
];

export function normalizeModuleList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter(Boolean)
        )
    );
}

export function enforceModuleSelectionRules(input: unknown): {
    modules: string[];
    appliedRules: string[];
} {
    const moduleSet = new Set(normalizeModuleList(input));
    const appliedRules: string[] = [];

    // Canonical paired dependency for current parity requirement.
    if (moduleSet.has('ecommerce') && !moduleSet.has('invoicing')) {
        moduleSet.add('invoicing');
        appliedRules.push('ecommerce->invoicing');
    }
    if (moduleSet.has('invoicing') && !moduleSet.has('ecommerce')) {
        moduleSet.add('ecommerce');
        appliedRules.push('invoicing->ecommerce');
    }

    // Removed hardcoded real_estate constraint as requested.

    return {
        modules: Array.from(moduleSet),
        appliedRules,
    };
}

export function toggleModuleWithRules(current: string[], target: string): string[] {
    const normalized = normalizeModuleList(current);
    const moduleSet = new Set(normalized);
    const isActive = moduleSet.has(target);

    if (target === 'ecommerce' || target === 'invoicing') {
        if (isActive) {
            moduleSet.delete('ecommerce');
            moduleSet.delete('invoicing');
        } else {
            moduleSet.add('ecommerce');
            moduleSet.add('invoicing');
        }
        return Array.from(moduleSet);
    }

    if (isActive) moduleSet.delete(target);
    else moduleSet.add(target);

    return enforceModuleSelectionRules(Array.from(moduleSet)).modules;
}
