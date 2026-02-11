# AUTO-GENERATED
# Generated from Enum definitions
from enum import IntEnum


class AdjacencyClass(IntEnum):
    TERRAIN = 0
    FEATURE = 1
    DISTRICT = 2
    IMPROVEMENT = 3
    NATURAL_WONDER = 4
    RESOURCE = 5
    RESOURCE_TYPE = 6


class District(IntEnum):
    NONE = 0
    CITY_CENTER = 1
    CAMPUS = 2
    THEATER_SQUARE = 3
    HOLY_SITE = 4
    ENCAMPMENT = 5
    COMMERCIAL_HUB = 6
    HARBOR = 7
    INDUSTRIAL_ZONE = 8
    PRESERVE = 9
    ENTERTAINMENT_COMPLEX = 10
    WATER_PARK = 11
    AQUEDUCT = 12
    NEIGHBORHOOD = 13
    CANAL = 14
    DAM = 15
    AERODROME = 16
    SPACEPORT = 17
    GOVERNMENT_PLAZA = 18
    DIPLOMATIC_QUARTER = 19


class Feature(IntEnum):
    NONE = 0
    WOODS = 1
    JUNGLE = 2
    MARSH = 3
    FLOODPLAINS = 4
    OASIS = 5
    CLIFFS = 6
    REEF = 7
    GEOTHERMAL_FISSURE = 8
    RIVER = 9
    MOUNTAIN = 10
    VOLCANO = 11
    VOLCANIC_SOIL = 12
    ICE_CAPS = 13


class Improvement(IntEnum):
    NONE = 0
    FARM = 1
    MINE = 2
    QUARRY = 3
    PLANTATION = 4
    CAMP = 5
    PASTURE = 6
    FISHING_BOATS = 7
    LUMBER_MILL = 8


class NaturalWonder(IntEnum):
    NONE = 0
    CLIFFS_OF_DOVER = 1
    CRATER_LAKE = 2
    DEAD_SEA = 3
    GALAPAGOS = 4
    GREAT_BARRIER_REEF = 5
    MOUNT_EVEREST = 6
    MOUNT_KILIMANJARO = 7
    PANTANAL = 8
    TORRES_DEL_PAINE = 9
    TSINGY_DE_BEMARAHA = 10
    ULURU = 11
    YOSEMITE = 12
    DELICATE_ARCH = 13
    EYE_OF_THE_SAHARA = 14
    LAKE_RETBA = 15
    MATTERHORN = 16
    MOUNT_RORAIMA = 17
    UBSUNUR_HOLLOW = 18
    ZHANGYE_DANXIA = 19
    CHOCOLATE_HILLS = 20
    GOBUSTAN = 21
    IK_KIL = 22
    MATO_TIPILA = 23
    MOUNT_VESUVIUS = 24
    PAMUKKALE = 25
    SAHARA_EL_BEYDA = 26
    BERMUDA_TRIANGLE = 27
    FOUNTAIN_OF_YOUTH = 28
    PAITITI = 29
    HA_LONG_BAY = 30
    EYJAFJALLAJOKULL = 31
    GIANTS_CAUSEWAY = 32
    LYSEFJORD = 33
    PIOPIOTAHI = 34


class Resource(IntEnum):
    NONE = 0
    BANANAS = 1
    CATTLE = 2
    COPPER = 3
    CRABS = 4
    DEER = 5
    FISH = 6
    MAIZE = 7
    RICE = 8
    SHEEP = 9
    STONE = 10
    WHEAT = 11
    AMBER = 12
    CINNAMON = 13
    CITRUS = 14
    CLOVES = 15
    COCOA = 16
    COFFEE = 17
    COSMETICS = 18
    COTTON = 19
    DYES = 20
    DIAMONDS = 21
    FURS = 22
    GYPSUM = 23
    HONEY = 24
    INCENSE = 25
    IVORY = 26
    JADE = 27
    JEANS = 28
    MARBLE = 29
    MERCURY = 30
    OLIVES = 31
    PEARLS = 32
    PERFUME = 33
    SALT = 34
    SILK = 35
    SILVER = 36
    SPICES = 37
    SUGAR = 38
    TEA = 39
    TOBACCO = 40
    TOYS = 41
    TRUFFLES = 42
    TURTLES = 43
    WHALES = 44
    WINE = 45
    HORSES = 46
    IRON = 47
    NITER = 48
    COAL = 49
    OIL = 50
    ALUMINUM = 51
    URANIUM = 52
    ANTIQUITY_SITE = 53
    SHIPWRECK = 54


class ResourceType(IntEnum):
    NONE = 0
    BONUS = 1
    LUXURY = 2
    STRATEGIC = 3
    ARTIFACT = 4


class Terrain(IntEnum):
    GRASSLAND = 0
    PLAINS = 1
    DESERT = 2
    TUNDRA = 3
    SNOW = 4
    COAST = 5
    OCEAN = 6
    LAKE = 7


class Yield(IntEnum):
    SCIENCE = 0
    CULTURE = 1
    GOLD = 2
    FAITH = 3
    PRODUCTION = 4
    FOOD = 5
