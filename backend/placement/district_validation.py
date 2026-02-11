from ..models.civmap import Tile
from ..models.int_enums import District, Feature, Terrain
from .district_placement_rules import DISTRICT_TO_PLACEMENT_CLASS, PLACEMENT_CLASSES

Coordinate = tuple[int, int]


def can_place_district(district: District, grid: dict[Coordinate, Tile], key: Coordinate) -> bool:
    tile = grid[key]
    rules = PLACEMENT_CLASSES[DISTRICT_TO_PLACEMENT_CLASS[district]]

    if rules is None:
        return True

    if tile.mountain:
        return False

    if rules.requires_city and not tile.withinCityLimits:
        return False

    if tile.terrain in rules.invalid_terrain:
        return False

    if rules.required_terrain is not None and tile.terrain not in rules.required_terrain:
        return False

    if tile.feature != Feature.NONE and tile.feature in rules.invalid_features:
        return False

    if rules.required_features is not None and tile.feature not in rules.required_features:
        return False

    if tile.resourceType in rules.invalid_resource_types:
        return False

    if rules.requires_flat_land and tile.hill:
        return False

    neighbors = tile.get_neighbors(grid)

    if rules.requires_adjacent_land:
        if not any(n.terrain not in (Terrain.OCEAN, Terrain.COAST) for n in neighbors):
            return False

    if rules.requires_city_center:
        if not any(n.district == District.CITY_CENTER for n in neighbors):
            return False

    if rules.requires_not_city_center:
        if any(n.district == District.CITY_CENTER for n in neighbors):
            return False

    if rules.requires_freshwater_source:
        if not (
            any(n.mountain or n.feature == Feature.OASIS or n.terrain == Terrain.LAKE for n in neighbors)
            or has_valid_river_edge(tile, neighbors)
        ):
            return False

    if rules.requires_two_river_edges:
        if tile.rivers.count(True) < 2:
            return False

    if rules.requires_connect_water_or_city:
        if not check_canal(neighbors):
            return False

    return True


def has_valid_river_edge(tile: Tile, neighbors: list[Tile]) -> bool:
    city_edge = None

    for neighbor in neighbors:
        if neighbor.district == District.CITY_CENTER:
            city_edge = tile.get_edge_index(neighbor)
            break

    return any(is_river and i != city_edge for i, is_river in enumerate(tile.rivers))


def check_canal(neighbors: list[Tile]) -> bool:
    valid = [
        i
        for i, t in enumerate(neighbors)
        if t.terrain in (Terrain.COAST, Terrain.LAKE) or t.district == District.CITY_CENTER
    ]

    s = set(valid)
    for i in valid:
        if any((i + d) % 6 in s for d in (2, 3, 4)):
            return True

    return False
