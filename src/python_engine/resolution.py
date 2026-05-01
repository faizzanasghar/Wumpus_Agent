from typing import List, Set, Tuple
from .cnf import Clause, Literal, negate_literal, clause_key

class AskResult:
    def __init__(self, proved: bool, inference_steps: int, log: List[str]):
        self.proved = proved
        self.inference_steps = inference_steps
        self.log = log

def is_tautology(clause: Clause) -> bool:
    lit_set = set(clause)
    return any(negate_literal(lit) in lit_set for lit in clause)

def resolve_pair(ci: Clause, cj: Clause) -> List[Clause]:
    resolvents = []
    
    for lit in ci:
        complement = negate_literal(lit)
        if complement in cj:
            resolvent = [l for l in ci if l != lit] + [l for l in cj if l != complement]
            deduped = list(dict.fromkeys(resolvent)) # deduplicate while preserving order
            
            if not is_tautology(deduped):
                resolvents.append(deduped)
                
    return resolvents

def resolve(kb_clauses: List[Clause], goal: Literal) -> AskResult:
    neg_goal = [negate_literal(goal)]
    working = list(kb_clauses) + [neg_goal]
    
    seen_keys = {clause_key(c) for c in working}
    
    log = [
        f"Goal: prove {goal}",
        f"Negated goal added: [{', '.join(neg_goal)}]",
        f"Initial clause count: {len(working)}"
    ]
    
    inference_steps = 0
    new_clauses_found = True
    
    while new_clauses_found:
        new_clauses_found = False
        n = len(working)
        
        for i in range(n):
            for j in range(i + 1, n):
                resolvents = resolve_pair(working[i], working[j])
                
                for resolvent in resolvents:
                    inference_steps += 1
                    key = clause_key(resolvent)
                    
                    if len(resolvent) == 0:
                        log.append(f"Step {inference_steps}: Resolve [{', '.join(working[i])}] with [{', '.join(working[j])}] → ∅  ← CONTRADICTION")
                        log.append(f"✓ Proved: {goal}")
                        return AskResult(proved=True, inference_steps=inference_steps, log=log)
                        
                    if key not in seen_keys:
                        seen_keys.add(key)
                        working.append(resolvent)
                        new_clauses_found = True
                        log.append(f"Step {inference_steps}: Resolve [{', '.join(working[i])}] with [{', '.join(working[j])}] → [{', '.join(resolvent)}]")
                        
    log.append(f"✗ Could not prove: {goal} (no contradiction found)")
    return AskResult(proved=False, inference_steps=inference_steps, log=log)
