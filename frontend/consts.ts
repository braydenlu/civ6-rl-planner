import {sortArray, sortObject} from "./utils.js";

export const RENDER_SIZES = {
    TERRAIN: 1.0,
    HILL: 0.85,
    FEATURE: 0.95,
    DISTRICT: 0.8,
    RESOURCE: 0.5,
    IMPROVEMENT: 1.0,
} as const;

export const ICON_SIZES = {
    ORIGINAL: 256,
    YIELD_ICON: 96,
    YIELD_GRID: 128,
    YIELD_PADDING: 16,
    YIELD_DRAWN: 32,
    DISTRICT_BUBBLE_WIDTH: 64,
    DISTRICT_BUBBLE_HEIGHT: 28,
    DISTRICT_BUBBLE_ICON: 32,
    LARGE_YIELD_ICON: 64,
    LARGE_YIELD_PADDING: 32,
} as const;

export const DISTRICT_SCALE_OVERRIDES = {
    DAM: 0.75,
    CANAL: 1.5,
    GOVERNMENT_PLAZA: 1.5,
    WATER_PARK: 1.5,
    DIPLOMATIC_QUARTER: 1.25,
} as const;

export const NEIGHBOR_OFFSETS = [
    {q: 1, r: 0}, {q: 0, r: 1}, {q: -1, r: 1}, {q: -1, r: 0}, {q: 0, r: -1}, {q: 1, r: -1}
];

export type EditableTileProperty =
    | 'terrain'
    | 'feature'
    | 'district'
    | 'resource'
    | 'improvement'
    | 'hill'
    | 'mountain';

export const INSPECTOR_CONFIG: Record<string, string[]> = {
    terrain: [...sortArray(['grassland', 'plains', 'desert', 'snow', 'tundra', 'coast', 'ocean', 'lake'])],
    feature: ['none', ...sortArray(['woods', 'jungle', 'marsh', 'oasis', 'floodplains', 'geothermal_fissure', 'reef', 'volcano', 'volcanic_soil', 'ice_caps'])],
    district: ['none', ...sortArray(['aqueduct', 'aerodrome', 'campus', 'canal', 'city_center', 'commercial_hub', 'dam', 'encampment', 'entertainment_complex', 'government_plaza', 'harbor', 'holy_site', 'industrial_zone', 'neighborhood', 'spaceport', 'theater_square', 'water_park', 'preserve', 'diplomatic_quarter'])],
    resource: ['none', ...sortArray(['iron', 'horses', 'coal', 'oil', 'aluminum', 'uranium', 'niter', 'bananas', 'cattle', 'copper', 'crabs', 'deer', 'fish', 'maize', 'rice', 'sheep', 'stone', 'wheat', 'amber', 'cinnamon', 'citrus', 'cloves', 'cocoa', 'coffee', 'cosmetics', 'cotton', 'dyes', 'diamonds', 'furs', 'gypsum', 'honey', 'incense', 'ivory', 'jade', 'jeans', 'marble', 'mercury', 'olives', 'pearls', 'perfume', 'salt', 'silk', 'silver', 'spices', 'sugar', 'tea', 'tobacco', 'toys', 'truffles', 'turtles', 'whales', 'wine', 'antiquity_site', 'shipwreck'])],
    improvement: ['none', ...sortArray(['farm', 'mine', 'quarry', 'plantation', 'camp', 'pasture', 'fishing_boats', 'lumber_mill'])]
}

export const SHORTCUT_MAPS: Record<string, Record<string, string>> = {
    terrainShortcutMode: generateShortcuts(
        INSPECTOR_CONFIG.terrain
    ),

    featureShortcutMode: generateShortcuts(
        INSPECTOR_CONFIG.feature,
        {
            fixed: {n: 'none'},
            reserved: new Set(['n'])
        }
    ),

    districtShortcutMode: generateShortcuts(
        INSPECTOR_CONFIG.district, {
            fixed: {n: 'none'},
            reserved: new Set(['n'])
        }
    ),

    resourceShortcutMode: generateShortcuts(
        INSPECTOR_CONFIG.resource,
        {
            fixed: {n: 'none'},
            reserved: new Set(['n'])
        }
    ),

    improvementShortcutMode: generateShortcuts(
        INSPECTOR_CONFIG.improvement,
        {
            fixed: {n: 'none'},
            reserved: new Set(['n'])
        }
    ),

    hills_mountainsShortcutMode: {
        h: 'hillCheckbox',
        m: 'mountainCheckbox',
        n: 'none'
    }
};

function generateShortcuts(
    values: string[],
    {
        fixed = {},
        reserved = new Set<string>()
    }: {
        fixed?: Record<string, string>;
        reserved?: Set<string>;
    } = {}
): Record<string, string> {
    const map: Record<string, string> = {...fixed};
    const used = new Set(Object.keys(fixed));
    reserved.forEach(k => used.add(k));

    for (const value of values) {
        if (Object.values(fixed).includes(value)) continue;

        const tokens = value.split('_');
        let key: string | undefined;

        for (const token of tokens) {
            for (const char of token) {
                if (!used.has(char)) {
                    key = char;
                    break;
                }
            }
            if (key) break;
        }

        if (!key) {
            for (let i = 0; i <= 9; i++) {
                const n = String(i);
                if (!used.has(n)) {
                    key = n;
                    break;
                }
            }
        }

        if (!key) continue;

        map[key] = value;
        used.add(key);
    }

    return map;
}
