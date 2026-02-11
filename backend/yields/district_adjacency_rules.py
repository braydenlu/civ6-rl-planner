import collections.abc
from dataclasses import dataclass
from enum import IntEnum, auto

from backend.models.int_enums import (
    AdjacencyClass,
    District,
    Feature,
    Improvement,
    NaturalWonder,
    ResourceType,
    Terrain,
)
from backend.yields.yield_models import AdjacencySource

MAJOR: float = 2.0
STANDARD: float = 1.0
MINOR: float = 0.5


class YieldType(IntEnum):
    NONE = auto()
    SCIENCE = auto()
    CULTURE = auto()
    GOLD = auto()
    FAITH = auto()
    PRODUCTION = auto()
    FOOD = auto()
    HOUSING = auto()
    AMENITIES = auto()


@dataclass(frozen=True)
class DistrictAdjacencyRules:
    yield_type: YieldType
    sources: collections.abc.Sequence[AdjacencySource]


NOT_NONE: frozenset[District] = frozenset(d for d in District if d != District.NONE)

CAMPUS_RULES = DistrictAdjacencyRules(
    yield_type=YieldType.SCIENCE,
    sources=[
        AdjacencySource(
            kind=AdjacencyClass.FEATURE,
            values=frozenset({Feature.MOUNTAIN, Feature.VOLCANO}),
            amount=STANDARD,
        ),
        AdjacencySource(
            kind=AdjacencyClass.FEATURE,
            values=frozenset({Feature.REEF, Feature.GEOTHERMAL_FISSURE}),
            amount=MAJOR,
        ),
        AdjacencySource(
            kind=AdjacencyClass.FEATURE,
            values=frozenset({Feature.JUNGLE}),
            amount=MINOR,
        ),
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.GOVERNMENT_PLAZA}),
            amount=STANDARD,
        ),
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=NOT_NONE,
            amount=MINOR,
        ),
        AdjacencySource(
            kind=AdjacencyClass.NATURAL_WONDER,
            values=frozenset(
                {
                    NaturalWonder.GREAT_BARRIER_REEF,
                    NaturalWonder.PAMUKKALE,
                }
            ),
            amount=MAJOR,
        ),
    ],
)

HOLY_SITE_RULES = DistrictAdjacencyRules(
    yield_type=YieldType.FAITH,
    sources=[
        # +1 per mountain
        AdjacencySource(
            kind=AdjacencyClass.FEATURE,
            values=frozenset({Feature.MOUNTAIN}),
            amount=STANDARD,
        ),
        # also need to count volcanoes
        AdjacencySource(
            kind=AdjacencyClass.FEATURE,
            values=frozenset({Feature.VOLCANO}),
            amount=STANDARD,
        ),
        # +0.5 per Woods
        AdjacencySource(
            kind=AdjacencyClass.FEATURE,
            values=frozenset({Feature.WOODS}),
            amount=MINOR,
        ),
        # +1 from Government Plaza
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.GOVERNMENT_PLAZA}),
            amount=STANDARD,
        ),
        # +2 from natural wonders except pamukkale
        AdjacencySource(
            kind=AdjacencyClass.NATURAL_WONDER,
            values=frozenset({n for n in NaturalWonder if n not in (NaturalWonder.NONE, NaturalWonder.PAMUKKALE)}),
            amount=MAJOR,
        ),
        # +1 from pamukkale
        AdjacencySource(
            kind=AdjacencyClass.NATURAL_WONDER,
            values=frozenset({NaturalWonder.PAMUKKALE}),
            amount=STANDARD,
        ),
        # +0.5 from any other district
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=NOT_NONE,
            amount=MINOR,
        ),
    ],
)

THEATER_SQUARE_RULES = DistrictAdjacencyRules(
    yield_type=YieldType.CULTURE,
    sources=[
        # +2 from Entertainment Complex or Water Park
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.ENTERTAINMENT_COMPLEX, District.WATER_PARK}),
            amount=MAJOR,
        ),
        # +1 from Government Plaza
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.GOVERNMENT_PLAZA}),
            amount=STANDARD,
        ),
        # +2 from pamukkale
        AdjacencySource(
            kind=AdjacencyClass.NATURAL_WONDER,
            values=frozenset({NaturalWonder.PAMUKKALE}),
            amount=MAJOR,
        ),
        # +0.5 from any other district
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=NOT_NONE,
            amount=MINOR,
        ),
    ],
)
COMMERCIAL_HUB_RULES = DistrictAdjacencyRules(
    yield_type=YieldType.GOLD,
    sources=[
        # +2 from Harbor
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.HARBOR}),
            amount=MAJOR,
        ),
        # +1 from Government Plaza
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.GOVERNMENT_PLAZA}),
            amount=STANDARD,
        ),
        # +2 from river
        AdjacencySource(
            kind=AdjacencyClass.FEATURE,
            values=frozenset({Feature.RIVER}),
            amount=MAJOR,
        ),
        # +2 from pamukkale
        AdjacencySource(
            kind=AdjacencyClass.NATURAL_WONDER,
            values=frozenset({NaturalWonder.PAMUKKALE}),
            amount=MAJOR,
        ),
        # +0.5 from any other district
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=NOT_NONE,
            amount=MINOR,
        ),
    ],
)
HARBOR_RULES = DistrictAdjacencyRules(
    yield_type=YieldType.GOLD,
    sources=[
        # +2 from City Center
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.CITY_CENTER}),
            amount=MAJOR,
        ),
        # +1 from Government Plaza
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.GOVERNMENT_PLAZA}),
            amount=STANDARD,
        ),
        # +1 from coastal resource
        AdjacencySource(
            kind=AdjacencyClass.TERRAIN,
            values=frozenset({Terrain.COAST, Terrain.OCEAN, Terrain.LAKE}),
            requires_resource=True,
            amount=STANDARD,
        ),
        # +0.5 from any other district
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=NOT_NONE,
            amount=MINOR,
        ),
    ],
)
INDUSTRIAL_ZONE_RULES = DistrictAdjacencyRules(
    yield_type=YieldType.PRODUCTION,
    sources=[
        # +2 from Aqueduct, Dam, Canal
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.AQUEDUCT, District.DAM, District.CANAL}),
            amount=MAJOR,
        ),
        # +1 from Quarry
        AdjacencySource(
            kind=AdjacencyClass.IMPROVEMENT,
            values=frozenset({Improvement.QUARRY}),
            amount=STANDARD,
        ),
        # +1 from Strategic Resources
        AdjacencySource(
            kind=AdjacencyClass.RESOURCE_TYPE,
            values=frozenset({ResourceType.STRATEGIC}),
            amount=STANDARD,
        ),
        # +0.5 from Mine or Lumber Mill
        AdjacencySource(
            kind=AdjacencyClass.IMPROVEMENT,
            values=frozenset({Improvement.MINE, Improvement.LUMBER_MILL}),
            amount=MINOR,
        ),
        # +1 from Government Plaza
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=frozenset({District.GOVERNMENT_PLAZA}),
            amount=STANDARD,
        ),
        # +0.5 from any other district
        AdjacencySource(
            kind=AdjacencyClass.DISTRICT,
            values=NOT_NONE,
            amount=MINOR,
        ),
    ],
)

DISTRICT_ADJACENCY_RULES: dict[District, DistrictAdjacencyRules] = {
    District.CAMPUS: CAMPUS_RULES,
    District.HOLY_SITE: HOLY_SITE_RULES,
    District.THEATER_SQUARE: THEATER_SQUARE_RULES,
    District.COMMERCIAL_HUB: COMMERCIAL_HUB_RULES,
    District.HARBOR: HARBOR_RULES,
    District.INDUSTRIAL_ZONE: INDUSTRIAL_ZONE_RULES,
}
