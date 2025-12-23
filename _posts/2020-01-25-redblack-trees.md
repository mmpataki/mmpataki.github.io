---
tags: red-black-tree rb-trees data-structures
category: programming
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

<div class="mermaid">
graph TD;
	linkStyle default interpolate basis;
	20((20)) ==> 10((10))
	20 ==> 30((30))
	10 ==> 5((5))
	30 ==> 35((35))
	classDef red fill:#f00, color: white; 
	classDef black fill:#000, color: white;
	class 20,10,30,5,35 black;
</div>

__Balanced binary tree with all nodes colored black__
<br/><br/>

When a new node is inserted in to this binary tree, it creates an imbalance. Because path to one of the leaf is longer than the paths to other leaves.  


<div class="mermaid">
graph TD;
	linkStyle default interpolate basis;
	20((20)) ==> 10((10))
	20 ==> 30((30))
	10 ==> 5((5))
	30 ==> 35((35))
	35 ==> 40((40))
	classDef red fill:#f00, color: white; 
	classDef black fill:#000, color: white;
	class 20,10,30,5,35,40 black;
</div>

__Imbalance created after one node insertion__
<br/><br/>
  
Constraint 3 tries to keep this imbalance in control. It enforces us to color one of the node as red in the new path (the one which is longer than others).  

<div class="mermaid">
graph TD;
	linkStyle default interpolate basis;
	20((20)) ==> 10((10))
	20 ==> 30((30))
	10 ==> 5((5))
	30 ==> 35((35))
	35 ==> 40((40))
	classDef red fill:#f00, color: white; 
	classDef black fill:#000, color: white;
	class 20,10,30,5,35 black;
	class 40 red;
</div>

__Leaf is colored red. Constraint 3 holds.__
<br/><br/>

  
But we can still create imbalance by coloring every new node inserted in this new path as `red`. This way the new path can grow without a limit.  

<div class="mermaid">
graph TD;
	linkStyle default interpolate basis;
	20((20)) ==> 10((10))
	20 ==> 30((30))
	10 ==> 5((5))
	30 ==> 35((35))
	35 ==> 40((40))
	40 -.-> 45((45))
	classDef red fill:#f00, color: white; 
	classDef black fill:#000, color: white;
	class 20,10,30,5,35 black;
	class 40,45 red;
</div>

__Constraint 3 holds, but still we can cause imbalance__
<br/><br/>
  
Constraint 2 solves this problem. Now a red node cannot have red children. So at worst case, the path can grow up to twice the number of black nodes in that path (2 \* h). (The node colors alternate from root to the leaf in the path)  

<div class="mermaid">
graph TD;
	linkStyle default interpolate basis;
	20((20)) ==> 10((10))
	20 ==> 30((30))
	10 ==> 5((5))
	30 ==> 35((35))
	35 ==> 40((40))
	40 -.-> 45((45))
	classDef red fill:#f00, color: white; 
	classDef black fill:#000, color: white;
	class 20,10,5,35,45 black;
	class 30,40 red;
</div>

__Tree honoring constraint 2. (We recolored the tree)__
<br/><br/>

There are two ways possible to color such path. One starts with `black` root and other with `red`.  

If the root was colored `red`, the children of root should be colored `black` (Constraint 2). In this case a RB-Tree with only two nodes violates the constraint 3. So constraint 1 says color the root with `black`.  
