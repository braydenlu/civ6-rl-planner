from backend.models.civmap import Tile
from backend.models.int_enums import Feature, Improvement, Resource, Terrain
from backend.placement.improvement_placement_rules import IMPROVEMENT_PLACEMENT_RULES


def can_place_improvement(tile: Tile, improvement: Improvement) -> bool:
    rules = IMPROVEMENT_PLACEMENT_RULES.get(improvement)
    if rules is None:
        return True

    if tile.mountain:
        return False

    if rules.invalid_terrain and tile.terrain in rules.invalid_terrain:
        return False

    if rules.required_terrain and tile.terrain not in rules.required_terrain:
        return False

    if rules.invalid_features and tile.feature in rules.invalid_features:
        return False

    if rules.required_features and tile.feature not in rules.required_features:
        return False

    if tile.resource != Resource.NONE:
        if rules.valid_resources and tile.resource not in rules.valid_resources:
            return False

    if rules.required_resources and tile.resource not in rules.required_resources:
        return False

    fn = IMPROVEMENT_CHECKS.get(improvement)
    return fn(tile) if fn else True


def can_place_mine(tile: Tile) -> bool:
    if tile.hill:
        return True
    if tile.feature == Feature.VOLCANIC_SOIL:
        return True
    if tile.resource == Resource.NONE:
        return False
    return True


def can_place_farm(tile: Tile) -> bool:
    if tile.terrain == Terrain.DESERT and tile.feature != Feature.FLOODPLAINS:
        return False
    return True


IMPROVEMENT_CHECKS = {
    Improvement.MINE: can_place_mine,
    Improvement.FARM: can_place_farm,
}
