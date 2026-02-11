import {Tile} from "./state.js";
import {getEdgeIndex} from "./utils.js";
import {DISTRICT_PLACEMENT_RULES, IMPROVEMENT_PLACEMENT_RULES} from "./placementRules.js";
import {logger} from "./logger.js";

export function canPlaceDistrict(tile: Tile, district: string) {
    const rules = DISTRICT_PLACEMENT_RULES[district];
    if (!rules) return true;

    if (tile.mountain) {
        logger.debug(`Cannot place ${district} on mountain`);
        return false;
    }

    if (rules.requires_city && !tile.withinCityLimits) {
        logger.debug(`${district} requires city`);
        return false;
    }

    if (rules.invalid_terrain?.includes(tile.terrain)) {
        logger.debug(`Cannot place ${district} on terrain ${tile.terrain}`);
        return false;
    }
    if (rules.required_terrain && !rules.required_terrain.includes(tile.terrain)) {
        logger.debug(`Cannot place ${district} on terrain ${tile.terrain}`);
        return false;
    }

    if (tile.feature !== "none" && rules.invalid_features?.includes(tile.feature)) {
        logger.debug(`Cannot place ${district} on feature ${tile.feature}`);
        return false;
    }
    if (rules.required_features && !rules.required_features.includes(tile.feature)) {
        logger.debug(`Cannot place ${district} on feature ${tile.feature}`);
        return false;
    }

    if (rules.invalid_resource_types?.includes(tile.resourceType)) {
        logger.debug(`Cannot place ${district} on resource type ${tile.resourceType}`);
        return false;
    }
    if (rules.requires_flat_land && tile.hill) {
        logger.debug(`Cannot place ${district} on hill`);
        return false;
    }

    const neighbors: Tile[] = tile.getNeighbors();

    if (rules.requires_adjacent_land && !neighbors.some(neighbor => (neighbor.terrain !== "ocean" && neighbor.terrain !== "coast"))) {
        logger.debug(`${district} requires adjacent land`);
        return false;
    }

    if (rules.requires_city_center && !neighbors.some(neighbor => neighbor.district === "city_center")) {
        logger.debug(`${district} requires adjacent city center`);
        return false;
    }

    if (rules.requires_not_city_center) {
        for (const neighbor of neighbors) {
            if (neighbor.district === "city_center") {
                logger.debug(`${district} requires no adjacent city center`);
                return false;
            }
        }
    }

    if (rules.requires_freshwater) {
        if (!neighbors.some(neighbor => ((neighbor.mountain || neighbor.feature === 'oasis' || neighbor.terrain === 'lake') || hasValidRiverEdge(tile)))) {
            logger.debug(`${district} requires freshwater`);
            return false;
        }
    }

    if (rules.requires_two_river_edges) {
        let riverEdgeCount = 0;
        for (const r of tile.rivers) {
            if (r) riverEdgeCount++;
        }
        if (riverEdgeCount < 2) {
            logger.debug(`${district} requires two river edges`);
            return false;
        }
    }

    if (rules.requires_connect_water_or_city) {
        if (!checkCanal(neighbors)) {
            logger.debug(`${district} requires connection to water or city`);
            return false;
        }
    }

    return true;
}

function hasValidRiverEdge(tile: Tile) {
    const neighbors: Tile[] = tile.getNeighbors();
    let edgeIndex: number;
    for (const neighbor of neighbors) {
        if (neighbor.district === 'city_center') {
            const dq = neighbor.q - tile.q;
            const dr = neighbor.r - tile.r;
            edgeIndex = getEdgeIndex(dq, dr);
            break;
        }
    }
    return tile.rivers.some((isRiver, index) => isRiver && index !== edgeIndex);
}

function checkCanal(neighbors: Tile[]) {
    const neighborIndices: number[] = [];
    const isValidDestination = (tile: Tile) => tile.terrain === 'coast' || tile.terrain === 'lake' || tile.district === 'city_center';

    neighbors.forEach((neighbor, index) => {
        if (isValidDestination(neighbor)) {
            neighborIndices.push(index);
        }
    });

    let foundConnection = false;

    for (let i = 0; i < neighborIndices.length; i++) {
        for (let j = i + 1; j < neighborIndices.length; j++) {
            const idx1 = neighborIndices[i];
            const idx2 = neighborIndices[j];
            const diff = Math.abs(idx1 - idx2);

            if (diff === 2 || diff === 3 || diff === 4) {
                foundConnection = true;
                break;
            }
        }
    }
    return foundConnection;
}

export function canPlaceImprovement(tile: Tile, improvement: string) {
    const rules = IMPROVEMENT_PLACEMENT_RULES[improvement];
    if (!rules) {
        logger.debug(`Improvement ${improvement} has no rules`);
        return true;
    }

    if (tile.mountain) {
        logger.debug(`Cannot place ${improvement} on mountain`);
        return false;
    }

    if (rules.invalid_terrain?.includes(tile.terrain)) {
        logger.debug(`Cannot place ${improvement} on terrain ${tile.terrain}`);
        return false;
    }

    if (rules.required_terrain && !rules.required_terrain.includes(tile.terrain)) {
        logger.debug(`Cannot place ${improvement} on terrain ${tile.terrain}`);
        return false;
    }

    if (rules.invalid_features?.includes(tile.feature)) {
        logger.debug(`Cannot place ${improvement} on feature ${tile.feature}`);
        return false;
    }

    if (rules.required_features && !rules.required_features.includes(tile.feature)) {
        logger.debug(`${improvement} requires one of: ${rules.required_features.join(', ')}`);
        return false;
    }

    if ((tile.resource !== 'none') && rules.valid_resources && !rules.valid_resources.includes(tile.resource)) {
        logger.debug(`Cannot place ${improvement} on resource ${tile.resource}`);
        return false;
    }

    if (rules.required_resources && !rules.required_resources.includes(tile.resource)) {
        logger.debug(`${improvement} requires one of: ${rules.required_resources.join(', ')}`);
        return false;
    }

    if (improvement === 'mine') return canPlaceMine(tile);
    if (improvement === 'farm') return canPlaceFarm(tile);
    return true;
}

function canPlaceMine(tile: Tile): boolean {
    if (tile.hill) return true;
    if (tile.feature === 'volcanic_soil') return true;
    if (tile.resource === 'none') {
        logger.debug(`Cannot place mine on resourceless, featureless flat tile: ${tile.q},${tile.r}`);
        return false;
    }
    return true;
}

function canPlaceFarm(tile: Tile): boolean {
    if (tile.terrain === 'desert' && tile.feature !== 'floodplains') {
        logger.debug(`Cannot place farm on non-floodplains desert: ${tile.q},${tile.r}`);
        return false;
    }
    return true;
}
