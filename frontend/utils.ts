import {Tile} from "./state.js";

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function hexToPixel(q: number, r: number, SQUISH_FACTOR: number, SIZE: number, canvas: HTMLCanvasElement) {
    let x = SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    let y = SIZE * (3 / 2 * r) * SQUISH_FACTOR;
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    return { x: x + width / 2, y: y + height / 2 };
}

export function pixelToHex(x: number, y: number, SQUISH_FACTOR: number, SIZE: number, canvas: HTMLCanvasElement) {
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    let dx = x - width / 2;
    let dy = (y - height / 2) / SQUISH_FACTOR;

    let q = (Math.sqrt(3) / 3 * dx - 1 / 3 * dy) / SIZE;
    let r = (2 / 3 * dy) / SIZE;
    return hexRound(q, r);
}

export function hexRound(q: number, r: number) {
    let s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    let q_diff = Math.abs(rq - q);
    let r_diff = Math.abs(rr - r);
    let s_diff = Math.abs(rs - s);

    if (q_diff > r_diff && q_diff > s_diff) rq = -rr - rs;
    else if (r_diff > s_diff) rr = -rq - rs;

    return { q: rq, r: rr };
}

export function getHexDistance(tile1 : Tile, tile2 : Tile): number {
    return (Math.abs(tile1.q - tile2.q) +
        Math.abs(tile1.q + tile1.r - tile2.q - tile2.r) +
        Math.abs(tile1.r - tile2.r)) / 2;
}

export function getEdgeIndex(dq: number, dr: number): number {
    if (dq === 1 && dr === 0) return 0;
    if (dq === 0 && dr === 1) return 1;
    if (dq === -1 && dr === 1) return 2;
    if (dq === -1 && dr === 0) return 3;
    if (dq === 0 && dr === -1) return 4;
    if (dq === 1 && dr === -1) return 5;

    return -1;
}

export function toTitleCase(str: string): string {
    return str
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}

export function sortArray<T extends string>(arr: T[]): T[] {
    return [...arr].sort((a, b) => a.localeCompare(b));
}

export function sortObject<T extends Record<string, any>>(obj: T): T {
    return Object.fromEntries(
        Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
    ) as T;
}
