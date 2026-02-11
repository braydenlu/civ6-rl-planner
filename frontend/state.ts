import {getHexDistance, randomInt} from "./utils.js";
import {NEIGHBOR_OFFSETS} from "./consts.js";
import {render} from "./renderer.js";
import {updateInspector} from "./inspector.js";
import {canPlaceDistrict, canPlaceImprovement} from "./placementValidation.js";
import {getResourceIndices} from "./assets.js";
import {logger} from "./logger.js";

export const SQUISH_FACTOR = 0.8;
const grid: Record<string, Tile> = {};
let selectedTile: Tile | null = null;
let hexRadius = 60;
let radius = 4;
let currentBrush = "none";
let culture: number = 0;
let science: number = 0;
let faith: number = 0;
let production: number = 0;
let gold: number = 0;
let food: number = 0;
let yieldData: Record<string, { yield: string, value: number }> = {}
let isScoring = false;
let scoreError: string | null = null;
let scoreRequestId = 0;

export function initGrid() {
    for (let q = -radius; q <= radius; q++) {
        for (let r = -radius; r <= radius; r++) {
            if (Math.abs(q + r) <= radius) {
                grid[`${q},${r}`] = new Tile(q, r);
            }
        }
    }
}

export function updateState() {
    const requestId = ++scoreRequestId;
    isScoring = true;
    scoreError = null;
    updateVisuals();
    updateScore(requestId).then((didUpdate) => {
        if (!didUpdate) return;
        isScoring = false;
        updateVisuals();
    });
}

export function updateVisuals() {
    render();
    updateInspector();
}

export class Tile {
    readonly q: number;
    readonly r: number;
    public terrain: string;
    public hill: boolean;
    public mountain: boolean;
    public mountain_no: number;
    public feature: string;
    public district: string;
    public resource: string;
    public resourceType: string;
    public improvement: string;
    public rivers: boolean[];
    public yields: Record<string, number>;
    public withinCityLimits: boolean;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
        this.terrain = "grassland";
        this.hill = false;
        this.mountain = false;
        this.mountain_no = randomInt(1, 6);
        this.feature = "none";
        this.district = "none";
        this.resource = "none";
        this.resourceType = 'none';
        this.improvement = "none";
        this.rivers = [false, false, false, false, false, false]; // [E, SE, SW, W, NW, NE]
        this.yields = {}
        this.withinCityLimits = false;
    }

    toggleRiver(edgeIndex: number) {
        const isAdding = !this.rivers[edgeIndex];
        this.rivers[edgeIndex] = isAdding;

        const oppositeEdge = (edgeIndex + 3) % 6;

        const offset = NEIGHBOR_OFFSETS[edgeIndex];
        const neighbor = grid[`${this.q + offset.q},${this.r + offset.r}`];

        if (neighbor) {
            neighbor.rivers[oppositeEdge] = isAdding;
        }
    }

    getNeighbors(): Tile[] {
        const neighbors = []

        for (const offset of NEIGHBOR_OFFSETS) {
            const neighbor = grid[`${this.q + offset.q},${this.r + offset.r}`];
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }
}

export function saveMap() {
    const data = JSON.stringify(grid);
    const blob = new Blob([data], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `civ_map_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function loadMap(jsonString: string) {
    let data;
    try {
        data = JSON.parse(jsonString);

        for (let key in grid) delete grid[key];

        for (let key in data) {
            const raw = data[key];
            const tile = new Tile(raw.q, raw.r);

            Object.assign(tile, raw);
            tile.resourceType = getResourceIndices(tile.resource).resourceType;
            grid[key] = tile;
        }

        selectedTile = null;
        recomputeCityLimits();
        updateState();
        logger.info("Map loaded successfully");
    } catch (error) {
        logger.error("Error loading map:", error, data);
    }
}

type total_yields = {
    science: number;
    culture: number;
    faith: number;
    gold: number;
    production: number;
    food: number
}

export async function updateScore(requestId: number): Promise<boolean> {
    const response = await fetch('/calculate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(getGrid())
    });

    if (!response.ok) {
        scoreError = 'Failed to calculate yields';
        return false;
    }

    const results: {
        summary: total_yields,
        tiles: Record<string, Record<string, number>>
    } = await response.json();
    console.log(results)
    if (requestId !== scoreRequestId) return false;

    const summary = results.summary;

    science = summary.science;
    culture = summary.culture;
    faith = summary.faith;
    gold = summary.gold;
    production = summary.production;
    food = summary.food;

    Object.values(grid).forEach(tile => {
        tile.yields = {};
    });

    for (const key in results.tiles) {
        const tile = grid[key];
        if (!tile) continue;

        tile.yields = results.tiles[key];
    }

    return true;
}

export function tryPlaceDistrict(tile: Tile, district: string): boolean {
    const wasCityCenter = tile.district === "city_center";
    if (district === "none") {
        tile.district = "none";
        if (wasCityCenter) {
            recomputeCityLimits();
        }
        updateState();
        return true;
    }
    if (canPlaceDistrict(tile, district)) {
        tile.district = district;
        if (wasCityCenter || district === 'city_center') {
            recomputeCityLimits();
        }
        updateState();
        return true;
    } else {
        logger.warn(`Can't place ${district} here.`);
        return false;
    }
}

function recomputeCityLimits() {
    const RADIUS = 3;

    Object.values(grid).forEach(otherTile => {
        otherTile.withinCityLimits = false;
    });

    const cityCenters = Object.values(grid).filter(tile => tile.district === 'city_center');
    cityCenters.forEach(centerTile => {
        Object.values(grid).forEach(otherTile => {
            const dist = getHexDistance(centerTile, otherTile);
            if (dist <= RADIUS) {
                otherTile.withinCityLimits = true;
            }
        });
    });
}

export function tryPlaceImprovement(tile: Tile, improvement: string) {
    if (improvement === "none") {
        tile.improvement = "none";
        updateState();
        return true;
    }
    if (canPlaceImprovement(tile, improvement)) {
        tile.improvement = improvement;
        updateState();
        return true;
    } else {
        logger.warn(`Can't place ${improvement} here.`);
        return false;
    }
}

export async function sendMapToBackend() {
    const response = await fetch('/analyze-map', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(grid)
    });

    if (!response.ok) {
        const errorText = await response.text();
        logger.error("Server Error Detail:", errorText);
        return;
    }

    const result = await response.text();
    logger.info("AI Analysis:", result);

    loadMap(result);
    render();
}

export function setBrush(toolName: string) {
    currentBrush = toolName;
}

export function getBrush() {
    return currentBrush;
}

export function getIsScoring() {
    return isScoring;
}

export function getScoreError() {
    return scoreError;
}

export function setSelectedTile(tile: Tile | null) {
    selectedTile = tile;
}

export function getSelectedTile() {
    return selectedTile;
}

export function getRadius() {
    return radius;
}

export function getGrid() {
    return grid;
}

export function getCulture() {
    return culture;
}

export function getScience() {
    return science;
}

export function getFaith() {
    return faith;
}

export function getProduction() {
    return production;
}

export function getGold() {
    return gold;
}

export function getFood() {
    return food;
}

export function getHexRadius() {
    return hexRadius;
}

export function setHexRadius(newRadius: number) {
    hexRadius = newRadius;
}
