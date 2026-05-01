# Wumpus Logic Agent: Comprehensive Technical Report

**Author:** Wumpus Agent Developer  
**GitHub:** [Your GitHub Link]  
**Vercel/Live URL:** [Your Vercel Link]  
**LinkedIn:** [Your LinkedIn Link]  

---

## 1. Introduction

This report details the underlying Knowledge-Based Agent (KBA) architecture developed for the Wumpus World simulation. Unlike heuristic-based agents that rely on simple if-then rules, this agent uses a **Propositional Logic Engine**. It mathematically proves the safety of adjacent cells before making any move by utilizing **Conjunctive Normal Form (CNF)** conversions and **Resolution Refutation**. 

The entire logic engine operates strictly on formal propositional logic to deduce whether cells contain a Pit, a Wumpus, or are completely safe.

---

## 2. Conjunctive Normal Form (CNF) Logic

When the agent explores a new cell, it receives a percept (e.g., Breeze, Stench, Safe). The agent translates this environmental knowledge into propositional logic statements and tells its Knowledge Base (KB). 

To perform logical inference, all rules must be expressed in **Conjunctive Normal Form (CNF)**—a conjunction (AND) of clauses, where each clause is a disjunction (OR) of literals.

### Percept Encoding Example: Breeze

If the agent perceives a Breeze (`B`) at coordinate `[2,1]`, the rules of the Wumpus World state that there must be a Pit (`P`) in at least one of the adjacent cells: `[1,1]`, `[2,2]`, or `[3,1]`.

The biconditional relationship is:  
`B_2_1 ⇔ (P_1_1 ∨ P_2_2 ∨ P_3_1)`

The logic engine splits this into two directional implications for CNF:

**1. Forward Implication:** If there is a breeze, there is a pit adjacent.  
`B_2_1 ⇒ (P_1_1 ∨ P_2_2 ∨ P_3_1)`  
**CNF Clause:** `(¬B_2_1 ∨ P_1_1 ∨ P_2_2 ∨ P_3_1)`

**2. Backward Implication:** If there is a pit adjacent, there is a breeze.  
`(P_1_1 ∨ P_2_2 ∨ P_3_1) ⇒ B_2_1`  
Which is broken down into individual clauses for each adjacent pit candidate:
- `(¬P_1_1 ∨ B_2_1)`
- `(¬P_2_2 ∨ B_2_1)`
- `(¬P_3_1 ∨ B_2_1)`

Along with the forward and backward clauses, the agent asserts the unit clause `B_2_1` (indicating the breeze is actually present), adding it to the KB.

### Negative Percepts

If the agent does *not* perceive a breeze at `[2,1]`, it asserts the negative unit clause `¬B_2_1`. In our CNF generator, this directly translates into an assertion that *none* of the adjacent cells can have a pit:
- `¬P_1_1`
- `¬P_2_2`
- `¬P_3_1`

This immediate elimination of candidates drastically reduces the search space for the resolution engine. The exact same logic is applied for the **Stench (`S`)** and **Wumpus (`W`)** percepts.

---

## 3. Resolution Refutation Loop

Once the KB is populated with CNF clauses, the agent uses an algorithm called **Resolution Refutation** to determine if a specific unvisited cell (e.g., `[2,2]`) is safe. A cell is considered safe if the agent can prove there is no pit (`¬P_2_2`) and no wumpus (`¬W_2_2`).

The inference loop operates as follows:

1. **Proof by Contradiction (Refutation):** 
   To prove a goal (e.g., `¬P_2_2`), the engine temporarily adds the **negation of the goal** to the Knowledge Base. In this case, it adds the literal `P_2_2` as a new unit clause.

2. **Resolving Clause Pairs:** 
   The loop systematically pairs up clauses from the KB. It looks for pairs where one clause contains a literal (e.g., `P_2_2`) and the other clause contains its exact complement (`¬P_2_2`).

3. **Generating Resolvents:** 
   When a complementary pair is found, the two clauses are merged, and the complementary literals are cancelled out. 
   *Example:* Resolving `(¬P_2_2 ∨ B_2_1)` with `P_2_2` yields the new resolvent clause `B_2_1`.

4. **Tautology Filtering:** 
   If a generated resolvent contains both a literal and its negation (e.g., `A ∨ ¬A`), it is considered a tautology. Tautologies provide no new logical constraints and are immediately discarded to keep the inference trace optimized.

5. **Contradiction Detection:** 
   The loop continues adding new resolvents back into the working set. If the engine resolves two unit clauses that are exact opposites (e.g., `P_2_2` and `¬P_2_2`), the resulting resolvent is the **empty clause (`{}`)**. 
   Generating the empty clause signals a logical **contradiction**. 

6. **Conclusion:** 
   Because assuming the negation of the goal (`P_2_2`) led to a contradiction, the original goal (`¬P_2_2`) is **PROVED TRUE**. The cell `[2,2]` is mathematically proven to not contain a pit.

If the loop generates all possible resolvents without ever producing an empty clause, the proof fails. The agent concludes that it does not have enough information to guarantee the cell is safe, and it will not risk moving there.

---

## 4. Agent Pathfinding Integration

The pure logic engine informs the movement policy of the agent. The system operates on a rigorous cycle:
1. **Perceive:** Read the current cell for Breeze/Stench.
2. **Update KB:** Convert percepts to CNF clauses and add to the set.
3. **Reason:** Iterate over all frontier (unvisited) cells. Run the Resolution Refutation algorithm to ask the KB: "Is `¬P_x_y` AND `¬W_x_y` true?"
4. **Act:** Select a confirmed safe cell and navigate to it. If the cell is distant, the agent uses Breadth-First Search (BFS) to plot a safe path exclusively through previously visited cells.

This deterministic, logic-first architecture guarantees that the Wumpus Agent will never die unless forced to guess in an unsolvable layout, representing a robust implementation of classical AI methodologies.
