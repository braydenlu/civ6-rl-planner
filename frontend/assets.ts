import {logger} from "./logger.js";

const BASE = './static/assets/';

const getFullPath = (path: string) => `${BASE}${path}`;

const assets = {
    // Terrains
    'grassland': 'terrain/grassland.png',
    'plains': 'terrain/plains.png',
    'coast': 'terrain/coast.png',
    'desert': 'terrain/desert.png',
    'ocean': 'terrain/ocean.png',
    'snow': 'terrain/snow.png',
    'tundra': 'terrain/tundra.png',
    // Hills
    'grassland_hill': 'terrain/hills/grassland_hill.png',
    'plains_hill': 'terrain/hills/plains_hill.png',
    'desert_hill': 'terrain/hills/desert_hill.png',
    'snow_hill': 'terrain/hills/snow_hill.png',
    'tundra_hill': 'terrain/hills/tundra_hill.png',
    // Features
    'woods': 'features/woods.png',
    'jungle': 'features/jungle.png',
    'marsh': 'features/marsh.png',
    'oasis': 'features/oasis.png',
    'floodplains': 'features/floodplains.png',
    'geothermal_fissure': 'features/geothermal_fissure.png',
    'reef': 'features/reef.png',
    'volcano': 'features/volcano.png',
    'volcanic_soil': 'features/volcanic_soil.png',
    'ice_caps': 'features/ice_caps.png',
    // Mountains
    'grassland_mountain_1': 'features/mountains/grassland_1.png',
    'grassland_mountain_2': 'features/mountains/grassland_2.png',
    'grassland_mountain_3': 'features/mountains/grassland_3.png',
    'grassland_mountain_4': 'features/mountains/grassland_4.png',
    'grassland_mountain_5': 'features/mountains/grassland_5.png',
    'grassland_mountain_6': 'features/mountains/grassland_6.png',
    'plains_mountain_1': 'features/mountains/plains_1.png',
    'plains_mountain_2': 'features/mountains/plains_2.png',
    'plains_mountain_3': 'features/mountains/plains_3.png',
    'plains_mountain_4': 'features/mountains/plains_4.png',
    'plains_mountain_5': 'features/mountains/plains_5.png',
    'plains_mountain_6': 'features/mountains/plains_6.png',
    'desert_mountain_1': 'features/mountains/desert_1.png',
    'desert_mountain_2': 'features/mountains/desert_2.png',
    'desert_mountain_3': 'features/mountains/desert_3.png',
    'desert_mountain_4': 'features/mountains/desert_4.png',
    'desert_mountain_5': 'features/mountains/desert_5.png',
    'desert_mountain_6': 'features/mountains/desert_6.png',
    'snow_mountain_1': 'features/mountains/snow_1.png',
    'snow_mountain_2': 'features/mountains/snow_2.png',
    'snow_mountain_3': 'features/mountains/snow_3.png',
    'snow_mountain_4': 'features/mountains/snow_4.png',
    'snow_mountain_5': 'features/mountains/snow_5.png',
    'snow_mountain_6': 'features/mountains/snow_6.png',
    'tundra_mountain_1': 'features/mountains/tundra_1.png',
    'tundra_mountain_2': 'features/mountains/tundra_2.png',
    'tundra_mountain_3': 'features/mountains/tundra_3.png',
    'tundra_mountain_4': 'features/mountains/tundra_4.png',
    'tundra_mountain_5': 'features/mountains/tundra_5.png',
    'tundra_mountain_6': 'features/mountains/tundra_6.png',
    // Districts
    'aqueduct': 'district/aqueduct.png',
    'aerodrome': 'district/aerodrome.png',
    'campus': 'district/campus.png',
    'canal': 'district/canal.png',
    'city_center': 'district/city/city.png',
    'commercial_hub': 'district/commercial_hub.png',
    'dam': 'district/dam.png',
    'encampment': 'district/encampment.png',
    'entertainment_complex': 'district/entertainment_complex.png',
    'government_plaza': 'district/government_plaza.png',
    'harbor': 'district/harbor.png',
    'holy_site': 'district/holy_site.png',
    'industrial_zone': 'district/industrial_zone.png',
    'neighborhood': 'district/neighborhood.png',
    'spaceport': 'district/spaceport.png',
    'theater_square': 'district/theater_square.png',
    'water_park': 'district/water_park.png',
    'preserve': 'district/preserve.png',
    'diplomatic_quarter': 'district/diplomatic_quarter.png',
    // Resources
    'resources256': 'resources/resources256.png',
    'xp1_resources256': 'resources/xp1_resources256.png',
    'maize': 'resources/maize.png',
    'honey': 'resources/honey.png',
    // Improvements
    'farm': 'improvements/farm.png',
    'mine': 'improvements/mine.png',
    'quarry': 'improvements/quarry.png',
    'plantation': 'improvements/plantation.png',
    'camp': 'improvements/camp.png',
    'pasture': 'improvements/pasture.png',
    'fishing_boats': 'improvements/fishing_boats.png',
    'lumber_mill': 'improvements/lumber_mill.png',
    // Yields
    'yields': 'yields/yields.png'
};

type ResourceIndex = [number, number];
type ResourceIndexMap = Record<string, ResourceIndex>;

const BONUS_RESOURCE_INDICES: ResourceIndexMap = {
    'bananas': [0, 0],
    'cattle': [0, 1],
    'copper': [0, 2],
    'crabs': [0, 3],
    'deer': [0, 4],
    'fish': [0, 5],
    'rice': [0, 6],
    'sheep': [0, 7],
    'stone': [1, 0],
    'wheat': [1, 1],
}

const LUXURY_RESOURCE_INDICES: ResourceIndexMap = {
    'citrus': [1, 2],
    'cocoa': [1, 3],
    'coffee': [1, 4],
    'cotton': [1, 5],
    'diamonds': [1, 6],
    'dyes': [1, 7],
    'furs': [2, 0],
    'gypsum': [2, 1],
    'incense': [2, 2],
    'ivory': [2, 3],
    'jade': [2, 4],
    'marble': [2, 5],
    'mercury': [2, 6],
    'pearls': [2, 7],
    'salt': [3, 0],
    'silk': [3, 1],
    'silver': [3, 2],
    'spices': [3, 3],
    'sugar': [3, 4],
    'tea': [3, 5],
    'tobacco': [3, 6],
    'truffles': [3, 7],
    'whales': [4, 0],
    'wines': [4, 1],
    'jeans': [4, 2],
    'perfume': [4, 3],
    'cosmetics': [4, 4],
    'toys': [4, 5],
    'cinnamon': [4, 6],
    'cloves': [4, 7],
}

const STRATEGIC_RESOURCE_INDICES: ResourceIndexMap = {
    'aluminum': [5, 0],
    'coal': [5, 1],
    'horses': [5, 2],
    'iron': [5, 3],
    'niter': [5, 4],
    'oil': [5, 5],
    'uranium': [5, 6],
}

const ARTIFACT_RESOURCE_INDICES: ResourceIndexMap = {
    'antiquity_site': [5, 7],
    'shipwreck': [6, 0],
}

const XP1_RESOURCE_INDICES: ResourceIndexMap = {
    'olives': [0, 0],
    'turtles': [0, 1],
    'amber': [0, 2],
}

const YIELDS_RESOURCE_INDICES: ResourceIndexMap = {
    'food': [0, 0],
    'production': [0, 1],
    'gold': [0, 2],
    'science': [0, 3],
    'culture': [0, 4],
    'faith': [0, 5],
}

export function getYieldIconIndex(yieldType: string): number {
    return YIELDS_RESOURCE_INDICES[yieldType][1];
}

export type resourceInfo = {
    file: string | null;
    index: ResourceIndex | null;
    resourceType: string;
};


export function getResourceIndices(resource: string): resourceInfo {
    if (resource === 'maize') {
        return {file: null, index: null, resourceType: 'bonus'};
    } else if (resource === 'honey') {
        return {file: null, index: null, resourceType: 'luxury'};
    }
    if (resource in LUXURY_RESOURCE_INDICES) {
        return {file: 'resources256', index: LUXURY_RESOURCE_INDICES[resource], resourceType: 'luxury'};
    } else if (resource in STRATEGIC_RESOURCE_INDICES) {
        return {file: 'resources256', index: STRATEGIC_RESOURCE_INDICES[resource], resourceType: 'strategic'};
    } else if (resource in ARTIFACT_RESOURCE_INDICES) {
        return {file: 'resources256', index: ARTIFACT_RESOURCE_INDICES[resource], resourceType: 'artifact'};
    } else if (resource in XP1_RESOURCE_INDICES) {
        return {file: 'xp1_resources256', index: XP1_RESOURCE_INDICES[resource], resourceType: 'luxury'};
    } else if (resource in BONUS_RESOURCE_INDICES) {
        return {file: 'resources256', index: BONUS_RESOURCE_INDICES[resource], resourceType: 'bonus'};
    }
    return {file: null, index: null, resourceType: 'none'};
}

export function loadAssets(images: Record<string, HTMLImageElement>, callback: () => void) {
    let loaded = 0;
    const total = Object.keys(assets).length;
    const onAssetDone = () => {
        loaded++;
        if (loaded === total) callback();
    };
    for (const [name, path] of Object.entries(assets)) {
        const img = new Image();
        img.src = getFullPath(path);
        img.onload = onAssetDone;
        img.onerror = () => {
            logger.warn(`Failed to load asset: ${name} (${path})`);
            onAssetDone();
        };
        images[name] = img;
    }
}
