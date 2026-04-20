export interface LandingTemplateSection {
    key: string;
    label: string;
    html: string;
}

export interface LandingTemplate {
    _id: string;
    key: string;
    businessType: string;
    format: string;
    html: string;
    name: string;
    sections: LandingTemplateSection[];
    source: string;
    createdAt?: string;
    updatedAt?: string;
}

