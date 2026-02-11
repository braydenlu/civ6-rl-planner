import inspect
from enum import Enum
from typing import Type

from backend.models import string_enums


def generate_int_enum(enum_cls: Type[Enum]) -> str:
    name = enum_cls.__name__
    members = list(enum_cls.__members__.values())

    lines = [f"class {name}(IntEnum):"]
    for i, m in enumerate(members):
        lines.append(f"    {m.name} = {i}")
    lines.append("")

    return "\n".join(lines)


def main() -> None:
    output: list[str] = ["# AUTO-GENERATED", "# Generated from Enum definitions", ""]

    for _, obj in inspect.getmembers(string_enums):
        if inspect.isclass(obj) and issubclass(obj, Enum) and obj is not Enum:
            output.append(generate_int_enum(obj))

    with open("int_enums.py", "w", encoding="utf-8") as f:
        f.write("\n".join(output))

    print("int_enums.py generated successfully.")


if __name__ == "__main__":
    main()
