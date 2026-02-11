import json
import math
from enum import Enum

from backend.logger import setup_logger
from backend.models.civmap import CivMap, Tile
from backend.yields.district_adjacency_rules import YieldType

logger = setup_logger(__name__)


def get_hex_distance(tile1: Tile, tile2: Tile) -> int:
    return (abs(tile1.q - tile2.q) + abs(tile1.q + tile1.r - tile2.q - tile2.r) + abs(tile1.r - tile2.r)) // 2


def load_map_from_json(filename: str) -> CivMap:
    with open(filename, "r") as f:
        data = json.load(f)

    civ_map = CivMap()

    for key_string, tile_dict in data.items():
        key = get_tuple_from_string(key_string)

        try:
            civ_map.tiles[key] = Tile.model_validate(tile_dict)
        except Exception as e:
            logger.error(f"Failed to validate tile at {key}: {e}")

    return civ_map


def get_tuple_from_string(key_string: str) -> tuple[int, int]:
    q_str, r_str = key_string.split(",")
    return int(q_str), int(r_str)


def enum_to_str(e: Enum) -> str:
    if e is None:
        return "none"
    if isinstance(e, Enum):
        return e.name.lower()
    return str(e)


def yield_dict_to_string(
    d: dict[YieldType, float],
    *,
    floor_values: bool = False,
) -> dict[str, float]:
    out: dict[str, float] = {}
    for y, v in d.items():
        value = math.floor(v) if floor_values else v
        if value > 0:
            out[y.name.lower()] = value
    return out
