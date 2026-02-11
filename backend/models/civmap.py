from __future__ import annotations

from pydantic import BaseModel, Field

from backend.models.int_enums import (
    District,
    Feature,
    Improvement,
    Resource,
    ResourceType,
    Terrain,
)

Coordinate = tuple[int, int]
NEIGHBOR_OFFSETS = [(0, 1), (1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1)]


class Tile(BaseModel):
    q: int
    r: int
    terrain: Terrain
    hill: bool
    mountain: bool
    mountain_no: int
    feature: Feature
    district: District
    resource: Resource
    resourceType: ResourceType
    improvement: Improvement
    rivers: list[bool]
    withinCityLimits: bool
    city: City | None = None

    def get_neighbors(self, grid: dict[Coordinate, Tile]) -> list[Tile]:
        neighbors = []

        for dq, dr in NEIGHBOR_OFFSETS:
            neighbor = grid.get((self.q + dq, self.r + dr))
            if neighbor is None:
                continue
            neighbors.append(neighbor)

        return neighbors

    def get_city_neighbors(self) -> list[Tile]:
        if self.city is None:
            return []
        return [
            self.city.tiles[(self.q + dx, self.r + dy)]
            for dx, dy in NEIGHBOR_OFFSETS
            if (self.q + dx, self.r + dy) in self.city.tiles
        ]

    def get_edge_index(self, neighbor: Tile) -> int:
        dq = neighbor.q - self.q
        dr = neighbor.r - self.r

        if dq == 1 and dr == 0:
            return 0
        if dq == 0 and dr == 1:
            return 1
        if dq == -1 and dr == 1:
            return 2
        if dq == -1 and dr == 0:
            return 3
        if dq == 0 and dr == -1:
            return 4
        if dq == 1 and dr == -1:
            return 5

        return -1


class City(BaseModel):
    id: int
    center_coords: Coordinate
    tiles: dict[Coordinate, Tile] = Field(default_factory=dict)
    districts_built: list[bool] = Field(default_factory=lambda: [False] * len(District))

    def add_tiles_within_city_radius(
        self, grid: dict[Coordinate, Tile], q_city_center: int, r_city_center: int
    ) -> None:
        radius = 3
        for q in range(-radius, radius + 1):
            for r in range(-radius, radius + 1):
                if abs(q + r) <= radius:
                    tile = grid.get((q_city_center + q, r_city_center + r))
                    if tile:
                        tile.withinCityLimits = True
                        self.tiles[(q_city_center + q, r_city_center + r)] = tile
                        tile.city = self
                        if tile.district != District.NONE:
                            self.districts_built[tile.district.value] = True

    def remove_tiles(self) -> None:
        for tile in self.tiles.values():
            tile.city = None
        self.tiles = {}

    def can_build(self, district: District) -> bool:
        if district == District.WATER_PARK and self.districts_built[District.ENTERTAINMENT_COMPLEX.value] is True:
            return False
        if district == District.ENTERTAINMENT_COMPLEX and self.districts_built[District.WATER_PARK.value] is True:
            return False

        if self.districts_built[district.value]:
            return False

        return True

    def add_district(self, district: District) -> None:
        self.districts_built[district.value] = True


class CivMap(BaseModel):
    cities: list[City] = Field(default_factory=list)
    tiles: dict[Coordinate, Tile] = Field(default_factory=dict)
    radius: int = 4

    def get_keys(self) -> list[Coordinate]:
        return list(self.tiles.keys())

    def get_tile(self, coordinate: Coordinate) -> Tile:
        return self.tiles[coordinate]

    def make_city(self, coordinates: Coordinate, allow_overwrite: bool = False) -> None:
        """
        Add a city at the given coordinates. Only allows a single city.

        Args:
            coordinates: The (q, r) coordinates for the city center
            allow_overwrite: If True, replaces existing city. Used when loading maps.
        """
        if len(self.cities) > 0 and not allow_overwrite:
            raise ValueError("Only one city is allowed per map")

        # Remove existing city if overwriting
        if allow_overwrite and len(self.cities) > 0:
            self.cities[0].remove_tiles()
            self.cities.clear()

        city = City(id=0, center_coords=coordinates)
        city.add_tiles_within_city_radius(self.tiles, coordinates[0], coordinates[1])
        self.cities.append(city)

    def create_empty_map(self) -> None:
        for q in range(-self.radius, self.radius + 1):
            for r in range(-self.radius, self.radius + 1):
                if abs(q + r) <= self.radius:
                    self.tiles[(q, r)] = Tile(
                        q=q,
                        r=r,
                        terrain=Terrain.GRASSLAND,
                        hill=False,
                        mountain=False,
                        mountain_no=1,
                        feature=Feature.NONE,
                        district=District.NONE,
                        resource=Resource.NONE,
                        resourceType=ResourceType.NONE,
                        improvement=Improvement.NONE,
                        rivers=[False] * 6,
                        withinCityLimits=False,
                        city=None,
                    )
