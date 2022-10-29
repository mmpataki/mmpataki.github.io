---
tags: differential testing fuzzing  regression
category: readings
title: Differential testing
date: 2022-10-29 15:42:00 +05:30
---
Was exploring the google github repo
https://github.com/google/centipede


from here read about nezha a differential testing fuzzer and then
https://www.cs.columbia.edu/~suman/docs/nezha.pdf


about microsoft's regression testing utility and paper
https://patricegodefroid.github.io/public_psfiles/issta2020.pdf

and MS's rest API regression testing tool
https://github.com/microsoft/restler-fuzzer

### differential testing
testing two programs based on their behaviorl difference on same inputs. two programs can be same programs of different versions or different programs which are supposed to provide same functionality

#### keywords:
**seed inputs**: few inputs are used as initial inputs  
**input mutation**: seed inputs are modified in every iteration (this is domain independently)  
**δ-diversity** different kinds (output, branch) of diversities in behavior  
**domain independent** : the input  generation is domain independent  
**blackbox and graybox guidance**: blackbox- based on output, graybox- based on the code coverage paths (CFG - Control flow graph)  
**instrumentation**: process of modifying the program to collect CFG  
