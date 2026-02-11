import {hexToPixel} from "./utils.js";
import {getResourceIndices, getYieldIconIndex, resourceInfo} from "./assets.js";
import {getGrid, getHexRadius, getSelectedTile, setHexRadius, SQUISH_FACTOR, Tile} from "./state.js";
import {RENDER_SIZES, ICON_SIZES, DISTRICT_SCALE_OVERRIDES} from "./consts.js";

const PADDING : number = 60;
let ctx: CanvasRenderingContext2D;
let canvas: HTMLCanvasElement;
let cachedImages: Record<string, HTMLImageElement> = {};

export function initRenderer(canvas_param: HTMLCanvasElement, images_param: Record<string, HTMLImageElement>) {
    canvas = canvas_param;
    cachedImages = images_param;
    ctx = canvas_param.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    resizeRenderer();
    return ctx;
}

export function resizeRenderer() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    setHexRadius(calculateHexSize(PADDING));


    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
}

function calculateHexSize(padding: number) {
    const grid = getGrid();
    const tiles = Object.values(grid);
    if (tiles.length === 0) return getHexRadius();

    let minQ = Infinity, maxQ = -Infinity;
    let minR = Infinity, maxR = -Infinity;

    tiles.forEach(tile => {
        minQ = Math.min(minQ, tile.q);
        maxQ = Math.max(maxQ, tile.q);
        minR = Math.min(minR, tile.r);
        maxR = Math.max(maxR, tile.r);
    });

    const gridWidthUnits = (maxQ - minQ + 1) * Math.sqrt(3);
    const gridHeightUnits = (maxR - minR + 1) * 1.5 * SQUISH_FACTOR;

    const availableW = canvas.clientWidth - (padding * 2);
    const availableH = canvas.clientHeight - (padding * 2);

    const sizeW = availableW / gridWidthUnits;
    const sizeH = availableH / gridHeightUnits;

    return Math.min(sizeW, sizeH);
}

export function render() {
    if (!getGrid()) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    iterateGrid(tile => drawHex(tile));
    iterateGrid(tile => drawRivers(tile));
    iterateGrid(tile => drawHills(tile));
    iterateGrid(tile => drawFeatures(tile));
    iterateGrid(tile => drawDistricts(tile));
    iterateGrid(tile => drawImprovements(tile));
    iterateGrid(tile => drawYields(tile));
    iterateGrid(tile => drawResources(tile));
}

function iterateGrid(callback: (tile: Tile) => void) {
    Object.values(getGrid()).forEach(tile => callback(tile));
}

function drawHex(tile: Tile) {
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);
    const terrainSize = hexRadius;

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        let angle_rad = (Math.PI / 180) * (60 * i - 30);
        let vx = center.x + hexRadius * Math.cos(angle_rad);
        let vy = center.y + hexRadius * Math.sin(angle_rad) * SQUISH_FACTOR;
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.clip();

    if (cachedImages[tile.terrain]) {
        ctx.drawImage(cachedImages[tile.terrain], center.x - terrainSize, center.y - terrainSize * SQUISH_FACTOR, terrainSize * 2, terrainSize * 2);
    } else if (tile.terrain === 'lake') {
        ctx.drawImage(cachedImages['coast'], center.x - terrainSize, center.y - terrainSize * SQUISH_FACTOR, terrainSize * 2, terrainSize * 2);
    }

    ctx.strokeStyle = (getSelectedTile() === tile) ? "white" : "rgba(0,0,0,0.1)";
    ctx.lineWidth = (getSelectedTile() === tile) ? 3 : 1;
    ctx.stroke();

    ctx.restore();
}

function drawHills(tile: Tile) {
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);
    const hillSize = hexRadius * RENDER_SIZES.HILL;

    if (cachedImages[`${tile.terrain}_hill`] && tile.hill) {
        ctx.drawImage(cachedImages[`${tile.terrain}_hill`], center.x - hillSize, center.y - hillSize, hillSize * 2, hillSize * 2);
    }
}

function drawFeatures(tile: Tile) {
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);
    const featureSize = hexRadius * RENDER_SIZES.FEATURE;

    // don't draw the feature if there's a district
    if (tile.district !== "none" && tile.feature !== 'floodplains') return;

    // Draw Feature
    if (tile.feature !== "none" && cachedImages[tile.feature]) {
        ctx.drawImage(cachedImages[tile.feature], center.x - featureSize, center.y - featureSize, featureSize * 2, featureSize * 2);
    }

    // Draw Mountain
    if (cachedImages[`${tile.terrain}_mountain_${tile.mountain_no}`] && tile.mountain) {
        ctx.drawImage(cachedImages[`${tile.terrain}_mountain_${tile.mountain_no}`], center.x - featureSize, center.y - featureSize, featureSize * 2, featureSize * 2);
    }
}

function drawDistricts(tile: Tile) {
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);
    const districtSize = hexRadius * RENDER_SIZES.DISTRICT;

    if (tile.district && tile.district !== 'none' && cachedImages[tile.district]) {
        let scale = 1.0;
        if (tile.district === 'dam') scale = DISTRICT_SCALE_OVERRIDES.DAM;
        else if (tile.district === 'canal') scale = DISTRICT_SCALE_OVERRIDES.CANAL;
        else if (tile.district === 'government_plaza') scale = DISTRICT_SCALE_OVERRIDES.GOVERNMENT_PLAZA;
        else if (tile.district === 'water_park') scale = DISTRICT_SCALE_OVERRIDES.WATER_PARK;
        else if (tile.district === 'diplomatic_quarter') scale = DISTRICT_SCALE_OVERRIDES.DIPLOMATIC_QUARTER;

        const scaledSize = districtSize * scale;
        ctx.drawImage(
            cachedImages[tile.district],
            center.x - scaledSize,
            center.y - scaledSize,
            scaledSize * 2,
            scaledSize * 2
        );
    }
}

function drawResources(tile: Tile) {
    if (tile.district !== 'none') return;
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);
    const renderSize = hexRadius * RENDER_SIZES.RESOURCE;
    const originalIconSize = ICON_SIZES.ORIGINAL;

    if (tile.resource !== "none") {

        if (tile.resource === 'maize' || tile.resource === 'honey') {
            ctx.drawImage(cachedImages[tile.resource], center.x - renderSize / 2, center.y - renderSize / 6, renderSize, renderSize);
        } else {
            const iconMap: resourceInfo = getResourceIndices(tile.resource);
            if (!iconMap.index || !iconMap.file) return;
            const sx = iconMap.index[1] * originalIconSize;
            const sy = iconMap.index[0] * originalIconSize;

            ctx.drawImage(
                cachedImages[iconMap.file],
                sx, sy, originalIconSize, originalIconSize,
                center.x - renderSize / 2,
                center.y + renderSize / 4,
                renderSize, renderSize
            );
        }
    }
}

function drawImprovements(tile: Tile) {
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);
    const improvementSize = hexRadius;
    if (tile.improvement !== 'none' && cachedImages[`${tile.improvement}`]) {
        ctx.drawImage(cachedImages[`${tile.improvement}`], center.x - improvementSize, center.y - improvementSize, improvementSize * 2, improvementSize * 2);
    }
}

function drawRivers(tile: Tile) {
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);

    ctx.lineCap = "round";
    ctx.lineWidth = hexRadius / 9;
    ctx.strokeStyle = "#2b5478";

    if (!tile.rivers) return;
    tile.rivers.forEach((hasRiver, i) => {
        if (hasRiver) {
            const startAngle = (Math.PI / 180) * (60 * i - 30);
            const endAngle = (Math.PI / 180) * (60 * (i + 1) - 30);

            ctx.beginPath();
            ctx.moveTo(
                center.x + hexRadius * Math.cos(startAngle),
                center.y + hexRadius * Math.sin(startAngle) * SQUISH_FACTOR
            );
            ctx.lineTo(
                center.x + hexRadius * Math.cos(endAngle),
                center.y + hexRadius * Math.sin(endAngle) * SQUISH_FACTOR
            );
            ctx.stroke();
        }
    });
}

function drawYields(tile: Tile) {
    if (tile.mountain) return;
    if (!tile.yields || Object.keys(tile.yields).length === 0) return;
    if (tile.district !== 'none') {
        const entries = Object.entries(tile.yields)
            .filter(([_, value]) => value > 0);

        entries.forEach(([yieldType, value], index) => {
            drawDistrictYieldBubble(tile, yieldType, value, index);
        });
    } else {
        drawTileYieldBubbles(tile);
    }
}

function getGridDimensions(count: number) {
    if (count <= 3) return { cols: count, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    return { cols: 3, rows: 2 }; // 5–6
}

function drawTileYieldBubbles(tile: Tile) {
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);

    const entries = Object.entries(tile.yields)
        .filter(([_, value]) => value > 0);

    if (entries.length === 0) return;

    const drawnIconSize = ICON_SIZES.YIELD_DRAWN;
    const gap = 2;

    const { cols, rows } = getGridDimensions(entries.length);

    const gridWidth =
        cols * drawnIconSize + (cols - 1) * gap;
    const gridHeight =
        rows * drawnIconSize + (rows - 1) * gap;

    const gridStartX = center.x - gridWidth / 2;
    const gridStartY = center.y - gridHeight / 2;

    entries.forEach(([yieldType, value], index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const bx =
            gridStartX + col * (drawnIconSize + gap);
        const by =
            gridStartY + row * (drawnIconSize + gap);

        const YIELD_ICON_SIZE = ICON_SIZES.YIELD_ICON;
        const YIELD_ICON_GRID_SIZE = ICON_SIZES.YIELD_GRID;
        const YIELD_ICON_PADDING = ICON_SIZES.YIELD_PADDING;
        const iconIndex = getYieldIconIndex(yieldType);
        const sx = iconIndex * YIELD_ICON_GRID_SIZE + YIELD_ICON_PADDING;
        const sy = (value <= 5 ? value - 1 : 4) * YIELD_ICON_GRID_SIZE + YIELD_ICON_PADDING;

        ctx.drawImage(
            cachedImages['yields'],
            sx,
            sy,
            YIELD_ICON_SIZE,
            YIELD_ICON_SIZE,
            bx,
            by,
            drawnIconSize,
            drawnIconSize
        );
    });
}


function drawDistrictYieldBubble(
    tile: Tile,
    yieldType: string,
    value: number,
    index: number
) {
    const hexRadius = getHexRadius();
    const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);

    const bubbleWidth = ICON_SIZES.DISTRICT_BUBBLE_WIDTH;
    const bubbleHeight = ICON_SIZES.DISTRICT_BUBBLE_HEIGHT;
    const drawnIconSize = ICON_SIZES.DISTRICT_BUBBLE_ICON;

    const YIELD_ICON_SIZE = ICON_SIZES.LARGE_YIELD_ICON;
    const YIELD_ICON_GRID_SIZE = ICON_SIZES.YIELD_GRID;
    const YIELD_ICON_PADDING = ICON_SIZES.LARGE_YIELD_PADDING;

    // vertical stacking
    const verticalSpacing = 6;

    const bx = center.x - bubbleWidth / 2;
    const by =
        center.y +
        (hexRadius * SQUISH_FACTOR) -
        bubbleHeight * (1.5 + index) -
        index * verticalSpacing;

    // bubble
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleWidth, bubbleHeight, 5);
    ctx.fillStyle = "rgba(0, 15, 30, 0.85)";
    ctx.strokeStyle = "#133A46";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // icon
    const iconIndex = getYieldIconIndex(yieldType);
    const sx = iconIndex * YIELD_ICON_GRID_SIZE + YIELD_ICON_PADDING;

    ctx.drawImage(
        cachedImages['yields'],
        sx,
        YIELD_ICON_PADDING,
        YIELD_ICON_SIZE,
        YIELD_ICON_SIZE,
        bx,
        by + (bubbleHeight - drawnIconSize) / 2,
        drawnIconSize,
        drawnIconSize
    );

    // value
    ctx.fillStyle = "white";
    ctx.font = "bold 1rem sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
        `+${value}`,
        bx + drawnIconSize,
        by + bubbleHeight / 2 + 1
    );
}
