from typing import List, Dict, Any
from .cnf import Clause, Literal, clause_key
from .resolution import AskResult, resolve

class KnowledgeBase:
    def __init__(self, clauses: List[Clause] = None, tell_log: List[str] = None):
        self.clauses = clauses if clauses is not None else []
        self.tell_log = tell_log if tell_log is not None else []

def create_kb() -> KnowledgeBase:
    return KnowledgeBase()

def tell_kb(kb: KnowledgeBase, new_clauses: List[Clause], log_msg: str) -> KnowledgeBase:
    existing_keys = {clause_key(c) for c in kb.clauses}
    unique = [c for c in new_clauses if clause_key(c) not in existing_keys]
    
    return KnowledgeBase(
        clauses=kb.clauses + unique,
        tell_log=kb.tell_log + [log_msg]
    )

def ask_kb(kb: KnowledgeBase, goal: Literal) -> AskResult:
    return resolve(kb.clauses, goal)
