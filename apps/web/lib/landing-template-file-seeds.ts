import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { normalizeTemplateHtml } from '@/lib/template-html';
import type { LandingTemplate } from '@/lib/landing-templates';

const UPDATED_AT = '2026-03-07';

type FileTemplateSeed = {
    key: string;
    name: string;
    businessType: string;
    filename: string;
};

const FILE_TEMPLATE_SEEDS: FileTemplateSeed[] = [
    {
        key: 'gjs_file_gabru_fashion',
        name: 'Gabru Fashion Showcase',
        businessType: 'fashion',
        filename: 'gabru-fashion.html',
    },
    {
        key: 'gjs_file_ai_agents',
        name: 'AI Agents Landing',
        businessType: 'technology',
        filename: 'ai-agents.html',
    },
    {
        key: 'gjs_file_yuvi_garments',
        name: 'Yuvi Garments Catalog',
        businessType: 'garments',
        filename: 'yuvi-garments.html',
    },
    {
        key: 'gjs_file_full_website',
        name: 'Full Website Starter',
        businessType: 'business',
        filename: 'full-website.html',
    },
    {
        key: 'gjs_file_gym',
        name: 'Gym Studio Landing',
        businessType: 'fitness',
        filename: 'gym.html',
    },
    {
        key: 'gjs_file_single_page',
        name: 'Single Page Portfolio',
        businessType: 'portfolio',
        filename: 'single-page.html',
    },
];

function getTemplateFilePath(filename: string): string {
    return join(process.cwd(), 'src', 'lib', 'landing-template-files', filename);
}

export async function loadFileLandingTemplates(): Promise<LandingTemplate[]> {
    const items: LandingTemplate[] = [];

    for (const seed of FILE_TEMPLATE_SEEDS) {
        try {
            const raw = await readFile(getTemplateFilePath(seed.filename), 'utf8');
            const normalized = normalizeTemplateHtml(raw);
            if (!normalized) continue;

            items.push({
                key: seed.key,
                name: seed.name,
                businessType: seed.businessType,
                format: 'grapesjs',
                html: normalized,
                sections: [
                    {
                        key: 'full-page',
                        label: 'Full Page',
                        html: normalized,
                    },
                ],
                updatedAt: UPDATED_AT,
            });
        } catch (error) {
            console.warn(`Skipping landing template seed ${seed.filename}:`, error);
        }
    }

    return items;
}
