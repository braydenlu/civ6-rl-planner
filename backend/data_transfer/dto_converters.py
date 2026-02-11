from backend.data_transfer.tile_string import TileString
from backend.models.civmap import CivMap, Tile
from backend.models.int_enums import (
    District,
    Feature,
    Improvement,
    Resource,
    ResourceType,
    Terrain,
)
from backend.models.string_enums import (
    DistrictString,
    FeatureString,
    ImprovementString,
    ResourceString,
    ResourceTypeString,
    TerrainString,
)
from backend.utils import get_tuple_from_string, yield_dict_to_string
from backend.yields.district_adjacency_rules import YieldType
from backend.yields.yield_logic import get_score


def convert_dto_grid_to_grid(dto: dict[str, TileString]) -> dict[tuple[int, int], Tile]:
    converted_grid: dict[tuple[int, int], Tile] = {}

    for key_string, tile_string in dto.items():
        key = get_tuple_from_string(key_string)
        converted_grid[key] = Tile(
            q=tile_string.q,
            r=tile_string.r,
            terrain=Terrain[tile_string.terrain.value.upper()],
            hill=tile_string.hill,
            mountain=tile_string.mountain,
            mountain_no=tile_string.mountain_no,
            feature=Feature[tile_string.feature.value.upper()],
            district=District[tile_string.district.value.upper()],
            resource=Resource[tile_string.resource.value.upper()],
            resourceType=ResourceType[tile_string.resourceType.value.upper()],
            improvement=Improvement[tile_string.improvement.value.upper()],
            rivers=tile_string.rivers,
            withinCityLimits=tile_string.withinCityLimits,
            city=None,
        )

    return converted_grid


def convert_dto_grid_to_map(dto: dict[str, TileString]) -> CivMap:
    civ_map = CivMap()

    city_center: Tile | None = None
    for key_string, tile_string in dto.items():
        key = get_tuple_from_string(key_string)
        district = District[tile_string.district.value.upper()]

        civ_map.tiles[key] = Tile(
            q=tile_string.q,
            r=tile_string.r,
            terrain=Terrain[tile_string.terrain.value.upper()],
            hill=tile_string.hill,
            mountain=tile_string.mountain,
            mountain_no=tile_string.mountain_no,
            feature=Feature[tile_string.feature.value.upper()],
            district=district,
            resource=Resource[tile_string.resource.value.upper()],
            resourceType=ResourceType[tile_string.resourceType.value.upper()],
            improvement=Improvement[tile_string.improvement.value.upper()],
            rivers=tile_string.rivers,
            withinCityLimits=tile_string.withinCityLimits,
            city=None,
        )

        if district == District.CITY_CENTER:
            city_center = civ_map.tiles[key]

    if city_center is not None:
        civ_map.make_city((city_center.q, city_center.r), allow_overwrite=True)

    return civ_map


def convert_grid_to_dto(grid: dict[tuple[int, int], Tile]) -> dict[str, TileString]:
    dto: dict[str, TileString] = {}

    for key, tile in grid.items():
        key_string = f"{tile.q},{tile.r}"
        dto[key_string] = TileString(
            q=tile.q,
            r=tile.r,
            terrain=TerrainString(Terrain(tile.terrain.value).name.lower()),
            hill=tile.hill,
            mountain=tile.mountain,
            mountain_no=tile.mountain_no,
            feature=FeatureString(Feature(tile.feature.value).name.lower()),
            district=DistrictString(District(tile.district.value).name.lower()),
            resource=ResourceString(Resource(tile.resource.value).name.lower()),
            resourceType=ResourceTypeString(ResourceType(tile.resourceType.value).name.lower()),
            improvement=ImprovementString(Improvement(tile.improvement.value).name.lower()),
            yields={},
            rivers=tile.rivers,
            withinCityLimits=tile.withinCityLimits,
        )

    tile_results: dict[str, dict[YieldType, float]] = get_score(grid).tiles
    for tile_key, yield_info in tile_results.items():
        dto[tile_key].yields = yield_dict_to_string(yield_info, floor_values=True)

    return dto
