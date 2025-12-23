---
tags: maths ml jacobian mental-model
category: ml
title: Jacobian
date: 2025-12-23 15:56:00 +05:30
---

I hit a wall when I was implementing SGD for a contest and found out the concept involved in the solution is named as Jacobian. I spent like an hour doing the mental modelling which I am recording here.

Consider a neural network which looks like this.

<center>
<div class="mermaid">

graph LR
subgraph Input_Layer
    a1(("a1"))
    a2(("a2"))
end

subgraph Output_Layer
    o1(("o1"))
    o2(("o2"))
    o3(("o3"))
end

a1 -- w_1_1 --> o1
a1 -- w_1_2 --> o2
a1 -- w_1_3 --> o3
a2 -- w_2_1 --> o1
a2 -- w_2_2 --> o2
a2 -- w_2_3 --> o3

</div>
</center>

Intuitively, the function of this network is basically to transform input vector $$a = (a_1, a_2)$$ to output vector $$o = (o_1, o_2, o_3)$$. Mathematically this looks like $$o = a \times W$$. Where the matrix $$W$$ can be seen as a transformation function, lets call that function $$F$$.

$$
\begin{bmatrix} o_{11} & o_{12} & o_{13} \end{bmatrix}

=
 
\begin{bmatrix} i_{11} & i_{12} \end{bmatrix} 

\times 

\begin{bmatrix} 
w_{11} & w_{12} & w_{13} \\
w_{21} & w_{22} & w_{23}
\end{bmatrix}
$$

If you look closely, $$F$$ is essentially a set of functions, which transforms a vector $$a$$ of dimension $$M$$ to a vector $$o$$ of dimension $$N$$. It can be written as

$$
o = F(a) = 
\begin{bmatrix} 
f_1(a) \\
f_2(a) \\
... \\
f_N(a)
\end{bmatrix}
$$

Where (in our case) $$f_i$$ is doing a weighted sum of all input coordinates of $$a$$ (aka linear layer).

<br>
## Differentiation of $$F$$.

The differentiation of $$F$$ w.r.t any coordinate in the $$a$$ can't be a single number, because every coordinate in $$a$$ is contributing to all output dimensions. So it has to be a matrix where every element $$D_{ij}$$ tells how much does $$a_j$$ is contributing to $$o_i$$.

$$
D = \begin{bmatrix} 
d_{11} & d_{12} \\
d_{21} & d_{22} \\
d_{31} & d_{32} \\
\end{bmatrix}
$$

