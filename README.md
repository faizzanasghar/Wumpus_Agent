# Wumpus Logic Agent

A React-based web application that simulates a Knowledge-Based Agent navigating the classic Wumpus World environment. Unlike simple heuristic agents, this agent relies entirely on a **Propositional Logic Engine** utilizing **Resolution Refutation** to mathematically prove the safety of cells before making any move.

## 🚀 Live Demo & UI Architecture

The application is built around a sleek, modern **3-Column Dashboard** with a custom "Deep Space" color palette:

- **Left Sidebar (Controls & Metrics)**
  - Controls: Step, Auto, and Reset.
  - Live Metric Cards: Tracks Inference Steps, Cells Visited, KB Clause count, and Active Percepts.
- **Center Canvas (The Grid)**
  - A responsive, 3D-animated CSS grid representing the Wumpus World.
  - **Colors & Labels:**
    - **Agent:** Cyan (`A`)
    - **Safe/Visited:** Green Tint (Blank)
    - **Confirmed Pits/Wumpus:** Red Tint (`P` / `W`)
    - **Breeze:** Yellow-tinted
    - **Stench:** Orange-tinted
    - **Unknown:** Dark Gray (`?`)
- **Right Sidebar (Knowledge Base)**
  - A tabbed view containing Raw Clauses, CNF Form, and the step-by-step **Resolution Refutation Log**.

## 🧠 Algorithm Implementation

### 1. CNF Conversion
When the agent receives a percept, it tells the Knowledge Base (KB). For example, if the agent receives `Breeze` at `[2,1]` and the adjacent cells are `[1,1]`, `[2,2]`, and `[3,1]`, it generates the logical rule `B_2_1 ⇔ (P_1_1 ∨ P_2_2 ∨ P_3_1)`. This is split into Conjunctive Normal Form (CNF):
- **Forward:** `(¬B_2_1 ∨ P_1_1 ∨ P_2_2 ∨ P_3_1)`
- **Backward:** `(¬P_1_1 ∨ B_2_1)`, `(¬P_2_2 ∨ B_2_1)`, `(¬P_3_1 ∨ B_2_1)`

If there is *no* breeze, it simply asserts the unit clause `¬B_2_1`, which immediately eliminates the adjacent pits as candidates during resolution.

### 2. Resolution Refutation
To prove a cell (e.g., `[2,2]`) is safe from pits (`¬P_2_2`):
1. The engine negates the goal (`P_2_2`) and adds it to a temporary copy of the KB.
2. It systematically finds all clause pairs where one contains a literal and the other contains its complement (e.g., `P_2_2` and `¬P_2_2`).
3. It combines them (resolvent) and adds the new clause to the KB.
4. If the resolvent is `{}` (empty clause), a **contradiction** is found. Therefore, the original goal (`¬P_2_2`) is **PROVED TRUE**, and the cell is mathematically safe.
5. Every resolution pair processed increments the **Inference Steps** counter.

### 3. Agent Policy & Pathfinding
- **Strict Logic Policy:** The agent *never* moves based on heuristic alone. It will only move to a cell if it has been mathematically proven safe via `ASK`. If no safe unvisited cells exist anywhere on the grid, the agent logs "Stuck" and halts.
- **Global BFS Pathfinding:** The agent scans the entire global frontier. If a distant cell is proven safe, the agent uses Breadth-First Search (BFS) to route its path through already-visited safe cells to reach the new target, preventing infinite bouncing loops.

## 🏗 Key Design Decisions

- **Set-Based Clauses:** KB clauses are represented as `Set<string>` (serialized literal arrays) to avoid duplicates and ensure resolution lookups approach O(n) efficiency. Tautologies (e.g., `A ∨ ¬A`) are automatically eliminated to keep the inference trace clean.
- **Pure State Transitions:** Built using React's `useReducer`. The entire game state (grid, agent position, KB, metrics) is stored in one unified context, making every "step" an atomic, deterministic state transition.
- **CSS-Driven Animations:** Agent movement and grid interactions rely entirely on lightweight CSS transitions (`transform: translateZ`, `animation`, `box-shadow`) rather than heavy JavaScript animation libraries.

## 💻 Installation & Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd wumpus-logic-agent
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173` (or the port provided by Vite).
