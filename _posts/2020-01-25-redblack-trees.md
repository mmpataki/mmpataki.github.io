---
tags: red-black-tree rb-trees data-structures
---
This post is not an another article which describes RB Trees. This one tries to explain the need for node coloring constraints described in the RB Tree design.  
  

### What are RB-Trees

- These are balanced binary trees with each node having one extra property. `color`  
- The node colors can be  
	* Red  
	* Black  
  

### Constraints while coloring the tree

1. Root is `black`
2. Red node can have only black children  
3. For each path to every leaf in the tree, there are same number of black nodes.  
  

### Need for these constraints.

The need for the RB Trees and these constraints is to keep a binary tree as balanced as possible. In this section we will prove these constraints help us in doing so.  
  
Let's start with an assumption that, there exists a completely balanced binary tree with height `h` and we color every node in this tree with a single color `black`.  

[![Balanced binary tree with all nodes colored black](https://1.bp.blogspot.com/-NSF7S_kRXJ4/XixMJv7akoI/AAAAAAAAGr0/stBlukmWF6oU2oxlBbGX5Fsn2n9IjsKaACLcBGAsYHQ/s320/completely_balanced_black_tree.png)](https://1.bp.blogspot.com/-NSF7S_kRXJ4/XixMJv7akoI/AAAAAAAAGr0/stBlukmWF6oU2oxlBbGX5Fsn2n9IjsKaACLcBGAsYHQ/s1600/completely_balanced_black_tree.png)



When a new node is inserted in to this binary tree, it creates an imbalance. Because path to one of the leaf is longer than the paths to other leaves.  

[![Imbalance created after one node insertion](https://1.bp.blogspot.com/-_QbWRXpQhMY/XixMmjcKylI/AAAAAAAAGr8/wQCBetmBszsVd2HQoWrywBh4xY4rnhrYwCLcBGAsYHQ/s320/completely_black_tree_one_node_insert.png)](https://1.bp.blogspot.com/-_QbWRXpQhMY/XixMmjcKylI/AAAAAAAAGr8/wQCBetmBszsVd2HQoWrywBh4xY4rnhrYwCLcBGAsYHQ/s1600/completely_black_tree_one_node_insert.png)

  
Constraint 3 tries to keep this imbalance in control. It enforces us to color one of the node as red in the new path (the one which is longer than others).  

[![Leaf is colored red. Constraint 3 holds.](https://1.bp.blogspot.com/-jQF0kQDucIA/XixND2CfEQI/AAAAAAAAGsE/u4Ht44PZz98UYRalckyNbqV3jtrwHZzrACLcBGAsYHQ/s320/constraint_3_applied_leaf_colored_as_red.png)](https://1.bp.blogspot.com/-jQF0kQDucIA/XixND2CfEQI/AAAAAAAAGsE/u4Ht44PZz98UYRalckyNbqV3jtrwHZzrACLcBGAsYHQ/s1600/constraint_3_applied_leaf_colored_as_red.png)

  
But we can still create imbalance by coloring every new node inserted in this new path as `red`. This way the new path can grow without a limit.  

[![Constraint 3 holds, but still we can cause imbalance](https://1.bp.blogspot.com/-AffsxwTNZR8/XixNbDztIBI/AAAAAAAAGsM/nFQi-J1UCNgfabxmJNxlrJixR2XMpnSgQCLcBGAsYHQ/s320/flaw_in_constraint_3.png)](https://1.bp.blogspot.com/-AffsxwTNZR8/XixNbDztIBI/AAAAAAAAGsM/nFQi-J1UCNgfabxmJNxlrJixR2XMpnSgQCLcBGAsYHQ/s1600/flaw_in_constraint_3.png)

  
Constraint 2 solves this problem. Now a red node cannot have red children. So at worst case, the path can grow up to twice the number of black nodes in that path (2 \* h). (The node colors alternate from root to the leaf in the path)  

[![Tree honoring constraint 2. (We recolored the tree)](https://1.bp.blogspot.com/-jPID2ZV0IPo/XixOOuqGx7I/AAAAAAAAGsY/HWp6IgF8FQAYJdNket4nLg39qx01nSvAQCLcBGAsYHQ/s320/constraint_2_applied.png)](https://1.bp.blogspot.com/-jPID2ZV0IPo/XixOOuqGx7I/AAAAAAAAGsY/HWp6IgF8FQAYJdNket4nLg39qx01nSvAQCLcBGAsYHQ/s1600/constraint_2_applied.png)

There are two ways possible to color such path. One starts with `black` root and other with `red`.  

If the root was colored `red`, the children of root should be colored `black` (Constraint 2). In this case a RB-Tree with only two nodes violates the constraint 3. So constraint 1 says color the root with `black`.  

