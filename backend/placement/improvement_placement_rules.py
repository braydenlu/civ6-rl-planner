from dataclasses import dataclass

from ..models.int_enums import Feature, Improvement, Resource, Terrain


@dataclass(frozen=True)
class ImprovementPlacementRules:
    invalid_terrain: frozenset[Terrain] | None = None
    required_terrain: frozenset[Terrain] | None = None
    invalid_features: frozenset[Feature] | None = None
    required_features: frozenset[Feature] | None = None
    valid_resources: frozenset[Resource] | None = None
    required_resources: frozenset[Resource] | None = None


IMPROVEMENT_PLACEMENT_RULES: dict[Improvement, ImprovementPlacementRules] = {
    Improvement.FARM: ImprovementPlacementRules(
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        invalid_features=frozenset({Feature.GEOTHERMAL_FISSURE, Feature.VOLCANO}),
        valid_resources=frozenset({Resource.WHEAT, Resource.RICE, Resource.MAIZE}),
    ),
    Improvement.MINE: ImprovementPlacementRules(
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        invalid_features=frozenset({Feature.GEOTHERMAL_FISSURE, Feature.VOLCANO, Feature.FLOODPLAINS}),
        valid_resources=frozenset(
            {
                Resource.IRON,
                Resource.NITER,
                Resource.COAL,
                Resource.ALUMINUM,
                Resource.URANIUM,
                Resource.DIAMONDS,
                Resource.JADE,
                Resource.MERCURY,
                Resource.SALT,
                Resource.SILVER,
                Resource.AMBER,
                Resource.COPPER,
            }
        ),
    ),
    Improvement.QUARRY: ImprovementPlacementRules(
        invalid_terrain=frozenset([Terrain.COAST, Terrain.OCEAN, Terrain.LAKE]),
        required_resources=frozenset([Resource.STONE, Resource.MARBLE, Resource.GYPSUM]),
    ),
    Improvement.PLANTATION: ImprovementPlacementRules(
        invalid_terrain=frozenset([Terrain.COAST, Terrain.OCEAN, Terrain.LAKE]),
        required_resources=frozenset(
            [
                Resource.BANANAS,
                Resource.CITRUS,
                Resource.COCOA,
                Resource.COFFEE,
                Resource.COTTON,
                Resource.DYES,
                Resource.INCENSE,
                Resource.OLIVES,
                Resource.SILK,
                Resource.SPICES,
                Resource.SUGAR,
                Resource.TEA,
                Resource.TOBACCO,
                Resource.WINE,
            ]
        ),
    ),
    Improvement.CAMP: ImprovementPlacementRules(
        invalid_terrain=frozenset([Terrain.COAST, Terrain.OCEAN, Terrain.LAKE]),
        required_resources=frozenset(
            [
                Resource.DEER,
                Resource.FURS,
                Resource.IVORY,
                Resource.TRUFFLES,
                Resource.HONEY,
            ]
        ),
    ),
    Improvement.PASTURE: ImprovementPlacementRules(
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        required_resources=frozenset(
            {
                Resource.SHEEP,
                Resource.CATTLE,
                Resource.HORSES,
            }
        ),
    ),
    Improvement.FISHING_BOATS: ImprovementPlacementRules(
        required_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        required_resources=frozenset(
            {
                Resource.FISH,
                Resource.CRABS,
                Resource.WHALES,
                Resource.PEARLS,
                Resource.AMBER,
                Resource.TURTLES,
            }
        ),
    ),
    Improvement.LUMBER_MILL: ImprovementPlacementRules(
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        required_features=frozenset({Feature.WOODS, Feature.JUNGLE}),
    ),
}
