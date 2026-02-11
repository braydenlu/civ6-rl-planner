from dataclasses import dataclass
from typing import Any

import numpy as np
import numpy.typing as npt
from pydantic import BaseModel, Field


@dataclass(frozen=True)
class AdjacencySource:
    kind: int
    amount: float

    values: frozenset[Any] | None = None
    requires_resource: bool = False


class TileYieldsModel(BaseModel):
    science: float = Field(ge=0)
    culture: float = Field(ge=0)
    gold: float = Field(ge=0)
    faith: float = Field(ge=0)
    production: float = Field(ge=0)
    food: float = Field(ge=0)

    def to_internal(self) -> "TileYields":
        return TileYields(**self.model_dump())


@dataclass(frozen=True)
class TileYields:
    science: float
    culture: float
    gold: float
    faith: float
    production: float
    food: float

    def as_array(self) -> npt.NDArray[np.float32]:
        return np.array(
            (
                self.science,
                self.culture,
                self.gold,
                self.faith,
                self.production,
                self.food,
            ),
            dtype=np.float32,
        )
