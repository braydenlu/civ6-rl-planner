# Civilization VI Strategic Planner and Reinforcement Learning Environment

This project is a technical prototype for modeling, validating, and optimizing district placement and yields in *Sid
Meier’s Civilization VI*. It consists of three components:

1. An interactive, web-based hex map editor for constructing and inspecting map states.
2. A backend service for yield computation, validation, and agent inference.
3. A Gymnasium-compatible reinforcement learning environment for training agents to optimize district placement.

<img width="1917" height="963" alt="example_image_1" src="https://github.com/user-attachments/assets/bb9ecbbe-d8aa-4ebb-bb4b-e8b12c0fd644" />

---

## High-Level Overview

The system models a Civilization VI city as a structured state defined over a hexagonal grid. Cities consist of a
dictionary of tiles indexed by axial coordinates, where each tile stores attributes such as terrain, features,
resources, river edges, and placed districts. From this state, two primary computations are performed:

* Placement legality, which determines which actions are valid under in-game rules.
* Yield computation, which determines the resulting Science, Culture, Faith, Gold, Production, and Food yields.

The frontend editor enforces a subset of placement rules to provide immediate user feedback, while the reinforcement
learning environment enforces the full rule set to ensure that agents never perform illegal actions.

---

## Map Representation

The map is represented using axial hex coordinates, with hex grid mathematics adapted from
[https://www.redblobgames.com/grids/hexagons/](https://www.redblobgames.com/grids/hexagons/). Each tile is uniquely
identified by coordinates $(q, r)$ and stores the following properties:

* Terrain type
* Feature
* Resource and resource type
* Rivers (edge-based representation)
* District or improvement placement
* Derived yields

Rendering is performed using HTML5 Canvas. The renderer uses ordered draw passes (terrain → rivers → features →
districts → improvements → overlays) so that the visual output reflects the logical structure of the underlying state.

All visual elements are derived directly from the authoritative map state to avoid duplication or desynchronization.

---

## Placement Rules and Validation

District placement is governed by a rule-based validation system that encodes in-game placement constraints. Examples
include:

* Freshwater or river adjacency requirements (e.g., Aqueducts)
* Terrain and feature exclusions (e.g., Reefs, Mountains)
* Adjacency to city centers or other districts
* Resource and improvement conflicts

Rules are expressed declaratively and evaluated against the current map state.

---

## Yield Computation

Yields are computed deterministically based on adjacency rules from the *Rise & Fall* and *Gathering Storm* expansions.
For each district, yields depend on:

* Neighboring tiles and their features
* Adjacent districts
* Rivers, resources, and terrain modifiers

Within the reinforcement learning environment, yield computation is incremental and cache-aware. When the map state
changes, only affected tiles and districts are recomputed, avoiding redundant calculations.

---

## Reinforcement Learning Environment

The reinforcement learning environment models district placement as a sequential decision process.

### State Representation

The environment state is derived directly from the map and encoded as structured observation tensors. Each tile
contributes categorical and boolean features such as terrain type, features, resources, rivers, and existing districts.

### Actions and Action Masking

Actions correspond to placing a specific district on a specific tile. Rather than allowing illegal actions and
penalizing them after the fact, the environment computes an action mask that filters out illegal placements before
action selection.

This approach has several advantages:

* Illegal moves are never sampled.
* Training steps are not wasted on invalid transitions.
* Learning is more stable and sample-efficient.

### Caching and Performance

To make reinforcement learning feasible, the environment caches:

* Tile-level placement legality
* District-specific legality
* Combined action masks
* Distance and adjacency queries
* Yield contributions

Caches are invalidated using state signatures, allowing repeated evaluations to remain fast while preserving
correctness.

---

## Backend API

The backend is implemented using FastAPI and serves two primary purposes:

* Authoritative yield computation and validation.
* Exposure of trained reinforcement learning agents for inference.

Data exchanged between the frontend and backend is validated using Pydantic models and enumerations to ensure type
safety and prevent rule drift between components.

---

## Project Structure

```
├── agents/                      # Saved RL model weights
├── backend/
│   ├── data_transfer/           # Bridge between Frontend and Backend
│   │   ├── dto_converters.py    # Logic to sync TS String Enums with Python Int Enums
│   │   └── tile_string.py       # Pydantic schemas for API validation
│   ├── models/                  # Core Data Structures
│   │   ├── civmap.py            # Authoritative Tile, City, and Map classes
│   │   ├── int_enums.py         # AUTO-GENERATED: Efficient integer mapping for RL
│   │   └── string_enums.py      # Human-readable definitions (source of truth)
│   ├── placement/               # Authoritative Validation Logic
│   │   ├── district_placement_rules.py     # Adjacency & terrain constraints
│   │   ├── district_validation.py          # Logic for "Can I place a Campus here?"
│   │   ├── improvement_placement_rules.py  # For future use
│   │   └── improvement_validation.py
│   ├── yields/                  # The Economy Engine
│   │   ├── district_adjacency_rules.py # Yield bonus conditions and definitions (Major, Minor, etc.)
│   │   ├── yield_logic.py       # Recursive yield calculation for the whole map
│   │   └── yield_models.py      # Dataclasses for yield output types
│   ├── main.py                  # FastAPI server and AI Inference endpoint
│   └── logger.py                # Server-side logging configuration
├── frontend/
│   ├── assets.ts                # Image loading and sprite sheet indexing
│   ├── consts.ts                # Grid sizing, squish factors, and UI config
│   ├── input.ts                 # Keyboard shortcuts and mouse event handlers
│   ├── inspector.ts             # Sidebar UI management and "Tile Info" logic
│   ├── main.ts                  # Application entry point & lifecycle
│   ├── placementRules.ts        # Client-side validation for "ghost" placement
│   ├── renderer.ts              # HTML5 Canvas engine for hexagonal rendering
│   ├── state.ts                 # Global reactive state (Grid, Yields, Selection)
│   └── utils.ts                 # Hex-to-Pixel math and coordinate conversion
├── maps/                        # JSON map templates used for RL training
├── static/                      # Compiled assets and raw sprites
├── civenv.py                    # Gymnasium environment wrapper
├── train.py                     # Training script
...
```

---

## Scope

This project models **district placement and yield optimization only** and does not attempt to simulate the full game.

While the system is already fairly feature-rich, it is still under active development. Planned extensions include:

* Transitioning to a Server-Side Authoritative model to ensure complete parity between the editor and the RL environment
* UI feedback for invalid placements
* Support for reinforcement learning agents placing improvements
* Incorporation of population, housing, amenities, district buildings, and feature/resource removal into the
  optimization objective
* Incorporation of technological progress to determine improvement yields
* Refinements to reward shaping and training dynamics

---

## Installation and Setup

This project uses a split architecture consisting of a **Python FastAPI backend** for reinforcement learning logic and a
**TypeScript frontend** for interactive map editing and visualization.

### Prerequisites

The following tools are required to build and run the project:

* **Node.js** (v18 or newer)
* **Python** (3.10 or newer)
* **C++ build tools**, required by `gymnasium` and `stable-baselines3` for native extensions

---

### Backend Setup (Python)

Install the backend dependencies using `pip`:

```bash
pip install fastapi uvicorn gymnasium stable-baselines3 sb3-contrib pydantic numpy
```

---

### Frontend Setup (TypeScript and Tailwind)

The frontend is implemented in TypeScript and styled using Tailwind CSS 4.0.

Install Node dependencies:

```bash
npm install
```

---

## Running the Project

The recommended workflow is to run the entire stack using the preconfigured `concurrently` script. This starts:

* The FastAPI backend
* The TypeScript compiler in watch mode
* The Tailwind CSS compiler in watch mode

```bash
npm run dev
```

---

### Running Components Individually

For debugging or development, individual components can be run separately:

* **Backend server**

  ```bash
  python -m uvicorn backend.main:app --reload
  ```

* **TypeScript compiler**

  ```bash
  tsc --watch
  ```

* **Tailwind CSS watcher**

  ```bash
  npx tailwindcss -i frontend/input.css -o ./static/dist/output.css --watch
  ```

---

## Training the Reinforcement Learning Agent

To train a district placement agent using the provided map templates:

```bash
python -m backend.train
```

Training logs and model checkpoints are written to the `/civ_ai_logs/` directory.
