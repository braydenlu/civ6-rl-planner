from pydantic import BaseModel

from backend.models.string_enums import (
    DistrictString,
    FeatureString,
    ImprovementString,
    ResourceString,
    ResourceTypeString,
    TerrainString,
)


class TileString(BaseModel):
    q: int
    r: int
    terrain: TerrainString
    hill: bool
    mountain: bool
    mountain_no: int
    feature: FeatureString
    district: DistrictString
    resource: ResourceString
    resourceType: ResourceTypeString
    improvement: ImprovementString
    rivers: list[bool]
    yields: dict[str, float]
    withinCityLimits: bool

    model_config = {"populate_by_name": True}
