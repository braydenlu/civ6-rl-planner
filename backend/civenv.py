import copy
import random
from typing import Any, cast

import gymnasium as gym
import numpy as np
import numpy.typing as npt
from gymnasium import Space, spaces

from backend.logger import setup_logger
from backend.models.civmap import CivMap, Tile
from backend.models.int_enums import District, Feature, Resource, ResourceType, Terrain
from backend.placement.district_placement_rules import (
    DISTRICT_TO_PLACEMENT_CLASS,
    PlacementClass,
)
from backend.placement.district_validation import can_place_district
from backend.yields.yield_logic import YieldDict, get_base_city_housing, get_score, get_tile_score

from .utils import get_hex_distance
from .yields.district_adjacency_rules import YieldType

logger = setup_logger(__name__)


def sum_score(score_summary: dict[YieldType, float]) -> float:
    assert isinstance(score_summary, dict)

    scores = cast(YieldDict, cast(object, score_summary))
    return float(sum(scores.values()))


class CivEnv(gym.Env[npt.NDArray[np.float32], int]):
    offset: int
    current_civ_map: CivMap
    last_yield: float
    template_maps: list[CivMap] | None

    _hex_dist_cache: dict[tuple[int, int, int, int], int]
    _district_tile_only_cache: dict[tuple[PlacementClass, Terrain, bool, bool, Feature, ResourceType], bool]
    _district_neighbor_cache: dict[
        tuple[
            PlacementClass,
            tuple[Terrain, ...],
            tuple[Feature, ...],
            Terrain,
            bool,
            bool,
            Feature,
            ResourceType,
        ],
        bool,
    ]

    _tile_mask_cache: dict[tuple[frozenset[tuple[tuple[int, int], District]], District], npt.NDArray[Any]]
    _score_cache: dict[frozenset[tuple[tuple[int, int], District]], float]
    _action_mask_cache: dict[frozenset[tuple[tuple[int, int], District]], npt.NDArray[Any]]
    _current_sig: frozenset[tuple[tuple[int, int], District]]

    action_space: Space[int]

    def __init__(self, template_maps: list[CivMap] | None = None):
        super().__init__()
        self.last_yield = 0
        self.template_maps = template_maps

        self._hex_dist_cache = {}
        self._district_tile_only_cache = {}
        self._district_neighbor_cache = {}
        self._score_cache = {}
        self._tile_mask_cache = {}
        self._action_mask_cache = {}
        self._current_sig = frozenset()

        self.init_map()

        assert self.current_civ_map is not None
        self.tile_keys = list(self.current_civ_map.get_keys())
        self.n_tiles = len(self.tile_keys)  # Should be 61

        self.district_list = list(District)
        self.terrain_list = list(Terrain)
        self.feature_list = list(Feature)
        self.resource_list = list(Resource)
        self.resourceType_list = list(ResourceType)

        self.terrain_idx = {t: i for i, t in enumerate(self.terrain_list)}
        self.feature_idx = {f: i for i, f in enumerate(self.feature_list)}
        self.district_idx = {d: i for i, d in enumerate(self.district_list)}
        self.resource_idx = {r: i for i, r in enumerate(self.resource_list)}
        self.resource_type_idx = {rt: i for i, rt in enumerate(self.resourceType_list)}

        self.terrain_base = 0
        self.feature_base = self.terrain_base + len(self.terrain_list)
        self.district_base = self.feature_base + len(self.feature_list)
        self.resource_base = self.district_base + len(self.district_list)
        self.resource_type_base = self.resource_base + len(self.resource_list)
        self.binary_base = self.resource_type_base + len(self.resourceType_list)

        self.placeable_districts = [d for d in District if d is not District.NONE]
        self.action_space = spaces.Discrete(len(self.placeable_districts) * self.n_tiles)

        # terrains, features, district, resources, resourceTypes, is hill, is mountain, river edges, is withinCity
        self.num_observation_channels = (
            len(self.terrain_list)
            + len(self.feature_list)
            + len(District)
            + len(self.resource_list)
            + len(self.resourceType_list)
            + 4
        )

        self.observation_space = spaces.Box(
            low=0.0,
            high=1.0,
            shape=(self.num_observation_channels, 9, 9),
            dtype=np.float32,
        )

        self.offset = 4

    def init_map(self) -> None:
        if self.template_maps is None:
            civ_map = CivMap()
            self.template_maps = [civ_map]
            civ_map.create_empty_map()
            self.current_civ_map = civ_map
        else:
            base_map = random.choice(self.template_maps)
            self.current_civ_map = copy.deepcopy(base_map)

    def get_cached_score(self) -> float:
        sig = self._current_sig
        if sig not in self._score_cache:
            self._score_cache[sig] = sum_score(get_score(self.current_civ_map.tiles).summary)
        return self._score_cache[sig]

    def get_cached_can_place_district(self, district: District, tile_key: tuple[int, int]) -> bool:
        tile = self.current_civ_map.tiles[tile_key]

        if district is not District.CITY_CENTER and not tile.withinCityLimits:
            return False

        placement_class = DISTRICT_TO_PLACEMENT_CLASS[district]

        if (
            placement_class == PlacementClass.STANDARD
            or placement_class == PlacementClass.COAST
            or placement_class == PlacementClass.AERIAL
            or placement_class == PlacementClass.CITY_CENTER
        ):
            tile_only_key = (
                placement_class,
                tile.terrain,
                tile.hill,
                tile.mountain,
                tile.feature,
                tile.resourceType,
            )

            return self._district_tile_only_cache.setdefault(
                tile_only_key,
                can_place_district(district, self.current_civ_map.tiles, tile_key),
            )

        elif placement_class == PlacementClass.PRESERVE or placement_class == PlacementClass.ENCAMPMENT:
            neighbors = tile.get_neighbors(self.current_civ_map.tiles)
            neighbor_key = (
                placement_class,
                tuple(n.terrain for n in neighbors),
                tuple(n.feature for n in neighbors),
                tile.terrain,
                tile.hill,
                tile.mountain,
                tile.feature,
                tile.resourceType,
            )

            return self._district_neighbor_cache.setdefault(
                neighbor_key,
                can_place_district(district, self.current_civ_map.tiles, tile_key),
            )
        else:
            return can_place_district(district, self.current_civ_map.tiles, tile_key)

    def grid_signature(self) -> frozenset[tuple[tuple[int, int], District]]:
        return frozenset((k, t.district) for k, t in self.current_civ_map.tiles.items() if t.district != District.NONE)

    def get_cached_hex_dist(self, t1: Tile, t2: Tile) -> int:
        key = (t1.q, t1.r, t2.q, t2.r)
        if key not in self._hex_dist_cache:
            self._hex_dist_cache[key] = get_hex_distance(t1, t2)
        return self._hex_dist_cache[key]

    def _get_obs(self) -> npt.NDArray[np.float32]:
        obs = np.zeros((self.num_observation_channels, 9, 9), dtype=np.float32)

        for tile in self.current_civ_map.tiles.values():
            x = tile.q + self.offset
            y = tile.r + self.offset

            obs[self.terrain_base + self.terrain_idx[tile.terrain], x, y] = 1
            obs[self.feature_base + self.feature_idx[tile.feature], x, y] = 1
            obs[self.district_base + self.district_idx[tile.district], x, y] = 1
            obs[self.resource_base + self.resource_idx[tile.resource], x, y] = 1
            obs[
                self.resource_type_base + self.resource_type_idx[tile.resourceType],
                x,
                y,
            ] = 1

            obs[self.binary_base : self.binary_base + 4, x, y] = (
                tile.hill,
                tile.mountain,
                any(tile.rivers),
                tile.withinCityLimits,
            )

        return obs

    def step(self, action: int) -> tuple[npt.NDArray[np.float32], float, bool, bool, dict[str, Any]]:
        district_idx = action // self.n_tiles
        tile_idx = action % self.n_tiles

        district = self.placeable_districts[district_idx]
        tile_key = self.tile_keys[tile_idx]
        tile = self.current_civ_map.tiles[tile_key]

        tile.district = district
        self._current_sig = self.grid_signature()

        if district == District.CITY_CENTER:
            self.current_civ_map.make_city((tile.q, tile.r))
        elif len(self.current_civ_map.cities) > 0:
            # Add district to the single city
            self.current_civ_map.cities[0].add_district(district)

        new_total = self.get_cached_score()
        base_reward = new_total - self.last_yield

        if district == District.CITY_CENTER:
            reward = (
                (base_reward * 0.1)
                + (sum(get_tile_score(tile).values()) * 2)
                + get_base_city_housing(tile, self.current_civ_map)
            )
        else:
            reward = base_reward + 2
        self.last_yield = new_total

        terminated = not self.action_mask().any()

        obs = self._get_obs()

        return (
            obs,
            reward,
            terminated,
            False,
            {
                "district_mask": self.district_mask(),
                "tile_mask": self.tile_mask(district),
            },
        )

    def action_mask(self) -> npt.NDArray[Any]:
        sig = self._current_sig
        if sig in self._action_mask_cache:
            return self._action_mask_cache[sig]

        mask = np.zeros(len(self.placeable_districts) * self.n_tiles, dtype=bool)

        district_mask = self.district_mask()

        for district_idx, district in enumerate(self.placeable_districts):
            if not district_mask[district_idx]:
                continue

            t_mask = self.tile_mask(district)

            base = district_idx * self.n_tiles
            mask[base : base + self.n_tiles] = t_mask

        self._action_mask_cache[sig] = mask
        return mask

    def district_mask(self) -> npt.NDArray[Any]:
        mask = np.zeros(len(self.placeable_districts), dtype=bool)

        existing = set()
        has_city = len(self.current_civ_map.cities) > 0
        if has_city:
            city = self.current_civ_map.cities[0]
            existing = {District(i) for i, built in enumerate(city.districts_built) if built}

        for i, d in enumerate(self.placeable_districts):
            if d in existing:
                continue
            if d is District.CITY_CENTER and has_city:
                continue
            if d is not District.CITY_CENTER and not has_city:
                continue

            mask[i] = True
        return mask

    def tile_mask(self, district: District) -> npt.NDArray[Any]:
        sig = (self._current_sig, district)
        if sig in self._tile_mask_cache:
            return self._tile_mask_cache[sig]

        mask = np.zeros(self.n_tiles, dtype=bool)

        if self.current_civ_map.cities:
            search_indices = [i for i, k in enumerate(self.tile_keys) if self.current_civ_map.tiles[k].withinCityLimits]
        else:
            search_indices = list(range(self.n_tiles))

        for idx in search_indices:
            tile = self.current_civ_map.tiles[self.tile_keys[idx]]

            if tile.district != District.NONE:
                continue

            if self.get_cached_can_place_district(district, self.tile_keys[idx]):
                mask[idx] = True

        self._tile_mask_cache[sig] = mask
        return mask

    def reset(
        self, seed: int | None = None, options: dict[str, Any] | None = None
    ) -> tuple[npt.NDArray[np.float32], dict[Any, Any]]:
        super().reset(seed=seed)
        self.init_map()

        self.last_yield = 0
        self._score_cache.clear()
        self._action_mask_cache.clear()
        self._tile_mask_cache.clear()
        self._current_sig = frozenset()

        return self._get_obs(), {}
