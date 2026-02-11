export type DistrictPlacementRules = {
    requires_city?: boolean;
    invalid_terrain?: string[];
    required_terrain?: string[];
    invalid_features?: string[];
    required_features?: string[];
    invalid_resource_types?: string[];
    requires_adjacent_land?: boolean;
    requires_flat_land?: boolean;
    requires_city_center?: boolean;
    requires_not_city_center?: boolean;
    requires_freshwater?: boolean;
    requires_two_river_edges?: boolean;
    requires_connect_water_or_city?: boolean;
}

export const STANDARD_RULES : DistrictPlacementRules = {
    requires_city: true,
    invalid_terrain: ['coast', 'ocean', 'lake'],
    invalid_features: ['geothermal_fissure', 'volcano'],
    invalid_resource_types: ['strategic', 'luxury', 'artifact']
}

export const COAST_RULES : DistrictPlacementRules = {
    requires_city: true,
    invalid_terrain: ['grassland', 'plains', 'desert', 'snow', 'tundra', 'ocean'],
    invalid_features: ['reef'],
    invalid_resource_types: ['strategic', 'luxury', 'artifact'],
    requires_adjacent_land: true
}

export const AERIAL_RULES : DistrictPlacementRules = {
    requires_city: true,
    invalid_terrain: ['coast', 'ocean', 'lake'],
    invalid_features: ['geothermal_fissure', 'volcano'],
    invalid_resource_types: ['strategic', 'luxury', 'artifact'],
    requires_flat_land: true
}

export const DISTRICT_PLACEMENT_RULES : Record<string, DistrictPlacementRules> = {
    campus: STANDARD_RULES,
    diplomatic_quarter: STANDARD_RULES,
    commercial_hub: STANDARD_RULES,
    entertainment_complex: STANDARD_RULES,
    government_plaza: STANDARD_RULES,
    holy_site: STANDARD_RULES,
    industrial_zone: STANDARD_RULES,
    neighborhood: STANDARD_RULES,
    theater_square: STANDARD_RULES,

    harbor: COAST_RULES,
    water_park: COAST_RULES,

    aerodrome: AERIAL_RULES,
    spaceport: AERIAL_RULES,

    city_center: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        invalid_features: ['oasis'],
    },

    preserve: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        invalid_features: ['geothermal_fissure', 'volcano'],
        invalid_resource_types: ['strategic', 'luxury', 'artifact'],
        requires_not_city_center: true,
        requires_city: true
    },

    aqueduct: {
        requires_city: true,
        invalid_terrain: ['coast', 'ocean', 'lake'],
        invalid_features: ['geothermal_fissure', 'volcano'],
        invalid_resource_types: ['strategic', 'luxury', 'artifact'],
        requires_city_center: true,
        requires_freshwater: true
    },

    encampment: {
        requires_city: true,
        invalid_terrain: ['coast', 'ocean', 'lake'],
        invalid_features: ['geothermal_fissure', 'volcano'],
        invalid_resource_types: ['strategic', 'luxury', 'artifact'],
        requires_not_city_center: true
    },

    dam: {
        requires_city: true,
        invalid_terrain: ['coast', 'ocean', 'lake'],
        required_features: ['floodplains'],
        invalid_resource_types: ['strategic', 'luxury', 'artifact'],
        requires_two_river_edges: true
    },

    canal: {
        requires_city: true,
        invalid_terrain: ['coast', 'ocean', 'lake'],
        invalid_features: ['geothermal_fissure', 'volcano'],
        requires_flat_land: true,
        requires_connect_water_or_city: true
    }
}

export type ImprovementPlacementRules = {
    invalid_terrain?: string[];
    required_terrain?: string[];
    invalid_features?: string[];
    required_features?: string[];
    valid_resources?: string[];
    required_resources?: string[];
}

export const IMPROVEMENT_PLACEMENT_RULES : Record<string, ImprovementPlacementRules> = {
    farm: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        invalid_features: ['geothermal_fissure', 'volcano'],
        valid_resources: ['wheat', 'rice', 'maize']
    },

    mine: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        invalid_features: ['geothermal_fissure', 'volcano', 'floodplains'],
        valid_resources: ['iron', 'niter', 'coal', 'aluminum', 'uranium', 'diamonds', 'jade', 'mercury', 'salt', 'silver', 'amber', 'copper']
    },

    quarry: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        required_resources: ['stone', 'marble', 'gypsum']
    },

    plantation: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        required_resources: ['bananas', 'citrus', 'cocoa', 'coffee', 'cotton', 'dyes', 'incense', 'olives', 'silk', 'spices', 'sugar', 'tea', 'tobacco', 'wine']
    },

    camp: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        required_resources: ['deer', 'furs', 'ivory', 'truffles', 'honey']
    },

    pasture: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        required_resources: ['sheep', 'cattle', 'horses']
    },

    fishing_boats: {
        required_terrain: ['coast', 'ocean', 'lake'],
        required_resources: ['fish', 'crabs', 'whales', 'pearls', 'amber', 'turtles']
    },

    lumber_mill: {
        invalid_terrain: ['coast', 'ocean', 'lake'],
        required_features: ['woods', 'jungle'],
    }
}
