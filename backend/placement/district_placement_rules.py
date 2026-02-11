from dataclasses import dataclass
from enum import IntEnum, auto

from ..models.int_enums import District, Feature, ResourceType, Terrain


@dataclass(frozen=True)
class DistrictPlacementRules:
    requires_city: bool = False
    invalid_terrain: frozenset[Terrain] = frozenset()
    required_terrain: frozenset[Terrain] | None = None
    invalid_features: frozenset[Feature] = frozenset()
    required_features: frozenset[Feature] | None = None
    invalid_resource_types: frozenset[ResourceType] = frozenset()
    requires_adjacent_land: bool = False
    requires_flat_land: bool = False
    requires_city_center: bool = False
    requires_not_city_center: bool = False
    requires_freshwater_source: bool = False
    requires_two_river_edges: bool = False
    requires_connect_water_or_city: bool = False


STANDARD_RULES: DistrictPlacementRules = DistrictPlacementRules(
    requires_city=True,
    invalid_terrain=frozenset([Terrain.COAST, Terrain.OCEAN, Terrain.LAKE]),
    invalid_features=frozenset([Feature.GEOTHERMAL_FISSURE, Feature.VOLCANO]),
    invalid_resource_types=frozenset(
        [
            ResourceType.STRATEGIC,
            ResourceType.LUXURY,
            ResourceType.ARTIFACT,
        ]
    ),
)

COAST_RULES: DistrictPlacementRules = DistrictPlacementRules(
    requires_city=True,
    invalid_terrain=frozenset(
        [
            Terrain.GRASSLAND,
            Terrain.PLAINS,
            Terrain.DESERT,
            Terrain.SNOW,
            Terrain.TUNDRA,
            Terrain.OCEAN,
        ]
    ),
    invalid_features=frozenset([Feature.REEF]),
    invalid_resource_types=frozenset(
        [
            ResourceType.STRATEGIC,
            ResourceType.LUXURY,
            ResourceType.ARTIFACT,
        ]
    ),
    requires_adjacent_land=True,
)

AERIAL_RULES: DistrictPlacementRules = DistrictPlacementRules(
    requires_city=True,
    invalid_terrain=frozenset([Terrain.COAST, Terrain.OCEAN, Terrain.LAKE]),
    invalid_features=frozenset([Feature.GEOTHERMAL_FISSURE, Feature.VOLCANO]),
    invalid_resource_types=frozenset(
        [
            ResourceType.STRATEGIC,
            ResourceType.LUXURY,
            ResourceType.ARTIFACT,
        ]
    ),
    requires_flat_land=True,
)


class PlacementClass(IntEnum):
    STANDARD = auto()
    COAST = auto()
    AERIAL = auto()
    CITY_CENTER = auto()
    PRESERVE = auto()
    AQUEDUCT = auto()
    ENCAMPMENT = auto()
    DAM = auto()
    CANAL = auto()


PLACEMENT_CLASSES: dict[PlacementClass, DistrictPlacementRules] = {
    PlacementClass.STANDARD: STANDARD_RULES,
    PlacementClass.COAST: COAST_RULES,
    PlacementClass.AERIAL: AERIAL_RULES,
    PlacementClass.CITY_CENTER: DistrictPlacementRules(
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        invalid_features=frozenset({Feature.OASIS}),
    ),
    PlacementClass.PRESERVE: DistrictPlacementRules(
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        invalid_features=frozenset({Feature.GEOTHERMAL_FISSURE, Feature.VOLCANO}),
        invalid_resource_types=frozenset(
            {
                ResourceType.STRATEGIC,
                ResourceType.LUXURY,
                ResourceType.ARTIFACT,
            }
        ),
        requires_not_city_center=True,
        requires_city=True,
    ),
    PlacementClass.AQUEDUCT: DistrictPlacementRules(
        requires_city=True,
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        invalid_features=frozenset({Feature.GEOTHERMAL_FISSURE, Feature.VOLCANO}),
        invalid_resource_types=frozenset(
            {
                ResourceType.STRATEGIC,
                ResourceType.LUXURY,
                ResourceType.ARTIFACT,
            }
        ),
        requires_city_center=True,
        requires_freshwater_source=True,
    ),
    PlacementClass.ENCAMPMENT: DistrictPlacementRules(
        requires_city=True,
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        invalid_features=frozenset({Feature.GEOTHERMAL_FISSURE, Feature.VOLCANO}),
        invalid_resource_types=frozenset(
            {
                ResourceType.STRATEGIC,
                ResourceType.LUXURY,
                ResourceType.ARTIFACT,
            }
        ),
        requires_not_city_center=True,
    ),
    PlacementClass.DAM: DistrictPlacementRules(
        requires_city=True,
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        required_features=frozenset({Feature.FLOODPLAINS}),
        invalid_resource_types=frozenset(
            {
                ResourceType.STRATEGIC,
                ResourceType.LUXURY,
                ResourceType.ARTIFACT,
            }
        ),
        requires_two_river_edges=True,
    ),
    PlacementClass.CANAL: DistrictPlacementRules(
        requires_city=True,
        invalid_terrain=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
        invalid_features=frozenset({Feature.GEOTHERMAL_FISSURE, Feature.VOLCANO}),
        requires_flat_land=True,
        requires_connect_water_or_city=True,
    ),
}

DISTRICT_TO_PLACEMENT_CLASS: dict[District, PlacementClass] = {
    District.CAMPUS: PlacementClass.STANDARD,
    District.DIPLOMATIC_QUARTER: PlacementClass.STANDARD,
    District.COMMERCIAL_HUB: PlacementClass.STANDARD,
    District.ENTERTAINMENT_COMPLEX: PlacementClass.STANDARD,
    District.GOVERNMENT_PLAZA: PlacementClass.STANDARD,
    District.HOLY_SITE: PlacementClass.STANDARD,
    District.INDUSTRIAL_ZONE: PlacementClass.STANDARD,
    District.NEIGHBORHOOD: PlacementClass.STANDARD,
    District.THEATER_SQUARE: PlacementClass.STANDARD,
    District.HARBOR: PlacementClass.COAST,
    District.WATER_PARK: PlacementClass.COAST,
    District.AERODROME: PlacementClass.AERIAL,
    District.SPACEPORT: PlacementClass.AERIAL,
    District.CITY_CENTER: PlacementClass.CITY_CENTER,
    District.PRESERVE: PlacementClass.PRESERVE,
    District.AQUEDUCT: PlacementClass.AQUEDUCT,
    District.ENCAMPMENT: PlacementClass.ENCAMPMENT,
    District.DAM: PlacementClass.DAM,
    District.CANAL: PlacementClass.CANAL,
}
