import { loadAssets}  from "./assets.js";
import {initRenderer, render, resizeRenderer} from "./renderer.js";
import {initGrid, loadMap, saveMap, sendMapToBackend, updateState} from "./state.js";
import {setupInput} from "./input.js";
import {attachInspectorListeners} from "./inspector.js";

const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const images: Record<string, HTMLImageElement> = {};

document.addEventListener('DOMContentLoaded', () => {
    initGrid();

    const handleResize = () => {
        resizeRenderer();
        render();
    };

    loadAssets(images, () => {
        initRenderer(canvas, images);
        resizeRenderer();
        setupInput(canvas);
        updateState();
        attachInspectorListeners();
        window.addEventListener('resize', handleResize);
    });
});

document.getElementById('saveBtn')!.onclick = () => saveMap();

document.getElementById('loadBtn')!.onclick = () => {
    document.getElementById('fileInput')!.click();
};

document.getElementById('aiBtn')!.onclick = () => sendMapToBackend();

document.getElementById('fileInput')!.onchange = (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files![0];
    const reader = new FileReader();
    reader.onload = (event) => {
        loadMap(event.target!.result as string);
        render(); // Re-draw the map immediately after loading
    };
    reader.readAsText(file);
};
