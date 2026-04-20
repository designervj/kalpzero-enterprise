export interface PermissionSpec {
    id: string;
    description: string;
    moduleId: string;
    defaultAllowedRoles?: string[];
}

export interface ModuleContract {
    id: string;
    key: string;
    name: string;
    idName?: string;
    ui?: {
        navigation?: any[];
    };
    routes?: any[];
    permissions?: PermissionSpec[];
}
