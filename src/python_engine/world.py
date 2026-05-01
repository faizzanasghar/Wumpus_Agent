import random
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class WorldCell:
    has_pit: bool
    has_wumpus: bool
    has_gold: bool

@dataclass
class Position:
    row: int
    col: int

@dataclass
class Percept:
    breeze: bool
    stench: bool
    glitter: bool
    bump: bool
    scream: bool

WorldGrid = List[List[WorldCell]]

def generate_world(rows: int, cols: int, num_pits: int) -> WorldGrid:
    grid = [[WorldCell(False, False, False) for _ in range(cols)] for _ in range(rows)]
    
    candidates = []
    for r in range(rows):
        for c in range(cols):
            if r != 0 or c != 0:
                candidates.append(Position(row=r, col=c))
                
    random.shuffle(candidates)
    
    clamped_pits = min(num_pits, len(candidates) - 2)
    for i in range(clamped_pits):
        grid[candidates[i].row][candidates[i].col].has_pit = True
        
    grid[candidates[clamped_pits].row][candidates[clamped_pits].col].has_wumpus = True
    grid[candidates[clamped_pits + 1].row][candidates[clamped_pits + 1].col].has_gold = True
    
    return grid

def get_adjacent_cells(pos: Position, rows: int, cols: int) -> List[Position]:
    row, col = pos.row, pos.col
    adj = [
        Position(row - 1, col),
        Position(row + 1, col),
        Position(row, col - 1),
        Position(row, col + 1),
    ]
    return [p for p in adj if 0 <= p.row < rows and 0 <= p.col < cols]

def get_percepts(pos: Position, world: WorldGrid, rows: int, cols: int) -> Percept:
    cell = world[pos.row][pos.col]
    adj = get_adjacent_cells(pos, rows, cols)
    
    breeze = any(world[p.row][p.col].has_pit for p in adj)
    stench = any(world[p.row][p.col].has_wumpus for p in adj)
    glitter = cell.has_gold
    
    return Percept(
        breeze=breeze,
        stench=stench,
        glitter=glitter,
        bump=False,
        scream=False
    )

def pos_key(pos: Position) -> str:
    return f"{pos.row}_{pos.col}"

def key_to_pos(key: str) -> Position:
    r, c = map(int, key.split('_'))
    return Position(row=r, col=c)
