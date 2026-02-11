from pydantic import BaseModel

from backend.logger import setup_logger
from backend.yields.district_adjacency_rules import (
    DISTRICT_ADJACENCY_RULES,
    DistrictAdjacencyRules,
    YieldType,
)
from backend.yields.yield_models import AdjacencySource

from ..models.civmap import CivMap, Tile
from ..models.int_enums import (
    AdjacencyClass,
    District,
    Feature,
    Improvement,
    Resource,
    ResourceType,
    Terrain,
)

logger = setup_logger(__name__)

YieldDict = dict[YieldType, float]


class ScoreResult(BaseModel):
    summary: dict[YieldType, float]
    tiles: dict[str, dict[YieldType, float]]


def get_score(grid: dict[tuple[int, int], Tile]) -> ScoreResult:
    total_yields: YieldDict = {y: 0.0 for y in YieldType}

    tile_results: dict[str, YieldDict] = {}

    for (q, r), tile in grid.items():
        key = f"{q},{r}"

        if tile.district == District.NONE:
            logger.debug(f"{q}, {r} has no district")
            tile_results[key] = get_tile_score(tile)
            if tile.withinCityLimits:
                tile_yields = tile_results[key]
                for yield_type, value in tile_yields.items():
                    total_yields[yield_type] += value
            continue

        rules = DISTRICT_ADJACENCY_RULES.get(tile.district)
        if rules is None:
            logger.debug(f"{tile.q}, {tile.r} has no rules")
            tile_results[key] = {}
            continue

        score = run_adjacency_logic(tile, grid, rules)
        logger.debug(f"{tile.district.name} : {score}")

        total_yields[rules.yield_type] += score
        tile_results[key] = {rules.yield_type: score}

    return ScoreResult(summary=total_yields, tiles=tile_results)


def run_adjacency_logic(center_tile: Tile, grid: dict[tuple[int, int], Tile], rules: DistrictAdjacencyRules) -> float:
    neighbors = center_tile.get_neighbors(grid)

    total_score = 0.0

    for source in rules.sources:
        count = 0

        for neighbor in neighbors:
            if neighbor and source_matches(source, neighbor):
                logger.debug(f"{center_tile.district.name} : {source.values}")
                count += 1

        source_score = count * source.amount

        if (
            source.kind == AdjacencyClass.FEATURE
            and source.values
            and Feature.RIVER in source.values
            and any(center_tile.rivers)
        ):
            source_score += source.amount

        total_score += source_score

    return total_score


def source_matches(source: AdjacencySource, neighbor: Tile) -> bool:
    if source.kind == AdjacencyClass.TERRAIN:
        if source.values and neighbor.terrain not in source.values:
            return False
        return not source.requires_resource or get_effective_resource_type(neighbor) != ResourceType.NONE

    if source.kind == AdjacencyClass.FEATURE:
        feature = get_effective_feature(neighbor)
        if source.values is None:
            return False
        if feature in source.values:
            return True
        elif neighbor.mountain is not None and Feature.MOUNTAIN in source.values:
            return True
        return False

    if source.kind == AdjacencyClass.DISTRICT:
        if source.values is None:
            return False
        return neighbor.district in source.values

    if source.kind == AdjacencyClass.RESOURCE_TYPE:
        if source.values is None:
            return False
        return get_effective_resource_type(neighbor) in source.values

    if source.kind == AdjacencyClass.IMPROVEMENT:
        if source.values is None:
            return False
        return neighbor.improvement in source.values

    return False


def get_effective_feature(tile: Tile) -> Feature:
    if tile.district != District.NONE and tile.feature != Feature.FLOODPLAINS:
        return Feature.NONE
    return tile.feature


def get_effective_resource_type(tile: Tile) -> ResourceType:
    if tile.district not in (District.NONE, District.CITY_CENTER):
        return ResourceType.NONE
    return tile.resourceType


def get_effective_resource(tile: Tile) -> Resource:
    if tile.district not in (District.NONE, District.CITY_CENTER):
        return Resource.NONE
    return tile.resource


def check_river_adjacency(tile: Tile) -> float:
    if any(tile.rivers):
        return 2.0
    return 0.0


def get_tile_score(tile: Tile) -> YieldDict:
    science, culture, faith, gold, production, food = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

    if tile.mountain:
        return {
            YieldType.SCIENCE: science,
            YieldType.CULTURE: culture,
            YieldType.FAITH: faith,
            YieldType.GOLD: gold,
            YieldType.PRODUCTION: production,
            YieldType.FOOD: food,
        }

    if tile.terrain is Terrain.GRASSLAND:
        food += 2
    elif tile.terrain is Terrain.PLAINS:
        food += 1
        production += 1
    elif tile.terrain is Terrain.TUNDRA:
        food += 1
    elif tile.terrain in (Terrain.COAST, Terrain.LAKE):
        food += 1
        gold += 1
    elif tile.terrain is Terrain.OCEAN:
        food += 1
        gold += 1
    elif tile.terrain is Terrain.DESERT and tile.feature in (
        Feature.FLOODPLAINS,
        Feature.OASIS,
    ):
        food += 3
        if tile.feature is Feature.OASIS:
            gold += 1

    if tile.feature is Feature.WOODS:
        production += 1
    elif tile.feature in (Feature.JUNGLE, Feature.MARSH):
        food += 1
    elif tile.feature is Feature.REEF:
        food += 1
        production += 1

    if tile.improvement in (Improvement.FARM, Improvement.FISHING_BOATS):
        food += 1
    elif tile.improvement in (
        Improvement.MINE,
        Improvement.QUARRY,
        Improvement.PASTURE,
        Improvement.LUMBER_MILL,
    ):
        production += 1
    elif tile.improvement is Improvement.PLANTATION:
        gold += 2
    elif tile.improvement is Improvement.CAMP:
        gold += 1

    if tile.hill:
        production += 1

    if tile.resource in (
        Resource.BANANAS,
        Resource.CATTLE,
        Resource.FISH,
        Resource.RICE,
        Resource.SHEEP,
        Resource.WHEAT,
    ):
        food += 1
    elif tile.resource in (Resource.DEER, Resource.STONE):
        production += 1
    elif tile.resource in (Resource.COPPER, Resource.CRABS, Resource.MAIZE):
        gold += 2
    elif tile.resource in (
        Resource.AMBER,
        Resource.COFFEE,
        Resource.JADE,
        Resource.MARBLE,
        Resource.SILK,
    ):
        culture += 1
    elif tile.resource in (Resource.INCENSE, Resource.PEARLS, Resource.TOBACCO):
        faith += 1
    elif tile.resource in (Resource.FURS, Resource.SALT, Resource.WINE):
        food += 1
        gold += 1
    elif tile.resource in (Resource.IVORY, Resource.OLIVES, Resource.WHALES):
        production += 1
        gold += 1
    elif tile.resource in (Resource.MERCURY, Resource.TURTLES, Resource.TEA):
        science += 1
    elif tile.resource in (
        Resource.CITRUS,
        Resource.HONEY,
        Resource.SPICES,
        Resource.SUGAR,
    ):
        food += 2
    elif tile.resource in (
        Resource.COCOA,
        Resource.COTTON,
        Resource.DIAMONDS,
        Resource.SILVER,
        Resource.TRUFFLES,
    ):
        gold += 3
    elif tile.resource in (Resource.HORSES, Resource.NITER):
        production += 1
        food += 1
    elif tile.resource in (Resource.IRON, Resource.ALUMINUM):
        science += 1
    elif tile.resource in (Resource.COAL, Resource.URANIUM):
        production += 2
    elif tile.resource is Resource.OIL:
        production += 3

    return {
        YieldType.SCIENCE: science,
        YieldType.CULTURE: culture,
        YieldType.FAITH: faith,
        YieldType.GOLD: gold,
        YieldType.PRODUCTION: production,
        YieldType.FOOD: food,
    }


def get_base_city_housing(tile: Tile, map: CivMap) -> int:
    if any(tile.rivers):
        return 5
    elif any(
        neighbor.terrain == Terrain.LAKE or neighbor.feature == Feature.OASIS
        for neighbor in tile.get_neighbors(map.tiles)
    ):
        return 5
    elif any(neighbor.terrain == Terrain.COAST for neighbor in tile.get_neighbors(map.tiles)):
        return 3
    else:
        return 2
