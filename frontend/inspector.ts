import {
    getSelectedTile,
    getBrush,
    setBrush,
    getScience,
    getCulture,
    getFaith,
    getGold,
    getProduction,
    getIsScoring,
    getScoreError,
    updateState,
    tryPlaceDistrict,
    tryPlaceImprovement, Tile, getFood
} from "./state.js";
import {EditableTileProperty, INSPECTOR_CONFIG, SHORTCUT_MAPS} from "./consts.js";
import {toTitleCase} from "./utils.js";
import {canPlaceDistrict, canPlaceImprovement} from "./placementValidation.js";
import {getResourceIndices} from "./assets.js";

export let shortcutMode = 'none';


export function updateInspector() {
    updateYields();
    const tile = getSelectedTile();
    if (!tile) return;

    const content = document.getElementById('inspector-content');

    content!.innerHTML = `
        <div class="space-y-4">
            <div class="pb-3 border-b border-slate-700">
                <h4 class="text-lg font-display font-semibold text-civ-accent">Tile (${tile.q}, ${tile.r})</h4>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-300">Terrain</label>
                ${generateDropdownHTML('terrainSelect', INSPECTOR_CONFIG.terrain, tile.terrain, tile)}
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-300">Feature</label>
                ${generateDropdownHTML('featureSelect', INSPECTOR_CONFIG.feature, tile.feature, tile)}
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-300">District</label>
                ${generateDropdownHTML('districtSelect', INSPECTOR_CONFIG.district, tile.district, tile)}
            </div>

            <div class="space-y-1">
                <label class="block text-sm font-semibold text-slate-300">Resource</label>
                ${generateDropdownHTML('resourceSelect', INSPECTOR_CONFIG.resource, tile.resource, tile)}

                <div class="text-xs text-slate-500 ml-1">
                    Type: <span class="text-slate-400">${toTitleCase(tile.resourceType)}</span>
                </div>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-300">Improvement</label>
                ${generateDropdownHTML('improvementSelect', INSPECTOR_CONFIG.improvement, tile.improvement, tile)}
            </div>

            <div class="flex gap-4 pt-2">
                <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" id="hillCheckbox" ${tile.hill ? 'checked' : ''} class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800 cursor-pointer">
                    <span>Hill</span>
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" id="mountainCheckbox" ${tile.mountain ? 'checked' : ''} class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800 cursor-pointer">
                    <span>Mountain</span>
                </label>
            </div>

            <div class="pt-2">
                <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" id="riverCheckbox" ${getBrush() == 'river' ? 'checked' : ''} class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800 cursor-pointer">
                    <span>Draw River</span>
                </label>
            </div>

            <div class="pt-2 mt-5 border-t border-slate-700">
                <label class="mt-2 block text-sm font-semibold text-slate-300">Tile Yields</label>
                <div class="mt-2 px-3 py-2 bg-slate-900/60 rounded border border-slate-700">
                    ${getIsScoring() ? '<span class="text-sm text-slate-400">Calculating...</span>' : generateYieldsHTML(tile)}
                </div>
            </div>
        </div>
    `;
}

export function attachInspectorListeners() {
    const container = document.getElementById('inspector-content');

    container?.addEventListener('change', (e) => {
        const tile = getSelectedTile();
        if (!tile) return;

        const target = e.target as HTMLInputElement;
        const value = target.type === 'checkbox' ? target.checked : target.value;

        const propertyMap: Record<string, EditableTileProperty> = {
            'terrainSelect': 'terrain',
            'featureSelect': 'feature',
            'districtSelect': 'district',
            'resourceSelect': 'resource',
            'improvementSelect': 'improvement',
            'hillCheckbox': 'hill',
            'mountainCheckbox': 'mountain'
        };

        if (target.id === 'districtSelect') {
            if (!tryPlaceDistrict(tile, value as string)) {
                target.value = tile.district;
            }
            return;
        }

        if (target.id === 'improvementSelect') {
            if (!tryPlaceImprovement(tile, value as string)) {
                target.value = tile.improvement;
            }
            return;
        }

        const property = propertyMap[target.id];
        if (property) {
            (tile[property] as any) = value;
        }

        if (target.id === 'riverCheckbox') {
            setBrush(value ? 'river' : 'select');
        }

        if (target.id === 'resourceSelect') {
            tile.resourceType = getResourceIndices(value as string).resourceType;
        }

        if (property === 'hill' && value) tile.mountain = false;
        if (property === 'mountain' && value) tile.hill = false;

        updateState();
        updateInspector();
    })
}

function generateDropdownHTML(
    id: string,
    list: string[],
    currentValue: string,
    tile: Tile
) {
    const options = list.map(item => {
        const label = item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const selected = item === currentValue ? 'selected' : '';
        let isValid = true;
        if (id == 'districtSelect') {
            isValid = tile ? canPlaceDistrict(tile, item) : true;
        } else if (id == 'improvementSelect') {
            isValid = tile ? canPlaceImprovement(tile, item) : true;
        }
        return `<option value="${item}" ${isValid ? '' : 'disabled'} ${selected}>${label}</option>`;
    }).join('');

    return `<select id="${id}" class="w-full py-2 px-3 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm font-medium cursor-pointer hover:bg-slate-600 focus:outline-none focus:border-teal-500 transition-colors">${options}</select>`;
}

function generateYieldsHTML(tile: Tile) {
    if (Object.keys(tile.yields).length == 0) {
        return `<div class="flex justify-between text-sm">
                <span class="text-slate-400">None</span>
                </div>`
    }
    return Object.entries(tile.yields)
        .map(([key, value]) => `
        <div class="flex justify-between text-sm">
            <span class="text-slate-400">${toTitleCase(key)}</span>
            <span class="text-slate-200 font-semibold">+${value}</span>
        </div>
    `)
        .join('');
}

function updateYields() {
    const errorMessage = getScoreError();
    const statusText = getIsScoring()
        ? '<div class="text-xs text-slate-400 mb-2">Calculating...</div>'
        : (errorMessage ? `<div class="text-xs text-amber-400 mb-2">Error: ${errorMessage}</div>` : '');
    document.getElementById('yields')!.innerHTML = `
        ${statusText}
        <div class="space-y-1.5">
            <div class="flex justify-between items-center">
                <span class="text-sm text-slate-400">Science:</span>
                <span class="text-sm font-semibold text-slate-200">${getScience()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-slate-400">Culture:</span>
                <span class="text-sm font-semibold text-slate-200">${getCulture()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-slate-400">Faith:</span>
                <span class="text-sm font-semibold text-slate-200">${getFaith()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-slate-400">Gold:</span>
                <span class="text-sm font-semibold text-slate-200">${getGold()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-slate-400">Production:</span>
                <span class="text-sm font-semibold text-slate-200">${getProduction()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-slate-400">Food:</span>
                <span class="text-sm font-semibold text-slate-200">${getFood()}</span>
            </div>
        </div>
    `;
}

export function updateShortcutLegend() {
    const shortcutModeSelect = document.getElementById('shortcutModeSelect') as HTMLInputElement;
    const mode = shortcutModeSelect.value;
    shortcutMode = mode;
    const legendUI = document.getElementById('shortcutLegendList');

    legendUI!.innerHTML = '';

    if (mode === 'none' || !SHORTCUT_MAPS[mode]) {
        legendUI!.innerHTML = '<li>Arrow Keys: Move</li>';
        return;
    }

    const shortcuts = SHORTCUT_MAPS[mode];
    const sortedShortcuts = Object.entries(shortcuts)
    .sort(([, a], [, b]) => a.localeCompare(b));

    for (const [key, label] of sortedShortcuts) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${key.toUpperCase()}</strong>: ${formatShortcutLabel(label)}`;
        legendUI!.appendChild(li);
    }


    const moveLi = document.createElement('li');
    moveLi.innerText = 'Arrow Keys: Move';
    legendUI!.appendChild(moveLi);
}

function formatShortcutLabel(label: string) {
    return toTitleCase(label.replace(/Checkbox$/, ''));
}
