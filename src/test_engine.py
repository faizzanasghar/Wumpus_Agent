import sys
import os

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from python_engine import (
    generate_world, Position, tell_safe_visited, tell_no_breeze, 
    create_kb, tell_kb, ask_kb, tell_breeze
)

def test():
    # 1. Create a world 4x4
    world = generate_world(4, 4, 3)
    
    # 2. Create a KB
    kb = create_kb()
    
    # 3. Agent starts at 0, 0
    start_pos = Position(0, 0)
    clauses = tell_safe_visited(start_pos)
    kb = tell_kb(kb, clauses, "Visited (0,0), safe")
    
    # Tell no breeze at 0, 0
    clauses = tell_no_breeze(start_pos, 4, 4)
    kb = tell_kb(kb, clauses, "No breeze at (0,0)")
    
    # 4. Ask if adjacent cells are safe from pits
    # adjacent to 0,0 are 1,0 and 0,1
    
    # Prove ¬P_1_0
    res = ask_kb(kb, "¬P_1_0")
    print(f"Proved ¬P_1_0: {res.proved} in {res.inference_steps} steps")
    
    # Prove ¬P_0_1
    res = ask_kb(kb, "¬P_0_1")
    print(f"Proved ¬P_0_1: {res.proved} in {res.inference_steps} steps")
    
    # 5. Move to 0,1 and perceive a breeze
    pos_0_1 = Position(0, 1)
    kb = tell_kb(kb, tell_safe_visited(pos_0_1), "Visited (0,1), safe")
    kb = tell_kb(kb, tell_breeze(pos_0_1, 4, 4), "Breeze at (0,1)")
    
    # Ask if 0,2 has a pit. We might not be able to prove it has a pit or not.
    # We should be able to prove something? We can just see if it crashes.
    res_p_0_2 = ask_kb(kb, "P_0_2")
    res_not_p_0_2 = ask_kb(kb, "¬P_0_2")
    
    print(f"Proved P_0_2: {res_p_0_2.proved}")
    print(f"Proved ¬P_0_2: {res_not_p_0_2.proved}")
    
    print("Test finished successfully!")

if __name__ == "__main__":
    test()
