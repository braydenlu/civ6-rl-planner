import {
    getGrid, getHexRadius,
    getRadius,
    getSelectedTile,
    setSelectedTile,
    SQUISH_FACTOR, Tile, tryPlaceDistrict,
    updateState,
    updateVisuals
} from "./state.js";
import {hexToPixel, pixelToHex} from "./utils.js";
import {shortcutMode, updateShortcutLegend} from "./inspector.js";
import {render} from "./renderer.js";
import {SHORTCUT_MAPS} from "./consts.js";

type ShortcutHandler = (tile: Tile, value: string) => void;

const SHORTCUT_HANDLERS: Record<string, {
    map: Record<string, string>;
    apply: ShortcutHandler;
}> = {
    terrainShortcutMode: {
        map: SHORTCUT_MAPS.terrainShortcutMode,
        apply: (tile, value) => {
            tile.terrain = value;
            updateState();
        }
    },

    featureShortcutMode: {
        map: SHORTCUT_MAPS.featureShortcutMode,
        apply: (tile, value) => {
            tile.feature = value;
            updateState();
        }
    },

    districtShortcutMode: {
        map: SHORTCUT_MAPS.districtShortcutMode,
        apply: (tile, value) => {
            tryPlaceDistrict(tile, value);
        }
    },

    resourceShortcutMode: {
        map: SHORTCUT_MAPS.resourceShortcutMode,
        apply: (tile, value) => {
            tile.resource = value;
            updateState();
        }
    },

    improvementShortcutMode: {
        map: SHORTCUT_MAPS.improvementShortcutMode,
        apply: (tile, value) => {
            tile.improvement = value;
            updateState();
        }
    }
};

export function setupInput(canvas: HTMLCanvasElement) {
    const modeSelect = document.getElementById('shortcutModeSelect');
    modeSelect!.addEventListener('change', updateShortcutLegend);
    updateShortcutLegend();

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const hex = pixelToHex(e.clientX - rect.left, e.clientY - rect.top, SQUISH_FACTOR, getHexRadius(), canvas);
        const key = `${hex.q},${hex.r}`;

        if (getGrid()[key]) {
            setSelectedTile(getGrid()[key]);
            updateVisuals();
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        const hexRadius = getHexRadius();
        const riverCheckbox = document.getElementById('riverCheckbox') as HTMLInputElement | null;
        if (!riverCheckbox || !riverCheckbox.checked) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const hex = pixelToHex(x, y, SQUISH_FACTOR, hexRadius, canvas);
        const tile = getGrid()[`${hex.q},${hex.r}`];

        if (tile) {
            const center = hexToPixel(tile.q, tile.r, SQUISH_FACTOR, hexRadius, canvas);

            const dy = (y - center.y) / SQUISH_FACTOR;
            const dx = x - center.x;

            let angle = Math.atan2(dy, dx) * (180 / Math.PI);

            let normalizedAngle = (angle + 30);
            if (normalizedAngle < 0) normalizedAngle += 360;

            const edgeIndex = Math.floor((normalizedAngle % 360) / 60);

            tile.toggleRiver(edgeIndex);
            render();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (
            e.target instanceof Element &&
            (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')
        ) return;

        const handler = SHORTCUT_HANDLERS[shortcutMode];
        if (!handler) return;

        const selectedTile = getSelectedTile();
        if (!selectedTile) return;

        const key = e.key.toLowerCase();
        const value = handler.map[key];
        if (!value) return;

        handler.apply(selectedTile, value);
    });


    document.addEventListener('keydown', (e) => {
        if (e.target instanceof Element && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        const selectedTile = getSelectedTile();
        if (!selectedTile) return;
        if (shortcutMode !== 'hills_mountainsShortcutMode') return;

        const checkbox: string = SHORTCUT_MAPS.hills_mountainsShortcutMode[e.key.toLowerCase()];
        if (!checkbox) return;

        const checkboxElement: HTMLElement | null = document.getElementById(checkbox);
        if (checkboxElement instanceof HTMLInputElement) {
            checkboxElement.checked = !checkboxElement.checked;
            if (checkbox === 'hillCheckbox') selectedTile.hill = checkboxElement.checked;
            if (checkbox === 'mountainCheckbox') selectedTile.mountain = checkboxElement.checked;
            updateState();
        }
    })

    document.addEventListener('keydown', (e) => {
        const selectedTile = getSelectedTile();
        if (!selectedTile) return;
        if (e.target instanceof Element && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

        let nextQ = selectedTile.q;
        let nextR = selectedTile.r;

        switch (e.key) {
            case "ArrowUp":
                nextR -= 1;
                break;
            case "ArrowDown":
                nextR += 1;
                break;
            case "ArrowLeft":
                nextQ -= 1;
                break;
            case "ArrowRight":
                nextQ += 1;
                break;
            default:
                return;
        }

        if (nextQ < -getRadius()) {
            nextQ = -getRadius();
        } else if (nextQ > getRadius()) {
            nextQ = getRadius();
        }
        if (nextR < -getRadius()) {
            nextR = -getRadius();
        } else if (nextR > getRadius()) {
            nextR = getRadius();
        }

        const targetKey = `${nextQ},${nextR}`;
        if (getGrid()[targetKey]) {
            e.preventDefault();
            setSelectedTile(getGrid()[targetKey]);
            updateVisuals();
        }
    });
}
