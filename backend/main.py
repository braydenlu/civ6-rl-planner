import math
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sb3_contrib import MaskablePPO

from backend.yields.yield_logic import get_score

from .civenv import CivEnv
from .data_transfer.dto_converters import (
    convert_dto_grid_to_grid,
    convert_dto_grid_to_map,
    convert_grid_to_dto,
)
from .data_transfer.tile_string import TileString
from .utils import enum_to_str, yield_dict_to_string

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR.parent / "static"),
    name="static",
)


@app.get("/", response_class=FileResponse)
async def read_index() -> FileResponse:
    index_path = BASE_DIR.parent / "index.html"
    return FileResponse(index_path)


MODEL_PATH = BASE_DIR.parent / "agents" / "civ_agent_v1.0"
MODEL: MaskablePPO | None = None


def get_model() -> MaskablePPO:
    global MODEL
    if MODEL is None:
        MODEL = MaskablePPO.load(MODEL_PATH)
    return MODEL


@app.post("/analyze-map", response_model=dict[str, TileString])
async def analyze_map(grid: dict[str, TileString]) -> dict[str, TileString]:
    model = get_model()

    # eval_env = CivEnv([convert_dto_grid_to_grid(grid)])
    eval_env = CivEnv([convert_dto_grid_to_map(grid)])
    obs, _ = eval_env.reset()

    terminated = False
    truncated = False

    while not (terminated or truncated):
        action_masks = eval_env.action_mask()
        action, _states = model.predict(obs, action_masks=action_masks, deterministic=True)
        obs, reward, terminated, truncated, info = eval_env.step(action)

    return convert_grid_to_dto(eval_env.current_civ_map.tiles)


@app.post("/calculate", response_model=dict[str, dict[str, int] | dict[str, dict[str, float]]])
async def calculate_score(grid: dict[str, TileString]) -> dict[str, dict[str, int] | dict[str, dict[str, float]]]:
    score = get_score(convert_dto_grid_to_grid(grid))
    summary_out: dict[str, int] = {}
    for yield_type, value in score.summary.items():
        summary_out[enum_to_str(yield_type)] = math.floor(value)

    tiles_out: dict[str, dict[str, float]] = {}
    for tile_key, info in score.tiles.items():
        tiles_out[tile_key] = yield_dict_to_string(info, floor_values=True)

    return {
        "summary": summary_out,
        "tiles": tiles_out,
    }
