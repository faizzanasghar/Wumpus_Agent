from typing import List
from .world import Position, get_adjacent_cells

Literal = str
Clause = List[Literal]

def negate_literal(lit: Literal) -> Literal:
    return lit[1:] if lit.startswith('¬') else f"¬{lit}"

def tell_breeze(pos: Position, rows: int, cols: int) -> List[Clause]:
    b_lit = f"B_{pos.row}_{pos.col}"
    adj_pits = [f"P_{p.row}_{p.col}" for p in get_adjacent_cells(pos, rows, cols)]
    
    clauses = [[b_lit]]
    
    if adj_pits:
        clauses.append([f"¬{b_lit}"] + adj_pits)
        for p in adj_pits:
            clauses.append([f"¬{p}", b_lit])
            
    return clauses

def tell_no_breeze(pos: Position, rows: int, cols: int) -> List[Clause]:
    b_lit = f"B_{pos.row}_{pos.col}"
    adj_pits = [f"P_{p.row}_{p.col}" for p in get_adjacent_cells(pos, rows, cols)]
    
    clauses = [[f"¬{b_lit}"]]
    for p in adj_pits:
        clauses.append([f"¬{p}"])
        
    return clauses

def tell_stench(pos: Position, rows: int, cols: int) -> List[Clause]:
    s_lit = f"S_{pos.row}_{pos.col}"
    adj_w = [f"W_{p.row}_{p.col}" for p in get_adjacent_cells(pos, rows, cols)]
    
    clauses = [[s_lit]]
    
    if adj_w:
        clauses.append([f"¬{s_lit}"] + adj_w)
        for w in adj_w:
            clauses.append([f"¬{w}", s_lit])
            
    return clauses

def tell_no_stench(pos: Position, rows: int, cols: int) -> List[Clause]:
    s_lit = f"S_{pos.row}_{pos.col}"
    adj_w = [f"W_{p.row}_{p.col}" for p in get_adjacent_cells(pos, rows, cols)]
    
    clauses = [[f"¬{s_lit}"]]
    for w in adj_w:
        clauses.append([f"¬{w}"])
        
    return clauses

def tell_safe_visited(pos: Position) -> List[Clause]:
    return [
        [f"¬P_{pos.row}_{pos.col}"],
        [f"¬W_{pos.row}_{pos.col}"]
    ]

def clause_key(clause: Clause) -> str:
    return '|'.join(sorted(clause))
